import { useEffect, useState } from "react";
import api from "../../utils/axiosInstance";
import { useTranslation } from "react-i18next";

function Spinner() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-6 h-6 border-2 border-gray-300 border-t-[#2f788a] rounded-full animate-spin" />
    </div>
  );
}

export default function KpiCards() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    fetchKpis();
  }, [year]);

  const fetchKpis = async () => {
    try {
      setLoading(true);
      const res = await api.get(
        `/api/invoices/stats/dashboard-kpis`,
        { params: { year } }
      );
      setData(res.data);
    } catch (err) {
      console.error("Failed to load KPIs", err);
    } finally {
      setLoading(false);
    }
  };

const kpis = [
  {
    label: t("kpi.total_sales"),
    value: data ? `${Number(data.total_sales).toFixed(3)} JD` : null,
  },
  {
    label: t("kpi.total_refunds"),
    value: data ? `${Number(data.total_refunds).toFixed(3)} JD` : null,
  },
  {
    label: t("kpi.net_profit"),
    value: data ? `${Number(data.net_profit).toFixed(3)} JD` : null,
  },
  {
    label: t("kpi.invoices"),
    value: data ? data.invoice_count : null,
  }
];

  return (
    <div className="bg-white rounded-xl shadow-sm">

      {/* ===== KPI HEADER BAR ===== */}
      <div className="flex items-center justify-between px-5 py-3 border-b bg-gray-50 rounded-t-xl">
        <h2 className="text-base font-semibold text-gray-700">
      {t("kpi.title")}       
         </h2>

        <div className="flex items-center gap-1 bg-white border rounded-md px-2 py-1">
          <button
            onClick={() => setYear(y => y - 1)}
            className="px-2 py-1 hover:bg-gray-100 rounded text-sm"
          >
            ‹
          </button>

          <span className="font-medium text-gray-700 w-14 text-center text-sm">
            {year}
          </span>

          <button
            onClick={() => setYear(y => y + 1)}
            className="px-2 py-1 hover:bg-gray-100 rounded text-sm"
          >
            ›
          </button>
        </div>
      </div>

      {/* ===== KPI CARDS ===== */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5">
        {kpis.map((kpi, i) => (
          <div
            key={i}
            className="bg-white rounded-lg border p-5 text-center h-24"
          >
            <p className="text-gray-500 text-sm mb-1">
              {kpi.label}
            </p>

            <div className="h-8 flex items-center justify-center">
              {loading ? (
                <Spinner />
              ) : (
                <p className="text-2xl font-bold text-[#2f788a]">
                  {kpi.value}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
