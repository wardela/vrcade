import { useState } from "react";
import SalesReports from "./SalesReports";
import RefundReports from "./RefundReports";
import EInvoicingReports from "./EInvoicingReports";
import StorageItemReports from "./StorageItemReports";
import PaymentTypeReports from "./PaymentTypeReports";
import { useTranslation } from "react-i18next";

export default function ReportsScreen() {
  const [tab, setTab] = useState("sales");
  const { t } = useTranslation();

  return (
    <div className="flex h-full w-full flex-col gap-3">
      <div className="rounded-[28px] border border-[#dbe7ec] bg-white px-5 py-4 shadow-[0_18px_40px_rgba(39,89,104,0.08)]">
        <p className="portal-eyebrow">{t("portalBrand.portal_name")}</p>
        <h1 className="mt-1 text-xl font-semibold text-slate-700">
          {t("ReportsScreen.title")}
        </h1>
      </div>

      <div className="hide-scrollbar flex gap-2 overflow-x-auto rounded-[24px] border border-[#dbe7ec] bg-white px-3 py-3 shadow-[0_14px_30px_rgba(39,89,104,0.06)]">
        <TabButton
          label={t("ReportsScreen.tabs.sales")}
          value="sales"
          tab={tab}
          setTab={setTab}
        />
        <TabButton
          label={t("ReportsScreen.tabs.refunds")}
          value="refunds"
          tab={tab}
          setTab={setTab}
        />
        <TabButton
          label={t("ReportsScreen.tabs.payment_types")}
          value="payment_types"
          tab={tab}
          setTab={setTab}
        />
        <TabButton
          label={t("ReportsScreen.tabs.tax")}
          value="einvoicing"
          tab={tab}
          setTab={setTab}
        />
        <TabButton
          label={t("ReportsScreen.tabs.storage")}
          value="storage"
          tab={tab}
          setTab={setTab}
        />
      </div>

      <div className="min-h-0 flex-1">
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
        whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition
        ${
          active
            ? "bg-[#2f788a] text-white shadow-[0_10px_22px_rgba(47,120,138,0.22)]"
            : "bg-[#f5fafb] text-slate-500 hover:text-[#2f788a]"
        }
      `}
    >
      {label}
    </button>
  );
}
