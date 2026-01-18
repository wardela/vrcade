import axios from "axios";
import { BASE_URL } from "../config";

let isSessionExpiredHandled = false;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000 // prevent hanging requests
});

// ======================================================
// REQUEST INTERCEPTOR
// Attach JWT token ONLY (schema comes from JWT)
// ======================================================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ======================================================
// RESPONSE INTERCEPTOR
// Global auth & plan enforcement
// ======================================================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const code = error.response?.data?.code;

    // ============================
    // PLAN EXPIRED
    // ============================
    if (status === 403 && code === "PLAN_EXPIRED") {
      localStorage.clear();
      window.dispatchEvent(new Event("force-logout"));
      return Promise.reject(error);
    }

    // ============================
    // TOKEN EXPIRED
    // ============================
    if (
      status === 401 &&
      code === "TOKEN_EXPIRED" &&
      !isSessionExpiredHandled
    ) {
      isSessionExpiredHandled = true;

      localStorage.clear();

      window.dispatchEvent(
        new CustomEvent("session-expired")
      );
    }

    return Promise.reject(error);
  }
);

export default api;
