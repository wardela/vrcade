import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import PaymentMethodPicker from "../../components/PaymentMethodPicker";

const QUICK_CASH_VALUES = [50, 20, 10];
const MILL_FACTOR = 1000;

const toMills = (value) => Math.round(Number(value || 0) * MILL_FACTOR);
const formatAmount = (value) => Number(value || 0).toFixed(3);

function CashSection({
  label,
  amountDue,
  amountPaid,
  setAmountPaid,
  disabled,
}) {
  const { t } = useTranslation();
  const change = Math.max(Number(amountPaid || 0) - Number(amountDue || 0), 0);

  return (
    <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-gray-800">{label}</div>
          <div className="text-xs text-gray-500">
            {t("PayModal.cash.cash_due")}: {formatAmount(amountDue)} JOD
          </div>
        </div>
        <button
          type="button"
          className="text-xs font-semibold text-gray-500 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disabled}
          onClick={() => setAmountPaid("")}
        >
          {t("PayModal.actions.clear")}
        </button>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-600">
          {t("PayModal.totals.amount_paid")}
        </label>
        <input
          type="number"
          min="0"
          step="0.001"
          value={amountPaid}
          disabled={disabled}
          onChange={(e) => setAmountPaid(e.target.value)}
          className="input input-bordered w-full"
          placeholder="0.000"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK_CASH_VALUES.map((value) => (
          <button
            key={value}
            type="button"
            className="btn btn-sm btn-outline"
            disabled={disabled}
            onClick={() =>
              setAmountPaid((prev) => String((Number(prev || 0) + value).toFixed(3)))
            }
          >
            +{value}
          </button>
        ))}
      </div>

      <div className="flex justify-between text-sm font-semibold text-gray-700">
        <span>{t("PayModal.totals.change")}</span>
        <span className={change > 0 ? "text-green-600" : ""}>
          {formatAmount(change)} JOD
        </span>
      </div>
    </div>
  );
}

