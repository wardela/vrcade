import { useTranslation } from "react-i18next";
import { usePortalLanguage } from "../i18n/usePortalLanguage";

const OPTIONS = [
  { value: "en", key: "english" },
  { value: "ar", key: "arabic" },
];

export default function LanguageSwitcher({ className = "", compact = false }) {
  const { t } = useTranslation();
  const { language, changeLanguage } = usePortalLanguage();

  return (
    <div
      className={`inline-flex items-center rounded-[18px] border border-app-border bg-app-surface-alt/80 p-1 shadow-app-sm ${className}`}
      dir="ltr"
      role="group"
      aria-label={t("portalShell.language.label")}
    >
      {OPTIONS.map((option) => {
        const active = language === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => changeLanguage(option.value)}
            className={`inline-flex items-center justify-center rounded-[14px] px-3 py-2 text-sm font-semibold transition ${
              compact ? "min-w-[72px]" : "min-w-[92px]"
            } ${
              active
                ? "bg-app-surface text-app-text shadow-app-sm"
                : "text-app-muted hover:bg-app-surface/80 hover:text-app-text"
            }`}
            aria-pressed={active}
          >
            {t(`portalShell.language.${option.key}`)}
          </button>
        );
      })}
    </div>
  );
}
