import React, { forwardRef } from "react";
import BrandLogo from "../../../components/brandlogo";

const Section = ({ title, rows }) => {
  if (!rows || rows.length === 0) return null;

  const totals = rows.reduce(
    (acc, r) => {
      acc.sales += Number(r.total_sales || 0);
      acc.tax += Number(r.total_tax || 0);
      acc.withTax += Number(r.total_with_tax || 0);
      return acc;
    },
    { sales: 0, tax: 0, withTax: 0 }
  );

  return (
    <div className="mb-6 border border-gray-300 rounded-sm overflow-hidden">
      <div className="bg-gray-100 px-4 py-2 font-semibold">
        {title}
      </div>

      <table className="w-full text-sm border-collapse">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="py-2 px-3 text-center w-24">نسبة الضريبة</th>
            <th className="py-2 px-3 text-right">الإجمالي بدون ضريبة</th>
            <th className="py-2 px-3 text-right">قيمة الضريبة</th>
            <th className="py-2 px-3 text-right">الإجمالي مع الضريبة</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t">
              <td className="py-2 px-3 text-center">
                {r.percentage ?? "—"}%
              </td>
              <td className="py-2 px-3 text-right" dir="ltr">
                {Number(r.total_sales).toFixed(3)}
              </td>
              <td className="py-2 px-3 text-right" dir="ltr">
                {Number(r.total_tax).toFixed(3)}
              </td>
              <td className="py-2 px-3 text-right font-medium" dir="ltr">
                {Number(r.total_with_tax).toFixed(3)}
              </td>
            </tr>
          ))}

          <tr className="border-t bg-gray-50 font-semibold">
            <td className="py-2 px-3 text-center">المجموع</td>
            <td className="py-2 px-3 text-right" dir="ltr">
              {totals.sales.toFixed(3)}
            </td>
            <td className="py-2 px-3 text-right" dir="ltr">
              {totals.tax.toFixed(3)}
            </td>
            <td className="py-2 px-3 text-right" dir="ltr">
              {totals.withTax.toFixed(3)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

const TaxDeclarationReportPrint = forwardRef(
  ({ company, dateFrom, dateTo, taxData }, ref) => {
    return (
      <div
        ref={ref}
        dir="rtl"
        className="text-sm text-gray-900 font-sans p-8"
        style={{
          lineHeight: "1.6"
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

        {/* ================= REPORT TITLE ================= */}
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
            تقرير الإقرار الضريبي
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
        {/* ================= SECTIONS ================= */}
        <Section title="المبيعات المحلية" rows={taxData?.local || []} />
        <Section title="المبيعات التصديرية" rows={taxData?.export ? [taxData.export] : []} />
        <Section title="المبيعات المعفاة" rows={taxData?.exempt ? [taxData.exempt] : []} />
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

export default TaxDeclarationReportPrint;
