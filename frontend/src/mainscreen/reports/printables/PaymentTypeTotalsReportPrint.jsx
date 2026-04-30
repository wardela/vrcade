import React, { forwardRef } from "react";
import BrandLogo from "../../../components/brandlogo";

const fmt3 = (value) => Number(value || 0).toFixed(3);

const PAYMENT_METHOD_AR = {
  cash: "نقدي",
  card: "بطاقة",
  transfer: "حوالة بنكية",
};

const PaymentTypeTotalsReportPrint = forwardRef(
  ({ company, dateFrom, dateTo, rows, totals }, ref) => (
    <div
      ref={ref}
      dir="rtl"
      className="min-h-screen p-8 font-sans text-sm text-gray-900"
      style={{ lineHeight: "1.6", position: "relative" }}
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

      <div className="mb-5 flex justify-center">
        <div className="flex items-center gap-4 rounded-md border border-gray-500 px-4 py-1.5 text-[12px] tracking-wide text-gray-800">
          <span className="whitespace-nowrap font-bold">تقرير إجمالي طرق الدفع</span>

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

      <div className="overflow-hidden rounded-sm border border-gray-300">
        <table className="w-full border-collapse text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-start">طريقة الدفع</th>
              <th className="px-3 py-2 text-end">المبلغ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.payment_method} className="border-t">
                <td className="px-3 py-2">{PAYMENT_METHOD_AR[row.payment_method] || row.payment_method}</td>
                <td className="px-3 py-2 text-end font-medium" dir="ltr">
                  {fmt3(row.amount)}
                </td>
              </tr>
            ))}

            <tr className="border-t bg-gray-50 font-semibold">
              <td className="px-3 py-2">الإجمالي الكلي</td>
              <td className="px-3 py-2 text-end" dir="ltr">
                {fmt3(totals?.overall_total)}
              </td>
            </tr>
          </tbody>
        </table>
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
  ),
);

export default PaymentTypeTotalsReportPrint;
