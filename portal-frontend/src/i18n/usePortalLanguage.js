import { useTranslation } from "react-i18next";
import { normalizePortalLanguage } from "./index";

export function usePortalLanguage() {
  const { i18n } = useTranslation();
  const language = normalizePortalLanguage(i18n.resolvedLanguage || i18n.language);

  return {
    language,
    isRTL: language === "ar",
    changeLanguage: (nextLanguage) =>
      i18n.changeLanguage(normalizePortalLanguage(nextLanguage)),
  };
}
