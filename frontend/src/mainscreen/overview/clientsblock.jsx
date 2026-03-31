import { useEffect, useMemo, useState } from "react";
import api from "../../utils/axiosInstance";
import {
  BarChart,
  Bar,
  Brush,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { useTranslation } from "react-i18next";
import { CHART_PALETTE, useChartTheme } from "../../theme/chartTheme";
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function Spinner() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-6 h-6 border-2 border-gray-300 border-t-[#2f788a] rounded-full animate-spin" />
    </div>
  );
}

export default function ClientsDashboardBlock() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const {t} = useTranslation();
  const chartTheme = useChartTheme();
  const fetchData = async (y) => {
    setLoading(true);
    const res = await api.get(
      `/api/invoices/stats/dashboard-clients`,
      { params: { year: y } }
    );
    setData(res.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData(year);
  }, [year]);

const spendingChart = useMemo(() => {
  const rows = data?.spending_monthly || [];
  const map = new Map(rows.map(r => [r.month, r]));

  return MONTHS.map((m, i) => {
    const r = map.get(i + 1) || {};
    return {
      month: m,
      rank1: Number(r.rank1_value || 0),
      rank1_name: r.rank1_name,
      rank2: Number(r.rank2_value || 0),
      rank2_name: r.rank2_name,
      rank3: Number(r.rank3_value || 0),
      rank3_name: r.rank3_name
    };
  });
}, [data]);


