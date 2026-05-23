import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import ar from "./locales/ar.json";

export const DEFAULT_LANGUAGE = "en";
export const LANDING_LANGUAGE_KEY = "language";
export const normalizeLandingLanguage = (value) => (value === "ar" ? "ar" : "en");

const getInitialLanguage = () => {
  if (typeof window === "undefined") {
    return DEFAULT_LANGUAGE;
  }

  return normalizeLandingLanguage(window.localStorage.getItem(LANDING_LANGUAGE_KEY));
};

export const applyLandingLanguageToDocument = (language) => {
  if (typeof document === "undefined") {
    return;
  }

  const normalizedLanguage = normalizeLandingLanguage(language);
  document.documentElement.lang = normalizedLanguage;
  document.documentElement.dir = normalizedLanguage === "ar" ? "rtl" : "ltr";
};

const landingI18n = createInstance();

landingI18n.use(initReactI18next).init({
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

applyLandingLanguageToDocument(landingI18n.resolvedLanguage || landingI18n.language);

landingI18n.on("languageChanged", (language) => {
  const normalizedLanguage = normalizeLandingLanguage(language);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(LANDING_LANGUAGE_KEY, normalizedLanguage);
  }

  applyLandingLanguageToDocument(normalizedLanguage);
});

export default landingI18n;
