import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import ar from "./locales/ar.json";

export const DEFAULT_LANGUAGE = "en";
export const PORTAL_LANGUAGE_KEY = "portal_language";
export const LEGACY_LANGUAGE_KEY = "lang";

export const normalizePortalLanguage = (value) => (value === "ar" ? "ar" : "en");

const getInitialLanguage = () => {
  if (typeof window === "undefined") {
    return DEFAULT_LANGUAGE;
  }

  return normalizePortalLanguage(
    window.localStorage.getItem(PORTAL_LANGUAGE_KEY) ||
      window.localStorage.getItem(LEGACY_LANGUAGE_KEY) ||
      DEFAULT_LANGUAGE
  );
};

export const applyLanguageToDocument = (language) => {
  if (typeof document === "undefined") {
    return;
  }

  const normalizedLanguage = normalizePortalLanguage(language);
  document.documentElement.lang = normalizedLanguage;
  document.documentElement.dir = normalizedLanguage === "ar" ? "rtl" : "ltr";
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    lng: getInitialLanguage(),
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: ["en", "ar"],
    load: "languageOnly",
    nonExplicitSupportedLngs: true,
    returnNull: false,
    interpolation: {
      escapeValue: false,
    },
  });

applyLanguageToDocument(i18n.resolvedLanguage || i18n.language);

i18n.on("languageChanged", (language) => {
  const normalizedLanguage = normalizePortalLanguage(language);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(PORTAL_LANGUAGE_KEY, normalizedLanguage);
    window.localStorage.setItem(LEGACY_LANGUAGE_KEY, normalizedLanguage);
  }

  applyLanguageToDocument(normalizedLanguage);
});

export default i18n;
