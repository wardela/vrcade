import { useEffect, useState, useRef } from "react";
import api from "../../utils/axiosInstance";

import { useReactToPrint } from "react-to-print";
import PrintableStorageMovement from "./PrintableStorageMovement";
import StorageTransactionModal from "./adjustmodal";
import QuickStorageAdjustModal from "./QuickStorageAdjustModal";
import ManageStoragesModal from "./managestoragesmodal";

import { useTranslation } from "react-i18next";

export default function StorageMonitor() {
  const [tab, setTab] = useState("storages");
  const [logs, setLogs] = useState([]);
    const [logsOffset, setLogsOffset] = useState(0);
    const [hasMoreLogs, setHasMoreLogs] = useState(true);
    const LOGS_LIMIT = 100;
  const [storages, setStorages] = useState([]);
  const [selectedStorage, setSelectedStorage] = useState(null);
  const [storageItems, setStorageItems] = useState([]);
  const [selectedStorageId, setSelectedStorageId] = useState(null);
  const [itemSearch, setItemSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
const [dateTo, setDateTo] = useState("");
const [openTx, setOpenTx] = useState(false);
const [quickAdjustOpen, setQuickAdjustOpen] = useState(false);
const [quickAdjustItem, setQuickAdjustItem] = useState(null);
const [openStorages, setOpenStorages] = useState(false);
const {t} = useTranslation();

const [company, setCompany] = useState(null);

useEffect(() => {
  api.get(`/api/invoices/company`).then(res => {
    setCompany(res.data);
  });
}, []);
const printRef = useRef(null);
const [printData, setPrintData] = useState(null);

const handlePrint = useReactToPrint({
  content: () => printRef.current,
});

const loadLogs = async (offset = 0, append = false) => {
  const res = await api.get(
    `/api/invoices/storage-monitor/logs`,
    {
      params: {
        limit: LOGS_LIMIT,
        offset,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined
      }
    }
  );

  if (append) {
    setLogs(prev => [...prev, ...res.data]);
  } else {
    setLogs(res.data);
    setLogsOffset(0);
    setHasMoreLogs(true);
  }

  if (res.data.length < LOGS_LIMIT) {
    setHasMoreLogs(false);
  }
};


  useEffect(() => {
    api.get(`/api/invoices/storage-monitor/overview`)
      .then(res => setStorages(res.data));

  }, []);


useEffect(() => {
  loadLogs(0, false);
}, []);


  const openStorage = (s) => {
    setSelectedStorage(s);
    api.get(`/api/invoices/storage-monitor/${s.id}/items`)
      .then(res => setStorageItems(res.data));
  };

const filteredStorageItems = storageItems.filter((i) => {
  const search = itemSearch.toLowerCase();

  const name = (i.name || "").toLowerCase();
  const code = (i.code || "").toLowerCase();
  const id = String(i.item_id || "");

  return (
    name.includes(search) ||
    code.includes(search) ||
    id.includes(search)
  );
});


const refetchData = async () => {
  // refresh storages overview
  const storagesRes = await api.get(
    `/api/invoices/storage-monitor/overview`
  );
  setStorages(storagesRes.data);

  // refresh current storage items
  if (selectedStorage) {
    const itemsRes = await api.get(
      `/api/invoices/storage-monitor/${selectedStorage.id}/items`
    );
    setStorageItems(itemsRes.data);
  }

  // refresh logs (reset pagination)
  setLogsOffset(0);
  setHasMoreLogs(true);
  await loadLogs(0, false);
};

// ===== Permissions =====
let permissions = {};
try {
  const raw = localStorage.getItem("permissions");
  permissions = raw ? JSON.parse(raw) : {};
} catch {
  permissions = {};
}

const stockPerm = permissions?.stock_management || {};
const canAdjustStock = stockPerm?.add === true;


  return (
    <div className="">
      {/* Tabs */}
      <div className="flex justify-between items-center border-b-2 border-gray-400 bg-white p-4 shadow-b-lg">
        <h1 className="text-2xl font-semibold text-gray-700 tracking-wide">
          {t("StorageMonitor.title")}
        </h1>
        <div className="">
{canAdjustStock && (
  <button
    onClick={() => setOpenTx(true)}
    className="
      px-4 py-2
      text-sm font-medium
      rounded-md
      bg-[#2f788a] text-white
      hover:bg-[#256273]
      transition
      shadow-sm
    "
  >
    {t("StorageMonitor.actions.adjust_stock")}
  </button>
)}

{canAdjustStock && (
  <button
    onClick={() => setOpenStorages(true)}
    className="
      px-4 py-2 mx-2
      rounded-lg
      text-sm font-medium
      text-gray-700
      bg-white
      border border-gray-200
      shadow-sm
      hover:bg-gray-50 hover:border-gray-300
      active:scale-[0.98]
      transition
    "
  >
    {t("StorageMonitor.actions.manage_storages")}
  </button>
)}


</div>

        </div>
        <div className="flex justify-between items-center border-b bg-white px-8">
        <div className="flex gap-1">
            <button
            onClick={() => setTab("storages")}
            className={`px-4 py-2 text-lg font-medium 
                ${
                tab === "storages"
                    ? "bg-[#e5f6f8] text-[#2f788a]  border-b-4 border-[#2f788a]"
                    : "text-gray-500 hover:text-[#2f788a]"
                }`}
            >
            {t("StorageMonitor.tabs.storages")}
            </button>

            <button
            onClick={() => setTab("logs")}
            className={`px-4 py-2 text-lg font-medium 
                ${
                tab === "logs"
                    ? "bg-[#e5f6f8] text-[#2f788a]  border-b-4 border-[#2f788a]"
                    : "text-gray-500 hover:text-[#2f788a]"
                }`}
            >
            {t("StorageMonitor.tabs.movements")}
            </button>
        </div>
        </div>


      {/* STORAGES TAB */}
      {tab === "storages" && (
        <div className="grid grid-cols-3 gap-4 p-4 ">
          {storages.map(s => (
            <div
              key={s.id}
              className={`border border-gray-600 p-4 cursor-pointer transition rounded-lg shadow-lg
                ${
                    selectedStorageId === s.id
                    ? "bg-gray-200"
                    : "bg-white hover:bg-gray-100"
                }
                `}
              onClick={() => {
                setSelectedStorageId(s.id);
                openStorage(s);
                }}
            >
              <div className="font-bold text-xl text-center">{s.name}</div>
              <div className="flex items-center border-b border-black px-4 mb-2 py-1" />
              <div className="flex"><span className="mx-2">{t("StorageMonitor.storages.items")} : </span> {s.items_count}</div>
              <div className="flex"><span className="mx-2">{t("StorageMonitor.storages.total_qty")} : </span>{s.total_qty}</div>
              <div className="flex"><span className="mx-2">{t("StorageMonitor.storages.location")} : </span>{s.location}</div>
            </div>
          ))}

          {selectedStorage && (
            <div className="col-span-3 mt-4">
                <div className="flex flex-row items-center justify-between">
                    <div>
                <h3 className=" flex items_center gap-2">
                {t("StorageMonitor.storages.items_in")} :<span className="font-bold text-lg items-center">{selectedStorage.name}</span>
              </h3>
              </div>
                <div className=" flex justify-end">
                <input
                    type="text"
                    placeholder={t("StorageMonitor.storages.search_placeholder")}
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    className="w-72 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#2f788a]"
                />
                </div>
 
              </div>

              <div className="flex items-center border-b border-gray-300 px-4 mb-2 py-1" />

              <div className="max-h-[calc(100vh-420px)] overflow-y-auto rounded-lg border border-gray-200 bg-white">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600 uppercase tracking-wide">
                    <tr>
                        <th className="px-4 py-3 text-start font-medium">{t("StorageMonitor.table.id")}</th>
                        <th className="px-4 py-3 text-start font-medium">{t("StorageMonitor.table.code")}</th>
                        <th className="px-4 py-3 text-start font-medium">{t("StorageMonitor.table.item_name")}</th>
                        <th className="px-4 py-3 text-end font-medium">{t("StorageMonitor.table.quantity")}</th>
                        <th className="px-4 py-3 text-start font-medium">{t("StorageMonitor.table.unit")}</th>
                    </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-200">
                    {filteredStorageItems.map((i) => (
                        <tr
                        key={i.item_id}
                        className={`transition
                          ${canAdjustStock ? "hover:bg-gray-100 cursor-pointer" : "cursor-default"}
                        `}
                        onClick={() => {
                          if (!canAdjustStock) return;

                          setQuickAdjustItem({
                            item_id: i.item_id,
                            item_name: i.name,
                            unit_name: i.unit_name,
                            storage_id: selectedStorage.id,
                            storage_name: selectedStorage.name,
                          });
                          setQuickAdjustOpen(true);
                        }}
                      >
                        <td className="px-4 py-2 text-gray-500 font-mono">
                            {i.item_id}
                        </td>
                        <td className="px-4 py-2 font-mono text-gray-700">
                            {i.code}
                        </td>

                        <td className="px-4 py-2 text-gray-700">
                            {i.name}
                        </td>

                        <td
                            className={`px-4 py-2 text-end font-semibold
                            ${
                                i.qty < 0
                                ? "text-red-500"
                                : "text-gray-700"
                            }
                            `}
                        >
                            {i.qty}
                        </td>

                        <td className="px-4 py-2 text-gray-500 text-sm">
                            {i.unit_name || "-"}
                        </td>                        
                        </tr>
                    ))}

                    {filteredStorageItems.length === 0 && (
                        <tr>
                        <td
                            colSpan={3}
                            className="px-4 py-6 text-center text-gray-400"
                        >
                           {t("StorageMonitor.states.no_items")}
                        </td>
                        </tr>
                    )}
                    </tbody>
                </table>
                </div>
            </div>
          )}
        </div>
      )}

      {/* LOGS TAB */}
        {tab === "logs" && (
        <div className="max-h-[calc(100vh-180px)] overflow-y-auto rounded-lg border border-gray-200 bg-white m-3">
            <div className="flex items-end gap-4 px-4 py-3 border-b bg-gray-50">
            <div>
                <label className="block text-xs text-gray-500 mb-1">{t("StorageMonitor.filters.from")}</label>
                <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
                />
            </div>

            <div>
                <label className="block text-xs text-gray-500 mb-1">{t("StorageMonitor.filters.to")}</label>
                <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
                />
            </div>

            <button
                onClick={() => loadLogs(0, false)}
                className="h-9 px-5 rounded-lg bg-[#2f788a] text-white text-sm font-medium hover:bg-gray-700 transition"
            >
                {t("StorageMonitor.actions.apply")}
            </button>
            </div>
            <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase tracking-wide">
                <tr>
                <th className="px-3 py-3 text-start font-medium">{t("StorageMonitor.table.date")}</th>
                <th className="px-3 py-3 text-start font-medium">{t("StorageMonitor.table.id")}</th>
                <th className="px-3 py-3 text-start font-medium">{t("StorageMonitor.table.code")}</th>
                <th className="px-3 py-3 text-start font-medium">{t("StorageMonitor.table.item_name")}</th>
                <th className="px-3 py-3 text-start font-medium">{t("StorageMonitor.table.storage")}</th>
                <th className="px-3 py-3 text-center font-medium">{t("StorageMonitor.table.direction")}</th>
                <th className="px-3 py-3 text-end font-medium">{t("StorageMonitor.table.quantity")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("StorageMonitor.table.unit")}</th>
                <th className="px-3 py-3 text-start font-medium">{t("StorageMonitor.table.type")}</th>
                <th className="px-3 py-3 text-start font-medium">{t("StorageMonitor.table.reference")}</th>
                <th className="px-3 py-3 text-center font-medium">{t("StorageMonitor.table.action")}</th>
                </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
                {logs.map((l) => (
                <tr
                    key={l.id}
                    className="hover:bg-gray-50 transition"
                >
                    {/* Date / Time (subtle) */}
                    <td className="pl-3 py-2 text-xs text-gray-500 whitespace-nowrap font-bold">
                    {l.date}
                    </td>

                    {/* Item ID */}
                    <td className="px-3 py-2 text-xs text-gray-500 font-mono">
                    {l.item_id}
                    </td>

                    {/* Item Code */}
                    <td className="px-3 py-2 text-xs text-gray-600 font-mono">
                    {l.item_code}
                    </td>

                    {/* Item Name */}
                    <td className="px-3 py-2 text-sm text-gray-700">
                    {l.item_name}
                    </td>

                    {/* Storage */}
                    <td className="px-3 py-2 text-gray-700">
                    {l.storage_name}
                    </td>

                    {/* Direction */}
                    <td className="px-3 py-2 text-center">
                    <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold
                        ${
                            l.direction === "OUT"
                            ? "bg-red-100 text-red-600"
                            : "bg-green-100 text-green-600"
                        }
                        `}
                    >
                        {l.direction}
                    </span>
                    </td>

                    {/* Quantity */}
                    <td className="px-3 py-2 text-end font-semibold text-gray-700">
                    {l.qty}
                    </td>

                    <td className="px-3 py-2 text-xs text-gray-500">
                        {l.unit_name || "-"}
                    </td>                    

                    {/* Type */}
                    <td className="px-3 py-2 text-gray-600 text-sm">
                    {l.type}
                    </td>

                    {/* Reference */}
                    <td className="px-3 py-2 text-gray-500 font-mono text-xs">
                    {l.transaction_id || "-"}
                    </td>

                    <td className=" text-gray-500 font-mono text-xs text-center">
                    <div>
                        <button className="btn-xs bg-[#2f788a] hover:bg-gray-700 text-white text-xs rounded-lg "
                          onClick={() => {
                                setPrintData(l);
                                setTimeout(handlePrint, 50);
                            }}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="size-4">
                          <path fill-rule="evenodd" d="M4 5a2 2 0 0 0-2 2v3a2 2 0 0 0 1.51 1.94l-.315 1.896A1 1 0 0 0 4.18 15h7.639a1 1 0 0 0 .986-1.164l-.316-1.897A2 2 0 0 0 14 10V7a2 2 0 0 0-2-2V2a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v3Zm1.5 0V2.5h5V5h-5Zm5.23 5.5H5.27l-.5 3h6.459l-.5-3Z" clip-rule="evenodd" />
                        </svg>
                        </button>
                    </div>
                    </td>
                </tr>
                ))}

                {logs.length === 0 && (
                <tr>
                    <td
                    colSpan={7}
                    className="px-4 py-6 text-center text-gray-400"
                    >
                    {t("StorageMonitor.states.no_movements")}
                    </td>
                </tr>
                )}
            </tbody>
            </table>
            {hasMoreLogs && (
            <div className="flex justify-center py-4">
                <button
                onClick={() => {
                    const nextOffset = logsOffset + LOGS_LIMIT;
                    setLogsOffset(nextOffset);
                    loadLogs(nextOffset, true);
                }}
                className="px-6 py-2 rounded-lg bg-[#2f788a] text-white text-sm font-medium hover:bg-gray-700 transition"
                >
                {t("StorageMonitor.actions.load_more")}
                </button>
            </div>
            )}
        </div>
        )}
        <div className="hidden">
  {printData && (
    <PrintableStorageMovement
      ref={printRef}
      data={printData}
      company={company}
    />
  )}
</div>
<StorageTransactionModal
  open={openTx}
  onClose={() => setOpenTx(false)}
  onSuccess={() => refetchData()}
/>
<QuickStorageAdjustModal
  open={quickAdjustOpen}
  item={quickAdjustItem}
  onClose={() => setQuickAdjustOpen(false)}
  onSuccess={refetchData}
/>
<ManageStoragesModal
  open={openStorages}
  onClose={() => setOpenStorages(false)}
  onSaved={refetchData}
/>
    </div>
  );
}
