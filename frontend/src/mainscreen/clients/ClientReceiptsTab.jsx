import { useRef, useEffect, useState } from "react";
import { useReactToPrint } from "@/utils/useAppReactToPrint";
import ReceiptVoucherPrint from "../receipts/ReceiptVoucherPrint";
import api from "../../utils/axiosInstance";
import BalanceModal from "../receipts/BalanceModal";
import DeleteBalanceModal from "../receipts/deletebalanceomodal";
import ReceiptVoucherModal from "../receipts/ReceiptVoucherModal";
import CreateReceiptModal from "../receipts/CreateReceiptModal";
import DeleteReceiptVoucherModal from "../receipts/DeleteReceiptVoucherModal";
import { useTranslation } from "react-i18next";
import ClientReceiptsReportPrint from "../reports/printables/ClientReceiptsReportPrint";
import DueBalancePrint from "../receipts/DueBalancePrint";

export default function ClientReceiptsTab({ client }) {
  // =========================
  // State
  // =========================
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1
  });

  // =========================
// Permissions
// =========================
let permissions = {};

try {
  const raw = localStorage.getItem("permissions");
  permissions = raw ? JSON.parse(raw) : {};
} catch {
  permissions = {};
}

const canView = permissions?.receipts?.view === true;
const canAdd = permissions?.receipts?.add === true;
const canEdit = permissions?.receipts?.edit === true;
const canDelete = permissions?.receipts?.delete === true;


  const [loading, setLoading] = useState(false);
  const [expandedDue, setExpandedDue] = useState(null);
  const [vouchers, setVouchers] = useState({});

  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [balanceModalMode, setBalanceModalMode] = useState("create");
  const [activeBalanceId, setActiveBalanceId] = useState(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteBalanceId, setDeleteBalanceId] = useState(null);

  const [rvModalOpen, setRvModalOpen] = useState(false);
  const [rvModalMode, setRvModalMode] = useState("create");
  const [activeRvId, setActiveRvId] = useState(null);
  const [activeRvDueId, setActiveRvDueId] = useState(null);

  const [createReceiptOpen, setCreateReceiptOpen] = useState(false);

  const [deleteRvModalOpen, setDeleteRvModalOpen] = useState(false);
  const [deleteRvId, setDeleteRvId] = useState(null);
  const [deleteRvDueId, setDeleteRvDueId] = useState(null);
  const reportPrintRef = useRef(null);
const [reportRows, setReportRows] = useState([]);
const [reportTotalSum, setReportTotalSum] = useState(0);
const [reportTotalCount, setReportTotalCount] = useState(0);
const [pendingReportPrint, setPendingReportPrint] = useState(false);

