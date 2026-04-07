import { useEffect, useRef, useState } from "react";
import { useReactToPrint } from "@/utils/useAppReactToPrint";
import api from "../../utils/axiosInstance";
import ClientList from "../invoices/clientlist";
import Popup from "../../components/Popup";
import EventDetailsPrint from "./EventDetailsPrint";
import { useTranslation } from "react-i18next";

const formatCurrency = (value) => `${Number(value || 0).toFixed(3)} JOD`;

const formatDate = (value) => {
  if (!value) return "—";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(parsed);
};

const formatTime = (value) => {
  if (!value) return "—";
  return String(value).slice(0, 5);
};

const translateEventType = (value, t) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "birthday") return t("EventsScreen.suggestions.birthday");
  if (normalized === "event") return t("EventsScreen.suggestions.event");
  return value || "—";
};

const translatePaymentType = (value, t) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "cash") return t("EventsScreen.payment_types.cash");
  if (normalized === "card") return t("EventsScreen.payment_types.card");
  if (normalized === "transfer" || normalized === "bank transfer") {
    return t("EventsScreen.payment_types.bank");
  }
  return value || "—";
};

const getToday = () => new Date().toISOString().slice(0, 10);

const readPermissions = () => {
  try {
    return JSON.parse(localStorage.getItem("permissions")) || {};
  } catch {
    return {};
  }
};

function SummaryCard({ label, value, accentClass = "text-[#2f788a]" }) {
  return (
    <div className="rounded-2xl border border-base-300 bg-white px-5 py-4 shadow-sm">
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className={`mt-2 text-2xl font-semibold ${accentClass}`}>{value}</div>
    </div>
  );
}

function EventsEmptyState({ canCreate, onCreate }) {
  const { t } = useTranslation();

  return (
    <div className="rounded-3xl border border-dashed border-base-300 bg-white px-8 py-14 text-center shadow-sm">
      <h2 className="text-2xl font-semibold text-gray-900">{t("EventsScreen.empty.title")}</h2>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-gray-500">
        {t("EventsScreen.empty.description")}
      </p>
      {canCreate && (
        <button type="button" className="btn btn-primary mt-6" onClick={onCreate}>
          {t("EventsScreen.empty.action")}
        </button>
      )}
    </div>
  );
}

