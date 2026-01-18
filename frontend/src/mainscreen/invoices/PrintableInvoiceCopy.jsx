import React, { forwardRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import logo from "./jingoslogo.png";
import { moneyTafqeet } from "./moneyTafqeet";

const PrintableInvoice = forwardRef(
  (
    {
      company,   // ✅ NEW
      invoiceNumber,
      clientName,
      invoiceDate,
      paymentType,
      notes,
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
    if (last.desc === current.desc && last.price === current.price) {
      last.qty += current.qty;   // merge quantities
    } else {
      merged.push({ ...current }); // different item → new row
    }
  }

  return merged;
};

const hasDiscount = invoiceItems.some(item => item.discount > 0);
const shouldShowQR = qr && qr !== "123456789";

    return (
      <div
        ref={ref}
        dir="rtl"
        className="p-10 bg-white text-black w-[210mm] min-h-[297mm] mx-auto font-sans text-[14px] flex flex-col justify-between"
      >
        {/* ========================= HEADER ========================= */}
        <div>
<div className="flex justify-between items-center pb-3 mb-4 border-b border-gray-400">

{/* LOGO + COMPANY */}
<div className="flex flex-col text-right max-w-[300px]">
  <div className="w-36 h-36 flex items-center justify-center">
    {company?.logo_url && (
      <img
        src={company.logo_url}
        alt="Company Logo"
        className="max-h-36 max-w-full object-contain"
      />
    )}
  </div>

  <h2 className="text-lg font-bold text-black leading-tight">
    {company?.company_name}
  </h2>

  {/* LOCATION */}
  {company?.company_location && (
    <p className="text-sm text-gray-700 mt-1">
      {company.company_location}
    </p>
  )}

  {/* PHONE */}
  {company?.phone_number && (
    <p className="text-sm text-gray-700 mt-0.5" dir="ltr">
      {company.phone_number}
    </p>
  )}
</div>


  {/* TAX NUMBER */}
  {company?.tax_number && (
    <div className="border border-gray-300 px-6 py-3 rounded text-right">
      <p className="text-sm text-gray-600">الرقم الضريبي</p>
      <p className="text-lg font-semibold" dir="ltr">
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
                {notes && (
                  <p>
                    <strong>ملاحظات:</strong> {notes}
                  </p>
                )}
              </div>

            </div>
          </div>

          {/* ==================== ITEMS TABLE ======================== */}
          <table className="w-full border-collapse border border-black text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-black p-2 w-[40px]">#</th>
                <th className="border border-black p-2">الوصف</th>
                <th className="border border-black p-2 w-[100px] text-right">
                  السعر بدون ضريبة
                </th>
                {hasDiscount && (
                  <th className="border border-black p-2 w-[80px] text-right">
                    الخصم %
                  </th>
                )}              
                <th className="border border-black p-2 w-[60px] text-right">
                  الكمية
                </th>
                <th className="border border-black p-2 w-[80px] text-right">
                  ضريبة %
                </th>
                <th className="border border-black p-2 w-[100px] text-right">
                  قيمة الضريبة
                </th>
                <th className="border border-black p-2 w-[100px] text-right">
                  الإجمالي (شامل)
                </th>
              </tr>
            </thead>

            <tbody>
              {mergeConsecutiveItems(
                  invoiceItems.filter(item => item.price > 0)
                ).map((item, idx) => {
                const priceIncl = item.price;
                const priceExcl = priceIncl / (1 + item.tax / 100);
                const taxUnit = priceIncl - priceExcl;
                const discountFactor = 1 - item.discount / 100;
                const totalIncl = priceIncl * item.qty * discountFactor;
                const totalTaxItem = taxUnit * item.qty * discountFactor;

                return (
                  <tr key={idx} className="odd:bg-gray-50">
                    <td className="border border-black p-2 text-center">
                      {idx + 1}
                    </td>
                    <td className="border border-black p-2">{item.desc}</td>
                    <td className="border border-black p-2 text-right">
                      {priceExcl.toFixed(3)}
                    </td>
                    {hasDiscount && (
                    <td className="border border-black p-2 text-right">
                      {item.discount}%
                    </td>     
                    )}               
                    <td className="border border-black p-2 text-right">
                      {item.qty}
                    </td>
                    <td className="border border-black p-2 text-right">
                      {item.tax}
                    </td>
                    <td className="border border-black p-2 text-right">
                      {totalTaxItem.toFixed(3)}
                    </td>
                    <td className="border border-black p-2 text-right">
                      {totalIncl.toFixed(3)}
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
                            <p className="text-sm">توقيع البائع</p>

            </div>
            <div className="text-center">
              <p className="mb-4">_______________________</p>
                            <p className="text-sm">توقيع المستلم</p>

            </div>
          </div>
        </div>

        {/* ===================== BOTTOM FOOTER ====================== */}
<div
  className="absolute bottom-0 left-0 w-full py-2 bg-[#6c7988] text-center text-white text-xs"
  dir="ltr"
>
  <span className="opacity-80">Powered by</span>
  <span className="mx-2 opacity-50">—</span>
  <span className="font-bold text-gray-100">INNOVAITIVE Software Solutions™</span>
</div>



      </div>
    );
  }
);

export default PrintableInvoice;
