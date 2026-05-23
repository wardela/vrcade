import { useEffect, useState } from "react";
import api from "./apiClient";
import { useRef } from "react";
import { useReactToPrint } from "./usePortalReactToPrint";
import EInvoicingTransferReportPrint from "./printables/EInvoicingTransferReportPrint";
import TaxDeclarationReportPrint from "./printables/TaxDeclarationReportPrint";
import InvoiceTaxSummaryReportPrint from "./printables/InvoiceTaxSummaryReportPrint";
import { useTranslation } from "react-i18next";
const PAGE_SIZE = 100;

/* ===== Date helpers (Jordan-safe) ===== */
const formatLocalDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const addOneDay = (dateStr) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + 1);
  return formatLocalDate(d);
};

const getDefaultDateRange = () => {
  const now = new Date();
  return {
    from: formatLocalDate(new Date(now.getFullYear(), 0, 1)),
    to: formatLocalDate(now)
  };
};

export default function EInvoicingReports() {
  /* ===== Report Types ===== */
  const REPORTS = {
    SHARED: "shared",
    TAX: "tax",
    INVOICE_TAX_SUMMARY: "invoice_tax_summary"
  };

  const [reportType, setReportType] = useState(REPORTS.SHARED);

  /* ===== Common Filters ===== */
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  /* ===== Shared / Unshared State ===== */
  const [status, setStatus] = useState("unshared");
  const [rows, setRows] = useState([]);
  const [offset, setOffset] = useState(0);
  const [totalSum, setTotalSum] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const printRef = useRef();
const [printRows, setPrintRows] = useState([]);
const [company, setCompany] = useState(null);
const [pendingPrint, setPendingPrint] = useState(false);
const {t} = useTranslation();

const canGoPrev = offset > 0;
const canGoNext = offset + PAGE_SIZE < totalCount;

const goPrev = () => {
  if (!canGoPrev) return;
  fetchSharedReport(offset - PAGE_SIZE);
};

const goNext = () => {
  if (!canGoNext) return;
  fetchSharedReport(offset + PAGE_SIZE);
};

useEffect(() => {
  api.get(`/api/portal/reports/company`).then(res => {
    setCompany(res.data);
  });
}, []);

const fetchEInvoicingForPrint = async () => {
  const res = await api.get(
    `/api/portal/reports/einvoicing`,
    {
      params: {
        from: dateFrom,
        to: dateTo,
        status,
        limit: 1000000,
        offset: 0
      }
    }
  );

  setPrintRows(res.data.rows || []);
};

const handlePrint = useReactToPrint({
  content: () => printRef.current,
  pageStyle: `
    @page { size: A4; margin: 6mm; }
    body { -webkit-print-color-adjust: exact; }
  `
});
  const [taxData, setTaxData] = useState(null);
  const [invoiceTaxData, setInvoiceTaxData] = useState(null);
useEffect(() => {
  if (!pendingPrint) return;

  const readyForShared =
    reportType === REPORTS.SHARED &&
    company &&
    printRows.length > 0;

  const readyForTax =
    reportType === REPORTS.TAX &&
    company &&
    !!taxData;

  const readyForInvoiceTaxSummary =
    reportType === REPORTS.INVOICE_TAX_SUMMARY &&
    company &&
    !!invoiceTaxData;

  if (readyForShared || readyForTax || readyForInvoiceTaxSummary) {
    handlePrint();
    setPendingPrint(false);
  }
}, [pendingPrint, reportType, printRows, taxData, invoiceTaxData, company, handlePrint]);
  /* ===== Tax Declaration State ===== */


  const [loading, setLoading] = useState(false);

  /* ===== Init Dates ===== */
  useEffect(() => {
    const { from, to } = getDefaultDateRange();
    setDateFrom(from);
    setDateTo(to);
  }, []);

  /* ===== Reset on Report Change ===== */
  useEffect(() => {
    setRows([]);
    setOffset(0);
    setTotalSum(0);
    setTotalCount(0);
    setTaxData(null);
    setInvoiceTaxData(null);
  }, [reportType]);

  /* ===== Fetch Shared / Unshared ===== */
  const fetchSharedReport = async (newOffset = 0) => {
    if (!dateFrom || !dateTo) return;

    try {
      setLoading(true);

      const res = await api.get(
        `/api/portal/reports/einvoicing`,
        {
          params: {
            from: dateFrom,
            to: dateTo,
            status,
            limit: PAGE_SIZE,
            offset: newOffset
          }
        }
      );

      setRows(res.data.rows || []);
      setTotalSum(res.data.total_sum || 0);
      setTotalCount(res.data.total_count || 0);
      setOffset(newOffset);
    } catch (err) {
      console.error("Failed to fetch e-invoicing report", err);
    } finally {
      setLoading(false);
    }
  };

  /* ===== Fetch Tax Declaration ===== */
  const fetchTaxDeclaration = async () => {
    if (!dateFrom || !dateTo) return;

    try {
      setLoading(true);

      const res = await api.get(
        `/api/portal/reports/einvoicing/tax-declaration`,
        {
          params: {
            from: dateFrom,
            to: addOneDay(dateTo)
          }
        }
      );

      setTaxData(res.data);
    } catch (err) {
      console.error("Failed to fetch tax declaration", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoiceTaxSummary = async () => {
    if (!dateFrom || !dateTo) return;

    try {
      setLoading(true);

      const res = await api.get(
        `/api/portal/reports/einvoicing/invoice-tax-summary`,
        {
          params: {
            from: dateFrom,
            to: addOneDay(dateTo),
          }
        }
      );

      setInvoiceTaxData(res.data);
    } catch (err) {
      console.error("Failed to fetch invoice tax summary", err);
    } finally {
      setLoading(false);
    }
  };

  /* ===== Apply Button ===== */
  const handleApply = () => {
    if (reportType === REPORTS.SHARED) {
      fetchSharedReport(0);
    } else if (reportType === REPORTS.TAX) {
      fetchTaxDeclaration();
    } else {
      fetchInvoiceTaxSummary();
    }
  };
const isNonZero = (n) => Math.abs(Number(n || 0)) > 0.0005; // tolerance for numeric(12,3)
const keepRow = (r) => isNonZero(r?.sales_total) || isNonZero(r?.refunds_total);

function TaxBucketsSection({ title, rows, bold = false }) {
  if (!rows || rows.length === 0) return null;

  const totals = rows.reduce(
    (acc, r) => {
      acc.sales_total += Number(r.sales_total || 0);
      acc.refunds_total += Number(r.refunds_total || 0);
      acc.grand_total += Number(r.grand_total || 0);
      return acc;
    },
    { sales_total: 0, refunds_total: 0, grand_total: 0 }
  );

  return (
    <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
      <div className="px-4 py-3 border-b bg-gray-50">
        <h3 className="font-semibold text-gray-700 tracking-wide">{title}</h3>
      </div>

      <table className="min-w-[720px] w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 text-start">{t("EInvoicingReports.table.type")}</th>
            <th className="px-4 py-2 text-end">{t("EInvoicingReports.table.sales_total")}</th>
            <th className="px-4 py-2 text-end">{t("EInvoicingReports.table.refunds_total")}</th>
            <th className="px-4 py-2 text-end">{t("EInvoicingReports.table.grand_total")}</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={`border-t ${bold ? "font-semibold" : ""}`}>
              <td className="px-4 py-2">{r.label}</td>
              <td className="px-4 py-2 text-end">{Number(r.sales_total || 0).toFixed(3)}</td>
              <td className="px-4 py-2 text-end">{Number(r.refunds_total || 0).toFixed(3)}</td>
              <td className="px-4 py-2 text-end">{Number(r.grand_total || 0).toFixed(3)}</td>
            </tr>
          ))}

          <tr className="border-t bg-gray-50 font-semibold">
            <td className="px-4 py-2">{t("EInvoicingReports.table.total_row")}</td>
            <td className="px-4 py-2 text-end">{totals.sales_total.toFixed(3)}</td>
            <td className="px-4 py-2 text-end">{totals.refunds_total.toFixed(3)}</td>
            <td className="px-4 py-2 text-end">{totals.grand_total.toFixed(3)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ===== Local calculations helpers =====
const num = (v) => Number(v || 0);
const fmt3 = (v) => num(v).toFixed(3);

// parse percentage from labels like "5 %", "16 %", etc.
// returns null if not a percentage label (exempt)
const parsePctFromLabel = (label) => {
  const s = String(label || "").trim();
  const m = s.match(/^(\d+(?:\.\d+)?)\s*%$/);
  return m ? Number(m[1]) : null;
};

// LOCAL table: Type / Sales / Refunds / Before Tax / Tax / Grand Total
function LocalBucketsSection({ title, rows }) {
  if (!rows || rows.length === 0) return null;

  const computedRows = rows.map((r) => {
    const label = String(r.label || "");
    const sales = num(r.sales_total);
    const refunds = num(r.refunds_total);

    // net = grand_total logically (sales - refunds). Use computed to be safe.
    const net = sales - refunds;

    // exempt row stays exempt (no % math)
    const isExempt =
      label === t("EInvoicingReports.tax_sections.exempt") ||
      label.toLowerCase() === "exempt";

    const pct = isExempt ? null : parsePctFromLabel(label);

    // If pct is null (not percent) or pct is 0 => before_tax = net, tax = 0
    if (pct === null || pct === 0) {
      return {
        ...r,
        before_tax: net,
        tax_amount: 0,
        grand_total_calc: net,
      };
    }

    // Your formula:
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

  const totals = computedRows.reduce(
    (acc, r) => {
      acc.sales_total += num(r.sales_total);
      acc.refunds_total += num(r.refunds_total);
      acc.before_tax += num(r.before_tax);
      acc.tax_amount += num(r.tax_amount);
      acc.grand_total += num(r.grand_total_calc);
      return acc;
    },
    { sales_total: 0, refunds_total: 0, before_tax: 0, tax_amount: 0, grand_total: 0 }
  );

  return (
    <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
      <div className="px-4 py-3 border-b bg-gray-50">
        <h3 className="font-semibold text-gray-700 tracking-wide">{title}</h3>
      </div>

      <table className="min-w-[840px] w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 text-start">{t("EInvoicingReports.table.type")}</th>
            <th className="px-4 py-2 text-end">{t("EInvoicingReports.table.sales_total")}</th>
            <th className="px-4 py-2 text-end">{t("EInvoicingReports.table.refunds_total")}</th>
            <th className="px-4 py-2 text-end">{t("EInvoicingReports.table.total_no_tax")}</th>
            <th className="px-4 py-2 text-end">{t("EInvoicingReports.table.tax")}</th>
            <th className="px-4 py-2 text-end">{t("EInvoicingReports.table.grand_total")}</th>
          </tr>
        </thead>

        <tbody>
          {computedRows.map((r, i) => (
            <tr key={i} className="border-t">
              <td className="px-4 py-2">{r.label}</td>
              <td className="px-4 py-2 text-end">{fmt3(r.sales_total)}</td>
              <td className="px-4 py-2 text-end">{fmt3(r.refunds_total)}</td>
              <td className="px-4 py-2 text-end">{fmt3(r.before_tax)}</td>
              <td className="px-4 py-2 text-end">{fmt3(r.tax_amount)}</td>
              <td className="px-4 py-2 text-end font-semibold">{fmt3(r.grand_total_calc)}</td>
            </tr>
          ))}

          <tr className="border-t bg-gray-50 font-semibold">
            <td className="px-4 py-2">{t("EInvoicingReports.table.total_row")}</td>
            <td className="px-4 py-2 text-end">{fmt3(totals.sales_total)}</td>
            <td className="px-4 py-2 text-end">{fmt3(totals.refunds_total)}</td>
            <td className="px-4 py-2 text-end">{fmt3(totals.before_tax)}</td>
            <td className="px-4 py-2 text-end">{fmt3(totals.tax_amount)}</td>
            <td className="px-4 py-2 text-end">{fmt3(totals.grand_total)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

  return (
    <div className="flex flex-col h-full">

{/* ===== Header ===== */}
<div className="flex items-end justify-between gap-4 p-4 border-b bg-white">

  {/* ================= LEFT SIDE ================= */}
  <div className="flex items-end gap-4 flex-wrap">

    {/* Report */}
    <div>
      <label className="block text-xs text-gray-500 mb-1">
        {t("EInvoicingReports.filters.report")}
      </label>
      <select
        value={reportType}
        onChange={(e) => setReportType(e.target.value)}
        className="border rounded px-3 py-2 text-sm bg-white"
      >
        <option value={REPORTS.SHARED}>{t("EInvoicingReports.report_types.shared")}</option>
        <option value={REPORTS.TAX}>{t("EInvoicingReports.report_types.tax")}</option>
        <option value={REPORTS.INVOICE_TAX_SUMMARY}>
          {t("EInvoicingReports.report_types.invoice_tax_summary")}
        </option>
      </select>
    </div>

    {/* From */}
    <div>
      <label className="block text-xs text-gray-500 mb-1">
        {t("EInvoicingReports.filters.from")}
      </label>
      <input
        type="date"
        lang="en"
        dir="ltr"
        value={dateFrom}
        onChange={(e) => setDateFrom(e.target.value)}
        className="border rounded px-3 py-2 text-sm"
      />
    </div>

    {/* To */}
    <div>
      <label className="block text-xs text-gray-500 mb-1">
        {t("EInvoicingReports.filters.to")}
      </label>
      <input
        type="date"
        lang="en"
        dir="ltr"
        value={dateTo}
        onChange={(e) => setDateTo(e.target.value)}
        className="border rounded px-3 py-2 text-sm"
      />
    </div>

    {/* Status (Shared report only) */}
    {reportType === REPORTS.SHARED && (
      <div>
        <label className="block text-xs text-gray-500 mb-1">
          {t("EInvoicingReports.filters.status")}
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border rounded px-3 py-2 text-sm bg-white"
        >
          <option value="unshared">{t("EInvoicingReports.status_types.unshared")}</option>
          <option value="shared">{t("EInvoicingReports.status_types.shared")}</option>
        </select>
      </div>
    )}

    {/* Apply */}
    <button
      onClick={handleApply}
      className="h-10 px-6 rounded-lg bg-[#2f788a] text-white text-sm font-medium hover:bg-[#276472]"
    >
      {t("EInvoicingReports.filters.apply")}
    </button>
  </div>

  {/* ================= RIGHT SIDE ================= */}
  <div>
    <button
onClick={async () => {
  if (reportType === REPORTS.SHARED) {
    await fetchEInvoicingForPrint();
    setPendingPrint(true);
    return;
  }

  if (reportType === REPORTS.TAX) {
    if (!taxData) {
      await fetchTaxDeclaration();
    }
    setPendingPrint(true);
    return;
  }

  if (!invoiceTaxData) {
    await fetchInvoiceTaxSummary();
  }
  setPendingPrint(true);
}}
      className="h-10 px-6 rounded-lg border text-sm"
    >
      {t("EInvoicingReports.actions.print")}
    </button>
  </div>

</div>


      {/* ===== CONTENT ===== */}
      <div className="flex-1 overflow-auto p-4">
        {/* ===== Shared / Unshared Table ===== */}
        {reportType === REPORTS.SHARED && (
          <div className="overflow-x-auto">
          <table className="min-w-[680px] w-full text-sm border">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-start">{t("EInvoicingReports.table.invoice")}</th>
                <th className="px-4 py-2 text-start">{t("EInvoicingReports.table.date")}</th>
                <th className="px-4 py-2 text-start">{t("EInvoicingReports.table.client")}</th>
                <th className="px-4 py-2 text-start">{t("EInvoicingReports.table.total")}</th>
                <th className="px-4 py-2 text-center">{t("EInvoicingReports.table.status")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.invoice_number} className="border-t">
                  <td className="px-4 py-2">{r.invoice_number}</td>
                  <td className="px-4 py-2">{r.date}</td>
                  <td className="px-4 py-2">{r.client}</td>
                  <td className="px-4 py-2 text-start">
                    {Number(r.total).toFixed(3)}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {r.qr && r.qr !== "123456789" ? t("EInvoicingReports.status_types.shared") : t("EInvoicingReports.status_types.unshared")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}

        {/* ===== Tax Declaration ===== */}
{reportType === REPORTS.TAX && taxData && (
  <div className="space-y-6">
    <TaxBucketsSection
      title={t("EInvoicingReports.tax_sections.export")}
rows={[
  { label: "0 %", ...(taxData.export_sales?.zero_tax || {}) },
  { label: t("EInvoicingReports.tax_sections.exempt"), ...(taxData.export_sales?.exempt || {}) },
].filter(keepRow)}
    />

    <TaxBucketsSection
      title={t("EInvoicingReports.tax_sections.development") || "Development Sales"}
rows={[
  { label: "0 %", ...(taxData.development_sales?.zero_tax || {}) },
  { label: t("EInvoicingReports.tax_sections.exempt"), ...(taxData.development_sales?.exempt || {}) },
].filter(keepRow)}
    />

<LocalBucketsSection
  title={t("EInvoicingReports.tax_sections.local")}
  rows={[
    // IMPORTANT: keep exempt label as "EXEMPT" (not 0%)
    { label: t("EInvoicingReports.tax_sections.exempt"), ...(taxData.local_sales?.exempt || {}) },

    // taxed buckets: 0%..16%
    ...Array.from({ length: 17 }, (_, i) => ({
      label: `${i} %`,
      ...(taxData.local_sales?.taxed?.[i] || {}),
    })),
  ].filter(keepRow)}
/>

    <TaxBucketsSection
      title={t("EInvoicingReports.tax_sections.grand_total")}
      rows={[
        {
          label: "TOTAL",
          sales_total: taxData.totals?.sales_total || 0,
          refunds_total: taxData.totals?.refunds_total || 0,
          grand_total: taxData.totals?.grand_total || 0,
        },
      ]}
      bold
    />
  </div>
)}

        {reportType === REPORTS.INVOICE_TAX_SUMMARY && invoiceTaxData && (
          <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
            <table className="min-w-[680px] w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-start">
                    {t("EInvoicingReports.table.invoice")}
                  </th>
                  <th className="px-4 py-2 text-end">
                    {t("EInvoicingReports.table.invoice_total")}
                  </th>
                  <th className="px-4 py-2 text-end">
                    {t("EInvoicingReports.table.total_tax")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {(invoiceTaxData.rows || []).map((row) => (
                  <tr key={row.invoice_number} className="border-t">
                    <td className="px-4 py-2">{row.invoice_number}</td>
                    <td className="px-4 py-2 text-end">
                      {Number(row.invoice_total || 0).toFixed(3)}
                    </td>
                    <td className="px-4 py-2 text-end font-semibold">
                      {Number(row.total_tax || 0).toFixed(3)}
                    </td>
                  </tr>
                ))}
                <tr className="border-t bg-gray-50 font-semibold">
                  <td className="px-4 py-2">{t("EInvoicingReports.table.total_row")}</td>
                  <td className="px-4 py-2 text-end">
                    {Number(invoiceTaxData.totals?.invoice_total || 0).toFixed(3)}
                  </td>
                  <td className="px-4 py-2 text-end">
                    {Number(invoiceTaxData.totals?.total_tax || 0).toFixed(3)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
<div className="hidden">
  {company && reportType === REPORTS.SHARED && (
    <EInvoicingTransferReportPrint
      ref={printRef}
      rows={printRows}
      dateFrom={dateFrom}
      dateTo={dateTo}
      totalSum={totalSum}
      totalCount={totalCount}
      company={company}
      status={status}
    />
  )}

  {company && reportType === REPORTS.TAX && taxData && (
    <TaxDeclarationReportPrint
      ref={printRef}
      company={company}
      dateFrom={dateFrom}
      dateTo={dateTo}
      taxData={taxData}
    />
  )}

  {company && reportType === REPORTS.INVOICE_TAX_SUMMARY && invoiceTaxData && (
    <InvoiceTaxSummaryReportPrint
      ref={printRef}
      company={company}
      dateFrom={dateFrom}
      dateTo={dateTo}
      reportData={invoiceTaxData}
    />
  )}
</div>

      {/* ===== Footer ===== */}
{reportType === REPORTS.SHARED && (
  <div className="flex justify-between items-center px-4 py-3 border-t bg-gray-50 text-xs text-gray-600">

    {/* LEFT */}
    <span>
      {t("EInvoicingReports.footer.showing")}{" "}
      {offset + 1}-{Math.min(offset + rows.length, totalCount)} / {totalCount}
    </span>

    {/* CENTER – PAGINATION */}
    <div className="flex items-center gap-4 text-sm">
      <button
        onClick={goPrev}
        disabled={!canGoPrev}
        className={`px-2 py-1 rounded border ${
          canGoPrev ? "hover:bg-gray-200" : "opacity-40 cursor-not-allowed"
        }`}
      >
        {"<"}
      </button>

      <button
        onClick={goNext}
        disabled={!canGoNext}
        className={`px-2 py-1 rounded border ${
          canGoNext ? "hover:bg-gray-200" : "opacity-40 cursor-not-allowed"
        }`}
      >
        {">"}
      </button>
    </div>

    {/* RIGHT */}
    <span>
      {t("EInvoicingReports.footer.total")} : {Number(totalSum).toFixed(3)}
    </span>

  </div>
)}

    </div>
  );
}

/* ===== Tax Section Component ===== */
function TaxSection({ title, rows, bold = false }) {
  if (!rows || rows.length === 0) return null;

  // Sort by tax percentage DESC (LOCAL: 16 → 10 → 8 → 0)
  const sortedRows = [...rows].sort((a, b) => {
    const pa = a.percentage ?? -1;
    const pb = b.percentage ?? -1;
    return pb - pa;
  });
const {t} = useTranslation();
  // Section totals
  const totals = sortedRows.reduce(
    (acc, r) => {
      acc.total_sales += Number(r.total_sales || 0);
      acc.total_tax += Number(r.total_tax || 0);
      acc.total_with_tax += Number(r.total_with_tax || 0);
      return acc;
    },
    { total_sales: 0, total_tax: 0, total_with_tax: 0 }
  );

  return (
    <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
      {/* Section Header */}
      <div className="px-4 py-3 border-b bg-gray-50">
        <h3 className="font-semibold text-gray-700 tracking-wide">
          {title}
        </h3>
      </div>

      {/* Table */}
      <table className="min-w-[720px] w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 text-left w-20">%</th>
            <th className="px-4 py-2 text-right">{t("EInvoicingReports.table.total_no_tax")}</th>
            <th className="px-4 py-2 text-right">{t("EInvoicingReports.table.tax")}</th>
            <th className="px-4 py-2 text-right">{t("EInvoicingReports.table.total_incl")}</th>
          </tr>
        </thead>

        <tbody>
          {sortedRows.map((r, i) => (
            <tr
              key={i}
              className={`border-t ${
                bold ? "font-semibold" : ""
              }`}
            >
              <td className="px-4 py-2">
                {r.percentage ?? "—"}
              </td>
              <td className="px-4 py-2 text-right">
                {Number(r.total_sales).toFixed(3)}
              </td>
              <td className="px-4 py-2 text-right">
                {Number(r.total_tax).toFixed(3)}
              </td>
              <td className="px-4 py-2 text-right">
                {Number(r.total_with_tax).toFixed(3)}
              </td>
            </tr>
          ))}

          {/* Totals Row */}
          <tr className="border-t bg-gray-50 font-semibold">
            <td className="px-4 py-2">TOTAL</td>
            <td className="px-4 py-2 text-right">
              {totals.total_sales.toFixed(3)}
            </td>
            <td className="px-4 py-2 text-right">
              {totals.total_tax.toFixed(3)}
            </td>
            <td className="px-4 py-2 text-right">
              {totals.total_with_tax.toFixed(3)}
            </td>
          </tr>
        </tbody>
      </table>
      
    </div>
  );
}
