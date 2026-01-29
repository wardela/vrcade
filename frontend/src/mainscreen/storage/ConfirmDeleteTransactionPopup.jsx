import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function ConfirmDeleteTransactionPopup({
  open,
  onCancel,
  onConfirm
}) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return;

    const handleKey = (e) => {
      if (e.key === "Escape") onCancel();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[999]"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-md shadow-xl border border-gray-200 w-[420px]"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "scaleIn 0.08s ease-out" }}
      >
        {/* Header */}
        <div className="px-4 py-2.5 border-b bg-gray-50 rounded-t-md">
          <span className="text-[15px] font-semibold text-gray-800">
            {t("StorageMonitor.confirm.title")}
          </span>
        </div>

        {/* Body */}
        <div className="px-5 py-5">
          <p className="text-gray-700 text-[15px] leading-relaxed">
            {t("StorageMonitor.confirm.delete_transaction")}
          </p>
        </div>

        {/* Footer */}
        <div className="px-5 pb-4 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-1.5 text-sm border rounded-md text-gray-600 hover:bg-gray-50"
          >
            {t("UserModal.actions.cancel")}
          </button>

          <button
            onClick={onConfirm}
            className="px-4 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition"
          >
            {t("UserModal.permissions.delete")}
          </button>
        </div>
      </div>

      <style>
        {`
          @keyframes scaleIn {
            0% { transform: scale(0.9); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
        `}
      </style>
    </div>
  );
}
