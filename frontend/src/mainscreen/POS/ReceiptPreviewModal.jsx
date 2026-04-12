import { useCallback, useEffect, useRef, useState } from "react";
import api from "../../utils/axiosInstance";
import { QRCodeSVG } from "qrcode.react";
import {
  buildReceiptHtml,
  DEFAULT_RECEIPT_TAX_LABEL,
} from "../../utils/receiptHtml";
import {
  getReceiptCapabilities,
  getReceiptPrinters,
  getStoredReceiptPrinterName,
  isElectronReceiptPrintingAvailable,
  printReceipt,
  setStoredReceiptPrinterName,
} from "../../utils/electronReceiptPrint";
import {
  fetchCompanyWithLogo,
  getCompanyLogoSrc,
  prepareCompanyWithLogo,
} from "../../utils/companyLogo";

const RECEIPT_TEXT = {
  title: "Print Preview",
  invoiceNumber: "Invoice #",
  date: "Date",
  pointOfSale: "Point of Sale",
  employee: "Employee",
  companyLogo: "Company Logo",
  taxNumber: "Tax No",
  totalDiscount: "Total discount",
  totalBeforeTax: "Total before tax",
  tax: DEFAULT_RECEIPT_TAX_LABEL,
  grandTotal: "Grand total",
  footerPoweredBy: "Powered by",
  loadingReceipt: "Loading receipt…",
  preparingLogo: "Preparing company logo for printing...",
  printerLabel: "Receipt printer",
  printerLoading: "Loading...",
  printerRefresh: "Refresh printers",
  printerDefault: "System default printer",
  printerDefaultWithName: (printer) => `System default (${printer})`,
  printerDefaultSuffix: " (Default)",
  printerSavedUnavailable: (printer) =>
    `Saved receipt printer "${printer}" is unavailable. The system default printer will be used.`,
  printerSelectedUnavailable: (printer) =>
    `Printer "${printer}" is no longer available. The system default printer will be used.`,
  printerLoadFailed:
    "Could not load the installed printers. Printing will still try the system default printer.",
  printerRefreshFailed: "Could not refresh the printer list.",
  printerDesktopOnly:
    "Direct receipt printing works in the Electron desktop app and skips the browser print preview dialog.",
  loadFailed: "Failed to load the receipt preview.",
  logoPrepareFailed: "Failed to prepare the company logo for printing.",
  submitFailed: "Failed to submit the receipt print job.",
  submitSuccess: (printer) => `Receipt submitted successfully to ${printer}.`,
  printerTarget: (printer) => `"${printer}"`,
  printerTargetDefault: "the system default printer",
  openDrawer: "Close and Open Cash Drawer",
  openDrawerFailed: "Failed to open the cash drawer.",
  print: "Print",
  printing: "Sending...",
  close: "Close",
};

const formatInvoiceDate = (dateStr) => {
  if (!dateStr) return "";

  const parsedDate = new Date(dateStr);
  const dd = String(parsedDate.getDate()).padStart(2, "0");
  const mm = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const yyyy = parsedDate.getFullYear();

  return `${dd}-${mm}-${yyyy}`;
};

const getReceiptTotals = (invoice) => {
  let totalDiscount = 0;
  let totalBeforeTax = 0;
  let totalTax = 0;
  let totalDiscountIncl = 0;

  if (invoice?.lines?.length) {
    invoice.lines.forEach((line) => {
      const qty = Math.round(Number(line.qty || 0));
      const priceIncl = Number(line.item_price || 0);
      const discountPct = Number(line.discount_percentage || 0);
      const taxPct = Number(line.tax || 0);

      if (!qty || !priceIncl) return;

      const priceExcl =
        taxPct > 0 ? priceIncl / (1 + taxPct / 100) : priceIncl;
      const lineBaseExcl = priceExcl * qty;
      const lineDiscountExcl = lineBaseExcl * discountPct;
      const lineDiscountIncl =
        lineBaseExcl * discountPct * (1 + taxPct / 100);
      const lineNetExcl = lineBaseExcl - lineDiscountExcl;
      const lineTax = lineNetExcl * (taxPct / 100);

      totalDiscount += lineDiscountExcl;
      totalDiscountIncl += lineDiscountIncl;
      totalBeforeTax += lineNetExcl;
      totalTax += lineTax;
    });
  }

  return {
    totalDiscount,
    totalDiscountIncl,
    totalBeforeTax,
    totalTax,
    grandTotal: totalBeforeTax + totalTax,
  };
};