const formatDate = (dateStr) => {
  if (!dateStr) return "-";

  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
};

  const { t } = useTranslation();
  const [totals, setTotals] = useState({
    total_balance: 0,
    total_paid: 0,
    total_outstanding: 0
    });

  const today = new Date().toISOString().slice(0, 10);
  const firstDayOfYear = new Date(new Date().getFullYear(), 0, 1)
    .toISOString()
    .slice(0, 10);

  const [filters, setFilters] = useState({
    from_date: firstDayOfYear,
    to_date: today
  });

  // =========================
  // Fetch Due Balances (CLIENT FIXED)
  // =========================
  const fetchDueBalances = async (page = pagination.page) => {
    if (!client?.id) return;

    setLoading(true);
    try {
      const res = await api.get("/api/invoices/due-balances", {
        params: {
          page,
          limit: pagination.limit,
          client_id: client.id,
          from_date: filters.from_date,
          to_date: filters.to_date
        }
      });

      setData(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error("Error fetching due balances:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTotals = async () => {
  if (!client?.id) return;

  try {
    const res = await api.get("/api/invoices/receipts/totals", {
      params: {
        client_id: client.id,
        from_date: filters.from_date,
        to_date: filters.to_date
      }
    });

    setTotals(res.data);
  } catch (err) {
    console.error("Failed to fetch totals", err);
  }
};

useEffect(() => {
  fetchDueBalances(1);
  fetchTotals();
}, [client, filters]);

  // =========================
  // Fetch RVs
  // =========================
  const fetchVouchers = async (dueId) => {
    try {
      const res = await api.get(
        `/api/invoices/due-balances/${dueId}/receipt-vouchers`
      );
      setVouchers((prev) => ({ ...prev, [dueId]: res.data }));
    } catch (err) {
      console.error("Error fetching vouchers:", err);
    }
  };

  useEffect(() => {
    fetchDueBalances(1);
  }, [client]);

  const toggleExpand = (dueId) => {
    setExpandedDue(expandedDue === dueId ? null : dueId);
    if (!vouchers[dueId]) fetchVouchers(dueId);
  };

  const getStatusLabel = (state) =>
    t(`Receipts.status.${state}`, state);

  const statusColor = (state) => {
    if (state === "completed") return "bg-green-100 text-green-700";
    if (state === "pending") return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  // =========================
  // Printing
  // =========================
  const printRef = useRef(null);
  const [company, setCompany] = useState(null);
  const [printRV, setPrintRV] = useState(null);
  const [pendingPrint, setPendingPrint] = useState(false);

  useEffect(() => {
    api.get("/api/invoices/company")
      .then((res) => setCompany(res.data))
      .catch(console.error);
  }, []);

  const handlePrint = useReactToPrint({
    content: () => printRef.current
  });

  useEffect(() => {
    if (pendingPrint && printRV && company) {
      handlePrint();
      setPendingPrint(false);
    }
  }, [pendingPrint, printRV, company]);

  const printReceiptVoucher = async (rvId) => {
    const res = await api.get(`/api/invoices/receipt-vouchers/${rvId}`);
    setPrintRV(res.data);
    setPendingPrint(true);
  };


const handleReportPrint = useReactToPrint({
  content: () => reportPrintRef.current,
  documentTitle: "Client Receipts Report",
  pageStyle: `
    @page { size: A4; margin: 0 !important; }
    html, body { margin: 0 !important; padding: 0 !important; }
    * { box-sizing: border-box; }
  `
});

useEffect(() => {
  if (pendingReportPrint && company) {
    handleReportPrint();
    setPendingReportPrint(false);
  }
}, [pendingReportPrint, company]);

const fetchClientReceiptsReportForPrint = async () => {
  if (!client?.id) return;

  const res = await api.get("/api/invoices/reports/receipts/by-client", {
    params: {
      client_id: client.id,
      from: filters.from_date,
      to: filters.to_date,
      limit: 1000000,
      offset: 0
    }
  });

  setReportRows(res.data.rows || []);
  setReportTotalSum(res.data.total_sum || 0);
  setReportTotalCount(res.data.total_count || 0);
};

const duePrintRef = useRef(null);
const [printDue, setPrintDue] = useState(null);
const [pendingDuePrint, setPendingDuePrint] = useState(false);
const handleDuePrint = useReactToPrint({
  content: () => duePrintRef.current,
  documentTitle: `Due-Balance-${printDue?.due?.id}`,
  pageStyle: `
    @page { size: A4; margin: 0; }
    body { margin: 0; }
  `
});

useEffect(() => {
  if (pendingDuePrint && printDue && company) {
    handleDuePrint();
    setPendingDuePrint(false);
  }
}, [pendingDuePrint, printDue, company]);


  // =========================
  // Render
  // =========================
return (
  <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100/50">
    {/* Header & Filters - Sticky */}
    <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm border-b border-gray-200/60 shadow-sm">
      {/* Header */}
<div className="bg-white border-b border-gray-200/60">
  <div className="p-4">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

      {/* Total Balance */}
      <div className="relative overflow-hidden rounded-lg border border-gray-200/60 bg-white p-4 shadow-sm hover:shadow transition-all">
        <div className="absolute top-0 end-0 w-20 h-20 bg-blue-50 rounded-full -mr-10 -mt-10 opacity-40"></div>
        <div className="relative flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-100 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {t("Receipts.totals.total_balance")}
            </div>
            <div className="text-xl font-bold text-gray-900">
              ${totals.total_balance.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Total Paid */}
      <div className="relative overflow-hidden rounded-lg border border-green-200/60 bg-gradient-to-br from-green-50/50 to-white p-4 shadow-sm hover:shadow transition-all">
        <div className="absolute top-0 end-0 w-20 h-20 bg-green-100 rounded-full -mr-10 -mt-10 opacity-40"></div>
        <div className="relative flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-green-100 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <div>
            <div className="text-xs font-medium text-green-700/70 uppercase tracking-wide">
              {t("Receipts.totals.total_paid")}
            </div>
            <div className="text-xl font-bold text-green-700">
              ${totals.total_paid.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Outstanding */}
      <div className="relative overflow-hidden rounded-lg border border-red-200/60 bg-gradient-to-br from-red-50/50 to-white p-4 shadow-sm hover:shadow transition-all">
        <div className="absolute top-0 end-0 w-20 h-20 bg-red-100 rounded-full -mr-10 -mt-10 opacity-40"></div>
        <div className="relative flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-red-100 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <div>
            <div className="text-xs font-medium text-red-700/70 uppercase tracking-wide">
              {t("Receipts.totals.total_outstanding")}
            </div>
            <div className="text-xl font-bold text-red-700">
              ${totals.total_outstanding.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</div>


      {/* Filters */}
      <div className="p-6">
        <div className="flex flex-wrap gap-6 items-end">
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs font-medium text-gray-600 mb-2">
              {t("Receipts.filters.from_date")}
            </label>
            <input
              type="date"
              value={filters.from_date}
              onChange={(e) =>
                setFilters({ ...filters, from_date: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
            />
          </div>

          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs font-medium text-gray-600 mb-2">
              {t("Receipts.filters.to_date")}
            </label>
            <input
              type="date"
              value={filters.to_date}
              onChange={(e) =>
                setFilters({ ...filters, to_date: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
            />
          </div>

          <button
            onClick={() => fetchDueBalances(1)}
            className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors duration-200 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            {t("Receipts.filters.apply")}
          </button>
          <button
            onClick={async () => {
              await fetchClientReceiptsReportForPrint();
              setPendingReportPrint(true);
            }}
            className="px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
          >
            {t("SalesReports.actions.print")}
          </button>

          <div className="ms-auto flex gap-3">
            {canAdd && (
            <button
              onClick={() => {
                setBalanceModalMode("create");
                setActiveBalanceId(null);
                setBalanceModalOpen(true);
              }}
              className="px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500/20"
            >
              {t("Receipts.actions.add_balance")}
            </button>
            )}
            {canAdd && (
            <button
              onClick={() => setCreateReceiptOpen(true)}
              className="px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors duration-200 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-gray-500/50"
            >
              {t("Receipts.actions.create_receipt")} 
            </button>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Scrollable Content Area */}
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto p-6">
        {/* Table */}
        <div className="space-y-3">
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-e-transparent"></div>
              <p className="mt-3 text-sm text-gray-500">Loading...</p>
            </div>
          )}

          {!loading &&
            data.map((d) => (
              <div
                key={d.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200/60 overflow-hidden transition-all duration-200 hover:shadow-md"
              >
                {/* Due Row */}
                <div
                  className="grid grid-cols-6 gap-4 p-5 cursor-pointer hover:bg-gray-50/80 transition-colors duration-150"
                  onClick={() => toggleExpand(d.id)}
                >
                  <div className="flex items-center flex-row gap-2 ">
                    <span className="text-sm font-medium text-gray-900">
                      #{d.id}
                    </span>
                      <span className="text-xs text-gray-400">
                        {formatDate(d.date)}
                      </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 line-clamp-1">
                      {d.reason}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-semibold text-gray-900">
                      ${Number(d.amount).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-700">
                      ${Number(d.paid).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(
                        d.state
                      )}`}
                    >
                      {getStatusLabel(d.state)}
                    </span>
                  </div>
                  <div className="flex gap-3 justify-end items-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setBalanceModalMode("edit");
                        setActiveBalanceId(d.id);
                        setBalanceModalOpen(true);
                      }}
                      className="text-xs font-medium text-blue-600 hover:text-blue-800"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-info-icon lucide-info"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                    </button>
                    {canDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteBalanceId(d.id);
                        setDeleteModalOpen(true);
                      }}
                      className="text-xs font-medium text-red-600 hover:text-red-800 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash2-icon lucide-trash-2"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                    )}
<button
  onClick={(e) => {
    e.stopPropagation();
    api
      .get(`/api/invoices/due-balances/${d.id}/print`)
      .then((res) => {
        setPrintDue(res.data);
        setPendingDuePrint(true);
      });
  }}
  className="text-xs font-medium text-gray-600 hover:text-gray-900"
>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-printer-icon lucide-printer"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>
                    </button>
                  </div>
                </div>

                {/* Expanded RVs */}
                {expandedDue === d.id && (
                  <div className="border-t border-gray-200 bg-gradient-to-b from-gray-50 to-white">
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          {t("Receipts.receipt_vouchers.title")}
                        </h3>
                        {canAdd && d.state !== "completed" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRvModalMode("create");
                            setActiveRvId(null);
                            setActiveRvDueId(d.id);
                            setRvModalOpen(true);
                          }}
                          className="flex items-center justify-center w-7 h-7 rounded-md bg-green-500 text-white text-lg font-medium hover:bg-green-600 transition"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-diamond-plus-icon lucide-diamond-plus"><path d="M12 8v8"/><path d="M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41L13.7 2.71a2.41 2.41 0 0 0-3.41 0z"/><path d="M8 12h8"/></svg>
                        </button>
                        )}
                      </div>
                      <div className="overflow-hidden rounded-lg border border-gray-200">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50/80">
                            <tr className="text-gray-700">
                              <th className="text-start px-4 py-3 font-medium text-xs uppercase tracking-wider">
                                {t("Receipts.receipt_vouchers.table.number")}
                              </th>
                              <th className="text-start px-4 py-3 font-medium text-xs uppercase tracking-wider">
                                {t("Receipts.receipt_vouchers.table.amount")}
                              </th>
                              <th className="text-start px-4 py-3 font-medium text-xs uppercase tracking-wider">
                                {t("Receipts.receipt_vouchers.table.type")}
                              </th>
                              <th className="text-start px-4 py-3 font-medium text-xs uppercase tracking-wider">
                                {t("Receipts.receipt_vouchers.table.reason")}
                              </th>
                              <th className="text-start px-4 py-3 font-medium text-xs uppercase tracking-wider">
                                {t("Receipts.receipt_vouchers.table.date")}
                              </th>
                              <th className="text-end px-4 py-3 font-medium text-xs uppercase tracking-wider">
                                {t("Receipts.receipt_vouchers.table.actions")}
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-100">
                            {(vouchers[d.id] || []).map((rv) => (
                              <tr
                                key={rv.id}
                                className="hover:bg-gray-50/50 transition-colors duration-150"
                              >
                                <td className="px-4 py-3.5 font-medium text-gray-900">
                                  {rv.receipt_number}
                                </td>
                                <td className="px-4 py-3.5 font-semibold text-gray-900">
                                  ${Number(rv.amount).toFixed(2)}
                                </td>
                                <td className="px-4 py-3.5 text-gray-600">
                                  {t(`Receipts.receipt_types.${rv.type}`, rv.type)}
                                </td>
                                <td className="px-4 py-3.5 text-gray-600">
                                  {rv.reason || "-"}
                                </td>
                                <td className="px-4 py-3.5 text-gray-600">
                                  {rv.date}
                                </td>
                                <td className="px-4 py-3.5 text-end">
                                  <div className="flex gap-3 justify-end">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setRvModalMode("edit");
                                        setActiveRvId(rv.id);
                                        setActiveRvDueId(d.id);
                                        setRvModalOpen(true);
                                      }}
                                      className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-info-icon lucide-info"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                                    </button>
                                      {canDelete && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteRvId(rv.id);
                                        setDeleteRvDueId(d.id);
                                        setDeleteRvModalOpen(true);
                                      }}
                                      className="text-xs font-medium text-red-600 hover:text-red-800 transition-colors"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash2-icon lucide-trash-2"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                    </button>
                                      )}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        printReceiptVoucher(rv.id);
                                      }}
                                      className="text-xs font-medium text-gray-700 hover:text-gray-900 transition-colors"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-printer-icon lucide-printer"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}

                            {(vouchers[d.id] || []).length === 0 && (
                              <tr>
                                <td
                                  colSpan={6}
                                  className="text-center py-12 text-gray-400"
                                >
                                  <div className="flex flex-col items-center">
                                    <svg
                                      className="w-12 h-12 mb-3 text-gray-300"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                      />
                                    </svg>
                                    <p className="text-sm font-medium">
                                      {t("Receipts.receipt_vouchers.empty")}
                                    </p>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

          {!loading && data.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200/60 p-12">
              <div className="flex flex-col items-center text-gray-400">
                <svg
                  className="w-16 h-16 mb-4 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="text-base font-medium text-gray-500">
                  {t("Receipts.empty_state.title")}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {t("Receipts.empty_state.subtitle")}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && data.length > 0 && (
          <div className="flex justify-between items-center pt-6 pb-2">
            <button
              disabled={pagination.page === 1}
              onClick={() => fetchDueBalances(pagination.page - 1)}
              className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-white hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-gray-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500/20"
            >
              {t("Receipts.pagination.previous")}
            </button>

            <span className="text-sm font-medium text-gray-600">
              {t("Receipts.pagination.page")} {pagination.page} {t("Receipts.pagination.of")} {pagination.totalPages}
            </span>

            <button
              disabled={pagination.page === pagination.totalPages}
              onClick={() => fetchDueBalances(pagination.page + 1)}
              className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-white hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-gray-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500/20"
            >
              {t("Receipts.pagination.next")}
            </button>
          </div>
        )}
      </div>
    </div>

    {/* Modals */}
    {balanceModalOpen && (
      <BalanceModal
        isOpen
        mode={balanceModalMode}
        dueBalanceId={activeBalanceId}
        clientId={client.id}
        onClose={() => setBalanceModalOpen(false)}
        onSuccess={() => fetchDueBalances(1)}
      />
    )}

    {deleteModalOpen && (
      <DeleteBalanceModal
        isOpen
        dueBalanceId={deleteBalanceId}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeleteBalanceId(null);
        }}
        onDeleted={() => {
          fetchDueBalances(1);
        }}
      />
    )}

    {rvModalOpen && (
      <ReceiptVoucherModal
        isOpen
        mode={rvModalMode}
        dueBalanceId={activeRvDueId}
        receiptVoucherId={activeRvId}
        clientName={client.name}
        onClose={() => setRvModalOpen(false)}
        onSuccess={() => {
          fetchVouchers(activeRvDueId);
          fetchDueBalances(pagination.page);
        }}
      />
    )}

    {createReceiptOpen && (
      <CreateReceiptModal
        isOpen
        clientId={client.id}
        onClose={() => setCreateReceiptOpen(false)}
        onSuccess={() => fetchDueBalances(1)}
      />
    )}

    {deleteRvModalOpen && (
      <DeleteReceiptVoucherModal
        isOpen
        receiptVoucherId={deleteRvId}
        onClose={() => {
          setDeleteRvModalOpen(false);
          setDeleteRvId(null);
          setDeleteRvDueId(null);
        }}
        onDeleted={() => {
          fetchVouchers(deleteRvDueId);
          fetchDueBalances(pagination.page);
        }}
      />
    )}

    <div className="hidden">
      {company && printRV && (
        <ReceiptVoucherPrint
          ref={printRef}
          company={company}
          receipt={printRV}
        />
      )}
    </div>
    <div className="hidden">
  {company && (
    <ClientReceiptsReportPrint
      ref={reportPrintRef}
      rows={reportRows}
      dateFrom={filters.from_date}
      dateTo={filters.to_date}
      totalSum={reportTotalSum}
      totalCount={reportTotalCount}
      company={company}
      clientName={client?.name}
    />
  )}
</div>
<div className="hidden">
  {company && printDue && (
    <DueBalancePrint
      ref={duePrintRef}
      company={company}
      data={printDue}
    />
  )}
</div>
  </div>
);
}
