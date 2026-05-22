import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, Building2, LockKeyhole, UserRound } from "lucide-react";
import synergyLogo from "../components/synergybig.png";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { usePortalLanguage } from "../i18n/usePortalLanguage";
import { fetchPortalSession, loginToPortal, storePortalToken } from "./auth";

const emptyForm = {
  company_code: "",
  portal_username: "",
  portal_password: "",
};

export default function LoginScreen({ onLoginSuccess, initialError = "" }) {
  const { t } = useTranslation();
  const { isRTL } = usePortalLanguage();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState(initialError);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setError(initialError);
  }, [initialError]);

  const updateField = (field) => (event) => {
    setForm((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextFieldErrors = {};
    const companyCode = form.company_code.trim();
    const portalUsername = form.portal_username.trim();
    const portalPassword = form.portal_password;

    if (!companyCode) {
      nextFieldErrors.company_code = t("Login.errors.tenant_required");
    }

    if (!portalUsername) {
      nextFieldErrors.portal_username = t("Login.errors.username_required");
    }

    if (!portalPassword) {
      nextFieldErrors.portal_password = t("Login.errors.password_required");
    }

    setFieldErrors(nextFieldErrors);

    if (Object.keys(nextFieldErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const payload = await loginToPortal({
        company_code: companyCode,
        portal_username: portalUsername,
        portal_password: portalPassword,
      });

      storePortalToken(payload.token);
      const session = await fetchPortalSession(payload.token);

      onLoginSuccess({
        token: payload.token,
        session,
      });
      setForm(emptyForm);
    } catch (requestError) {
      setError(requestError.message || t("portalAuth.errors.sign_in_failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFieldError = (message) =>
    message ? <small className="mt-2 block text-[12px] font-medium text-[#d45353]">{message}</small> : null;

  const passwordTogglePosition = isRTL ? { left: "0.75rem" } : { right: "0.75rem" };
  const leadingIconPosition = isRTL ? "right-4" : "left-4";
  const textInputPadding = isRTL ? "pr-12 pl-4" : "pl-12 pr-4";
  const passwordInputPadding = "pl-12 pr-12";
  const fieldShellClassName =
    "h-[54px] w-full rounded-[18px] border border-white/40 bg-[rgba(255,255,255,0.44)] text-[16px] font-medium text-[#172132] shadow-[inset_0_1px_0_rgba(255,255,255,0.55),inset_0_-1px_0_rgba(146,182,219,0.08),0_10px_28px_rgba(37,82,132,0.06)] outline-none transition placeholder:text-[#8ea0b2] hover:border-white/55 hover:bg-[rgba(255,255,255,0.5)] focus:border-[#1a73e8] focus:bg-[rgba(255,255,255,0.62)] focus:shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_0_0_4px_rgba(26,115,232,0.12),0_18px_35px_rgba(36,93,134,0.12)]";

  return (
    <main className="portal-app min-h-[100dvh] overflow-hidden bg-[#0584a8] !p-0">
      <div className="relative isolate min-h-[100dvh] overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(160deg,#0584a8_0%,#71c6dd_36%,#f5fbff_72%,#ffffff_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(255,255,255,0.48),transparent_24%),radial-gradient(circle_at_78%_22%,rgba(255,255,255,0.34),transparent_18%),radial-gradient(circle_at_62%_78%,rgba(152,216,231,0.18),transparent_22%)]" />
        <div className="absolute -left-14 top-[7%] h-40 w-40 rounded-full border border-white/30 bg-white/20 blur-[6px]" />
        <div className="absolute left-[-72px] top-[8%] h-52 w-52 rounded-full bg-[rgba(255,255,255,0.42)] blur-3xl" />
        <div className="absolute right-[-74px] top-[18%] h-36 w-36 rounded-full border border-white/28 bg-[rgba(255,255,255,0.14)] blur-[4px]" />
        <div className="absolute bottom-[10%] right-[-90px] h-60 w-60 rounded-full bg-[rgba(89,160,235,0.18)] blur-3xl" />
        <div className="absolute left-1/2 top-[62%] h-36 w-36 -translate-x-1/2 rounded-full bg-white/32 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-60">
          <svg
            className="h-full w-full"
            viewBox="0 0 430 932"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M-30 210C44 171 101 175 159 201C227 232 283 261 373 231C418 216 456 190 486 163"
              fill="none"
              stroke="rgba(255,255,255,0.45)"
              strokeWidth="1.15"
              strokeLinecap="round"
            />
            <path
              d="M-26 258C65 233 131 246 207 281C276 313 335 325 431 292"
              fill="none"
              stroke="rgba(255,255,255,0.24)"
              strokeWidth="0.95"
              strokeLinecap="round"
            />
            <path
              d="M-40 678C45 644 126 649 214 691C287 726 347 741 459 710"
              fill="none"
              stroke="rgba(255,255,255,0.28)"
              strokeWidth="1"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <section className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-[460px] flex-col justify-center px-4 py-5 min-[390px]:px-5 sm:max-w-[520px] sm:px-6">
          <div className="pointer-events-none absolute inset-x-8 top-1/2 h-[340px] -translate-y-1/2 rounded-full bg-[rgba(255,255,255,0.44)] blur-3xl" />
          <div className="relative overflow-hidden rounded-[28px] border border-[rgba(255,255,255,0.35)] bg-[rgba(255,255,255,0.22)] p-5 shadow-[0_20px_60px_rgba(30,80,140,0.12)] backdrop-blur-[28px] min-[390px]:rounded-[32px] min-[390px]:p-6 sm:p-7">
            <div className="pointer-events-none absolute inset-0 rounded-[inherit] border border-white/16 shadow-[inset_0_1px_0_rgba(255,255,255,0.45),inset_0_24px_36px_rgba(255,255,255,0.08)]" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(255,255,255,0.32),rgba(255,255,255,0))]" />
            <div className="flex flex-col gap-3 min-[390px]:gap-4">
              <div className="flex flex-col items-center text-center">
                <img src={synergyLogo} alt="FAWTARTAK" className="h-auto w-[176px] object-contain min-[390px]:w-[186px]" />
              </div>

              <div className="space-y-0.5 text-center">
                <h1 className="text-[22px] font-extrabold leading-[1.08] tracking-[-0.03em] text-[#183243] min-[390px]:text-[25px]">
                  {t("portalAuth.login.title")}
                </h1>
              </div>

              <div className="flex justify-center">
                <LanguageSwitcher
                  compact
                  className="border-white/35 bg-[rgba(255,255,255,0.22)] shadow-[inset_0_1px_0_rgba(255,255,255,0.38),0_10px_24px_rgba(24,49,67,0.06)] backdrop-blur-xl"
                />
              </div>
            </div>

            <form className="mt-7" onSubmit={handleSubmit}>
              <label className="mb-4 block">
                <span className="mb-1.5 block text-[12px] font-semibold text-[#5f7280]">
                  {t("portalAuth.login.fields.company_code")}
                </span>
                <div className="relative">
                  <Building2
                    className={`pointer-events-none absolute top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#7f93a2] ${leadingIconPosition}`}
                    aria-hidden="true"
                  />
                  <input
                    type="text"
                    value={form.company_code}
                    onChange={updateField("company_code")}
                    placeholder={t("portalAuth.login.fields.company_code")}
                    autoComplete="organization"
                    className={`${fieldShellClassName} ${textInputPadding}`}
                  />
                </div>
                {renderFieldError(fieldErrors.company_code)}
              </label>

              <label className="mb-4 block">
                <span className="mb-1.5 block text-[12px] font-semibold text-[#5f7280]">
                  {t("portalAuth.login.fields.username")}
                </span>
                <div className="relative">
                  <UserRound
                    className={`pointer-events-none absolute top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#7f93a2] ${leadingIconPosition}`}
                    aria-hidden="true"
                  />
                  <input
                    type="text"
                    value={form.portal_username}
                    onChange={updateField("portal_username")}
                    placeholder={t("portalAuth.login.fields.username")}
                    autoComplete="username"
                    className={`${fieldShellClassName} ${textInputPadding}`}
                  />
                </div>
                {renderFieldError(fieldErrors.portal_username)}
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[12px] font-semibold text-[#5f7280]">
                  {t("portalAuth.login.fields.password")}
                </span>
                <div className="relative">
                  <LockKeyhole
                    className={`pointer-events-none absolute top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#7f93a2] ${leadingIconPosition}`}
                    aria-hidden="true"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.portal_password}
                    onChange={updateField("portal_password")}
                    placeholder={t("portalAuth.login.fields.password")}
                    autoComplete="current-password"
                    className={`${fieldShellClassName} ${passwordInputPadding}`}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? t("portalAuth.actions.hide_password") : t("portalAuth.actions.show_password")}
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute inset-y-0 inline-flex w-10 items-center justify-center text-[#8c9aaa] transition hover:text-[#5f7280]"
                    style={passwordTogglePosition}
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" className="h-[19px] w-[19px]" aria-hidden="true">
                        <path
                          d="M3 3l18 18M10.58 10.58A2 2 0 0012 14a2 2 0 001.42-.58M9.88 5.09A9.77 9.77 0 0112 4c5 0 8.27 4.11 9 6-.35.9-1.3 2.49-2.87 3.89M6.23 6.23C4.19 7.63 2.93 9.53 2.5 10c.73 1.89 4 6 9 6 1.55 0 2.96-.39 4.21-1.01"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" className="h-[19px] w-[19px]" aria-hidden="true">
                        <path
                          d="M3 12s3.35-5.5 9-5.5 9 5.5 9 5.5-3.35 5.5-9 5.5S3 12 3 12z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <circle
                          cx="12"
                          cy="12"
                          r="2.25"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                {renderFieldError(fieldErrors.portal_password)}
              </label>

              {error && (
                <div className="mt-4 rounded-[18px] border border-[#f1d5d5] bg-[rgba(255,245,245,0.88)] px-4 py-3 text-[13px] text-[#c04f4f] backdrop-blur-sm">
                  {error}
                </div>
              )}

              <button
                className="mt-6 h-[56px] w-full rounded-[18px] bg-[linear-gradient(180deg,#0da0c8_0%,#0584a8_62%,#046f8e_100%)] px-4 text-[16px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_12px_24px_rgba(5,132,168,0.18),0_22px_44px_rgba(5,132,168,0.24)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.24),0_14px_28px_rgba(5,132,168,0.2),0_26px_50px_rgba(5,132,168,0.3)] hover:brightness-[1.02] active:translate-y-[1px] active:shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_10px_20px_rgba(5,132,168,0.18)] disabled:cursor-wait disabled:bg-[linear-gradient(180deg,#77bfd2_0%,#5fadc1_100%)] disabled:text-white/90 disabled:shadow-[0_10px_24px_rgba(95,173,193,0.16)]"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? t("portalAuth.states.signing_in") : t("portalAuth.actions.sign_in")}
              </button>

              <button
                type="button"
                className="mt-4 inline-flex w-full items-center justify-center gap-1 rounded-[16px] px-3 py-3 text-[14px] font-medium text-[#5b7485] transition hover:bg-white/45 hover:text-[#245d86]"
              >
                <span>{t("portalAuth.actions.sign_up_cta")}</span>
                <ArrowRight className="rtl-flip h-4 w-4" aria-hidden="true" />
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
