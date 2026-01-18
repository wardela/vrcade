import { useEffect, useRef, useState } from "react";
import api from "../../utils/axiosInstance";
import { useTranslation } from "react-i18next";
export default function CreateClientModal({ isOpen, onClose, onCreated }) {
  const modalRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    phone_suffix: "", // user input only (after 07)
    detail_type: "NIN", // default National ID
    detail_value: "",
    email: "",
    location: "",
    notes: ""
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const {t} = useTranslation();
  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setForm({
        name: "",
        phone_suffix: "",
        detail_type: "NIN",
        detail_value: "",
        email: "",
        location: "",
        notes: ""
      });
      setErrors({});
      setSaving(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Numeric only for phone suffix
    if (name === "phone_suffix" && !/^[0-9]*$/.test(value)) return;

    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const errs = {};

    if (!form.name.trim()) {
      errs.name = t("CreateClientModal.errors.name_required");
    }

    if (form.detail_type === "TN" && !form.detail_value.trim()) {
      errs.detail_value = t("CreateClientModal.errors.tax_required");
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

const handleSubmit = async () => {
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
    const res = await api.post("/api/invoices/clients", payload);

    if (onCreated) onCreated(res.data);
    onClose();
  } catch (err) {
    setErrors({
      submit:
        err.response?.data?.message ||
        t("CreateClientModal.errors.submit_failed")
    });
  } finally {
    setSaving(false);
  }
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
            {t("CreateClientModal.title")}
          </h2>
          <p className="text-sm text-gray-500">
            {t("CreateClientModal.subtitle")}
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
              {t("CreateClientModal.sections.required")}
            </h3>

            {/* Name */}
            <div>
              <label className="text-sm text-gray-600">
                {t("CreateClientModal.fields.name")} <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className={`w-full mt-1 px-4 py-2.5 rounded-lg border ${
                  errors.name ? "border-red-400 ring-2 ring-red-200" : "border-gray-300"
                } focus:outline-none focus:ring-2 focus:ring-[#2f788a]`}
              />
              {errors.name && (
                <p className="text-xs text-red-600 mt-1">{errors.name}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="text-sm text-gray-600">
                {t("CreateClientModal.fields.phone")}
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
                {t("CreateClientModal.fields.phone_hint")}
              </p>
            </div>

            {/* Detail Type & Value */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">
                  {t("CreateClientModal.fields.detail_type")}
                </label>
                <select
                  name="detail_type"
                  value={form.detail_type}
                  onChange={handleChange}
                  className="w-full mt-1 px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2f788a]"
                >
                  <option value="NIN">{t("CreateClientModal.detail_types.nin")}</option>
                  <option value="TN">{t("CreateClientModal.detail_types.tn")}</option>
                  <option value="PN">{t("CreateClientModal.detail_types.pn")}</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-600">
                  {t("CreateClientModal.fields.detail_value")}
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
                  {t("CreateClientModal.hints.detail_value_required")}
                </p>
              </div>
            </div>
          </div>

          {/* Optional */}
          <div className="pt-4 border-t space-y-4">
            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              {t("CreateClientModal.sections.optional")}
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <input
                name="email"
                placeholder={t("CreateClientModal.fields.email")}
                value={form.email}
                onChange={handleChange}
                className="px-4 py-2.5 rounded-lg border border-gray-300"
              />
              <input
                name="location"
                placeholder={t("CreateClientModal.fields.location")}
                value={form.location}
                onChange={handleChange}
                className="px-4 py-2.5 rounded-lg border border-gray-300"
              />
            </div>

            <textarea
              name="notes"
              placeholder={t("CreateClientModal.fields.notes")}
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
            {t("CreateClientModal.actions.cancel")}
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-2 rounded-lg bg-[#2f788a] text-white font-medium hover:bg-[#276472] disabled:opacity-60"
          >
            {saving ? t("CreateClientModal.actions.saving") : t("CreateClientModal.actions.create")}
          </button>
        </div>
      </div>
    </div>
  );
}
