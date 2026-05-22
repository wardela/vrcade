import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActionButton,
  FieldInput,
  FieldLabel,
  FieldSelect,
  FieldTextarea,
  ModalHeader,
  ModalShell,
} from "./CreateInvoiceUi";
import {
  applyInvoiceItemUpdate,
  calculateInvoiceLineValues,
  format3,
  sanitizeInvoiceItemForModal,
} from "./invoiceMath";

export default function InvoiceLineEditModal({
  open,
  item,
  storages,
  exemptAllowed,
  onClose,
  onSave,
  onReplaceItem,
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !item) return;
    setDraft(sanitizeInvoiceItemForModal(item));
    setError("");
  }, [item, open]);

  const lineValues = useMemo(
    () => (draft ? calculateInvoiceLineValues(draft) : null),
    [draft]
  );

  if (!open || !draft) return null;

  const setField = (field, value) => {
    if (field === "exempt" && value === true && !exemptAllowed) {
      setError(t("portalCreateInvoice.errors.exempt_requires_client_detail"));
      return;
    }

    setError("");
    setDraft((current) => applyInvoiceItemUpdate(current, field, value));
  };

  return (
    <ModalShell onClose={onClose} wide>
      <ModalHeader
        title={t("portalCreateInvoice.line_edit.title", { id: draft.id })}
        subtitle={t("portalCreateInvoice.line_edit.subtitle")}
        onClose={onClose}
      />

      <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
        {error ? (
          <div className="mb-4 rounded-[22px] border border-[#f1d4d4] bg-[#fff7f7] px-4 py-4 text-sm text-[#8e3d3d]">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-2">
          <FieldLabel>
            <span>{t("portalCreateInvoice.line_edit.item_id")}</span>
            <FieldInput value={draft.item_id || ""} readOnly />
          </FieldLabel>

          <FieldLabel>
            <span>{t("portalCreateInvoice.line_edit.item_code")}</span>
            <FieldInput value={draft.code || ""} readOnly />
          </FieldLabel>

          <FieldLabel className="xl:col-span-2">
            <span>{t("portalCreateInvoice.line_edit.item_name")}</span>
            <FieldInput value={draft.desc || ""} readOnly />
          </FieldLabel>

          <div className="xl:col-span-2">
            <ActionButton type="button" tone="secondary" onClick={onReplaceItem}>
              {t("portalCreateInvoice.line_edit.replace_item")}
            </ActionButton>
          </div>

          <FieldLabel className="xl:col-span-2">
            <span>{t("portalCreateInvoice.line_edit.line_notes")}</span>
            <FieldTextarea
              rows={3}
              value={draft.notes || ""}
              onChange={(event) => setField("notes", event.target.value)}
            />
          </FieldLabel>

          <FieldLabel>
            <span>{t("portalCreateInvoice.line_edit.unit_price_included")}</span>
            <FieldInput
              type="number"
              min="0"
              step="0.001"
              value={draft.price}
              onChange={(event) => setField("price", event.target.value)}
            />
          </FieldLabel>

          <FieldLabel>
            <span>{t("portalCreateInvoice.line_edit.tax_percent")}</span>
            <FieldInput
              type="number"
              min="0"
              step="0.001"
              value={draft.tax}
              onChange={(event) => setField("tax", event.target.value)}
              disabled={draft.exempt}
            />
          </FieldLabel>

          <FieldLabel>
            <span>{t("portalCreateInvoice.line_edit.unit_price_excluded")}</span>
            <FieldInput
              type="number"
              min="0"
              step="0.001"
              value={draft.price_excl}
              onChange={(event) => setField("price_excl", event.target.value)}
            />
          </FieldLabel>

          <FieldLabel>
            <span>{t("portalCreateInvoice.line_edit.unit")}</span>
            <FieldInput value={draft.unit_name || ""} readOnly />
          </FieldLabel>

          <FieldLabel>
            <span>{t("portalCommon.fields.quantity")}</span>
            <FieldInput
              type="number"
              min="0"
              step="0.001"
              value={draft.qty}
              onChange={(event) => setField("qty", event.target.value)}
            />
          </FieldLabel>

          <FieldLabel>
            <span>{t("portalCreateInvoice.line_edit.storage")}</span>
            <FieldSelect
              value={draft.storage_id || ""}
              onChange={(event) =>
                setField("storage_id", event.target.value ? Number(event.target.value) : null)
              }
              disabled={!draft.is_stocked}
            >
              <option value="">{t("portalCreateInvoice.line_edit.select_storage")}</option>
              {storages.map((storage) => (
                <option key={storage.id} value={storage.id}>
                  {storage.name}
                </option>
              ))}
            </FieldSelect>
          </FieldLabel>

          <FieldLabel>
            <span>{t("portalCreateInvoice.line_edit.discount_percent")}</span>
            <FieldInput
              type="number"
              min="0"
              step="0.001"
              value={draft.discount}
              onChange={(event) => setField("discount", event.target.value)}
            />
          </FieldLabel>

          <FieldLabel>
            <span>{t("portalCreateInvoice.line_edit.discount_value")}</span>
            <FieldInput
              type="number"
              min="0"
              step="0.001"
              value={draft.discount_value}
              onChange={(event) => setField("discount_value", event.target.value)}
            />
          </FieldLabel>

          <FieldLabel>
            <span>{t("portalCreateInvoice.line_edit.tax_value")}</span>
            <FieldInput value={format3(lineValues?.taxValue || 0)} readOnly />
          </FieldLabel>

          <FieldLabel>
            <span>{t("portalCreateInvoice.line_edit.total_included")}</span>
            <FieldInput value={format3(lineValues?.totalIncl || 0)} readOnly />
          </FieldLabel>

          <label className="flex items-center justify-between rounded-[22px] border border-[#dbe7ec] bg-[#f7fbfc] px-4 py-4 xl:col-span-2">
            <div>
              <div className="text-sm font-semibold text-slate-700">
                {t("portalCreateInvoice.line_edit.exempt")}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {t("portalCreateInvoice.line_edit.exempt_hint")}
              </div>
            </div>
            <input
              type="checkbox"
              checked={draft.exempt === true}
              onChange={(event) => setField("exempt", event.target.checked)}
              className="h-5 w-5 accent-[#2f788a]"
            />
          </label>
        </div>
      </div>

      <div className="border-t border-[#e2ecef] px-5 py-4 sm:px-6">
        <div className="flex flex-wrap justify-end gap-3">
          <ActionButton type="button" tone="ghost" onClick={onClose}>
            {t("portalCommon.actions.cancel")}
          </ActionButton>
          <ActionButton type="button" tone="primary" onClick={() => onSave(draft)}>
            {t("portalCreateInvoice.line_edit.save_changes")}
          </ActionButton>
        </div>
      </div>
    </ModalShell>
  );
}
