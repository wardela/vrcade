import { useEffect, useState, useRef } from "react";
import api from "../../utils/axiosInstance";
import { QRCodeSVG } from "qrcode.react";
import { printHtmlDocument } from "../../utils/printHtml";
import { buildReceiptHtml } from "../../utils/receiptHtml";
import { useTranslation } from "react-i18next";

export default function ReceiptPreviewModal({
  open,
  invoiceNumber,
  company, 
  onClose,
}) {
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState(null);
  const {t} = useTranslation();
const qrValue =
  invoice?.header?.qr && invoice.header.qr !== "123456789"
    ? invoice.header.qr
    : "https://www.innovationelements.org";
  const printRef = useRef(null);


// ================= FETCH INVOICE (SAFE) =================
useEffect(() => {
  if (!open || !invoiceNumber) return;

  const controller = new AbortController();

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const res = await api.get(
        `/api/invoices/full/${invoiceNumber}`,
        { signal: controller.signal }
      );
      setInvoice(res.data);
    } catch (err) {
      if (err.name !== "CanceledError") {
        console.error(
          "Failed to fetch invoice for receipt preview",
          err
        );
      }
    } finally {
      setLoading(false);
    }
  };

  fetchInvoice();

  // 🧹 cleanup when modal closes / invoice changes
  return () => controller.abort();
}, [open, invoiceNumber]);

const formatInvoiceDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

const dateFormatted = invoice?.header?.date ? formatInvoiceDate(invoice.header.date) : "";

let totalDiscount = 0;     // discount BEFORE tax
let totalBeforeTax = 0;    // net subtotal BEFORE tax (after discount)
let totalTax = 0;
let totalDiscountIncl = 0;

if (invoice?.lines?.length) {
  invoice.lines.forEach((ln) => {
    const qty = Math.round(Number(ln.qty || 0));
    const priceIncl = Number(ln.item_price || 0);            // stored as incl-tax in your system
    const discountPct = Number(ln.discount_percentage || 0); // 0..1
    const taxPct = Number(ln.tax || 0);                      // e.g. 16

    if (!qty || !priceIncl) return;

    // derive price BEFORE tax
    const priceExcl =
      taxPct > 0 ? priceIncl / (1 + taxPct / 100) : priceIncl;

    const lineBaseExcl = priceExcl * qty;
    const lineDiscountExcl = lineBaseExcl * discountPct;
    const lineDiscountIncl = lineBaseExcl * discountPct * (1 + (taxPct / 100));
    const lineNetExcl = lineBaseExcl - lineDiscountExcl;

    const lineTax = lineNetExcl * (taxPct / 100);

    totalDiscount += lineDiscountExcl;
    totalDiscountIncl += lineDiscountIncl;
    totalBeforeTax += lineNetExcl;
    totalTax += lineTax;
  });
}

const grandTotal = totalBeforeTax + totalTax;

const totals = {
  totalDiscountIncl,
  totalBeforeTax,
  totalTax,
  grandTotal,
};

  if (!open) return null;


  /* ======================================================== */

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white w-full max-w-sm rounded-lg shadow-xl overflow-hidden">
<div className="flex w-full items-center flex-row px-4 py-2 justify-between border border-b bg-base-200">
    <h2 className="text-lg font-semibold">{t("ReceiptPreviewModal.title")}</h2>
        {/* Close button */}
    <button
      onClick={onClose}
      className="flex text-gray-500 hover:text-gray-700"
    >
      ✕
    </button>
</div>
        {/* Header */}
{/* ================= HEADER ================= */}


  {/* Center: Company info */}
{invoice && (
  <div className="px-4 py-3 border-b text-xs relative" dir="ltr">
    {/* Center: Company info */}
    <div className="flex flex-col items-center justify-center gap-1" dir="ltr">
      {company?.logo_url && (
        <img
          src={company.logo_url}
          alt="Company Logo"
          className="h-14 object-contain mb-1"
        />
      )}

      <div className="font-bold text-sm text-center">
        {company?.company_name || invoice.header.company_name}
      </div>

      {company?.tax_number && (
        <div className="text-[10px] text-gray-600">
          Tax No: {company.tax_number}
        </div>
      )}
    </div>
    {/* Top-left: Invoice info */}
    <div className="flex flex-col text-left leading-tight mt-2">
      <div>
        Invoice # : {invoice.header.invoice_number}
      </div>
      <div>
        Date : {formatInvoiceDate(invoice.header.date)}
      </div>
    </div>

  </div>
)}

        {/* Body */}
        <div className=" text-xs font-mono" dir="ltr">
          {loading && <div>Loading receipt…</div>}

          {!loading && invoice && (
            <div ref={printRef}>

              {/* ================= ITEMS ================= */}
              {invoice.lines.map((ln, i) => {
                const qty = Math.round(Number(ln.qty || 0));
                const price = Number(ln.item_price || 0);
                const lineTotal = qty * price;

                return (
                  <div key={i} className="flex justify-between mb-1 px-4 mt-4" dir="ltr">
                    {/* Qty + Name */}
                    <span className="flex-1">
                      {qty} × {ln.description}
                    </span>

                    {/* Line total WITHOUT discount */}
                    <span className="tabular-nums">
                      {lineTotal.toFixed(3)}
                    </span>
                  </div>
                );
              })}

              <hr className="my-2" />

              {/* ================= TOTALS ================= */}
              <div className="flex justify-between px-4" dir="ltr">
                <span>Total discount</span>
                <span className="tabular-nums">
                  {totalDiscountIncl.toFixed(3)}
                </span>
              </div>

              <div className="flex justify-between px-4" dir="ltr">
                <span>Total before tax</span>
                <span className="tabular-nums">
                  {totalBeforeTax.toFixed(3)}
                </span>
              </div>

              <div className="flex justify-between px-4" dir="ltr">
                <span>Tax</span>
                <span className="tabular-nums">
                  {totalTax.toFixed(3)}
                </span>
              </div>

              <hr className="my-2" />

              <div className="flex justify-between font-bold text-sm px-4" dir="ltr">
                <span>Grand total</span>
                <span className="tabular-nums">
                  {grandTotal.toFixed(3)}
                </span>
              </div>
{/* ================= QR CODE ================= */}
<div className="flex justify-center mt-4 mb-2">
  <div className="p-2 border border-gray-300 rounded-md bg-white">
    <QRCodeSVG
      value={qrValue}
      size={120}
      level="M"
    />
  </div>
</div>

<div className="text-center text-xs mt-3 mb-1 text-gray-500">
  Powered by{" "}
  <a
    href="https://www.innovationelements.org"
    target="_blank"
    rel="noopener noreferrer"
    className="text-indigo-600 hover:text-indigo-700 hover:underline transition-colors"
  >
    innovationelements.org
  </a>
</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t flex gap-2 bg-base-200">
<button
  onClick={() => {
    if (!invoice) return;

    const dateFormatted = invoice?.header?.date
      ? formatInvoiceDate(invoice.header.date)
      : "";

    const totals = {
      totalDiscountIncl,
      totalBeforeTax,
      totalTax,
      grandTotal,
    };

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

    printHtmlDocument(html);
  }}
  className="btn btn-primary flex-1"
>
  {t("ReceiptPreviewModal.actions.print")}
</button>


          <button
            onClick={onClose}
            className="btn btn-outline flex-1"
          >
              {t("ReceiptPreviewModal.actions.close")}
          </button>
        </div>
      </div>
    </div>
  );
}
