import React, { useState,useEffect } from "react";
import logo from "./synergybig.png";
import api from "../utils/axiosInstance";
import { useNavigate } from "react-router-dom";
import BrandLogo from "../components/brandlogo";
import { useTranslation } from "react-i18next";
const ROUTE_PRIORITY = [
  { module: "dashboard", path: "/overview" },
  { module: "pos", path: "/pos" }, 
  { module: "sales", path: "/process" },
  { module: "refunds", path: "/refund" },
  { module: "einvoicing", path: "/unshared" },
  { module: "items", path: "/items" },
  { module: "stock_management", path: "/storage" },
  { module: "clients", path: "/clients" },
  { module: "receipts", path: "/receipts" },
  { module: "reports", path: "/reports" },
  { module: "users", path: "/activity" },
  { module: "company_config", path: "/company" }
];

export default function Login({ onLogin }) {
  const [username, setUser] = useState("");
  const [password, setPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tenantCode, setTenantCode] = useState("");
const [rememberMe, setRememberMe] = useState(false);
const [showPlanExpired, setShowPlanExpired] = useState(false);
const [submitted, setSubmitted] = useState(false);
const { t, i18n } = useTranslation();

const changeLang = (lang) => {
  i18n.changeLanguage(lang);
  localStorage.setItem("lang", lang);
};

const [fieldErrors, setFieldErrors] = useState({
  tenantCode: "",
  username: "",
  password: ""
});

const navigate = useNavigate();


useEffect(() => {
  const reason = localStorage.getItem("logout_reason");

  if (reason === "PLAN_EXPIRED") {
    setShowPlanExpired(true);
    localStorage.removeItem("logout_reason");
  }
}, []);

const submitLogin = async () => {
  setSubmitted(true);
  setError("");

  const errors = {
    tenantCode: "",
    username: "",
    password: ""
  };

  if (!tenantCode.trim()) errors.tenantCode = "Tenant code is required";
  if (!username.trim()) errors.username = "Username is required";
  if (!password.trim()) errors.password = "Password is required";

  setFieldErrors(errors);

  // ❌ Stop here if any field is missing
  if (errors.tenantCode || errors.username || errors.password) {
    return;
  }

  setLoading(true);

  try {
    const res = await api.post("/api/users/login", {
      tenant_code: tenantCode,
      username,
      password,
      rememberMe
    });

    localStorage.setItem("token", res.data.token);

    const fullName =
      res.data.full_name || res.data.user?.full_name || "";
    const perms =
      res.data.permissions || res.data.user?.permissions || null;

    localStorage.setItem("full_name", fullName);

    if (perms) {
      localStorage.setItem("permissions", JSON.stringify(perms));

    }
    const permissions =
      perms && typeof perms === "object" ? perms : {};

    const firstAllowedRoute = ROUTE_PRIORITY.find(
      r => permissions?.[r.module]?.view === true
    );

    if (!firstAllowedRoute) {
      setError("You do not have access to any module.");
      return;
    }

    navigate(firstAllowedRoute.path, { replace: true });

  } catch (err) {
    if (
      err.response?.status === 403 &&
      err.response?.data?.code === "PLAN_EXPIRED"
    ) {
      setLoading(false);
      setShowPlanExpired(true);
      return;
    }

    // ✅ All fields were filled, but credentials are wrong
    setError("Invalid tenant code, username, or password");

  } finally {
    setLoading(false);
  }
};


  return (
    <div className="relative h-screen w-screen overflow-hidden bg-white flex items-center justify-center">

      {/* Floating Bright Blur Orbs */}
      <div className="absolute w-[600px] h-[600px] bg-[#2f788a]/40 blur-[180px] rounded-full top-[-150px] left-[-150px] animate-orb1"></div>
      <div className="absolute w-[500px] h-[500px] bg-[#00d4b3]/30 blur-[160px] rounded-full bottom-[-200px] right-[-150px] animate-orb2"></div>

      {/* Tiny floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(40)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-[#2f788a] opacity-30 rounded-full animate-particle"
            style={{
              width: Math.random() * 4 + 2 + "px",
              height: Math.random() * 4 + 2 + "px",
              top: Math.random() * 100 + "%",
              left: Math.random() * 100 + "%",
              animationDuration: Math.random() * 6 + 4 + "s",
              animationDelay: Math.random() * 3 + "s"
            }}
          ></div>
        ))}
      </div>

      {/* Main Login Card */}
      <div className="flex flex-col items-center">
      <div  className="relative z-10 w-[420px] px-10 pb-6 rounded-3xl bg-white/80 backdrop-blur-2xl shadow-2xl border border-white/60 animate-slideUp">

      <div className="w-full  flex flex-col items-center text-center mb-2 mt-2">
        <img
          src={logo}
          alt="Logo"
          className="w-60 object-contain select-none pointer-events-none"
        />
      </div>



        {/* Errors */}
        {error && (
          <div className="mb-3 text-center text-red-500 font-semibold animate-fadeIn">
            {error}
          </div>
        )}

        {/* Inputs */}


        <div className="space-y-5">
           <div className="flex flex-col">
                  <input
className={`w-full px-4 py-3 bg-white/60 border rounded-xl shadow-sm transition-all text-gray-700
  ${submitted && fieldErrors.tenantCode
    ? "border-red-500 focus:border-red-500 focus:shadow-[0_0_12px_#ef4444]"
    : "border-gray-300 focus:border-[#2f788a] focus:shadow-[0_0_12px_#2f788a]"
  }`}
  placeholder={t("Login.placeholders.tenant_code")}
  value={tenantCode}
  onChange={(e) => setTenantCode(e.target.value)}
/>
{submitted && fieldErrors.tenantCode && (
  <span className="mt-1 text-xs text-red-500">
    {fieldErrors.tenantCode}
  </span>
)}

</div>
          <div className="flex flex-col">
            <input
className={`w-full px-4 py-3 bg-white/60 border rounded-xl shadow-sm transition-all text-gray-700
  ${submitted && fieldErrors.username
    ? "border-red-500 focus:border-red-500 focus:shadow-[0_0_12px_#ef4444]"
    : "border-gray-300 focus:border-[#2f788a] focus:shadow-[0_0_12px_#2f788a]"
  }`}
              placeholder={t("Login.placeholders.username")}
              value={username}
              onChange={(e) => setUser(e.target.value)}
            />
            {submitted && fieldErrors.username && (
  <span className="mt-1 text-xs text-red-500">
    {fieldErrors.username}
  </span>
)}

          </div>

          <div className="flex flex-col">
            <input
              type="password"
className={`w-full px-4 py-3 bg-white/60 border rounded-xl shadow-sm transition-all text-gray-700
  ${submitted && fieldErrors.password
    ? "border-red-500 focus:border-red-500 focus:shadow-[0_0_12px_#ef4444]"
    : "border-gray-300 focus:border-[#2f788a] focus:shadow-[0_0_12px_#2f788a]"
  }`}
              placeholder={t("Login.placeholders.password")}
              value={password}
              onChange={(e) => setPass(e.target.value)}
            />
            {submitted && fieldErrors.password && (
  <span className="mt-1 text-xs text-red-500">
    {fieldErrors.password}
  </span>
)}

          </div>

        </div>

        {/* Login Button */}
        <button
          onClick={submitLogin}
          disabled={loading}
          className="mt-7 w-full py-3 bg-[#285e82] hover:bg-[#1f5475] text-white rounded-xl shadow-lg font-semibold tracking-wide transition-all flex justify-center items-center disabled:opacity-60"
        >
          {loading ? (
            <div className="animate-spin w-6 h-6 border-4 border-white border-t-transparent rounded-full"></div>
          ) : (
            t("Login.actions.login")
          )}
        </button>
<div className="flex items-center gap-2 mt-3">
  <input
    type="checkbox"
    className="checkbox border-[#285e82] checkbox-sm"
    checked={rememberMe}
    onChange={(e) => setRememberMe(e.target.checked)}
  />
  <span className="text-sm text-gray-600">
    {t("Login.actions.remember_me")}
  </span>
</div>

<div dir="ltr" className="text-center text-xs text-gray-700 flex items-center justify-center gap-2 mt-10">
  <span className="text-gray-500">
    Powered by 
  </span>

  <BrandLogo size={18} />

  <span className="font-semibold tracking-wide">
    INNOVATION ELEMENTS™
  </span>
</div>
{showPlanExpired && (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center ">
    <div className="bg-white rounded-2xl p-6 w-[420px] shadow-2xl text-center">
      <h2 className="text-xl font-bold text-error mb-3">
        {t("Login.plan_expired.title")}
      </h2>

      <p className="text-gray-600 mb-6">
{t("Login.plan_expired.message")}
      </p>

      <button
        className="btn btn-error w-full"
        onClick={() => setShowPlanExpired(false)}
      >
        {t("Login.actions.ok")}
      </button>
    </div>
  </div>
)}


      </div>
      {/* Lang Switch Card */}
      <div
        dir="ltr"
        className="relative z-10 mt-4 w-[180px] items-center px-6 py-4 rounded-2xl border border-white/60 bg-white/70 backdrop-blur-2xl shadow-xl animate-slideUp"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => changeLang("en")}
              className={`px-4 py-2 rounded-xl text-sm border transition
                ${i18n.language === "en"
                  ? "bg-[#2f788a] text-white border-[#2f788a]"
                  : "bg-white/60 text-gray-700 border-gray-200 hover:bg-white"}
              `}
            >
              EN
            </button>

            <button
              onClick={() => changeLang("ar")}
              className={`px-4 py-2 rounded-xl text-sm border transition
                ${i18n.language === "ar"
                  ? "bg-[#2f788a] text-white border-[#2f788a]"
                  : "bg-white/60 text-gray-700 border-gray-200 hover:bg-white"}
              `}
            >
              العربية
            </button>
          </div>
        </div>
      </div>

      </div>
      {/* Animations */}
      <style>{`
        @keyframes slideUp {
          0% { opacity: 0; transform: translateY(50px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-slideUp {
          animation: slideUp 1s ease forwards;
        }

        @keyframes orbFloat1 {
          0%, 100% { transform: scale(1) translateY(0px); }
          50% { transform: scale(1.1) translateY(40px); }
        }
        .animate-orb1 {
          animation: orbFloat1 10s ease-in-out infinite;
        }

        @keyframes orbFloat2 {
          0%, 100% { transform: scale(1.1) translateY(0px); }
          50% { transform: scale(0.95) translateY(-40px); }
        }
        .animate-orb2 {
          animation: orbFloat2 12s ease-in-out infinite;
        }

        @keyframes particleFloat {
          0% { transform: translateY(0px); opacity: 0.5; }
          50% { opacity: 1; }
          100% { transform: translateY(-120px); opacity: 0; }
        }
        .animate-particle {
          animation: particleFloat linear infinite;
        }

        @keyframes logoFloat {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-12px) scale(1.03); }
        }
        .animate-logoFloat {
          animation: logoFloat 4s ease-in-out infinite;
        }

        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn .4s ease-in-out;
        }
      `}</style>
    </div>
  );
}
