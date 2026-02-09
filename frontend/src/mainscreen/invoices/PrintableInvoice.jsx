import React, { forwardRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import logo from "./jingoslogo.png";
import { moneyTafqeet } from "./moneyTafqeet";
import BrandLogo from "../../components/brandlogo";

const PrintableInvoice = forwardRef(
(
  {
    company,   
    invoiceNumber,
    clientName,
    invoiceDate,
    paymentType,
    notes,
    reference, // ✅ ADD THIS
    invoiceItems,
    totalBeforeTax,
    totalTax,
    grandTotal,
    qr
  },
  ref
) => {
    const formatDate = (d) => {
      if (!d) return "";
      const datePart = d.split(" ")[0].split("T")[0];
      const [yyyy, mm, dd] = datePart.split("-");
      return `${dd}-${mm}-${yyyy}`;
    };

    const mergeConsecutiveItems = (items) => {
  const merged = [];

  for (let i = 0; i < items.length; i++) {
    const current = items[i];

    // Skip items with price 0 (we already filter them)
    if (current.price === 0) continue;

    // Start new group
    if (merged.length === 0) {
      merged.push({ ...current });
      continue;
    }

    const last = merged[merged.length - 1];

    // If same description AND same unit price → merge quantities
if (
  last.desc === current.desc &&
  last.price === current.price &&
  last.unit_name === current.unit_name
) {
      last.qty += current.qty;   // merge quantities
    } else {
      merged.push({ ...current }); // different item → new row
    }
  }

  return merged;
};

const hasDiscount = invoiceItems.some(item => item.discount > 0);
const totalDiscountValue = invoiceItems.reduce(
  (sum, item) =>
    sum + item.price * item.qty * (item.discount / 100),
  0
);
const total_before_discount = ( Number(totalDiscountValue) + Number(grandTotal)) 
const shouldShowQR = qr && qr !== "123456789";
const hasAnyNotes = invoiceItems.some(i =>
  i.notes != null && String(i.notes).trim() !== "" && String(i.notes) !== "0"
);
const hasInvoiceTerms =
  company?.invoice_terms && company.invoice_terms.trim() !== "";
    return (
      <div
        ref={ref}
        dir="rtl"
        className="p-10 bg-white text-black w-[210mm] min-h-[297mm] mx-auto font-sans text-[14px] flex flex-col justify-between"
      >
        {/* ========================= HEADER ========================= */}
        <div>
<div className="flex justify-between items-start pb-4 mb-5 border-b border-gray-400">

  {/* LEFT — LOGO + COMPANY INFO */}
  <div className="flex gap-4 items-start max-w-[65%]">

    {/* LOGO */}
    <div className="w-28 h-28 flex items-center justify-center flex-shrink-0 my-[-15px]">
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
            <h2 className="text-xl font-bold text-[#2f788a] underline">
              فاتورة (Invoice)
            </h2>
          </div>

          {/* ========================================================= */}
          {/* ====================== INFO BOX ========================= */}
          {/* ========================================================= */}
          <div className="mb-8 p-6 border border-gray-300 rounded-lg bg-gray-50">
            <div className="flex justify-between">

              {/* LEFT */}
              <div className="space-y-2 text-right">
                <p>
                  <strong>رقم الفاتورة:</strong> {invoiceNumber}
                </p>
                <p>
                  <strong>التاريخ:</strong> {formatDate(invoiceDate)}
                </p>
                <p>
                  <strong>طريقة الدفع:</strong>{" "}
                  {paymentType === "cash" ? "نقد" : "ذمم"}
                </p>
              </div>

              {/* RIGHT */}
<div className="space-y-2 text-left ">
  <p>
    <strong>العميل:</strong> {clientName || "غير مذكور"}
  </p>

  {reference && (
    <p>
      <strong>المرجع:</strong> {reference}
    </p>
  )}

  {notes && (
    <p>
      <strong>ملاحظات:</strong> {notes}
    </p>
  )}
</div>

            </div>
          </div>

          {/* ==================== ITEMS TABLE ======================== */}
<table className="w-full border border-black text-[12px]">
  <thead>
    <tr className="bg-gray-100 text-[11px]">
      <th className="border border-black px-2 py-1 text-center whitespace-nowrap">
        #
      </th>

      <th className="border border-black px-2 py-1 text-right">
        الوصف
      </th>

      {hasAnyNotes && (
        <th className="border border-black px-2 py-1 text-right">
          الملاحظات
        </th>
      )}

      <th className="border border-black px-2 py-1 text-center whitespace-nowrap">
        السعر<br />بدون ضريبة
      </th>

      <th className="border border-black px-2 py-1 text-center whitespace-nowrap">
        الكمية
      </th>
      <th className="border border-black px-2 py-1 text-center whitespace-nowrap">الوحدة</th>
      <th className="border border-black px-2 py-1 text-center whitespace-nowrap">
        الاجمالي<br />بدون ضريبة
      </th>
      <th className="border border-black px-2 py-1 text-center whitespace-nowrap">
        ضريبة %
      </th>

      <th className="border border-black px-2 py-1 text-center whitespace-nowrap">
        قيمة الضريبة
      </th>
      {hasDiscount && (
        <th className="border border-black px-2 py-1 text-center whitespace-nowrap">
          خصم %
        </th>
      )}

      {hasDiscount && (
        <th className="border border-black px-2 py-1 text-center whitespace-nowrap">
          قيمة الخصم
        </th>
      )}
      <th className="border border-black px-2 py-1 text-center whitespace-nowrap">
        الإجمالي
      </th>
    </tr>
  </thead>

  <tbody>
    {mergeConsecutiveItems(
      invoiceItems.filter(item => item.price > 0)
    ).map((item, idx) => {
      const priceIncl = item.price;
      const priceExcl = priceIncl / (1 + item.tax / 100);
      const priceExclTotal = priceExcl * item.qty;
      const taxUnit = priceIncl - priceExcl;
      const discountFactor = item.discount / 100;
      const discountValue = priceIncl * item.qty * discountFactor;
      const totalIncl = priceIncl * item.qty * (1 - discountFactor);
      const totalTaxItem = taxUnit * item.qty * (1 - discountFactor);

      return (
        <tr key={idx} className="odd:bg-gray-50 align-top">
          {/* Index */}
          <td className="border border-black px-2 py-1 text-center whitespace-nowrap">
            {idx + 1}
          </td>

          {/* Description */}
          <td className="border border-black px-2 py-1 text-right break-words max-w-[300px]">
            {item.desc}
          </td>

          {/* Notes */}
          {hasAnyNotes && (
            <td className="border border-black px-2 py-1 text-right break-words max-w-[260px] text-[11px] text-gray-700">
              {item.notes?.trim() ? item.notes : "—"}
            </td>
          )}

          {/* Price excl tax */}
          <td className="border border-black px-2 py-1 text-right whitespace-nowrap tabular-nums">
            {priceExcl.toFixed(3)}
          </td>
          {/* Quantity */}
          <td className="border border-black px-2 py-1 text-right whitespace-nowrap tabular-nums">
            {item.qty}
          </td>
          <td className="border border-black px-2 py-1 text-center whitespace-nowrap">
            {item.unit_name || "-"}
          </td>
          <td className="border border-black px-2 py-1 text-right whitespace-nowrap tabular-nums">
            {priceExclTotal.toFixed(3)}
          </td>

          {/* Tax % */}
          <td className="border border-black px-2 py-1 text-center whitespace-nowrap tabular-nums">
            {item.tax}
          </td>

          {/* Tax value */}
          <td className="border border-black px-2 py-1 text-right whitespace-nowrap tabular-nums">
            {totalTaxItem.toFixed(2)}
          </td>
          {/* Discount % */}
          {hasDiscount && (
            <td className="border border-black px-2 py-1 text-right whitespace-nowrap tabular-nums">
              {item.discount}
            </td>
          )}

          {/* Discount value */}
          {hasDiscount && (
            <td className="border border-black px-2 py-1 text-right whitespace-nowrap tabular-nums">
              {discountValue.toFixed(2)}
            </td>
          )}
          {/* Total */}
          <td className="border border-black px-2 py-1 text-right font-medium whitespace-nowrap tabular-nums">
            {totalIncl.toFixed(2)}
          </td>
        </tr>
      );
    })}
  </tbody>
</table>



          <div className="flex justify-between">
          <div className="mt-2">
            {shouldShowQR && (
              <div className="w-32 h-32 border border-gray-400 flex items-center justify-center bg-white">
                <QRCodeSVG value={qr} size={120} />
              </div>
            )}
          </div>


          <div className="mt-2 w-[40%] ">
          <table
            dir="ltr"
            className="border-collapse border border-black text-sm mt-0  mt-2"
            style={{ marginRight: "auto" }}   // pushes it to the left visually
          >
            <tbody>
              {/* Subtotal */}
                {hasDiscount && (
                  <tr>
                    <td className="border border-black p-2 text-right text-center">
                      {total_before_discount.toFixed(3)}
                    </td>
                    <td className="border border-black p-2 font-semibold bg-gray-50 text-center">
                      إجمالي قبل الخصم
                    </td>
                  </tr>
                )}
                {hasDiscount && (
                  <tr>
                    <td className="border border-black p-2 text-right text-center">
                      {totalDiscountValue.toFixed(3)}
                    </td>
                    <td className="border border-black p-2 font-semibold bg-gray-50 text-center">
                      إجمالي الخصم
                    </td>
                  </tr>
                )}
              <tr>
                      <td className="border border-black p-2 text-right w-1/2 text-center">
                {totalBeforeTax.toFixed(3)} 
                </td>
                <td className="border border-black p-2 font-semibold bg-gray-50 w-1/2 text-center">
                  المجموع قبل الضريبة
                </td>

              </tr>

              {/* Tax Total */}
              <tr>
                <td className="border border-black p-2 text-right text-center items-center">
                {totalTax.toFixed(3)}
                </td>
                      <td className="border border-black p-2 font-semibold bg-gray-50 text-center ">
                  إجمالي الضريبة
                </td>
              </tr>
              {/* Grand Total */}
              <tr className="bg-gray-100">

                <td className="border border-black p-2 text-right font-bold text-lg text-[#2f788a] text-center">
                {grandTotal.toFixed(3)} 
                </td>
                      <td className="border border-black p-2 font-bold text-lg text-[#2f788a] text-center ">
                  الإجمالي النهائي
                </td>
              </tr>
            </tbody>
          </table>
          {/* Amount in Words */}
          <div className="mt-2 text-center text-md font-bold">
            فقط {moneyTafqeet(grandTotal)}
          </div>
          </div>
          </div>

          {/* ========================= QR + SIGN ====================== */}
          <div className="flex justify-between items-start mt-28">
            <div className="text-center">
              <p className="mb-4">_______________________</p>
              <p className="text-sm">توقيع العميل</p>
            </div>
            <div className="text-center">
              <p className="mb-4">_______________________</p>
              <p className="text-sm">قسم المبيعات</p>
            </div>
            <div className="text-center">
              <p className="mb-4">_______________________</p>
              <p className="text-sm">قسم المحاسبة</p>
            </div>
          </div>
        </div>

{hasInvoiceTerms && (
  <div className=" px-1 justify-center flex">
    <div
      className="text-[12.5px] text-gray-800 leading-snug whitespace-pre-line text-right tracking-[0.1px]"
    >
      ** {company.invoice_terms}
    </div>
  </div>
)}


{/* ===================== BOTTOM FOOTER ====================== */}
<div
  className="absolute bottom-0 left-0 w-full bg-white border-t border-gray-300 py-2"
  dir="ltr"
>
<div className="text-center text-[11px] text-gray-700 flex items-center justify-center gap-2">
  <span className="text-gray-500">
    Powered by 
  </span>

  <BrandLogo size={16} />

  <span className="font-semibold tracking-wide">
    INNOVATION ELEMENTS™
  </span>
</div>

</div>



      </div>
    );
  }
);

export default PrintableInvoice;
