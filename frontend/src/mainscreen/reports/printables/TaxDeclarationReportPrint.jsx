import React, { forwardRef, useMemo } from "react";
import BrandLogo from "../../../components/brandlogo";

/* ===== helpers ===== */
const toNum = (v) => Number(v || 0);
const fmt3 = (v) => toNum(v).toFixed(3);
const isNonZero = (n) => Math.abs(Number(n || 0)) > 0.0005; // numeric(12,3) tolerance
const keepRow = (r) => isNonZero(r?.sales_total) || isNonZero(r?.refunds_total);

const buildRow = (label, obj) => {
  const sales_total = toNum(obj?.sales_total);
  const refunds_total = toNum(obj?.refunds_total);
  // IMPORTANT: treat grand total as net (sales - refunds) for correct math
  const grand_total = sales_total - refunds_total;
  return { label, sales_total, refunds_total, grand_total };
};

// parse percentage from labels like "5 %", "16 %"
// returns null if not a percentage label (e.g. "معفى")
const parsePctFromLabel = (label) => {
  const s = String(label || "").trim();
  const m = s.match(/^(\d+(?:\.\d+)?)\s*%$/);
  return m ? Number(m[1]) : null;
};

/* ===== section table (Export/Development) ===== */
const BucketsSection = ({ title, rows }) => {
  const filtered = (rows || []).filter(keepRow);
  if (filtered.length === 0) return null;

  const totals = filtered.reduce(
    (acc, r) => {
      acc.sales_total += toNum(r.sales_total);
      acc.refunds_total += toNum(r.refunds_total);
      acc.grand_total += toNum(r.grand_total);
      return acc;
    },
    { sales_total: 0, refunds_total: 0, grand_total: 0 }
  );

  return (
    <div className="mb-6 border border-gray-300 rounded-sm overflow-hidden">
      <div className="bg-gray-100 px-4 py-2 font-semibold">{title}</div>

      <table className="w-full text-sm border-collapse">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="py-2 px-3 text-start">النوع</th>
            <th className="py-2 px-3 text-start">إجمالي المبيعات</th>
            <th className="py-2 px-3 text-start">إجمالي المرتجعات</th>
            <th className="py-2 px-3 text-start">الإجمالي النهائي</th>
          </tr>
        </thead>

        <tbody>
          {filtered.map((r, i) => (
            <tr key={i} className="border-t">
              <td className="py-2 px-3">{r.label}</td>

              <td className="py-2 px-3 text-end" dir="ltr">
                {fmt3(r.sales_total)}
              </td>

              <td className="py-2 px-3 text-end" dir="ltr">
                {fmt3(r.refunds_total)}
              </td>

              <td className="py-2 px-3 text-end font-medium" dir="ltr">
                {fmt3(r.grand_total)}
              </td>
            </tr>
          ))}

          <tr className="border-t bg-gray-50 font-semibold">
            <td className="py-2 px-3">الإجمالي</td>
            <td className="py-2 px-3 text-end" dir="ltr">
              {fmt3(totals.sales_total)}
            </td>
            <td className="py-2 px-3 text-end" dir="ltr">
              {fmt3(totals.refunds_total)}
            </td>
            <td className="py-2 px-3 text-end" dir="ltr">
              {fmt3(totals.grand_total)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

/* ===== LOCAL table (with before-tax + tax) ===== */
const LocalBucketsSection = ({ title, rows }) => {
  const filtered = (rows || []).filter(keepRow);
  if (filtered.length === 0) return null;

  const computed = filtered.map((r) => {
    const label = String(r.label || "").trim();

    const sales = toNum(r.sales_total);
    const refunds = toNum(r.refunds_total);
    const net = sales - refunds; // total including tax (your rule)

    // FIX: exempt must NOT be treated as 0%
    const isExempt = label === "معفى" || label.toLowerCase() === "exempt";
    const pct = isExempt ? null : parsePctFromLabel(label);

    // pct null (exempt) or 0% -> before_tax = net, tax = 0
    if (pct === null || pct === 0) {
      return {
        ...r,
        before_tax: net,
        tax_amount: 0,
        grand_total_calc: net,
      };
    }

    // before tax = net / (1 + pct/100)
    const before_tax = net / (1 + pct / 100);
    const tax_amount = net - before_tax;

    return {
      ...r,
      before_tax,
      tax_amount,
      grand_total_calc: net,
    };
  });

  const totals = computed.reduce(
    (acc, r) => {
      acc.sales_total += toNum(r.sales_total);
      acc.refunds_total += toNum(r.refunds_total);
      acc.before_tax += toNum(r.before_tax);
      acc.tax_amount += toNum(r.tax_amount);
      acc.grand_total += toNum(r.grand_total_calc);
      return acc;
    },
    { sales_total: 0, refunds_total: 0, before_tax: 0, tax_amount: 0, grand_total: 0 }
  );

  return (
    <div className="mb-6 border border-gray-300 rounded-sm overflow-hidden">
      <div className="bg-gray-100 px-4 py-2 font-semibold">{title}</div>

      <table className="w-full text-sm border-collapse">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="py-2 px-3 text-start">النوع</th>
            <th className="py-2 px-3 text-start">إجمالي المبيعات</th>
            <th className="py-2 px-3 text-start">إجمالي المرتجعات</th>
            <th className="py-2 px-3 text-start">الإجمالي قبل الضريبة</th>
            <th className="py-2 px-3 text-start">قيمة الضريبة</th>
            <th className="py-2 px-3 text-start">الإجمالي النهائي</th>
          </tr>
        </thead>

        <tbody>
          {computed.map((r, i) => (
            <tr key={i} className="border-t">
              <td className="py-2 px-3">{r.label}</td>

              <td className="py-2 px-3 text-end" dir="ltr">
                {fmt3(r.sales_total)}
              </td>

              <td className="py-2 px-3 text-end" dir="ltr">
                {fmt3(r.refunds_total)}
              </td>

              <td className="py-2 px-3 text-end" dir="ltr">
                {fmt3(r.before_tax)}
              </td>

              <td className="py-2 px-3 text-end" dir="ltr">
                {fmt3(r.tax_amount)}
              </td>

              <td className="py-2 px-3 text-end font-medium" dir="ltr">
                {fmt3(r.grand_total_calc)}
              </td>
            </tr>
          ))}

          <tr className="border-t bg-gray-50 font-semibold">
            <td className="py-2 px-3">الإجمالي</td>
            <td className="py-2 px-3 text-end" dir="ltr">
              {fmt3(totals.sales_total)}
            </td>
            <td className="py-2 px-3 text-end" dir="ltr">
              {fmt3(totals.refunds_total)}
            </td>
            <td className="py-2 px-3 text-end" dir="ltr">
              {fmt3(totals.before_tax)}
            </td>
            <td className="py-2 px-3 text-end" dir="ltr">
              {fmt3(totals.tax_amount)}
            </td>
            <td className="py-2 px-3 text-end" dir="ltr">
              {fmt3(totals.grand_total)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

const TaxDeclarationReportPrint = forwardRef(({ company, dateFrom, dateTo, taxData }, ref) => {
  // Export: 0% + exempt
  const exportRows = useMemo(() => {
    return [
      buildRow("0 %", taxData?.export_sales?.zero_tax),
      buildRow("معفى", taxData?.export_sales?.exempt),
    ];
  }, [taxData]);

  // Development: 0% + exempt
  const developmentRows = useMemo(() => {
    return [
      buildRow("0 %", taxData?.development_sales?.zero_tax),
      buildRow("معفى", taxData?.development_sales?.exempt),
    ];
  }, [taxData]);

  // Local: exempt + 0..16%
  const localRows = useMemo(() => {
    const rows = [buildRow("معفى", taxData?.local_sales?.exempt)];
    for (let i = 0; i <= 16; i++) {
      rows.push(buildRow(`${i} %`, taxData?.local_sales?.taxed?.[i]));
    }
    return rows;
  }, [taxData]);

  return (
    <div
      ref={ref}
      dir="rtl"
      className="text-sm text-gray-900 font-sans p-8"
      style={{ lineHeight: "1.6", position: "relative", minHeight: "100vh" }}
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

        {/* RIGHT — TAX INFO */}
        {company?.tax_number && (
          <div className="text-right border border-gray-300 rounded-md px-5 py-3">
            <p className="text-xs text-gray-600 mb-1">الرقم الضريبي</p>
            <p className="text-lg font-semibold tracking-wide" dir="ltr">
              {company.tax_number}
            </p>
          </div>
        )}
      </div>

      {/* ================= REPORT TITLE ================= */}
      <div className="mb-5 flex justify-center">
        <div className="flex items-center gap-4 px-4 py-1.5 border border-gray-500 rounded-md text-[12px] text-gray-800 tracking-wide">
          <span className="font-bold whitespace-nowrap">تقرير الإقرار الضريبي</span>
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

      {/* ================= SECTIONS ================= */}
      <BucketsSection title="تصدير" rows={exportRows} />
      <BucketsSection title="مناطق تنموية" rows={developmentRows} />

      {/* LOCAL: new columns with before-tax + tax */}
      <LocalBucketsSection title="محلي" rows={localRows} />

      {/* ===================== BOTTOM FOOTER ====================== */}
      <div className="absolute bottom-0 left-0 w-full bg-white border-t border-gray-300 py-2" dir="ltr">
        <div className="text-center text-[11px] text-gray-700 flex items-center justify-center gap-2">
          <span className="text-gray-500">Powered by</span>
          <BrandLogo size={16} />
          <span className="font-semibold tracking-wide">INNOVATION ELEMENTS™</span>
        </div>
      </div>
    </div>
  );
});

export default TaxDeclarationReportPrint;