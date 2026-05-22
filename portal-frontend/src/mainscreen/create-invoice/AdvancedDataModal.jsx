import { useTranslation } from "react-i18next";
import {
  ActionButton,
  FieldInput,
  FieldLabel,
  FieldSelect,
  ModalHeader,
  ModalShell,
} from "./CreateInvoiceUi";

export default function AdvancedDataModal({
  open,
  onClose,
  draft,
  canEdit,
  onChange,
}) {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <ModalShell onClose={onClose}>
      <ModalHeader
        title={t("portalCreateInvoice.advanced.title")}
        subtitle={t("portalCreateInvoice.advanced.subtitle")}
        onClose={onClose}
      />

      <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldLabel>
            <span>{t("portalCommon.fields.currency")}</span>
            <FieldSelect
              value={draft.currency}
              onChange={(event) => onChange("currency", event.target.value)}
              disabled={!canEdit}
            >
              <option value="JOD">JOD</option>
              <option value="USD">USD</option>
              <option value="SAR">SAR</option>
              <option value="EUR">EUR</option>
            </FieldSelect>
          </FieldLabel>

          <FieldLabel>
            <span>{t("portalCommon.fields.invoice_type")}</span>
            <FieldSelect
              value={draft.type2}
              onChange={(event) => onChange("type2", event.target.value)}
              disabled={!canEdit}
            >
              <option value="local">{t("portalCommon.invoice_types.local")}</option>
              <option value="export">{t("portalCommon.invoice_types.export")}</option>
              <option value="development">{t("portalCommon.invoice_types.development")}</option>
            </FieldSelect>
          </FieldLabel>

          <FieldLabel>
            <span>{t("portalCreateInvoice.advanced.client_detail_type")}</span>
            <FieldSelect
              value={draft.clientDetailType}
              onChange={(event) => onChange("clientDetailType", event.target.value)}
              disabled={!canEdit}
            >
              <option value="TN">{t("portalCommon.client_details.tax_number")}</option>
              <option value="NIN">{t("portalCommon.client_details.national_id")}</option>
              <option value="PN">{t("portalCommon.client_details.personal_number")}</option>
            </FieldSelect>
          </FieldLabel>

          <FieldLabel>
            <span>{t("portalCreateInvoice.advanced.client_detail_value")}</span>
            <FieldInput
              value={draft.clientDetailValue}
              onChange={(event) => onChange("clientDetailValue", event.target.value)}
              placeholder={t("portalCreateInvoice.advanced.client_detail_placeholder")}
              disabled={!canEdit}
            />
          </FieldLabel>

          <FieldLabel>
            <span>{t("portalCommon.fields.client_phone")}</span>
            <FieldInput
              value={draft.clientPhone}
              onChange={(event) => onChange("clientPhone", event.target.value)}
              placeholder="079..."
              disabled={!canEdit}
            />
          </FieldLabel>

          <FieldLabel>
            <span>{t("portalCommon.fields.reference")}</span>
            <FieldInput
              value={draft.reference}
              onChange={(event) => onChange("reference", event.target.value)}
              placeholder={t("portalCreateInvoice.advanced.reference_placeholder")}
              disabled={!canEdit}
            />
          </FieldLabel>

          <label className="flex items-center justify-between rounded-[22px] border border-[#dbe7ec] bg-[#f7fbfc] px-4 py-4 sm:col-span-2">
            <div>
              <div className="text-sm font-semibold text-slate-700">
                {t("portalCreateInvoice.advanced.create_due_balance")}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {t("portalCreateInvoice.advanced.create_due_balance_hint")}
              </div>
            </div>
            <input
              type="checkbox"
              checked={draft.createDueBalance}
              onChange={(event) => onChange("createDueBalance", event.target.checked)}
              disabled={!canEdit}
              className="h-5 w-5 accent-[#2f788a]"
            />
          </label>
        </div>
      </div>

      <div className="border-t border-[#e2ecef] px-5 py-4 sm:px-6">
        <div className="flex justify-end">
          <ActionButton type="button" tone="primary" onClick={onClose}>
            {t("portalCommon.actions.done")}
          </ActionButton>
        </div>
      </div>
    </ModalShell>
  );
}
