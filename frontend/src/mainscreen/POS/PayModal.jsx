import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
export default function PayModal({
  open,
  onClose,
  grandTotal,
  onConfirm
}) {
  const [paymentType, setPaymentType] = useState("cash");
  const [cashPaid, setCashPaid] = useState("");
  const {t} = useTranslation();
  useEffect(() => {
    if (!open) {
      setPaymentType("cash");
      setCashPaid("");
    }
  }, [open]);

  if (!open) return null;

  const paidAmount = Number(cashPaid || 0);
  const change =
    paymentType === "cash"
      ? Math.max(paidAmount - grandTotal, 0)
      : 0;

  const canConfirm =
    paymentType !== "cash" || paidAmount >= grandTotal;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white w-full max-w-md rounded-xl shadow-lg">

        {/* Header */}
        <div className="px-5 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">
            {t("PayModal.title")}
          </h2>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">

          {/* Payment Type */}
          <div className="grid grid-cols-3 gap-2">
            {["cash", "card", "bank"].map((type) => (
              <button
                key={type}
                onClick={() => setPaymentType(type)}
                className={`py-2 rounded-lg text-sm font-medium border transition
                  ${
                    paymentType === type
                      ? "bg-green-500 text-white border-green-500"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
              >
                {type === "cash"
                  ? t(`PayModal.payment_types.${type}`)
                  : type === "card"
                  ? t(`PayModal.payment_types.${type}`)
                  :t(`PayModal.payment_types.${type}`)}
              </button>
            ))}
          </div>

          {/* Grand Total */}
          <div className="flex justify-between text-sm font-semibold text-gray-700">
            <span>{t("PayModal.totals.grand_total")}</span>
            <span>{grandTotal.toFixed(2)}</span>
          </div>

          {/* Cash Fields */}
          {paymentType === "cash" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  {t("PayModal.totals.amount_paid")}
                </label>
                <input
                  type="number"
                  min="0"
                  value={cashPaid}
                  onChange={(e) => setCashPaid(e.target.value)}
                  className="input input-bordered w-full"
                  placeholder={t("PayModal.placeholders.amount_paid")}
                />
              </div>

              <div className="flex justify-between text-sm font-semibold text-gray-700">
                <span>{t("PayModal.totals.change")}</span>
                <span className={change > 0 ? "text-green-600" : ""}>
                  {change.toFixed(2)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            {t("PayModal.actions.cancel")}
          </button>

          <button
            disabled={!canConfirm}
            onClick={() =>
              onConfirm({
                paymentType,
                cashPaid: paymentType === "cash" ? paidAmount : null,
                change
              })
            }
            className={`px-5 py-2 rounded-lg font-semibold transition
              ${
                canConfirm
                  ? "bg-green-500 text-white hover:bg-green-600"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
          >
            {t("PayModal.actions.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
