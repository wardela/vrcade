import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

const INITIAL_FORM = {
  fullName: "",
  businessName: "",
  phoneNumber: "",
  email: "",
  cityLocation: "",
  branchCount: "",
  userCount: "",
  businessType: "",
  interestedModules: [],
  notes: "",
};

export default function PricingSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const { t, i18n } = useTranslation();

  const businessTypes = useMemo(
    () => [
      "Retail",
      "Restaurant / Cafe",
      "Services",
      "Wholesale",
      "Other",
    ],
    []
  );

  const moduleOptions = useMemo(
    () => [
      "Sales & E-Invoicing",
      "POS",
      "Inventory",
      "CRM",
      "Reports & Statistics",
      "Owner Portal",
    ],
    []
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    const section = document.getElementById("pricing");
    if (section) {
      observer.observe(section);
    }

    return () => {
      if (section) {
        observer.unobserve(section);
      }
    };
  }, []);

  const setFieldValue = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
    setFieldErrors((current) => ({
      ...current,
      [field]: "",
    }));
    setFormStatus(null);
  };

  const toggleModule = (moduleName) => {
    setFormData((current) => {
      const exists = current.interestedModules.includes(moduleName);

      return {
        ...current,
        interestedModules: exists
          ? current.interestedModules.filter((item) => item !== moduleName)
          : [...current.interestedModules, moduleName],
      };
    });
    setFormStatus(null);
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.fullName.trim()) {
      nextErrors.fullName = t("pricing.form.errors.full_name");
    }

    if (!formData.businessName.trim()) {
      nextErrors.businessName = t("pricing.form.errors.business_name");
    }

    if (!formData.phoneNumber.trim()) {
      nextErrors.phoneNumber = t("pricing.form.errors.phone_number");
    }

    if (!formData.businessType.trim()) {
      nextErrors.businessType = t("pricing.form.errors.business_type");
    }

    if (formData.email.trim()) {
      const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim());

      if (!isValidEmail) {
        nextErrors.email = t("pricing.form.errors.email");
      }
    }

    if (formData.branchCount !== "" && Number(formData.branchCount) < 0) {
      nextErrors.branchCount = t("pricing.form.errors.branch_count");
    }

    if (formData.userCount !== "" && Number(formData.userCount) < 0) {
      nextErrors.userCount = t("pricing.form.errors.user_count");
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setFormStatus(null);

    try {
      const response = await fetch("/api/public/offer-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: formData.fullName,
          business_name: formData.businessName,
          phone_number: formData.phoneNumber,
          email: formData.email || null,
          city_location: formData.cityLocation || null,
          branch_count: formData.branchCount === "" ? null : formData.branchCount,
          user_count: formData.userCount === "" ? null : formData.userCount,
          business_type: formData.businessType,
          interested_modules: formData.interestedModules,
          notes: formData.notes || null,
          locale: i18n.resolvedLanguage || i18n.language || "en",
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.message || t("pricing.form.errors.submit_failed"));
      }

      setFormStatus({
        type: "success",
        message: t("pricing.form.success.title"),
        detail: t("pricing.form.success.detail"),
      });
      setFormData(INITIAL_FORM);
      setFieldErrors({});
    } catch (error) {
      setFormStatus({
        type: "error",
        message: t("pricing.form.errors.submit_failed"),
        detail: error.message || "",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="pricing"
      className="relative z-20 overflow-hidden bg-gradient-to-b from-white to-gray-50 dark:from-dark dark:to-dark-2 pb-16 pt-20 lg:pb-[100px] lg:pt-[120px]"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-36 end-20 h-96 w-96 rounded-full bg-[#0884a9]/6 blur-3xl" />
        <div className="absolute bottom-24 start-8 h-80 w-80 rounded-full bg-sky-200/30 blur-3xl" />
      </div>

      <div className="container mx-auto relative z-10 px-4">
        <div className="mx-auto mb-14 max-w-[760px] text-center">
          <div
            className={`transition-all duration-1000 ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
            }`}
          >
            <h2 className="mb-5 text-3xl font-bold text-dark dark:text-white sm:text-4xl md:text-5xl md:leading-tight">
              {t("pricing.heading.before_highlight")}{" "}
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-[#0884a9] to-[#066f8f] bg-clip-text text-transparent">
                  {t("pricing.heading.highlight")}
                </span>
                <svg
                  className="absolute -bottom-2 start-0 hidden w-full sm:block"
                  height="12"
                  viewBox="0 0 300 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1 9C50 3 100 1 150 3C200 5 250 7 299 9"
                    stroke="#0884a9"
                    strokeOpacity="0.3"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h2>

            <div className="space-y-2">
              <p className="text-base text-body-color dark:text-dark-6 md:text-lg">
                {t("pricing.description.line1")}
              </p>
            </div>
          </div>
        </div>

        <div
          className={`mx-auto max-w-5xl transition-all duration-1000 delay-150 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <div className="overflow-hidden rounded-[30px] border border-[#0884a9]/15 bg-white/92 shadow-[0_24px_70px_rgba(15,77,112,0.12)] backdrop-blur-sm">
            <div className="px-6 py-7 sm:px-8 lg:px-10 lg:py-10">
                {formStatus?.type === "success" ? (
                  <div className="flex min-h-full flex-col items-center justify-center rounded-[28px] border border-[#0884a9]/10 bg-[linear-gradient(180deg,rgba(8,132,168,0.07),rgba(255,255,255,0.95))] px-6 py-12 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#0884a9]/15 text-[#0884a9]">
                      <svg viewBox="0 0 24 24" className="h-8 w-8" aria-hidden="true">
                        <path
                          d="M5 13l4 4L19 7"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <h3 className="mt-6 text-2xl font-bold text-dark dark:text-white">
                      {formStatus.message}
                    </h3>
                    <p className="mt-3 max-w-[460px] text-base leading-7 text-body-color dark:text-dark-6">
                      {formStatus.detail}
                    </p>
                    <button
                      type="button"
                      onClick={() => setFormStatus(null)}
                      className="mt-8 inline-flex items-center justify-center rounded-full border border-[#0884a9]/20 bg-white px-5 py-2.5 text-sm font-semibold text-[#0d6f8a] shadow-sm transition hover:border-[#0884a9]/35 hover:bg-[#f6fbfd]"
                    >
                      {t("pricing.form.success.reset")}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <div className="mb-8">
                      <div className="mb-4 flex flex-wrap gap-2">
                        <span className="rounded-full border border-[#0884a9]/14 bg-[#0884a9]/6 px-3 py-1.5 text-xs font-semibold text-[#0d6f8a]">
                          {t("pricing.badge")}
                        </span>
                        <span className="rounded-full border border-[#0884a9]/14 bg-white px-3 py-1.5 text-xs font-semibold text-[#0d6f8a]">
                          {t("pricing.description.line2")}
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold text-dark dark:text-white sm:text-[2rem]">
                        {t("pricing.form.title")}
                      </h3>
                      <p className="mt-2 max-w-[620px] text-sm leading-6 text-body-color dark:text-dark-6 sm:text-base">
                        {t("pricing.form.subtitle")}
                      </p>
                    </div>

                    {formStatus?.type === "error" ? (
                      <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {formStatus.message}
                      </div>
                    ) : null}

                    <div className="grid gap-5 md:grid-cols-2">
                      <Field
                        label={t("pricing.form.fields.full_name.label")}
                        placeholder={t("pricing.form.fields.full_name.placeholder")}
                        value={formData.fullName}
                        error={fieldErrors.fullName}
                        onChange={(event) => setFieldValue("fullName", event.target.value)}
                        required
                      />
                      <Field
                        label={t("pricing.form.fields.business_name.label")}
                        placeholder={t("pricing.form.fields.business_name.placeholder")}
                        value={formData.businessName}
                        error={fieldErrors.businessName}
                        onChange={(event) => setFieldValue("businessName", event.target.value)}
                        required
                      />
                      <Field
                        label={t("pricing.form.fields.phone_number.label")}
                        placeholder={t("pricing.form.fields.phone_number.placeholder")}
                        value={formData.phoneNumber}
                        error={fieldErrors.phoneNumber}
                        onChange={(event) => setFieldValue("phoneNumber", event.target.value)}
                        required
                      />
                      <Field
                        label={t("pricing.form.fields.email.label")}
                        placeholder={t("pricing.form.fields.email.placeholder")}
                        value={formData.email}
                        error={fieldErrors.email}
                        onChange={(event) => setFieldValue("email", event.target.value)}
                        type="email"
                      />
                      <Field
                        label={t("pricing.form.fields.city_location.label")}
                        placeholder={t("pricing.form.fields.city_location.placeholder")}
                        value={formData.cityLocation}
                        onChange={(event) => setFieldValue("cityLocation", event.target.value)}
                      />
                      <SelectField
                        label={t("pricing.form.fields.business_type.label")}
                        value={formData.businessType}
                        error={fieldErrors.businessType}
                        onChange={(event) => setFieldValue("businessType", event.target.value)}
                        placeholder={t("pricing.form.fields.business_type.placeholder")}
                        options={businessTypes.map((type) => ({
                          value: type,
                          label: t(`pricing.form.business_types.${type}`),
                        }))}
                        required
                      />
                      <NumberField
                        label={t("pricing.form.fields.branch_count.label")}
                        value={formData.branchCount}
                        error={fieldErrors.branchCount}
                        onChange={(event) => setFieldValue("branchCount", event.target.value)}
                        quickValues={[1, 2, 5, "10+"]}
                      />
                      <NumberField
                        label={t("pricing.form.fields.user_count.label")}
                        value={formData.userCount}
                        error={fieldErrors.userCount}
                        onChange={(event) => setFieldValue("userCount", event.target.value)}
                        quickValues={[1, 2, 5, 10, "10+"]}
                      />

                      <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-semibold text-dark dark:text-white">
                          {t("pricing.form.fields.interested_modules.label")}
                        </label>
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                          {moduleOptions.map((moduleName) => {
                            const selected = formData.interestedModules.includes(moduleName);

                            return (
                              <button
                                key={moduleName}
                                type="button"
                                onClick={() => toggleModule(moduleName)}
                                className={`rounded-2xl border px-4 py-4 text-start transition-all duration-200 ${
                                  selected
                                    ? "border-[#0884a9]/35 bg-[#0884a9]/10 shadow-[0_10px_24px_rgba(8,132,168,0.1)]"
                                    : "border-gray-200 bg-white hover:border-[#0884a9]/22 hover:bg-[#f8fcfd]"
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div
                                    className={`mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full border ${
                                      selected
                                        ? "border-[#0884a9] bg-[#0884a9] text-white"
                                        : "border-gray-300 text-transparent"
                                    }`}
                                  >
                                    <svg viewBox="0 0 24 24" className="h-3 w-3" aria-hidden="true">
                                      <path
                                        d="M5 13l4 4L19 7"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                  </div>
                                  <span className="text-sm font-semibold text-dark dark:text-white">
                                    {t(`pricing.form.modules.${moduleName}`)}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-semibold text-dark dark:text-white">
                          {t("pricing.form.fields.notes.label")}
                        </label>
                        <textarea
                          rows="4"
                          value={formData.notes}
                          onChange={(event) => setFieldValue("notes", event.target.value)}
                          placeholder={t("pricing.form.fields.notes.placeholder")}
                          className="w-full resize-none rounded-2xl border-2 border-gray-200 bg-white px-4 py-3 text-sm text-dark outline-none transition focus:border-[#0884a9]/45 focus:shadow-[0_0_0_4px_rgba(8,132,168,0.08)]"
                        />
                      </div>
                    </div>

                    <div className="mt-7 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm leading-6 text-body-color dark:text-dark-6">
                        {t("pricing.form.footer_note")}
                      </div>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="group inline-flex min-w-[220px] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#0884a9] to-[#066f8f] px-7 py-3.5 text-base font-bold text-white shadow-lg shadow-[#0884a9]/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-[#0884a9]/30 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        <span>
                          {isSubmitting
                            ? t("pricing.form.submit.loading")
                            : t("pricing.form.submit.default")}
                        </span>
                        <svg
                          className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                          />
                        </svg>
                      </button>
                    </div>
                  </form>
                )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  error,
  required = false,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-dark dark:text-white">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className={`w-full rounded-2xl border-2 bg-white px-4 py-3 text-sm text-dark outline-none transition ${
          error
            ? "border-red-300 focus:border-red-400 focus:shadow-[0_0_0_4px_rgba(248,113,113,0.1)]"
            : "border-gray-200 focus:border-[#0884a9]/45 focus:shadow-[0_0_0_4px_rgba(8,132,168,0.08)]"
        }`}
      />
      {error ? <p className="mt-2 text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  error,
  required = false,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-dark dark:text-white">
        {label}
      </label>
      <select
        value={value}
        onChange={onChange}
        required={required}
        className={`w-full rounded-2xl border-2 bg-white px-4 py-3 text-sm text-dark outline-none transition ${
          error
            ? "border-red-300 focus:border-red-400 focus:shadow-[0_0_0_4px_rgba(248,113,113,0.1)]"
            : "border-gray-200 focus:border-[#0884a9]/45 focus:shadow-[0_0_0_4px_rgba(8,132,168,0.08)]"
        }`}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <p className="mt-2 text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  quickValues = [],
  error,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-dark dark:text-white">
        {label}
      </label>
      <div
        className={`rounded-2xl border-2 bg-white p-3 transition ${
          error ? "border-red-300" : "border-gray-200"
        }`}
      >
        <div className="flex flex-wrap gap-2">
        {quickValues.map((quickValue) => (
          <button
            key={quickValue}
            type="button"
            onClick={() => onChange({ target: { value: String(quickValue) } })}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              String(value) === String(quickValue)
                ? "border-[#0884a9]/35 bg-[#0884a9]/12 text-[#0d6f8a]"
                : "border-[#0884a9]/14 bg-[#0884a9]/5 text-[#0d6f8a] hover:border-[#0884a9]/24 hover:bg-[#0884a9]/10"
            }`}
          >
            {quickValue}
          </button>
        ))}
        </div>
      </div>
      {error ? <p className="mt-2 text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  );
}
