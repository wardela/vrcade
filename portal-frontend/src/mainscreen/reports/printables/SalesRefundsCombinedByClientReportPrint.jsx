import React, { forwardRef, useMemo } from "react";
import BrandLogo from "../../../components/brandlogo";

const fmt3 = (n) => Number(n || 0).toFixed(3);
const isNonZero = (n) => Math.abs(Number(n || 0)) > 0.0005;

const SalesRefundsCombinedByClientReportPrint = forwardRef(
  ({ company, dateFrom, dateTo, rows, totalSum, totalCount, client }, ref) => {
    const showRefundCols = useMemo(() => {
      return (rows || []).some((r) => isNonZero(r?.refund_total));
    }, [rows]);

    return (
      <div
        ref={ref}
        dir="rtl"
        className="text-sm text-gray-900 font-sans p-8"
        style={{ lineHeight: "1.6", position: "relative", minHeight: "100vh" }}
      >
        {/* Header */}
        <div className="flex justify-between items-start pb-4 mb-3 border-b border-gray-400">
          <div className="flex gap-4 items-start max-w-[65%]">
            <div className="w-20 h-20 flex items-center justify-center flex-shrink-0">
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
                <p className="text-sm text-gray-700 mt-1">{company.company_location}</p>
              )}

              {company?.phone_number && (
                <p className="text-sm text-gray-700 mt-0.5" dir="ltr">
                  {company.phone_number}
                </p>
              )}
            </div>
          </div>

          {company?.tax_number && (
            <div className="text-right border border-gray-300 rounded-md px-5 py-3">
              <p className="text-xs text-gray-600 mb-1">الرقم الضريبي</p>
              <p className="text-lg font-semibold tracking-wide" dir="ltr">
                {company.tax_number}
              </p>
            </div>
          )}
        </div>

        {/* Title */}
        <div className="mb-5 flex justify-center">
          <div className="flex items-center gap-4 px-4 py-1.5 border border-gray-500 rounded-md text-[12px] text-gray-800 tracking-wide">
            <span className="font-bold whitespace-nowrap">
              تقرير المبيعات والمرتجعات حسب العميل
            </span>
            <span className="font-bold whitespace-nowrap">|</span>

            <div className="flex items-center gap-2 text-gray-700">
              <span className="text-gray-500 whitespace-nowrap">العميل</span>
              <span className="font-semibold">{client?.name || "-"}</span>
            </div>

            <span className="font-bold whitespace-nowrap">|</span>

            <div className="flex items-center gap-2 text-gray-700">
              <span className="text-gray-500 whitespace-nowrap">الفترة</span>
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

        {/* Table */}
        <div className="mb-6 border border-gray-300 rounded-sm overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="py-2 px-3 text-start">رقم الفاتورة</th>
                <th className="py-2 px-3 text-start">التاريخ</th>
                <th className="py-2 px-3 text-right">الإجمالي</th>

                {showRefundCols && (
                  <>
                    <th className="py-2 px-3 text-start">رقم المرتجع</th>
                    <th className="py-2 px-3 text-right">إجمالي المرتجع</th>
                  </>
                )}

                <th className="py-2 px-3 text-right">الصافي</th>
              </tr>
            </thead>

            <tbody>
              {(rows || []).map((r) => (
                <tr key={r.invoice_number} className="border-t">
                  <td className="py-2 px-3 text-start">{r.invoice_number}</td>
                  <td className="py-2 px-3 text-start">{r.date}</td>

                  <td className="py-2 px-3 text-end" dir="ltr">
                    {fmt3(r.invoice_total)}
                  </td>

                  {showRefundCols && (
                    <>
                      <td className="py-2 px-3 text-start">
                        {r.refund_invoice_number || "-"}
                      </td>
                      <td className="py-2 px-3 text-end" dir="ltr">
                        {fmt3(r.refund_total)}
                      </td>
                    </>
                  )}

                  <td className="py-2 px-3 text-end font-semibold" dir="ltr">
                    {fmt3(r.grand_total)}
                  </td>
                </tr>
              ))}

              <tr className="border-t bg-gray-50 font-semibold">
                <td className="py-2 px-3" colSpan={showRefundCols ? 6 : 4}>
                  الإجمالي (عدد الفواتير: {Number(totalCount || 0)})
                </td>
                <td className="py-2 px-3 text-end" dir="ltr">
                  {fmt3(totalSum)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div
          className="absolute bottom-0 left-0 w-full bg-white border-t border-gray-300 py-2"
          dir="ltr"
        >
          <div className="text-center text-[11px] text-gray-700 flex items-center justify-center gap-2">
            <span className="text-gray-500">Powered by</span>
            <BrandLogo size={16} />
            <span className="font-semibold tracking-wide">INNOVATION ELEMENTS™</span>
          </div>
        </div>
      </div>
    );
  }
);

export default SalesRefundsCombinedByClientReportPrint;