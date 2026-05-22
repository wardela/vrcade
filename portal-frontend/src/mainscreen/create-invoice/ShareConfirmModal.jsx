import { useTranslation } from "react-i18next";
import { ActionButton, ModalHeader, ModalShell } from "./CreateInvoiceUi";

export default function ShareConfirmModal({ open, onClose, onConfirm }) {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <ModalShell onClose={onClose}>
      <ModalHeader
        title={t("portalCreateInvoice.share.title")}
        subtitle={t("portalCreateInvoice.share.subtitle")}
        onClose={onClose}
      />

      <div className="px-5 py-5 sm:px-6">
        <div className="rounded-[22px] border border-[#dbe7ec] bg-[#fbfdfe] px-4 py-4 text-sm leading-6 text-slate-600">
          {t("portalCreateInvoice.share.message")}
        </div>
      </div>

      <div className="border-t border-[#e2ecef] px-5 py-4 sm:px-6">
        <div className="flex justify-end gap-3">
          <ActionButton type="button" tone="ghost" onClick={onClose}>
            {t("portalCommon.actions.no")}
          </ActionButton>
          <ActionButton type="button" tone="primary" onClick={onConfirm}>
            {t("portalCreateInvoice.share.confirm")}
          </ActionButton>
        </div>
      </div>
    </ModalShell>
  );
}
