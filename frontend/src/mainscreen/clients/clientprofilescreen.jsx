import { useState } from "react";
import ClientProfileMain from "./profilemaintab";
import ClientProfileHistory from "./profilehistorytab";
import ClientProfileStats from "./profilestatstab";
import { useTranslation } from "react-i18next";

export default function ClientProfileScreen({ client, onBack }) {
  const [activeTab, setActiveTab] = useState("main");
  const {t} = useTranslation();
  // ===== Permissions =====
let permissions = {};
try {
  const raw = localStorage.getItem("permissions");
  permissions = raw ? JSON.parse(raw) : {};
} catch {
  permissions = {};
}

const clientPerm = permissions?.clients || {};
const canEditClient = clientPerm.edit === true;

  return (
    <div className="flex flex-col w-full h-screen bg-base-200">

      {/* Header */}
      <div className="flex items-center gap-4 border-b bg-white px-4 py-3">
        <button
          onClick={onBack}
          className="px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-100 text-sm"
        >
           {t("ClientProfileScreen.actions.back")}
        </button>

        <div className="flex flex-col">
          <span className="text-lg font-semibold text-gray-700">
            {client?.name || t("ClientProfileScreen.title.default")}
          </span>
          <span className="text-sm text-gray-500">
            {t("ClientProfileScreen.title.subtitle")}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 px-6 pt-2 border-b bg-white">
        <TabButton
          label={t("ClientProfileScreen.tabs.main")}
          active={activeTab === "main"}
          onClick={() => setActiveTab("main")}
        />
        <TabButton
          label={t("ClientProfileScreen.tabs.history")}
          active={activeTab === "history"}
          onClick={() => setActiveTab("history")}
        />
      </div>

      {/* Content */}
      <div className="flex-1 p-3 w-full overflow-hidden">
        {activeTab === "main" && (
          <ClientProfileMain
            client={client}
            canEditClient={canEditClient}
          />
        )}
        {activeTab === "history" && <ClientProfileHistory client={client} />}
        {activeTab === "stats" && <ClientProfileStats client={client} />}
      </div>
    </div>
  );
}

/* ---------------- Tab Button ---------------- */

function TabButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        pb-3 px-1 text-sm font-medium
        ${active
          ? "border-b-2 border-[#2f788a] text-[#2f788a]"
          : "text-gray-500 hover:text-gray-700"}
      `}
    >
      {label}
    </button>
  );
}
