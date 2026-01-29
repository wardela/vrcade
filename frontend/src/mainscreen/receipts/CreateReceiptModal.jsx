import { useState } from "react";
import api from "../../utils/axiosInstance";
import ClientList from "../invoices/clientlist";
import { useTranslation } from "react-i18next";
export default function CreateReceiptModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [client, setClient] = useState(null);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const {t} = useTranslation();

  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    amount: "",
    type: "cash",
    reason: "",
    notes: ""
  });

  const [cheques, setCheques] = useState([
    { cheque_number: "", cheque_amount: "", due_date: "", beneficiary_bank: "" }
  ]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.post("/api/invoices/receipts/standalone", {
        client_id: client.id,
        date: form.date,
        amount: Number(form.amount),
        type: form.type,
        reason: form.reason,
        notes: form.notes,
        cheques: form.type === "cheque" ? cheques : []
      });

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Error creating receipt:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

return (
  <>
    {isOpen && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div 
          className="bg-white w-full max-w-[720px] rounded-2xl shadow-2xl border border-gray-200/60 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-5 border-b border-gray-200/60">
            <h2 className="text-xl font-semibold text-gray-900 tracking-tight">
              {t("CreateReceiptModal.title")}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {t("CreateReceiptModal.subtitle")}
            </p>
          </div>

          {/* Form Content */}
          <div className="px-6 py-5 space-y-5 max-h-[calc(100vh-280px)] overflow-y-auto">
            {/* Client Selection */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                {t("CreateReceiptModal.fields.client")} <span className="text-red-500">*</span>
              </label>
              <button
                onClick={() => setClientModalOpen(true)}
                disabled={loading}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-start text-sm font-medium bg-white hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
              >
                {client ? client.name : "Select Client"}
              </button>
              {!client && (
                <p className="text-xs text-gray-500 mt-1.5">
                  {t("CreateReceiptModal.hints.client")}
                </p>
              )}
            </div>

            {/* Date & Amount Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Date */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  {t("CreateReceiptModal.fields.date")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  disabled={loading}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  {t("CreateReceiptModal.fields.amount")} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    disabled={loading}
                    className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Payment Type */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                {t("CreateReceiptModal.fields.payment_type")} <span className="text-red-500">*</span>
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                disabled={loading}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
              >
                <option value="cash">{t("CreateReceiptModal.payment_types.cash")}</option>
                <option value="bank_transfer">{t("CreateReceiptModal.payment_types.bank_transfer")}</option>
                <option value="cheque">{t("CreateReceiptModal.payment_types.cheque")}</option>
              </select>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                {t("CreateReceiptModal.fields.reason")}
              </label>
              <input
                type="text"
                placeholder={t("CreateReceiptModal.placeholders.reason")}
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                disabled={loading}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                {t("CreateReceiptModal.fields.notes")}
              </label>
              <textarea
                rows={3}
                placeholder={t("CreateReceiptModal.placeholders.notes")}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                disabled={loading}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm resize-none transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Cheques Section */}
            {form.type === "cheque" && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-medium text-gray-700">
                      {t("CreateReceiptModal.cheques.section_title")} <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      {t("CreateReceiptModal.cheques.section_hint")}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setCheques([
                        ...cheques,
                        { cheque_number: "", cheque_amount: "", due_date: "", beneficiary_bank: "" }
                      ])
                    }
                    disabled={loading}
                    className="px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-lg hover:bg-blue-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    + {t("CreateReceiptModal.cheques.add")}
                  </button>
                </div>

                <div className="space-y-3">
                  {cheques.map((ch, i) => (
                    <div
                      key={i}
                      className="bg-gray-50/80 border border-gray-200 rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-700">
                          {t("CreateReceiptModal.cheques.index")} {i + 1}
                        </span>
                        {cheques.length > 1 && (
                          <button
                            onClick={() => {
                              const updated = cheques.filter((_, idx) => idx !== i);
                              setCheques(updated);
                            }}
                            disabled={loading}
                            className="text-xs font-medium text-red-600 hover:text-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {t("CreateReceiptModal.cheques.remove")}
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {/* Cheque Number */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1.5">
                            {t("CreateReceiptModal.cheques.fields.number")}
                          </label>
                          <input
                            type="text"
                            placeholder="CHQ-123456"
                            value={ch.cheque_number}
                            onChange={(e) => {
                              const updated = [...cheques];
                              updated[i].cheque_number = e.target.value;
                              setCheques(updated);
                            }}
                            disabled={loading}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                          />
                        </div>

                        {/* Cheque Amount */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1.5">
                            {t("CreateReceiptModal.cheques.fields.amount")}
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
                              $
                            </span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={ch.cheque_amount}
                              onChange={(e) => {
                                const updated = [...cheques];
                                updated[i].cheque_amount = e.target.value;
                                setCheques(updated);
                              }}
                              disabled={loading}
                              className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                            />
                          </div>
                        </div>

                        {/* Due Date */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1.5">
                            {t("CreateReceiptModal.cheques.fields.due_date")}
                          </label>
                          <input
                            type="date"
                            value={ch.due_date}
                            onChange={(e) => {
                              const updated = [...cheques];
                              updated[i].due_date = e.target.value;
                              setCheques(updated);
                            }}
                            disabled={loading}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                          />
                        </div>

                        {/* Beneficiary Bank */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1.5">
                            {t("CreateReceiptModal.cheques.fields.bank")}
                          </label>
                          <input
                            type="text"
                            placeholder={t("CreateReceiptModal.cheques.placeholders.bank")}
                            value={ch.beneficiary_bank}
                            onChange={(e) => {
                              const updated = [...cheques];
                              updated[i].beneficiary_bank = e.target.value;
                              setCheques(updated);
                            }}
                            disabled={loading}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Cheque Total Validation */}
                {(() => {
                  const chequeTotal = cheques.reduce((sum, ch) => sum + (parseFloat(ch.cheque_amount) || 0), 0);
                  const receiptAmount = parseFloat(form.amount) || 0;
                  const isValid = Math.abs(chequeTotal - receiptAmount) < 0.01; // Account for floating point precision
                  
                  return (
                    <div className={`flex items-center justify-between p-3 rounded-lg border ${
                      isValid 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-amber-50 border-amber-200'
                    }`}>
                      <div className="flex items-center gap-2">
                        {isValid ? (
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        )}
                        <div>
                          <p className={`text-sm font-medium ${
                            isValid ? 'text-green-700' : 'text-amber-700'
                          }`}>
                            {t("CreateReceiptModal.cheques.validation.total")} {chequeTotal.toFixed(2)}
                          </p>
                          <p className={`text-xs ${
                            isValid ? 'text-green-600' : 'text-amber-600'
                          }`}>
                            {isValid 
                              ? t("CreateReceiptModal.cheques.validation.match")
                            : `${t("CreateReceiptModal.cheques.validation.mismatch")} (${receiptAmount.toFixed(2)})`
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-200/60 flex justify-between items-center gap-3">
            <p className="text-xs text-gray-500">
              <span className="text-red-500">*</span> {t("CreateReceiptModal.footer.required")}
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-white hover:border-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("CreateReceiptModal.buttons.cancel")}
              </button>
              <button
                disabled={(() => {
                  // Basic validation
                  if (loading || !client || !form.amount || !form.date) return true;
                  
                  // Cheque validation
                  if (form.type === "cheque") {
                    const chequeTotal = cheques.reduce((sum, ch) => sum + (parseFloat(ch.cheque_amount) || 0), 0);
                    const receiptAmount = parseFloat(form.amount) || 0;
                    return Math.abs(chequeTotal - receiptAmount) >= 0.01;
                  }
                  
                  return false;
                })()}
                onClick={handleSave}
                className="px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 active:bg-gray-950 transition-colors duration-200 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-gray-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-900 disabled:shadow-none flex items-center gap-2"
              >
                {loading && (
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {loading ? t("CreateReceiptModal.buttons.creating") : t("CreateReceiptModal.buttons.create") }
              </button>
            </div>
          </div>
        </div>

        {clientModalOpen && (
          <ClientList
            onSelect={(c) => {
              setClient(c);
              setClientModalOpen(false);
            }}
            onClose={() => setClientModalOpen(false)}
          />
        )}
      </div>
    )}
  </>
);
}
