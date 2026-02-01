import { useEffect, useMemo, useState } from "react";
import api from "../../utils/axiosInstance";
import { useTranslation } from "react-i18next";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function Spinner() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-6 h-6 border-2 border-gray-300 border-t-[#2f788a] rounded-full animate-spin" />
    </div>
  );
}

function money(v) {
  return `${Number(v || 0).toFixed(2)} JD`;
}

export default function DashboardReceiptsBlock() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [yearLoading, setYearLoading] = useState(false);
  const { t } = useTranslation();

  const fetchData = async (y, { yearChange = false } = {}) => {
    try {
      if (yearChange) setYearLoading(true);
      else setLoading(true);

      const res = await api.get("/api/invoices/stats/dashboard-receipts", {
        params: { year: y }
      });
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      if (yearChange) setYearLoading(false);
      else setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(year, { yearChange: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (year === currentYear && data === null) return;
    fetchData(year, { yearChange: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  const monthlyChart = useMemo(() => {
    const map = new Map(
      (data?.monthly_due_vs_paid || []).map(r => [r.month_index, r])
    );

    return MONTHS.map((m, i) => ({
      month: m,
      due: Number(map.get(i + 1)?.due || 0),
      paid: Number(map.get(i + 1)?.paid || 0)
    }));
  }, [data]);

  const HeaderBar = (
    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border rounded-t-xl shadow-sm">
      <div className="flex flex-col">
        <h2 className="text-lg font-semibold text-gray-800">{t("ReceiptsDash.title")}</h2>
      </div>

      <div className="flex items-center gap-2 bg-white border rounded-lg px-2 py-1">
        <button
          onClick={() => setYear((y) => y - 1)}
          className="px-2 py-1 hover:bg-gray-100 rounded"
          title="Previous year"
        >
          ‹
        </button>

        <span className="font-medium text-gray-700 w-16 text-center">{year}</span>

        <button
          onClick={() => setYear((y) => y + 1)}
          className="px-2 py-1 hover:bg-gray-100 rounded"
          title="Next year"
        >
          ›
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-white border rounded-xl overflow-hidden">
        {HeaderBar}
        <div className="p-6">
          <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {HeaderBar}

      <div className="flex-1 min-h-0 flex flex-col gap-4 p-4 bg-white rounded-b-lg border">
        
        {/* TOP ROW - Due vs Paid Chart */}
        <div className="grid grid-cols-1 gap-4 flex-1 min-h-0">
          <div className="bg-white rounded-xl border p-4 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-800">
                {t("ReceiptsDash.due_vs_paid")}
              </h3>
              <span className="text-xs text-gray-500">{t("ReceiptsDash.months_label", { defaultValue: "By Month" })}</span>
            </div>

            <div dir="ltr" className="flex-1 min-h-0">
              {yearLoading ? (
                <Spinner />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={money} />
                    <Area 
                      type="monotone"
                      dataKey="due" 
                      stroke="#dc2626" 
                      fill="#dc2626" 
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                    <Area 
                      type="monotone"
                      dataKey="paid" 
                      stroke="#16a34a" 
                      fill="#16a34a" 
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* MIDDLE ROW - Top Clients */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
  {/* Top Clients */}
<div className="
  bg-gradient-to-br from-white via-gray-50/40 to-gray-100/30
  rounded-xl border border-gray-200
  shadow-sm
  p-6
  flex flex-col min-h-0
">
  {/* Header */}
  <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
    <div className="flex flex-col">
      <h3 className="font-semibold text-gray-900 text-lg leading-tight">
        {t("ReceiptsDash.top_clients")}
      </h3>
      <span className="text-xs text-gray-500">
  {t("ReceiptsDash.top_clients_annotation")}
      </span>
    </div>

    <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-50 border border-red-100">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
      <span className="text-xs font-medium text-red-700">
        {t("common.outstanding")}
      </span>
    </div>
  </div>

  {/* Body */}
  <div className="flex-1 overflow-y-auto -mx-2 px-2">
    {yearLoading ? (
      <div className="flex items-center justify-center h-32">
        <Spinner />
      </div>
    ) : (
      <div className="space-y-1.5">
        {data?.top_clients_outstanding?.map((c, index) => {
          const isTop3 = index < 3;

          return (
            <div
              key={c.id}
              className="
                flex items-center justify-between
                py-3 px-3
                rounded-lg
                border
                transition-all
                group
                hover:shadow-sm
                hover:-translate-y-[1px]
                bg-white/70
                border-gray-200/70
                hover:border-gray-300
              "
            >
              {/* Left */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`
                    flex items-center justify-center
                    w-7 h-7
                    rounded-full
                    text-xs font-semibold
                    flex-shrink-0
                    ${
                      isTop3
                        ? "bg-gradient-to-br from-[#2f788a] to-[#1f5f6e] text-white shadow"
                        : "bg-gray-100 text-gray-700"
                    }
                  `}
                >
                  {index + 1}
                </div>

                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-gray-800 truncate group-hover:text-gray-900">
                    {c.name}
                  </span>

                </div>
              </div>

              {/* Right */}
              <div className="flex flex-col items-end ml-3">
                <span className="font-semibold text-sm text-red-600 tabular-nums">
                  {money(c.outstanding)}
                </span>
                <span className="text-[11px] text-gray-400">
                  {t("common.unpaid")}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
</div>

  {/* Outstanding Balances */}
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col min-h-0 lg:col-span-2">
    <div className="flex items-start justify-between mb-4 pb-3 border-b border-gray-100">
  <div className="flex flex-col gap-1">
    <h3 className="font-semibold text-gray-900 text-lg leading-tight">
      {t("ReceiptsDash.top_outstanding")}
    </h3>

    {/* Annotation */}
<p className="text-xs text-gray-500">
  {t("ReceiptsDash.top_outstanding_annotation")}
</p>

  </div>

  <div className="text-xs text-gray-500 font-medium whitespace-nowrap">
    {data?.top_outstanding_balances?.length || 0} {t("items") || "items"}
  </div>
</div>


    <div className="flex-1 overflow-y-auto -mx-2 px-2">
      {yearLoading ? (
        <div className="flex items-center justify-center h-32">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-2">
          {data?.top_outstanding_balances?.map(b => (
            <div 
              key={b.id} 
              className="border border-gray-100 rounded-lg p-4 hover:border-gray-200 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <h4 className="font-semibold text-sm text-gray-900 flex-1">
                  {b.client}
                </h4>
                <div className="flex items-center gap-2 text-xs font-medium">
                  <span className="text-green-600 tabular-nums">{money(b.paid)}</span>
                  <span className="text-gray-400">/</span>
                  <span className="text-gray-700 tabular-nums">{money(b.amount)}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-green-500 h-full rounded-full transition-all"
                    style={{ width: `${Math.min((b.paid / b.amount) * 100, 100)}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500 font-medium tabular-nums">
                  {Math.round((b.paid / b.amount) * 100)}%
                </span>
              </div>
              
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                {b.reason}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
</div>

      </div>
    </div>
  );
}