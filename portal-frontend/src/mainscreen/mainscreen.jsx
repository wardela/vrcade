import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { usePortalLanguage } from "../i18n/usePortalLanguage";
import DashboardScreen from "./dashboard/DashboardScreen";
import CreateInvoiceScreen from "./create-invoice/CreateInvoiceScreen";
import InvoicesScreen from "./invoices/InvoicesScreen";
import POSMonitoringScreen from "./monitoring/POSMonitoringScreen";
import ReportsScreen from "./reports/reportsscreen";
import StatisticsScreen from "./statistics/StatisticsScreen";

const REPORTS_DESKTOP_QUERY = "(min-width: 1024px)";
const SIDEBAR_STYLE = {
  background:
    "linear-gradient(180deg, rgb(var(--app-surface-rgb) / 0.98) 0%, rgb(var(--app-surface-alt-rgb) / 0.96) 100%)",
};
const PANEL_STYLE = {
  boxShadow: "var(--app-shadow)",
};
const STRONG_PANEL_STYLE = {
  boxShadow: "var(--app-shadow-lg)",
};
const PRIMARY_BUTTON_STYLE = {
  background:
    "linear-gradient(135deg, rgb(var(--app-accent-rgb)) 0%, rgb(31 95 112) 100%)",
  boxShadow: "0 18px 38px -24px rgb(var(--app-accent-rgb) / 0.45)",
};

