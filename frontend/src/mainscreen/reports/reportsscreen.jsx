import { useState } from "react";
import SalesReports from "./SalesReports";
import RefundReports from "./RefundReports";
import EInvoicingReports from "./EInvoicingReports";
import StorageItemReports from "./StorageItemReports";
import PaymentTypeReports from "./PaymentTypeReports";
import { useTranslation } from "react-i18next";
export default function ReportsScreen() {
  const [tab, setTab] = useState("sales");
  const {t} = useTranslation();
  return (
    <div className="w-full flex flex-col h-full">
      {/* Header */}
      <div className="flex justify-between items-center border-b-2 border-gray-400 bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-700 tracking-wide">
          {t("ReportsScreen.title")}
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b bg-white px-6">
        <TabButton label={t("ReportsScreen.tabs.sales")} value="sales" tab={tab} setTab={setTab} />
        <TabButton label={t("ReportsScreen.tabs.refunds")} value="refunds" tab={tab} setTab={setTab} />
        <TabButton label={t("ReportsScreen.tabs.payment_types")} value="payment_types" tab={tab} setTab={setTab} />
        <TabButton label={t("ReportsScreen.tabs.tax")} value="einvoicing" tab={tab} setTab={setTab} />
        <TabButton label={t("ReportsScreen.tabs.storage")} value="storage" tab={tab} setTab={setTab} />
      </div>

      {/* Content */}
      <div className="p-2 flex-1 min-h-0">
        {tab === "sales" && <SalesReports />}
        {tab === "refunds" && <RefundReports />}
        {tab === "payment_types" && <PaymentTypeReports />}
        {tab === "einvoicing" && <EInvoicingReports />}
        {tab === "storage" && <StorageItemReports />}
      </div>
    </div>
  );
}

function TabButton({ label, value, tab, setTab }) {
  const active = tab === value;

  return (
    <button
      onClick={() => setTab(value)}
      className={`
        px-4 py-2 text-lg font-medium transition
        ${
          active
            ? "bg-[#e5f6f8] text-[#2f788a] border-b-4 border-[#2f788a]"
            : "text-gray-500 hover:text-[#2f788a]"
        }
      `}
    >
      {label}
    </button>
  );
}
