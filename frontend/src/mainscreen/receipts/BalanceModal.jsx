import { useEffect, useState } from "react";
import api from "../../utils/axiosInstance";
import ClientList from "../invoices/clientlist";
import { useTranslation } from "react-i18next";
export default function BalanceModal({
  isOpen,
  mode = "create", // "create" | "edit"
  dueBalanceId,
  onClose,
  onSuccess
}) {
  const [loading, setLoading] = useState(false);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const {t} = useTranslation();

  const [form, setForm] = useState({
    id: "",
    date: "",
    amount: "",
    reason: "",
    notes: "",
    client: null
  });

  // =========================
  // Fetch balance in edit mode
  // =========================
  useEffect(() => {
    if (mode === "edit" && dueBalanceId) {
      fetchDueBalance();
    }
  }, [mode, dueBalanceId]);

  const fetchDueBalance = async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `/api/invoices/due-balances/${dueBalanceId}`
      );

setForm({
  id: res.data.id,
  date: res.data.date ? res.data.date.slice(0, 10) : "",
  amount: res.data.amount,
  reason: res.data.reason,
  notes: res.data.notes || "",
  client: {
    id: res.data.client_id,
    name: res.data.client_name
  }
});


    } catch (err) {
      console.error("Error loading due balance:", err);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // Submit
  // =========================
  const handleSubmit = async () => {
    if (!form.reason || !form.amount || !form.client) return;

    setLoading(true);
    try {
      if (mode === "create") {
        await api.post("/api/invoices/due-balances", {
          reason: form.reason,
          date: form.date,
          amount: form.amount,
          client_id: form.client.id,
          notes: form.notes
        });
      } else {
        await api.put(
          `/api/invoices/due-balances/${form.id}`,
          {
            reason: form.reason,
            date: form.date,
            amount: form.amount,
            notes: form.notes
          }
        );
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Error saving due balance:", err);
    } finally {
      setLoading(false);
    }
  };

  // =========================
// Permissions (Receipts module)
// =========================
let permissions = {};
try {
  const raw = localStorage.getItem("permissions");
  permissions = raw ? JSON.parse(raw) : {};
} catch {
  permissions = {};
}

const canAdd = permissions?.receipts?.add === true;
const canEdit = permissions?.receipts?.edit === true;

// If user is on create mode => needs canAdd to write
// If user is on edit mode   => needs canEdit to write
const canWriteThisMode = mode === "create" ? canAdd : canEdit;

// Read-only if they can’t write in the current mode
const isReadOnly = !canWriteThisMode;

// Show submit only if they can write in the current mode
const showSubmit = canWriteThisMode;


  if (!isOpen) return null;

return (
  <>
    {isOpen && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div 
          className="bg-white w-full max-w-[560px] rounded-2xl shadow-2xl border border-gray-200/60 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-5 border-b border-gray-200/60">
            <h2 className="text-xl font-semibold text-gray-900 tracking-tight">
              {mode === "create" ? t("BalanceModal.title.create") : t("BalanceModal.title.edit")}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {mode === "create"
                ? t("BalanceModal.subtitle.create")
                : t("BalanceModal.subtitle.edit")}
            </p>
          </div>

          {/* Form Content */}
          <div className="px-6 py-5 space-y-5 max-h-[calc(100vh-280px)] overflow-y-auto">
            {/* ID - Edit Mode Only */}
            {mode === "edit" && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  {t("BalanceModal.fields.id")}
                </label>
                <input
                  value={form.id}
                  readOnly
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-600 cursor-not-allowed focus:outline-none"
                />
              </div>
            )}

            {/* Client */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                {t("BalanceModal.fields.client")} <span className="text-red-500">*</span>
              </label>
              <button
                disabled={mode === "edit" || loading || isReadOnly}
                onClick={() => setClientModalOpen(true)}
                className={`w-full px-4 py-2.5 border rounded-lg text-start text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  mode === "edit" || loading
                    ? "bg-gray-50 border-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:border-blue-500"
                }`}
              >
                {form.client ? form.client.name : t("BalanceModal.client.select")}
              </button>
              {!form.client && (
                <p className="text-xs text-gray-500 mt-1.5">
                  {mode === "edit" 
                    ? t("BalanceModal.client.hint_edit")
                    : t("BalanceModal.client.hint_create")}
                </p>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                {t("BalanceModal.fields.date")}
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                disabled={loading || isReadOnly}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                {t("BalanceModal.fields.amount")} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  disabled={loading || isReadOnly}
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                 {t("BalanceModal.fields.reason")} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                disabled={loading || isReadOnly}
                placeholder= {t("BalanceModal.placeholders.reason")}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                {t("BalanceModal.fields.notes")}
              </label>
              <textarea
                rows={4}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                disabled={loading || isReadOnly}
                placeholder= {t("BalanceModal.placeholders.notes")}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm resize-none transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-200/60 flex justify-between items-center gap-3">
            <p className="text-xs text-gray-500">
              <span className="text-red-500">*</span> {t("BalanceModal.footer.required")}
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-white hover:border-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("BalanceModal.buttons.cancel")}
              </button>
{showSubmit && (
  <button
    disabled={loading || !form.reason || !form.amount || !form.client}
    onClick={handleSubmit}
    className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors duration-200 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 disabled:shadow-none flex items-center gap-2"
  >
                {loading && (
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {loading 
                  ? t("BalanceModal.buttons.saving")
                  : mode === "create" 
                    ? t("BalanceModal.buttons.add")
                    : t("BalanceModal.buttons.save")}
              </button>
)}
            </div>
          </div>
        </div>
      </div>
    )}

    {clientModalOpen && (
      <ClientList
        onSelect={(c) => {
          setForm({ ...form, client: c });
          setClientModalOpen(false);
        }}
        onClose={() => setClientModalOpen(false)}
      />
    )}
  </>
);
}
