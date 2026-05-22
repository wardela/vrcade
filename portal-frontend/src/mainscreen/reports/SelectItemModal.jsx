import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "./apiClient";

export default function SelectItemModal({ open, onClose, onSelect }) {
  const { t } = useTranslation();
  const modalRef = useRef(null);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    let mounted = true;

    api
      .get("/api/portal/reports/items")
      .then((response) => {
        if (mounted) {
          setItems(response.data || []);
        }
      })
      .catch((error) => {
        console.error("Failed to load portal items", error);
      });

    return () => {
      mounted = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return items;
    }

    return items.filter((item) => {
      return (
        String(item.id || "").includes(query) ||
        String(item.name || "").toLowerCase().includes(query) ||
        String(item.code || "").toLowerCase().includes(query)
      );
    });
  }, [items, search]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/45 p-4 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="mx-auto flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">{t("SelectItem.title")}</h2>
              <p className="mt-1 text-sm text-slate-500">{t("SelectItem.subtitle")}</p>
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
            placeholder={t("SelectItem.search_placeholder")}
            className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#2f788a] focus:bg-white"
          />
        </div>

        <div className="overflow-y-auto px-3 py-3">
          <div className="space-y-2">
            {filteredItems.map((item) => {
              const isSelected = selectedItem?.id === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedItem(item)}
                  className={`w-full rounded-2xl border px-4 py-3 text-start transition ${
                    isSelected
                      ? "border-[#2f788a] bg-[#f6fbfc]"
                      : "border-slate-200 bg-white hover:border-[#2f788a] hover:bg-[#f6fbfc]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-slate-800">{item.name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        #{item.id}
                        {item.code ? ` • ${item.code}` : ""}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {Number(item.price_with_tax || 0).toFixed(3)} JD
                      </p>
                    </div>
                    {isSelected ? (
                      <span className="rounded-full bg-[#2f788a] px-3 py-1 text-xs font-semibold text-white">
                        {t("SelectItem.actions.select")}
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}

            {filteredItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-400">
                {t("SelectItem.empty")}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4">
          <button
            type="button"
            className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
            onClick={onClose}
          >
            {t("portalCommon.actions.cancel")}
          </button>
          <button
            type="button"
            className="rounded-full bg-[#2f788a] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#276472] disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={!selectedItem}
            onClick={() => {
              onSelect(selectedItem);
              onClose();
            }}
          >
            {t("portalCommon.actions.select")}
          </button>
        </div>
      </div>
    </div>
  );
}