const desktopReceiptPrintingEnabled = isElectronReceiptPrintingAvailable();

const resolveCompanyForPrint = async ({
  company,
  resolvedCompany,
  force = false,
}) => {
  let nextCompany = resolvedCompany || company || null;

  if (
    force ||
    (nextCompany?.logo_url && !nextCompany?.logo_data_url) ||
    !getCompanyLogoSrc(nextCompany)
  ) {
    nextCompany = await fetchCompanyWithLogo(api, { force: true });
  } else if (nextCompany && !nextCompany.logo_data_url) {
    nextCompany = await prepareCompanyWithLogo(nextCompany);
  }

  return nextCompany || null;
};

export default function ReceiptPreviewModal({
  open,
  invoiceNumber,
  company,
  onClose,
  allowCashDrawerWithoutPrint = false,
}) {
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState(null);
  const [resolvedCompany, setResolvedCompany] = useState(company || null);
  const [printers, setPrinters] = useState([]);
  const [printersLoading, setPrintersLoading] = useState(false);
  const [selectedPrinterName, setSelectedPrinterName] = useState("");
  const [printerWarning, setPrinterWarning] = useState("");
  const [printError, setPrintError] = useState("");
  const [printSuccess, setPrintSuccess] = useState("");
  const [isSubmittingPrint, setIsSubmittingPrint] = useState(false);
  const [isPreparingCompany, setIsPreparingCompany] = useState(false);
  const [isClosingForAction, setIsClosingForAction] = useState(false);
  const [cashDrawerSupported, setCashDrawerSupported] = useState(false);
  const actionInFlightRef = useRef(false);

  const ensureCompanyReady = useCallback(
    async ({ force = false } = {}) => {
      setIsPreparingCompany(true);

      try {
        const nextCompany = await resolveCompanyForPrint({
          company,
          resolvedCompany,
          force,
        });

        setResolvedCompany(nextCompany || null);
        return nextCompany;
      } catch (error) {
        console.error("Failed to prepare company receipt assets", error);
        setPrintError(
          error?.response?.data?.message ||
            RECEIPT_TEXT.logoPrepareFailed,
        );
        return company || null;
      } finally {
        setIsPreparingCompany(false);
      }
    },
    [company, resolvedCompany],
  );

  useEffect(() => {
    setResolvedCompany(company || null);
  }, [company]);

  useEffect(() => {
    if (!open || !invoiceNumber) return;

    const controller = new AbortController();

    const fetchInvoice = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/invoices/full/${invoiceNumber}`, {
          signal: controller.signal,
        });
        setInvoice(res.data);
      } catch (error) {
        if (error.name !== "CanceledError") {
          console.error("Failed to fetch invoice for receipt preview", error);
          setPrintError(
            error?.response?.data?.message ||
              RECEIPT_TEXT.loadFailed,
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();

    return () => controller.abort();
  }, [open, invoiceNumber]);

  useEffect(() => {
    if (!open) return;

    ensureCompanyReady();
  }, [open, ensureCompanyReady]);

  useEffect(() => {
    if (!open) {
      setPrintError("");
      setPrintSuccess("");
      setPrinterWarning("");
      setSelectedPrinterName("");
      setPrinters([]);
      setCashDrawerSupported(false);
      setIsClosingForAction(false);
      actionInFlightRef.current = false;
      return;
    }

    if (!desktopReceiptPrintingEnabled) {
      return;
    }

    let cancelled = false;

    const loadPrinters = async () => {
      try {
        setPrintersLoading(true);
        const availablePrinters = await getReceiptPrinters();
        if (cancelled) return;

        setPrinters(availablePrinters);

        const storedPrinterName = getStoredReceiptPrinterName();
        const storedPrinterExists = availablePrinters.some(
          (printer) => printer.name === storedPrinterName,
        );

        if (storedPrinterName && storedPrinterExists) {
          setSelectedPrinterName(storedPrinterName);
          setPrinterWarning("");
          return;
        }

        if (storedPrinterName && !storedPrinterExists) {
          setStoredReceiptPrinterName("");
          setPrinterWarning(RECEIPT_TEXT.printerSavedUnavailable(storedPrinterName));
        } else {
          setPrinterWarning("");
        }

        setSelectedPrinterName("");
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to load printers", error);
        setPrinters([]);
        setPrinterWarning(
          error?.message ||
            RECEIPT_TEXT.printerLoadFailed,
        );
      } finally {
        if (!cancelled) {
          setPrintersLoading(false);
        }
      }
    };

    loadPrinters();

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const loadCapabilities = async () => {
      try {
        const capabilities = await getReceiptCapabilities();
        if (cancelled) return;

        setCashDrawerSupported(Boolean(capabilities?.cashDrawer?.supported));
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load receipt capabilities", error);
          setCashDrawerSupported(false);
        }
      }
    };

    loadCapabilities();

    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open || isClosingForAction) return null;

  const qrValue =
    invoice?.header?.qr && invoice.header.qr !== "123456789"
      ? invoice.header.qr
      : "https://www.innovationelements.org";

  const totals = getReceiptTotals(invoice);
  const dateFormatted = invoice?.header?.date
    ? formatInvoiceDate(invoice.header.date)
    : "";
  const defaultPrinter = printers.find((printer) => printer.isDefault) || null;

  const closeModalAfterAction = () => {
    setIsClosingForAction(false);
    onClose?.();
  };

  const runBackgroundReceiptAction = async (action, fallbackMessage) => {
    actionInFlightRef.current = true;
    setIsClosingForAction(true);

    try {
      await action();
    } catch (error) {
      console.error("POS receipt action failed", error);
      window.alert(error?.message || fallbackMessage);
    } finally {
      actionInFlightRef.current = false;
      closeModalAfterAction();
    }
  };

  const submitPrint = async () => {
    if (!invoice || isSubmittingPrint || actionInFlightRef.current) return;

    setPrintError("");
    setPrintSuccess("");

    if (!desktopReceiptPrintingEnabled) {
      setPrintError(RECEIPT_TEXT.printerDesktopOnly);
      return;
    }

    setIsSubmittingPrint(true);

    await runBackgroundReceiptAction(async () => {
      const companyForPrint = await resolveCompanyForPrint({
        company,
        resolvedCompany,
        force: !getCompanyLogoSrc(resolvedCompany),
      });
      const html = buildReceiptHtml({
        invoice: {
          ...invoice,
          header: {
            ...invoice.header,
            date_formatted: dateFormatted,
          },
        },
        company: companyForPrint,
        totals,
        qrValue,
        paperWidthMm: 80,
        labels: {
          invoiceNumber: RECEIPT_TEXT.invoiceNumber,
          date: RECEIPT_TEXT.date,
          pointOfSale: RECEIPT_TEXT.pointOfSale,
          employee: RECEIPT_TEXT.employee,
          totalDiscount: RECEIPT_TEXT.totalDiscount,
          totalBeforeTax: RECEIPT_TEXT.totalBeforeTax,
          tax: RECEIPT_TEXT.tax,
          grandTotal: RECEIPT_TEXT.grandTotal,
        },
      });

      const result = await printReceipt({
        html,
        printerName: selectedPrinterName || undefined,
        jobTitle: `POS Receipt ${invoice.header.invoice_number}`,
        openCashDrawer: allowCashDrawerWithoutPrint && cashDrawerSupported,
      });

      if (!result?.success) {
        throw new Error(
          result?.error || RECEIPT_TEXT.submitFailed,
        );
      }

      setStoredReceiptPrinterName(selectedPrinterName);
    }, RECEIPT_TEXT.submitFailed);

    setIsSubmittingPrint(false);
  };

  const submitDrawerOnly = async () => {
    if (
      !allowCashDrawerWithoutPrint ||
      !cashDrawerSupported ||
      loading ||
      actionInFlightRef.current
    ) {
      return;
    }

    await runBackgroundReceiptAction(async () => {
      const result = await printReceipt({
        printerName: selectedPrinterName || undefined,
        jobTitle: "POS Cash Drawer Pulse",
        openCashDrawerOnly: true,
      });

      if (!result?.success) {
        throw new Error(result?.error || RECEIPT_TEXT.openDrawerFailed);
      }
    }, RECEIPT_TEXT.openDrawerFailed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="flex w-full flex-row items-center justify-between border border-b bg-base-200 px-4 py-2">
          <h2 className="text-lg font-semibold">
            {RECEIPT_TEXT.title}
          </h2>
          <button
            onClick={onClose}
            className="flex text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {invoice && (
          <div className="relative border-b px-4 py-3 text-xs" dir="ltr">
            <div
              className="flex flex-col items-center justify-center gap-1"
              dir="ltr"
            >
              {getCompanyLogoSrc(resolvedCompany) && (
                <img
                  src={getCompanyLogoSrc(resolvedCompany)}
                  alt={RECEIPT_TEXT.companyLogo}
                  className="mb-1 h-14 object-contain"
                />
              )}

              <div className="text-center text-sm font-bold">
                {resolvedCompany?.company_name || invoice.header.company_name}
              </div>

              {resolvedCompany?.tax_number && (
                <div className="text-[10px] text-gray-600">
                  {RECEIPT_TEXT.taxNumber}: {resolvedCompany.tax_number}
                </div>
              )}
            </div>

            <div className="mt-2 flex flex-col text-left leading-tight">
              <div>{RECEIPT_TEXT.invoiceNumber} : {invoice.header.invoice_number}</div>
              <div>{RECEIPT_TEXT.date} : {formatInvoiceDate(invoice.header.date)}</div>
              {invoice.header.pos_point_name && (
                <div>
                  {RECEIPT_TEXT.pointOfSale} : {invoice.header.pos_point_name}
                </div>
              )}
              {(invoice.header.employee_full_name || invoice.header.username) && (
                <div>
                  {RECEIPT_TEXT.employee} :{" "}
                  {invoice.header.employee_full_name || invoice.header.username}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="text-xs font-mono" dir="ltr">
          {loading && <div className="px-4 py-3">{RECEIPT_TEXT.loadingReceipt}</div>}

          {!loading && invoice && (
            <div>
              {invoice.lines.map((line, index) => {
                const qty = Math.round(Number(line.qty || 0));
                const price = Number(line.item_price || 0);
                const lineTotal = qty * price;

                return (
                  <div
                    key={index}
                    className="mt-4 flex justify-between px-4"
                    dir="ltr"
                  >
                    <span className="flex-1">
                      {qty} × {line.description}
                    </span>
                    <span className="tabular-nums">
                      {lineTotal.toFixed(3)}
                    </span>
                  </div>
                );
              })}

              <hr className="my-2" />

              <div className="flex justify-between px-4" dir="ltr">
                <span>{RECEIPT_TEXT.totalDiscount}</span>
                <span className="tabular-nums">
                  {totals.totalDiscountIncl.toFixed(3)}
                </span>
              </div>

              <div className="flex justify-between px-4" dir="ltr">
                <span>{RECEIPT_TEXT.totalBeforeTax}</span>
                <span className="tabular-nums">
                  {totals.totalBeforeTax.toFixed(3)}
                </span>
              </div>

              <div className="flex justify-between px-4" dir="ltr">
                <span>{RECEIPT_TEXT.tax}</span>
                <span className="tabular-nums">
                  {totals.totalTax.toFixed(3)}
                </span>
              </div>

              <hr className="my-2" />

              <div
                className="flex justify-between px-4 text-sm font-bold"
                dir="ltr"
              >
                <span>{RECEIPT_TEXT.grandTotal}</span>
                <span className="tabular-nums">
                  {totals.grandTotal.toFixed(3)}
                </span>
              </div>

              <div className="mb-2 mt-4 flex justify-center">
                <div className="rounded-md border border-gray-300 bg-white p-2">
                  <QRCodeSVG value={qrValue} size={120} level="M" />
                </div>
              </div>

              <div className="mb-1 mt-3 text-center text-xs text-gray-500">
                {RECEIPT_TEXT.footerPoweredBy}{" "}
                <a
                  href="https://www.innovationelements.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 transition-colors hover:text-indigo-700 hover:underline"
                >
                  innovationelements.org
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3 border-t bg-base-200 px-4 py-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                {RECEIPT_TEXT.printerLabel}
              </label>
              {desktopReceiptPrintingEnabled && (
                <button
                  type="button"
                  onClick={() => {
                    if (printersLoading || !open) return;
                    setPrintersLoading(true);
                    getReceiptPrinters()
                      .then((availablePrinters) => {
                        setPrinters(availablePrinters);
                        setPrinterWarning("");

                        if (
                          selectedPrinterName &&
                          !availablePrinters.some(
                            (printer) => printer.name === selectedPrinterName,
                          )
                        ) {
                          setSelectedPrinterName("");
                          setPrinterWarning(RECEIPT_TEXT.printerSelectedUnavailable(selectedPrinterName));
                        }
                      })
                      .catch((error) => {
                        console.error("Failed to refresh printers", error);
                        setPrinterWarning(
                          error?.message || RECEIPT_TEXT.printerRefreshFailed,
                        );
                      })
                      .finally(() => {
                        setPrintersLoading(false);
                      });
                  }}
                  className="text-xs font-semibold text-[#2f788a] hover:text-[#225866] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={printersLoading || isSubmittingPrint}
                >
                  {printersLoading
                    ? RECEIPT_TEXT.printerLoading
                    : RECEIPT_TEXT.printerRefresh}
                </button>
              )}
            </div>

            <select
              value={selectedPrinterName}
              onChange={(event) => {
                setSelectedPrinterName(event.target.value);
                setPrintError("");
                setPrintSuccess("");
              }}
              disabled={
                !desktopReceiptPrintingEnabled ||
                printersLoading ||
                isSubmittingPrint
              }
              className="select select-bordered w-full"
            >
              <option value="">
                {defaultPrinter
                  ? RECEIPT_TEXT.printerDefaultWithName(defaultPrinter.displayName)
                  : RECEIPT_TEXT.printerDefault}
              </option>
              {printers.map((printer) => (
                <option key={printer.name} value={printer.name}>
                  {printer.displayName}
                  {printer.isDefault ? RECEIPT_TEXT.printerDefaultSuffix : ""}
                </option>
              ))}
            </select>
          </div>

          {!desktopReceiptPrintingEnabled && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {RECEIPT_TEXT.printerDesktopOnly}
            </div>
          )}

          {printerWarning && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {printerWarning}
            </div>
          )}

          {printError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {printError}
            </div>
          )}

          {isPreparingCompany && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
              {RECEIPT_TEXT.preparingLogo}
            </div>
          )}

          {printSuccess && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              {printSuccess}
            </div>
          )}

          <div className="flex gap-2">
            {allowCashDrawerWithoutPrint && cashDrawerSupported && (
              <button
                onClick={submitDrawerOnly}
                disabled={loading || isSubmittingPrint || isPreparingCompany}
                className="btn btn-outline flex-1"
              >
                {RECEIPT_TEXT.openDrawer}
              </button>
            )}

            <button
              onClick={submitPrint}
              disabled={!invoice || loading || isSubmittingPrint || isPreparingCompany}
              className="btn btn-primary flex-1"
            >
              {isSubmittingPrint
                ? RECEIPT_TEXT.printing
                : RECEIPT_TEXT.print}
            </button>

            <button onClick={onClose} className="btn btn-outline flex-1">
              {RECEIPT_TEXT.close}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
