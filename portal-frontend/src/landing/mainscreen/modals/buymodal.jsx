import { useState } from "react";
import { useTranslation } from "react-i18next";
export default function BuyModal({ isOpen, onClose, plan }) {
  const [step, setStep] = useState(1);
  const duration = "12";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const {t} = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    clinicName: "",
    location: "",
    country: "",
    city: "",
    area: "",
    email: "",
    phone: "",
    notes: "",
  });

  const resetForm = () => {
  setFormData({
    name: "",
    email: "",
    phone: "",
    clinicName: "",
    country: "",
    city: "",
    area: "",
    location: "",
    notes: "",
  });

  // optional: reset duration if you want
  // setDuration("12");
};
  if (!isOpen) return null;

  const totalSteps = 3;

const GOOGLE_FORM_ACTION_URL =
  "https://docs.google.com/forms/u/0/d/e/1FAIpQLSdY2n4QYpidEjrFxvDPhjm4_YEdM1PBT5Pr_5UVOoTlMj-wZA/formResponse";

const ENTRY_MAP = {
  plan: "entry.633757642",
  appType: "entry.2035024705",
  name: "entry.1068187859",
  email: "entry.862748035",
  phone: "entry.1604942028",
  clinicName: "entry.1272833663",
  country: "entry.22908",
  city: "entry.1002998908",
  area: "entry.1901810364",
  location: "entry.1349999371",
  notes: "entry.451878495",

  // Duration (months)
  duration: "entry.1863097549",
};

  const requiredFieldsByStep = {
    1: ["name", "email", "phone"],
    2: ["clinicName", "country", "city", "area", "location"],
    3: [],
  };

  const errorKeyMap = {
    name: "name",
    email: "email",
    phone: "phone",
    clinicName: "business_name",
    country: "country",
    city: "city",
    area: "area",
    location: "location",
    notes: "notes",
  };

  const validateFields = (fields) => {
    const newErrors = {};
    fields.forEach((field) => {
      const value = formData[field];
      if (!value || !String(value).trim()) {
        newErrors[field] = t(`buyModal.errors.${errorKeyMap[field]}`);
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...newErrors }));
      return false;
    }
    return true;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name] && String(value).trim()) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleNext = () => {
    const requiredFields = requiredFieldsByStep[step] || [];
    if (!validateFields(requiredFields)) return;
    if (step < totalSteps) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  const allRequiredFields = [
    ...(requiredFieldsByStep[1] || []),
    ...(requiredFieldsByStep[2] || []),
    ...(requiredFieldsByStep[3] || []),
  ];
  if (!validateFields(allRequiredFields)) return;
  if (isSubmitting) return;

  setIsSubmitting(true);
  setSubmitSuccess(false);

  const payload = {
    plan,
    duration,
    appType: "fawtartak",

    name: formData.name,
    email: formData.email,
    phone: formData.phone,
    clinicName: formData.clinicName,
    country: formData.country,
    city: formData.city,
    area: formData.area,
    location: formData.location,
    notes: formData.notes,
  };

  const body = new URLSearchParams();

  Object.entries(payload).forEach(([key, value]) => {
    if (!ENTRY_MAP[key]) return;
    body.append(ENTRY_MAP[key], value ?? "");
  });

  try {
    await fetch(GOOGLE_FORM_ACTION_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body,
    });

    // Treat as success (Google Forms = opaque response)
    setSubmitSuccess(true);
    resetForm();

    // optional: auto close modal after 2 seconds
    setTimeout(() => {
      setSubmitSuccess(false);
      onClose();
    }, 2000);

  } catch (err) {
    console.error("Submission failed:", err);
  } finally {
    setIsSubmitting(false);
  }
};


  const currentPrice = 10;
  const originalPrice = 20;
  const totalPrice = (currentPrice * parseInt(duration, 10)).toFixed(2);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative w-full max-w-5xl h-[90vh] max-h-[800px] rounded-3xl bg-white dark:bg-dark-2 shadow-2xl overflow-hidden animate-slideUp flex flex-col">
        {/* Decorative header gradient */}
        <div className="absolute top-0 start-0 end-0 h-2 bg-gradient-to-r from-[#0884a9] via-[#2aa9c8] to-[#066f8f]"></div>

        {/* Header - Fixed */}
        <div className="relative px-6 lg:px-8 py-5 bg-gradient-to-br from-[#0884a9]/5 to-transparent border-b border-gray-100 dark:border-dark-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 end-6 w-10 h-10 rounded-full bg-gray-100 dark:bg-dark-3 hover:bg-red-100 dark:hover:bg-red-900/20 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-all duration-300 hover:rotate-90 flex items-center justify-center z-10"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="pr-12">
            <div className="inline-flex items-center gap-2 mb-2 px-3 py-1 bg-[#0884a9]/10 backdrop-blur-sm rounded-full border border-[#0884a9]/20">
              <div className="w-2 h-2 bg-[#0884a9] rounded-full animate-pulse"></div>
              <span className="text-xs font-semibold text-[#0884a9]">{t("buyModal.badge")}</span>
            </div>
            
            <h3 className="text-xl lg:text-2xl font-bold text-dark dark:text-white mb-1">
              {t("buyModal.title.before")}{" "}
              <span className="bg-gradient-to-r from-[#0884a9] to-[#066f8f] bg-clip-text text-transparent">
                {t("buyModal.title.highlight")}
              </span>
            </h3>
            {submitSuccess && (
              <div className="mb-4 rounded-lg bg-blue-50 border border-blue-200 p-4 text-blue-700 text-sm">
                {t("buyModal.success_message")}
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-dark dark:text-white">
                {t("buyModal.progress.step")} {step} {t("buyModal.progress.of")} {totalSteps}
              </span>
              <span className="text-xs text-body-color dark:text-dark-6">
                {Math.round((step / totalSteps) * 100)}% {t("buyModal.progress.complete")}
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-dark-3 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#0884a9] to-[#066f8f] transition-all duration-500 ease-out"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="px-6 lg:px-8 py-6 animate-slideIn">
            <form>
              {/* STEP 1: Personal Information */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-2xl font-bold text-dark dark:text-white mb-2">{t("buyModal.steps.personal.title")}</h4>
                    <p className="text-sm text-body-color dark:text-dark-6">{t("buyModal.steps.personal.subtitle")}</p>
                  </div>

                  <div className="grid gap-6">
                    <Input
                      label={t("buyModal.steps.personal.fields.full_name.label")}
                      name="name"
                      placeholder={t("buyModal.steps.personal.fields.full_name.placeholder")}
                      value={formData.name}
                      onChange={handleChange}
                      error={errors.name}
                      icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      }
                    />

                    <Input
                      label={t("buyModal.steps.personal.fields.email.label")}
                      name="email"
                      type="email"
                      placeholder={t("buyModal.steps.personal.fields.email.placeholder")}
                      value={formData.email}
                      onChange={handleChange}
                      error={errors.email}
                      icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      }
                    />

                    <Input
                      label={t("buyModal.steps.personal.fields.phone.label")}
                      name="phone"
                      type="tel"
                      placeholder={t("buyModal.steps.personal.fields.phone.placeholder")}
                      value={formData.phone}
                      onChange={handleChange}
                      error={errors.phone}
                      icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      }
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: Clinic Information */}
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-2xl font-bold text-dark dark:text-white mb-2">{t("buyModal.steps.clinic.title")}</h4>
                    <p className="text-sm text-body-color dark:text-dark-6">{t("buyModal.steps.clinic.subtitle")}</p>
                  </div>

                  <div className="grid gap-6">
                    <Input
                      label={t("buyModal.steps.clinic.fields.clinic_name.label")}
                      name="clinicName"
                      placeholder={t("buyModal.steps.clinic.fields.clinic_name.placeholder")}
                      value={formData.clinicName}
                      onChange={handleChange}
                      error={errors.clinicName}
                      icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      }
                    />

                    <div className="grid md:grid-cols-3 gap-4">
                      <Input
                        label={t("buyModal.steps.clinic.fields.country.label")}
                        name="country"
                        placeholder={t("buyModal.steps.clinic.fields.country.placeholder")}
                        value={formData.country}
                        onChange={handleChange}
                        error={errors.country}
                        icon={
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        }
                      />

                      <Input
                        label={t("buyModal.steps.clinic.fields.city.label")}
                        name="city"
                        placeholder={t("buyModal.steps.clinic.fields.city.placeholder")}
                        value={formData.city}
                        onChange={handleChange}
                        error={errors.city}
                        icon={
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        }
                      />

                      <Input
                        label={t("buyModal.steps.clinic.fields.area.label")}
                        name="area"
                        placeholder={t("buyModal.steps.clinic.fields.area.placeholder")}
                        value={formData.area}
                        onChange={handleChange}
                        error={errors.area}
                        icon={
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        }
                      />
                    </div>

                    <Input
                      label={t("buyModal.steps.clinic.fields.location.label")}
                      name="location"
                      placeholder={t("buyModal.steps.clinic.fields.location.placeholder")}
                      value={formData.location}
                      onChange={handleChange}
                      error={errors.location}
                      icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                      }
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: Review & Submit */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-2xl font-bold text-dark dark:text-white mb-2">{t("buyModal.steps.review.title")}</h4>
                    <p className="text-sm text-body-color dark:text-dark-6">{t("buyModal.steps.review.subtitle")}</p>
                  </div>

                  <Textarea
                    label={t("buyModal.steps.review.fields.notes.label")}
                    name="notes"
                    placeholder={t("buyModal.steps.review.fields.notes.placeholder")}
                    value={formData.notes}
                    onChange={handleChange}
                    error={errors.notes}
                  />

                  {/* Summary Review */}
                  <div className="mt-8 p-6 bg-gradient-to-br from-[#0884a9]/5 to-transparent rounded-2xl border-2 border-[#0884a9]/20">
                    <h5 className="font-bold text-dark dark:text-white mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-[#0884a9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {t("buyModal.steps.review.summary.title")}
                    </h5>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-body-color dark:text-dark-6">{t("buyModal.steps.review.summary.plan")}</span>
                        <span className="font-semibold text-dark dark:text-white">{plan}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-body-color dark:text-dark-6">{t("buyModal.steps.review.summary.duration")}</span>
                        <span className="font-semibold text-dark dark:text-white">{duration} {t("buyModal.steps.review.summary.months")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-body-color dark:text-dark-6">{t("buyModal.steps.review.summary.regular_price")}</span>
                        <span className="line-through text-gray-400" dir="ltr">{originalPrice || "0.00"} JOD/mo</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-body-color dark:text-dark-6">{t("buyModal.steps.review.summary.your_price")}</span>
                       <span className="font-bold text-[#0884a9]" dir="ltr">{currentPrice || "0.00"} JOD/mo</span>
                      </div>
                      <div className="pt-3 border-t border-gray-200 dark:border-dark-3 flex justify-between">
                        <span className="font-bold text-dark dark:text-white">{t("buyModal.steps.review.summary.total_price")}</span>
                       <span className="font-bold text-[#0884a9]" dir="ltr">{totalPrice || "0.00"} JOD</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Footer - Fixed Navigation */}
        <div className="border-t border-gray-100 dark:border-dark-3 p-6 lg:p-8 bg-white dark:bg-dark-2 flex-shrink-0">
          <div className="flex items-center justify-between gap-4">
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="group inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-gray-300 dark:border-dark-3 text-dark dark:text-white font-semibold hover:border-[#0884a9] hover:text-[#0884a9] transition-all duration-300"
              >
                <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">{t("buyModal.navigation.previous")}</span>
              </button>
            ) : (
              <div></div>
            )}

            {step < totalSteps ? (
              <button
                type="button"
                onClick={handleNext}
                className="group ms-auto inline-flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-[#0884a9] to-[#066f8f] text-white font-bold shadow-lg hover:shadow-xl hover:shadow-[#0884a9]/30 transition-all duration-300 hover:scale-105"
              >
                <span>{t("buyModal.navigation.continue")}</span>
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="group ms-auto inline-flex items-center gap-3 px-8 py-3 rounded-full bg-gradient-to-r from-[#0884a9] to-[#066f8f] text-white font-bold shadow-lg hover:shadow-xl hover:shadow-[#0884a9]/30 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>{isSubmitting ? t("buyModal.navigation.submitting") : t("buyModal.navigation.start_trial")}</span>
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            )}
          </div>

          {/* Trust indicators */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-body-color dark:text-dark-6">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{t("buyModal.trust_indicators.response")}</span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{t("buyModal.trust_indicators.setup")}</span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{t("buyModal.trust_indicators.commitment")}</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-slideUp { animation: slideUp 0.4s ease-out; }
        .animate-slideIn { animation: slideIn 0.4s ease-out; }

        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #0884a9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #066f8f; }
      `}</style>
    </div>
  );
}

/* ===== Input Component ===== */
function Input({ label, name, type = "text", placeholder = "", value, onChange, icon, error, required = true }) {
  const hasError = Boolean(error);
  const inputId = `field-${name}`;
  return (
    <div>
      <label className="block mb-2 text-sm font-semibold text-dark dark:text-white" htmlFor={inputId}>
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute start-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          type={type}
          name={name}
          value={value}
          required={required}
          placeholder={placeholder}
          onChange={onChange}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${inputId}-error` : undefined}
          className={`w-full rounded-xl border-2 ${hasError ? "border-red-500 focus:border-red-500 focus:ring-red-200" : "border-gray-200 dark:border-dark-3 focus:border-[#0884a9] focus:ring-[#0884a9]/20"} ${icon ? 'pl-12' : 'pl-4'} pr-4 py-3 bg-white dark:bg-dark text-dark dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 transition-all duration-300`}
        />
      </div>
      {hasError && (
        <p id={`${inputId}-error`} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

/* ===== Textarea Component ===== */
function Textarea({ label, name, placeholder = "", value, onChange, error, required = false }) {
  const hasError = Boolean(error);
  const inputId = `field-${name}`;
  return (
    <div>
      <label className="block mb-2 text-sm font-semibold text-dark dark:text-white" htmlFor={inputId}>
        {label}
      </label>
      <textarea
        id={inputId}
        name={name}
        value={value}
        rows={5}
        placeholder={placeholder}
        onChange={onChange}
        required={required}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${inputId}-error` : undefined}
        className={`w-full rounded-xl border-2 ${hasError ? "border-red-500 focus:border-red-500 focus:ring-red-200" : "border-gray-200 dark:border-dark-3 focus:border-[#0884a9] focus:ring-[#0884a9]/20"} px-4 py-3 bg-white dark:bg-dark text-dark dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 transition-all duration-300 resize-none`}
      />
      {hasError && (
        <p id={`${inputId}-error`} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
