import React, { forwardRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { moneyTafqeet } from "./moneyTafqeet";
import BrandLogo from "../../components/BrandLogo";
import { getCompanyLogoSrc } from "../../utils/companyLogo";

const PrintableInvoice = forwardRef(
  (
    {
      company,
      invoiceNumber,
      clientName,
      invoiceDate,
      paymentType,
      notes,
      reference,
      invoiceItems,
      totalBeforeTax,
      totalTax,
      grandTotal,
      qr,
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

      for (let i = 0; i < items.length; i += 1) {
        const current = items[i];
        if (current.price === 0) continue;

        if (merged.length === 0) {
          merged.push({ ...current });
          continue;
        }

        const last = merged[merged.length - 1];
        if (
          last.desc === current.desc &&
          last.price === current.price &&
          last.unit_name === current.unit_name
        ) {
          last.qty += current.qty;
        } else {
          merged.push({ ...current });
        }
      }

      return merged;
    };

    const hasDiscount = invoiceItems.some((item) => item.discount > 0);
    const totalDiscountValue = invoiceItems.reduce(
      (sum, item) => sum + item.price * item.qty * (item.discount / 100),
      0
    );
    const totalBeforeDiscount = Number(totalDiscountValue) + Number(grandTotal);
    const shouldShowQR = qr && qr !== "123456789";
    const hasAnyNotes = invoiceItems.some(
      (item) =>
        item.notes != null &&
        String(item.notes).trim() !== "" &&
        String(item.notes) !== "0"
    );
    const hasInvoiceTerms =
      company?.invoice_terms && company.invoice_terms.trim() !== "";
    const logoSrc = getCompanyLogoSrc(company);

    return (
      <div
        ref={ref}
        dir="rtl"
        className="relative mx-auto flex min-h-[297mm] w-[210mm] flex-col justify-between bg-white p-10 font-sans text-[14px] text-black"
      >
        <div>
          <div className="mb-5 flex items-start justify-between border-b border-gray-400 pb-4">
            <div className="flex max-w-[65%] items-start gap-4">
              <div className="my-[-15px] flex h-28 w-28 flex-shrink-0 items-center justify-center">
                {logoSrc ? (
                  <img
                    src={logoSrc}
                    alt="Company Logo"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : null}
              </div>

              <div className="text-right leading-snug">
                <h2 className="text-xl font-bold text-black">{company?.company_name}</h2>

                {company?.company_location ? (
                  <p className="mt-1 text-sm text-gray-700">{company.company_location}</p>
                ) : null}

                {company?.phone_number ? (
                  <p className="mt-0.5 text-sm text-gray-700" dir="ltr">
                    {company.phone_number}
                  </p>
                ) : null}
              </div>
            </div>

            {company?.tax_number ? (
              <div className="rounded-md border border-gray-300 px-5 py-3 text-right">
                <p className="mb-1 text-xs text-gray-600">الرقم الضريبي</p>
                <p className="text-lg font-semibold tracking-wide" dir="ltr">
                  {company.tax_number}
                </p>
              </div>
            ) : null}
          </div>

          <div className="mb-4 text-center">
            <h2 className="text-xl font-bold text-[#2f788a] underline">فاتورة (Invoice)</h2>
          </div>

          <div className="mb-8 rounded-lg border border-gray-300 bg-gray-50 p-6">
            <div className="flex justify-between">
              <div className="space-y-2 text-right">
                <p>
                  <strong>رقم الفاتورة:</strong> {invoiceNumber}
                </p>
                <p>
                  <strong>التاريخ:</strong> {formatDate(invoiceDate)}
                </p>
                <p>
                  <strong>طريقة الدفع:</strong> {paymentType === "cash" ? "نقد" : "ذمم"}
                </p>
              </div>

              <div className="space-y-2 text-left">
                <p>
                  <strong>العميل:</strong> {clientName || "غير مذكور"}
                </p>

                {reference ? (
                  <p>
                    <strong>المرجع:</strong> {reference}
                  </p>
                ) : null}

                {notes ? (
                  <p>
                    <strong>ملاحظات:</strong> {notes}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <table className="w-full border border-black text-[12px]">
            <thead>
              <tr className="bg-gray-100 text-[11px]">
                <th className="whitespace-nowrap border border-black px-2 py-1 text-center">
                  #
                </th>
                <th className="border border-black px-2 py-1 text-right">الوصف</th>
                {hasAnyNotes ? (
                  <th className="border border-black px-2 py-1 text-right">الملاحظات</th>
                ) : null}
                <th className="whitespace-nowrap border border-black px-2 py-1 text-center">
                  السعر
                  <br />
                  بدون ضريبة
                </th>
                <th className="whitespace-nowrap border border-black px-2 py-1 text-center">
                  الكمية
                </th>
                <th className="whitespace-nowrap border border-black px-2 py-1 text-center">
                  الوحدة
                </th>
                <th className="whitespace-nowrap border border-black px-2 py-1 text-center">
                  الاجمالي
                  <br />
                  بدون ضريبة
                </th>
                <th className="whitespace-nowrap border border-black px-2 py-1 text-center">
                  ضريبة %
                </th>
                <th className="whitespace-nowrap border border-black px-2 py-1 text-center">
                  قيمة الضريبة
                </th>
                {hasDiscount ? (
                  <th className="whitespace-nowrap border border-black px-2 py-1 text-center">
                    خصم %
                  </th>
                ) : null}
                {hasDiscount ? (
                  <th className="whitespace-nowrap border border-black px-2 py-1 text-center">
                    قيمة الخصم
                  </th>
                ) : null}
                <th className="whitespace-nowrap border border-black px-2 py-1 text-center">
                  الإجمالي
                </th>
              </tr>
            </thead>

            <tbody>
              {mergeConsecutiveItems(invoiceItems.filter((item) => item.price > 0)).map(
                (item, idx) => {
                  const priceIncl = item.price;
                  const priceExcl = priceIncl / (1 + item.tax / 100);
                  const priceExclTotal = priceExcl * item.qty;
                  const taxUnit = priceIncl - priceExcl;
                  const discountFactor = item.discount / 100;
                  const discountValue = priceIncl * item.qty * discountFactor;
                  const totalIncl = priceIncl * item.qty * (1 - discountFactor);
                  const totalTaxItem = taxUnit * item.qty * (1 - discountFactor);

                  return (
                    <tr key={idx} className="align-top odd:bg-gray-50">
                      <td className="whitespace-nowrap border border-black px-2 py-1 text-center">
                        {idx + 1}
                      </td>
                      <td className="max-w-[300px] break-words border border-black px-2 py-1 text-right">
                        {item.desc}
                      </td>
                      {hasAnyNotes ? (
                        <td className="max-w-[260px] break-words border border-black px-2 py-1 text-right text-[11px] text-gray-700">
                          {item.notes?.trim() ? item.notes : "—"}
                        </td>
                      ) : null}
                      <td className="whitespace-nowrap border border-black px-2 py-1 text-right tabular-nums">
                        {priceExcl.toFixed(3)}
                      </td>
                      <td className="whitespace-nowrap border border-black px-2 py-1 text-right tabular-nums">
                        {item.qty}
                      </td>
                      <td className="whitespace-nowrap border border-black px-2 py-1 text-center">
                        {item.unit_name || "-"}
                      </td>
                      <td className="whitespace-nowrap border border-black px-2 py-1 text-right tabular-nums">
                        {priceExclTotal.toFixed(3)}
                      </td>
                      <td className="whitespace-nowrap border border-black px-2 py-1 text-center tabular-nums">
                        {item.tax}
                      </td>
                      <td className="whitespace-nowrap border border-black px-2 py-1 text-right tabular-nums">
                        {totalTaxItem.toFixed(2)}
                      </td>
                      {hasDiscount ? (
                        <td className="whitespace-nowrap border border-black px-2 py-1 text-right tabular-nums">
                          {item.discount}
                        </td>
                      ) : null}
                      {hasDiscount ? (
                        <td className="whitespace-nowrap border border-black px-2 py-1 text-right tabular-nums">
                          {discountValue.toFixed(2)}
                        </td>
                      ) : null}
                      <td className="whitespace-nowrap border border-black px-2 py-1 text-right font-medium tabular-nums">
                        {totalIncl.toFixed(2)}
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>

          <div className="flex justify-between">
            <div className="mt-2">
              {shouldShowQR ? (
                <div className="flex h-32 w-32 items-center justify-center border border-gray-400 bg-white">
                  <QRCodeSVG value={qr} size={120} />
                </div>
              ) : null}
            </div>

            <div className="mt-2 w-[40%]">
              <table
                dir="ltr"
                className="mt-2 border-collapse border border-black text-sm"
                style={{ marginRight: "auto" }}
              >
                <tbody>
                  {hasDiscount ? (
                    <tr>
                      <td className="border border-black p-2 text-center text-right">
                        {totalBeforeDiscount.toFixed(3)}
                      </td>
                      <td className="border border-black bg-gray-50 p-2 text-center font-semibold">
                        إجمالي قبل الخصم
                      </td>
                    </tr>
                  ) : null}
                  {hasDiscount ? (
                    <tr>
                      <td className="border border-black p-2 text-center text-right">
                        {totalDiscountValue.toFixed(3)}
                      </td>
                      <td className="border border-black bg-gray-50 p-2 text-center font-semibold">
                        إجمالي الخصم
                      </td>
                    </tr>
                  ) : null}
                  <tr>
                    <td className="w-1/2 border border-black p-2 text-center text-right">
                      {totalBeforeTax.toFixed(3)}
                    </td>
                    <td className="w-1/2 border border-black bg-gray-50 p-2 text-center font-semibold">
                      المجموع قبل الضريبة
                    </td>
                  </tr>
                  <tr>
                    <td className="items-center border border-black p-2 text-center text-right">
                      {totalTax.toFixed(3)}
                    </td>
                    <td className="border border-black bg-gray-50 p-2 text-center font-semibold">
                      إجمالي الضريبة
                    </td>
                  </tr>
                  <tr className="bg-gray-100">
                    <td className="border border-black p-2 text-center text-lg font-bold text-[#2f788a] text-right">
                      {grandTotal.toFixed(3)}
                    </td>
                    <td className="border border-black p-2 text-center text-lg font-bold text-[#2f788a]">
                      الإجمالي النهائي
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="mt-2 text-center text-md font-bold">
                فقط {moneyTafqeet(grandTotal)}
              </div>
            </div>
          </div>

          <div className="mt-28 flex items-start justify-between">
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

        {hasInvoiceTerms ? (
          <div className="flex justify-center px-1">
            <div className="whitespace-pre-line text-right text-[12.5px] leading-snug tracking-[0.1px] text-gray-800">
              ** {company.invoice_terms}
            </div>
          </div>
        ) : null}

        <div
          className="absolute bottom-0 left-0 w-full border-t border-gray-300 bg-white py-2"
          dir="ltr"
        >
          <div className="flex items-center justify-center gap-2 text-center text-[11px] text-gray-700">
            <span className="text-gray-500">Powered by</span>
            <BrandLogo size={16} />
            <span className="font-semibold tracking-wide">INNOVATION ELEMENTS™</span>
          </div>
        </div>
      </div>
    );
  }
);

export default PrintableInvoice;
