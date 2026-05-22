import React, { forwardRef } from "react";
import BrandLogo from "../../../components/brandlogo";

/* ===== Pagination rules (match your style) ===== */
const FIRST_PAGE_LIMIT = 18;
const OTHER_PAGES_LIMIT = 20;

/* ===== Helper: paginate rows ===== */
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

/* ===== Helper: zebra by invoice number ===== */
const groupByInvoiceColor = (rows) => {
  let lastInvoice = null;
  let groupIndex = -1;

  return rows.map((row) => {
    if (row.invoice_number !== lastInvoice) {
      groupIndex++;
      lastInvoice = row.invoice_number;
    }

    return {
      ...row,
      _groupIndex: groupIndex
    };
  });
};

const SalesByClientDetailedReportPrint = forwardRef(
  (
    {
      rows,
      dateFrom,
      dateTo,
      client,
      company
    },
    ref
  ) => {
    const groupedRows = groupByInvoiceColor(rows);
    const pages = paginateRows(groupedRows);
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
              minHeight: "100vh"
            }}
          >
            {/* ================= COMPANY HEADER ================= */}
            <div className="flex justify-between items-start pb-4 mb-3 border-b border-gray-400">
              <div className="flex gap-4 items-start max-w-[65%]">
                <div className="w-20 h-20 flex items-center justify-center">
                  {company?.logo_url && (
                    <img
                      src={company.logo_url}
                      alt="Company Logo"
                      className="max-h-full max-w-full object-contain"
                    />
                  )}
                </div>

                <div className="text-right">
                  <h2 className="text-xl font-bold">
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

              {company?.tax_number && (
                <div className="border border-gray-300 rounded-md px-5 py-3">
                  <p className="text-xs text-gray-600 mb-1">
                    الرقم الضريبي
                  </p>
                  <p className="text-lg font-semibold" dir="ltr">
                    {company.tax_number}
                  </p>
                </div>
              )}
            </div>

            {/* ================= TITLE (FIRST PAGE ONLY) ================= */}
            {pageIndex === 0 && (
              <div className="mb-4 flex justify-center">
                <div className="px-4 py-1.5 border border-gray-500 rounded-md text-[12px]">
                  <span className="font-bold">
                    تقرير المبيعات حسب العميل (تفصيلي)
                  </span>

                  <span className="mx-2 text-gray-400">|</span>

                  <span className="font-medium">
                    العميل: {client?.name}
                  </span>

                  <span className="mx-2 text-gray-400">|</span>

                  <span dir="ltr">
                    {dateFrom} - {dateTo}
                  </span>
                </div>
              </div>
            )}

            {/* ================= TABLE ================= */}
            <div className="border border-gray-300 rounded-sm overflow-hidden">
              <table className="w-full border-collapse text-right">
                <thead className="bg-gray-100 border-b border-gray-400">
                  <tr>
                    <th className="py-2 px-3">رقم الفاتورة</th>
                    <th className="py-2 px-3">التاريخ</th>
                    <th className="py-2 px-3">الصنف</th>
                    <th className="py-2 px-3 text-center">الكمية</th>
                    <th className="py-2 px-3">السعر</th>
                    <th className="py-2 px-3">الخصم</th>
                    <th className="py-2 px-3">الإجمالي</th>
                  </tr>
                </thead>

                <tbody>
                  {pageRows.map((r, i) => (
                    <tr
                      key={i}
                      className={`border-b border-gray-200 ${
                        r._groupIndex % 2 === 0
                          ? "bg-white"
                          : "bg-gray-50"
                      }`}
                    >
                      <td className="py-2 px-3" dir="ltr">
                        {r.invoice_number}
                      </td>
                      <td className="py-2 px-3" dir="ltr">
                        {r.invoice_date}
                      </td>
                      <td className="py-2 px-3">
                        {r.item_name || "-"}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {Number(r.qty)}
                      </td>
                      <td className="py-2 px-3" dir="ltr">
                        {Number(r.price).toFixed(3)}
                      </td>
                      <td className="py-2 px-3" dir="ltr">
                        {Number(r.discount || 0).toFixed(3)}
                      </td>
                      <td className="py-2 px-3 font-medium" dir="ltr">
                        {Number(r.total).toFixed(3)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ================= PAGE NUMBER ================= */}
            <div className="mt-4 text-center text-xs text-gray-500">
              صفحة {pageIndex + 1} من {totalPages}
            </div>

            {/* ================= FOOTER ================= */}
            <div className="absolute bottom-0 left-0 w-full border-t border-gray-300 py-2 bg-white" dir="ltr">
              <div className="text-center text-[11px] text-gray-700 flex items-center justify-center gap-2">
                <span className="text-gray-500">Powered by</span>
                <BrandLogo size={16} />
                <span className="font-semibold">INNOVATION ELEMENTS™</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
);

export default SalesByClientDetailedReportPrint;
