import { useEffect, useState } from "react";
import api from "../../utils/axiosInstance";
import { QRCodeSVG } from "qrcode.react";
import { buildReceiptHtml } from "../../utils/receiptHtml";
import {
  getReceiptPrinters,
  getStoredReceiptPrinterName,
  isElectronReceiptPrintingAvailable,
  printReceipt,
  setStoredReceiptPrinterName,
} from "../../utils/electronReceiptPrint";
import { useTranslation } from "react-i18next";

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

export default function ReceiptPreviewModal({
  open,
  invoiceNumber,
  company,
  onClose,
}) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState(null);
  const [printers, setPrinters] = useState([]);
  const [printersLoading, setPrintersLoading] = useState(false);
  const [selectedPrinterName, setSelectedPrinterName] = useState("");
  const [printerWarning, setPrinterWarning] = useState("");
  const [printError, setPrintError] = useState("");
  const [printSuccess, setPrintSuccess] = useState("");
  const [isSubmittingPrint, setIsSubmittingPrint] = useState(false);

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
              "Failed to load the receipt preview.",
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
    if (!open) {
      setPrintError("");
      setPrintSuccess("");
      setPrinterWarning("");
      setSelectedPrinterName("");
      setPrinters([]);
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
          setPrinterWarning(
            `Saved receipt printer "${storedPrinterName}" is unavailable. The system default printer will be used.`,
          );
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
            "Could not load the installed printers. Printing will still try the system default printer.",
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

  if (!open) return null;

  const qrValue =
    invoice?.header?.qr && invoice.header.qr !== "123456789"
      ? invoice.header.qr
      : "https://www.innovationelements.org";

  const totals = getReceiptTotals(invoice);
  const dateFormatted = invoice?.header?.date
    ? formatInvoiceDate(invoice.header.date)
    : "";
  const defaultPrinter = printers.find((printer) => printer.isDefault) || null;

  const submitPrint = async () => {
    if (!invoice || isSubmittingPrint) return;

    setPrintError("");
    setPrintSuccess("");

    if (!desktopReceiptPrintingEnabled) {
      setPrintError(
        "Direct receipt printing is available only in the Electron desktop app.",
      );
      return;
    }

    try {
      setIsSubmittingPrint(true);

      const html = buildReceiptHtml({
        invoice: {
          ...invoice,
          header: {
            ...invoice.header,
            date_formatted: dateFormatted,
          },
        },
        company,
        totals,
        qrValue,
        paperWidthMm: 80,
      });

      const result = await printReceipt({
        html,
        printerName: selectedPrinterName || undefined,
        jobTitle: `POS Receipt ${invoice.header.invoice_number}`,
      });

      if (!result?.success) {
        throw new Error(
          result?.error || "Failed to send the receipt to the printer.",
        );
      }

      setStoredReceiptPrinterName(selectedPrinterName);

      const printedTo = result.printerName
        ? `"${result.printerName}"`
        : "the system default printer";

      setPrintSuccess(`Receipt submitted successfully to ${printedTo}.`);
    } catch (error) {
      console.error("Failed to print POS receipt", error);
      setPrintError(
        error?.message || "Failed to submit the receipt print job.",
      );
    } finally {
      setIsSubmittingPrint(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="flex w-full flex-row items-center justify-between border border-b bg-base-200 px-4 py-2">
          <h2 className="text-lg font-semibold">
            {t("ReceiptPreviewModal.title")}
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
              {company?.logo_url && (
                <img
                  src={company.logo_url}
                  alt="Company Logo"
                  className="mb-1 h-14 object-contain"
                />
              )}

              <div className="text-center text-sm font-bold">
                {company?.company_name || invoice.header.company_name}
              </div>

              {company?.tax_number && (
                <div className="text-[10px] text-gray-600">
                  Tax No: {company.tax_number}
                </div>
              )}
            </div>

            <div className="mt-2 flex flex-col text-left leading-tight">
              <div>Invoice # : {invoice.header.invoice_number}</div>
              <div>Date : {formatInvoiceDate(invoice.header.date)}</div>
            </div>
          </div>
        )}

        <div className="text-xs font-mono" dir="ltr">
          {loading && <div className="px-4 py-3">Loading receipt…</div>}

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
                <span>Total discount</span>
                <span className="tabular-nums">
                  {totals.totalDiscountIncl.toFixed(3)}
                </span>
              </div>

              <div className="flex justify-between px-4" dir="ltr">
                <span>Total before tax</span>
                <span className="tabular-nums">
                  {totals.totalBeforeTax.toFixed(3)}
                </span>
              </div>

              <div className="flex justify-between px-4" dir="ltr">
                <span>Tax @ 16.00%</span>
                <span className="tabular-nums">
                  {totals.totalTax.toFixed(3)}
                </span>
              </div>

              <hr className="my-2" />

              <div
                className="flex justify-between px-4 text-sm font-bold"
                dir="ltr"
              >
                <span>Grand total</span>
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
                Powered by{" "}
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
                {t(
                  "ReceiptPreviewModal.printer.label",
                  "Receipt printer",
                )}
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
                          setPrinterWarning(
                            `Printer "${selectedPrinterName}" is no longer available. The system default printer will be used.`,
                          );
                        }
                      })
                      .catch((error) => {
                        console.error("Failed to refresh printers", error);
                        setPrinterWarning(
                          error?.message ||
                            "Could not refresh the printer list.",
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
                    ? t(
                        "ReceiptPreviewModal.printer.loading",
                        "Loading...",
                      )
                    : t(
                        "ReceiptPreviewModal.printer.refresh",
                        "Refresh printers",
                      )}
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
                  ? `System default (${defaultPrinter.displayName})`
                  : "System default printer"}
              </option>
              {printers.map((printer) => (
                <option key={printer.name} value={printer.name}>
                  {printer.displayName}
                  {printer.isDefault ? " (Default)" : ""}
                </option>
              ))}
            </select>
          </div>

          {!desktopReceiptPrintingEnabled && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Direct receipt printing works in the Electron desktop app and
              skips the browser print preview dialog.
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

          {printSuccess && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              {printSuccess}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={submitPrint}
              disabled={!invoice || loading || isSubmittingPrint}
              className="btn btn-primary flex-1"
            >
              {isSubmittingPrint
                ? t("ReceiptPreviewModal.actions.printing", "Sending...")
                : t("ReceiptPreviewModal.actions.print")}
            </button>

            <button onClick={onClose} className="btn btn-outline flex-1">
              {t("ReceiptPreviewModal.actions.close")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
