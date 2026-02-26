import { useEffect, useState } from "react";
import api from "../../utils/axiosInstance";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import EInvoicingTransferReportPrint from "./printables/EInvoicingTransferReportPrint";
import TaxDeclarationReportPrint from "./printables/TaxDeclarationReportPrint";
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
    TAX: "tax"
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
  api.get(`/api/invoices/company`).then(res => {
    setCompany(res.data);
  });
}, []);

const fetchEInvoicingForPrint = async () => {
  const res = await api.get(
    `/api/invoices/reports/einvoicing`,
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

  if (readyForShared || readyForTax) {
    handlePrint();
    setPendingPrint(false);
  }
}, [pendingPrint, reportType, printRows, taxData, company, handlePrint]);
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
  }, [reportType]);

  /* ===== Fetch Shared / Unshared ===== */
  const fetchSharedReport = async (newOffset = 0) => {
    if (!dateFrom || !dateTo) return;

    try {
      setLoading(true);

      const res = await api.get(
        `/api/invoices/reports/einvoicing`,
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
        `/api/invoices/reports/einvoicing/tax-declaration`,
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

  /* ===== Apply Button ===== */
  const handleApply = () => {
    if (reportType === REPORTS.SHARED) {
      fetchSharedReport(0);
    } else {
      fetchTaxDeclaration();
    }
  };

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
      </select>
    </div>

    {/* From */}
    <div>
      <label className="block text-xs text-gray-500 mb-1">
        {t("EInvoicingReports.filters.from")}
      </label>
      <input
        type="date"
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

  // TAX
  if (!taxData) {
    await fetchTaxDeclaration(); // ensures printable has data
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
          <table className="min-w-full text-sm border">
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
        )}

        {/* ===== Tax Declaration ===== */}
        {reportType === REPORTS.TAX && taxData && (
          <div className="space-y-6">
            <TaxSection title={t("EInvoicingReports.tax_sections.local")} rows={taxData.local} />
            {taxData.exempt && (
              <TaxSection title={t("EInvoicingReports.tax_sections.exempt")} rows={[taxData.exempt]} />
            )}
            <TaxSection title={t("EInvoicingReports.tax_sections.export")} rows={[taxData.export]} />
            <TaxSection
              title={t("EInvoicingReports.tax_sections.grand_total")}
              rows={[taxData.grand_totals]}
              bold
            />
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
    <div className="bg-white border rounded-lg shadow-sm">
      {/* Section Header */}
      <div className="px-4 py-3 border-b bg-gray-50">
        <h3 className="font-semibold text-gray-700 tracking-wide">
          {title}
        </h3>
      </div>

      {/* Table */}
      <table className="min-w-full text-sm">
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
