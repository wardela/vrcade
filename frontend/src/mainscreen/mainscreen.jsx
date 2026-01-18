import React, { useState } from "react";
import { NavLink, Routes, Route, Navigate, useLocation } from "react-router-dom";
import SynergyLogo from './IElogo.png';
import Overview from "./overview/dashboard";
import Invoices from "./invoices/invoices";
import UnsharedInvoices from "./invoices/unshared";
import UsersScreen from "./users/UsersScreen";
import ItemsScreen from "./storage/itemsscreen";
import StorageMonitor from "./storage/StorageMonitor";
import ClientsScreen from "./clients/clientsscreen";
import RefundInvoices from "./invoices/refundinvoices";
import CompanyConfig from "./systemconfig/systemconfig";
import ReportsScreen from "./reports/reportsscreen";
import Settings from "./settings/settings";
import { useTranslation } from "react-i18next";

const MainScreen = () => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const location = useLocation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
const [loggingOut, setLoggingOut] = useState(false);
const { t } = useTranslation();

const logout = () => {
  window.location.hash = "#/login";
};

let permissions = {};

try {
const raw = localStorage.getItem("permissions");
  permissions = raw ? JSON.parse(raw) : {};
} catch {
  permissions = {};
}


  const canView = (module) => permissions?.[module]?.view === true;

  const firstAllowedRoute = (() => {
  const order = [
    { module: "dashboard", path: "/overview" },
    { module: "sales", path: "/process" },
    { module: "refunds", path: "/refund" },
    { module: "einvoicing", path: "/unshared" },
    { module: "items", path: "/items" },
    { module: "stock_management", path: "/storage" },
    { module: "clients", path: "/clients" },
    { module: "reports", path: "/reports" },
    { module: "users", path: "/activity" },
    { module: "company_config", path: "/company" }
  ];

  return order.find(r => permissions?.[r.module]?.view)?.path || "/login";
})();

  return (
    <div
      className="flex max-h-screen"
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <div className="relative flex h-full w-full">
        {/* Sidebar */}
        <div
          className={`absolute top-0 flex flex-col bg-gray-600 text-white border-[#2f788a] h-full transition-all duration-150 z-50
            ${isCollapsed ? "w-[70px]" : "w-60"} start-0 border-e overflow-hidden`}
          onMouseEnter={() => setIsCollapsed(false)}
          onMouseLeave={() => setIsCollapsed(true)}
        >
          {/* Logo */}
<div className="h-20 border-b border-gray-500 mb-2 bg-white flex items-center justify-center overflow-hidden">
  {isCollapsed ? (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className="w-6 h-6 text-gray-600"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m5.25 4.5 7.5 7.5-7.5 7.5m6-15 7.5 7.5-7.5 7.5"
      />
    </svg>
  ) : (
    <img
      src={SynergyLogo}
      alt="Synergy Software Solutions"
      className="
        max-h-24
        max-w-[240px]
        object-contain
        transition-all duration-200
      "
    />
  )}
</div>



          {/* Menu Items */}
          <ul className="w-full space-y-2">
            {canView("dashboard") && (
            <NavLink
              to="/overview"
              className={({ isActive }) =>
                `flex items-center justify-between w-full transition-colors hover:bg-gray-500 relative gap-2 px-3 py-2 ps-6
                 ${isActive ? "before:absolute before:start-0 before:top-0 before:h-full before:w-1 before:bg-[#2f788a] bg-gray-500" : ""}`
              }
            >
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
                </svg>
                <span
                  className={`whitespace-nowrap transition-all duration-200 
                  ${isCollapsed ? "opacity-0 translate-x-[-10px] w-0" : "opacity-100 translate-x-0 w-auto"}`}
                >
{t("sidebar.dashboard")}
                </span>

              </div>
            </NavLink>
            )}
            {canView("sales") && (
            <NavLink
              to="/process"
              className={({ isActive }) =>
                `flex items-center justify-between w-full transition-colors hover:bg-gray-500 relative gap-2 px-3 py-2 ps-6
                 ${isActive ? "before:absolute before:start-0 before:top-0 before:h-full before:w-1 before:bg-[#2f788a] bg-gray-500" : ""}`
              }
            >
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v7.5m2.25-6.466a9.016 9.016 0 0 0-3.461-.203c-.536.072-.974.478-1.021 1.017a4.559 4.559 0 0 0-.018.402c0 .464.336.844.775.994l2.95 1.012c.44.15.775.53.775.994 0 .136-.006.27-.018.402-.047.539-.485.945-1.021 1.017a9.077 9.077 0 0 1-3.461-.203M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>

                <span
                  className={`whitespace-nowrap transition-all duration-200 
                  ${isCollapsed ? "opacity-0 translate-x-[-10px] w-0" : "opacity-100 translate-x-0 w-auto"}`}
                >
                  {t("sidebar.invoices")}
                </span>
              </div>
            </NavLink>
            )}
            {canView("refunds") && (
            <NavLink
              to="/refund"
              className={({ isActive }) =>
                `flex items-center justify-between w-full transition-colors hover:bg-gray-500 relative gap-2 px-3 py-2 ps-6
                 ${isActive ? "before:absolute before:start-0 before:top-0 before:h-full before:w-1 before:bg-[#2f788a] bg-gray-500" : ""}`
              }
            >
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 9.75h4.875a2.625 2.625 0 0 1 0 5.25H12M8.25 9.75 10.5 7.5M8.25 9.75 10.5 12m9-7.243V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0c1.1.128 1.907 1.077 1.907 2.185Z" />
                </svg>

                <span
                  className={`whitespace-nowrap transition-all duration-200
                  ${isCollapsed ? "opacity-0 translate-x-[-10px] w-0" : "opacity-100 translate-x-0 w-auto"}`}
                >
                  {t("sidebar.refunds")}
                </span>
              </div>
            </NavLink>
            )}
            {canView("einvoicing") && (
            <NavLink
                to="/unshared"
                className={({ isActive }) =>
                  `flex items-center justify-between w-full transition-colors hover:bg-gray-500 relative gap-2 px-3 py-2 ps-6
                  ${isActive ? "before:absolute before:start-0 before:top-0 before:h-full before:w-1 before:bg-[#2f788a] bg-gray-500" : ""}`
                }
            >
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.25-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
                  </svg>
                  <span
                    className={`whitespace-nowrap transition-all duration-200
                    ${isCollapsed ? "opacity-0 translate-x-[-10px] w-0" : "opacity-100 translate-x-0 w-auto"}`}
                  >
                    {t("sidebar.unshared")}
                  </span>
                </div>
            </NavLink> 
            )}
            {canView("items") && (
            <NavLink
              to="/items"
              className={({ isActive }) =>
                `flex items-center justify-between w-full transition-colors hover:bg-gray-500 relative gap-2 px-3 py-2 ps-6
                 ${isActive ? "before:absolute before:start-0 before:top-0 before:h-full before:w-1 before:bg-[#2f788a] bg-gray-500" : ""}`
              }
            >
              <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
              </svg>
              <span
                className={`whitespace-nowrap transition-all duration-200 
                ${isCollapsed ? "opacity-0 translate-x-[-10px] w-0" : "opacity-100 translate-x-0 w-auto"}`}
              >
                {t("sidebar.items")}
              </span>

              </div>
            </NavLink>
            )}
            {canView("stock_management") && (
            <NavLink
              to="/storage"
              className={({ isActive }) =>
                `flex items-center justify-between w-full transition-colors hover:bg-gray-500 relative gap-2 px-3 py-2 ps-6
                 ${isActive ? "before:absolute before:start-0 before:top-0 before:h-full before:w-1 before:bg-[#2f788a] bg-gray-500" : ""}`
              }
            >
              <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
              </svg>
               <span
                className={`whitespace-nowrap transition-all duration-200 
                ${isCollapsed ? "opacity-0 translate-x-[-10px] w-0" : "opacity-100 translate-x-0 w-auto"}`}
              >
                {t("sidebar.storage")}
              </span>
              </div>
            </NavLink>
            )}
            {canView("clients") && (
            <NavLink
              to="/clients"
              className={({ isActive }) =>
                `flex items-center justify-between w-full transition-colors hover:bg-gray-500 relative gap-2 px-3 py-2 ps-6
                 ${isActive ? "before:absolute before:start-0 before:top-0 before:h-full before:w-1 before:bg-[#2f788a] bg-gray-500" : ""}`
              }
            >
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>

                <span
                  className={`whitespace-nowrap transition-all duration-200
                  ${isCollapsed ? "opacity-0 translate-x-[-10px] w-0" : "opacity-100 translate-x-0 w-auto"}`}
                >
                  {t("sidebar.clients")}
                </span>
              </div>
            </NavLink>      
            )}
            {canView("reports") && (
            <NavLink
              to="/reports"
              className={({ isActive }) =>
                `flex items-center justify-between w-full transition-colors hover:bg-gray-500 relative gap-2 px-3 py-2 ps-6
                 ${isActive ? "before:absolute before:start-0 before:top-0 before:h-full before:w-1 before:bg-[#2f788a] bg-gray-500" : ""}`
              }
            >
              <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5A3.375 3.375 0 0 0 6.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0 0 15 2.25h-1.5a2.251 2.251 0 0 0-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 0 0-9-9Z" />
              </svg>
              <span
                className={`whitespace-nowrap transition-all duration-200 
                ${isCollapsed ? "opacity-0 translate-x-[-10px] w-0" : "opacity-100 translate-x-0 w-auto"}`}
              >
                {t("sidebar.reports")}
              </span>
              </div>
            </NavLink>
            )}
          </ul>
{canView("users") && (
          <div className="mt-auto border-t border-gray-500 ">
            <NavLink
              to="/activity"
              className={({ isActive }) =>
                `flex items-center justify-between w-full transition-colors hover:bg-gray-500 relative gap-2 px-3 py-2 ps-6
                 ${isActive ? "before:absolute before:start-0 before:top-0 before:h-full before:w-1 before:bg-[#2f788a] bg-gray-500" : ""}`
              }
            >
              <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
              </svg>
              <span
                className={`whitespace-nowrap transition-all duration-200 
                ${isCollapsed ? "opacity-0 translate-x-[-10px] w-0" : "opacity-100 translate-x-0 w-auto"}`}
              >
                {t("sidebar.users")}
              </span>
              </div>
            </NavLink>

          </div>
)}
{canView("company_config") && (
          <div className=" border-t border-gray-500 ">
            <NavLink
              to="/company"
              className={({ isActive }) =>
                `flex items-center justify-between w-full transition-colors hover:bg-gray-500 relative gap-2 px-3 py-2 ps-6
                 ${isActive ? "before:absolute before:start-0 before:top-0 before:h-full before:w-1 before:bg-[#2f788a] bg-gray-500" : ""}`
              }
            >
              <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
              </svg>
              <span
                className={`whitespace-nowrap transition-all duration-200 
                ${isCollapsed ? "opacity-0 translate-x-[-10px] w-0" : "opacity-100 translate-x-0 w-auto"}`}
              >
                {t("sidebar.company")}
              </span>
              </div>
            </NavLink>

          </div>
)}{/* Settings */}
<div className="border-t border-gray-500">
  <button
    onClick={() => setIsSettingsOpen(true)}
    className="flex items-center justify-between w-full transition-colors hover:bg-gray-500 relative gap-2 px-3 py-2 ps-6"
    title="Settings"
  >
    <div className="flex items-center gap-2 text-white">
      {/* gear icon */}
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
</svg>


      {!isCollapsed && <span>{t("settings.title")}</span>}
    </div>
  </button>
</div>

          {/* logout */}
          <div className=" border-t border-gray-500 ">
<button
  onClick={() => setShowLogoutConfirm(true)}
  className="flex items-center justify-between w-full transition-colors hover:bg-gray-500 relative gap-2 px-3 py-2 ps-6 "
>
  <div className="flex items-center gap-2 text-red-400">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className="size-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15"
      />
    </svg>

    {!isCollapsed && <span>{t("sidebar.logout")}</span>}
  </div>
</button>

          </div>
        </div>

        {/* Main Body */}
        <div className="flex-grow max-h-screen ms-[70px] transition-all duration-300 bg-gray-100">
          
<Routes>
  <Route path="/" element={<Navigate to={firstAllowedRoute} replace />} />
  
<Route
  path="/overview"
  element={
    canView("dashboard")
      ? <Overview />
      : <Navigate to={firstAllowedRoute} replace />
  }
/>

  <Route
    path="/process"
    element={
      <Invoices />
    }
  />

  <Route
    path="/activity"
    element={
      <UsersScreen />
    }
  />

    <Route
    path="/unshared"
    element={
      <UnsharedInvoices />
    }
  />

  <Route
    path="/items"
    element={ <ItemsScreen/>
    }
  />

    <Route
    path="/refund"
    element={ <RefundInvoices/>
    }
  />

    <Route
    path="/clients"
    element={ <ClientsScreen/>
    }
  />
      <Route
    path="/company"
    element={ <CompanyConfig/>
    }
  />

        <Route
    path="/reports"
    element={ <ReportsScreen/>
    }
  />
  <Route path="/storage" element={<StorageMonitor />} />
</Routes>


        </div>
      </div>

{showLogoutConfirm && (
  <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-[999]">

    <div className="bg-white rounded-2xl shadow-2xl w-80 p-6 text-center border border-gray-200">

      {/* Icon */}
      <div className="flex justify-center mb-3">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-7 h-7 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.8"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M12 21a9 9 0 1 0 0-18a9 9 0 0 0 0 18Z"
            />
          </svg>
        </div>
      </div>

      {/* Title */}
      <h2 className="text-lg font-semibold text-gray-800 mb-1">
        {t("LogoutConfirm.title")}
      </h2>

      {/* Subtitle */}
      <p className="text-gray-600 text-sm mb-6">
        {t("LogoutConfirm.message")}
      </p>

      {loggingOut ? (
        <div className="py-3 text-[#2f788a] font-semibold">
           {t("LogoutConfirm.states.logging_out")}
        </div>
      ) : (
        <>

          {/* Confirm */}
          <button
            onClick={() => {
              setLoggingOut(true);
              setTimeout(() => {
              localStorage.removeItem("token");
              localStorage.removeItem("full_name");
              localStorage.removeItem("permissions");
              window.location.hash = "#/login";
              }, 800);
            }}
            className="w-full py-2.5 bg-red-600 text-white rounded-lg font-semibold shadow-sm hover:bg-red-700 transition-colors"
          >
            {t("LogoutConfirm.actions.confirm")}
          </button>

          {/* Cancel */}
          <button
            onClick={() => setShowLogoutConfirm(false)}
            className="w-full py-2.5 bg-gray-200 text-gray-800 rounded-lg font-semibold mt-3 hover:bg-gray-300 transition-colors"
          >
             {t("LogoutConfirm.actions.cancel")}
          </button>
        </>
      )}

    </div>

  </div>
)}
{isSettingsOpen && (
  <Settings onClose={() => setIsSettingsOpen(false)} />
)}
    </div>
  );
};

export default MainScreen;
