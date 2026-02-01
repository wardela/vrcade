import KpiCards from "./KPIcards";
import DashboardOverviewBlock from "./overviewblock";
import DashboardSalesBlock from "./salesblock";
import DashboardInventoryBlock from "./inventoryblock";
import ClientsDashboardBlock from "./clientsblock";
import DashboardSectionNav from "./DashboardSectionNav";
import DashboardReceiptsBlock from "./DashboardReceiptsBlock";

export default function Overview() {
  return (
    <>
      <DashboardSectionNav />

      <div
        id="dashboard-scroll-container"
        className="w-full h-screen bg-base-200 p-4 flex flex-col gap-4 overflow-y-auto scroll-smooth"
      >

        {/* ================= KPI CARDS ================= */}
        <div id="kpis">
          <KpiCards />
        </div>

        {/* ================= OVERVIEW SECTION ================= */}
        <div id="overview" className="flex-1 min-h-screen">
          <DashboardOverviewBlock />
        </div>

        {/* ================= SALES SECTION ================= */}
        <div id="sales" className="flex-1 min-h-screen">
          <DashboardSalesBlock />
        </div>

        {/* ================= Receipts SECTION ================= */}
        <div id="receipts" className="flex-1 min-h-screen">
          <DashboardReceiptsBlock />
        </div>

        {/* ================= INVENTORY SECTION ================= */}
        <div id="inventory" className="flex-1 min-h-screen">
          <DashboardInventoryBlock />
        </div>

        {/* ================= CLIENTS SECTION ================= */}
        <div id="clients" className="flex-1 min-h-screen">
          <ClientsDashboardBlock />
        </div>

      </div>
    </>
  );
}
