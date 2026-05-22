import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchPortalInvoiceItems } from "../../api/portalApi";
import {
  EmptyState,
  FieldInput,
  FieldSelect,
  ModalHeader,
  ModalShell,
} from "./CreateInvoiceUi";
import { format3 } from "./invoiceMath";

export default function ItemBrowserModal({ open, onClose, onSelect }) {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return undefined;

    let disposed = false;
    const timeoutId = window.setTimeout(async () => {
      try {
        setLoading(true);
        setError("");
        const payload = await fetchPortalInvoiceItems({
          q: query,
          limit: 100,
        });

        if (!disposed) {
          setItems(payload || []);
        }
      } catch (requestError) {
        if (!disposed) {
          setError(requestError.message || t("portalCreateInvoice.item_browser.errors.load_failed"));
          setItems([]);
        }
      } finally {
        if (!disposed) {
          setLoading(false);
        }
      }
    }, 180);

    return () => {
      disposed = true;
      window.clearTimeout(timeoutId);
    };
  }, [open, query, t]);

  if (!open) return null;

  const categories = Array.from(
    new Map(
      items
        .filter((item) => item.category_name)
        .map((item) => [item.category, { id: item.category, name: item.category_name }])
    ).values()
  ).sort((left, right) => String(left.name).localeCompare(String(right.name)));

  const filteredItems = items.filter((item) => {
    if (favoritesOnly && item.fav !== true) return false;
    if (categoryFilter !== "all" && String(item.category) !== categoryFilter) return false;
    return true;
  });

  return (
    <ModalShell onClose={onClose} wide>
      <ModalHeader title={t("portalCreateInvoice.item_browser.title")} onClose={onClose} />

      <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px_auto]">
          <FieldInput
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("portalCreateInvoice.item_browser.search_placeholder")}
          />

          <FieldSelect
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
          >
            <option value="all">{t("portalCreateInvoice.item_browser.all_categories")}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </FieldSelect>

          <button
            type="button"
            onClick={() => setFavoritesOnly((current) => !current)}
            className={`min-h-[52px] rounded-[18px] border px-4 text-sm font-semibold transition ${
              favoritesOnly
                ? "border-[#2f788a] bg-[#eef6f9] text-[#2f788a]"
                : "border-[#dbe7ec] bg-white text-slate-600"
            }`}
          >
            {t("portalCreateInvoice.item_browser.favorites")}
          </button>
        </div>

        <div className="mt-4 grid gap-3">
          {loading ? (
            <EmptyState title={t("portalCreateInvoice.item_browser.loading_title")} copy="" />
          ) : error ? (
            <div className="rounded-[22px] border border-[#f1d4d4] bg-[#fff7f7] px-4 py-4 text-sm text-[#8e3d3d]">
              {error}
            </div>
          ) : filteredItems.length === 0 ? (
            <EmptyState title={t("portalCreateInvoice.item_browser.empty_title")} copy="" />
          ) : (
            filteredItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item)}
                className="rounded-[22px] border border-[#dbe7ec] bg-[#fbfdfe] p-4 text-start shadow-[0_12px_24px_rgba(39,89,104,0.06)] transition hover:border-[#2f788a]/35 hover:bg-white"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h4 className="text-base font-semibold text-slate-800">{item.name}</h4>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span>{format3(item.price_with_tax)}</span>
                      <span>{item.category_name || t("portalCommon.empty.value")}</span>
                      <span>{item.unit_name || t("portalCommon.empty.value")}</span>
                    </div>
                  </div>

                  {item.fav ? (
                    <span className="shrink-0 rounded-full bg-[#fff7d6] px-3 py-1 text-xs font-semibold text-[#9a6a00]">
                      {t("portalCreateInvoice.item_browser.favorite_badge")}
                    </span>
                  ) : null}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </ModalShell>
  );
}