export default function MainScreen({ session, onLogout }) {
  const { t } = useTranslation();
  const { isRTL } = usePortalLanguage();
  const [activeModule, setActiveModule] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [moduleRefreshTick, setModuleRefreshTick] = useState(0);
  const [reportsAvailable, setReportsAvailable] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.matchMedia(REPORTS_DESKTOP_QUERY).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const mediaQuery = window.matchMedia(REPORTS_DESKTOP_QUERY);
    const updateAvailability = (event) => {
      setReportsAvailable(event.matches);
    };

    setReportsAvailable(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updateAvailability);
      return () => mediaQuery.removeEventListener("change", updateAvailability);
    }

    mediaQuery.addListener(updateAvailability);
    return () => mediaQuery.removeListener(updateAvailability);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [activeModule]);

  const modules = useMemo(
    () => [
      { id: "dashboard", label: t("portalShell.modules.dashboard") },
      { id: "statistics", label: t("portalShell.modules.statistics") },
      { id: "monitoring", label: t("portalShell.modules.monitoring") },
      { id: "create-invoice", label: t("portalShell.modules.create_invoice") },
      { id: "invoices", label: t("portalShell.modules.invoices") },
      { id: "reports", label: t("portalShell.modules.reports") },
    ],
    [t]
  );

  const availableModules = modules.filter(
    (module) => module.id !== "reports" || reportsAvailable
  );

  useEffect(() => {
    if (activeModule === "reports" && !reportsAvailable) {
      setActiveModule("dashboard");
    }
  }, [activeModule, reportsAvailable]);

  const currentModule =
    availableModules.find((module) => module.id === activeModule) || availableModules[0];

  const handleRefresh = () => {
    setModuleRefreshTick((value) => value + 1);
  };

  const currentModuleLabel = currentModule?.label || t("portalShell.modules.dashboard");
  const companyName = session.tenant?.company_name || t("portalBrand.portal_name");
  const userName =
    session.user?.full_name || session.user?.username || t("portalShell.fallback_user");
  const contentKey = `${activeModule}-${moduleRefreshTick}`;

  const renderModuleContent = () => {
    if (activeModule === "dashboard") {
      return <DashboardScreen key={contentKey} />;
    }

    if (activeModule === "statistics") {
      return <StatisticsScreen key={contentKey} />;
    }

    if (activeModule === "monitoring") {
      return <POSMonitoringScreen key={contentKey} session={session} />;
    }

    if (activeModule === "create-invoice") {
      return <CreateInvoiceScreen key={contentKey} session={session} />;
    }

    if (activeModule === "invoices") {
      return <InvoicesScreen key={contentKey} session={session} />;
    }

    if (activeModule === "reports") {
      return <ReportsScreen key={contentKey} />;
    }

    return (
      <div className="flex flex-col gap-5" key={contentKey}>
        <div>
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-app-accent">
            {t("portalBrand.portal_name")}
          </p>
          <h3 className="mt-2 text-xl font-semibold text-app-text">{currentModuleLabel}</h3>
        </div>

        <div className="flex min-h-[320px] items-center justify-center rounded-[24px] border border-dashed border-app-border bg-app-surface-alt/70 px-6 text-center text-base font-medium text-app-muted">
          {t("portalShell.coming_soon", { module: currentModuleLabel })}
        </div>
      </div>
    );
  };

  const navItemClass = (isActive) =>
    [
      "group flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-start text-sm font-medium transition-all duration-200",
      isActive
        ? "border-app-accent/25 bg-app-surface text-app-text shadow-app-sm"
        : "border-transparent text-app-muted hover:border-app-border hover:bg-app-surface/80 hover:text-app-text",
    ].join(" ");

  return (
    <main className="min-h-screen px-4 py-4 font-sans sm:px-6 sm:py-6">
      <div
        className={`mx-auto flex w-full max-w-[1220px] flex-col items-stretch gap-5 md:flex-row md:items-start ${
          isRTL ? "md:flex-row-reverse" : ""
        }`}
      >
        <div
          className={`fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-[2px] transition-opacity duration-200 md:hidden ${
            sidebarOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
          }`}
          onClick={() => setSidebarOpen(false)}
        />

        <aside
          className={`fixed inset-y-0 z-50 flex h-screen w-[min(84vw,310px)] flex-col gap-5 border border-app-border px-4 py-5 shadow-app-lg backdrop-blur-xl transition-transform duration-200 md:sticky md:top-6 md:z-auto md:h-[calc(100vh-3rem)] md:w-[290px] md:flex-none md:self-start md:translate-x-0 md:rounded-[28px] ${
            isRTL ? "right-0 md:right-auto" : "left-0 md:left-auto"
          } ${
            sidebarOpen ? "translate-x-0" : isRTL ? "translate-x-full" : "-translate-x-full"
          }`}
          style={{ ...SIDEBAR_STYLE, ...STRONG_PANEL_STYLE }}
        >
          <div className="rounded-[24px] border border-app-border bg-app-surface/80 px-4 py-4">
            <div className="min-w-0">
              <p className="text-[0.72rem] font-bold tracking-[0.08em] text-app-accent">
                Fawtartak Portal
              </p>
              <h1 className="mt-1 truncate text-lg font-semibold text-app-text">
                {companyName}
              </h1>
            </div>
          </div>

          <nav className="grid gap-2.5">
            {availableModules.map((module) => {
              const isActive = activeModule === module.id;

              return (
                <button
                  key={module.id}
                  type="button"
                  className={navItemClass(isActive)}
                  onClick={() => setActiveModule(module.id)}
                >
                  <span>{module.label}</span>
                  <span
                    className={`h-2.5 w-2.5 rounded-full transition-colors ${
                      isActive
                        ? "bg-app-accent"
                        : "bg-app-border group-hover:bg-app-accent/45"
                    }`}
                  />
                </button>
              );
            })}
          </nav>

          <div className="mt-auto grid gap-4 rounded-[24px] border border-app-border bg-app-surface-alt/80 p-4">
            <div>
              <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-app-faint">
                {t("portalShell.language.label")}
              </p>
              <LanguageSwitcher className="w-full justify-between" />
            </div>

            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-app-faint">
              {t("portalShell.signed_in")}
            </p>
            <p className="mt-2 truncate text-sm font-semibold text-app-text">{userName}</p>
            <button
              className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-app-border bg-app-surface px-4 text-sm font-semibold text-app-text shadow-app-sm transition hover:-translate-y-0.5 hover:border-app-accent/20 hover:text-app-accent"
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
            >
              {t("portalShell.actions.log_out")}
            </button>
          </div>
        </aside>

        <section className="flex w-full min-w-0 flex-1 flex-col gap-4">
          <header
            className="sticky top-4 z-30 grid w-full grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-3 rounded-[22px] border border-app-border bg-app-surface/90 px-3 py-2 shadow-app backdrop-blur-sm md:hidden"
            style={PANEL_STYLE}
          >
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-transparent text-app-text transition hover:border-app-border hover:bg-app-surface-alt/80"
              onClick={() => setSidebarOpen(true)}
              aria-label={t("portalShell.actions.open_menu")}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            <h2 className="truncate text-center text-[0.82rem] font-extrabold uppercase tracking-[0.18em] text-app-text">
              FAWTARTAK
            </h2>

            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-transparent text-app-text transition hover:border-app-border hover:bg-app-surface-alt/80"
              onClick={handleRefresh}
              aria-label={t("portalShell.actions.refresh_module", {
                module: currentModuleLabel,
              })}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M20 12a8 8 0 1 1-2.34-5.66M20 4v5h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </header>

          <section
            className="w-full min-w-0 overflow-visible rounded-[28px] border border-app-border bg-app-surface/95 p-4 shadow-app backdrop-blur-sm sm:p-5"
            style={PANEL_STYLE}
          >
            {renderModuleContent()}
          </section>
        </section>
      </div>

      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/28 p-4 backdrop-blur-sm"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="w-full max-w-[420px] rounded-[28px] border border-app-border bg-app-surface/95 p-6 shadow-app-lg"
            style={STRONG_PANEL_STYLE}
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-xl font-semibold text-app-text">
              {t("portalShell.logout.title")}
            </h3>
            <p className="mt-2 text-sm leading-6 text-app-muted">
              {t("portalShell.logout.message")}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-app-border bg-app-surface px-4 text-sm font-semibold text-app-text transition hover:-translate-y-0.5 hover:bg-app-surface-alt/80"
                onClick={() => setShowLogoutConfirm(false)}
              >
                {t("portalShell.actions.cancel")}
              </button>
              <button
                type="button"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl px-4 text-sm font-semibold text-white transition hover:-translate-y-0.5"
                style={PRIMARY_BUTTON_STYLE}
                onClick={onLogout}
              >
                {t("portalShell.actions.log_out")}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
