import React, { forwardRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import logo from "./jingoslogo.png";
import { moneyTafqeet } from "./moneyTafqeet";

const PrintableRefundInvoice = forwardRef(
(
  {
    refundNumber,
    company,
    originalInvoice,
    refundDate,
    refundReason,
    invoiceItems = [],
    totalBeforeTax,
    totalTax,
    grandTotal,
    qr
  },
  ref
) => {
    const formatDate = (d) => {
      if (!d) return "";
      const datePart = d.split(" ")[0];
      const [yyyy, mm, dd] = datePart.split("-");
      return `${dd}-${mm}-${yyyy}`;
    };

const hasDiscount = invoiceItems.some(i => Number(i.discount_percentage || 0) > 0);
const safeItems = Array.isArray(invoiceItems) ? invoiceItems : [];

const totals = (Array.isArray(invoiceItems) ? invoiceItems : []).reduce(
  (acc, l) => {
    const originalQty = Number(l.original_qty || 0);
    const refundQty = Number(l.refund_qty || 0);
    const tax = Number(l.tax || 0);

    if (originalQty <= 0 || refundQty <= 0) return acc;

    const lineTotal =
      (Number(l.original_total || 0) / originalQty) * refundQty;

    const lineBeforeTax = lineTotal / (1 + tax / 100);
    const lineTax = lineTotal - lineBeforeTax;

    acc.beforeTax += lineBeforeTax;
    acc.tax += lineTax;
    acc.total += lineTotal;

    return acc;
  },
  { beforeTax: 0, tax: 0, total: 0 }
);

    return (
      <div
        ref={ref}
        dir="rtl"
        className="p-10 bg-white text-black w-[210mm] min-h-[297mm] mx-auto font-sans text-[14px] flex flex-col justify-between"
      >
        {/* ================= HEADER ================= */}
        <div>
<div className="flex justify-between items-start pb-4 mb-5 border-b border-gray-400">

  {/* LEFT — LOGO + COMPANY INFO */}
  <div className="flex gap-4 items-start max-w-[65%]">

    {/* LOGO */}
    <div className="w-20 h-20 flex items-center justify-center flex-shrink-0">
      {company?.logo_url && (
        <img
          src={company.logo_url}
          alt="Company Logo"
          className="max-h-full max-w-full object-contain"
        />
      )}
    </div>

    {/* COMPANY DETAILS */}
    <div className="text-right leading-snug">
      <h2 className="text-xl font-bold text-black">
        {company?.company_name}
      </h2>

      {company?.company_location && (
        <p className="text-sm text-gray-700 mt-1">
          {company.company_location}
        </p>
      )}

      {company?.phone_number && (
        <p className="text-sm text-gray-700 mt-0.5" dir="ltr">
          {company.phone_number}
        </p>
      )}
    </div>
  </div>

  {/* RIGHT — TAX INFO */}
  {company?.tax_number && (
    <div className="text-right border border-gray-300 rounded-md px-5 py-3">
      <p className="text-xs text-gray-600 mb-1">
        الرقم الضريبي
      </p>
      <p className="text-lg font-semibold tracking-wide" dir="ltr">
        {company.tax_number}
      </p>
    </div>
  )}
</div>


          {/* TITLE */}
          <div className="mb-4 text-center">
            <h2 className="text-xl font-bold text-red-600 underline">
              إشعار دائن (Refund / Credit Note)
            </h2>
          </div>

          {/* INFO */}
          <div className="mb-8 p-6 border border-gray-300 rounded-lg bg-gray-50">
            <div className="flex justify-between">
              <div className="space-y-2 text-right">
                <p><strong>رقم الإشعار:</strong> {refundNumber}</p>
                <p><strong>التاريخ:</strong> {formatDate(refundDate)}</p>
                <p><strong>فاتورة أصلية:</strong> {originalInvoice}</p>
              </div>

              <div className="space-y-2 text-left">
                <p><strong>سبب الإرجاع:</strong> {refundReason}</p>
              </div>
            </div>
          </div>

{/* ================= REFUND ITEMS TABLE ================= */}
<table className="w-full border-collapse border border-black text-sm">
  <thead className="bg-gray-100">
    <tr>
      <th className="border border-black p-2 w-[40px]">#</th>
      <th className="border border-black p-2">الوصف</th>
      <th className="border border-black p-2 text-right w-[80px]">
        الكميةالاصلية
      </th>
      <th className="border border-black p-2 text-right w-[80px]">
        الكمية
      </th>
      <th className="border border-black p-2 text-right w-[90px]">
        السعر
      </th>
      <th className="border border-black p-2 text-right w-[70px]">
        ضريبة %
      </th>
      <th className="border border-black p-2 text-right w-[70px]">
        الخصم %
      </th>
      <th className="border border-black p-2 text-right w-[110px]">
        الإجمالي
      </th>
    </tr>
  </thead>

  <tbody>
    {(Array.isArray(invoiceItems) ? invoiceItems : []).map((l, i) => {
      const originalQty = Number(l.original_qty || 0);
      const refundQty = Number(l.refund_qty || 0);
      const price = Number(l.item_price || 0);
      const tax = Number(l.tax || 0);
      const discount = Number(l.discount_percentage || 0);

      const lineTotal =
        originalQty > 0
          ? (Number(l.original_total || 0) / originalQty) * refundQty
          : 0;

      return (
        <tr key={i} className="odd:bg-gray-50">
          <td className="border border-black p-2 text-center">
            {l.item_number ?? i + 1}
          </td>

          <td className="border border-black p-2">
            {l.description || "—"}
          </td>

          <td className="border border-black p-2 text-right">
            {originalQty.toFixed(2)}
          </td>

          <td className="border border-black p-2 text-right font-medium">
            {refundQty.toFixed(2)}
          </td>

          <td className="border border-black p-2 text-right">
         {price.toFixed(3)}
          </td>

          <td className="border border-black p-2 text-right">
            {tax.toFixed(2)}%
          </td>

          <td className="border border-black p-2 text-right">
            {discount.toFixed(2)}%
          </td>

          <td className="border border-black p-2 text-right font-semibold">
            JD {lineTotal.toFixed(3)}
          </td>
        </tr>
      );
    })}
  </tbody>
</table>

          {/* QR + TOTALS */}
          <div className="flex justify-between mt-4">
            <div className="w-32 h-32 border flex items-center justify-center">
              {qr ? <QRCodeSVG value={qr} size={120} /> : null}
            </div>

            <div className="w-[40%]">
<table className="w-full border-collapse border border-black text-sm">
  <tbody>
    <tr>
      <td className="border border-black p-2 text-right font-medium">
        المجموع قبل الضريبة
      </td>
      <td className="border border-black p-2 text-right">
      {totals.beforeTax.toFixed(3)}
      </td>
    </tr>

    <tr>
      <td className="border border-black p-2 text-right font-medium">
 إجمالي الضريبة
      </td>
      <td className="border border-black p-2 text-right">
 {totals.tax.toFixed(3)}
      </td>
    </tr>

    <tr className="bg-gray-100">
      <td className="border border-black p-2 text-right font-bold">
          الإجمالي النهائي
      </td>
      <td className="border border-black p-2 text-right font-bold">
 {totals.total.toFixed(3)}
      </td>
    </tr>
  </tbody>
</table>



              <div className="mt-2 text-center font-bold">
                فقط {moneyTafqeet(grandTotal)}
              </div>
            </div>
          </div>
        </div>
        {/* ===================== BOTTOM FOOTER ====================== */}
<div
  className="absolute bottom-0 left-0 w-full bg-white border-t border-gray-300 py-2"
  dir="ltr"
>
  <div className="text-center text-[11px] text-gray-700">
    <span className="text-gray-500">Powered by</span>
    <span className="mx-2 text-gray-400">-</span>
    <span className="font-semibold tracking-wide">
      INNOVATION ELEMENTS Software Solutions™
    </span>
  </div>
</div>

      </div>
    );
  }
);

export default PrintableRefundInvoice;
