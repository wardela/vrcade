import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import MainScreen from "./mainscreen/mainscreen";
import Login from "./mainscreen/login";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getDirFromLang } from "./utils/lang";
import api from "./utils/axiosInstance";
import { clearStoragePreservingTheme } from "./theme/ThemeProvider";

export default function App() {
  const { i18n } = useTranslation();
  const [sessionExpired, setSessionExpired] = useState(false);

  // ==========================================
  // LANGUAGE / DIRECTION (UNCHANGED)
  // ==========================================
  useEffect(() => {
    const dir = getDirFromLang(i18n.language);
    document.documentElement.dir = dir;
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  // ==========================================
  // TOKEN EXPIRED (FROM AXIOS INTERCEPTOR)
  // ==========================================
  
  useEffect(() => {
    const handleSessionExpired = () => {
      clearStoragePreservingTheme(localStorage);
      sessionStorage.clear();
      setSessionExpired(true);
    };

    window.addEventListener("session-expired", handleSessionExpired);
    return () =>
      window.removeEventListener("session-expired", handleSessionExpired);
  }, []);

  // ==========================================
  // FORCE LOGOUT (PLAN EXPIRED)
  // ==========================================
  useEffect(() => {
const handleForceLogout = () => {
  clearStoragePreservingTheme(localStorage);

  // 👇 tell login WHY we were logged out
  localStorage.setItem("logout_reason", "PLAN_EXPIRED");

  window.location.replace("/#/login");
};


    window.addEventListener("force-logout", handleForceLogout);
    return () =>
      window.removeEventListener("force-logout", handleForceLogout);
  }, []);

  // ==========================================
  // 🔐 PERIODIC TOKEN CHECK (EVERY 10 MINUTES)
  // SAME AS CLINIC APP LOGIC
  // ==========================================
useEffect(() => {
  const interval = setInterval(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const expired = payload.exp * 1000 < Date.now();

      if (expired) {
        clearStoragePreservingTheme(localStorage);
        sessionStorage.clear();
        setSessionExpired(true);
        clearInterval(interval);
      }
    } catch {
      clearStoragePreservingTheme(localStorage);
      sessionStorage.clear();
      setSessionExpired(true);
      clearInterval(interval);
    }
  }, 60_000); // every 1 minute

  return () => clearInterval(interval);
}, []);
useEffect(() => {
  const checkTenantStatus = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await api.get("/api/session/status");

      // optional extra safety if backend returns active flag
      if (res.data?.active === false) {
        clearStoragePreservingTheme(localStorage);
        sessionStorage.clear();
        window.dispatchEvent(new Event("force-logout"));
      }
    } catch (err) {
      // ❗ DO NOTHING
      // - PLAN_EXPIRED handled in axios interceptor
      // - TOKEN_EXPIRED handled in axios interceptor
      // - Network errors should not log users out
    }
  };

  checkTenantStatus();
  const interval = setInterval(checkTenantStatus, 60_000); // every 1 minute

  return () => clearInterval(interval);
}, []);
  return (
    <Router>

      {/* ================= SESSION EXPIRED POPUP ================= */}
      {sessionExpired && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
          <div className="bg-base-100 rounded-xl p-6 w-96 shadow-xl text-center">
            <h2 className="text-xl font-bold text-error mb-3">
              Session Expired
            </h2>
            <p className="text-gray-600 mb-6">
              Your session has expired. Please log in again.
            </p>
            <button
              className="btn btn-success w-full"
              onClick={() => {
                setSessionExpired(false);
                window.location.href = "/#/login";
              }}
            >
              Go to Login
            </button>
          </div>
        </div>
      )}

      <Routes>

        {/* Default route → always go to login */}
<Route
  path="/"
  element={
    localStorage.getItem("token") &&
localStorage.getItem("permissions")
 ? (
      <Navigate to="/overview" replace />
    ) : (
      <Navigate to="/login" replace />
    )
  }
/>

        {/* Login page */}
        <Route path="/login" element={<Login />} />

        {/* Main app (auth enforced by checker + axios) */}
        <Route path="/*" element={<MainScreen />} />

      </Routes>
    </Router>
  );
}
