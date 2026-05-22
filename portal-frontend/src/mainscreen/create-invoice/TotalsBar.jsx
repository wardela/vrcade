import { useTranslation } from "react-i18next";
import { ActionButton } from "./CreateInvoiceUi";
import { format3 } from "./invoiceMath";

export default function TotalsBar({
  totalBeforeTax,
  totalTax,
  grandTotal,
  onSave,
  onSaveAndShare,
  onSaveAndPrint,
  saving,
  canSave,
  canShare,
}) {
  const { t } = useTranslation();

  return (
    <section className="rounded-[28px] border border-[#dbe7ec] bg-white p-4 shadow-[0_18px_36px_rgba(39,89,104,0.08)] md:fixed md:inset-x-0 md:bottom-0 md:z-40 md:rounded-none md:border-x-0 md:border-b-0 md:bg-white/95 md:px-4 md:pb-[calc(env(safe-area-inset-bottom,0px)+16px)] md:pt-4 md:shadow-none md:backdrop-blur-md">
      <div className="mx-auto flex max-w-[1220px] flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-[20px] border border-[#dbe7ec] bg-[#fbfdfe] px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
              {t("portalCommon.totals.total_before_tax")}
            </p>
            <div className="mt-2 text-base font-semibold text-slate-800">
              {t("portalCommon.currency_code")} {format3(totalBeforeTax)}
            </div>
          </div>

          <div className="rounded-[20px] border border-[#dbe7ec] bg-[#fbfdfe] px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
              {t("portalCommon.totals.total_tax")}
            </p>
            <div className="mt-2 text-base font-semibold text-slate-800">
              {t("portalCommon.currency_code")} {format3(totalTax)}
            </div>
          </div>

          <div className="rounded-[20px] border border-[#d7ebe9] bg-gradient-to-br from-[#f2fbf7] to-white px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
              {t("portalCommon.totals.grand_total")}
            </p>
            <div className="mt-2 text-lg font-bold text-[#2f788a]">
              {t("portalCommon.currency_code")} {format3(grandTotal)}
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <ActionButton
            type="button"
            tone="success"
            disabled={!canSave || saving}
            onClick={onSave}
          >
            {saving ? t("portalCommon.states.saving") : t("portalCommon.actions.save")}
          </ActionButton>

          <ActionButton
            type="button"
            tone="primary"
            disabled={!canSave || !canShare || saving}
            onClick={onSaveAndShare}
          >
            {t("portalCommon.actions.save_and_share")}
          </ActionButton>

          <ActionButton
            type="button"
            tone="dark"
            disabled={!canSave || saving}
            onClick={onSaveAndPrint}
          >
            {t("portalCommon.actions.save_and_print")}
          </ActionButton>
        </div>
      </div>
    </section>
  );
}
