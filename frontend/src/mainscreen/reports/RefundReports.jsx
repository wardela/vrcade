import { useEffect, useState } from "react";
import api from "../../utils/axiosInstance";
import ClientList from "../invoices/clientlist";
import { useRef } from "react";
import { useReactToPrint } from "@/utils/useAppReactToPrint";

import GeneralRefundReportPrint from "./printables/GeneralRefundReportPrint";
import RefundsByClientReportPrint from "./printables/RefundsByClientReportPrint";
import { useTranslation } from "react-i18next";

const PAGE_SIZE = 100;

export default function RefundReports() {
  const [reportType, setReportType] = useState("general");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [rows, setRows] = useState([]);
  const [offset, setOffset] = useState(0);
  const [totalSum, setTotalSum] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const {t} = useTranslation();
  const printRef = useRef();
const [printRows, setPrintRows] = useState([]);
const [company, setCompany] = useState(null);
const [pendingPrint, setPendingPrint] = useState(false);
const [printMode, setPrintMode] = useState(null);

const fetchRefundsForPrint = async () => {
  const url =
    reportType === "general"
      ? "/api/invoices/reports/refunds/general"
      : "/api/invoices/reports/refunds/by-client";

  const params = {
    from: dateFrom,
    to: dateTo,
    limit: 1000000,
    offset: 0
  };

  if (reportType === "by_client") {
    params.client_id = selectedClient.id;
  }

  const res = await api.get(`${url}`, { params });
  setPrintRows(res.data.rows || []);
};


useEffect(() => {
  api.get(`/api/invoices/company`).then(res => {
    setCompany(res.data);
  });
}, []);


  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);

    const fmt = d =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;

    setDateFrom(fmt(start));
    setDateTo(fmt(now));

    setRows([]);
    setOffset(0);
    setTotalSum(0);
    setTotalCount(0);
    setSelectedClient(null);
  }, [reportType]);

  const fetchData = async (newOffset = 0) => {
    if (!dateFrom || !dateTo) return;
    if (reportType === "by_client" && !selectedClient) return;

    setLoading(true);

    const url =
      reportType === "general"
        ? "/api/invoices/reports/refunds/general"
        : "/api/invoices/reports/refunds/by-client";

    const params = {
      from: dateFrom,
      to: dateTo,
      limit: PAGE_SIZE,
      offset: newOffset
    };

    if (reportType === "by_client") {
      params.client_id = selectedClient.id;
    }

    const res = await api.get(`${url}`, { params });

    setRows(res.data.rows || []);
    setTotalSum(res.data.total_sum || 0);
    setTotalCount(res.data.total_count || 0);
    setOffset(newOffset);

    setLoading(false);
  };

  const handlePrint = useReactToPrint({
  content: () => printRef.current,
  pageStyle: `
    @page { size: A4; margin: 6mm; }
    body { -webkit-print-color-adjust: exact; }
  `
});

useEffect(() => {
  if (pendingPrint && printRows.length > 0) {
    handlePrint();
    setPendingPrint(false);
  }
}, [pendingPrint, printRows]);

  return (
    <div className="flex flex-col h-full rounded-lg border shadow-lg">
{/* ===== Header ===== */}
<div className="border-b bg-white px-4 py-3">
  <div className="flex items-end justify-between gap-4">

    {/* ================= LEFT SIDE ================= */}
    <div className="flex flex-wrap items-end gap-4">

      {/* Report Type */}
      <div className="min-w-[200px]">
        <label className="block text-xs text-gray-500 mb-1">
          {t("RefundReports.filters.report_type")}
        </label>
        <select
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="general">{t("RefundReports.report_types.general")}</option>
          <option value="by_client">{t("RefundReports.report_types.by_client")}</option>
        </select>
      </div>

      {/* Client Selector */}
      {reportType === "by_client" && (
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            {t("RefundReports.filters.client")}
          </label>
          <button
            onClick={() => setClientModalOpen(true)}
            className="
              h-10 px-4
              rounded-lg
              border
              border-[#2f788a]
              text-[#2f788a]
              text-sm
              font-medium
              bg-white
              hover:bg-[#e5f6f8]
              transition
            "
          >
            {selectedClient ? selectedClient.name : t("RefundReports.filters.select_client")}
          </button>
        </div>
      )}

      {/* Date From */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">
          {t("RefundReports.filters.from")}
        </label>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="h-10 border rounded-lg px-3 text-sm"
        />
      </div>

      {/* Date To */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">
          {t("RefundReports.filters.to")}
        </label>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="h-10 border rounded-lg px-3 text-sm"
        />
      </div>

      {/* Apply */}
      <button
        onClick={() => fetchData(0)}
        className="
          h-10 px-6
          rounded-lg
          bg-[#2f788a]
          text-white
          text-sm
          font-medium
          hover:bg-[#276472]
          transition
        "
      >
        {t("RefundReports.filters.apply")}
      </button>
    </div>

    {/* ================= RIGHT SIDE ================= */}
    <div>
      <button
        onClick={async () => {
          setPrintMode(reportType);
          await fetchRefundsForPrint();
          setPendingPrint(true);
        }}
        className="h-10 px-6 rounded-lg border text-sm"
      >
        {t("RefundReports.actions.print")}
      </button>
    </div>

  </div>
</div>



      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <th className="px-4 py-2 text-start">{t("RefundReports.table.refund")}</th>
              <th className="px-4 py-2 text-start">{t("RefundReports.table.original_invoice")}</th>
              <th className="px-4 py-2 text-start">{t("RefundReports.table.date")}</th>
              <th className="px-4 py-2 text-start">{t("RefundReports.table.client")}</th>
              <th className="px-4 py-2 text-start">{t("RefundReports.table.type")}</th>
              <th className="px-4 py-2 text-start">{t("RefundReports.table.total")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t">
                <td className="px-4 py-2">{r.refund_invoice_number}</td>
                      <td className="px-4 py-2 text-gray-700">
                        {r.original_invoice_number}
                      </td>
                <td className="px-4 py-2">
                  {new Date(r.refund_date).toLocaleDateString("en-GB")}
                </td>
                <td className="px-4 py-2">{r.client}</td>
                <td className="px-4 py-2 capitalize">{r.type}</td>
                <td className="px-4 py-2 text-start">
                  {Number(r.total).toFixed(3)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center px-4 py-3 border-t bg-gray-50">
        <span className="text-xs text-gray-500">
          {t("RefundReports.summary.showing")} {rows.length} / {totalCount} 
        </span>
        <span className="font-semibold">
          {t("RefundReports.summary.total_refunds")} : {Number(totalSum).toFixed(3)}
        </span>
      </div>

      {clientModalOpen && (
        <ClientList
          onSelect={c => {
            setSelectedClient(c);
            setClientModalOpen(false);
          }}
          onClose={() => setClientModalOpen(false)}
        />
      )}

      <div className="hidden">
  {printMode === "general" && company && (
    <GeneralRefundReportPrint
      ref={printRef}
      rows={printRows}
      dateFrom={dateFrom}
      dateTo={dateTo}
      totalSum={totalSum}
      totalCount={totalCount}
      company={company}
    />
  )}

  {printMode === "by_client" && company && selectedClient && (
    <RefundsByClientReportPrint
      ref={printRef}
      rows={printRows}
      dateFrom={dateFrom}
      dateTo={dateTo}
      totalSum={totalSum}
      totalCount={totalCount}
      company={company}
      client={selectedClient}
    />
  )}
</div>

    </div>
  );
}
