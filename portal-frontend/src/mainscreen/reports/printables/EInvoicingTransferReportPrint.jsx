import React, { forwardRef } from "react";
import BrandLogo from "../../../components/brandlogo";

const FIRST_PAGE_LIMIT = 20;
const OTHER_PAGES_LIMIT = 21;

const paginateRows = (rows) => {
  const pages = [];
  let index = 0;

  pages.push(rows.slice(0, FIRST_PAGE_LIMIT));
  index = FIRST_PAGE_LIMIT;

  while (index < rows.length) {
    pages.push(rows.slice(index, index + OTHER_PAGES_LIMIT));
    index += OTHER_PAGES_LIMIT;
  }

  return pages;
};

const EInvoicingTransferReportPrint = forwardRef(
  (
    {
      rows,
      dateFrom,
      dateTo,
      totalSum,
      totalCount,
      company,
      status
    },
    ref
  ) => {
    const pages = paginateRows(rows);
    const totalPages = pages.length;

    return (
      <div
        ref={ref}
        dir="rtl"
        className="text-sm text-gray-900 font-sans "
        style={{
          lineHeight: "1.6"
        }}
      >
        {pages.map((pageRows, pageIndex) => (
<div
  key={pageIndex}
  className="relative p-8"
  style={{
    pageBreakAfter: pageIndex < totalPages - 1 ? "always" : "auto",
    minHeight: "100vh"
  }}
>

            {/* ================= COMPANY HEADER ================= */}
<div className="flex justify-between items-start pb-4 mb-3 border-b border-gray-400">

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

            {/* ================= REPORT HEADER (FIRST PAGE ONLY) ================= */}

{pageIndex === 0 && (
  <div className="mb-3 flex justify-center">
    <div
      className="
        flex items-center gap-4
        px-4 py-1.5
        border border-gray-500
        rounded-md
        text-[12px]
        text-gray-800
        tracking-wide
      "
    >
      {/* Report name */}
      <span className="font-bold whitespace-nowrap">
                  تقرير الترحيل من نظام الفوترة
      </span>

      {/* Soft separator */}
      <span className="font-bold whitespace-nowrap">|</span>

                <div className="text-xs text-black font-semibold ">
                  حالة الترحيل :
                  <span className="font-medium mr-1">
                    {status === "shared" ? "تم الترحيل" : "لم يتم الترحيل"}
                  </span>
                </div>

      <span className="font-bold whitespace-nowrap">|</span>

      {/* Meta group */}
      <div className="flex items-center gap-2 text-gray-700">
        <span className="text-gray-500 whitespace-nowrap">
          الفترة
        </span>

        <span dir="ltr" className="font-mono text-gray-900">
          {dateFrom}
        </span>

        <span className="text-gray-400">-</span>

        <span dir="ltr" className="font-mono text-gray-900">
          {dateTo}
        </span>
      </div>
    </div>
  </div>
)}
            {/* ================= TABLE ================= */}
            <div className="border border-gray-300 rounded-sm overflow-hidden">
              <table className="w-full text-right border-collapse">
                <thead className="bg-gray-100 border-b border-gray-400">
                  <tr>
                    <th className="py-2 px-3">رقم الفاتورة</th>
                    <th className="py-2 px-3">التاريخ</th>
                    <th className="py-2 px-3">العميل</th>
                    <th className="py-2 px-3">الإجمالي</th>
                    <th className="py-2 px-3 text-center">حالة الترحيل</th>
                  </tr>
                </thead>

                <tbody>
                  {pageRows.map((r, i) => (
                    <tr
                      key={i}
                      className={`border-b ${i % 2 ? "bg-gray-50" : ""}`}
                    >
                      <td className="py-2 px-3" dir="ltr">
                        {r.invoice_number}
                      </td>

                      <td className="py-2 px-3" dir="ltr">
                        {r.date}
                      </td>

                      <td className="py-2 px-3">
                        {r.client}
                      </td>


                      <td className="py-2 px-3 font-medium" dir="ltr">
                        {Number(r.total).toFixed(3)}
                      </td>
                                            <td className="py-2 px-3 text-center font-medium">
                        {r.qr !== "123456789"
                          ? "تم الترحيل"
                          : "لم يتم الترحيل"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ================= SUMMARY (LAST PAGE ONLY) ================= */}
            {pageIndex === totalPages - 1 && (
              <div className="mt-6 flex justify-between border-t pt-4">
                <div>
                  عدد السجلات :
                  <span dir="ltr" className="ml-1">
                    {totalCount}
                  </span>
                </div>
                <div className="font-bold">
                  الإجمالي :
                  <span dir="ltr" className="ml-2">
                    {Number(totalSum).toFixed(3)}
                  </span>
                </div>
              </div>
            )}

            {/* ================= PAGE NUMBER ================= */}
            <div className="mt-3 text-center text-xs text-gray-500">
              صفحة {pageIndex + 1} من {totalPages}
            </div>
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
        ))}
      </div>
    );
  }
);

export default EInvoicingTransferReportPrint;
