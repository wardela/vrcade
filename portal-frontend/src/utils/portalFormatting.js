import i18n, { normalizePortalLanguage } from "../i18n";

const LATIN_NUMBERING_SYSTEM = "latn";

const getDefaultBaseLocale = (language = normalizePortalLanguage(i18n.resolvedLanguage || i18n.language)) =>
  language === "ar" ? "ar-JO" : "en-US";

export const getPortalLanguage = () =>
  normalizePortalLanguage(i18n.resolvedLanguage || i18n.language);

export const resolvePortalLocale = (locale) => {
  const normalizedLocale = String(locale || "").trim().toLowerCase();

  if (!normalizedLocale) {
    return resolvePortalLocale(getDefaultBaseLocale());
  }

  if (normalizedLocale.startsWith("ar")) {
    return "ar-JO-u-nu-latn";
  }

  if (normalizedLocale === "en") {
    return "en-US";
  }

  return locale;
};

export const getPortalLocale = (language = getPortalLanguage()) =>
  resolvePortalLocale(getDefaultBaseLocale(language));

export const formatPortalNumber = (value, options = {}, locale) =>
  new Intl.NumberFormat(resolvePortalLocale(locale), {
    ...options,
    numberingSystem: LATIN_NUMBERING_SYSTEM,
  }).format(Number(value || 0));

export const formatPortalDate = (value, options = {}, locale) =>
  new Intl.DateTimeFormat(resolvePortalLocale(locale), {
    ...options,
    numberingSystem: LATIN_NUMBERING_SYSTEM,
  }).format(value);
