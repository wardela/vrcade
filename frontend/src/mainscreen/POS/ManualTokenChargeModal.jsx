import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const parsePositiveTokenAmount = (value) => {
  const normalized = String(value ?? "").trim();

  if (!/^\d+$/.test(normalized)) {
    return null;
  }

  const parsed = Number.parseInt(normalized, 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
};

export default function ManualTokenChargeModal({
  open,
  onClose,
  onSubmit,
  submitting,
  posPointName,
}) {
  const { t } = useTranslation();
  const [tokenAmount, setTokenAmount] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    setTokenAmount("");
    setError("");
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();

    const parsedTokenAmount = parsePositiveTokenAmount(tokenAmount);
    if (parsedTokenAmount == null) {
      setError(t("POS.manual_tokens.validation.invalid_amount"));
      return;
    }

    setError("");
    await onSubmit({
      tokenAmount: parsedTokenAmount,
    });
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-md rounded-3xl border border-base-300 bg-white shadow-2xl">
        <div className="border-b border-base-300 px-6 py-5">
          <h2 className="text-xl font-semibold text-gray-900">
            {t("POS.manual_tokens.title")}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {t("POS.manual_tokens.subtitle", {
              pos: posPointName || t("POS.manual_tokens.current_session"),
            })}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700">
              {t("POS.manual_tokens.fields.amount")}
            </label>
            <input
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              value={tokenAmount}
              onChange={(event) => setTokenAmount(event.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-[#2f788a] focus:outline-none focus:ring-2 focus:ring-[#2f788a]/20"
              placeholder={t("POS.manual_tokens.placeholders.amount")}
              disabled={submitting}
            />
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {t("POS.manual_tokens.hint")}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={submitting}
            >
              {t("POS.actions.back")}
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting
                ? t("POS.manual_tokens.actions.submitting")
                : t("POS.manual_tokens.actions.submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
