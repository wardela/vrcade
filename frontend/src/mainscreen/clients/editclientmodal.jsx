import { useEffect, useRef, useState } from "react";
import api from "../../utils/axiosInstance";
import { useTranslation } from "react-i18next";

export default function EditClientModal({ client, onClose, onUpdated }) {
  const modalRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    phone_suffix: "",
    detail_type: "NIN",
    detail_value: "",
    email: "",
    location: "",
    notes: ""
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const {t} = useTranslation();
  // Prefill
  useEffect(() => {
    if (client) {
      const phone = client.phone || "07";
      setForm({
        name: client.name || "",
        phone_suffix: phone.startsWith("07") ? phone.slice(2) : "",
        detail_type: client.detail_type || "NIN",
        detail_value: client.detail_value || "",
        email: client.email || "",
        location: client.location || "",
        notes: client.notes || ""
      });
      setErrors({});
      setSaving(false);
    }
  }, [client]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  if (!client) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "phone_suffix" && !/^[0-9]*$/.test(value)) return;

    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const errs = {};

    if (!form.name.trim()) {
      errs.name = "Client name is required";
    }

    if (form.detail_type === "TN" && !form.detail_value.trim()) {
      errs.detail_value =
        "Tax Number is required when detail type is Tax Number";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);

    const payload = {
      name: form.name.trim(),
      phone: `07${form.phone_suffix || ""}`,
      detail_type: form.detail_type,
      detail_value: form.detail_value || null,
      email: form.email || null,
      location: form.location || null,
      notes: form.notes || null
    };

  try {
    const res = await api.put(
      `/api/invoices/clients/${client.id}`,
      payload
    );
      if (onUpdated) onUpdated(res.data);
      onClose();
    } catch {
      setErrors({ submit: "Failed to update client. Please try again." });
    }

    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-200"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b bg-gray-50 rounded-t-2xl">
          <h2 className="text-lg font-semibold text-gray-800">
            {t("EditClientModal.title")}
          </h2>
          <p className="text-sm text-gray-500">
            {t("EditClientModal.subtitle")}
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-6">
          {errors.submit && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
              {errors.submit}
            </div>
          )}

          {/* Required */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              {t("EditClientModal.sections.required")}
            </h3>

            {/* Name */}
            <div>
              <label className="text-sm text-gray-600">
                {t("EditClientModal.fields.name")} <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className={`w-full mt-1 px-4 py-2.5 rounded-lg border ${
                  errors.name
                    ? "border-red-400 ring-2 ring-red-200"
                    : "border-gray-300"
                } focus:outline-none focus:ring-2 focus:ring-[#2f788a]`}
              />
              {errors.name && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.name}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="text-sm text-gray-600">
                {t("EditClientModal.fields.phone")}
              </label>

              <div className="mt-1 flex" dir="ltr">
                <div className="px-4 py-2.5 rounded-l-lg border border-gray-300 bg-gray-100 text-gray-600 text-sm flex items-center">
                  07
                </div>
                <input
                  name="phone_suffix"
                  value={form.phone_suffix}
                  onChange={handleChange}
                  className="flex-1 px-4 py-2.5 rounded-r-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2f788a]"
                  placeholder="XXXXXXXX"
                />
              </div>

              <p className="text-xs text-gray-400 mt-1">
                {t("EditClientModal.fields.phone_hint")}
              </p>
            </div>

            {/* Detail Type & Value */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">
                  {t("EditClientModal.fields.detail_type")}
                </label>
                <select
                  name="detail_type"
                  value={form.detail_type}
                  onChange={handleChange}
                  className="w-full mt-1 px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2f788a]"
                >
                  <option value="NIN">{t("EditClientModal.detail_types.nin")}</option>
                  <option value="TN">{t("EditClientModal.detail_types.tn")}</option>
                  <option value="PN">{t("EditClientModal.detail_types.pn")}</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-600">
                  {t("EditClientModal.fields.detail_value")}
                  {form.detail_type === "TN" && (
                    <span className="text-red-500"> *</span>
                  )}
                </label>
                <input
                  name="detail_value"
                  value={form.detail_value}
                  onChange={handleChange}
                  className={`w-full mt-1 px-4 py-2.5 rounded-lg border ${
                    errors.detail_value
                      ? "border-red-400 ring-2 ring-red-200"
                      : "border-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-[#2f788a]`}
                />
                {errors.detail_value && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.detail_value}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {t("EditClientModal.hints.detail_value_required")}
                </p>
              </div>
            </div>
          </div>

          {/* Optional */}
          <div className="pt-4 border-t space-y-4">
            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              {t("EditClientModal.sections.optional")}
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <input
                name="email"
                placeholder={t("EditClientModal.placeholders.email")}
                value={form.email}
                onChange={handleChange}
                className="px-4 py-2.5 rounded-lg border border-gray-300"
              />
              <input
                name="location"
                placeholder={t("EditClientModal.placeholders.location")}
                value={form.location}
                onChange={handleChange}
                className="px-4 py-2.5 rounded-lg border border-gray-300"
              />
            </div>

            <textarea
              name="notes"
              placeholder={t("EditClientModal.placeholders.notes")}
              value={form.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            {t("EditClientModal.actions.cancel")}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 rounded-lg bg-[#2f788a] text-white font-medium hover:bg-[#276472] disabled:opacity-60"
          >
            {saving ? t("EditClientModal.actions.saving") : t("EditClientModal.actions.save")}
          </button>
        </div>
      </div>
    </div>
  );
}