import api from "../../utils/axiosInstance";
import { useTranslation } from "react-i18next";

export default function DeleteReceiptVoucherModal({
  isOpen,
  receiptVoucherId,
  onClose,
  onDeleted
}) {
  if (!isOpen) return null;

  const handleDelete = async () => {
    try {
      await api.delete(
        `/api/invoices/receipt-vouchers/${receiptVoucherId}`
      );
      onDeleted();
      onClose();
    } catch (err) {
      console.error("Error deleting receipt voucher:", err);
      alert("Failed to delete receipt voucher");
    }
  };
  const {t} = useTranslation();
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          {t("DeleteReceiptVoucherModal.title")}
        </h2>

        <p className="text-sm text-gray-600 mb-6">
          {t("DeleteReceiptVoucherModal.message")}
          <br />
          <span className="text-red-600 font-medium">
            {t("DeleteReceiptVoucherModal.warning")}
          </span>
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {t("DeleteReceiptVoucherModal.buttons.cancel")}
          </button>

          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
          >
            {t("DeleteReceiptVoucherModal.buttons.delete")}
          </button>
        </div>
      </div>
    </div>
  );
}
