import { useEffect, useState } from "react";
import api from "../../utils/axiosInstance";
import SelectItemModal from "../invoices/SelectItemModal";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import ItemsSalesSummaryReportPrint from "./printables/ItemsSalesSummaryReportPrint";
import ItemSalesDetailsReportPrint from "./printables/ItemSalesDetailsReportPrint";
import StorageInventoryReportPrint from "./printables/StorageInventoryReportPrint";
import StorageTransactionsReportPrint from "./printables/StorageTransactionsReportPrint"
import { useTranslation } from "react-i18next";
const PAGE_SIZE = 100;

export default function StorageItemReports() {
  const [reportType, setReportType] = useState("items_sales");

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [rows, setRows] = useState([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);

  const [itemsCount, setItemsCount] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemModalOpen, setItemModalOpen] = useState(false);

  const [totalQty, setTotalQty] = useState(0);
  const [storages, setStorages] = useState([]);
const [selectedStorage, setSelectedStorage] = useState(null);

const [direction, setDirection] = useState("BOTH");
const printRef = useRef();
const [printRows, setPrintRows] = useState([]);
const [printTotals, setPrintTotals] = useState({ qty: 0, sales: 0 });
const [company, setCompany] = useState(null);
const [pendingPrint, setPendingPrint] = useState(false);
const showDateFilters = reportType !== "storage_inventory";
const {t} = useTranslation();
useEffect(() => {
  api.get(`/api/invoices/company`).then(res => {
    setCompany(res.data);
  });
}, []);

useEffect(() => {
  api.get(`/api/invoices/storages`)
    .then(res => setStorages(res.data))
    .catch(() => {});
}, []);


  // ================= DATE HELPERS (COPIED STYLE) =================
  const formatLocalDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
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

    setRows([]);
    setOffset(0);
    setItemsCount(0);
    setGrandTotal(0);
  }, [reportType]);

  // ================= FETCH ITEMS SALES =================
  const fetchItemsSales = async (newOffset = 0) => {
    if (!dateFrom || !dateTo) return;

    try {
      setLoading(true);

      const res = await api.get(
        `/api/invoices/reports/items/sales`,
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
      setItemsCount(res.data.items_count || 0);
      setGrandTotal(res.data.grand_total_sales || 0);
      setOffset(newOffset);
    } catch (err) {
      console.error("Failed to fetch items sales report", err);
    } finally {
      setLoading(false);
    }
  };

const applyReport = () => {
  if (reportType === "items_sales") fetchItemsSales(0);
  if (reportType === "item_sales_details") fetchItemSalesDetails(0);
  if (reportType === "storage_inventory") fetchStorageInventory();
  if (reportType === "storage_transactions") fetchStorageTransactions();
};



  const fetchItemSalesDetails = async (newOffset = 0) => {
  if (!selectedItem || !dateFrom || !dateTo) return;

  try {
    setLoading(true);

    const res = await api.get(
      `/api/invoices/reports/items/sales/details`,
      {
        params: {
          item_id: selectedItem.id,
          from: dateFrom,
          to: dateTo,
          limit: PAGE_SIZE,
          offset: newOffset
        }
      }
    );

    setRows(res.data.rows || []);
    setItemsCount(res.data.records_count || 0);
    setGrandTotal(res.data.total_sales || 0);
    setTotalQty(res.data.total_qty || 0);
    setOffset(newOffset);
  } finally {
    setLoading(false);
  }
};

const fetchStorageInventory = async () => {
  if (!selectedStorage) return;

  try {
    setLoading(true);

    const res = await api.get(
      `/api/invoices/reports/storage/inventory`,
      { params: { storage_id: selectedStorage } }
    );

    setRows(res.data.rows || []);
  } catch (err) {
    console.error("Failed to fetch storage inventory", err);
  } finally {
    setLoading(false);
  }
};

const fetchStorageTransactions = async (newOffset = 0) => {
  if (!dateFrom || !dateTo) return;

  try {
    setLoading(true);

    const res = await api.get(
      `/api/invoices/reports/storage/transactions`,
      {
        params: {
          from: dateFrom,
          to: dateTo,
          direction,
          item_id: selectedItem?.id,
          storage_id: selectedStorage || undefined,
          limit: PAGE_SIZE,
          offset: newOffset
        }
      }
    );

    setRows(res.data || []);
    setOffset(newOffset);
  } finally {
    setLoading(false);
  }
};

const fetchItemsSalesForPrint = async () => {
  const res = await api.get(
    `/api/invoices/reports/items/sales`,
    {
      params: {
        from: dateFrom,
        to: dateTo,
        limit: 1000000,
        offset: 0
      }
    }
  );

  return {
    rows: res.data.rows || [],
    totalQty: res.data.total_qty || 0,
    totalSales: res.data.grand_total_sales || 0
  };
};

const fetchItemSalesDetailsForPrint = async () => {
  const res = await api.get(
    `/api/invoices/reports/items/sales/details`,
    {
      params: {
        item_id: selectedItem.id,
        from: dateFrom,
        to: dateTo,
        limit: 1000000,
        offset: 0
      }
    }
  );

  return {
    rows: res.data.rows || [],
    totalQty: res.data.total_qty || 0,
    totalSales: res.data.total_sales || 0
  };
};

const fetchStorageInventoryForPrint = async () => {
  const res = await api.get(
    `/api/invoices/reports/storage/inventory`,
    {
      params: {
        storage_id: selectedStorage
      }
    }
  );

  return res.data.rows || [];
};

const fetchStorageTransactionsForPrint = async () => {
  const res = await api.get(
    `/api/invoices/reports/storage/transactions`,
    {
      params: {
        from: dateFrom,
        to: dateTo,
        direction,
        item_id: selectedItem?.id,
        storage_id: selectedStorage || undefined,
        limit: 1000000,
        offset: 0
      }
    }
  );

  return res.data || [];
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
<div className="w-full h-full flex flex-col min-h-0">

<div className="flex items-end justify-between gap-4 p-4 bg-white border rounded-lg shadow-sm">

  {/* ================= LEFT SIDE ================= */}
  <div className="flex items-end gap-4 flex-wrap">

    {/* Report Selector */}
    <div>
      <label className="block text-xs text-gray-500 mb-1">
        {t("StorageItemReports.filters.report")}
      </label>
      <select
        value={reportType}
        onChange={(e) => setReportType(e.target.value)}
        className="px-3 py-2 border rounded-md text-sm bg-white"
      >
        <option value="items_sales">{t("StorageItemReports.report_types.items_sales")}</option>
        <option value="item_sales_details">{t("StorageItemReports.report_types.item_sales_details")}</option>
        <option value="storage_inventory">{t("StorageItemReports.report_types.storage_inventory")}</option>
        <option value="storage_transactions">{t("StorageItemReports.report_types.storage_transactions")}</option>
      </select>
    </div>

    {/* Date From */}
    {reportType !== "storage_inventory" && (
      <div>
        <label className="block text-xs text-gray-500 mb-1">
          {t("StorageItemReports.filters.from")}
        </label>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="px-3 py-2 border rounded-md text-sm"
        />
      </div>
    )}

    {/* Date To */}
    {reportType !== "storage_inventory" && (
      <div>
        <label className="block text-xs text-gray-500 mb-1">
          {t("StorageItemReports.filters.to")}
        </label>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="px-3 py-2 border rounded-md text-sm"
        />
      </div>
    )}

    {/* Select Item */}
    {reportType === "item_sales_details" && (
      <button
        onClick={() => setItemModalOpen(true)}
        className="h-10 px-4 bg-[#2f788a] text-white rounded-lg text-sm"
      >
        {t("StorageItemReports.filters.select_item")}
      </button>
    )}

    {/* Selected Item Display */}
    {selectedItem && reportType === "item_sales_details" && (
      <div className="h-10 px-3 flex items-center border rounded bg-gray-50 text-sm">
        {selectedItem.name}
      </div>
    )}

    {/* Storage Selector */}
    {(reportType === "storage_inventory" ||
      reportType === "storage_transactions") && (
      <div>
        <label className="block text-xs text-gray-500 mb-1">
          {t("StorageItemReports.filters.storage")}
        </label>
        <select
          value={selectedStorage || ""}
          onChange={(e) => setSelectedStorage(e.target.value)}
          className="px-3 py-2 border rounded-md text-sm bg-white"
        >
          <option value="">{t("StorageItemReports.filters.select_storage")}</option>
          {storages.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
    )}

    {/* Direction */}
    {reportType === "storage_transactions" && (
      <div>
        <label className="block text-xs text-gray-500 mb-1">
          {t("StorageItemReports.filters.direction")}
        </label>
        <select
          value={direction}
          onChange={(e) => setDirection(e.target.value)}
          className="px-3 py-2 border rounded-md text-sm bg-white"
        >
          <option value="BOTH">{t("StorageItemReports.directions.both")}</option>
          <option value="IN">{t("StorageItemReports.directions.in")}</option>
          <option value="OUT">{t("StorageItemReports.directions.out")}</option>
        </select>
      </div>
    )}

    {/* Apply */}
    <button
      onClick={applyReport}
      disabled={loading}
      className="h-10 px-6 rounded-lg bg-[#2f788a] text-white text-sm font-medium hover:bg-[#256273] disabled:opacity-50"
    >
      {t("StorageItemReports.filters.apply")}
    </button>
  </div>

  {/* ================= RIGHT SIDE (PRINT ONLY) ================= */}
  <div>
    {reportType === "items_sales" && (
      <button
        onClick={async () => {
          const res = await fetchItemsSalesForPrint();
          setPrintRows(res.rows);
          setPrintTotals({ qty: res.totalQty, sales: res.totalSales });
          setPendingPrint(true);
        }}
        className="h-10 px-6 rounded-lg border text-sm"
      >
        {t("StorageItemReports.actions.print")}
      </button>
    )}

    {reportType === "item_sales_details" && selectedItem && (
      <button
        onClick={async () => {
          const res = await fetchItemSalesDetailsForPrint();
          setPrintRows(res.rows);
          setPrintTotals({ qty: res.totalQty, sales: res.totalSales });
          setPendingPrint(true);
        }}
        className="h-10 px-6 rounded-lg border text-sm"
      >
        {t("StorageItemReports.actions.print")}
      </button>
    )}

    {reportType === "storage_inventory" && selectedStorage && (
      <button
        onClick={async () => {
          const allRows = await fetchStorageInventoryForPrint();
          setPrintRows(allRows);
          setPendingPrint(true);
        }}
        className="h-10 px-6 rounded-lg border text-sm"
      >
        {t("StorageItemReports.actions.print")}
      </button>
    )}

    {reportType === "storage_transactions" && (
      <button
        onClick={async () => {
          const allRows = await fetchStorageTransactionsForPrint();
          setPrintRows(allRows);
          setPendingPrint(true);
        }}
        className="h-10 px-6 rounded-lg border text-sm"
      >
        {t("StorageItemReports.actions.print")}
      </button>
    )}
  </div>
</div>


      {/* ================= ITEMS SALES TABLE ================= */}
      {reportType === "items_sales" && (
        <div className="border rounded-lg bg-white flex flex-col flex-1 min-h-0">
          {/* Scrollable Table */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-start">{t("StorageItemReports.tables.items_sales.item")}</th>
                  <th className="px-4 py-3 text-center">{t("StorageItemReports.tables.items_sales.unit")}</th>
                  <th className="px-4 py-3 text-end">{t("StorageItemReports.tables.items_sales.total_qty")}</th>
                  <th className="px-4 py-3 text-end">{t("StorageItemReports.tables.items_sales.total_sales")}</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {loading && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                      {t("StorageItemReports.states.loading")}
                    </td>
                  </tr>
                )}

                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                       {t("StorageItemReports.states.no_records")}
                    </td>
                  </tr>
                )}

                {!loading &&
                  rows.map((r) => (
                    <tr key={r.item_id}>
                      <td className="px-4 py-2 font-medium">
                        {r.item_name || "-"}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {r.unit_name || "-"}
                      </td>
                      <td className="px-4 py-2 text-end">
                        {Number(r.total_qty).toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-end font-medium">
                        {Number(r.total_sales).toFixed(3)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Footer / Pagination */}
          <div className="flex justify-between items-center px-4 py-3 border-t bg-gray-50">
            <span className="text-xs text-gray-500">
              {t("StorageItemReports.summary.showing_items")} {rows.length} / {itemsCount} 
            </span>

            <span className="text-sm font-semibold text-gray-700">
              {t("StorageItemReports.summary.total_sales")} : {grandTotal.toFixed(3)}
            </span>

            <div className="flex gap-2">
              <button
                disabled={offset === 0 || loading}
                onClick={() => fetchItemsSales(offset - PAGE_SIZE)}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50"
              >
                {t("StorageItemReports.actions.previous")}
              </button>

              <button
                disabled={rows.length < PAGE_SIZE || loading}
                onClick={() => fetchItemsSales(offset + PAGE_SIZE)}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50"
              >
                {t("StorageItemReports.actions.next")}
              </button>
            </div>
          </div>
        </div>
      )}
      {reportType === "item_sales_details" && (
  <div className="border rounded-lg bg-white flex flex-col flex-1 min-h-0">

    {/* Scrollable table */}
    <div className="flex-1 min-h-0 overflow-y-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 sticky top-0 z-10">
          <tr>
            <th className="px-4 py-3 text-start">{t("StorageItemReports.tables.item_sales_details.date")}</th>
            <th className="px-4 py-3 text-start">{t("StorageItemReports.tables.item_sales_details.invoice")}</th>
            <th className="px-4 py-3 text-start">{t("StorageItemReports.tables.item_sales_details.client")}</th>
            <th className="px-4 py-3 text-end">{t("StorageItemReports.tables.item_sales_details.qty")}</th>
            <th className="px-4 py-3 text-center">{t("StorageItemReports.tables.item_sales_details.unit")}</th>
            <th className="px-4 py-3 text-end">{t("StorageItemReports.tables.item_sales_details.total")}</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200">
          {loading && (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                {t("StorageItemReports.states.loading")}
              </td>
            </tr>
          )}

          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                {t("StorageItemReports.states.no_records")}
              </td>
            </tr>
          )}

          {!loading &&
            rows.map((r, idx) => (
              <tr key={idx}>
                <td className="px-4 py-2">{r.date}</td>
                <td className="px-4 py-2 font-medium">{r.invoice_number}</td>
                <td className="px-4 py-2">{r.client || "-"}</td>
                <td className="px-4 py-2 text-end">
                  {Number(r.qty).toFixed(2)}
                </td>
                <td className="px-4 py-2 text-center">
                  {r.unit_name || "-"}
                </td>
                <td className="px-4 py-2 text-end font-medium">
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
        {t("StorageItemReports.summary.showing_items")} {rows.length} / {itemsCount} 
      </span>

      <span className="text-sm font-semibold text-gray-700">
        {t("StorageItemReports.tables.items_sales.total_qty")} : {totalQty.toFixed(2)} | {t("StorageItemReports.tables.items_sales.total_sales")} : {grandTotal.toFixed(3)}
      </span>

      <div className="flex gap-2">
        <button
          disabled={offset === 0 || loading}
          onClick={() => fetchItemSalesDetails(offset - PAGE_SIZE)}
          className="px-3 py-1 border rounded text-sm disabled:opacity-50"
        >
          {t("StorageItemReports.actions.previous")}
        </button>

        <button
          disabled={rows.length < PAGE_SIZE || loading}
          onClick={() => fetchItemSalesDetails(offset + PAGE_SIZE)}
          className="px-3 py-1 border rounded text-sm disabled:opacity-50"
        >
          {t("StorageItemReports.actions.next")}
        </button>
      </div>
    </div>
  </div>
)}
{reportType === "storage_inventory" && (
  <div className="border rounded-lg bg-white flex flex-col flex-1 min-h-0">

    <div className="flex-1 min-h-0 overflow-y-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 sticky top-0">
          <tr>
            <th className="px-4 py-3 text-start">{t("StorageItemReports.tables.storage_inventory.item")}</th>
            <th className="px-4 py-3 text-end">{t("StorageItemReports.tables.storage_inventory.item")}</th>
            <th className="px-4 py-3 text-start">{t("StorageItemReports.tables.storage_inventory.item")}</th>

          </tr>
        </thead>

        <tbody className="divide-y">
          {loading && (
            <tr>
              <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                 {t("StorageItemReports.states.loading")}
              </td>
            </tr>
          )}

          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                {t("StorageItemReports.states.no_items")}
              </td>
            </tr>
          )}

          {!loading &&
            rows.map(r => (
              <tr key={r.item_id}>
                <td className="px-4 py-2 font-medium">
                  {r.item_name}
                </td>
                <td className="px-4 py-2 text-end font-semibold">
                  {Number(r.qty).toFixed(3)}
                </td>
                <td className="px-4 py-2 text-start">
                  {r.unit_name || "-"}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>

  </div>
)}
{reportType === "storage_transactions" && (
  <div className="border rounded-lg bg-white flex flex-col flex-1 min-h-0">

    {/* Scrollable body */}
    <div className="flex-1 min-h-0 overflow-y-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 sticky top-0 z-10">
          <tr>
            <th className="px-4 py-3 text-left">{t("StorageItemReports.tables.storage_transactions.date")}</th>
            <th className="px-4 py-3 text-left">{t("StorageItemReports.tables.storage_transactions.item")}</th>
            <th className="px-4 py-3 text-left">{t("StorageItemReports.tables.storage_transactions.storage")}</th>
            <th className="px-4 py-3 text-center">{t("StorageItemReports.tables.storage_transactions.dir")}</th>
            <th className="px-4 py-3 text-right">{t("StorageItemReports.tables.storage_transactions.qty")}</th>
            <th className="px-4 py-3 text-left">{t("StorageItemReports.tables.storage_transactions.unit")}</th>
            <th className="px-4 py-3 text-left">{t("StorageItemReports.tables.storage_transactions.ref")}</th>
          </tr>
        </thead>

        <tbody className="divide-y">
          {loading && (
            <tr>
              <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                 {t("StorageItemReports.states.loading")}
              </td>
            </tr>
          )}

          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                 {t("StorageItemReports.states.no_transactions")}
              </td>
            </tr>
          )}

          {!loading &&
            rows.map((r, i) => (
              <tr key={i}>
                <td className="px-4 py-2">{r.date}</td>
                <td className="px-4 py-2">{r.item_name}</td>
                <td className="px-4 py-2">{r.storage_name}</td>
                <td className="px-4 py-2 text-center">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      r.direction === "IN"
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {r.direction}
                  </span>
                </td>
                <td className="px-4 py-2 text-end">{r.qty}</td>
                <td className="px-4 py-2">{r.unit_name || "-"}</td>
                <td className="px-4 py-2 font-mono text-xs">{r.ref || "-"}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>

    {/* Pagination (fixed, no scroll) */}
    <div className="flex justify-end gap-2 px-4 py-3 border-t bg-gray-50">
      <button
        disabled={offset === 0 || loading}
        onClick={() => fetchStorageTransactions(offset - PAGE_SIZE)}
        className="px-3 py-1 border rounded text-sm disabled:opacity-50"
      >
        {t("StorageItemReports.actions.previous")}
      </button>

      <button
        disabled={rows.length < PAGE_SIZE || loading}
        onClick={() => fetchStorageTransactions(offset + PAGE_SIZE)}
        className="px-3 py-1 border rounded text-sm disabled:opacity-50"
      >
        {t("StorageItemReports.actions.next")}
      </button>
    </div>

  </div>
)}


<SelectItemModal
  open={itemModalOpen}
  onSelect={(item) => {
    setSelectedItem(item);
    setItemModalOpen(false);
  }}
  onClose={() => setItemModalOpen(false)}
/>
<div className="hidden">
  {company && printRows.length > 0 && reportType === "items_sales" && (
    <ItemsSalesSummaryReportPrint
      ref={printRef}
      rows={printRows}
      dateFrom={dateFrom}
      dateTo={dateTo}
      totalQty={printTotals.qty}
      totalSales={printTotals.sales}
      company={company}
    />
  )}

  {company && printRows.length > 0 && reportType === "item_sales_details" && selectedItem && (
    <ItemSalesDetailsReportPrint
      ref={printRef}
      rows={printRows}
      dateFrom={dateFrom}
      dateTo={dateTo}
      totalQty={printTotals.qty}
      totalSales={printTotals.sales}
      company={company}
      item={selectedItem}
    />
  )}
    {company && printRows.length > 0 && reportType === "storage_inventory" && (
    <StorageInventoryReportPrint
      ref={printRef}
      rows={printRows}
      company={company}
      storageName={
        storages.find(s => s.id == selectedStorage)?.name || ""
      }
      generatedAt={new Date().toLocaleDateString("en-GB")}
    />
  )}
  {company && printRows.length > 0 && reportType === "storage_transactions" && (
  <StorageTransactionsReportPrint
    ref={printRef}
    rows={printRows}
    company={company}
    dateFrom={dateFrom}
    dateTo={dateTo}
    storageName={
      storages.find(s => s.id == selectedStorage)?.name || ""
    }
    itemName={selectedItem?.name}
    direction={direction}
  />
)}
</div>
    </div>
  );
}
