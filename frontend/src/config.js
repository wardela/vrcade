// src/config.js
// Shared API host helpers used by both the frontend runtime and Vite dev proxy.
const DEFAULT_SERVER_IP = "http://localhost:3002";

export const normalizeApiUrl = (value) =>
  String(value || "").trim().replace(/\/+$/, "");

export const getServerIp = (env = {}) =>
  normalizeApiUrl(env.VITE_SERVER_IP || DEFAULT_SERVER_IP) || DEFAULT_SERVER_IP;

export const getBaseUrl = (env = {}) => {
  const configuredApiBase = normalizeApiUrl(env.VITE_API_BASE_URL);

  // In development, leave baseURL empty so requests like /api/... go through Vite proxy.
  // In production, use VITE_API_BASE_URL when provided, else fallback to the shared server IP.
  return env.DEV ? "" : configuredApiBase || getServerIp(env);
};

const runtimeEnv =
  typeof import.meta !== "undefined" ? (import.meta.env || {}) : {};

export const SERVER_IP = getServerIp(runtimeEnv);
export const BASE_URL = getBaseUrl(runtimeEnv);
