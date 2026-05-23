import { useId, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { usePortalLanguage } from "../../i18n/usePortalLanguage";
import {
  ResponsiveContainer,
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

function ChartTooltip({ active, payload, label, valueFormatter }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="owners-chart-tooltip">
      <p>{label}</p>
      <strong>{valueFormatter(payload[0].value)}</strong>
    </div>
  );
}

export default function TrendChartCard({
  title,
  data,
  valueKey,
  labelFormatter,
  valueFormatter,
  axisValueFormatter,
  visibleCount,
  endIndex,
  maxEndIndex,
  onShiftBackward,
  onShiftForward,
  chartType = "line",
  lineStyle = "plain",
}) {
  const { t } = useTranslation();
  const { isRTL } = usePortalLanguage();
  const gradientId = useId().replace(/:/g, "");
  const startIndex = Math.max(0, endIndex - visibleCount + 1);
  const visibleData = data.slice(startIndex, endIndex + 1);
  const latestValue = visibleData[visibleData.length - 1]?.[valueKey] || 0;
  const canShiftBackward = startIndex > 0;
  const canShiftForward = endIndex < maxEndIndex;

  const chartData = useMemo(
    () =>
      visibleData.map((item) => ({
        label: labelFormatter(item),
        value: Number(item[valueKey] || 0),
      })),
    [labelFormatter, valueKey, visibleData]
  );

  return (
    <article className="owners-chart-card">
      <div className="owners-chart-card__header">
        <div>
          <p className="owners-chart-card__eyebrow">{title}</p>
          <h4>{valueFormatter(latestValue)}</h4>
        </div>

        <div className="owners-chart-card__controls">
          <button
            type="button"
            className="owners-chart-card__arrow"
            onClick={onShiftBackward}
            disabled={!canShiftBackward}
            aria-label={t("portalCommon.actions.show_earlier", { label: title })}
          >
            {isRTL ? "›" : "‹"}
          </button>
          <button
            type="button"
            className="owners-chart-card__arrow"
            onClick={onShiftForward}
            disabled={!canShiftForward}
            aria-label={t("portalCommon.actions.show_later", { label: title })}
          >
            {isRTL ? "‹" : "›"}
          </button>
        </div>
      </div>

      <div className="owners-chart-card__canvas">
        {chartType === "bar" ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 8, left: -14, bottom: 4 }}
              barCategoryGap="22%"
            >
              <CartesianGrid
                stroke="rgba(47, 120, 138, 0.10)"
                strokeDasharray="4 4"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fill: "#718894", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval={0}
                tickMargin={10}
              />
              <YAxis
                tick={{ fill: "#718894", fontSize: 11 }}
                tickFormatter={axisValueFormatter}
                axisLine={false}
                tickLine={false}
                width={44}
              />
              <Tooltip
                content={<ChartTooltip valueFormatter={valueFormatter} />}
                cursor={{ fill: "rgba(47, 120, 138, 0.08)" }}
              />
              <Bar dataKey="value" radius={[12, 12, 6, 6]} maxBarSize={34}>
                {chartData.map((entry) => (
                  <Cell
                    key={entry.label}
                    fill={entry.value > 0 ? "#48a5b6" : "#d9e8ed"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {lineStyle === "area" ? (
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 8, left: -14, bottom: 4 }}
              >
                <defs>
                  <linearGradient id={`ownersTrendArea-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2f788a" stopOpacity={0.22} />
                    <stop offset="68%" stopColor="#2f788a" stopOpacity={0.1} />
                    <stop offset="100%" stopColor="#2f788a" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="rgba(47, 120, 138, 0.10)"
                  strokeDasharray="4 4"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#718894", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  tickMargin={10}
                />
                <YAxis
                  tick={{ fill: "#718894", fontSize: 11 }}
                  tickFormatter={axisValueFormatter}
                  axisLine={false}
                  tickLine={false}
                  width={44}
                />
                <Tooltip
                  content={<ChartTooltip valueFormatter={valueFormatter} />}
                  cursor={{ stroke: "rgba(47, 120, 138, 0.18)", strokeWidth: 1 }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#2f788a"
                  strokeWidth={2.5}
                  fill={`url(#ownersTrendArea-${gradientId})`}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2, fill: "#ffffff" }}
                />
              </AreaChart>
            ) : (
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 8, left: -14, bottom: 4 }}
              >
                <CartesianGrid
                  stroke="rgba(47, 120, 138, 0.10)"
                  strokeDasharray="4 4"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#718894", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  tickMargin={10}
                />
                <YAxis
                  tick={{ fill: "#718894", fontSize: 11 }}
                  tickFormatter={axisValueFormatter}
                  axisLine={false}
                  tickLine={false}
                  width={44}
                />
                <Tooltip
                  content={<ChartTooltip valueFormatter={valueFormatter} />}
                  cursor={{ stroke: "rgba(47, 120, 138, 0.18)", strokeWidth: 1 }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#2f788a"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2, fill: "#ffffff" }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </article>
  );
}
