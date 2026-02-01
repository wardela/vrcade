import { useState } from "react";
import api from "../../utils/axiosInstance";
import { useTranslation } from "react-i18next";

export default function DeleteBalanceModal({
  isOpen,
  dueBalanceId,
  onClose,
  onDeleted
}) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleDelete = async () => {
    setLoading(true);
    try {
      await api.delete(
        `/api/invoices/due-balances/${dueBalanceId}`
      );
      onDeleted();
      onClose();
    } catch (err) {
      console.error("Error deleting due balance:", err);
    } finally {
      setLoading(false);
    }
  };
  const {t} = useTranslation();
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white w-[420px] rounded-2xl shadow-xl border border-gray-200 p-6">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-900">
            {t("DeleteBalanceModal.title")}
          </h2>
          <p className="text-sm text-gray-500">
            {t("DeleteBalanceModal.message")}
            <br />
            {t("DeleteBalanceModal.warning")}
          </p>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-all"
            disabled={loading}
          >
            {t("DeleteBalanceModal.buttons.cancel")}
          </button>

          <button
            onClick={handleDelete}
            disabled={loading}
            className="px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-all focus:outline-none focus:ring-2 focus:ring-red-500/40"
          >
            {loading ? t("DeleteBalanceModal.buttons.deleting") : t("DeleteBalanceModal.buttons.delete")}
          </button>
        </div>
      </div>
    </div>
  );
}
