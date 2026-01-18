import { useEffect, useRef, useState } from "react";
import api from "../../utils/axiosInstance";
import { useTranslation } from "react-i18next";
export default function ItemSearchModal({ onClose, onSelect }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const {t} = useTranslation();
  const backdropRef = useRef(null);

  // Close on outside click
  const handleBackdropClick = (e) => {
    if (e.target === backdropRef.current) {
      onClose();
    }
  };

  const runSearch = async () => {
    if (q.trim().length < 1) {
      setResults([]);
      setSearched(false);
      return;
    }

    try {
      setLoading(true);
      setSearched(true);
      const res = await api.get(
        `/api/invoices/items/search`,
        { params: { q } }
      );
      setResults(res.data || []);
    } catch (err) {
      console.error("Item search error", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Allow Enter key to trigger search
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      runSearch();
    }
  };

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center"
    >
      <div className="bg-white w-[950px] max-w-[95vw] rounded-xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b bg-gray-50">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              {t("ItemSearchModal.title")}
            </h2>
            <p className="text-xs text-gray-500">
              {t("ItemSearchModal.subtitle")}
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Search bar */}
        <div className="px-5 py-4 border-b">
          <div className="flex items-center gap-3">
            <input
              type="text"
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder= {t("ItemSearchModal.search.placeholder")}
              className="flex-1 h-[40px] px-4 border rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-[#2f788a]/40"
            />

            <button
              onClick={runSearch}
              className="h-[40px] px-5 rounded-lg
                         bg-[#2f788a] text-white text-sm font-medium
                         hover:bg-[#256274] transition
                         flex items-center gap-2"
            >
              {/* ICON PLACEHOLDER — replace with SVG */}
              <span className="text-base"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
</svg>
</span>
              {t("ItemSearchModal.search.button")}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[420px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-100 border-b">
              <tr>
                <th className="px-3 py-2 text-center text-xs text-gray-500">{t("ItemSearchModal.table.id")}</th>
                <th className="px-3 py-2 text-start text-xs text-gray-500">{t("ItemSearchModal.table.code")}</th>
                <th className="px-3 py-2 text-start text-xs text-gray-500">{t("ItemSearchModal.table.name")}</th>
                <th className="px-3 py-2 text-start text-xs text-gray-500">{t("ItemSearchModal.table.category")}</th>
                <th className="px-3 py-2 text-end text-xs text-gray-500">{t("ItemSearchModal.table.price")}</th>
                <th className="px-3 py-2 text-end text-xs text-gray-500">{t("ItemSearchModal.table.stock")}</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-400">
                    {t("ItemSearchModal.states.loading")}
                  </td>
                </tr>
              )}

              {!loading && searched && results.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-400">
                    {t("ItemSearchModal.states.empty")}
                  </td>
                </tr>
              )}

              {!loading &&
                results.map((it) => (
                  <tr
                    key={it.id}
                    onClick={() => onSelect(it.id)}
                    className="hover:bg-gray-50 cursor-pointer border-b"
                  >
                    <td className="px-3 py-2 text-center font-mono text-xs text-gray-500">
                      {it.id}
                    </td>
                    <td className="px-3 py-2">{it.code}</td>
                    <td className="px-3 py-2 font-medium">{it.name}</td>
                    <td className="px-3 py-2 text-gray-600">
                      {it.category_name || "-"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {Number(it.price_with_tax).toFixed(3)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {Number(it.stock_qty).toFixed(3)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t bg-gray-50 text-xs text-gray-500">
          {t("ItemSearchModal.footer.hint")}
        </div>
      </div>
    </div>
  );
}
