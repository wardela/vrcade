import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActionButton,
  FieldInput,
  FieldLabel,
  ModalHeader,
  ModalShell,
} from "./CreateInvoiceUi";

export default function QuantityModal({ open, item, onClose, onConfirm }) {
  const { t } = useTranslation();
  const [quantity, setQuantity] = useState("1");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setQuantity(String(item?.usual_sales_qty || 1));
    setError("");
  }, [item, open]);

  if (!open || !item) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    const parsed = Number(quantity);

    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError(t("portalCreateInvoice.quantity.errors.invalid"));
      return;
    }

    onConfirm(parsed);
  };

  return (
    <ModalShell onClose={onClose}>
      <ModalHeader
        title={t("portalCreateInvoice.quantity.title")}
        subtitle={t("portalCreateInvoice.quantity.subtitle", { item: item.name })}
        onClose={onClose}
      />

      <form onSubmit={handleSubmit} className="grid gap-4 px-5 py-5 sm:px-6">
        {error ? (
          <div className="rounded-[22px] border border-[#f1d4d4] bg-[#fff7f7] px-4 py-4 text-sm text-[#8e3d3d]">
            {error}
          </div>
        ) : null}

        <FieldLabel>
          <span>{t("portalCommon.fields.quantity")}</span>
          <FieldInput
            type="number"
            min="0.001"
            step="0.001"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            autoFocus
          />
        </FieldLabel>

        <div className="flex justify-end gap-3">
          <ActionButton type="button" tone="ghost" onClick={onClose}>
            {t("portalCommon.actions.cancel")}
          </ActionButton>
          <ActionButton type="submit" tone="primary">
            {t("portalCreateInvoice.actions.add_to_invoice")}
          </ActionButton>
        </div>
      </form>
    </ModalShell>
  );
}
