import { useEffect, useMemo, useState } from "react";
import api from "../../utils/axiosInstance";
import { useTranslation } from "react-i18next";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function Spinner() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-6 h-6 border-2 border-gray-300 border-t-[#2f788a] rounded-full animate-spin" />
    </div>
  );
}

function money(n) {
  const x = Number(n || 0);
  return `${x.toFixed(3)} JD`;
}

export default function DashboardSalesBlock({ title }) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const { t } = useTranslation();
  const resolvedTitle = title ?? t("SalesDash.title");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true); // initial load
  const [yearLoading, setYearLoading] = useState(false); // only when year changes

  const fetchSales = async (y, { yearChange = false } = {}) => {
    try {
      if (yearChange) setYearLoading(true);
      else setLoading(true);

      const res = await api.get(`/api/invoices/stats/dashboard-sales`, {
        params: { year: y },
      });

      setData(res.data);
    } catch (err) {
      console.error("Failed to load dashboard sales", err);
    } finally {
      if (yearChange) setYearLoading(false);
      else setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales(year, { yearChange: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (year === currentYear && data === null) return;
    fetchSales(year, { yearChange: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  const monthlySalesTotals = useMemo(() => {
    const rows = data?.monthly_sales_totals || [];
    const map = new Map(rows.map((r) => [Number(r.month_index), r]));
    return MONTHS.map((m, i) => {
      const r = map.get(i + 1);
      return { month: m, total: Number(r?.total || 0) };
    });
  }, [data]);

  const monthlySalesCount = useMemo(() => {
    const rows = data?.monthly_sales_count || [];
    const map = new Map(rows.map((r) => [Number(r.month_index), r]));
    return MONTHS.map((m, i) => {
      const r = map.get(i + 1);
      return { month: m, count: Number(r?.count || 0) };
    });
  }, [data]);

  const monthlyRefundTotals = useMemo(() => {
    const rows = data?.monthly_refunds_totals || [];
    const map = new Map(rows.map((r) => [Number(r.month_index), r]));
    return MONTHS.map((m, i) => {
      const r = map.get(i + 1);
      return { month: m, refunds: Number(r?.refunds || 0) };
    });
  }, [data]);

  const salesByType2 = useMemo(() => {
    const rows = data?.sales_by_type2 || [];
    return rows.map((r) => ({
      name: r.type2,
      value: Number(r.total || 0),
    }));
  }, [data]);

  const PIE_COLORS = ["#2f788a", "#6b7280", "#406ea2ff"]; // blue/gray family

  const HeaderBar = (
    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border rounded-t-xl shadow-sm">
      <div className="flex flex-col">
<h2 className="text-lg font-semibold text-gray-800">{t("SalesDash.title")}</h2>
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
        {/* TOP ROW (2 equal) */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">

  <div className="bg-white rounded-xl border p-4 flex flex-col min-h-0">
    <div className="flex items-center justify-between mb-2">
      <h3 className="font-semibold text-gray-800">{t("SalesDash.sales_total_amount")}</h3>
      <span className="text-xs text-gray-500">{t("SalesDash.months_label")}</span>
    </div>

    <div dir="ltr" className=" flex-1 min-h-0">
      {yearLoading ? (
        <Spinner />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={monthlySalesTotals}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(v) => money(v)} />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#2f788a"
              fill="#2f788a"
              fillOpacity={0.2}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  </div>

  <div className="bg-white rounded-xl border p-4 flex flex-col min-h-0">
    <div className="flex items-center justify-between mb-2">
      <h3 className="font-semibold text-gray-800">{t("SalesDash.sales_count")}</h3>
      <span className="text-xs text-gray-500">{t("SalesDash.months_label")}</span>
    </div>

    <div dir="ltr" className="flex-1 min-h-0">
      {yearLoading ? (
        <Spinner />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={monthlySalesCount}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#2f788a" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  </div>
</div>


<div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">

  <div className="bg-white rounded-xl border p-4 flex flex-col min-h-0">
    <div className="flex items-center justify-between mb-2">
      <h3 className="font-semibold text-gray-800">{t("SalesDash.sales_by_type")}</h3>
    </div>

<div dir="ltr" className="flex-1 min-h-0">
  {yearLoading ? (
    <Spinner />
  ) : (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Tooltip formatter={(v) => money(v)} />

        <Legend
          verticalAlign="bottom"
          align="center"
          iconType="circle"
          formatter={(value) => (
            <span className="text-sm text-gray-700">{value}</span>
          )}
        />

        <Pie
          data={salesByType2}
          dataKey="value"
          nameKey="name"
          outerRadius="75%"
        >
          {salesByType2.map((_, i) => (
            <Cell
              key={i}
              fill={PIE_COLORS[i % PIE_COLORS.length]}
            />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  )}
</div>

  </div>

  <div className="bg-white rounded-xl border p-4 flex flex-col min-h-0 lg:col-span-2">
    <div className="flex items-center justify-between mb-2">
      <h3 className="font-semibold text-gray-800">{t("SalesDash.refunds_total_amount")}</h3>
      <span className="text-xs text-gray-500">{t("SalesDash.months_label")}</span>
    </div>

    <div dir="ltr" className="flex-1 min-h-0">
      {yearLoading ? (
        <Spinner />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={monthlyRefundTotals}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(v) => money(v)} />

            <Area
            type="monotone"
            dataKey="refunds"
            stroke="#873636ff"
            fill="#89373785"
            fillOpacity={0.25}
            strokeWidth={2}
            dot={false}
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
