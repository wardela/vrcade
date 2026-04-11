import { useEffect, useState } from "react";
import api from "../../utils/axiosInstance";
import ClientList from "../invoices/clientlist";
import { useRef } from "react";
import { useReactToPrint } from "@/utils/useAppReactToPrint";
import GeneralSalesReportPrint from "./printables/GeneralSalesReportPrint";
import SalesByClientReportPrint from "./printables/SalesByClientReportPrint";
import SalesByAreaReportPrint from "./printables/SalesByAreaReportPrint";
import SalesByClientDetailedReportPrint from "./printables/SalesByClientDetailedReportPrint";
import ItemsSoldForClientTotalsReportPrint from "./printables/ItemsSoldForClientTotalsReportPrint";
import SalesRefundsCombinedReport from "./SalesRefundsCombinedReport";
import SalesRefundsCombinedByClientReport from "./SalesRefundsCombinedByClientReport";
import { useTranslation } from "react-i18next";
const PAGE_SIZE = 100;

export default function SalesReports() {
  const [reportType, setReportType] = useState("general");

  // client report only
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [rows, setRows] = useState([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [totalSum, setTotalSum] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [pendingPrint, setPendingPrint] = useState(false);
  const [printMode, setPrintMode] = useState(null); 
  const [selectedArea, setSelectedArea] = useState("local");
  const {t} = useTranslation();
  const [company, setCompany] = useState(null);

useEffect(() => {
  api
    .get(`/api/invoices/company`)
    .then(res => setCompany(res.data))
    .catch(console.error);
}, []);

// ================= DATE HELPERS =================
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
    to: formatLocalDate(now)
  };
};


useEffect(() => {
  const { from, to } = getDefaultDateRange();

  setDateFrom(from);
  setDateTo(to);

  setSelectedClient(null);
  setClientModalOpen(false);

  setRows([]);
  setOffset(0);
  setTotalSum(0);
  setTotalCount(0);
}, [reportType]);


const fetchGeneralSales = async (newOffset = 0) => {
  if (!dateFrom || !dateTo) return;

  try {
    setLoading(true);

    const res = await api.get(
      `/api/invoices/reports/sales/general`,
      {
        params: {
          from: dateFrom,
          to: dateTo,
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
    console.error("Failed to fetch general sales report", err);
  } finally {
    setLoading(false);
  }
};

const fetchSalesByClient = async (newOffset = 0) => {
  if (!selectedClient || !dateFrom || !dateTo) return;

  try {
    setLoading(true);

    const res = await api.get(
      `/api/invoices/reports/sales/by-client`,
      {
        params: {
          from: dateFrom,
          to: dateTo,
          client_id: selectedClient.id,
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
    console.error("Failed to fetch sales by client", err);
  } finally {
    setLoading(false);
  }
};

const fetchSalesByArea = async (newOffset = 0) => {
  if (!dateFrom || !dateTo || !selectedArea) return;

  try {
    setLoading(true);

    const res = await api.get(
      `/api/invoices/reports/sales/by-area`,
      {
        params: {
          from: dateFrom,
          to: dateTo,
          area: selectedArea,
          limit: PAGE_SIZE,
          offset: newOffset
        }
      }
    );

    setRows(res.data.rows || []);
    setTotalSum(res.data.total_sum || 0);
    setTotalCount(res.data.total_count || 0);
    setOffset(newOffset);
  } finally {
    setLoading(false);
  }
};

const fetchSalesByClientDetailed = async (newOffset = 0) => {
  if (!selectedClient || !dateFrom || !dateTo) return;

  try {
    setLoading(true);

    const res = await api.get(
      `/api/invoices/reports/sales/by-client-detailed`,
      {
        params: {
          from: dateFrom,
          to: dateTo,
          client_id: selectedClient.id,
          limit: PAGE_SIZE,
          offset: newOffset
        }
      }
    );

    setRows(res.data.rows || []);
    setTotalCount(res.data.total_count || 0);

    // IMPORTANT: this report DOES NOT return total_sum
    setTotalSum(0);

    setOffset(newOffset);
  } catch (err) {
    console.error("Failed to fetch sales by client detailed", err);
  } finally {
    setLoading(false);
  }
};

const fetchItemsSoldForClientTotals = async (newOffset = 0) => {
  if (!selectedClient || !dateFrom || !dateTo) return;

  try {
    setLoading(true);

    const res = await api.get(
      `/api/invoices/reports/sales/items-by-client-totals`,
      {
        params: {
          from: dateFrom,
          to: dateTo,
          client_id: selectedClient.id,
          limit: PAGE_SIZE,
          offset: newOffset
        }
      }
    );

    setRows(res.data.rows || []);
    setTotalCount(res.data.total_count || 0);
    setOffset(newOffset);

    // No totalSum in this report
    setTotalSum(0);
  } catch (err) {
    console.error("Failed to fetch items sold for client totals", err);
  } finally {
    setLoading(false);
  }
};
const combinedRef = useRef();
const combinedByClientRef = useRef();
const applyReport = async () => {
  if (reportType === "general") {
    fetchGeneralSales();
  }

  if (reportType === "demographic") {
  fetchSalesByArea();
}

if (reportType === "by_client_detailed") {
  if (!selectedClient) return;
  fetchSalesByClientDetailed();
}

if (reportType === "sales_refunds_combined") {
  combinedRef.current?.apply();
}

if (reportType === "sales_refunds_combined_by_client") {
  if (!selectedClient) return;
  combinedByClientRef.current?.apply();
}

if (reportType === "by_client_items_totals") {
  if (!selectedClient) return;
  fetchItemsSoldForClientTotals();
}

  if (reportType === "by_client") {
    if (!selectedClient) return;
    fetchSalesByClient();
  }
};

const printRef = useRef();
const [printRows, setPrintRows] = useState([]);

const fetchGeneralSalesForPrint = async () => {
  const res = await api.get(
    `/api/invoices/reports/sales/general`,
    {
      params: {
        from: dateFrom,
        to: dateTo,
        limit: 1000000,
        offset: 0
      }
    }
  );

  setPrintRows(res.data.rows || []);
  return res.data;
};

const fetchSalesByClientForPrint = async () => {
  if (!selectedClient) return;

  const res = await api.get(
    `/api/invoices/reports/sales/by-client`,
    {
      params: {
        from: dateFrom,
        to: dateTo,
        client_id: selectedClient.id,
        limit: 1000000,
        offset: 0
      }
    }
  );

  setPrintRows(res.data.rows || []);
  return res.data;
};

const fetchSalesByAreaForPrint = async () => {
  const res = await api.get(
    `/api/invoices/reports/sales/by-area`,
    {
      params: {
        from: dateFrom,
        to: dateTo,
        area: selectedArea,
        limit: 1000000,
        offset: 0
      }
    }
  );

  setPrintRows(res.data.rows || []);
  return res.data;
};

const fetchSalesByClientDetailedForPrint = async () => {
  if (!selectedClient) return;

  const res = await api.get(
    `/api/invoices/reports/sales/by-client-detailed`,
    {
      params: {
        from: dateFrom,
        to: dateTo,
        client_id: selectedClient.id,
        limit: 1000000,
        offset: 0
      }
    }
  );

  setPrintRows(res.data.rows || []);
  return res.data;
};

const fetchItemsSoldForClientTotalsForPrint = async () => {
  if (!selectedClient) return;

  const res = await api.get(
    `/api/invoices/reports/sales/items-by-client-totals`,
    {
      params: {
        from: dateFrom,
        to: dateTo,
        client_id: selectedClient.id,
        limit: 1000000,
        offset: 0
      }
    }
  );

  setPrintRows(res.data.rows || []);
  return res.data;
};

const handlePrint = useReactToPrint({
  content: () => printRef.current,
  documentTitle: "General Sales Report",
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
  `
});

useEffect(() => {
  if (pendingPrint && printRows.length > 0) {
    handlePrint();
    setPendingPrint(false);
  }
}, [pendingPrint, printRows]);

const canApplyReport = (() => {
  if (loading) return false;
  if (!dateFrom || !dateTo) return false;

if (
  reportType === "by_client" ||
  reportType === "by_client_detailed" ||
  reportType === "by_client_items_totals" ||
  reportType === "sales_refunds_combined_by_client"
) {
  return !!selectedClient;
}


  if (reportType === "demographic") {
    return !!selectedArea;
  }

  return true; // general, others
})();

const getInvoiceGroupColor = (rows) => {
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

  return (
    <div className="w-full h-full flex flex-col space-y-2 min-h-0">
{/* ===== Header / Filters Bar ===== */}
<div className="flex items-end justify-between gap-4 p-4 bg-white border rounded-lg shadow-sm">

  {/* ================= LEFT SIDE ================= */}
  <div className="flex items-end gap-4 flex-wrap">

    {/* Report Selector */}
    <div>
      <label className="block text-xs text-gray-500 mb-1">
        {t("SalesReports.filters.report")}
      </label>
      <select
        value={reportType}
        onChange={(e) => setReportType(e.target.value)}
        className="px-3 py-2 border rounded-md text-sm bg-white"
      >
        <option value="general">{t("SalesReports.report_types.general")}</option>
        <option value="by_client">{t("SalesReports.report_types.by_client")}</option>
        <option value="demographic">{t("SalesReports.report_types.by_area")}</option>
        <option value="currency">{t("SalesReports.report_types.by_currency")}</option>
        <option value="by_client_detailed">
          {t("SalesReports.report_types.by_client_detailed")}
        </option>
        <option value="by_client_items_totals">
          {t("SalesReports.report_types.by_client_items_totals")}
        </option>
        <option value="sales_refunds_combined">
  {t("SalesReports.report_types.sales_refunds_combined")}
</option>
<option value="sales_refunds_combined_by_client">
  {t("SalesReports.report_types.sales_refunds_combined_by_client")}
</option>
      </select>
    </div>

    {/* Date From */}
    <div>
      <label className="block text-xs text-gray-500 mb-1">
        {t("SalesReports.filters.from")}
      </label>
      <input
        type="date"
        value={dateFrom}
        onChange={(e) => setDateFrom(e.target.value)}
        className="h-10 px-3 border rounded-md text-sm"
      />
    </div>

    {/* Date To */}
    <div>
      <label className="block text-xs text-gray-500 mb-1">
        {t("SalesReports.filters.to")}
      </label>
      <input
        type="date"
        value={dateTo}
        onChange={(e) => setDateTo(e.target.value)}
        className="h-10 px-3 border rounded-md text-sm"
      />
    </div>

    {/* Select Client */}
{(reportType === "by_client" ||
  reportType === "by_client_detailed" ||
  reportType === "by_client_items_totals" ||
  reportType === "sales_refunds_combined_by_client")
      && (
      <button
        onClick={() => setClientModalOpen(true)}
        className="
          h-10 px-4
          rounded-lg
          bg-[#2f788a]
          text-white
          font-medium
          hover:bg-[#256273]
          transition
        "
      >
        {t("SalesReports.filters.select_client")}
      </button>
    )}

    {/* Selected Client Display */}
    {(reportType === "by_client" ||
      reportType === "by_client_detailed" ||
      reportType === "sales_refunds_combined_by_client" ||
      reportType === "by_client_items_totals") && selectedClient && (
      <div>
        <label className="block text-xs text-gray-500 mb-1">
          {t("SalesReports.filters.selected_client")}
        </label>
        <div
          className="
            h-10 px-3
            rounded-md
            bg-gray-50
            text-gray-700
            border border-gray-200
            flex items-center
            gap-2
            select-none
          "
        >
          <span className="text-gray-400">{t("SalesReports.table.client")}</span>
          <span className="w-px h-4 bg-gray-300" />
          <span className="font-medium">{selectedClient.name}</span>
        </div>
      </div>
    )}
{reportType === "demographic" && (
  <div>
    <label className="block text-xs text-gray-500 mb-1">
      {t("SalesReports.filters.area")}
    </label>
    <select
      value={selectedArea}
      onChange={(e) => setSelectedArea(e.target.value)}
      className="h-10 px-3 border rounded-md text-sm bg-white"
    >
      <option value="local">{t("SalesReports.areas.local")}</option>
      <option value="export">{t("SalesReports.areas.export")}</option>
      <option value="development">{t("SalesReports.areas.development")}</option>
    </select>
  </div>
)}

    {/* Apply */}
<button
  onClick={applyReport}
  disabled={!canApplyReport}
  className={`
    h-10 px-6 rounded-lg text-sm font-medium
    transition
    ${
      canApplyReport
        ? "bg-[#2f788a] text-white hover:bg-[#256273]"
        : "bg-gray-200 text-gray-400 cursor-not-allowed"
    }
  `}
>
   {t("SalesReports.filters.apply")}
</button>

  </div>

  {/* ================= RIGHT SIDE ================= */}
  <div>
    <button
      onClick={async () => {
        if (reportType === "general") {
          setPrintMode("general");
          await fetchGeneralSalesForPrint();
          setPendingPrint(true);
        }
        if (reportType === "by_client_detailed") {
  if (!selectedClient) return;
  setPrintMode("by_client_detailed");
  await fetchSalesByClientDetailedForPrint();
  setPendingPrint(true);
}
if (reportType === "demographic") {
  setPrintMode("by_area");
  await fetchSalesByAreaForPrint();
  setPendingPrint(true);
}
if (reportType === "by_client_items_totals") {
  if (!selectedClient) return;
  setPrintMode("by_client_items_totals");
  await fetchItemsSoldForClientTotalsForPrint();
  setPendingPrint(true);
}
if (reportType === "sales_refunds_combined") {
  if (!company) return;
  await combinedRef.current?.print();
}
if (reportType === "sales_refunds_combined_by_client") {
  if (!company || !selectedClient) return;
  await combinedByClientRef.current?.print();
}
        if (reportType === "by_client") {
          if (!selectedClient) return;
          setPrintMode("by_client");
          await fetchSalesByClientForPrint();
          setPendingPrint(true);
        }
      }}
      className="h-10 px-6 rounded-lg border text-sm bg-white"
    >
      {t("SalesReports.actions.print")}
    </button>
  </div>

</div>
{reportType === "sales_refunds_combined" && (
  <SalesRefundsCombinedReport
    ref={combinedRef}
    dateFrom={dateFrom}
    dateTo={dateTo}
    company={company}
    pageSize={PAGE_SIZE}
  />
)}
{reportType === "sales_refunds_combined_by_client" && (
  <SalesRefundsCombinedByClientReport
    ref={combinedByClientRef}
    dateFrom={dateFrom}
    dateTo={dateTo}
    company={company}
    selectedClient={selectedClient}
    pageSize={PAGE_SIZE}
  />
)}
      {/* ================= GENERAL SALES TABLE ================= */}
      {reportType === "general" && (
  <div className="border rounded-lg bg-white flex flex-col flex-1 min-h-0">
    
    {/* Scrollable table area */}
    <div className="flex-1 min-h-0 overflow-y-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 sticky top-0 z-10">
          <tr>
            <th className="px-4 py-3 text-start">{t("SalesReports.table.invoice")}</th>
            <th className="px-4 py-3 text-start">{t("SalesReports.table.date")}</th>
            <th className="px-4 py-3 text-start">{t("SalesReports.table.client")}</th>
            <th className="px-4 py-3 text-center">{t("SalesReports.table.type")}</th>
            <th className="px-4 py-3 text-end">{t("SalesReports.table.total")}</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200">
        {loading && (
          <tr>
            <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
              {t("SalesReports.states.loading")}
            </td>
          </tr>
        )}

        {!loading && rows.length === 0 && (
          <tr>
            <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
              {t("SalesReports.states.empty")}
            </td>
          </tr>
        )}

        {!loading &&
          rows.map((r) => (
            <tr key={r.invoice_number}>
              <td className="px-4 py-2 font-medium">
                {r.invoice_number}
              </td>
              <td className="px-4 py-2">{r.date}</td>
              <td className="px-4 py-2">{r.client || "-"}</td>
              <td className="px-4 py-2 text-center capitalize">
                {r.type}
              </td>
              <td className="px-4 py-2 text-right font-medium">
                {Number(r.total).toFixed(3)}
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  </div>

  {/* Pagination (fixed, NOT scrollable) */}
<div className="flex justify-between items-center px-4 py-3 border-t bg-gray-50">
  <span className="text-xs text-gray-500">
    {t("SalesReports.summary.showing")} {rows.length} / {totalCount} 
  </span>

  <span className="text-sm font-semibold text-gray-700">
    {t("SalesReports.summary.total_sales")} : {totalSum.toFixed(3)}
  </span>

  <div className="flex gap-2">
    <button
      disabled={offset === 0 || loading}
      onClick={() => fetchGeneralSales(offset - PAGE_SIZE)}
      className="px-3 py-1 border rounded text-sm disabled:opacity-50"
    >
      {t("SalesReports.actions.previous")}
    </button>

    <button
      disabled={rows.length < PAGE_SIZE || loading}
      onClick={() => fetchGeneralSales(offset + PAGE_SIZE)}
      className="px-3 py-1 border rounded text-sm disabled:opacity-50"
    >
      {t("SalesReports.actions.next")}
    </button>
  </div>
</div>

</div>
      )}

      {/* ================= SALES BY CLIENT TABLE ================= */}
{reportType === "by_client" && (
  <div className="border rounded-lg bg-white flex flex-col flex-1 min-h-0">

    {/* Scrollable table area */}
    <div className="flex-1 min-h-0 overflow-y-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 sticky top-0 z-10">
          <tr>
            <th className="px-4 py-3 text-start">{t("SalesReports.table.invoice")}</th>
            <th className="px-4 py-3 text-start">{t("SalesReports.table.date")}</th>
            <th className="px-4 py-3 text-start">{t("SalesReports.table.client")}</th>
            <th className="px-4 py-3 text-center">{t("SalesReports.table.type")}</th>
            <th className="px-4 py-3 text-start">{t("SalesReports.table.total")}</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200">
          {loading && (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                {t("SalesReports.states.loading")}
              </td>
            </tr>
          )}

          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                {t("SalesReports.states.empty")}
              </td>
            </tr>
          )}

          {!loading &&
            rows.map((r) => (
              <tr key={r.invoice_number}>
                <td className="px-4 py-2 font-medium">
                  {r.invoice_number}
                </td>
                <td className="px-4 py-2">{r.date}</td>
                <td className="px-4 py-2">{r.client || "-"}</td>
                <td className="px-4 py-2 text-center capitalize">
                  {r.type}
                </td>
                <td className="px-4 py-2 text-start font-medium">
                  {Number(r.total).toFixed(3)}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>

    {/* Pagination */}
    <div className="flex justify-between items-center px-4 py-3 border-t bg-gray-50">
      <span className="text-xs text-gray-500">
        {t("SalesReports.summary.showing")} {rows.length} / {totalCount} 
      </span>

      <span className="text-sm font-semibold text-gray-700">
        {t("SalesReports.summary.total_sales")} : {totalSum.toFixed(3)}
      </span>

      <div className="flex gap-2">
        <button
          disabled={offset === 0 || loading}
          onClick={() => fetchSalesByClient(offset - PAGE_SIZE)}
          className="px-3 py-1 border rounded text-sm disabled:opacity-50"
        >
          {t("SalesReports.actions.previous")}
        </button>

        <button
          disabled={rows.length < PAGE_SIZE || loading}
          onClick={() => fetchSalesByClient(offset + PAGE_SIZE)}
          className="px-3 py-1 border rounded text-sm disabled:opacity-50"
        >
          {t("SalesReports.actions.next")}
        </button>
      </div>
    </div>
  </div>
)}

{/* ================= SALES BY AREA TABLE ================= */}
{reportType === "demographic" && (
  <div className="border rounded-lg bg-white flex flex-col flex-1 min-h-0">

    {/* Scrollable table */}
    <div className="flex-1 min-h-0 overflow-y-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 sticky top-0 z-10">
          <tr>
            <th className="px-4 py-3 text-start">{t("SalesReports.table.invoice")}</th>
            <th className="px-4 py-3 text-start">{t("SalesReports.table.date")}</th>
            <th className="px-4 py-3 text-start">{t("SalesReports.table.client")}</th>
            <th className="px-4 py-3 text-center">{t("SalesReports.table.area")}</th>
            <th className="px-4 py-3 text-start">{t("SalesReports.table.total")}</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200">
          {loading && (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                {t("SalesReports.states.loading")}
              </td>
            </tr>
          )}

          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                {t("SalesReports.states.empty")}
              </td>
            </tr>
          )}

          {!loading &&
            rows.map((r) => (
              <tr key={r.invoice_number}>
                <td className="px-4 py-2 font-medium">
                  {r.invoice_number}
                </td>
                <td className="px-4 py-2">{r.date}</td>
                <td className="px-4 py-2">{r.client || "-"}</td>
                <td className="px-4 py-2 text-center capitalize">
                  {selectedArea}
                </td>
                <td className="px-4 py-2 text-start font-medium">
                  {Number(r.total).toFixed(3)}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>

    {/* Pagination */}
    <div className="flex justify-between items-center px-4 py-3 border-t bg-gray-50">
      <span className="text-xs text-gray-500">
        {t("SalesReports.summary.showing")} {rows.length} / {totalCount} 
      </span>

      <span className="text-sm font-semibold text-gray-700">
         {t("SalesReports.summary.total_sales")} : {Number(totalSum).toFixed(3)}
      </span>

      <div className="flex gap-2">
        <button
          disabled={offset === 0 || loading}
          onClick={() => fetchSalesByArea(offset - PAGE_SIZE)}
          className="px-3 py-1 border rounded text-sm disabled:opacity-50"
        >
          {t("SalesReports.actions.previous")}
        </button>

        <button
          disabled={rows.length < PAGE_SIZE || loading}
          onClick={() => fetchSalesByArea(offset + PAGE_SIZE)}
          className="px-3 py-1 border rounded text-sm disabled:opacity-50"
        >
          {t("SalesReports.actions.next")}
        </button>
      </div>
    </div>
  </div>
)}

{/* ================= SALES BY CLIENT (DETAILED) TABLE ================= */}
{reportType === "by_client_detailed" && (
  <div className="border rounded-lg bg-white flex flex-col flex-1 min-h-0">

    {/* Scrollable table area */}
    <div className="flex-1 min-h-0 overflow-y-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 sticky top-0 z-10">
          <tr>
            <th className="px-4 py-3 text-start">
              {t("SalesReports.table.invoice")}
            </th>
            <th className="px-4 py-3 text-start">
              {t("SalesReports.table.date")}
            </th>
            <th className="px-4 py-3 text-start">
              {t("SalesReports.table.item")}
            </th>
            <th className="px-4 py-3 text-center">
              {t("SalesReports.table.qty")}
            </th>
            <th className="px-4 py-3 text-end">
              {t("SalesReports.table.price")}
            </th>
            <th className="px-4 py-3 text-end">
              {t("SalesReports.table.discount")}
            </th>
            <th className="px-4 py-3 text-end">
              {t("SalesReports.table.total")}
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200">
          {loading && (
            <tr>
              <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                {t("SalesReports.states.loading")}
              </td>
            </tr>
          )}

          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                {t("SalesReports.states.empty")}
              </td>
            </tr>
          )}

          {!loading &&
            getInvoiceGroupColor(rows).map((r, idx) => (
             <tr
                key={`${r.invoice_number}-${idx}`}
                className={
                  r._groupIndex % 2 === 0
                    ? "bg-gray-50"
                    : "bg-white"
                }
              >
                <td className="px-4 py-2 font-medium">
                  {r.invoice_number}
                </td>
                <td className="px-4 py-2">
                  {r.invoice_date}
                </td>
                <td className="px-4 py-2">
                  {r.item_name || "-"}
                </td>
                <td className="px-4 py-2 text-center">
                  {Number(r.qty)}
                </td>
                <td className="px-4 py-2 text-end">
                  {Number(r.price).toFixed(3)}
                </td>
                <td className="px-4 py-2 text-end">
                  {Number(r.discount || 0).toFixed(3)}
                </td>
                <td className="px-4 py-2 text-end font-medium">
                  {Number(r.total).toFixed(3)}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>

    {/* Pagination */}
    <div className="flex justify-between items-center px-4 py-3 border-t bg-gray-50">
      <span className="text-xs text-gray-500">
        {t("SalesReports.summary.showing")} {rows.length} / {totalCount}
      </span>

      {/* No totalSum here on purpose */}
      <span className="text-sm font-semibold text-gray-400">
        —
      </span>

      <div className="flex gap-2">
        <button
          disabled={offset === 0 || loading}
          onClick={() => fetchSalesByClientDetailed(offset - PAGE_SIZE)}
          className="px-3 py-1 border rounded text-sm disabled:opacity-50"
        >
          {t("SalesReports.actions.previous")}
        </button>

        <button
          disabled={rows.length < PAGE_SIZE || loading}
          onClick={() => fetchSalesByClientDetailed(offset + PAGE_SIZE)}
          className="px-3 py-1 border rounded text-sm disabled:opacity-50"
        >
          {t("SalesReports.actions.next")}
        </button>
      </div>
    </div>
  </div>
)}

{/* ================= ITEMS SOLD FOR CLIENT (TOTALS) ================= */}
{reportType === "by_client_items_totals" && (
  <div className="border rounded-lg bg-white flex flex-col flex-1 min-h-0">

    {/* Scrollable table area */}
    <div className="flex-1 min-h-0 overflow-y-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 sticky top-0 z-10">
          <tr>
            <th className="px-4 py-3 text-start">
              {t("SalesReports.table.item")}
            </th>
            <th className="px-4 py-3 text-start">
              {t("StorageMonitor.table.unit")}
            </th>
            <th className="px-4 py-3 text-center">
              {t("SalesReports.table.qty")}
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200">
          {loading && (
            <tr>
              <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                {t("SalesReports.states.loading")}
              </td>
            </tr>
          )}

          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                {t("SalesReports.states.empty")}
              </td>
            </tr>
          )}

          {!loading &&
            rows.map((r, idx) => (
              <tr key={idx}>
                <td className="px-4 py-2 font-medium">
                  {r.item_name}
                </td>
                <td className="px-4 py-2">
                  {r.unit || "-"}
                </td>
                <td className="px-4 py-2 text-center font-semibold">
                  {Number(r.total_qty)}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>

    {/* Pagination */}
    <div className="flex justify-between items-center px-4 py-3 border-t bg-gray-50">
      <span className="text-xs text-gray-500">
        {t("SalesReports.summary.showing")} {rows.length} / {totalCount}
      </span>

      <span className="text-sm font-semibold text-gray-400">
        —
      </span>

      <div className="flex gap-2">
        <button
          disabled={offset === 0 || loading}
          onClick={() =>
            fetchItemsSoldForClientTotals(offset - PAGE_SIZE)
          }
          className="px-3 py-1 border rounded text-sm disabled:opacity-50"
        >
          {t("SalesReports.actions.previous")}
        </button>

        <button
          disabled={rows.length < PAGE_SIZE || loading}
          onClick={() =>
            fetchItemsSoldForClientTotals(offset + PAGE_SIZE)
          }
          className="px-3 py-1 border rounded text-sm disabled:opacity-50"
        >
          {t("SalesReports.actions.next")}
        </button>
      </div>
    </div>
  </div>
)}

{reportType === "currency" &&(
   <div className="border rounded-lg bg-white flex flex-col flex-1 min-h-0 items-center justify-center ">
Reports by currency Coming Soon !</div>
)}
      {clientModalOpen && (
  <ClientList
    onSelect={(client) => {
      setSelectedClient(client);   // save full client object
      setClientModalOpen(false);   // close modal
    }}
    onClose={() => setClientModalOpen(false)}
  />
)}
<div className="hidden">
  {printMode === "general" && company && (
    <GeneralSalesReportPrint
      ref={printRef}
      rows={printRows}
      dateFrom={dateFrom}
      dateTo={dateTo}
      totalSum={totalSum}
      totalCount={totalCount}
      company={company}
    />
  )}

  {printMode === "by_area" && company && (
  <SalesByAreaReportPrint
    ref={printRef}
    rows={printRows}
    dateFrom={dateFrom}
    dateTo={dateTo}
    totalSum={totalSum}
    totalCount={totalCount}
    area={selectedArea}
    company={company}
  />
)}


  {printMode === "by_client" && (
    <SalesByClientReportPrint
      key={selectedClient?.id}
      ref={printRef}
      rows={printRows}
      dateFrom={dateFrom}
      dateTo={dateTo}
      totalSum={totalSum}
      totalCount={totalCount}
      client={selectedClient}
      company={company}
    />
  )}
  {printMode === "by_client_detailed" && company && selectedClient && (
  <SalesByClientDetailedReportPrint
    ref={printRef}
    rows={printRows}
    dateFrom={dateFrom}
    dateTo={dateTo}
    client={selectedClient}
    company={company}
  />
)}
{printMode === "by_client_items_totals" && company && selectedClient && (
  <ItemsSoldForClientTotalsReportPrint
    ref={printRef}
    rows={printRows}
    dateFrom={dateFrom}
    dateTo={dateTo}
    client={selectedClient}
    company={company}
  />
)}
</div>
    </div>
  );
}
