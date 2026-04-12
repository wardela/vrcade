import { useEffect, useMemo, useState } from "react";
import api from "../../utils/axiosInstance";
import { useTranslation } from "react-i18next";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  Brush,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  CHART_PALETTE,
  CHART_SERIES,
  useChartTheme,
} from "../../theme/chartTheme";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function Spinner() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-6 h-6 border-2 border-gray-300 border-t-[#2f788a] rounded-full animate-spin" />
    </div>
  );
}

function money(n) {
  const value = Number(n || 0);
  return `${value.toFixed(3)} JOD`;
}

function tokens(n) {
  const value = Number(n || 0);
  return `${value.toLocaleString()} Tokens`;
}

export default function DashboardPosAnalyticsBlock() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [yearLoading, setYearLoading] = useState(false);
  const { t } = useTranslation();
  const chartTheme = useChartTheme();

  const fetchData = async (selectedYear, { yearChange = false } = {}) => {
    try {
      if (yearChange) setYearLoading(true);
      else setLoading(true);

      const res = await api.get("/api/invoices/stats/dashboard-pos-analytics", {
        params: { year: selectedYear },
      });
      setData(res.data);
    } catch (err) {
      console.error("Failed to load POS analytics dashboard", err);
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

  const salesVsTokensChart = useMemo(() => {
    const rows = data?.monthly_sales_vs_tokens || [];
    const map = new Map(rows.map((row) => [Number(row.month_index), row]));

    return MONTHS.map((month, index) => {
      const row = map.get(index + 1);
      return {
        month,
        sales: Number(row?.total_sales || 0),
        tokens: Number(row?.total_tokens || 0),
      };
    });
  }, [data]);

  const posPerformanceChart = useMemo(() => {
    const rows = data?.pos_performance || [];
    return rows.map((row) => ({
      key: row.pos_key,
      name: row.pos_name,
      value: Number(row.total_sales || 0),
    }));
  }, [data]);

  const topUsersChart = useMemo(() => {
    const rows = data?.top_users_monthly || [];
    const map = new Map(rows.map((row) => [Number(row.month), row]));

    return MONTHS.map((month, index) => {
      const row = map.get(index + 1) || {};
      return {
        month,
        rank1: Number(row.rank1_value || 0),
        rank1_name: row.rank1_name,
        rank2: Number(row.rank2_value || 0),
        rank2_name: row.rank2_name,
        rank3: Number(row.rank3_value || 0),
        rank3_name: row.rank3_name,
      };
    });
  }, [data]);

  const hasPosPerformanceData = posPerformanceChart.some((row) => row.value > 0);
  const hasTopUsersChartData = topUsersChart.some(
    (row) => row.rank1 > 0 || row.rank2 > 0 || row.rank3 > 0,
  );

  const renderEmptyState = (message) => (
    <div className="flex items-center justify-center h-full">
      <div className="text-sm text-gray-500 bg-gray-50 border rounded-lg px-4 py-3">
        {message}
      </div>
    </div>
  );

  const HeaderBar = (
    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border rounded-t-xl shadow-sm">
      <div className="flex flex-col">
        <h2 className="text-lg font-semibold text-gray-800">{t("DashPos.title")}</h2>
      </div>

      <div className="flex items-center gap-2 bg-white border rounded-lg px-2 py-1">
        <button
          onClick={() => setYear((value) => value - 1)}
          className="px-2 py-1 hover:bg-gray-100 rounded"
          title={t("DashPos.prev_year")}
        >
          ‹
        </button>

        <span className="font-medium text-gray-700 w-16 text-center">{year}</span>

        <button
          onClick={() => setYear((value) => value + 1)}
          className="px-2 py-1 hover:bg-gray-100 rounded"
          title={t("DashPos.next_year")}
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
          <div className="lg:col-span-2 bg-white rounded-xl border p-4 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-800">
                {t("DashPos.sales_vs_tokens_title")}
              </h3>
              <span className="text-xs text-gray-500">{t("DashPos.months_12")}</span>
            </div>

            <div dir="ltr" className="flex-1 min-h-0">
              {yearLoading ? (
                <Spinner />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesVsTokensChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: chartTheme.axis, fontSize: 12 }}
                      axisLine={{ stroke: chartTheme.axisLine }}
                      tickLine={{ stroke: chartTheme.axisLine }}
                    />
                    <YAxis
                      yAxisId="sales"
                      tick={{ fill: chartTheme.axis, fontSize: 12 }}
                      axisLine={{ stroke: chartTheme.axisLine }}
                      tickLine={{ stroke: chartTheme.axisLine }}
                    />
                    <YAxis
                      yAxisId="tokens"
                      orientation="right"
                      tick={{ fill: chartTheme.axis, fontSize: 12 }}
                      axisLine={{ stroke: chartTheme.axisLine }}
                      tickLine={{ stroke: chartTheme.axisLine }}
                    />
                    <Tooltip
                      formatter={(value, _name, item) => {
                        if (item?.dataKey === "sales") {
                          return [money(value), t("DashPos.sales_line")];
                        }

                        return [tokens(value), t("DashPos.tokens_line")];
                      }}
                      contentStyle={chartTheme.tooltipStyle}
                      labelStyle={chartTheme.tooltipLabelStyle}
                      itemStyle={chartTheme.tooltipItemStyle}
                      cursor={chartTheme.tooltipCursor}
                    />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      iconType="circle"
                      formatter={(value) => (
                        <span style={{ color: chartTheme.legend }}>{value}</span>
                      )}
                    />
                    <Line
                      yAxisId="sales"
                      type="monotone"
                      dataKey="sales"
                      name={t("DashPos.sales_line")}
                      stroke={CHART_SERIES.primary}
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                    <Line
                      yAxisId="tokens"
                      type="monotone"
                      dataKey="tokens"
                      name={t("DashPos.tokens_line")}
                      stroke={CHART_SERIES.secondary}
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border p-4 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-800">
                {t("DashPos.pos_performance_title")}
              </h3>
              <span className="text-xs text-gray-500">{t("DashPos.pos_performance_hint")}</span>
            </div>

            <div dir="ltr" className="flex-1 min-h-0">
              {yearLoading ? (
                <Spinner />
              ) : hasPosPerformanceData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      formatter={(value, _name, entry) => {
                        const percentage = Number(entry?.payload?.percent || 0) * 100;
                        return [money(value), `${entry?.payload?.name} • ${percentage.toFixed(1)}%`];
                      }}
                      contentStyle={chartTheme.tooltipStyle}
                      labelStyle={chartTheme.tooltipLabelStyle}
                      itemStyle={chartTheme.tooltipItemStyle}
                    />
                    <Legend
                      verticalAlign="bottom"
                      align="center"
                      iconType="circle"
                      wrapperStyle={{ fontSize: 12, paddingTop: 8, maxHeight: 84, overflowY: "auto" }}
                      formatter={(value) => (
                        <span style={{ color: chartTheme.legend }}>{value}</span>
                      )}
                    />
                    <Pie
                      data={posPerformanceChart}
                      dataKey="value"
                      nameKey="name"
                      outerRadius="72%"
                    >
                      {posPerformanceChart.map((row, index) => (
                        <Cell
                          key={row.key || index}
                          fill={CHART_PALETTE[index % CHART_PALETTE.length]}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                renderEmptyState(t("DashPos.empty_pos_performance"))
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-0">
          <div className="bg-white border rounded-xl flex flex-col min-h-0">
            <div className="px-4 py-3 border-b bg-gradient-to-r from-[#2f788a]/10 to-transparent rounded-t-xl">
              <h3 className="text-base font-semibold text-gray-800">
                {t("DashPos.top_users_title")}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {t("DashPos.top_users_hint")}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
              {(data?.top_users_year || []).length === 0 ? (
                <div className="text-sm text-gray-500 bg-gray-50 border rounded-lg p-3">
                  {t("DashPos.empty_top_users")}
                </div>
              ) : (
                (data?.top_users_year || []).map((user, index) => (
                  <div
                    key={`${user.user_key}-${index}`}
                    className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-semibold
                          ${index === 0 ? "bg-yellow-100 text-yellow-700" :
                            index === 1 ? "bg-gray-200 text-gray-700" :
                              index === 2 ? "bg-orange-100 text-orange-700" :
                                "bg-gray-100 text-gray-500"}`}
                      >
                        {index + 1}
                      </div>

                      <span className="font-medium text-gray-800 truncate">
                        {user.user_name}
                      </span>
                    </div>

                    <span className="text-sm font-semibold text-gray-900">
                      {money(user.total_sales)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div dir="ltr" className="lg:col-span-3 bg-white border rounded-xl p-4 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-800">
                {t("DashPos.top_users_chart_title")}
              </h3>
              <span className="text-xs text-gray-500">{t("DashPos.months_12")}</span>
            </div>

            <div className="flex-1 min-h-0">
              {yearLoading ? (
                <Spinner />
              ) : hasTopUsersChartData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topUsersChart}>
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
                      formatter={(value, name, tooltipEntry) => {
                        const row = tooltipEntry.payload;
                        if (name === "rank1") return [money(value), row.rank1_name || "—"];
                        if (name === "rank2") return [money(value), row.rank2_name || "—"];
                        if (name === "rank3") return [money(value), row.rank3_name || "—"];
                        return [money(value), name];
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
              ) : (
                renderEmptyState(t("DashPos.empty_top_users"))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
