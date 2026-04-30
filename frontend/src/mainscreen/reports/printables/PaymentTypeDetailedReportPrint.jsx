import React, { forwardRef } from "react";
import BrandLogo from "../../../components/brandlogo";

const FIRST_PAGE_LIMIT = 18;
const OTHER_PAGES_LIMIT = 20;

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

const fmt3 = (value) => Number(value || 0).toFixed(3);

const PaymentTypeDetailedReportPrint = forwardRef(
  ({ company, dateFrom, dateTo, rows, totals }, ref) => {
    const pages = paginateRows(rows);
    const totalPages = pages.length;

    return (
      <div
        ref={ref}
        dir="rtl"
        className="text-sm text-gray-900 font-sans"
        style={{ lineHeight: "1.6" }}
      >
        {pages.map((pageRows, pageIndex) => (
          <div
            key={pageIndex}
            className="relative p-8"
            style={{
              pageBreakAfter: pageIndex < totalPages - 1 ? "always" : "auto",
              minHeight: "100vh",
            }}
          >
            <div className="mb-3 flex items-start justify-between border-b border-gray-400 pb-4">
              <div className="flex max-w-[65%] items-start gap-4">
                <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center">
                  {company?.logo_url && (
                    <img
                      src={company.logo_url}
                      alt="Company Logo"
                      className="max-h-full max-w-full object-contain"
                    />
                  )}
                </div>

                <div className="text-right leading-snug">
                  <h2 className="text-xl font-bold text-black">{company?.company_name}</h2>

                  {company?.company_location && (
                    <p className="mt-1 text-sm text-gray-700">{company.company_location}</p>
                  )}

                  {company?.phone_number && (
                    <p className="mt-0.5 text-sm text-gray-700" dir="ltr">
                      {company.phone_number}
                    </p>
                  )}
                </div>
              </div>

              {company?.tax_number && (
                <div className="rounded-md border border-gray-300 px-5 py-3 text-right">
                  <p className="mb-1 text-xs text-gray-600">الرقم الضريبي</p>
                  <p className="text-lg font-semibold tracking-wide" dir="ltr">
                    {company.tax_number}
                  </p>
                </div>
              )}
            </div>

            {pageIndex === 0 && (
              <div className="mb-5 flex justify-center">
                <div className="flex items-center gap-4 rounded-md border border-gray-500 px-4 py-1.5 text-[12px] tracking-wide text-gray-800">
                  <span className="whitespace-nowrap font-bold">تقرير طرق الدفع (تفصيلي)</span>

                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="whitespace-nowrap text-gray-500">الفترة</span>
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

            <div className="overflow-hidden rounded-sm border border-gray-300">
              <table className="w-full border-collapse text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-start">رقم الفاتورة</th>
                    <th className="px-3 py-2 text-end">نقدي</th>
                    <th className="px-3 py-2 text-end">بطاقة</th>
                    <th className="px-3 py-2 text-end">حوالة بنكية</th>
                    <th className="px-3 py-2 text-end">الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((row) => (
                    <tr key={row.invoice_number} className="border-t">
                      <td className="px-3 py-2">{row.invoice_number}</td>
                      <td className="px-3 py-2 text-end" dir="ltr">
                        {fmt3(row.cash)}
                      </td>
                      <td className="px-3 py-2 text-end" dir="ltr">
                        {fmt3(row.card)}
                      </td>
                      <td className="px-3 py-2 text-end" dir="ltr">
                        {fmt3(row.transfer)}
                      </td>
                      <td className="px-3 py-2 text-end font-medium" dir="ltr">
                        {fmt3(row.total)}
                      </td>
                    </tr>
                  ))}

                  {pageIndex === totalPages - 1 && (
                    <tr className="border-t bg-gray-50 font-semibold">
                      <td className="px-3 py-2">الإجمالي</td>
                      <td className="px-3 py-2 text-end" dir="ltr">
                        {fmt3(totals?.cash)}
                      </td>
                      <td className="px-3 py-2 text-end" dir="ltr">
                        {fmt3(totals?.card)}
                      </td>
                      <td className="px-3 py-2 text-end" dir="ltr">
                        {fmt3(totals?.transfer)}
                      </td>
                      <td className="px-3 py-2 text-end" dir="ltr">
                        {fmt3(totals?.overall_total)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 text-center text-xs text-gray-500">
              صفحة {pageIndex + 1} من {totalPages}
            </div>

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
        ))}
      </div>
    );
  },
);

export default PaymentTypeDetailedReportPrint;
