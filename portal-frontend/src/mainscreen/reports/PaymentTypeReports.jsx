import { useEffect, useRef, useState } from "react";
import api from "./apiClient";
import { useReactToPrint } from "./usePortalReactToPrint";
import PaymentTypeTotalsReportPrint from "./printables/PaymentTypeTotalsReportPrint";
import PaymentTypeDetailedReportPrint from "./printables/PaymentTypeDetailedReportPrint";
import { useTranslation } from "react-i18next";

const PAGE_SIZE = 100;
const REPORTS = {
  TOTALS: "totals",
  DETAILED: "detailed",
};
const EMPTY_TOTALS = {
  cash: 0,
  card: 0,
  transfer: 0,
  overall_total: 0,
};

const formatLocalDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getDefaultDateRange = () => {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  return {
    from: formatLocalDate(startOfYear),
    to: formatLocalDate(now),
  };
};

const normalizeTotals = (totals) => ({
  cash: Number(totals?.cash || 0),
  card: Number(totals?.card || 0),
  transfer: Number(totals?.transfer || 0),
  overall_total: Number(totals?.overall_total || 0),
});

const fmt3 = (value) => Number(value || 0).toFixed(3);

export default function PaymentTypeReports() {
  const { t } = useTranslation();
  const [reportType, setReportType] = useState(REPORTS.TOTALS);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [totals, setTotals] = useState(EMPTY_TOTALS);
  const [company, setCompany] = useState(null);
  const [printRows, setPrintRows] = useState([]);
  const [printTotals, setPrintTotals] = useState(EMPTY_TOTALS);
  const [printMode, setPrintMode] = useState(null);
  const [pendingPrint, setPendingPrint] = useState(false);
  const printRef = useRef();

  useEffect(() => {
    api
      .get("/api/portal/reports/company")
      .then((res) => setCompany(res.data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    const { from, to } = getDefaultDateRange();

    setDateFrom(from);
    setDateTo(to);
    setRows([]);
    setOffset(0);
    setTotalCount(0);
    setTotals(EMPTY_TOTALS);
  }, [reportType]);

  const fetchPaymentTypeTotals = async ({ forPrint = false } = {}) => {
    if (!dateFrom || !dateTo) return null;

    try {
      if (!forPrint) {
        setLoading(true);
      }

      const res = await api.get("/api/portal/reports/payment-types/totals", {
        params: {
          from: dateFrom,
          to: dateTo,
        },
      });

      const nextRows = res.data.rows || [];
      const nextTotals = normalizeTotals(res.data.totals);

      if (forPrint) {
        setPrintRows(nextRows);
        setPrintTotals(nextTotals);
        return res.data;
      }

      setRows(nextRows);
      setTotals(nextTotals);
      setTotalCount(nextRows.length);
      setOffset(0);
      return res.data;
    } finally {
      if (!forPrint) {
        setLoading(false);
      }
    }
  };

  const fetchPaymentTypeDetailed = async (
    newOffset = 0,
    { forPrint = false, limit = PAGE_SIZE } = {},
  ) => {
    if (!dateFrom || !dateTo) return null;

    try {
      if (!forPrint) {
        setLoading(true);
      }

      const res = await api.get("/api/portal/reports/payment-types/detailed", {
        params: {
          from: dateFrom,
          to: dateTo,
          limit,
          offset: newOffset,
        },
      });

      const nextRows = res.data.rows || [];
      const nextTotals = normalizeTotals(res.data.totals);

      if (forPrint) {
        setPrintRows(nextRows);
        setPrintTotals(nextTotals);
        return res.data;
      }

      setRows(nextRows);
      setTotals(nextTotals);
      setTotalCount(Number(res.data.total_count || 0));
      setOffset(newOffset);
      return res.data;
    } finally {
      if (!forPrint) {
        setLoading(false);
      }
    }
  };

  const applyReport = async () => {
    try {
      if (reportType === REPORTS.TOTALS) {
        await fetchPaymentTypeTotals();
      } else {
        await fetchPaymentTypeDetailed();
      }
    } catch (err) {
      console.error("Failed to fetch payment type report", err);
    }
  };

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: "Payment Type Report",
    pageStyle: `
      @page {
        size: A4;
        margin: 0 !important;
      }

      html, body {
        margin: 0 !important;
        padding: 0 !important;
      }

      * {
        box-sizing: border-box;
      }
    `,
  });

  useEffect(() => {
    if (pendingPrint && printRows.length > 0) {
      handlePrint();
      setPendingPrint(false);
    }
  }, [handlePrint, pendingPrint, printRows]);

  const triggerPrint = async () => {
    try {
      if (reportType === REPORTS.TOTALS) {
        setPrintMode(REPORTS.TOTALS);
        const data = await fetchPaymentTypeTotals({ forPrint: true });
        if ((data?.rows || []).length > 0) {
          setPendingPrint(true);
        }
        return;
      }

      setPrintMode(REPORTS.DETAILED);
      const data = await fetchPaymentTypeDetailed(0, {
        forPrint: true,
        limit: 1000000,
      });
      if ((data?.rows || []).length > 0) {
        setPendingPrint(true);
      }
    } catch (err) {
      console.error("Failed to print payment type report", err);
    }
  };

  const canApplyReport = !loading && !!dateFrom && !!dateTo;

  return (
    <div className="w-full h-full flex flex-col space-y-2 min-h-0">
      <div className="flex items-end justify-between gap-4 p-4 bg-white border rounded-lg shadow-sm">
        <div className="flex items-end gap-4 flex-wrap">
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              {t("PaymentTypeReports.filters.report")}
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm bg-white"
            >
              <option value={REPORTS.TOTALS}>
                {t("PaymentTypeReports.report_types.totals")}
              </option>
              <option value={REPORTS.DETAILED}>
                {t("PaymentTypeReports.report_types.detailed")}
              </option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">
              {t("PaymentTypeReports.filters.from")}
            </label>
            <input
              type="date"
              lang="en"
              dir="ltr"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-10 px-3 border rounded-md text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">
              {t("PaymentTypeReports.filters.to")}
            </label>
            <input
              type="date"
              lang="en"
              dir="ltr"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-10 px-3 border rounded-md text-sm"
            />
          </div>

          <button
            onClick={applyReport}
            disabled={!canApplyReport}
            className={`
              h-10 px-6 rounded-lg text-sm font-medium transition
              ${
                canApplyReport
                  ? "bg-[#2f788a] text-white hover:bg-[#256273]"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }
            `}
          >
            {t("PaymentTypeReports.filters.apply")}
          </button>
        </div>

        <div>
          <button
            onClick={triggerPrint}
            className="h-10 px-6 rounded-lg border text-sm bg-white"
          >
            {t("PaymentTypeReports.actions.print")}
          </button>
        </div>
      </div>

      {reportType === REPORTS.TOTALS && (
        <div className="border rounded-lg bg-white flex flex-col flex-1 min-h-0">
          <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto">
            <table className="min-w-[520px] w-full text-sm">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-start">
                    {t("PaymentTypeReports.table.payment_method")}
                  </th>
                  <th className="px-4 py-3 text-end">
                    {t("PaymentTypeReports.table.amount")}
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {loading && (
                  <tr>
                    <td colSpan={2} className="px-4 py-6 text-center text-gray-400">
                      {t("PaymentTypeReports.states.loading")}
                    </td>
                  </tr>
                )}

                {!loading &&
                  rows.map((row) => (
                    <tr key={row.payment_method}>
                      <td className="px-4 py-2 font-medium">
                        {t(`PaymentTypeReports.payment_methods.${row.payment_method}`)}
                      </td>
                      <td className="px-4 py-2 text-end font-medium">
                        {fmt3(row.amount)}
                      </td>
                    </tr>
                  ))}
              </tbody>

              <tfoot className="bg-gray-50 border-t">
                <tr>
                  <td className="px-4 py-3 font-semibold">
                    {t("PaymentTypeReports.table.overall_total")}
                  </td>
                  <td className="px-4 py-3 text-end font-semibold">
                    {fmt3(totals.overall_total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {reportType === REPORTS.DETAILED && (
        <div className="border rounded-lg bg-white flex flex-col flex-1 min-h-0">
          <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto">
            <table className="min-w-[680px] w-full text-sm">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-start">
                    {t("PaymentTypeReports.table.invoice")}
                  </th>
                  <th className="px-4 py-3 text-end">
                    {t("PaymentTypeReports.table.cash")}
                  </th>
                  <th className="px-4 py-3 text-end">
                    {t("PaymentTypeReports.table.card")}
                  </th>
                  <th className="px-4 py-3 text-end">
                    {t("PaymentTypeReports.table.bank_transfer")}
                  </th>
                  <th className="px-4 py-3 text-end">
                    {t("PaymentTypeReports.table.total")}
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {loading && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                      {t("PaymentTypeReports.states.loading")}
                    </td>
                  </tr>
                )}

                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                      {t("PaymentTypeReports.states.empty")}
                    </td>
                  </tr>
                )}

                {!loading &&
                  rows.map((row) => (
                    <tr key={row.invoice_number}>
                      <td className="px-4 py-2 font-medium">{row.invoice_number}</td>
                      <td className="px-4 py-2 text-end">{fmt3(row.cash)}</td>
                      <td className="px-4 py-2 text-end">{fmt3(row.card)}</td>
                      <td className="px-4 py-2 text-end">{fmt3(row.transfer)}</td>
                      <td className="px-4 py-2 text-end font-medium">{fmt3(row.total)}</td>
                    </tr>
                  ))}
              </tbody>

              <tfoot className="bg-gray-50 border-t sticky bottom-0">
                <tr className="font-semibold">
                  <td className="px-4 py-3">
                    {t("PaymentTypeReports.table.totals")}
                  </td>
                  <td className="px-4 py-3 text-end">{fmt3(totals.cash)}</td>
                  <td className="px-4 py-3 text-end">{fmt3(totals.card)}</td>
                  <td className="px-4 py-3 text-end">{fmt3(totals.transfer)}</td>
                  <td className="px-4 py-3 text-end">{fmt3(totals.overall_total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex justify-between items-center px-4 py-3 border-t bg-gray-50">
            <span className="text-xs text-gray-500">
              {t("PaymentTypeReports.summary.showing")} {rows.length} / {totalCount}
            </span>

            <span className="text-sm font-semibold text-gray-700">
              {t("PaymentTypeReports.summary.overall_total")} : {fmt3(totals.overall_total)}
            </span>

            <div className="flex gap-2">
              <button
                disabled={offset === 0 || loading}
                onClick={() => fetchPaymentTypeDetailed(offset - PAGE_SIZE)}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50"
              >
                {t("PaymentTypeReports.actions.previous")}
              </button>

              <button
                disabled={rows.length < PAGE_SIZE || loading}
                onClick={() => fetchPaymentTypeDetailed(offset + PAGE_SIZE)}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50"
              >
                {t("PaymentTypeReports.actions.next")}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="hidden">
        {printMode === REPORTS.TOTALS && company && (
          <PaymentTypeTotalsReportPrint
            ref={printRef}
            company={company}
            dateFrom={dateFrom}
            dateTo={dateTo}
            rows={printRows}
            totals={printTotals}
          />
        )}

        {printMode === REPORTS.DETAILED && company && (
          <PaymentTypeDetailedReportPrint
            ref={printRef}
            company={company}
            dateFrom={dateFrom}
            dateTo={dateTo}
            rows={printRows}
            totals={printTotals}
          />
        )}
      </div>
    </div>
  );
}
