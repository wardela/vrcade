import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchPortalInvoiceClients } from "../../api/portalApi";
import {
  ActionButton,
  EmptyState,
  FieldInput,
  ModalHeader,
  ModalShell,
} from "./CreateInvoiceUi";

export default function ClientPickerModal({ open, onClose, onSelect }) {
  const { t } = useTranslation();
  const [clients, setClients] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return undefined;

    let disposed = false;
    const timeoutId = window.setTimeout(async () => {
      try {
        setLoading(true);
        setError("");
        const payload = await fetchPortalInvoiceClients({
          q: query,
          limit: 100,
        });

        if (!disposed) {
          setClients(payload || []);
        }
      } catch (requestError) {
        if (!disposed) {
          setError(requestError.message || t("portalCreateInvoice.client_picker.errors.load_failed"));
          setClients([]);
        }
      } finally {
        if (!disposed) {
          setLoading(false);
        }
      }
    }, 180);

    return () => {
      disposed = true;
      window.clearTimeout(timeoutId);
    };
  }, [open, query, t]);

  if (!open) return null;

  return (
    <ModalShell onClose={onClose} wide>
      <ModalHeader
        title={t("portalCreateInvoice.client_picker.title")}
        subtitle={t("portalCreateInvoice.client_picker.subtitle")}
        onClose={onClose}
      />

      <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
        <FieldInput
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("portalCreateInvoice.client_picker.search_placeholder")}
        />

        <div className="mt-4 grid gap-3">
          {loading ? (
            <EmptyState
              title={t("portalCreateInvoice.client_picker.loading_title")}
              copy={t("portalCreateInvoice.client_picker.loading_copy")}
            />
          ) : error ? (
            <div className="rounded-[22px] border border-[#f1d4d4] bg-[#fff7f7] px-4 py-4 text-sm text-[#8e3d3d]">
              {error}
            </div>
          ) : clients.length === 0 ? (
            <EmptyState
              title={t("portalCreateInvoice.client_picker.empty_title")}
              copy={t("portalCreateInvoice.client_picker.empty_copy")}
            />
          ) : (
            clients.map((client) => (
              <article
                key={client.id}
                className="rounded-[24px] border border-[#dbe7ec] bg-[#fbfdfe] p-4 shadow-[0_12px_24px_rgba(39,89,104,0.06)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#2f788a]">
                      {t("portalCreateInvoice.client_picker.client_label", { id: client.id })}
                    </p>
                    <h4 className="mt-2 truncate text-lg font-semibold text-slate-800">
                      {client.name}
                    </h4>
                    <div className="mt-2 grid gap-1 text-sm text-slate-500">
                      <p>{client.phone || t("portalCreateInvoice.client_picker.no_phone")}</p>
                      <p>
                        {client.detail_type || t("portalCreateInvoice.client_picker.detail_label")}:{" "}
                        {client.detail_value || t("portalCommon.empty.value")}
                      </p>
                    </div>
                  </div>

                  <ActionButton
                    type="button"
                    tone="secondary"
                    onClick={() => onSelect(client)}
                    className="shrink-0"
                  >
                    {t("portalCommon.actions.select")}
                  </ActionButton>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </ModalShell>
  );
}
