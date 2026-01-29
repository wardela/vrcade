import { useEffect, useRef, useState } from "react";
import api from "../../utils/axiosInstance";
import { useTranslation } from "react-i18next";
export default function QuickStorageAdjustModal({
  open,
  onClose,
  item,
  onSuccess,
}) {
  const modalRef = useRef(null);

  const [qty, setQty] = useState("");
  const [direction, setDirection] = useState("IN");
  const [notes, setNotes] = useState("");
  const [txDate, setTxDate] = useState(() => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });
  const {t} = useTranslation();
  // reset when closed
useEffect(() => {
  if (!open) return;

  setQty("");
  setDirection("IN");
  setNotes("");

  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  setTxDate(`${yyyy}-${mm}-${dd}`);
}, [open]);


  // click outside
  useEffect(() => {
    const handleClick = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose]);

  if (!open || !item) return null;

  const submit = async () => {
    if (!qty || qty <= 0 || !txDate) return;

    await api.post(`/api/invoices/storage-adjust`, {
      item_id: item.item_id,
      qty: Number(qty),
      type: direction,
      from_storage_id: direction === "OUT" ? item.storage_id : null,
      to_storage_id: direction === "IN" ? item.storage_id : null,
      notes,
      date: txDate, // ✅ NEW
    });

    onClose();
    onSuccess?.();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div
        ref={modalRef}
        className="bg-white w-full max-w-md rounded-xl shadow-xl p-6"
      >
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-700">
            {t("QuickStorageAdjustModal.title")}
          </h2>
          <p className="text-sm text-gray-500">
            {item.item_name} — {item.storage_name}
          </p>
        </div>

        {/* Direction */}
        <div className="mb-4">
          <label className="text-sm text-gray-600 mb-1 block">
            {t("QuickStorageAdjustModal.fields.direction")}
          </label>

          <div className="flex gap-2">
            {["IN", "OUT"].map((d) => (
              <button
                key={d}
                onClick={() => setDirection(d)} // ✅ logic stays IN / OUT
                className={`flex-1 py-2 rounded-md text-sm font-medium transition
                  ${
                    direction === d
                      ? d === "IN"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
              >
                {t(
                  d === "IN"
                    ? "QuickStorageAdjustModal.directions.in"
                    : "QuickStorageAdjustModal.directions.out"
                )}
              </button>
            ))}
          </div>
        </div>


        {/* Quantity */}
        <div className="mb-4">
          <label className="text-sm text-gray-600 mb-1 block">
            {t("QuickStorageAdjustModal.fields.quantity")} ({item.unit_name || "-"})
          </label>
          <input
            type="number"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#2f788a]"
          />
        </div>

        {/* Date */}
        <div className="mb-4">
          <label className="text-sm text-gray-600 mb-1 block">
            {t("QuickStorageAdjustModal.fields.date")}
          </label>
          <input
            type="date"
            value={txDate}
            onChange={(e) => setTxDate(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#2f788a]"
          />
        </div>

        {/* Notes */}
        <div className="mb-5">
          <label className="text-sm text-gray-600 mb-1 block">{t("QuickStorageAdjustModal.fields.notes")}</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-md border text-gray-600 hover:bg-gray-50"
          >
            {t("QuickStorageAdjustModal.actions.cancel")}
          </button>
          <button
            onClick={submit}
            className="px-4 py-2 text-sm rounded-md bg-[#2f788a] text-white hover:bg-[#256273]"
          >
            {t("QuickStorageAdjustModal.actions.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
