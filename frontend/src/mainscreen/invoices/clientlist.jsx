import { useEffect, useState, useRef } from "react";
import axios from "axios";
import api from "../../utils/axiosInstance";
import CreateClientModal from "../clients/createclientmodal"
import { useTranslation } from "react-i18next";
export default function ClientList({ onSelect, onClose }) {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [createClientOpen, setCreateClientOpen] = useState(false);
  const {t} = useTranslation();
  useEffect(() => {
    fetchClients();
  }, []);
 
  const fetchClients = async () => {
    try {
      const res = await api.get(`/api/invoices/clients`);
      setClients(res.data || []);
    } catch (err) {
      console.error("Error loading clients:", err);
    }
  };

  // Real-Time Search Filtering
  const filtered = clients.filter((c) => {
    const term = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      String(c.id).includes(term) ||
      (c.detail_value || "").toLowerCase().includes(term)
    );
  });

  // Badges for detail types
  const badgeColor = {
    TN: "bg-green-100 text-green-700",
    NIN: "bg-blue-100 text-blue-700",
    PN: "bg-orange-100 text-orange-700"
  };

  const detailTypeName = {
    TN: t("ClientList.detail_types.TN"),
    NIN: t("ClientList.detail_types.NIN"),
    PN: t("ClientList.detail_types.PN")
    };

    const modalRef = useRef(null);

useEffect(() => {
  const handleClickOutside = (event) => {
    // ⛔ Do NOT close parent modal if child modal is open
    if (createClientOpen) return;

    if (modalRef.current && !modalRef.current.contains(event.target)) {
      onClose();
    }
  };

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, [createClientOpen, onClose]);



  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
      <div
        ref={modalRef}
        className="bg-white rounded-xl shadow-2xl border border-gray-200 w-[850px] max-h-[85vh] p-6 flex flex-col animate-fadeIn"
        >
        {/* HEADER */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-800">{t("ClientList.title")}</h2>
<button
  onClick={() => setCreateClientOpen(true)}
  className="flex items-center gap-2 border border-green-500 text-green-600 
              hover:bg-green-50 px-4 py-2 rounded-lg font-medium 
              transition-all duration-150"
>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
            >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {t("ClientList.add_client")}
            </button>
        </div>

        {/* SEARCH */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder={t("ClientList.search_placeholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded-lg p-3 pl-10 text-gray-700 shadow-sm focus:ring-2 focus:ring-blue-400"
          />
          <svg
            className="w-5 h-5 absolute left-3 top-3.5 text-gray-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
        </div>

        {/* TABLE */}
        <div className="overflow-y-auto rounded-xl border border-gray-200 shadow-inner h-[65vh]">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0 z-10 shadow">
              <tr className="text-gray-600">
                <th className="p-3 text-start font-medium">{t("ClientList.table.id")}</th>
                <th className="p-3 text-start font-medium">{t("ClientList.table.name")}</th>
                <th className="p-3 text-start font-medium">{t("ClientList.table.phone")}</th>
                <th className="p-3 text-start font-medium">{t("ClientList.table.type")}</th>
                <th className="p-3 text-start font-medium">{t("ClientList.table.value")}</th>
                <th className="p-3 text-center font-medium">{t("ClientList.table.select")}</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((c, idx) => (
                <tr
                  key={c.id}
                  className={`border-b transition ${
                    idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                  } hover:bg-blue-50`}
                >
                  <td className="p-3">{c.id}</td>
                  <td className="p-3 font-medium text-gray-800">{c.name}</td>
                  <td className="p-3">{c.phone || "-"}</td>
                  <td className="p-3">
                    <span
                    className={`px-2 py-1 rounded-md text-xs font-semibold ${
                        badgeColor[c.detail_type] || "bg-gray-200 text-gray-700"
                    }`}
                    >
                    {detailTypeName[c.detail_type] || "-"}
                    </span>
                  </td>
                  <td className="p-3">{c.detail_value || "-"}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => onSelect(c)}
                      className="px-4 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition shadow"
                    >
                      {t("ClientList.table.select")}
                    </button>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center p-6 text-gray-400">
                     {t("ClientList.empty")}
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>
      </div>
      {createClientOpen && (
  <CreateClientModal
    isOpen={createClientOpen}
    onClose={() => setCreateClientOpen(false)}
    onCreated={() => {
      fetchClients();          // 🔁 refetch list
      setCreateClientOpen(false);
    }}
  />
)}
    </div>
  );
}
