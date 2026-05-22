import React, { forwardRef } from "react";
import BrandLogo from "../../../components/brandlogo";

const FIRST_PAGE_LIMIT = 20;
const OTHER_PAGES_LIMIT = 21;

const paginateRows = (rows) => {
  const pages = [];
  pages.push(rows.slice(0, FIRST_PAGE_LIMIT));

  let i = FIRST_PAGE_LIMIT;
  while (i < rows.length) {
    pages.push(rows.slice(i, i + OTHER_PAGES_LIMIT));
    i += OTHER_PAGES_LIMIT;
  }

  return pages;
};

const AREA_LABEL_AR = {
  local: "محلي",
  export: "تصدير",
  development: "تطوير"
};

const SalesByAreaReportPrint = forwardRef(
  (
    {
      rows,
      dateFrom,
      dateTo,
      totalSum,
      totalCount,
      area,
      company
    },
    ref
  ) => {
    const pages = paginateRows(rows);

    return (
<div
  ref={ref}
  dir="rtl"
  className="text-sm text-gray-900 font-sans"
  style={{ lineHeight: "1.6" }}
>
  {pages.map((page, index) => (
    <div
      key={index}
      className="relative p-8"
      style={{
        pageBreakAfter: index < pages.length - 1 ? "always" : "auto",
        minHeight: "100vh"
      }}
    >

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


            {index === 0 && (
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
        تقرير المبيعات حسب المنطقة
      </span>

      {/* Soft separator */}
      <span className="font-bold whitespace-nowrap">|</span>

        <span className="text-gray-500 whitespace-nowrap font-bold">
      {AREA_LABEL_AR[area]}
      </span>
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

            <div className="border border-gray-300 rounded-sm overflow-hidden">

              <table className="w-full text-right border-collapse">
                <thead className="bg-gray-100 border-b border-gray-400">
                <tr>
                  <th className="py-2 px-3 font-semibold">رقم الفاتورة</th>
                  <th className="py-2 px-3 font-semibold">التاريخ</th>
                  <th className="py-2 px-3 font-semibold">العميل</th>
                  <th className="py-2 px-3 font-semibold">الإجمالي</th>
                </tr>
              </thead>
                <tbody>
                  {page.map((r, i) => (
                    <tr
                      key={i}
                      className={`border-b border-gray-200 ${
                        i % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                    <td className="py-2 px-3" dir="ltr">{r.invoice_number}</td>
                    <td className="py-2 px-3" dir="ltr">{r.date}</td>
                    <td className="py-2 px-3">{r.client || "-"}</td>
                    <td className="py-2 px-3 font-medium" dir="ltr">
                      {Number(r.total).toFixed(3)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
</div>
            {index === pages.length - 1 && (
              <div className="mt-6 flex justify-between">
                <span>
                  عدد السجلات :
                  <span dir="ltr">{totalCount}</span>
                </span>
                <strong>
                  الإجمالي :
                  <span dir="ltr">
                    {Number(totalSum).toFixed(3)}
                  </span>
                </strong>
              </div>
            )}

            <div className="text-center text-xs mt-3">
              صفحة {index + 1} من {pages.length}
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

export default SalesByAreaReportPrint;
