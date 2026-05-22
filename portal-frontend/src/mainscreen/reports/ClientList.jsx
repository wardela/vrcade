import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "./apiClient";

export default function ClientList({ onSelect, onClose }) {
  const { t } = useTranslation();
  const modalRef = useRef(null);
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let mounted = true;

    api
      .get("/api/portal/reports/clients")
      .then((response) => {
        if (mounted) {
          setClients(response.data || []);
        }
      })
      .catch((error) => {
        console.error("Failed to load portal clients", error);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const filteredClients = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return clients;
    }

    return clients.filter((client) => {
      return (
        String(client.id || "").includes(query) ||
        String(client.name || "").toLowerCase().includes(query) ||
        String(client.phone || "").toLowerCase().includes(query) ||
        String(client.detail_value || "").toLowerCase().includes(query)
      );
    });
  }, [clients, search]);

  return (
    <div className="fixed inset-0 z-50 bg-black/45 p-4 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="mx-auto flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">{t("ClientList.title")}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {t("SalesReports.filters.select_client")}
              </p>
            </div>
            <button
              type="button"
              className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50"
              onClick={onClose}
            >
              {t("portalCommon.actions.close")}
            </button>
          </div>

          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("ClientList.search_placeholder")}
            className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2f788a] focus:bg-white"
          />
        </div>

        <div className="overflow-y-auto px-3 py-3">
          <div className="space-y-2">
            {filteredClients.map((client) => (
              <button
                key={client.id}
                type="button"
                onClick={() => onSelect(client)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-start transition hover:border-[#2f788a] hover:bg-[#f6fbfc]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-800">{client.name}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      #{client.id}
                      {client.phone ? ` • ${client.phone}` : ""}
                    </p>
                    {client.detail_value ? (
                      <p className="mt-1 text-xs text-slate-400">
                        {client.detail_type || t("ClientList.table.type")}: {client.detail_value}
                      </p>
                    ) : null}
                  </div>
                  <span className="rounded-full bg-[#e5f6f8] px-3 py-1 text-xs font-semibold text-[#2f788a]">
                    {t("ClientList.select_button")}
                  </span>
                </div>
              </button>
            ))}

            {filteredClients.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-400">
                {t("ClientList.empty")}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
