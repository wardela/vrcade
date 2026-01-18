import React, { forwardRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import logo from "./jingoslogo.png";
import { moneyTafqeet } from "./moneyTafqeet";

const PrintableVoidInvoice = forwardRef(
  ({ originalHeader, invoiceItems, qr, returnInvoiceNumber, voidedAt }, ref) => {
    const {
      invoice_number,
      client,
      date,
      type,
      notes,
      total
    } = originalHeader;

    // Compute totals same as main invoice
    const totalBeforeTax = invoiceItems.reduce((sum, item) => {
      const priceEx = item.price / (1 + item.tax / 100);
      return sum + priceEx * item.qty * (1 - item.discount / 100);
    }, 0);

    const totalTax = invoiceItems.reduce((sum, item) => {
      const priceEx = item.price / (1 + item.tax / 100);
      const taxUnit = priceEx * (item.tax / 100);
      return sum + taxUnit * item.qty * (1 - item.discount / 100);
    }, 0);

    const grandTotal = totalBeforeTax + totalTax;

    const formatDate = (d) => {
      if (!d) return "";
      const datePart = d.split(" ")[0].split("T")[0];
      const [yyyy, mm, dd] = datePart.split("-");
      if (!yyyy || !mm || !dd) return d;
      return `${dd}-${mm}-${yyyy}`;
    };

    return (
      <div
        ref={ref}
        dir="rtl"
        className="p-10 bg-white text-black w-[210mm] min-h-[297mm] mx-auto font-sans text-[14px]"
      >
        {/* ===== Header ===== */}
        <div className="flex justify-between items-center pb-3 mb-2 border-b border-gray-400">
          <div className="flex flex-col items-start text-right">

            <div className="w-36 h-36 flex items-center justify-center">
              <img src={logo} alt="Company Logo" className="max-h-36 max-w-full object-contain" />
            </div>

            <h2 className="text-lg font-bold text-black leading-tight w-full">
              شركة كرنفال لمدن الالعاب و المشاريع الترفيهية ذ.م.م
            </h2>
          </div>

          <div className="border border-gray-300 px-6 py-3 rounded text-right">
            <p className="text-sm text-gray-600">الرقم الضريبي</p>
            <p className="text-lg font-semibold">17925592</p>
          </div>
        </div>

        {/* Title */}
        <div className="mb-2 text-center">
          <h2 className="text-xl font-bold text-[#d32f2f] underline">
            فاتورة مرتجع (VOID)
          </h2>
        </div>

        {/* ===== Info Box ===== */}
        <div className="mb-8 p-6 border border-gray-300 rounded-lg bg-gray-50">
          <div className="flex justify-between">

            <div className="space-y-2 text-right">
              <p><strong>رقم فاتورة الإلغاء:</strong> {returnInvoiceNumber}</p>
              <p><strong>تاريخ الإلغاء:</strong> {formatDate(date)}</p>
              <p><strong>العميل:</strong> {client || "غير مذكور"}</p>
              <p><strong>طريقة الدفع:</strong> {type === "cash" ? "نقداً" : "آجل"}</p>
            </div>

            <div className="space-y-2 text-right">
              <p><strong>رقم الفاتورة الأصلية:</strong> {invoice_number}</p>
              <p><strong>تاريخ الفاتورة الأصلية:</strong> {formatDate(date)}</p>
              {notes && <p><strong>ملاحظات:</strong> {notes}</p>}
            </div>

          </div>
        </div>

        {/* ===== Items Table ===== */}
        <table className="w-full border-collapse border border-black text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-black p-2 w-[40px]">#</th>
              <th className="border border-black p-2">الوصف</th>
              <th className="border border-black p-2 w-[60px] text-right">الكمية</th>
              <th className="border border-black p-2 w-[100px] text-right">السعر بدون ضريبة</th>
              <th className="border border-black p-2 w-[80px] text-right">ضريبة %</th>
              <th className="border border-black p-2 w-[100px] text-right">قيمة الضريبة</th>
              <th className="border border-black p-2 w-[100px] text-right">الإجمالي (شامل)</th>
            </tr>
          </thead>

          <tbody>
            {invoiceItems.map((item, idx) => {
              const priceEx = item.price / (1 + item.tax / 100);
              const taxUnit = priceEx * (item.tax / 100);
              const totalIncl = item.price * item.qty * (1 - item.discount / 100);
              const totalTaxValue = taxUnit * item.qty * (1 - item.discount / 100);

              return (
                <tr key={idx} className="odd:bg-gray-50">
                  <td className="border border-black p-2 text-center">{idx + 1}</td>
                  <td className="border border-black p-2">{item.item_name}</td>
                  <td className="border border-black p-2 text-right">{item.qty}</td>
                  <td className="border border-black p-2 text-right">{priceEx.toFixed(3)}</td>
                  <td className="border border-black p-2 text-right">{item.tax}</td>
                  <td className="border border-black p-2 text-right">{totalTaxValue.toFixed(3)}</td>
                  <td className="border border-black p-2 text-right">{totalIncl.toFixed(3)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* ===== New Totals Table (Left Attached) ===== */}
        <div className="flex justify-between mt-2">
          
          {/* QR Code */}
          <div className="mt-2">
            <div className="w-32 h-32 border border-gray-400 flex items-center justify-center bg-white">
              {qr ? <QRCodeSVG value={qr} size={120} /> : <span className="text-gray-400 text-xs">لا يوجد QR</span>}
            </div>
          </div>

          {/* Left-attached totals table */}
          <div className="mt-2 w-[40%]">
            <table
              dir="ltr"
              className="border-collapse border border-black text-sm mt-0"
              style={{ marginRight: "auto" }}
            >
              <tbody>

                <tr>
                  <td className="border border-black p-2 text-center">
                    {totalBeforeTax.toFixed(3)}
                  </td>
                  <td className="border border-black p-2 font-semibold bg-gray-50 text-center">
                    المجموع قبل الضريبة
                  </td>
                </tr>

                <tr>
                  <td className="border border-black p-2 text-center">
                    {totalTax.toFixed(3)}
                  </td>
                  <td className="border border-black p-2 font-semibold bg-gray-50 text-center">
                    إجمالي الضريبة
                  </td>
                </tr>

                <tr className="bg-gray-100">
                  <td className="border border-black p-2 font-bold text-lg text-[#2f788a] text-center">
                    {grandTotal.toFixed(3)}
                  </td>
                  <td className="border border-black p-2 font-bold text-lg text-[#2f788a] text-center">
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

        {/* ===== Signatures ===== */}
        <div className="flex justify-between items-start mt-20">
          <div className="text-center">
            <p className="mb-4">_______________________</p>
            <p className="text-sm">توقيع البائع</p>
          </div>
          <div className="text-center">
            <p className="mb-4">_______________________</p>
            <p className="text-sm">توقيع المستلم</p>
          </div>
        </div>

        {/* ===== Footer ===== */}
        <div className="absolute bottom-0 py-2 left-0 w-full bg-[#6c7988] text-center text-white text-xs tracking-wide">
          <span className="font-semibold">www.JingosJungle.com</span>
          <span className="mx-2 text-gray-300">|</span>
          <span className="font-semibold">+962 6 582 3700</span>
        </div>

      </div>
    );
  }
);

export default PrintableVoidInvoice;
