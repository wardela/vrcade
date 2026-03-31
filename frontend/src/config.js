// src/config.js
// In development, leave baseURL empty so requests like /api/... go through Vite proxy.
// In production, use VITE_API_BASE_URL when provided, else fallback to hosted backend.
const SERVER_IP = "http://82.29.179.227:8082";
const configuredApiBase = import.meta.env.VITE_API_BASE_URL?.trim();

export const BASE_URL = import.meta.env.DEV
  ? ""
  : configuredApiBase || SERVER_IP;
