import { useEffect, useRef, useState } from "react";
import { useReactToPrint } from "@/utils/useAppReactToPrint";
import api from "../../utils/axiosInstance";
import SessionSummaryPrint from "./SessionSummaryPrint";
import { useTranslation } from "react-i18next";

const formatDateTime = (value) => {
  if (!value) return "—";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
};

const formatCurrency = (value) => `${Number(value || 0).toFixed(3)} JOD`;
const formatCount = (value) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: Number(value || 0) % 1 === 0 ? 0 : 3,
    maximumFractionDigits: 3,
  });
const pad = (value) => String(value).padStart(2, "0");
const toDateTimeLocalValue = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
const toSqlDateTimeValue = (value) => {
  if (!value) return "";
  return `${value.replace("T", " ")}:00.000`;
};
const getStartOfDay = (date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
const getEndOfDay = (date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
const addDays = (date, amount) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + amount);
  return nextDate;
};

const getApiMessage = (error, fallbackMessage) =>
  error?.response?.data?.message || fallbackMessage;

const readPermissions = () => {
  try {
    return JSON.parse(localStorage.getItem("permissions")) || {};
  } catch {
    return {};
  }
};

function NoAccess() {
  const { t } = useTranslation();

  return (
    <div className="flex h-full w-full items-center justify-center bg-base-200 p-6">
      <div className="rounded-2xl border border-base-300 bg-white px-8 py-10 text-center shadow-xl">
        <h2 className="text-xl font-bold text-gray-900">{t("POSMonitor.no_access.title")}</h2>
        <p className="mt-2 text-sm text-gray-600">
          {t("POSMonitor.no_access.message")}
        </p>
      </div>
    </div>
  );
}