const countChart = useMemo(() => {
  const rows = data?.count_monthly || [];
  const map = new Map(rows.map(r => [r.month, r]));

  return MONTHS.map((m, i) => {
    const r = map.get(i + 1) || {};
    return {
      month: m,
      rank1: Number(r.rank1_value || 0),
      rank1_name: r.rank1_name,
      rank2: Number(r.rank2_value || 0),
      rank2_name: r.rank2_name,
      rank3: Number(r.rank3_value || 0),
      rank3_name: r.rank3_name
    };
  });
}, [data]);


  return (
    <div className="flex flex-col h-full min-h-0 bg-white border rounded-xl">

      {/* HEADER */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b rounded-t-xl">
        <h2 className="font-semibold text-gray-800">{t("DashClients.title")}</h2>
        <div className="flex items-center gap-2 bg-white border rounded-lg px-2 py-1">
          <button onClick={() => setYear(y => y - 1)}>‹</button>
          <span className="w-14 text-center">{year}</span>
          <button onClick={() => setYear(y => y + 1)}>›</button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 min-h-0 flex flex-col p-4 gap-4">

        {/* TOP ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-0">

          {/* KPI */}
        <div className="bg-white border rounded-xl flex flex-col min-h-0">

        {/* Header */}
        <div className="px-4 py-3 border-b bg-gradient-to-r from-[#2f788a]/10 to-transparent rounded-t-xl">
            <h3 className="text-base font-semibold text-gray-800">
            {t("DashClients.top_spending_title")}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
            {t("DashClients.top_spending_hint")}
            </p>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
            {(data?.top_spending_clients || []).map((c, i) => (
            <div
                key={c.id}
                className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-gray-50 transition"
            >
                {/* Left */}
                <div className="flex items-center gap-3 min-w-0">
                <div
                    className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-semibold
                    ${i === 0 ? "bg-yellow-100 text-yellow-700" :
                        i === 1 ? "bg-gray-200 text-gray-700" :
                        i === 2 ? "bg-orange-100 text-orange-700" :
                        "bg-gray-100 text-gray-500"}`}
                >
                    {i + 1}
                </div>

                <span className="font-medium text-gray-800 truncate">
                    {c.name}
                </span>
                </div>

                {/* Right */}
                <span className="text-sm font-semibold text-gray-900">
                {Number(c.total_spent).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                })}
                </span>
            </div>
            ))}
        </div>

        </div>

          {/* CHART */}
          <div dir="ltr" className="lg:col-span-3 bg-white border rounded-xl p-4">
            {loading ? <Spinner /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spendingChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: chartTheme.axis, fontSize: 12 }}
                    axisLine={{ stroke: chartTheme.axisLine }}
                    tickLine={{ stroke: chartTheme.axisLine }}
                  />
                  <YAxis
                    tick={{ fill: chartTheme.axis, fontSize: 12 }}
                    axisLine={{ stroke: chartTheme.axisLine }}
                    tickLine={{ stroke: chartTheme.axisLine }}
                  />
                  <Tooltip
                    formatter={(value, name, props) => {
                        const row = props.payload;
                        if (name === "rank1") return [value, row.rank1_name || "—"];
                        if (name === "rank2") return [value, row.rank2_name || "—"];
                        if (name === "rank3") return [value, row.rank3_name || "—"];
                        return [value, name];
                    }}
                    contentStyle={chartTheme.tooltipStyle}
                    labelStyle={chartTheme.tooltipLabelStyle}
                    itemStyle={chartTheme.tooltipItemStyle}
                    cursor={chartTheme.tooltipCursor}
                  />

                    <Brush
                      dataKey="month"
                      height={25}
                      fill={chartTheme.brush.fill}
                      stroke={chartTheme.brush.stroke}
                      travellerStroke={chartTheme.brush.travellerStroke}
                    />

                    <Bar dataKey="rank1" fill={CHART_PALETTE[0]} />
                    <Bar dataKey="rank2" fill={CHART_PALETTE[1]} />
                    <Bar dataKey="rank3" fill={CHART_PALETTE[2]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* BOTTOM ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-0">

<div className="bg-white border rounded-xl flex flex-col min-h-0">

  {/* Header */}
  <div className="px-4 py-3 border-b bg-gradient-to-r from-[#4fa3b1]/10 to-transparent rounded-t-xl">
    <h3 className="text-base font-semibold text-gray-800">
      {t("DashClients.top_sales_count_title")}
    </h3>
    <p className="text-xs text-gray-500 mt-0.5">
      {t("DashClients.top_sales_count_hint")}
    </p>
  </div>

  {/* List */}
  <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
    {(data?.top_sales_clients || []).map((c, i) => (
      <div
        key={c.id}
        className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-gray-50 transition"
      >
        {/* Left */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-semibold
              ${i === 0 ? "bg-yellow-100 text-yellow-700" :
                i === 1 ? "bg-gray-200 text-gray-700" :
                i === 2 ? "bg-orange-100 text-orange-700" :
                "bg-gray-100 text-gray-500"}`}
          >
            {i + 1}
          </div>

          <span className="font-medium text-gray-800 truncate">
            {c.name}
          </span>
        </div>

        {/* Right */}
        <span className="text-sm font-semibold text-gray-900">
          {c.sales_count}
        </span>
      </div>
    ))}
  </div>

</div>


          {/* CHART */}
          <div dir="ltr" className="lg:col-span-3 bg-white border rounded-xl p-4">
            {loading ? <Spinner /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={countChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: chartTheme.axis, fontSize: 12 }}
                    axisLine={{ stroke: chartTheme.axisLine }}
                    tickLine={{ stroke: chartTheme.axisLine }}
                  />
                  <YAxis
                    tick={{ fill: chartTheme.axis, fontSize: 12 }}
                    axisLine={{ stroke: chartTheme.axisLine }}
                    tickLine={{ stroke: chartTheme.axisLine }}
                  />
                  <Tooltip
  formatter={(value, name, props) => {
    const row = props.payload;
    if (name === "rank1") return [value, row.rank1_name || "—"];
    if (name === "rank2") return [value, row.rank2_name || "—"];
    if (name === "rank3") return [value, row.rank3_name || "—"];
    return [value, name];
  }}
  contentStyle={chartTheme.tooltipStyle}
  labelStyle={chartTheme.tooltipLabelStyle}
  itemStyle={chartTheme.tooltipItemStyle}
  cursor={chartTheme.tooltipCursor}
/>

<Brush
  dataKey="month"
  height={25}
  fill={chartTheme.brush.fill}
  stroke={chartTheme.brush.stroke}
  travellerStroke={chartTheme.brush.travellerStroke}
/>

<Bar dataKey="rank1" fill={CHART_PALETTE[0]} />
<Bar dataKey="rank2" fill={CHART_PALETTE[1]} />
<Bar dataKey="rank3" fill={CHART_PALETTE[2]} />

                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
