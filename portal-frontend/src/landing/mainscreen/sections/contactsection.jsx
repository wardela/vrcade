import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const INITIAL_FORM = {
  name: "",
  email: "",
  phone: "",
  message: "",
};

export default function ContactSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [formStatus, setFormStatus] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.12 }
    );

    const section = document.getElementById("contact");
    if (section) {
      observer.observe(section);
    }

    return () => {
      if (section) {
        observer.unobserve(section);
      }
    };
  }, []);

  const resetForm = () => {
    setFormData(INITIAL_FORM);
  };

  const updateField = (field) => (event) => {
    setFormData((current) => ({
      ...current,
      [field]: event.target.value,
    }));
    setFormStatus(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setFormStatus(null);

    try {
      const response = await fetch("/api/public/contact-submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: formData.name,
          business_email: formData.email,
          phone_number: formData.phone,
          message: formData.message,
          locale: i18n.resolvedLanguage || i18n.language || "en",
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.message || t("contact.form.errors.submit_failed"));
      }

      setFormStatus({
        type: "success",
        message: t("contact.form.success"),
      });
      resetForm();
    } catch (error) {
      setFormStatus({
        type: "error",
        message: error.message || t("contact.form.errors.submit_failed"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="contact"
      className="relative overflow-hidden py-20 md:py-[120px]"
    >
      <div className="absolute inset-0 -z-[1] bg-[linear-gradient(180deg,#f7fbfd_0%,#ffffff_42%,#f8fcfd_100%)] dark:bg-dark" />
      <div className="absolute inset-0 -z-[1] bg-[radial-gradient(circle_at_top_left,rgba(8,132,168,0.12),transparent_24%),radial-gradient(circle_at_85%_20%,rgba(8,132,168,0.08),transparent_18%),radial-gradient(circle_at_20%_90%,rgba(71,176,211,0.1),transparent_20%)]" />
      <div className="pointer-events-none absolute inset-0 -z-[1] opacity-50">
        <div className="absolute left-[8%] top-20 h-40 w-40 rounded-full border border-[#0884a9]/10 bg-white/60 blur-sm" />
        <div className="absolute right-[6%] top-16 h-56 w-56 rounded-full bg-[#0884a9]/10 blur-3xl" />
        <div className="absolute bottom-8 left-[18%] h-52 w-52 rounded-full bg-sky-200/30 blur-3xl" />
      </div>

      <div className="container relative z-10 mx-auto px-4">
        <div
          className={`mx-auto max-w-6xl transition-all duration-1000 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <div className="overflow-hidden rounded-[32px] border border-white/70 bg-white/80 shadow-[0_28px_80px_rgba(27,79,113,0.12)] backdrop-blur-xl">
            <div className="grid lg:grid-cols-[0.94fr_1.06fr]">
              <div className="relative border-b border-[#e6f1f5] px-6 py-8 sm:px-8 lg:border-b-0 lg:border-e lg:px-10 lg:py-10">
                <div className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,rgba(8,132,168,0.08),rgba(8,132,168,0))]" />

                <div className="relative">
                  <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#0884a9]/16 bg-[#0884a9]/8 px-4 py-2 text-sm font-semibold text-[#0d6f8a]">
                    <span className="h-2 w-2 rounded-full bg-[#0884a9]" />
                    {t("contact.badge")}
                  </div>

                  <h2 className="max-w-[520px] text-4xl font-bold leading-tight text-dark dark:text-white sm:text-5xl">
                    {t("contact.heading.line1")}{" "}
                    <span className="bg-gradient-to-r from-[#0884a9] to-[#066f8f] bg-clip-text text-transparent">
                      {t("contact.heading.highlight")}
                    </span>
                  </h2>

                  <p className="mt-5 max-w-[500px] text-base leading-7 text-body-color dark:text-dark-6 sm:text-lg">
                    {t("contact.description")}
                  </p>

                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    <ContactCard
                      title={t("contact.info.phone.title")}
                      accent="teal"
                      content={
                        <div className="space-y-2">
                          <a
                            href="tel:+962798310374"
                            className="block text-base font-semibold text-dark transition hover:text-[#0884a9]"
                            dir="ltr"
                          >
                            +962 79 831 0374
                          </a>
                          <a
                            href="tel:+962798163375"
                            className="block text-base font-semibold text-dark transition hover:text-[#0884a9]"
                            dir="ltr"
                          >
                            +962 79 816 3375
                          </a>
                        </div>
                      }
                      icon={
                        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                          <path
                            d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      }
                    />

                    <ContactCard
                      title={t("contact.info.email.title")}
                      accent="blue"
                      content={
                        <a
                          href="mailto:sales@fawtartak.com"
                          className="block text-base font-semibold text-dark transition hover:text-[#0884a9]"
                        >
                          sales@fawtartak.com
                        </a>
                      }
                      icon={
                        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                          <path
                            d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <rect
                            x="2"
                            y="4"
                            width="20"
                            height="16"
                            rx="2"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                          />
                        </svg>
                      }
                    />
                  </div>

                  <div className="mt-8 rounded-[24px] border border-[#dbeaf1] bg-white/85 p-5 shadow-[0_16px_36px_rgba(22,75,109,0.06)]">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <MiniStat
                        value="<24h"
                        label={t("contact.trust.quick_response")}
                      />
                      <MiniStat
                        value="Local"
                        label={t("contact.info.phone.title")}
                      />
                      <MiniStat
                        value="Secure"
                        label={t("contact.trust.secure")}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
                <div className="mb-7">
                  <h3 className="text-2xl font-bold text-dark dark:text-white sm:text-[2rem]">
                    {t("contact.form.title")}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-body-color dark:text-dark-6 sm:text-base">
                    {t("contact.form.subtitle")}
                  </p>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormInput
                      label={t("contact.form.fields.name.label")}
                      placeholder={t("contact.form.fields.name.placeholder")}
                      value={formData.name}
                      onChange={updateField("name")}
                    />

                    <FormInput
                      label={t("contact.form.fields.phone.label")}
                      placeholder={t("contact.form.fields.phone.placeholder")}
                      value={formData.phone}
                      onChange={updateField("phone")}
                    />

                    <div className="sm:col-span-2">
                      <FormInput
                        label={t("contact.form.fields.email.label")}
                        type="email"
                        placeholder={t("contact.form.fields.email.placeholder")}
                        value={formData.email}
                        onChange={updateField("email")}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="mb-2 block text-sm font-semibold text-dark dark:text-white">
                        {t("contact.form.fields.message.label")}
                      </label>
                      <textarea
                        rows="5"
                        required
                        value={formData.message}
                        onChange={updateField("message")}
                        placeholder={t("contact.form.fields.message.placeholder")}
                        className="w-full resize-none rounded-[20px] border border-[#d9e5eb] bg-[#fbfdfe] px-4 py-3.5 text-sm text-dark shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] outline-none transition placeholder:text-slate-400 focus:border-[#0884a9]/35 focus:bg-white focus:shadow-[0_0_0_4px_rgba(8,132,168,0.08)]"
                      />
                    </div>
                  </div>

                  {formStatus ? (
                    <div
                      className={`mt-5 rounded-[18px] border px-4 py-3 text-sm ${
                        formStatus.type === "success"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-red-200 bg-red-50 text-red-700"
                      }`}
                    >
                      {formStatus.message}
                    </div>
                  ) : null}

                  <div className="mt-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4 text-xs text-body-color dark:text-dark-6">
                      <TrustChip>{t("contact.trust.quick_response")}</TrustChip>
                      <TrustChip>{t("contact.trust.secure")}</TrustChip>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="group inline-flex min-w-[220px] items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#0884a9_0%,#066f8f_100%)] px-7 py-3.5 text-base font-bold text-white shadow-[0_16px_34px_rgba(8,132,168,0.26)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_38px_rgba(8,132,168,0.3)] disabled:cursor-wait disabled:opacity-70"
                    >
                      <span>
                        {isSubmitting
                          ? t("contact.form.submit.loading")
                          : t("contact.form.submit.default")}
                      </span>
                      <svg
                        viewBox="0 0 24 24"
                        className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                        aria-hidden="true"
                      >
                        <path
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ContactCard({ title, icon, content, accent = "teal" }) {
  const accentClass =
    accent === "blue"
      ? "bg-blue-50 text-blue-600"
      : "bg-[#0884a9]/10 text-[#0884a9]";

  return (
    <div className="rounded-[24px] border border-[#dbeaf1] bg-white/85 p-5 shadow-[0_16px_36px_rgba(22,75,109,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_44px_rgba(22,75,109,0.09)]">
      <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl ${accentClass}`}>
        {icon}
      </div>
      <h4 className="mb-2 text-base font-bold text-dark dark:text-white">{title}</h4>
      <div className="text-sm leading-6 text-body-color dark:text-dark-6">{content}</div>
    </div>
  );
}

function MiniStat({ value, label }) {
  return (
    <div className="rounded-2xl bg-[#f7fbfd] px-4 py-4 text-center">
      <div className="text-lg font-bold text-dark">{value}</div>
      <div className="mt-1 text-xs font-medium text-body-color">{label}</div>
    </div>
  );
}

function TrustChip({ children }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[#d8e8ef] bg-white px-3 py-1.5">
      <span className="h-2 w-2 rounded-full bg-[#0884a9]" />
      <span>{children}</span>
    </div>
  );
}

function FormInput({ label, type = "text", placeholder, value, onChange }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-dark dark:text-white">
        {label}
      </label>
      <input
        type={type}
        required
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-[20px] border border-[#d9e5eb] bg-[#fbfdfe] px-4 py-3.5 text-sm text-dark shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] outline-none transition placeholder:text-slate-400 focus:border-[#0884a9]/35 focus:bg-white focus:shadow-[0_0_0_4px_rgba(8,132,168,0.08)]"
      />
    </div>
  );
}
