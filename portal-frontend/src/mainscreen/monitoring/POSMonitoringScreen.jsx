import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import {
  fetchPortalCompany,
  fetchPortalPosAggregateSummary,
  fetchPortalPosMonitoringOverview,
  fetchPortalPosPointSessions,
  fetchPortalPosSessionDetail,
  fetchPortalPosSessionSummary,
  forceClosePortalPosSession,
} from "../../api/portalApi";
import { formatPortalDate, formatPortalNumber } from "../../utils/portalFormatting";
import SessionSummaryPrint from "./SessionSummaryPrint";
import { useReactToPrint } from "../reports/usePortalReactToPrint";
import { prepareCompanyWithLogo } from "../../utils/companyLogo";

const formatDateTime = (value) => {
  if (!value) return "—";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";

  return formatPortalDate(parsed, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCurrency = (value) => `${Number(value || 0).toFixed(3)} JOD`;
const formatCount = (value) =>
  formatPortalNumber(value, {
    minimumFractionDigits: Number(value || 0) % 1 === 0 ? 0 : 3,
    maximumFractionDigits: 3,
  });
const pad = (value) => String(value).padStart(2, "0");
const toDateTimeLocalValue = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
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

function NoAccess() {
  const { t } = useTranslation();

  return (
    <div className="rounded-[28px] border border-[#f1d4d4] bg-[#fff7f7] px-5 py-6 text-center shadow-[0_18px_36px_rgba(166,74,74,0.08)]">
      <p className="portal-eyebrow">{t("POSMonitor.no_access.title")}</p>
      <h3 className="text-lg font-semibold text-[#8e3d3d]">
        {t("POSMonitor.no_access.message")}
      </h3>
    </div>
  );
}

function StatusBadge({ active, activeLabel, inactiveLabel }) {
  const { t } = useTranslation();

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
        active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
      }`}
    >
      {active
        ? activeLabel || t("POSMonitor.badges.active")
        : inactiveLabel || t("POSMonitor.badges.inactive")}
    </span>
  );
}

function ModalShell({ children, onClose, wide = false }) {
  useEffect(() => {
    const { body } = document;
    const previousOverflow = body.style.overflow;

    body.style.overflow = "hidden";

    return () => {
      body.style.overflow = previousOverflow;
    };
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-[120] grid place-items-end bg-[rgba(24,48,58,0.42)] p-0 md:place-items-center md:p-5"
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className={`w-full max-h-[92dvh] overflow-hidden rounded-t-[28px] bg-white shadow-[0_-10px_40px_rgba(24,48,58,0.18)] md:rounded-[28px] ${
          wide ? "md:max-w-5xl" : "md:max-w-xl"
        }`}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

function FieldLabel({ children }) {
  return (
    <label className="grid min-w-0 gap-2 text-sm font-semibold text-slate-600">
      <span>{children}</span>
    </label>
  );
}

function FieldInput(props) {
  return (
    <input
      {...props}
      className={`block min-h-[52px] min-w-0 w-full max-w-full rounded-[18px] border border-[#d8e6eb] bg-white px-4 py-3 text-sm text-slate-700 shadow-[0_12px_24px_rgba(39,89,104,0.07)] transition focus:border-[#2f788a] focus:outline-none focus:ring-4 focus:ring-[#2f788a]/10 ${
        props.className || ""
      }`}
    />
  );
}

function FieldTextarea(props) {
  return (
    <textarea
      {...props}
      className={`block min-w-0 w-full max-w-full rounded-[18px] border border-[#d8e6eb] bg-white px-4 py-3 text-sm text-slate-700 shadow-[0_12px_24px_rgba(39,89,104,0.07)] transition focus:border-[#2f788a] focus:outline-none focus:ring-4 focus:ring-[#2f788a]/10 ${
        props.className || ""
      }`}
    />
  );
}

function FieldSelect(props) {
  return (
    <select
      {...props}
      className={`block min-h-[52px] min-w-0 w-full max-w-full rounded-[18px] border border-[#d8e6eb] bg-white px-4 py-3 text-sm text-slate-700 shadow-[0_12px_24px_rgba(39,89,104,0.07)] transition focus:border-[#2f788a] focus:outline-none focus:ring-4 focus:ring-[#2f788a]/10 ${
        props.className || ""
      }`}
    />
  );
}

function ActionButton({ children, tone = "ghost", ...props }) {
  const tones = {
    primary: "bg-[#2f788a] text-white shadow-[0_14px_28px_rgba(47,120,138,0.24)]",
    secondary: "bg-[#eef6f9] text-[#2f788a]",
    ghost: "bg-white text-slate-600 border border-[#d9e8ec]",
    danger: "bg-[#fff1f1] text-[#c04848] border border-[#f0d0d0]",
  };

  return (
    <button
      {...props}
      className={`min-h-[46px] rounded-[16px] px-4 text-sm font-semibold transition hover:-translate-y-[1px] disabled:cursor-wait disabled:opacity-70 ${tones[tone]} ${
        props.className || ""
      }`}
    >
      {children}
    </button>
  );
}

function MetricTile({ label, value, hint, accent = "slate" }) {
  const accentMap = {
    slate: "from-slate-50 to-white text-slate-700",
    teal: "from-[#eef8fb] to-white text-[#2f788a]",
    navy: "from-[#edf2f8] to-white text-[#244b5a]",
    mint: "from-[#f1fbf6] to-white text-[#2d7c58]",
  };

  return (
    <article
      className={`rounded-[24px] border border-[#dbe7ec] bg-gradient-to-br px-4 py-4 shadow-[0_14px_30px_rgba(39,89,104,0.08)] ${accentMap[accent]}`}
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-current/70">{label}</p>
      <div className="mt-3 text-2xl font-semibold text-slate-800">{value}</div>
      {hint ? <p className="mt-1 text-sm text-slate-500">{hint}</p> : null}
    </article>
  );
}

function POSPointModal({ open, onClose, onSubmit, submitting, initialData, canEdit }) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [hasEcr, setHasEcr] = useState(false);
  const [ecrMid, setEcrMid] = useState("");
  const [ecrTid, setEcrTid] = useState("");
  const [ecrSecureKey, setEcrSecureKey] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    setName(initialData?.name || "");
    setDescription(initialData?.description || "");
    setIsActive(initialData?.is_active ?? true);
    setHasEcr(initialData?.has_ecr === true);
    setEcrMid(initialData?.ecr_mid || "");
    setEcrTid(initialData?.ecr_tid || "");
    setEcrSecureKey(initialData?.ecr_secure_key || "");
    setError("");
  }, [initialData, open]);

  if (!open) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!name.trim()) {
      setError(t("POSMonitor.messages.pos_name_required"));
      return;
    }

    if (hasEcr && (!ecrMid.trim() || !ecrTid.trim() || !ecrSecureKey.trim())) {
      setError(t("POSMonitor.messages.ecr_config_required"));
      return;
    }

    setError("");

    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        is_active: isActive,
        has_ecr: hasEcr,
        ecr_mid: hasEcr ? ecrMid.trim() : "",
        ecr_tid: hasEcr ? ecrTid.trim() : "",
        ecr_secure_key: hasEcr ? ecrSecureKey.trim() : "",
      });
    } catch (requestError) {
      setError(requestError.message || t("POSMonitor.messages.save_failed"));
    }
  };

  return (
    <ModalShell onClose={onClose}>
      <div className="border-b border-[#e2ecef] px-5 py-5 sm:px-6">
        <p className="portal-eyebrow">{t("POSMonitor.title")}</p>
        <h3 className="text-xl font-semibold text-slate-800">
          {initialData ? t("POSMonitor.actions.edit_pos") : t("POSMonitor.actions.create_pos")}
        </h3>
        <p className="mt-1 text-sm text-slate-500">{t("POSMonitor.modal.subtitle")}</p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 px-5 py-5 sm:px-6">
        {error ? (
          <div className="rounded-[18px] border border-[#f6d1d1] bg-[#fff4f4] px-4 py-3 text-sm text-[#c04848]">
            {error}
          </div>
        ) : null}

        <FieldLabel>
          {t("POSMonitor.fields.name")}
          <FieldInput
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t("POSMonitor.placeholders.pos_name")}
            disabled={submitting || !canEdit}
          />
        </FieldLabel>

        <FieldLabel>
          {t("POSMonitor.fields.description")}
          <FieldTextarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            placeholder={t("POSMonitor.placeholders.description")}
            disabled={submitting || !canEdit}
          />
        </FieldLabel>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center justify-between rounded-[22px] border border-[#dbe7ec] bg-[#f7fbfc] px-4 py-4">
            <div>
              <div className="text-sm font-semibold text-slate-700">
                {t("POSMonitor.fields.station_status")}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {t("POSMonitor.modal.station_status_hint")}
              </div>
            </div>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              disabled={submitting || !canEdit}
              className="h-5 w-5 accent-[#2f788a]"
            />
          </label>

          <label className="flex items-center justify-between rounded-[22px] border border-[#dbe7ec] bg-[#f7fbfc] px-4 py-4">
            <div>
              <div className="text-sm font-semibold text-slate-700">
                {t("POSMonitor.fields.has_ecr")}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {t("POSMonitor.modal.ecr_status_hint")}
              </div>
            </div>
            <input
              type="checkbox"
              checked={hasEcr}
              onChange={(event) => setHasEcr(event.target.checked)}
              disabled={submitting || !canEdit}
              className="h-5 w-5 accent-[#2f788a]"
            />
          </label>
        </div>

        {hasEcr ? (
          <div className="grid gap-4 rounded-[24px] border border-[#dbe7ec] bg-[#f7fbfc] p-4">
            <FieldLabel>
              {t("POSMonitor.fields.ecr_mid")}
              <FieldInput
                value={ecrMid}
                onChange={(event) => setEcrMid(event.target.value)}
                placeholder={t("POSMonitor.placeholders.ecr_mid")}
                disabled={submitting || !canEdit}
              />
            </FieldLabel>

            <FieldLabel>
              {t("POSMonitor.fields.ecr_tid")}
              <FieldInput
                value={ecrTid}
                onChange={(event) => setEcrTid(event.target.value)}
                placeholder={t("POSMonitor.placeholders.ecr_tid")}
                disabled={submitting || !canEdit}
              />
            </FieldLabel>

            <FieldLabel>
              {t("POSMonitor.fields.ecr_secure_key")}
              <FieldInput
                type="password"
                value={ecrSecureKey}
                onChange={(event) => setEcrSecureKey(event.target.value)}
                placeholder={t("POSMonitor.placeholders.ecr_secure_key")}
                disabled={submitting || !canEdit}
              />
            </FieldLabel>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3 pt-1">
          <ActionButton type="button" onClick={onClose} disabled={submitting}>
            {t("POSMonitor.actions.cancel")}
          </ActionButton>
          <ActionButton type="submit" tone="primary" disabled={submitting || !canEdit}>
            {submitting
              ? t("POSMonitor.states.saving")
              : initialData
                ? t("POSMonitor.actions.save_changes")
                : t("POSMonitor.actions.create_pos")}
          </ActionButton>
        </div>
      </form>
    </ModalShell>
  );
}

function SummaryTimeFrameModal({
  open,
  onClose,
  onSubmit,
  submitting,
  initialRange,
  posPoints,
}) {
  const { t } = useTranslation();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [posPointId, setPosPointId] = useState("");

  useEffect(() => {
    if (!open) return;

    setFrom(initialRange?.from || "");
    setTo(initialRange?.to || "");
    setPosPointId(initialRange?.posPointId || "");
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

    setFrom(toDateTimeLocalValue(getStartOfDay(addDays(now, -6))));
    setTo(toDateTimeLocalValue(getEndOfDay(now)));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({ from, to, posPointId });
  };

  return (
    <ModalShell onClose={onClose}>
      <div className="border-b border-[#e2ecef] px-5 py-5 sm:px-6">
        <p className="portal-eyebrow">{t("POSMonitor.title")}</p>
        <h3 className="text-xl font-semibold text-slate-800">
          {t("POSMonitor.actions.summary_by_time_frame")}
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          {t("POSMonitor.modal.summary_timeframe_hint")}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 px-5 py-5 sm:px-6">
        <div className="hide-scrollbar flex gap-2 overflow-x-auto">
          <ActionButton type="button" onClick={() => applyPreset("today")} disabled={submitting}>
            {t("POSMonitor.actions.today")}
          </ActionButton>
          <ActionButton type="button" onClick={() => applyPreset("yesterday")} disabled={submitting}>
            {t("POSMonitor.actions.yesterday")}
          </ActionButton>
          <ActionButton type="button" onClick={() => applyPreset("last7")} disabled={submitting}>
            {t("POSMonitor.actions.last_7_days")}
          </ActionButton>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FieldLabel>
            {t("POSMonitor.labels.from")}
            <FieldInput
              type="datetime-local"
              lang="en"
              dir="ltr"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              className="text-[15px] sm:text-sm"
              disabled={submitting}
              required
            />
          </FieldLabel>

          <FieldLabel>
            {t("POSMonitor.labels.to")}
            <FieldInput
              type="datetime-local"
              lang="en"
              dir="ltr"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              className="text-[15px] sm:text-sm"
              disabled={submitting}
              required
            />
          </FieldLabel>
        </div>

        <FieldLabel>
          {t("POSMonitor.labels.pos_station")}
          <FieldSelect
            value={posPointId}
            onChange={(event) => setPosPointId(event.target.value)}
            disabled={submitting}
          >
            <option value="">{t("POSMonitor.labels.all_pos_stations")}</option>
            {posPoints.map((posPoint) => (
              <option key={posPoint.id} value={String(posPoint.id)}>
                {posPoint.name}
              </option>
            ))}
          </FieldSelect>
        </FieldLabel>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <ActionButton type="button" onClick={onClose} disabled={submitting}>
            {t("POSMonitor.actions.cancel")}
          </ActionButton>
          <ActionButton type="submit" tone="primary" disabled={submitting}>
            {submitting
              ? t("POSMonitor.actions.preparing")
              : t("POSMonitor.actions.print_summary")}
          </ActionButton>
        </div>
      </form>
    </ModalShell>
  );
}

function ForceCloseSessionModal({ open, session, loading, onCancel, onConfirm }) {
  const { t } = useTranslation();

  if (!open || !session) return null;

  return (
    <ModalShell onClose={onCancel}>
      <div className="border-b border-[#f0d0d0] px-5 py-5 sm:px-6">
        <p className="portal-eyebrow !text-[#c04848]">{t("POSMonitor.actions.force_close_session")}</p>
        <h3 className="text-xl font-semibold text-slate-800">
          {t("POSMonitor.messages.force_close_confirm", { id: session.id })}
        </h3>
      </div>

      <div className="px-5 py-5 sm:px-6">
        <div className="rounded-[22px] border border-[#dbe7ec] bg-[#f7fbfc] px-4 py-4 text-sm text-slate-600">
          <div>
            {t("POSMonitor.labels.opened_by")}:{" "}
            <span className="font-semibold text-slate-800">
              {session.full_name || session.username || "—"}
            </span>
          </div>
          <div className="mt-2">
            {t("POSMonitor.labels.started")}:{" "}
            <span className="font-semibold text-slate-800">
              {formatDateTime(session.started_at)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-5">
          <ActionButton type="button" onClick={onCancel} disabled={loading}>
            {t("POSMonitor.actions.cancel")}
          </ActionButton>
          <ActionButton type="button" tone="danger" onClick={onConfirm} disabled={loading}>
            {loading ? t("POSMonitor.actions.preparing") : t("POSMonitor.actions.force_close")}
          </ActionButton>
        </div>
      </div>
    </ModalShell>
  );
}

function DetailBlock({ label, value, hint }) {
  return (
    <div className="rounded-[20px] border border-[#dbe7ec] bg-white px-4 py-4 shadow-[0_12px_26px_rgba(39,89,104,0.06)]">
      <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className="mt-2 text-base font-semibold text-slate-800">{value}</div>
      {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
    </div>
  );
}

function SessionDetailModal({ sessionId, onClose }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [session, setSession] = useState(null);

  useEffect(() => {
    if (!sessionId) return undefined;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const payload = await fetchPortalPosSessionDetail(sessionId);
        if (!cancelled) {
          setSession(payload);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.message || t("POSMonitor.messages.load_session_details_failed"));
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
  }, [sessionId, t]);

  if (!sessionId) return null;

  return (
    <ModalShell onClose={onClose} wide>
      <div className="flex items-start justify-between gap-3 border-b border-[#e2ecef] px-5 py-5 sm:px-6">
        <div>
          <p className="portal-eyebrow">{t("POSMonitor.title")}</p>
          <h3 className="text-xl font-semibold text-slate-800">
            {t("POSMonitor.session.details_title")}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {t("POSMonitor.session.details_subtitle")}
          </p>
        </div>
        <ActionButton type="button" onClick={onClose}>
          {t("POSMonitor.actions.close")}
        </ActionButton>
      </div>

      <div className="max-h-[80vh] overflow-y-auto px-5 py-5 sm:px-6">
        {loading ? (
          <div className="rounded-[22px] border border-[#dbe7ec] bg-[#f7fbfc] px-4 py-6 text-sm text-slate-600">
            {t("POSMonitor.states.loading_session_details")}
          </div>
        ) : error ? (
          <div className="rounded-[22px] border border-[#f6d1d1] bg-[#fff4f4] px-4 py-4 text-sm text-[#c04848]">
            {error}
          </div>
        ) : session ? (
          <div className="grid gap-4">
            <section className="rounded-[26px] border border-[#dbe7ec] bg-[#f8fbfc] px-4 py-4 shadow-[0_16px_34px_rgba(39,89,104,0.08)] sm:px-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#2f788a]">
                    {t("POSMonitor.labels.pos_station")}
                  </div>
                  <h4 className="mt-2 text-2xl font-semibold text-slate-800">
                    {session.pos_point_name || session.pos || "—"}
                  </h4>
                  <div className="mt-1 text-sm text-slate-500">
                    {t("POSMonitor.labels.session_number", { id: session.id })}
                  </div>
                </div>

                <StatusBadge
                  active={session.status === "active" && !session.ended_at}
                  activeLabel={t("POSMonitor.badges.active_session")}
                  inactiveLabel={t("POSMonitor.badges.ended_session")}
                />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <DetailBlock
                  label={t("POSMonitor.labels.opened_by")}
                  value={session.full_name || session.username || "—"}
                  hint={session.username || ""}
                />
                <DetailBlock
                  label={t("POSMonitor.labels.started")}
                  value={formatDateTime(session.started_at)}
                />
                <DetailBlock
                  label={t("POSMonitor.labels.ended")}
                  value={formatDateTime(session.ended_at)}
                />
                <DetailBlock
                  label={t("POSMonitor.labels.duration")}
                  value={session.duration_label || "—"}
                />
              </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MetricTile
                label={t("POSMonitor.summary.invoices")}
                value={session.invoice_count || 0}
                accent="slate"
              />
              <MetricTile
                label={t("POSMonitor.summary.total_sales")}
                value={formatCurrency(session.total_sales_amount)}
                accent="teal"
              />
              <MetricTile
                label={t("POSMonitor.summary.total_tokens_charged")}
                value={formatCount(session.total_tokens_charged)}
                accent="mint"
              />
              <MetricTile
                label={t("POSMonitor.summary.cash_received")}
                value={formatCurrency(session.total_cash_received)}
                accent="navy"
              />
            </section>

            <section className="grid gap-4 xl:grid-cols-2">
              <div className="rounded-[26px] border border-[#dbe7ec] bg-white px-4 py-4 shadow-[0_14px_30px_rgba(39,89,104,0.08)]">
                <div className="mb-3 text-sm font-semibold text-slate-700">
                  {t("POSMonitor.summary.tokens_group")}
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <DetailBlock
                    label={t("POSMonitor.summary.sold_tokens")}
                    value={formatCount(session.total_tokens_sold)}
                  />
                  <DetailBlock
                    label={t("POSMonitor.summary.manual_charged_tokens")}
                    value={formatCount(session.manual_tokens_charged)}
                  />
                  <DetailBlock
                    label={t("POSMonitor.summary.total_tokens_charged")}
                    value={formatCount(session.total_tokens_charged)}
                  />
                </div>
              </div>

              <div className="rounded-[26px] border border-[#dbe7ec] bg-white px-4 py-4 shadow-[0_14px_30px_rgba(39,89,104,0.08)]">
                <div className="mb-3 text-sm font-semibold text-slate-700">
                  {t("POSMonitor.summary.payments_group")}
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <DetailBlock
                    label={t("POSMonitor.summary.cash")}
                    value={formatCurrency(session.payment_totals?.cash)}
                  />
                  <DetailBlock
                    label={t("POSMonitor.summary.card")}
                    value={formatCurrency(session.payment_totals?.card)}
                  />
                  <DetailBlock
                    label={t("POSMonitor.summary.transfer")}
                    value={formatCurrency(session.payment_totals?.transfer)}
                  />
                  <DetailBlock
                    label={t("POSMonitor.summary.cash_received")}
                    value={formatCurrency(session.total_cash_received)}
                  />
                  <DetailBlock
                    label={t("POSMonitor.summary.change_given")}
                    value={formatCurrency(session.total_change_given)}
                  />
                </div>
              </div>
            </section>

            <section className="rounded-[26px] border border-[#dbe7ec] bg-white px-4 py-4 shadow-[0_14px_30px_rgba(39,89,104,0.08)]">
              <div className="mb-3">
                <div className="text-sm font-semibold text-slate-700">
                  {t("POSMonitor.session.sold_items_breakdown")}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {t("POSMonitor.session.sold_items_hint")}
                </p>
              </div>

              {(session.sold_items_breakdown || []).length === 0 ? (
                <div className="rounded-[18px] border border-dashed border-[#d8e6eb] px-4 py-5 text-sm text-slate-500">
                  {t("POSMonitor.states.no_sold_items")}
                </div>
              ) : (
                <div className="grid gap-3">
                  {session.sold_items_breakdown.map((item, index) => (
                    <article
                      key={item.item_id || `${item.item_name}-${index}`}
                      className="rounded-[20px] border border-[#dbe7ec] bg-[#f8fbfc] px-4 py-4"
                    >
                      <div className="font-semibold text-slate-800">
                        {item.item_name || `Item #${item.item_id}`}
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                        <DetailBlock
                          label={t("POSMonitor.table.qty_sold")}
                          value={formatCount(item.quantity_sold)}
                        />
                        <DetailBlock
                          label={t("POSMonitor.table.total_sales")}
                          value={formatCurrency(item.total_amount)}
                        />
                        <DetailBlock
                          label={t("POSMonitor.table.tokens_per_item")}
                          value={formatCount(item.tokens_per_item)}
                        />
                        <DetailBlock
                          label={t("POSMonitor.table.total_tokens")}
                          value={formatCount(item.total_tokens)}
                        />
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-[26px] border border-[#dbe7ec] bg-white px-4 py-4 shadow-[0_14px_30px_rgba(39,89,104,0.08)]">
              <div className="mb-3 text-sm font-semibold text-slate-700">
                {t("POSMonitor.session.invoices_in_session")}
              </div>

              {(session.invoices || []).length === 0 ? (
                <div className="rounded-[18px] border border-dashed border-[#d8e6eb] px-4 py-5 text-sm text-slate-500">
                  {t("POSMonitor.states.no_invoices")}
                </div>
              ) : (
                <div className="grid gap-3">
                  {session.invoices.map((invoice) => (
                    <article
                      key={invoice.invoice_number}
                      className="rounded-[20px] border border-[#dbe7ec] bg-[#f8fbfc] px-4 py-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-semibold text-slate-800">{invoice.invoice_number}</div>
                        <div className="text-sm font-semibold text-[#2f788a]">
                          {formatCurrency(invoice.total)}
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-slate-500">
                        {invoice.client || t("POS.cart.walk_in")}
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        {formatDateTime(invoice.date)}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : null}
      </div>
    </ModalShell>
  );
}

export default function POSMonitoringScreen({ session }) {
  const { t } = useTranslation();
  const posPerm = session?.permissions?.pos || {};
  const canView = posPerm.view === true;
  const canEdit = posPerm.edit === true;

  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
      posPointId: "",
    };
  });
  const printRef = useRef(null);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    pageStyle: `
      @page { size: A4 portrait; margin: 0; }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #fff !important;
      }
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    `,
  });

  const posPoints = overview?.pos_points || [];
  const activeSessions = overview?.active_sessions || [];
  const summary = overview?.summary || {};

  const loadOverview = async () => {
    setLoading(true);
    setError("");

    try {
      const payload = await fetchPortalPosMonitoringOverview();
      setOverview(payload);
    } catch (requestError) {
      setError(requestError.message || t("POSMonitor.messages.load_monitoring_failed"));
    } finally {
      setLoading(false);
    }
  };

  const loadCompany = async () => {
    try {
      const payload = await fetchPortalCompany();
      const preparedCompany = await prepareCompanyWithLogo(payload || null);
      setCompany(preparedCompany);
    } catch {
      setCompany(null);
    }
  };

  const loadSessionsForPosPoint = async (posPointId) => {
    const payload = await fetchPortalPosPointSessions(posPointId);
    setSessionsByPosPointId((current) => ({
      ...current,
      [posPointId]: payload.sessions || [],
    }));
  };

  useEffect(() => {
    if (!canView) {
      setLoading(false);
      return;
    }

    loadOverview();
    loadCompany();
  }, [canView]);

  useEffect(() => {
    if (!pendingPrint || !sessionPrintData || !company) return;

    handlePrint();
    setPendingPrint(false);
    setPrintingSessionId(null);
  }, [company, handlePrint, pendingPrint, sessionPrintData]);

  const toggleHistory = async (posPointId) => {
    const nextExpanded = expandedPosPointId === posPointId ? null : posPointId;
    setExpandedPosPointId(nextExpanded);

    if (nextExpanded == null || sessionsByPosPointId[posPointId]) {
      return;
    }

    setHistoryLoadingFor(posPointId);

    try {
      await loadSessionsForPosPoint(posPointId);
    } catch (requestError) {
      setError(requestError.message || t("POSMonitor.messages.load_history_failed"));
    } finally {
      setHistoryLoadingFor(null);
    }
  };

  const handlePrintSessionSummary = async (sessionId) => {
    try {
      setPrintingSessionId(sessionId);
      const [sessionPayload, companyPayload] = await Promise.all([
        fetchPortalPosSessionSummary(sessionId),
        company ? Promise.resolve(company) : fetchPortalCompany(),
      ]);
      const preparedCompany = await prepareCompanyWithLogo(companyPayload || null);

      setSessionPrintData(sessionPayload);
      setCompany(preparedCompany);
      setPendingPrint(true);
    } catch (requestError) {
      setError(requestError.message || t("POSMonitor.messages.load_print_summary_failed"));
      setPrintingSessionId(null);
    }
  };

  const handleForceClose = async () => {
    if (!forceCloseTarget) return;

    setForceClosing(true);

    try {
      await forceClosePortalPosSession(forceCloseTarget.id);
      setForceCloseTarget(null);
      await loadOverview();

      if (sessionsByPosPointId[forceCloseTarget.posPointId]) {
        await loadSessionsForPosPoint(forceCloseTarget.posPointId);
      }
    } catch (requestError) {
      setError(requestError.message || t("POSMonitor.messages.force_close_failed"));
    } finally {
      setForceClosing(false);
    }
  };

  const handlePrintAggregateSummary = async ({ from, to, posPointId }) => {
    setPrintingAggregate(true);

    try {
      const normalizedRange = { from, to, posPointId: posPointId || "" };
      const [summaryPayload, companyPayload] = await Promise.all([
        fetchPortalPosAggregateSummary({
          from: toSqlDateTimeValue(from),
          to: toSqlDateTimeValue(to),
          posPointId,
        }),
        company ? Promise.resolve(company) : fetchPortalCompany(),
      ]);
      const preparedCompany = await prepareCompanyWithLogo(companyPayload || null);

      setSummaryRange(normalizedRange);
      setSummaryModalOpen(false);
      setSessionPrintData(summaryPayload);
      setCompany(preparedCompany);
      setPendingPrint(true);
    } catch (requestError) {
      setError(requestError.message || t("POSMonitor.messages.load_aggregate_summary_failed"));
    } finally {
      setPrintingAggregate(false);
    }
  };

  if (!canView) {
    return <NoAccess />;
  }

  return (
    <div className="grid gap-4">
      <section className="rounded-[28px] border border-[#dbe7ec] bg-white px-5 py-5 shadow-[0_18px_40px_rgba(39,89,104,0.08)]">
        <p className="portal-eyebrow">{t("portalBrand.portal_name")}</p>
        <h1 className="text-xl font-semibold text-slate-800">{t("POSMonitor.title")}</h1>
      </section>

      <section className="sticky top-0 z-10 rounded-[26px] border border-[#dbe7ec] bg-white/95 px-3 py-3 shadow-[0_16px_34px_rgba(39,89,104,0.1)] backdrop-blur">
        <div className="hide-scrollbar flex gap-2 overflow-x-auto">
          <ActionButton type="button" onClick={loadOverview}>
            {t("POSMonitor.actions.refresh")}
          </ActionButton>
          <ActionButton type="button" tone="secondary" onClick={() => setSummaryModalOpen(true)}>
            {t("POSMonitor.actions.summary_by_time_frame")}
          </ActionButton>
        </div>
      </section>

      {error ? (
        <div className="rounded-[22px] border border-[#f6d1d1] bg-[#fff4f4] px-4 py-4 text-sm text-[#c04848]">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-[26px] border border-[#dbe7ec] bg-white px-5 py-6 text-sm text-slate-600 shadow-[0_16px_34px_rgba(39,89,104,0.08)]">
          {t("POSMonitor.states.loading_pos_stations")}
        </div>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricTile
              label={t("POSMonitor.labels.pos_station")}
              value={summary.total_pos_points || 0}
              hint={t("POSMonitor.labels.pos_count")}
              accent="slate"
            />
            <MetricTile
              label={t("POSMonitor.badges.active")}
              value={summary.active_pos_points || 0}
              hint={t("POSMonitor.states.total_sessions_recorded")}
              accent="teal"
            />
            <MetricTile
              label={t("POSMonitor.labels.current_occupancy")}
              value={summary.occupied_pos_points || 0}
              hint={t("POSMonitor.badges.active_session")}
              accent="mint"
            />
            <MetricTile
              label={t("POSMonitor.labels.session_history")}
              value={summary.total_sessions || 0}
              hint={t("POSMonitor.labels.sessions_count")}
              accent="navy"
            />
          </section>

          <section className="grid gap-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="portal-eyebrow">{t("portalPOSMonitor.live_status")}</p>
                <h2 className="text-lg font-semibold text-slate-800">
                  {t("POSMonitor.labels.current_occupancy")}
                </h2>
              </div>
              <div className="text-sm text-slate-500">
                {activeSessions.length} {t("POSMonitor.labels.sessions_count").toLowerCase()}
              </div>
            </div>

            {activeSessions.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-[#d8e6eb] bg-white px-4 py-5 text-sm text-slate-500">
                {t("POSMonitor.states.no_active_session")}
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {activeSessions.map((activeSession) => (
                  <article
                    key={activeSession.id}
                    className="rounded-[24px] border border-[#dbe7ec] bg-white px-4 py-4 shadow-[0_14px_30px_rgba(39,89,104,0.08)]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-800">
                          {activeSession.pos_point_name}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {formatDateTime(activeSession.started_at)}
                        </div>
                      </div>
                      <StatusBadge active activeLabel={t("POSMonitor.badges.active_session")} />
                    </div>
                    <div className="mt-3 text-sm text-slate-600">
                      {activeSession.full_name || activeSession.username || t("POSMonitor.states.active_user")}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            {posPoints.length === 0 ? (
              <div className="rounded-[26px] border border-dashed border-[#d8e6eb] bg-white px-5 py-6 text-sm text-slate-500">
                {t("POSMonitor.states.no_pos_stations")}
              </div>
            ) : (
              posPoints.map((posPoint) => {
                const sessions = sessionsByPosPointId[posPoint.id] || [];
                const isExpanded = expandedPosPointId === posPoint.id;
                const activeSession = posPoint.active_session;

                return (
                  <article
                    key={posPoint.id}
                    className="overflow-hidden rounded-[28px] border border-[#dbe7ec] bg-white shadow-[0_18px_40px_rgba(39,89,104,0.08)]"
                  >
                    <div className="grid gap-4 px-4 py-4 sm:px-5 sm:py-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#2f788a]">
                            {t("POSMonitor.labels.pos_station")}
                          </div>
                          <h3 className="mt-2 text-2xl font-semibold text-slate-800">{posPoint.name}</h3>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <StatusBadge active={posPoint.is_active} />
                          {posPoint.has_ecr ? (
                            <span className="inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                              {t("POSMonitor.badges.ecr_connected")}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-[22px] border border-[#dbe7ec] bg-[#f8fbfc] px-4 py-4">
                          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                            {t("POSMonitor.labels.current_occupancy")}
                          </div>
                          {activeSession ? (
                            <>
                              <div className="mt-2 font-semibold text-slate-800">
                                {activeSession.full_name ||
                                  activeSession.username ||
                                  t("POSMonitor.states.active_user")}
                              </div>
                              <div className="mt-1 text-sm text-slate-500">
                                {t("POSMonitor.labels.started")} {formatDateTime(activeSession.started_at)}
                              </div>
                              {canEdit ? (
                                <ActionButton
                                  type="button"
                                  tone="danger"
                                  className="mt-3"
                                  onClick={() =>
                                    setForceCloseTarget({
                                      ...activeSession,
                                      posPointId: posPoint.id,
                                    })
                                  }
                                >
                                  {t("POSMonitor.actions.force_close")}
                                </ActionButton>
                              ) : null}
                            </>
                          ) : (
                            <div className="mt-2 text-sm text-slate-500">
                              {t("POSMonitor.states.no_active_session")}
                            </div>
                          )}
                        </div>

                        <div className="rounded-[22px] border border-[#dbe7ec] bg-[#f8fbfc] px-4 py-4">
                          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                            {t("POSMonitor.labels.session_history")}
                          </div>
                          <div className="mt-2 text-3xl font-semibold text-slate-800">
                            {posPoint.session_count || 0}
                          </div>
                          <div className="mt-1 text-sm text-slate-500">
                            {t("POSMonitor.states.total_sessions_recorded")}
                          </div>
                        </div>
                      </div>

                      {posPoint.description ? (
                        <div className="rounded-[20px] bg-[#f5fafb] px-4 py-4 text-sm leading-6 text-slate-600">
                          {posPoint.description}
                        </div>
                      ) : null}

                      <div className="flex flex-wrap gap-2">
                        <ActionButton type="button" onClick={() => toggleHistory(posPoint.id)}>
                          {isExpanded
                            ? t("POSMonitor.actions.hide_sessions")
                            : t("POSMonitor.actions.view_sessions")}
                        </ActionButton>
                      </div>
                    </div>

                    {isExpanded ? (
                      <div className="border-t border-[#e2ecef] bg-[#f8fbfc] px-4 py-4 sm:px-5">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold text-slate-700">
                            {t("POSMonitor.labels.session_history")}
                          </div>
                          {historyLoadingFor === posPoint.id ? (
                            <div className="text-xs text-slate-500">
                              {t("POSMonitor.states.loading")}
                            </div>
                          ) : null}
                        </div>

                        {historyLoadingFor === posPoint.id ? (
                          <div className="text-sm text-slate-500">
                            {t("POSMonitor.states.loading_sessions")}
                          </div>
                        ) : sessions.length === 0 ? (
                          <div className="rounded-[20px] border border-dashed border-[#d8e6eb] bg-white px-4 py-5 text-sm text-slate-500">
                            {t("POSMonitor.states.no_sessions")}
                          </div>
                        ) : (
                          <div className="grid gap-3">
                            {sessions.map((sessionItem) => (
                              <article
                                key={sessionItem.id}
                                className="rounded-[22px] border border-[#dbe7ec] bg-white px-4 py-4 shadow-[0_12px_26px_rgba(39,89,104,0.06)]"
                              >
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-semibold text-slate-800">
                                    {t("POSMonitor.labels.session_number", { id: sessionItem.id })}
                                  </span>
                                  <StatusBadge
                                    active={sessionItem.status === "active" && !sessionItem.ended_at}
                                    activeLabel={t("POSMonitor.badges.active")}
                                    inactiveLabel={t("POSMonitor.badges.ended")}
                                  />
                                </div>

                                <div className="mt-2 text-sm text-slate-600">
                                  {sessionItem.full_name ||
                                    sessionItem.username ||
                                    t("POSMonitor.states.unknown_user")}
                                </div>
                                <div className="mt-1 text-xs leading-5 text-slate-500">
                                  {t("POSMonitor.labels.session_period", {
                                    start: formatDateTime(sessionItem.started_at),
                                    end: formatDateTime(sessionItem.ended_at),
                                  })}
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-3">
                                  <DetailBlock
                                    label={t("POSMonitor.summary.total_sales")}
                                    value={formatCurrency(sessionItem.total_sales_amount)}
                                  />
                                  <DetailBlock
                                    label={t("POSMonitor.summary.invoices")}
                                    value={sessionItem.invoice_count || 0}
                                  />
                                </div>

                                <div className="mt-4 flex flex-wrap gap-2">
                                  <ActionButton
                                    type="button"
                                    tone="secondary"
                                    onClick={() => setSelectedSessionId(sessionItem.id)}
                                  >
                                    {t("POSMonitor.actions.view_details")}
                                  </ActionButton>
                                  <ActionButton
                                    type="button"
                                    onClick={() => handlePrintSessionSummary(sessionItem.id)}
                                    disabled={printingSessionId === sessionItem.id}
                                  >
                                    {printingSessionId === sessionItem.id
                                      ? t("POSMonitor.actions.preparing")
                                      : t("POSMonitor.actions.print_session_summary")}
                                  </ActionButton>
                                  {canEdit && sessionItem.status === "active" && !sessionItem.ended_at ? (
                                    <ActionButton
                                      type="button"
                                      tone="danger"
                                      onClick={() =>
                                        setForceCloseTarget({
                                          ...sessionItem,
                                          posPointId: posPoint.id,
                                        })
                                      }
                                    >
                                      {t("POSMonitor.actions.force_close")}
                                    </ActionButton>
                                  ) : null}
                                </div>
                              </article>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </article>
                );
              })
            )}
          </section>
        </>
      )}

      <SummaryTimeFrameModal
        open={summaryModalOpen}
        onClose={() => {
          if (printingAggregate) return;
          setSummaryModalOpen(false);
        }}
        onSubmit={handlePrintAggregateSummary}
        submitting={printingAggregate}
        initialRange={summaryRange}
        posPoints={posPoints}
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

      <SessionDetailModal sessionId={selectedSessionId} onClose={() => setSelectedSessionId(null)} />

      <div className="hidden">
        <SessionSummaryPrint ref={printRef} session={sessionPrintData} company={company} />
      </div>
    </div>
  );
}
