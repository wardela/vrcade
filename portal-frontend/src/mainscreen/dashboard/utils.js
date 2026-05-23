import { getPortalLanguage, getPortalLocale, formatPortalDate, formatPortalNumber } from "../../utils/portalFormatting";

export const TIME_ZONE = "Asia/Amman";

const getPortalCurrencyLabel = () => (getPortalLanguage() === "ar" ? "د.أ" : "JD");

export const getJordanToday = () => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
};

export const getCurrentYearStart = () => `${getJordanToday().slice(0, 4)}-01-01`;

export const money = (value) =>
  `${formatPortalNumber(value, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }, getPortalLocale())} ${getPortalCurrencyLabel()}`;

export const compactMoney = (value) => {
  const numericValue = Number(value || 0);

  return formatPortalNumber(numericValue, {
    notation: Math.abs(numericValue) >= 1000 ? "compact" : "standard",
    maximumFractionDigits: Math.abs(numericValue) >= 1000 ? 1 : 2,
    minimumFractionDigits: Math.abs(numericValue) >= 1000 ? 0 : 2,
  }, getPortalLocale());
};

export const formatHourLabel = (hourIndex) =>
  formatPortalDate(new Date(`2026-01-01T${String(hourIndex).padStart(2, "0")}:00:00`), {
    hour: "numeric",
    hour12: true,
    timeZone: TIME_ZONE,
  }, getPortalLocale());

const normalizeDateValue = (value, defaultTime = "T12:00:00") => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const normalized = String(value).trim();
  if (!normalized) {
    return null;
  }

  const candidate = /^\d{4}-\d{2}-\d{2}$/.test(normalized)
    ? new Date(`${normalized}${defaultTime}`)
    : new Date(normalized);

  return Number.isNaN(candidate.getTime()) ? null : candidate;
};

export const formatDayLabel = (dateString) => {
  const dateValue = normalizeDateValue(dateString);

  if (!dateValue) {
    return String(dateString || "-");
  }

  return formatPortalDate(dateValue, {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: TIME_ZONE,
  }, getPortalLocale());
};

export const formatDayMonthLabel = (dateString) => {
  const dateValue = normalizeDateValue(dateString);

  if (!dateValue) {
    return String(dateString || "-");
  }

  return formatPortalDate(dateValue, {
    day: "numeric",
    month: "short",
    timeZone: TIME_ZONE,
  }, getPortalLocale());
};

export const formatMonthLabel = (dateString) => {
  const dateValue = normalizeDateValue(dateString);

  if (!dateValue) {
    return String(dateString || "-");
  }

  return formatPortalDate(dateValue, {
    month: "short",
    year: "2-digit",
    timeZone: TIME_ZONE,
  }, getPortalLocale());
};

export const formatMonthNameLabel = (dateString) => {
  const dateValue = normalizeDateValue(dateString);

  if (!dateValue) {
    return String(dateString || "-");
  }

  return formatPortalDate(dateValue, {
    month: "short",
    timeZone: TIME_ZONE,
  }, getPortalLocale());
};

export const formatMonthShortYearLabel = (dateString) => {
  const dateValue = normalizeDateValue(dateString);

  if (!dateValue) {
    return String(dateString || "-");
  }

  return formatPortalDate(dateValue, {
    month: "short",
    year: "2-digit",
    timeZone: TIME_ZONE,
  }, getPortalLocale());
};

export const formatShortDate = (dateString) => {
  const dateValue = normalizeDateValue(dateString, "T00:00:00");

  if (!dateValue) {
    return String(dateString || "-");
  }

  return formatPortalDate(dateValue, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: TIME_ZONE,
  }, getPortalLocale());
};

export const formatStatusLabel = (status) =>
  String(status || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase()) || "Unknown";