function StatusBadge({ active, activeLabel, inactiveLabel }) {
  const { t } = useTranslation();

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
        active
          ? "bg-emerald-100 text-emerald-700"
          : "bg-slate-200 text-slate-600"
      }`}
    >
      {active
        ? activeLabel || t("POSMonitor.badges.active")
        : inactiveLabel || t("POSMonitor.badges.inactive")}
    </span>
  );
}

function POSPointModal({ open, onClose, onSubmit, submitting, initialData, canEdit }) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    setName(initialData?.name || "");
    setDescription(initialData?.description || "");
    setIsActive(initialData?.is_active ?? true);
    setError("");
  }, [initialData, open]);

  if (!open) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!name.trim()) {
      setError(t("POSMonitor.messages.pos_name_required"));
      return;
    }

    setError("");
    await onSubmit({
      name: name.trim(),
      description: description.trim(),
      is_active: isActive,
    });
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-lg rounded-3xl border border-base-300 bg-white shadow-2xl">
        <div className="border-b border-base-300 px-6 py-5">
          <h2 className="text-xl font-semibold text-gray-900">
            {initialData ? t("POSMonitor.actions.edit_pos") : t("POSMonitor.actions.create_pos")}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {t("POSMonitor.modal.subtitle")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700">{t("POSMonitor.fields.name")}</label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-[#2f788a] focus:outline-none focus:ring-2 focus:ring-[#2f788a]/20"
              placeholder={t("POSMonitor.placeholders.pos_name")}
              disabled={submitting || !canEdit}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              {t("POSMonitor.fields.description")}
            </label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-[#2f788a] focus:outline-none focus:ring-2 focus:ring-[#2f788a]/20"
              placeholder={t("POSMonitor.placeholders.description")}
              disabled={submitting || !canEdit}
            />
          </div>

          <label className="flex items-center justify-between rounded-2xl border border-base-300 bg-base-100 px-4 py-3">
            <div>
              <div className="text-sm font-medium text-gray-800">
                {t("POSMonitor.fields.station_status")}
              </div>
              <div className="text-xs text-gray-500">
                {t("POSMonitor.modal.station_status_hint")}
              </div>
            </div>

            <input
              type="checkbox"
              className="toggle toggle-info"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              disabled={submitting || !canEdit}
            />
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={submitting}
            >
              {t("POSMonitor.actions.cancel")}
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting || !canEdit}>
              {submitting
                ? t("POSMonitor.states.saving")
                : initialData
                  ? t("POSMonitor.actions.save_changes")
                  : t("POSMonitor.actions.create_pos")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SummaryTimeFrameModal({
  open,
  onClose,
  onSubmit,
  submitting,
  initialRange,
}) {
  const { t } = useTranslation();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    if (!open) return;

    setFrom(initialRange?.from || "");
    setTo(initialRange?.to || "");
  }, [initialRange, open]);

  if (!open) return null;

  const applyPreset = (preset) => {
    const now = new Date();

    if (preset === "today") {
      setFrom(toDateTimeLocalValue(getStartOfDay(now)));
      setTo(toDateTimeLocalValue(getEndOfDay(now)));
      return;
    }

    if (preset === "yesterday") {
      const yesterday = addDays(now, -1);
      setFrom(toDateTimeLocalValue(getStartOfDay(yesterday)));
      setTo(toDateTimeLocalValue(getEndOfDay(yesterday)));
      return;
    }

    if (preset === "last7") {
      setFrom(toDateTimeLocalValue(getStartOfDay(addDays(now, -6))));
      setTo(toDateTimeLocalValue(getEndOfDay(now)));
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      from,
      to,
    });
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-xl rounded-3xl border border-base-300 bg-white shadow-2xl">
        <div className="border-b border-base-300 px-6 py-5">
          <h2 className="text-xl font-semibold text-gray-900">
            {t("POSMonitor.actions.summary_by_time_frame")}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {t("POSMonitor.modal.summary_timeframe_hint")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => applyPreset("today")}
              disabled={submitting}
            >
              {t("POSMonitor.actions.today")}
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => applyPreset("yesterday")}
              disabled={submitting}
            >
              {t("POSMonitor.actions.yesterday")}
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => applyPreset("last7")}
              disabled={submitting}
            >
              {t("POSMonitor.actions.last_7_days")}
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700">
                {t("POSMonitor.labels.from")}
              </label>
              <input
                type="datetime-local"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-[#2f788a] focus:outline-none focus:ring-2 focus:ring-[#2f788a]/20"
                disabled={submitting}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                {t("POSMonitor.labels.to")}
              </label>
              <input
                type="datetime-local"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-[#2f788a] focus:outline-none focus:ring-2 focus:ring-[#2f788a]/20"
                disabled={submitting}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={submitting}
            >
              {t("POSMonitor.actions.cancel")}
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting
                ? t("POSMonitor.actions.preparing")
                : t("POSMonitor.actions.print_summary")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ForceCloseSessionModal({ open, session, loading, onCancel, onConfirm }) {
  const { t } = useTranslation();

  if (!open || !session) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="border-b px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">
            {t("POSMonitor.actions.force_close_session")}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {t("POSMonitor.messages.force_close_confirm", { id: session.id })}
          </p>
        </div>

        <div className="px-6 py-5 text-sm text-gray-700">
          <div className="rounded-xl border border-base-300 bg-base-100 px-4 py-4">
            <div>
              {t("POSMonitor.labels.opened_by")}:{" "}
              <span className="font-semibold text-gray-900">
                {session.full_name || session.username || "—"}
              </span>
            </div>
            <div className="mt-2">
              {t("POSMonitor.labels.started")}:{" "}
              <span className="font-semibold text-gray-900">
                {formatDateTime(session.started_at)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4">
          <button
            type="button"
            className="btn btn-outline"
            onClick={onCancel}
            disabled={loading}
          >
            {t("POSMonitor.actions.cancel")}
          </button>
          <button
            type="button"
            className="btn btn-error"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? t("POSMonitor.actions.preparing") : t("POSMonitor.actions.force_close")}
          </button>
        </div>
      </div>
    </div>
  );
}

function SessionDetailModal({ sessionId, onClose }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [session, setSession] = useState(null);
  const [showSoldItems, setShowSoldItems] = useState(false);

  useEffect(() => {
    if (!sessionId) return undefined;

    let cancelled = false;
    setShowSoldItems(false);

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await api.get(`/api/pos-sessions/${sessionId}/detail`);
        if (!cancelled) {
          setSession(res.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getApiMessage(err, t("POSMonitor.messages.load_session_details_failed")));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (!sessionId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl border border-base-300 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-base-300 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {t("POSMonitor.session.details_title")}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {t("POSMonitor.session.details_subtitle")}
            </p>
          </div>

          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            {t("POSMonitor.actions.close")}
          </button>
        </div>

        <div className="max-h-[calc(90vh-96px)] overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex items-center gap-3 rounded-2xl border border-base-300 bg-base-100 px-4 py-4 text-sm text-gray-600">
              <span className="loading loading-spinner loading-md text-[#2f788a]"></span>
              {t("POSMonitor.states.loading_session_details")}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : session ? (
            <div className="space-y-5">
              <div className="rounded-2xl border border-base-300 bg-base-100 px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-[11px] uppercase tracking-[0.16em] text-gray-500">
                      {t("POSMonitor.labels.pos_station")}
                    </div>
                    <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h3 className="text-2xl font-semibold tracking-tight text-gray-900">
                        {session.pos_point_name || session.pos || "—"}
                      </h3>
                      <span className="text-sm text-gray-500">
                        {t("POSMonitor.labels.session_number", { id: session.id })}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 pt-0.5">
                    <StatusBadge
                      active={session.status === "active" && !session.ended_at}
                      activeLabel={t("POSMonitor.badges.active_session")}
                      inactiveLabel={t("POSMonitor.badges.ended_session")}
                    />
                  </div>
                </div>

                <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                  <dl className="grid gap-x-5 gap-y-3 sm:grid-cols-2 xl:grid-cols-4">
                    <CompactMetaItem
                      label={t("POSMonitor.labels.opened_by")}
                      value={session.full_name || session.username || "—"}
                      hint={session.username || "—"}
                    />
                    <CompactMetaItem
                      label={t("POSMonitor.labels.started")}
                      value={formatDateTime(session.started_at)}
                    />
                    <CompactMetaItem
                      label={t("POSMonitor.labels.ended")}
                      value={formatDateTime(session.ended_at)}
                    />
                    <CompactMetaItem
                      label={t("POSMonitor.labels.duration")}
                      value={session.duration_label || "—"}
                    />
                  </dl>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <CompactKpiCard
                      label={t("POSMonitor.summary.invoices")}
                      value={session.invoice_count || 0}
                    />
                    <CompactKpiCard
                      label={t("POSMonitor.summary.total_sales")}
                      value={formatCurrency(session.total_sales_amount)}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                <SummaryGroup title={t("POSMonitor.summary.tokens_group")} className="bg-base-100">
                  <SummaryCard
                    label={t("POSMonitor.summary.sold_tokens")}
                    value={`${formatCount(session.total_tokens_sold)} ${t("POS.items.tokens")}`}
                  />
                  <SummaryCard
                    label={t("POSMonitor.summary.manual_charged_tokens")}
                    value={`${formatCount(session.manual_tokens_charged)} ${t("POS.items.tokens")}`}
                  />
                  <SummaryCard
                    label={t("POSMonitor.summary.total_tokens_charged")}
                    value={`${formatCount(session.total_tokens_charged)} ${t("POS.items.tokens")}`}
                  />
                </SummaryGroup>

                <SummaryGroup title={t("POSMonitor.summary.payments_group")} className="bg-base-100">
                  <SummaryCard label={t("POSMonitor.summary.cash")} value={formatCurrency(session.payment_totals?.cash)} />
                  <SummaryCard label={t("POSMonitor.summary.card")} value={formatCurrency(session.payment_totals?.card)} />
                  <SummaryCard
                    label={t("POSMonitor.summary.transfer")}
                    value={formatCurrency(session.payment_totals?.transfer)}
                  />
                  <SummaryCard
                    label={t("POSMonitor.summary.cash_received")}
                    value={formatCurrency(session.total_cash_received)}
                  />
                  <SummaryCard
                    label={t("POSMonitor.summary.change_given")}
                    value={formatCurrency(session.total_change_given)}
                  />
                </SummaryGroup>
              </div>

              <div className="overflow-hidden rounded-2xl border border-base-300">
                <button
                  type="button"
                  className="flex w-full items-center justify-between border-b border-base-300 bg-base-100 px-4 py-3 text-left"
                  onClick={() => setShowSoldItems((prev) => !prev)}
                >
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">
                      {t("POSMonitor.session.sold_items_breakdown")}
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">
                      {t("POSMonitor.session.sold_items_hint")}
                    </p>
                  </div>

                  <span className="text-sm font-medium text-[#2f788a]">
                    {showSoldItems ? t("POSMonitor.actions.hide") : t("POSMonitor.actions.show")}
                  </span>
                </button>

                {showSoldItems && (
                  (session.sold_items_breakdown || []).length === 0 ? (
                    <div className="px-4 py-6 text-sm text-gray-500">
                      {t("POSMonitor.states.no_sold_items")}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-left text-gray-500">
                          <tr>
                            <th className="px-4 py-3 font-medium">{t("POSMonitor.table.item")}</th>
                            <th className="px-4 py-3 text-right font-medium">{t("POSMonitor.table.qty_sold")}</th>
                            <th className="px-4 py-3 text-right font-medium">{t("POSMonitor.table.total_sales")}</th>
                            <th className="px-4 py-3 text-right font-medium">{t("POSMonitor.table.tokens_per_item")}</th>
                            <th className="px-4 py-3 text-right font-medium">{t("POSMonitor.table.total_tokens")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(session.sold_items_breakdown || []).map((item) => (
                            <tr
                              key={item.item_id}
                              className="border-t border-base-200"
                            >
                              <td className="px-4 py-3 font-medium text-gray-900">
                                {item.item_name || `Item #${item.item_id}`}
                              </td>
                              <td className="px-4 py-3 text-right text-gray-700">
                                {formatCount(item.quantity_sold)}
                              </td>
                              <td className="px-4 py-3 text-right font-semibold text-gray-900">
                                {formatCurrency(item.total_amount)}
                              </td>
                              <td className="px-4 py-3 text-right text-gray-700">
                                {formatCount(item.tokens_per_item)}
                              </td>
                              <td className="px-4 py-3 text-right font-semibold text-[#2f788a]">
                                {formatCount(item.total_tokens)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                )}
              </div>

              <div className="overflow-hidden rounded-2xl border border-base-300">
                <div className="border-b border-base-300 bg-base-100 px-4 py-3">
                  <h3 className="text-sm font-semibold text-gray-800">
                    {t("POSMonitor.session.invoices_in_session")}
                  </h3>
                </div>

                {(session.invoices || []).length === 0 ? (
                  <div className="px-4 py-6 text-sm text-gray-500">
                    {t("POSMonitor.states.no_invoices")}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-left text-gray-500">
                        <tr>
                          <th className="px-4 py-3 font-medium">{t("POSMonitor.table.invoice")}</th>
                          <th className="px-4 py-3 font-medium">{t("POSMonitor.table.client")}</th>
                          <th className="px-4 py-3 font-medium">{t("POSMonitor.table.date")}</th>
                          <th className="px-4 py-3 text-right font-medium">{t("POSMonitor.table.total")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {session.invoices.map((invoice) => (
                          <tr key={invoice.invoice_number} className="border-t border-base-200">
                            <td className="px-4 py-3 font-medium text-gray-900">
                              {invoice.invoice_number}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {invoice.client || t("POS.cart.walk_in")}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {formatDateTime(invoice.date)}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-gray-900">
                              {formatCurrency(invoice.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-base-300 bg-white px-4 py-4">
      <div className="text-[11px] uppercase tracking-[0.16em] text-gray-500">{label}</div>
      <div className="mt-3 text-xl font-semibold leading-snug text-gray-900">{value}</div>
    </div>
  );
}

function SummaryGroup({ title, children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-base-300 bg-white ${className}`}>
      <div className="border-b border-base-300 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      </div>
      <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3 content-start">{children}</div>
    </div>
  );
}

function CompactKpiCard({ label, value }) {
  return (
    <div className="rounded-xl border border-base-300 bg-white px-4 py-3">
      <div className="text-[11px] uppercase tracking-[0.14em] text-gray-500">{label}</div>
      <div className="mt-2 text-xl font-semibold leading-tight text-gray-900">{value}</div>
    </div>
  );
}

function CompactMetaItem({ label, value, hint = "" }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-[0.14em] text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm font-semibold leading-5 text-gray-900">{value}</dd>
      {hint ? <div className="mt-0.5 text-xs text-gray-500">{hint}</div> : null}
    </div>
  );
}

export default function POSManagementScreen() {
  const { t } = useTranslation();
  const permissions = readPermissions();
  const posPerm = permissions?.pos || {};
  const canView = posPerm.view === true;
  const canCreate = posPerm.add === true;
  const canEdit = posPerm.edit === true;

  const [posPoints, setPosPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPoint, setEditingPoint] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [expandedPosPointId, setExpandedPosPointId] = useState(null);
  const [sessionsByPosPointId, setSessionsByPosPointId] = useState({});
  const [historyLoadingFor, setHistoryLoadingFor] = useState(null);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [sessionPrintData, setSessionPrintData] = useState(null);
  const [company, setCompany] = useState(null);
  const [pendingPrint, setPendingPrint] = useState(false);
  const [printingSessionId, setPrintingSessionId] = useState(null);
  const [forceCloseTarget, setForceCloseTarget] = useState(null);
  const [forceClosing, setForceClosing] = useState(false);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [printingAggregate, setPrintingAggregate] = useState(false);
  const [summaryRange, setSummaryRange] = useState(() => {
    const now = new Date();
    return {
      from: toDateTimeLocalValue(getStartOfDay(now)),
      to: toDateTimeLocalValue(getEndOfDay(now)),
    };
  });
  const printRef = useRef(null);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    pageStyle: `
      @page { size: A4; margin: 6mm; }
      body { -webkit-print-color-adjust: exact; }
    `,
  });

  const loadMonitoring = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await api.get("/api/pos-points/monitoring");
      setPosPoints(res.data?.pos_points || []);
    } catch (err) {
      setError(getApiMessage(err, t("POSMonitor.messages.load_monitoring_failed")));
    } finally {
      setLoading(false);
    }
  };

  const loadSessionsForPosPoint = async (posPointId) => {
    const res = await api.get(`/api/pos-points/${posPointId}/sessions`);
    setSessionsByPosPointId((prev) => ({
      ...prev,
      [posPointId]: res.data?.sessions || [],
    }));
  };

  useEffect(() => {
    loadMonitoring();
    api.get("/api/invoices/company").then((res) => {
      setCompany(res.data || null);
    }).catch(() => {
      setCompany(null);
    });
  }, []);

  useEffect(() => {
    if (!pendingPrint || !sessionPrintData || !company) return;

    handlePrint();
    setPendingPrint(false);
    setPrintingSessionId(null);
  }, [pendingPrint, sessionPrintData, company, handlePrint]);

  const handleOpenCreate = () => {
    setEditingPoint(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (posPoint) => {
    setEditingPoint(posPoint);
    setModalOpen(true);
  };

  const handleSubmitPosPoint = async (payload) => {
    setSubmitting(true);

    try {
      if (editingPoint) {
        await api.put(`/api/pos-points/${editingPoint.id}`, payload);
      } else {
        await api.post("/api/pos-points", payload);
      }

      setModalOpen(false);
      setEditingPoint(null);
      await loadMonitoring();
    } catch (err) {
      alert(getApiMessage(err, t("POSMonitor.messages.save_failed")));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleHistory = async (posPointId) => {
    const nextExpanded = expandedPosPointId === posPointId ? null : posPointId;
    setExpandedPosPointId(nextExpanded);

    if (nextExpanded == null || sessionsByPosPointId[posPointId]) {
      return;
    }

    setHistoryLoadingFor(posPointId);

    try {
      await loadSessionsForPosPoint(posPointId);
    } catch (err) {
      alert(getApiMessage(err, t("POSMonitor.messages.load_history_failed")));
    } finally {
      setHistoryLoadingFor(null);
    }
  };

  const handlePrintSessionSummary = async (sessionId) => {
    try {
      setPrintingSessionId(sessionId);
      const [sessionRes, companyRes] = await Promise.all([
        api.get(`/api/pos-sessions/${sessionId}/detail`),
        company ? Promise.resolve({ data: company }) : api.get("/api/invoices/company"),
      ]);

      setSessionPrintData(sessionRes.data);
      setCompany(companyRes.data || null);
      setPendingPrint(true);
    } catch (err) {
      alert(getApiMessage(err, t("POSMonitor.messages.load_print_summary_failed")));
      setPrintingSessionId(null);
    }
  };

  const handleForceClose = async () => {
    if (!forceCloseTarget) return;

    setForceClosing(true);

    try {
      await api.post(`/api/pos-sessions/${forceCloseTarget.id}/force-close`, {});
      setForceCloseTarget(null);
      await loadMonitoring();

      if (sessionsByPosPointId[forceCloseTarget.posPointId]) {
        await loadSessionsForPosPoint(forceCloseTarget.posPointId);
      }
    } catch (err) {
      alert(getApiMessage(err, t("POSMonitor.messages.force_close_failed")));
    } finally {
      setForceClosing(false);
    }
  };

  const handlePrintAggregateSummary = async ({ from, to }) => {
    setPrintingAggregate(true);

    try {
      const normalizedRange = { from, to };
      const [summaryRes, companyRes] = await Promise.all([
        api.get("/api/pos-sessions/aggregate-summary", {
          params: {
            from: toSqlDateTimeValue(from),
            to: toSqlDateTimeValue(to),
          },
        }),
        company ? Promise.resolve({ data: company }) : api.get("/api/invoices/company"),
      ]);

      setSummaryRange(normalizedRange);
      setSummaryModalOpen(false);
      setSessionPrintData(summaryRes.data);
      setCompany(companyRes.data || null);
      setPendingPrint(true);
    } catch (err) {
      alert(getApiMessage(err, t("POSMonitor.messages.load_aggregate_summary_failed")));
    } finally {
      setPrintingAggregate(false);
    }
  };

  if (!canView) {
    return <NoAccess />;
  }

  return (
    <div className="flex h-full w-full flex-col bg-base-200">
      <div className="sticky top-0 z-10 border-b bg-white">
        <div className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">{t("POSMonitor.title")}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {t("POSMonitor.subtitle")}
            </p>
          </div>

          <div className="flex gap-3">
            <button type="button" className="btn btn-outline" onClick={loadMonitoring}>
              {t("POSMonitor.actions.refresh")}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setSummaryModalOpen(true)}
            >
              {t("POSMonitor.actions.summary_by_time_frame")}
            </button>
            {canCreate && (
              <button type="button" className="btn btn-primary" onClick={handleOpenCreate}>
                {t("POSMonitor.actions.create_pos")}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : loading ? (
          <div className="flex items-center gap-3 rounded-2xl border border-base-300 bg-white px-5 py-4 text-sm text-gray-600 shadow-sm">
            <span className="loading loading-spinner loading-md text-[#2f788a]"></span>
            {t("POSMonitor.states.loading_pos_stations")}
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {posPoints.map((posPoint) => {
              const sessions = sessionsByPosPointId[posPoint.id] || [];
              const isExpanded = expandedPosPointId === posPoint.id;
              const activeSession = posPoint.active_session;

              return (
                <div
                  key={posPoint.id}
                  className="overflow-hidden rounded-3xl border border-base-300 bg-white shadow-sm transition-shadow hover:shadow-lg"
                >
                  <div className="space-y-4 px-5 py-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xs uppercase tracking-[0.2em] text-[#2f788a]">
                          {t("POSMonitor.labels.pos_station")}
                        </div>
                        <h2 className="mt-2 text-2xl font-semibold text-gray-900">
                          {posPoint.name}
                        </h2>
                      </div>

                      <StatusBadge active={posPoint.is_active} />
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl bg-base-100 px-4 py-3">
                        <div className="text-xs uppercase tracking-wide text-gray-500">
                          {t("POSMonitor.labels.current_occupancy")}
                        </div>
                        {activeSession ? (
                          <>
                            <div className="mt-2 font-semibold text-gray-900">
                              {activeSession.full_name || activeSession.username || t("POSMonitor.states.active_user")}
                            </div>
                            <div className="mt-1 text-sm text-gray-500">
                              {t("POSMonitor.labels.started")} {formatDateTime(activeSession.started_at)}
                            </div>
                            {canEdit && (
                              <button
                                type="button"
                                className="btn btn-error btn-xs mt-3"
                                onClick={() =>
                                  setForceCloseTarget({
                                    ...activeSession,
                                    posPointId: posPoint.id,
                                  })
                                }
                              >
                                {t("POSMonitor.actions.force_close")}
                              </button>
                            )}
                          </>
                        ) : (
                          <div className="mt-2 text-sm text-gray-500">
                            {t("POSMonitor.states.no_active_session")}
                          </div>
                        )}
                      </div>

                      <div className="rounded-2xl bg-base-100 px-4 py-3">
                        <div className="text-xs uppercase tracking-wide text-gray-500">
                          {t("POSMonitor.labels.session_history")}
                        </div>
                        <div className="mt-2 text-2xl font-semibold text-gray-900">
                          {posPoint.session_count || 0}
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          {t("POSMonitor.states.total_sessions_recorded")}
                        </div>
                      </div>
                    </div>

                    {posPoint.description && (
                      <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-gray-600">
                        {posPoint.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => toggleHistory(posPoint.id)}
                      >
                        {isExpanded ? t("POSMonitor.actions.hide_sessions") : t("POSMonitor.actions.view_sessions")}
                      </button>

                      {canEdit && (
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => handleOpenEdit(posPoint)}
                        >
                          {t("POSMonitor.actions.edit")}
                        </button>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-base-300 bg-base-100 px-5 py-4">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-800">
                          {t("POSMonitor.labels.session_history")}
                        </h3>
                        {historyLoadingFor === posPoint.id && (
                          <span className="text-xs text-gray-500">{t("POSMonitor.states.loading")}</span>
                        )}
                      </div>

                      {historyLoadingFor === posPoint.id ? (
                        <div className="text-sm text-gray-500">{t("POSMonitor.states.loading_sessions")}</div>
                      ) : sessions.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-base-300 px-4 py-4 text-sm text-gray-500">
                          {t("POSMonitor.states.no_sessions")}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {sessions.map((session) => (
                            <div
                              key={session.id}
                              className="flex items-center justify-between gap-4 rounded-2xl border border-base-300 bg-white px-4 py-4 text-left transition hover:border-[#2f788a]/40 hover:shadow-sm"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-semibold text-gray-900">
                                    {t("POSMonitor.labels.session_number", { id: session.id })}
                                  </span>
                                  <StatusBadge
                                    active={session.status === "active" && !session.ended_at}
                                    activeLabel={t("POSMonitor.badges.active")}
                                    inactiveLabel={t("POSMonitor.badges.ended")}
                                  />
                                </div>
                                <div className="mt-2 text-sm text-gray-600">
                                  {session.full_name || session.username || t("POSMonitor.states.unknown_user")}
                                </div>
                                <div className="mt-1 text-xs text-gray-500">
                                  {t("POSMonitor.labels.session_period", {
                                    start: formatDateTime(session.started_at),
                                    end: formatDateTime(session.ended_at),
                                  })}
                                </div>
                              </div>

                              <div className="flex flex-col items-end gap-3">
                                <div className="text-right">
                                  <div className="text-sm font-semibold text-gray-900">
                                    {formatCurrency(session.total_sales_amount)}
                                  </div>
                                  <div className="mt-1 text-xs text-gray-500">
                                    {t("POSMonitor.labels.invoice_count", {
                                      count: session.invoice_count || 0,
                                    })}
                                  </div>
                                </div>

                                <div className="flex flex-wrap justify-end gap-2">
                                  <button
                                    type="button"
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => setSelectedSessionId(session.id)}
                                  >
                                    {t("POSMonitor.actions.view_details")}
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-outline btn-sm"
                                    onClick={() => handlePrintSessionSummary(session.id)}
                                    disabled={printingSessionId === session.id}
                                  >
                                    {printingSessionId === session.id
                                      ? t("POSMonitor.actions.preparing")
                                      : t("POSMonitor.actions.print_session_summary")}
                                  </button>
                                  {canEdit && session.status === "active" && !session.ended_at && (
                                    <button
                                      type="button"
                                      className="btn btn-error btn-sm"
                                      onClick={() =>
                                        setForceCloseTarget({
                                          ...session,
                                          posPointId: posPoint.id,
                                        })
                                      }
                                    >
                                      {t("POSMonitor.actions.force_close")}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <POSPointModal
        open={modalOpen}
        onClose={() => {
          if (submitting) return;
          setModalOpen(false);
          setEditingPoint(null);
        }}
        onSubmit={handleSubmitPosPoint}
        submitting={submitting}
        initialData={editingPoint}
        canEdit={editingPoint ? canEdit : canCreate}
      />

      <SummaryTimeFrameModal
        open={summaryModalOpen}
        onClose={() => {
          if (printingAggregate) return;
          setSummaryModalOpen(false);
        }}
        onSubmit={handlePrintAggregateSummary}
        submitting={printingAggregate}
        initialRange={summaryRange}
      />

      <ForceCloseSessionModal
        open={Boolean(forceCloseTarget)}
        session={forceCloseTarget}
        loading={forceClosing}
        onCancel={() => {
          if (forceClosing) return;
          setForceCloseTarget(null);
        }}
        onConfirm={handleForceClose}
      />

      <SessionDetailModal
        sessionId={selectedSessionId}
        onClose={() => setSelectedSessionId(null)}
      />

      <div className="hidden">
        <SessionSummaryPrint ref={printRef} session={sessionPrintData} company={company} />
      </div>
    </div>
  );
}
