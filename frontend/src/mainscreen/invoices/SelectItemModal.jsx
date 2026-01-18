import { useEffect, useState, useRef } from "react";
import api from "../../utils/axiosInstance";
import Popup from "../../components/Popup";
import { useTranslation } from "react-i18next";
export default function SelectItemModal({ open, onClose, onSelect }) {
  const modalRef = useRef(null);

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const {t} = useTranslation();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [onlyFavs, setOnlyFavs] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
const [popupMessage, setPopupMessage] = useState(null);

const showPopup = (message) => {
  setPopupMessage(message);
};

const closePopup = () => {
  setPopupMessage(null);
};

  /* ---------------- RESET ---------------- */
  const resetState = () => {
    setSearch("");
    setCategory("all");
    setOnlyFavs(false);
    setSelectedItem(null);
  };

  /* ---------------- CLICK OUTSIDE ---------------- */
  useEffect(() => {
    if (!open) return;

    const handler = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        resetState();
        onClose();
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  /* ---------------- FETCH DATA ---------------- */
  useEffect(() => {
    if (!open) return;

    Promise.all([
      api.get(`/api/invoices/items`),
      api.get(`/api/invoices/items/favorites`),
      api.get(`/api/invoices/categories`)
    ]).then(([itemsRes, favRes, catRes]) => {
      const favIds = new Set(favRes.data.map(i => i.id));

      const merged = itemsRes.data.map(i => ({
        ...i,
        fav: favIds.has(i.id)
      }));

      setItems(merged);
      setCategories(catRes.data);
    });
  }, [open]);

  if (!open) return null;

  /* ---------------- FILTER ---------------- */
  const filteredItems = items.filter(i => {
    if (onlyFavs && !i.fav) return false;
    if (category !== "all" && i.category !== Number(category)) return false;

    const q = search.toLowerCase();
    return (
      i.name.toLowerCase().includes(q) ||
      (i.code || "").toLowerCase().includes(q) ||
      String(i.id).includes(q)
    );
  });

  /* ---------------- SELECT ---------------- */
  const confirmSelect = () => {
    if (!selectedItem) return;
    onSelect(selectedItem);
    resetState();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">

      <div
        ref={modalRef}
        className="bg-white w-[900px] max-h-[90vh] rounded-xl shadow-xl p-6 overflow-hidden"
      >

        {/* HEADER */}
        <div className="mb-4 border-b pb-3">
          <h2 className="text-xl font-semibold text-gray-700">
            {t("SelectItem.title")}
          </h2>
          <p className="text-sm text-gray-500">
            {t("SelectItem.subtitle")}
          </p>
        </div>
{/* FILTER BAR */}
<div className="grid grid-cols-12 gap-3 mb-4 items-center">

  {/* Search */}
  <div className="col-span-7">
    <input
      className="w-full h-10 border rounded-md px-3 text-sm
                 focus:ring-2 focus:ring-[#2f788a] focus:outline-none"
      placeholder={t("SelectItem.search_placeholder")}
      onChange={(e) => setSearch(e.target.value)}
    />
  </div>

  {/* Category */}
  <div className="col-span-4">
    <select
      className="w-full h-10 border rounded-md px-3 text-sm
                 focus:ring-2 focus:ring-[#2f788a] focus:outline-none"
      value={category}
      onChange={(e) => setCategory(e.target.value)}
    >
      <option value="all">{t("SelectItem.category_all")}</option>
      {categories.map(c => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  </div>

  {/* Favorites */}
  <div className="col-span-1 flex justify-center">
    <label
      className={`flex items-center gap-2 px-3 h-10 rounded-md border cursor-pointer
        text-sm transition
        ${
          onlyFavs
            ? "bg-yellow-50 border-yellow-300 text-yellow-700"
            : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
        }`}
    >
      <input
        type="checkbox"
        checked={onlyFavs}
        onChange={(e) => setOnlyFavs(e.target.checked)}
        className="hidden"
      />
      <span className="text-base">★</span>
    </label>
  </div>

</div>


        {/* ITEMS LIST */}
        <div className="border rounded-md max-h-[420px] overflow-y-auto">
          {filteredItems.map(i => (
            <div
              key={i.id}
              onClick={() => setSelectedItem(i)}
              className={`px-4 py-3 cursor-pointer transition
                ${
                  selectedItem?.id === i.id
                    ? "bg-[#e5f6f8] border-l-4 border-[#2f788a]"
                    : "hover:bg-gray-100"
                }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium text-gray-700">
                    {i.name}
                  </div>
<div className="text-xs text-gray-500 flex gap-3">
  <span>#{i.id}</span>
  <span>{i.code}</span>
  <span>{i.price_with_tax} JOD</span>
<span
  className={`font-semibold ${
    !i.is_stocked
      ? "text-blue-600"
      : i.stock_qty <= 0
      ? "text-red-600"
      : i.stock_qty <= i.minimum_qty_alert
      ? "text-orange-600"
      : "text-green-600"
  }`}
>
  {!i.is_stocked ? (
    t("SelectItem.item.not_stocked")
  ) : (
    <>
      {t("SelectItem.item.stock")}{" "}
      {Number(i.stock_qty).toFixed(3)}
    </>
  )}
</span>



</div>
                </div>

                {i.fav && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                   {t("SelectItem.badges.favorite")}
                  </span>
                )}
              </div>
            </div>
          ))}

          {filteredItems.length === 0 && (
            <div className="p-6 text-center text-sm text-gray-500">
              {t("SelectItem.empty")}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={() => {
              resetState();
              onClose();
            }}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            {t("SelectItem.actions.cancel")}
          </button>

          <button
            onClick={confirmSelect}
            disabled={!selectedItem}
            className={`px-6 py-2 text-sm font-medium rounded-md transition
              ${
                selectedItem
                  ? "bg-[#2f788a] text-white hover:bg-[#256273]"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
          >
            {t("SelectItem.actions.select")}
          </button>
        </div>

      </div>
    </div>
  );
}