export default function PayModal({
  open,
  onClose,
  grandTotal,
  onConfirm,
  submitting = false,
  errorMessage = "",
}) {
  const { t } = useTranslation();
  const PAYMENT_METHODS = [
    { value: "cash", label: t("PayModal.payment_types.cash") },
    { value: "card", label: t("PayModal.payment_types.card") },
    { value: "transfer", label: t("PayModal.payment_types.bank") },
  ];
  const [paymentMode, setPaymentMode] = useState("single");
  const [singleMethod, setSingleMethod] = useState("cash");
  const [singleCashPaid, setSingleCashPaid] = useState("");

  const [splitMethodOne, setSplitMethodOne] = useState("cash");
  const [splitMethodTwo, setSplitMethodTwo] = useState("card");
  const [splitAmountOne, setSplitAmountOne] = useState("");
  const [splitAmountTwo, setSplitAmountTwo] = useState("");
  const [splitCashPaidOne, setSplitCashPaidOne] = useState("");
  const [splitCashPaidTwo, setSplitCashPaidTwo] = useState("");

  useEffect(() => {
    if (!open) {
      setPaymentMode("single");
      setSingleMethod("cash");
      setSingleCashPaid("");
      setSplitMethodOne("cash");
      setSplitMethodTwo("card");
      setSplitAmountOne("");
      setSplitAmountTwo("");
      setSplitCashPaidOne("");
      setSplitCashPaidTwo("");
      return;
    }

    setSplitAmountOne(Number(grandTotal || 0).toFixed(3));
    setSplitAmountTwo("0.000");
  }, [open, grandTotal]);

  const splitValidation = useMemo(() => {
    if (paymentMode !== "split") return { valid: true, message: "" };

    const amountOne = Number(splitAmountOne || 0);
    const amountTwo = Number(splitAmountTwo || 0);

    if (splitMethodOne === splitMethodTwo) {
      return { valid: false, message: t("PayModal.validation.different_methods") };
    }

    if (amountOne <= 0 || amountTwo <= 0) {
      return { valid: false, message: t("PayModal.validation.positive_split_amounts") };
    }

    if (toMills(amountOne + amountTwo) !== toMills(grandTotal)) {
      return { valid: false, message: t("PayModal.validation.split_total_match") };
    }

    if (
      splitMethodOne === "cash" &&
      Number(splitCashPaidOne || 0) < amountOne
    ) {
      return { valid: false, message: t("PayModal.validation.first_cash_insufficient") };
    }

    if (
      splitMethodTwo === "cash" &&
      Number(splitCashPaidTwo || 0) < amountTwo
    ) {
      return { valid: false, message: t("PayModal.validation.second_cash_insufficient") };
    }

    return { valid: true, message: "" };
  }, [
    paymentMode,
    splitAmountOne,
    splitAmountTwo,
    splitCashPaidOne,
    splitCashPaidTwo,
    splitMethodOne,
    splitMethodTwo,
    grandTotal,
    t,
  ]);

  const singleValidation = useMemo(() => {
    if (paymentMode !== "single") return { valid: true, message: "" };

    if (singleMethod === "cash" && Number(singleCashPaid || 0) < Number(grandTotal || 0)) {
      return { valid: false, message: t("PayModal.validation.single_cash_insufficient") };
    }

    return { valid: true, message: "" };
  }, [paymentMode, singleMethod, singleCashPaid, grandTotal, t]);

  const validationMessage =
    paymentMode === "single" ? singleValidation.message : splitValidation.message;

  const canConfirm =
    !submitting &&
    (paymentMode === "single" ? singleValidation.valid : splitValidation.valid);

  if (!open) return null;

  const handleConfirm = () => {
    if (!canConfirm) return;

    if (paymentMode === "single") {
      const amount = Number(Number(grandTotal || 0).toFixed(3));

      onConfirm({
        paymentMode,
        payments: [
          {
            payment_method: singleMethod,
            amount,
            amount_paid: singleMethod === "cash" ? Number(singleCashPaid || 0) : null,
          },
        ],
      });

      return;
    }

    onConfirm({
      paymentMode,
      payments: [
        {
          payment_method: splitMethodOne,
          amount: Number(Number(splitAmountOne || 0).toFixed(3)),
          amount_paid:
            splitMethodOne === "cash" ? Number(splitCashPaidOne || 0) : null,
        },
        {
          payment_method: splitMethodTwo,
          amount: Number(Number(splitAmountTwo || 0).toFixed(3)),
          amount_paid:
            splitMethodTwo === "cash" ? Number(splitCashPaidTwo || 0) : null,
        },
      ],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-lg">
        <div className="border-b px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-800">
            {t("PayModal.title")}
          </h2>
        </div>

        <div className="space-y-5 p-5">
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: "single", label: t("PayModal.modes.single") },
              { value: "split", label: t("PayModal.modes.split") },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                disabled={submitting}
                onClick={() => setPaymentMode(option.value)}
                className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                  paymentMode === option.value
                    ? "border-[#2f788a] bg-[#2f788a] text-white"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="flex justify-between rounded-xl bg-base-200 px-4 py-3 text-sm font-semibold text-gray-700">
            <span>{t("PayModal.totals.grand_total")}</span>
            <span>{formatAmount(grandTotal)} JOD</span>
          </div>

          {paymentMode === "single" ? (
            <div className="space-y-4">
              <PaymentMethodPicker
                methods={PAYMENT_METHODS}
                value={singleMethod}
                onChange={setSingleMethod}
                disabled={submitting}
              />

              {singleMethod === "cash" && (
                <CashSection
                  label={t("PayModal.cash.single")}
                  amountDue={grandTotal}
                  amountPaid={singleCashPaid}
                  setAmountPaid={setSingleCashPaid}
                  disabled={submitting}
                />
              )}
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-4 rounded-xl border border-gray-200 p-4">
                <PaymentMethodPicker
                  title={t("PayModal.payment_labels.first")}
                  methods={PAYMENT_METHODS.filter(
                    (method) => method.value !== splitMethodTwo,
                  )}
                  value={splitMethodOne}
                  onChange={setSplitMethodOne}
                  disabled={submitting}
                />

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-600">
                    {t("PayModal.fields.amount")}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={splitAmountOne}
                    disabled={submitting}
                    onChange={(e) => setSplitAmountOne(e.target.value)}
                    className="input input-bordered w-full"
                  />
                </div>

                {splitMethodOne === "cash" && (
                  <CashSection
                    label={t("PayModal.cash.first")}
                    amountDue={Number(splitAmountOne || 0)}
                    amountPaid={splitCashPaidOne}
                    setAmountPaid={setSplitCashPaidOne}
                    disabled={submitting}
                  />
                )}
              </div>

              <div className="space-y-4 rounded-xl border border-gray-200 p-4">
                <PaymentMethodPicker
                  title={t("PayModal.payment_labels.second")}
                  methods={PAYMENT_METHODS.filter(
                    (method) => method.value !== splitMethodOne,
                  )}
                  value={splitMethodTwo}
                  onChange={setSplitMethodTwo}
                  disabled={submitting}
                />

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-600">
                    {t("PayModal.fields.amount")}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={splitAmountTwo}
                    disabled={submitting}
                    onChange={(e) => setSplitAmountTwo(e.target.value)}
                    className="input input-bordered w-full"
                  />
                </div>

                {splitMethodTwo === "cash" && (
                  <CashSection
                    label={t("PayModal.cash.second")}
                    amountDue={Number(splitAmountTwo || 0)}
                    amountPaid={splitCashPaidTwo}
                    setAmountPaid={setSplitCashPaidTwo}
                    disabled={submitting}
                  />
                )}
              </div>
            </div>
          )}

          {validationMessage && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              {validationMessage}
            </div>
          )}

          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t px-5 py-4">
          <button
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t("PayModal.actions.cancel")}
          </button>

          <button
            disabled={!canConfirm}
            onClick={handleConfirm}
            className={`rounded-lg px-5 py-2 font-semibold transition ${
              canConfirm
                ? "bg-green-500 text-white hover:bg-green-600"
                : "cursor-not-allowed bg-gray-300 text-gray-500"
            }`}
          >
            {submitting ? t("PayModal.actions.processing") : t("PayModal.actions.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
