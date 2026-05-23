import { useTranslation } from "react-i18next";
import { ActionButton, FieldInput, FieldLabel, FieldTextarea } from "./CreateInvoiceUi";

export default function CreateInvoiceHeaderCard({
  invoiceNumber,
  clientName,
  invoiceDate,
  paymentType,
  notes,
  canEdit,
  onOpenClientPicker,
  onInvoiceDateChange,
  onPaymentTypeChange,
  onNotesChange,
  onOpenAdvancedData,
}) {
  const { t } = useTranslation();

  return (
    <section className="rounded-[28px] border border-[#dbe7ec] bg-white p-5 shadow-[0_18px_36px_rgba(39,89,104,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="portal-eyebrow">{t("portalShell.modules.create_invoice")}</p>
          <h2 className="text-2xl font-semibold text-slate-800">
            {t("portalCreateInvoice.header.title")}
          </h2>
        </div>

        <div className="rounded-full border border-[#dbe7ec] bg-[#fbfdfe] px-4 py-2 text-sm font-semibold text-slate-700 shadow-[0_8px_20px_rgba(39,89,104,0.06)]">
          {invoiceNumber || "INV-..."}
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <FieldLabel>
          <span>{t("portalCommon.table.client")}</span>
          <div className="flex gap-3">
            <FieldInput
              value={clientName || ""}
              placeholder={t("portalCreateInvoice.header.select_client")}
              readOnly
            />
            <ActionButton
              type="button"
              tone="secondary"
              className="shrink-0"
              onClick={onOpenClientPicker}
              disabled={!canEdit}
            >
              {t("portalCommon.actions.choose")}
            </ActionButton>
          </div>
        </FieldLabel>

        <FieldLabel>
          <span>{t("portalCreateInvoice.header.invoice_date")}</span>
          <FieldInput
            type="date"
            lang="en"
            dir="ltr"
            value={invoiceDate}
            onChange={(event) => onInvoiceDateChange(event.target.value)}
            disabled={!canEdit}
          />
        </FieldLabel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="rounded-[24px] border border-[#dbe7ec] bg-[#fbfdfe] p-4">
          <p className="text-sm font-semibold text-slate-700">
            {t("portalCreateInvoice.header.payment_type")}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={!canEdit}
              onClick={() => onPaymentTypeChange("cash")}
              className={`min-h-[52px] rounded-[18px] border px-4 text-sm font-semibold transition ${
                paymentType === "cash"
                  ? "border-[#2f788a] bg-[#2f788a] text-white shadow-[0_14px_28px_rgba(47,120,138,0.24)]"
                  : "border-[#dbe7ec] bg-white text-slate-700"
              }`}
            >
              {t("portalCommon.payment_methods.cash")}
            </button>
            <button
              type="button"
              disabled={!canEdit}
              onClick={() => onPaymentTypeChange("credit")}
              className={`min-h-[52px] rounded-[18px] border px-4 text-sm font-semibold transition ${
                paymentType === "credit"
                  ? "border-[#2f788a] bg-[#2f788a] text-white shadow-[0_14px_28px_rgba(47,120,138,0.24)]"
                  : "border-[#dbe7ec] bg-white text-slate-700"
              }`}
            >
              {t("portalCommon.payment_methods.credit")}
            </button>
          </div>
        </div>

        <ActionButton
          type="button"
          tone="ghost"
          className="w-full lg:w-auto"
          onClick={onOpenAdvancedData}
          disabled={!canEdit}
        >
          {t("portalCreateInvoice.header.advanced_data")}
        </ActionButton>
      </div>

      <div className="mt-4">
        <FieldLabel>
          <span>{t("portalCommon.fields.notes")}</span>
          <FieldTextarea
            rows={4}
            placeholder={t("portalCreateInvoice.header.notes_placeholder")}
            value={notes}
            onChange={(event) => onNotesChange(event.target.value)}
            disabled={!canEdit}
          />
        </FieldLabel>
      </div>
    </section>
  );
}