function EventFormModal({ open, onClose, onSaved, canCreate }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: "",
    type: "",
    location: "",
    event_date: getToday(),
    event_time: "",
    client_id: null,
    client_name: "",
    details: "",
    notes: "",
    total_amount: "",
    initial_payment_amount: "",
    initial_payment_date: getToday(),
  });
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    setForm({
      name: "",
      type: "",
      location: "",
      event_date: getToday(),
      event_time: "",
      client_id: null,
      client_name: "",
      details: "",
      notes: "",
      total_amount: "",
      initial_payment_amount: "",
      initial_payment_date: getToday(),
    });
    setError("");
    setSaving(false);
  }, [open]);

  if (!open) return null;

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        ...form,
        total_amount: form.total_amount === "" ? "" : Number(form.total_amount),
        initial_payment_amount:
          form.initial_payment_amount === "" ? 0 : Number(form.initial_payment_amount),
      };

      const response = await api.post("/api/events", payload);
      onSaved(response.data);
    } catch (err) {
      setError(err?.response?.data?.message || t("EventsScreen.messages.create_failed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-base-300 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-base-300 px-6 py-5">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              {t("EventsScreen.form.create_title")}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {t("EventsScreen.form.create_subtitle")}
            </p>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            {t("EventsScreen.actions.close")}
          </button>
        </div>

        <form className="space-y-6 px-6 py-5" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <section className="rounded-3xl border border-base-300 bg-base-100 p-5">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {t("EventsScreen.form.sections.event_details")}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {t("EventsScreen.form.sections.event_details_hint")}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  {t("EventsScreen.fields.event_name")}
                </label>
                <input
                  type="text"
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-[#2f788a] focus:outline-none focus:ring-2 focus:ring-[#2f788a]/20"
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  disabled={saving || !canCreate}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  {t("EventsScreen.fields.type")}
                </label>
                <input
                  type="text"
                  list="event-type-suggestions"
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-[#2f788a] focus:outline-none focus:ring-2 focus:ring-[#2f788a]/20"
                  value={form.type}
                  onChange={(event) => updateField("type", event.target.value)}
                  disabled={saving || !canCreate}
                />
                <datalist id="event-type-suggestions">
                  <option value={t("EventsScreen.suggestions.birthday")} />
                  <option value={t("EventsScreen.suggestions.event")} />
                </datalist>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  {t("EventsScreen.fields.location")}
                </label>
                <input
                  type="text"
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-[#2f788a] focus:outline-none focus:ring-2 focus:ring-[#2f788a]/20"
                  value={form.location}
                  onChange={(event) => updateField("location", event.target.value)}
                  disabled={saving || !canCreate}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  {t("EventsScreen.fields.client")}
                </label>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-xl border border-[#2f788a] px-4 py-3 text-sm font-medium text-[#2f788a] transition hover:bg-[#2f788a]/5"
                    onClick={() => setShowClientPicker(true)}
                    disabled={saving || !canCreate}
                  >
                    {t("EventsScreen.actions.select")}
                  </button>
                  <input
                    type="text"
                    readOnly
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700"
                    value={form.client_name}
                    placeholder={t("EventsScreen.placeholders.choose_client")}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  {t("EventsScreen.fields.event_date")}
                </label>
                <input
                  type="date"
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-[#2f788a] focus:outline-none focus:ring-2 focus:ring-[#2f788a]/20"
                  value={form.event_date}
                  onChange={(event) => updateField("event_date", event.target.value)}
                  disabled={saving || !canCreate}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  {t("EventsScreen.fields.event_time")}
                </label>
                <input
                  type="time"
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-[#2f788a] focus:outline-none focus:ring-2 focus:ring-[#2f788a]/20"
                  value={form.event_time}
                  onChange={(event) => updateField("event_time", event.target.value)}
                  disabled={saving || !canCreate}
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">
                  {t("EventsScreen.fields.details")}
                </label>
                <textarea
                  rows={4}
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-[#2f788a] focus:outline-none focus:ring-2 focus:ring-[#2f788a]/20"
                  value={form.details}
                  onChange={(event) => updateField("details", event.target.value)}
                  disabled={saving || !canCreate}
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">
                  {t("EventsScreen.fields.notes")}
                </label>
                <textarea
                  rows={3}
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-[#2f788a] focus:outline-none focus:ring-2 focus:ring-[#2f788a]/20"
                  value={form.notes}
                  onChange={(event) => updateField("notes", event.target.value)}
                  disabled={saving || !canCreate}
                />
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-base-300 bg-base-100 p-5">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {t("EventsScreen.form.sections.financial_details")}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {t("EventsScreen.form.sections.financial_details_hint")}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  {t("EventsScreen.fields.total_amount")}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-[#2f788a] focus:outline-none focus:ring-2 focus:ring-[#2f788a]/20"
                  value={form.total_amount}
                  onChange={(event) => updateField("total_amount", event.target.value)}
                  disabled={saving || !canCreate}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  {t("EventsScreen.fields.initial_payment_amount")}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-[#2f788a] focus:outline-none focus:ring-2 focus:ring-[#2f788a]/20"
                  value={form.initial_payment_amount}
                  onChange={(event) => updateField("initial_payment_amount", event.target.value)}
                  disabled={saving || !canCreate}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  {t("EventsScreen.fields.initial_payment_date")}
                </label>
                <input
                  type="date"
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-[#2f788a] focus:outline-none focus:ring-2 focus:ring-[#2f788a]/20"
                  value={form.initial_payment_date}
                  onChange={(event) => updateField("initial_payment_date", event.target.value)}
                  disabled={saving || !canCreate}
                />
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-3">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>
              {t("EventsScreen.actions.cancel")}
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving || !canCreate}>
              {saving ? t("EventsScreen.states.saving") : t("EventsScreen.actions.save_event")}
            </button>
          </div>
        </form>
      </div>

      {showClientPicker && (
        <ClientList
          onClose={() => setShowClientPicker(false)}
          onSelect={(client) => {
            setForm((current) => ({
              ...current,
              client_id: client.id,
              client_name: client.name,
            }));
            setShowClientPicker(false);
          }}
        />
      )}
    </div>
  );
}

function AddPaymentModal({ open, eventSummary, onClose, onSaved, canSave }) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(getToday());
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setAmount("");
    setPaymentDate(getToday());
    setNotes("");
    setSaving(false);
    setError("");
  }, [open]);

  if (!open || !eventSummary) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await api.post(`/api/events/${eventSummary.id}/payments`, {
        amount: Number(amount),
        payment_date: paymentDate,
        notes,
      });
      onSaved(response.data);
    } catch (err) {
      setError(err?.response?.data?.message || t("EventsScreen.messages.add_payment_failed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-xl rounded-3xl border border-base-300 bg-white shadow-2xl">
        <div className="border-b border-base-300 px-6 py-5">
          <h2 className="text-xl font-semibold text-gray-900">
            {t("EventsScreen.actions.add_payment")}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {t("EventsScreen.payment_modal.subtitle", { eventName: eventSummary.name })}
          </p>
        </div>

        <form className="space-y-5 px-6 py-5" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-base-300 bg-base-100 px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-gray-500">
                {t("EventsScreen.summary.total")}
              </div>
              <div className="mt-2 text-lg font-semibold text-gray-900">
                {formatCurrency(eventSummary.total_amount)}
              </div>
            </div>
            <div className="rounded-2xl border border-base-300 bg-base-100 px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-gray-500">
                {t("EventsScreen.summary.paid")}
              </div>
              <div className="mt-2 text-lg font-semibold text-emerald-600">
                {formatCurrency(eventSummary.total_paid)}
              </div>
            </div>
            <div className="rounded-2xl border border-base-300 bg-base-100 px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-gray-500">
                {t("EventsScreen.summary.remaining")}
              </div>
              <div className="mt-2 text-lg font-semibold text-amber-600">
                {formatCurrency(eventSummary.remaining_balance)}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700">
                {t("EventsScreen.fields.amount")}
              </label>
              <input
                type="number"
                min="0"
                step="0.001"
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-[#2f788a] focus:outline-none focus:ring-2 focus:ring-[#2f788a]/20"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                disabled={saving || !canSave}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                {t("EventsScreen.fields.payment_date")}
              </label>
              <input
                type="date"
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-[#2f788a] focus:outline-none focus:ring-2 focus:ring-[#2f788a]/20"
                value={paymentDate}
                onChange={(event) => setPaymentDate(event.target.value)}
                disabled={saving || !canSave}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              {t("EventsScreen.fields.notes")}
            </label>
            <textarea
              rows={3}
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-[#2f788a] focus:outline-none focus:ring-2 focus:ring-[#2f788a]/20"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              disabled={saving || !canSave}
            />
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>
              {t("EventsScreen.actions.cancel")}
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving || !canSave}>
              {saving ? t("EventsScreen.states.saving") : t("EventsScreen.actions.add_payment")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EventDetailsModal({
  eventId,
  open,
  onClose,
  onEventUpdated,
  canAddPayment,
  onPrintDetails,
}) {
  const { t } = useTranslation();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const loadEvent = async () => {
    if (!eventId) return;

    setLoading(true);
    setError("");

    try {
      const response = await api.get(`/api/events/${eventId}`);
      setEvent(response.data);
    } catch (err) {
      setError(err?.response?.data?.message || t("EventsScreen.messages.load_details_failed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open || !eventId) return;
    loadEvent();
  }, [eventId, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-3xl border border-base-300 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-base-300 px-6 py-5">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              {t("EventsScreen.actions.event_details")}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {t("EventsScreen.details.subtitle")}
            </p>
          </div>
          <div className="flex gap-2">
            {event && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => onPrintDetails?.(event)}
              >
                {t("EventsScreen.actions.print_details")}
              </button>
            )}
            {event && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setShowPaymentModal(true)}
                disabled={!canAddPayment}
              >
                {t("EventsScreen.actions.add_payment")}
              </button>
            )}
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
              {t("EventsScreen.actions.close")}
            </button>
          </div>
        </div>

        <div className="max-h-[calc(92vh-96px)] overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex items-center gap-3 rounded-2xl border border-base-300 bg-base-100 px-4 py-4 text-sm text-gray-600">
              <span className="loading loading-spinner loading-md text-[#2f788a]"></span>
              {t("EventsScreen.states.loading_details")}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : event ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <SummaryCard
                  label={t("EventsScreen.summary.total_amount")}
                  value={formatCurrency(event.total_amount)}
                />
                <SummaryCard
                  label={t("EventsScreen.summary.total_paid")}
                  value={formatCurrency(event.total_paid)}
                  accentClass="text-emerald-600"
                />
                <SummaryCard
                  label={t("EventsScreen.summary.remaining_balance")}
                  value={formatCurrency(event.remaining_balance)}
                  accentClass="text-amber-600"
                />
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
                <section className="rounded-3xl border border-base-300 bg-base-100 p-5">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {t("EventsScreen.sections.operational_details")}
                  </h3>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-500">
                        {t("EventsScreen.fields.name")}
                      </div>
                      <div className="mt-1 text-sm font-medium text-gray-900">{event.name}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-500">
                        {t("EventsScreen.fields.type")}
                      </div>
                      <div className="mt-1 text-sm font-medium text-gray-900">
                        {translateEventType(event.type, t)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-500">
                        {t("EventsScreen.fields.location")}
                      </div>
                      <div className="mt-1 text-sm font-medium text-gray-900">
                        {event.location || "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-500">
                        {t("EventsScreen.fields.client")}
                      </div>
                      <div className="mt-1 text-sm font-medium text-gray-900">
                        {event.client_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {event.client_phone || t("EventsScreen.states.no_phone")}{" "}
                        {event.client_detail_value ? `• ${event.client_detail_value}` : ""}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-500">
                        {t("EventsScreen.fields.event_date")}
                      </div>
                      <div className="mt-1 text-sm font-medium text-gray-900">
                        {formatDate(event.event_date)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-500">
                        {t("EventsScreen.fields.event_time")}
                      </div>
                      <div className="mt-1 text-sm font-medium text-gray-900">
                        {formatTime(event.event_time)}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-xs uppercase tracking-wide text-gray-500">
                        {t("EventsScreen.fields.details")}
                      </div>
                      <div className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                        {event.details || "—"}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-xs uppercase tracking-wide text-gray-500">
                        {t("EventsScreen.fields.notes")}
                      </div>
                      <div className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                        {event.notes || "—"}
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-3xl border border-base-300 bg-base-100 p-5">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {t("EventsScreen.sections.financial_snapshot")}
                  </h3>
                  <div className="mt-4 space-y-4">
                    <div className="rounded-2xl border border-base-300 bg-white px-4 py-3">
                      <div className="text-xs uppercase tracking-wide text-gray-500">
                        {t("EventsScreen.fields.created")}
                      </div>
                      <div className="mt-1 text-sm font-medium text-gray-900">
                        {formatDate(event.created_at)}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-base-300 bg-white px-4 py-3">
                      <div className="text-xs uppercase tracking-wide text-gray-500">
                        {t("EventsScreen.fields.payment_count")}
                      </div>
                      <div className="mt-1 text-sm font-medium text-gray-900">
                        {event.payments.length}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-base-300 bg-white px-4 py-3">
                      <div className="text-xs uppercase tracking-wide text-gray-500">
                        {t("EventsScreen.fields.invoice_pattern")}
                      </div>
                      <div className="mt-1 text-sm font-medium text-gray-900">
                        {t("EventsScreen.details.invoice_pattern_value")}
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <section className="rounded-3xl border border-base-300 bg-base-100 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {t("EventsScreen.sections.payment_history")}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {t("EventsScreen.details.payment_history_hint")}
                    </p>
                  </div>
                </div>

                <div className="mt-4 overflow-hidden rounded-2xl border border-base-300 bg-white">
                  <div className="overflow-x-auto">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>{t("EventsScreen.table.date")}</th>
                          <th>{t("EventsScreen.table.type")}</th>
                          <th>{t("EventsScreen.table.amount")}</th>
                          <th>{t("EventsScreen.table.invoice")}</th>
                          <th>{t("EventsScreen.table.notes")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {event.payments.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-sm text-gray-500">
                              {t("EventsScreen.states.no_payments")}
                            </td>
                          </tr>
                        ) : (
                          event.payments.map((payment) => (
                            <tr key={payment.id}>
                              <td>{formatDate(payment.payment_date)}</td>
                              <td>{translatePaymentType(payment.payment_type, t)}</td>
                              <td className="font-semibold text-gray-900">
                                {formatCurrency(payment.amount)}
                              </td>
                              <td>
                                {payment.invoice_number ? (
                                  <div className="space-y-1">
                                    <div className="font-medium text-gray-900">
                                      {payment.invoice_number}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {t("EventsScreen.table.invoice_id", { id: payment.invoice_id })}
                                    </div>
                                  </div>
                                ) : (
                                  "—"
                                )}
                              </td>
                              <td>{payment.notes || "—"}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            </div>
          ) : null}
        </div>
      </div>

      <AddPaymentModal
        open={showPaymentModal}
        eventSummary={event}
        onClose={() => setShowPaymentModal(false)}
        canSave={canAddPayment}
        onSaved={(result) => {
          setEvent(result.event);
          setShowPaymentModal(false);
          onEventUpdated(result.event);
        }}
      />
    </div>
  );
}

function NoAccess() {
  const { t } = useTranslation();

  return (
    <div className="flex h-full w-full items-center justify-center bg-base-200 p-6">
      <div className="rounded-2xl border border-base-300 bg-white px-8 py-10 text-center shadow-xl">
        <h2 className="text-xl font-bold text-gray-900">{t("EventsScreen.no_access.title")}</h2>
        <p className="mt-2 text-sm text-gray-600">
          {t("EventsScreen.no_access.message")}
        </p>
      </div>
    </div>
  );
}

export default function EventsScreen() {
  const { t } = useTranslation();
  const permissions = readPermissions();
  const salesPerm = permissions?.sales || {};
  const canView = salesPerm.view === true;
  const canCreate = salesPerm.add === true;
  const canAddPayment = salesPerm.edit === true || salesPerm.add === true;

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [company, setCompany] = useState(null);
  const [printEvent, setPrintEvent] = useState(null);
  const [pendingPrint, setPendingPrint] = useState(false);
  const printRef = useRef(null);

  const loadEvents = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/api/events");
      setEvents(response.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || t("EventsScreen.messages.load_failed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canView) {
      loadEvents();
    }
  }, [canView]);

  useEffect(() => {
    if (!canView) return;

    api
      .get("/api/invoices/company")
      .then((response) => setCompany(response.data || null))
      .catch(() => setCompany(null));
  }, [canView]);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: printEvent?.name
      ? `${printEvent.name} ${t("EventsScreen.actions.event_details")}`
      : t("EventsScreen.actions.event_details"),
    pageStyle: `
      @page {
        size: A4;
        margin: 0 !important;
      }

      html, body {
        margin: 0 !important;
        padding: 0 !important;
      }

      * {
        box-sizing: border-box;
      }
    `,
  });

  useEffect(() => {
    if (pendingPrint && printEvent && company) {
      handlePrint();
      setPendingPrint(false);
    }
  }, [pendingPrint, printEvent, company, handlePrint]);

  const printEventDetails = async (eventOrId) => {
    try {
      const eventId = typeof eventOrId === "object" ? eventOrId?.id : eventOrId;
      if (!eventId) return;

      const detailedEvent =
        typeof eventOrId === "object" && Array.isArray(eventOrId?.payments)
          ? eventOrId
          : (await api.get(`/api/events/${eventId}`)).data;

      setPrintEvent(detailedEvent);
      setPendingPrint(true);
    } catch (err) {
      setPopupMessage(
        err?.response?.data?.message || t("EventsScreen.messages.print_failed"),
      );
    }
  };

  if (!canView) {
    return <NoAccess />;
  }

  const totalEventValue = events.reduce((sum, event) => sum + Number(event.total_amount || 0), 0);
  const totalPaidValue = events.reduce((sum, event) => sum + Number(event.total_paid || 0), 0);
  const totalRemainingValue = events.reduce(
    (sum, event) => sum + Number(event.remaining_balance || 0),
    0,
  );

  return (
    <div className="h-full overflow-y-auto bg-base-200 px-6 py-6">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl border border-base-300 bg-white px-6 py-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">{t("EventsScreen.title")}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500">
              {t("EventsScreen.subtitle")}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn btn-outline" onClick={loadEvents} disabled={loading}>
              {t("EventsScreen.actions.refresh")}
            </button>
            {canCreate && (
              <button type="button" className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                {t("EventsScreen.actions.create_event")}
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard label={t("EventsScreen.summary.events_count")} value={String(events.length)} />
          <SummaryCard
            label={t("EventsScreen.summary.total_event_value")}
            value={formatCurrency(totalEventValue)}
            accentClass="text-[#1f5f6e]"
          />
          <SummaryCard
            label={t("EventsScreen.summary.remaining_across_events")}
            value={formatCurrency(totalRemainingValue)}
            accentClass="text-amber-600"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-base-300 bg-white px-5 py-4 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-gray-500">
              {t("EventsScreen.summary.total_paid")}
            </div>
            <div className="mt-2 text-2xl font-semibold text-emerald-600">
              {formatCurrency(totalPaidValue)}
            </div>
          </div>
          <div className="rounded-2xl border border-base-300 bg-white px-5 py-4 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-gray-500">
              {t("EventsScreen.summary.open_balance")}
            </div>
            <div className="mt-2 text-2xl font-semibold text-amber-600">
              {formatCurrency(totalRemainingValue)}
            </div>
          </div>
          <div className="rounded-2xl border border-base-300 bg-white px-5 py-4 shadow-sm xl:col-span-2">
            <div className="text-xs uppercase tracking-wide text-gray-500">
              {t("EventsScreen.summary.financial_rule")}
            </div>
            <div className="mt-2 text-sm font-medium text-gray-900">
              {t("EventsScreen.summary.financial_rule_value")}
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-3 rounded-2xl border border-base-300 bg-white px-5 py-5 text-sm text-gray-600 shadow-sm">
            <span className="loading loading-spinner loading-md text-[#2f788a]"></span>
            {t("EventsScreen.states.loading")}
          </div>
        ) : events.length === 0 ? (
          <EventsEmptyState canCreate={canCreate} onCreate={() => setShowCreateModal(true)} />
        ) : (
          <div className="overflow-hidden rounded-3xl border border-base-300 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t("EventsScreen.table.event")}</th>
                    <th>{t("EventsScreen.table.type")}</th>
                    <th>{t("EventsScreen.table.client")}</th>
                    <th>{t("EventsScreen.table.date")}</th>
                    <th>{t("EventsScreen.table.location")}</th>
                    <th>{t("EventsScreen.table.total")}</th>
                    <th>{t("EventsScreen.table.paid")}</th>
                    <th>{t("EventsScreen.table.remaining")}</th>
                    <th className="text-right">{t("EventsScreen.table.action")}</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id}>
                      <td>
                        <div className="font-semibold text-gray-900">{event.name}</div>
                        <div className="text-xs text-gray-500">{formatTime(event.event_time)}</div>
                      </td>
                      <td>{translateEventType(event.type, t)}</td>
                      <td>{event.client_name}</td>
                      <td>{formatDate(event.event_date)}</td>
                      <td>{event.location || "—"}</td>
                      <td className="font-medium text-gray-900">
                        {formatCurrency(event.total_amount)}
                      </td>
                      <td className="font-medium text-emerald-600">
                        {formatCurrency(event.total_paid)}
                      </td>
                      <td className="font-medium text-amber-600">
                        {formatCurrency(event.remaining_balance)}
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => printEventDetails(event.id)}
                          >
                            {t("EventsScreen.actions.print_details")}
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => {
                              setSelectedEventId(event.id);
                              setShowDetailsModal(true);
                            }}
                          >
                            {t("EventsScreen.actions.open")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <EventFormModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        canCreate={canCreate}
        onSaved={(createdEvent) => {
          setShowCreateModal(false);
          setPopupMessage(t("EventsScreen.messages.create_success"));
          loadEvents();
          if (createdEvent?.id) {
            setSelectedEventId(createdEvent.id);
            setShowDetailsModal(true);
          }
        }}
      />

      <EventDetailsModal
        open={showDetailsModal}
        eventId={selectedEventId}
        canAddPayment={canAddPayment}
        onPrintDetails={printEventDetails}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedEventId(null);
        }}
        onEventUpdated={() => {
          setPopupMessage(t("EventsScreen.messages.payment_saved_success"));
          loadEvents();
        }}
      />

      <div className="hidden">
        {printEvent && company && <EventDetailsPrint ref={printRef} event={printEvent} company={company} />}
      </div>

      {popupMessage && <Popup message={popupMessage} onClose={() => setPopupMessage("")} />}
    </div>
  );
}
