import { useEffect, useMemo, useState } from "react";
import api from "../../utils/axiosInstance";
import {
  BarChart, Bar, Brush, XAxis, YAxis, CartesianGrid, Tooltip,
  AreaChart, Area, ResponsiveContainer
} from "recharts";
import { useTranslation } from "react-i18next";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const COLORS = ["#2f788a", "#4fa3b1", "#9bd4de"];

function Spinner() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-6 h-6 border-2 border-gray-300 border-t-[#2f788a] rounded-full animate-spin" />
    </div>
  );
}

export default function DashboardInventoryBlock() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const {t} = useTranslation();

  const fetchData = async (y) => {
    setLoading(true);
    const res = await api.get(
      `/api/invoices/stats/dashboard-inventory`,
      { params: { year: y } }
    );
    setData(res.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData(year);
  }, [year]);

const topItems = useMemo(() => {
  const rows = data?.top_items_monthly || [];
  const map = new Map(rows.map(r => [r.month, r]));

  return MONTHS.map((m, i) => {
    const r = map.get(i + 1) || {};
    return {
      month: m,

      rank1: Number(r.rank1_total || 0),
      rank1_name: r.rank1_name,

      rank2: Number(r.rank2_total || 0),
      rank2_name: r.rank2_name,

      rank3: Number(r.rank3_total || 0),
      rank3_name: r.rank3_name,
    };
  });
}, [data]);

const topItemsMax = useMemo(() => {
  if (!topItems.length) return 0;
  return Math.max(
    ...topItems.map(r => Math.max(r.rank1 || 0, r.rank2 || 0, r.rank3 || 0))
  );
}, [topItems]);



  const inOut = useMemo(() => {
    const rows = data?.monthly_inout || [];
    const map = new Map(rows.map(r => [r.month, r]));
    return MONTHS.map((m, i) => {
      const r = map.get(i + 1) || {};
      return {
        month: m,
        in: Number(r.in_qty || 0),
        out: Number(r.out_qty || 0),
      };
    });
  }, [data]);

  return (
    <div className="flex flex-col h-full min-h-0 bg-white border rounded-xl">

      {/* HEADER */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b rounded-t-xl">
        <h2 className="font-semibold text-gray-800">{t("DashInventory.title")}</h2>
        <div className="flex items-center gap-2 bg-white border rounded-lg px-2 py-1">
          <button onClick={() => setYear(y => y - 1)}>‹</button>
          <span className="w-14 text-center">{year}</span>
          <button onClick={() => setYear(y => y + 1)}>›</button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 min-h-0 flex flex-col  p-4">

        {/* ROW 1 – Brush chart */}
    <div className="flex items-center justify-between mb-2">
      <h3 className="font-semibold text-gray-800">{t("DashInventory.top_items_title")}</h3>
      <span className="text-xs text-gray-500">{t("DashInventory.months_12")}</span>
    </div>
        <div dir="ltr" className="flex-1 min-h-0 bg-white border rounded-xl p-4 mb-2">
          {loading ? <Spinner /> : (
<ResponsiveContainer width="100%" height="100%">
  <BarChart
    data={topItems}
    margin={{ top: 10, right: 10, left: 18, bottom: 0 }}
  >
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="month" />
    <YAxis
      width={50}
      domain={[0, Math.ceil(topItemsMax * 1.1)]}
      allowDecimals={false}
    />

    <Tooltip
      formatter={(value, name, props) => {
        const row = props.payload;
        if (name === "rank1") return [value, row.rank1_name || "—"];
        if (name === "rank2") return [value, row.rank2_name || "—"];
        if (name === "rank3") return [value, row.rank3_name || "—"];
        return [value, name];
      }}
    />

    <Brush dataKey="month" height={25} />
    <Bar dataKey="rank1" fill={COLORS[0]} />
    <Bar dataKey="rank2" fill={COLORS[1]} />
    <Bar dataKey="rank3" fill={COLORS[2]} />
  </BarChart>
</ResponsiveContainer>

          )}
        </div>

        {/* ROW 2 */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-4 gap-4">

<div className="bg-white border rounded-xl flex flex-col min-h-0">

  {/* ===== HEADER ===== */}
  <div className="px-4 py-3 border-b bg-gray-50 rounded-t-xl">
    <h3 className="font-semibold text-gray-800">
      {t("DashInventory.dead_items_title")}
    </h3>
    <p className="text-xs text-gray-500 mt-0.5">
       {t("DashInventory.dead_items_hint")}
    </p>
  </div>

  {/* ===== BODY ===== */}
  <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
    {(data?.dead_items || []).length === 0 ? (
      <div className="text-sm text-gray-500 bg-gray-50 border rounded-lg p-3">
       {t("DashInventory.dead_items_empty")}
      </div>
    ) : (
      (data.dead_items).map(it => (
        <div
          key={it.id}
          className="flex items-center justify-between text-sm border-b last:border-none py-2"
        >
          <span className="text-gray-800 truncate">
            {it.name}
          </span>

          <span className="text-xs text-gray-400">
       {t("DashInventory.dead_items_zero")}
          </span>
        </div>
      ))
    )}
  </div>

</div>


{/* IN / OUT stacked */}
<div className="lg:col-span-3 bg-white border rounded-xl p-4 flex flex-col min-h-0">

  {/* ===== TITLE / HEADER ===== */}
  <div className="flex items-center justify-between mb-2">
    <h3 className="font-semibold text-gray-800">
      {t("DashInventory.stock_movement_title")}
    </h3>
    <span className="text-xs text-gray-500">
      {t("DashInventory.stock_movement_sub")}
    </span>
  </div>

  {/* ===== CHART ===== */}
  <div dir="ltr" className="flex-1 min-h-0">
    {loading ? (
      <Spinner />
    ) : (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={inOut}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />

          <Area
            dataKey="in"
            stackId="1"
            stroke="#16a34a"
            fill="#16a34a"
            fillOpacity={0.25}
            name={t("DashInventory.stock_in")}
          />
          <Area
            dataKey="out"
            stackId="1"
            stroke="#dc2626"
            fill="#dc2626"
            fillOpacity={0.25}
            name={t("DashInventory.stock_out")}
          />
        </AreaChart>
      </ResponsiveContainer>
    )}
  </div>

</div>


        </div>
      </div>
    </div>
  );
}
