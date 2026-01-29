import { useEffect, useState, useRef } from "react";
import api from "../../utils/axiosInstance";

import Popup from "../../components/Popup";
import { useTranslation } from "react-i18next";

export default function StorageTransactionModal({ open, onClose, onSuccess }) {
  const modalRef = useRef(null);

  const [items, setItems] = useState([]);
  const [storages, setStorages] = useState([]);
  const [categories, setCategories] = useState([]);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [onlyFavs, setOnlyFavs] = useState(false);

  const [selectedItem, setSelectedItem] = useState(null);
  const [type, setType] = useState("IN");
  const [fromStorage, setFromStorage] = useState("");
  const [toStorage, setToStorage] = useState("");
  const [qty, setQty] = useState("");
  const [notes, setNotes] = useState("");
  const {t} = useTranslation();
  const [txDate, setTxDate] = useState(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });

const [popupMessage, setPopupMessage] = useState(null);

const showPopup = (message) => {
  setPopupMessage(message);
};

const closePopup = () => {
  setPopupMessage(null);
};

  /* ---------------- RESET STATE ---------------- */
  const resetState = () => {
    setSearch("");
    setCategory("all");
    setOnlyFavs(false);
    setSelectedItem(null);
    setType("IN");
    setFromStorage("");
    setToStorage("");
    setQty("");
    setNotes("");
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
      api.get(`/api/invoices/storages`),
      api.get(`/api/invoices/categories`)
    ]).then(([itemsRes, favRes, storRes, catRes]) => {
      const favIds = new Set(favRes.data.map(i => i.id));

      const merged = itemsRes.data
        .map(i => ({ ...i, fav: favIds.has(i.id) }))
        .filter(i => i.is_stocked !== false);

      setItems(merged);
      setStorages(storRes.data);
      setCategories(catRes.data);
    });
  }, [open]);

  if (!open) return null;

  /* ---------------- FILTER ITEMS ---------------- */
const filteredItems = items.filter(i => {
  if (onlyFavs && !i.fav) return false;
  if (category !== "all" && i.category !== Number(category)) return false;

  const q = search.toLowerCase();

  const name = (i.name ?? "").toLowerCase();
  const code = (i.code ?? "").toLowerCase();
  const id   = String(i.id ?? "");

  return (
    name.includes(q) ||
    code.includes(q) ||
    id.includes(q)
  );
});



  /* ---------------- SUBMIT ---------------- */
  const submit = async () => {
    if (!selectedItem || !qty || !txDate) {
      showPopup(t("StorageTransactionModal.messages.missing_item_qty"));
      return;
    }

await api.post(`/api/invoices/storage-adjust`, {
  item_id: selectedItem.id,
  qty: Number(qty),
  type,
  from_storage_id: type !== "IN" ? fromStorage : null,
  to_storage_id: type !== "OUT" ? toStorage : null,
  notes,
  date: txDate, // ✅ NEW
});

    onSuccess?.();
    resetState();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">

      <div
        ref={modalRef}
        className="bg-white w-[920px] max-h-[90vh] rounded-xl shadow-xl p-6 overflow-hidden"
      >
        {/* HEADER */}
        <div className="mb-4 border-b pb-3">
          <h2 className="text-xl font-semibold text-gray-700">
            {t("StorageTransactionModal.title")}
          </h2>
          <p className="text-sm text-gray-500">
            {t("StorageTransactionModal.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6">

          {/* LEFT – ITEM PICKER */}
          <div>
            <input
              className="w-full border rounded-md px-3 py-2 mb-3 text-sm focus:ring-2 focus:ring-[#2f788a]"
              placeholder={t("StorageTransactionModal.search.placeholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div className="flex gap-2 mb-3">
              <select
                className="flex-1 border rounded-md px-2 py-1 text-sm"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="all">{t("StorageTransactionModal.search.all_categories")}</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <label className="flex items-center gap-1 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={onlyFavs}
                  onChange={(e) => setOnlyFavs(e.target.checked)}
                />
                {t("StorageTransactionModal.search.favorites")}
              </label>
            </div>

            <div className="border rounded-md max-h-72 overflow-y-auto">
              {filteredItems.map(i => (
                <div
                  key={i.id}
                  onClick={() => setSelectedItem(i)}
                  className={`px-3 py-2 cursor-pointer transition
                    ${
                      selectedItem?.id === i.id
                        ? "bg-[#e5f6f8] border-l-4 border-[#2f788a]"
                        : "hover:bg-gray-100"
                    }`}
                >
                  <div className="font-medium text-gray-700">{i.name}</div>
                  <div className="text-xs text-gray-500">
                    #{i.id} • {i.code}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT – TRANSACTION FORM */}
          <div className="space-y-3">

            <select
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="IN">{t("StorageTransactionModal.transaction.type_in")}</option>
              <option value="OUT">{t("StorageTransactionModal.transaction.type_out")}</option>
              <option value="TRANSFER">{t("StorageTransactionModal.transaction.type_transfer")}</option>
            </select>

            {type !== "IN" && (
              <select
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={fromStorage}
                onChange={(e) => setFromStorage(e.target.value)}
              >
                <option value="">{t("StorageTransactionModal.transaction.from_storage")}</option>
                {storages.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}

            {type !== "OUT" && (
              <select
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={toStorage}
                onChange={(e) => setToStorage(e.target.value)}
              >
                <option value="">{t("StorageTransactionModal.transaction.to_storage")}</option>
                {storages.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}

            <input
              type="number"
              className="w-full border rounded-md px-3 py-2 text-sm"
              placeholder={t("StorageTransactionModal.transaction.quantity")}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />

            <input
              type="date"
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={txDate}
              onChange={(e) => setTxDate(e.target.value)}
            />

            <textarea
              className="w-full border rounded-md px-3 py-2 text-sm"
              placeholder={t("StorageTransactionModal.transaction.notes")}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            <button
              onClick={submit}
              className="w-full bg-[#2f788a] text-white py-2 rounded-md text-sm font-medium hover:bg-[#256273] transition"
            >
              {t("StorageTransactionModal.actions.confirm")}
            </button>

          </div>
        </div>
      </div>
            {popupMessage && (
        <Popup
          message={popupMessage}
          onClose={closePopup}
        />
      )}
    </div>
  );
}
