import { useEffect, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import api from "../../utils/axiosInstance";
import ClientList from "../invoices/clientlist";
import Popup from "../../components/Popup";
import EventDetailsPrint from "./EventDetailsPrint";

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
  return (
    <div className="rounded-3xl border border-dashed border-base-300 bg-white px-8 py-14 text-center shadow-sm">
      <h2 className="text-2xl font-semibold text-gray-900">No events yet</h2>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-gray-500">
        Create birthdays, private events, and other bookings here. Payments will stay linked to the
        event and each recorded payment will generate a real invoice automatically.
      </p>
      {canCreate && (
        <button type="button" className="btn btn-primary mt-6" onClick={onCreate}>
          Create First Event
        </button>
      )}
    </div>
  );
}

function EventFormModal({ open, onClose, onSaved, canCreate }) {
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
      setError(err?.response?.data?.message || "Failed to create event");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-base-300 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-base-300 px-6 py-5">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Create Event</h2>
            <p className="mt-1 text-sm text-gray-500">
              Keep operational details and payment setup together so the booking is ready from the
              start.
            </p>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            Close
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
              <h3 className="text-lg font-semibold text-gray-900">Event Details</h3>
              <p className="mt-1 text-sm text-gray-500">
                Core scheduling and client information for the event booking.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700">Event Name</label>
                <input
                  type="text"
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-[#2f788a] focus:outline-none focus:ring-2 focus:ring-[#2f788a]/20"
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  disabled={saving || !canCreate}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Type</label>
                <input
                  type="text"
                  list="event-type-suggestions"
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-[#2f788a] focus:outline-none focus:ring-2 focus:ring-[#2f788a]/20"
                  value={form.type}
                  onChange={(event) => updateField("type", event.target.value)}
                  disabled={saving || !canCreate}
                />
                <datalist id="event-type-suggestions">
                  <option value="birthday" />
                  <option value="event" />
                </datalist>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Location</label>
                <input
                  type="text"
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-[#2f788a] focus:outline-none focus:ring-2 focus:ring-[#2f788a]/20"
                  value={form.location}
                  onChange={(event) => updateField("location", event.target.value)}
                  disabled={saving || !canCreate}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Client</label>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-xl border border-[#2f788a] px-4 py-3 text-sm font-medium text-[#2f788a] transition hover:bg-[#2f788a]/5"
                    onClick={() => setShowClientPicker(true)}
                    disabled={saving || !canCreate}
                  >
                    Select
                  </button>
                  <input
                    type="text"
                    readOnly
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700"
                    value={form.client_name}
                    placeholder="Choose a client"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Event Date</label>
                <input
                  type="date"
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-[#2f788a] focus:outline-none focus:ring-2 focus:ring-[#2f788a]/20"
                  value={form.event_date}
                  onChange={(event) => updateField("event_date", event.target.value)}
                  disabled={saving || !canCreate}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Event Time</label>
                <input
                  type="time"
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-[#2f788a] focus:outline-none focus:ring-2 focus:ring-[#2f788a]/20"
                  value={form.event_time}
                  onChange={(event) => updateField("event_time", event.target.value)}
                  disabled={saving || !canCreate}
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Details</label>
                <textarea
                  rows={4}
                  className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-[#2f788a] focus:outline-none focus:ring-2 focus:ring-[#2f788a]/20"
                  value={form.details}
                  onChange={(event) => updateField("details", event.target.value)}
                  disabled={saving || !canCreate}
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Notes</label>
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
              <h3 className="text-lg font-semibold text-gray-900">Financial Details</h3>
              <p className="mt-1 text-sm text-gray-500">
                Define the event total and optionally record the initial payment now.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Total Amount</label>
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
                <label className="text-sm font-medium text-gray-700">Initial Payment Amount</label>
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
                <label className="text-sm font-medium text-gray-700">Initial Payment Date</label>
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
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving || !canCreate}>
              {saving ? "Saving..." : "Save Event"}
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
      setError(err?.response?.data?.message || "Failed to add payment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-xl rounded-3xl border border-base-300 bg-white shadow-2xl">
        <div className="border-b border-base-300 px-6 py-5">
          <h2 className="text-xl font-semibold text-gray-900">Add Payment</h2>
          <p className="mt-1 text-sm text-gray-500">
            Record another payment for {eventSummary.name}. A matching credit/local invoice will be
            created automatically.
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
              <div className="text-xs uppercase tracking-wide text-gray-500">Total</div>
              <div className="mt-2 text-lg font-semibold text-gray-900">
                {formatCurrency(eventSummary.total_amount)}
              </div>
            </div>
            <div className="rounded-2xl border border-base-300 bg-base-100 px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-gray-500">Paid</div>
              <div className="mt-2 text-lg font-semibold text-emerald-600">
                {formatCurrency(eventSummary.total_paid)}
              </div>
            </div>
            <div className="rounded-2xl border border-base-300 bg-base-100 px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-gray-500">Remaining</div>
              <div className="mt-2 text-lg font-semibold text-amber-600">
                {formatCurrency(eventSummary.remaining_balance)}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700">Amount</label>
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
              <label className="text-sm font-medium text-gray-700">Payment Date</label>
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
            <label className="text-sm font-medium text-gray-700">Notes</label>
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
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving || !canSave}>
              {saving ? "Saving..." : "Add Payment"}
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
      setError(err?.response?.data?.message || "Failed to load event details");
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
            <h2 className="text-2xl font-semibold text-gray-900">Event Details</h2>
            <p className="mt-1 text-sm text-gray-500">
              Review the operational setup, payment history, and remaining balance in one place.
            </p>
          </div>
          <div className="flex gap-2">
            {event && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => onPrintDetails?.(event)}
              >
                Print Details
              </button>
            )}
            {event && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setShowPaymentModal(true)}
                disabled={!canAddPayment}
              >
                Add Payment
              </button>
            )}
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
              Close
            </button>
          </div>
        </div>

        <div className="max-h-[calc(92vh-96px)] overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex items-center gap-3 rounded-2xl border border-base-300 bg-base-100 px-4 py-4 text-sm text-gray-600">
              <span className="loading loading-spinner loading-md text-[#2f788a]"></span>
              Loading event details...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : event ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <SummaryCard label="Total Amount" value={formatCurrency(event.total_amount)} />
                <SummaryCard
                  label="Total Paid"
                  value={formatCurrency(event.total_paid)}
                  accentClass="text-emerald-600"
                />
                <SummaryCard
                  label="Remaining Balance"
                  value={formatCurrency(event.remaining_balance)}
                  accentClass="text-amber-600"
                />
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
                <section className="rounded-3xl border border-base-300 bg-base-100 p-5">
                  <h3 className="text-lg font-semibold text-gray-900">Operational Details</h3>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-500">Name</div>
                      <div className="mt-1 text-sm font-medium text-gray-900">{event.name}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-500">Type</div>
                      <div className="mt-1 text-sm font-medium text-gray-900">{event.type}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-500">Location</div>
                      <div className="mt-1 text-sm font-medium text-gray-900">
                        {event.location || "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-500">Client</div>
                      <div className="mt-1 text-sm font-medium text-gray-900">
                        {event.client_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {event.client_phone || "No phone"}{" "}
                        {event.client_detail_value ? `• ${event.client_detail_value}` : ""}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-500">Event Date</div>
                      <div className="mt-1 text-sm font-medium text-gray-900">
                        {formatDate(event.event_date)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-500">Event Time</div>
                      <div className="mt-1 text-sm font-medium text-gray-900">
                        {formatTime(event.event_time)}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-xs uppercase tracking-wide text-gray-500">Details</div>
                      <div className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                        {event.details || "—"}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-xs uppercase tracking-wide text-gray-500">Notes</div>
                      <div className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                        {event.notes || "—"}
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-3xl border border-base-300 bg-base-100 p-5">
                  <h3 className="text-lg font-semibold text-gray-900">Financial Snapshot</h3>
                  <div className="mt-4 space-y-4">
                    <div className="rounded-2xl border border-base-300 bg-white px-4 py-3">
                      <div className="text-xs uppercase tracking-wide text-gray-500">Created</div>
                      <div className="mt-1 text-sm font-medium text-gray-900">
                        {formatDate(event.created_at)}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-base-300 bg-white px-4 py-3">
                      <div className="text-xs uppercase tracking-wide text-gray-500">
                        Payment Count
                      </div>
                      <div className="mt-1 text-sm font-medium text-gray-900">
                        {event.payments.length}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-base-300 bg-white px-4 py-3">
                      <div className="text-xs uppercase tracking-wide text-gray-500">
                        Invoice Pattern
                      </div>
                      <div className="mt-1 text-sm font-medium text-gray-900">Credit / Local</div>
                    </div>
                  </div>
                </section>
              </div>

              <section className="rounded-3xl border border-base-300 bg-base-100 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Each payment is linked to a real invoice generated through the invoice flow.
                    </p>
                  </div>
                </div>

                <div className="mt-4 overflow-hidden rounded-2xl border border-base-300 bg-white">
                  <div className="overflow-x-auto">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Type</th>
                          <th>Amount</th>
                          <th>Invoice</th>
                          <th>Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {event.payments.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-sm text-gray-500">
                              No payments recorded yet.
                            </td>
                          </tr>
                        ) : (
                          event.payments.map((payment) => (
                            <tr key={payment.id}>
                              <td>{formatDate(payment.payment_date)}</td>
                              <td className="capitalize">{payment.payment_type}</td>
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
                                      Invoice ID #{payment.invoice_id}
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
  return (
    <div className="flex h-full w-full items-center justify-center bg-base-200 p-6">
      <div className="rounded-2xl border border-base-300 bg-white px-8 py-10 text-center shadow-xl">
        <h2 className="text-xl font-bold text-gray-900">Events Access Required</h2>
        <p className="mt-2 text-sm text-gray-600">
          Your account does not have permission to open the Events module.
        </p>
      </div>
    </div>
  );
}

export default function EventsScreen() {
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
      setError(err?.response?.data?.message || "Failed to load events");
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
    documentTitle: printEvent?.name ? `${printEvent.name} Event Details` : "Event Details",
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
      setPopupMessage(err?.response?.data?.message || "Failed to prepare event print view.");
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
            <h1 className="text-3xl font-semibold text-gray-900">Events</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500">
              Manage birthdays and special events, track installment payments, and generate the
              required invoice for every payment recorded.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn btn-outline" onClick={loadEvents} disabled={loading}>
              Refresh
            </button>
            {canCreate && (
              <button type="button" className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                Create Event
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard label="Events Count" value={String(events.length)} />
          <SummaryCard
            label="Total Event Value"
            value={formatCurrency(totalEventValue)}
            accentClass="text-[#1f5f6e]"
          />
          <SummaryCard
            label="Remaining Across Events"
            value={formatCurrency(totalRemainingValue)}
            accentClass="text-amber-600"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-base-300 bg-white px-5 py-4 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-gray-500">Total Paid</div>
            <div className="mt-2 text-2xl font-semibold text-emerald-600">
              {formatCurrency(totalPaidValue)}
            </div>
          </div>
          <div className="rounded-2xl border border-base-300 bg-white px-5 py-4 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-gray-500">Open Balance</div>
            <div className="mt-2 text-2xl font-semibold text-amber-600">
              {formatCurrency(totalRemainingValue)}
            </div>
          </div>
          <div className="rounded-2xl border border-base-300 bg-white px-5 py-4 shadow-sm xl:col-span-2">
            <div className="text-xs uppercase tracking-wide text-gray-500">Financial Rule</div>
            <div className="mt-2 text-sm font-medium text-gray-900">
              Every event payment creates a credit / local invoice using the system item
              &quot;Payment for Event&quot;.
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
            Loading events...
          </div>
        ) : events.length === 0 ? (
          <EventsEmptyState canCreate={canCreate} onCreate={() => setShowCreateModal(true)} />
        ) : (
          <div className="overflow-hidden rounded-3xl border border-base-300 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Type</th>
                    <th>Client</th>
                    <th>Date</th>
                    <th>Location</th>
                    <th>Total</th>
                    <th>Paid</th>
                    <th>Remaining</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id}>
                      <td>
                        <div className="font-semibold text-gray-900">{event.name}</div>
                        <div className="text-xs text-gray-500">{formatTime(event.event_time)}</div>
                      </td>
                      <td className="capitalize">{event.type}</td>
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
                            Print Details
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => {
                              setSelectedEventId(event.id);
                              setShowDetailsModal(true);
                            }}
                          >
                            Open
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
          setPopupMessage("Event created successfully.");
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
          setPopupMessage("Event payment saved and invoice created successfully.");
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
