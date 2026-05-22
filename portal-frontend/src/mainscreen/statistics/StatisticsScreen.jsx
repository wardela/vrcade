import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchPortalStatistics } from "../../api/portalApi";
import KpiCard from "../dashboard/KpiCard";
import {
  compactMoney,
  formatMonthNameLabel,
  formatMonthShortYearLabel,
  getCurrentYearStart,
  getJordanToday,
  money,
} from "../dashboard/utils";

const CHART_COLORS = {
  primary: "#2f788a",
  secondary: "#5db5c2",
  success: "#3fa66a",
  danger: "#db6b6b",
  amber: "#d39b36",
  soft: "#9bd7de",
};

const PIE_COLORS = ["#2f788a", "#5db5c2", "#9bd7de", "#d39b36", "#6c8b95"];

const tooltipStyle = {
  borderRadius: 14,
  border: "1px solid rgba(47, 120, 138, 0.12)",
  background: "rgba(255, 255, 255, 0.96)",
  boxShadow: "0 14px 30px rgba(39, 89, 104, 0.12)",
};

const prettyAreaLabel = (value, t) => {
  const normalized = String(value || "");

  if (normalized === "type2_local") return t("portalCommon.invoice_types.local");
  if (normalized === "type2_export") return t("portalCommon.invoice_types.export");
  if (normalized === "type2_development") {
    return t("portalCommon.invoice_types.development");
  }

  return normalized
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

function StatisticsCard({ title, subtitle, children, className = "" }) {
  return (
    <article className={`portal-stats-card ${className}`.trim()}>
      <div className="portal-stats-card__head">
        <div>
          <p className="portal-stats-card__eyebrow">{title}</p>
          {subtitle ? <h3>{subtitle}</h3> : null}
        </div>
      </div>
      {children}
    </article>
  );
}

function StatisticsSpinner() {
  return (
    <div className="portal-stats-spinner-wrap">
      <div className="portal-loader__spinner" />
    </div>
  );
}

function EmptyBlock({ message }) {
  return <div className="owners-empty-state">{message}</div>;
}

function RankList({ items, valueKey, formatter, emptyMessage }) {
  const { t } = useTranslation();

  if (!items.length) {
    return <EmptyBlock message={emptyMessage} />;
  }

  return (
    <div className="portal-stats-rank-list">
      {items.map((item, index) => (
        <div key={`${item.id || item.user_key || item.name}-${index}`} className="portal-stats-rank-row">
          <div className="portal-stats-rank-row__main">
            <span className="portal-stats-rank-row__index">{index + 1}</span>
            <strong>
              {item.name || item.user_name || item.client || t("portalCommon.empty.unknown")}
            </strong>
          </div>
          <span className="portal-stats-rank-row__value">{formatter(item[valueKey])}</span>
        </div>
      ))}
    </div>
  );
}

function RecentInvoicesTable({ items, expanded, onToggle }) {
  const { t } = useTranslation();

  if (!items.length) {
    return <EmptyBlock message={t("portalStatistics.empty.no_recent_invoices")} />;
  }

  const visibleItems = expanded ? items.slice(0, 10) : items.slice(0, 3);
  const canExpand = items.length > 3;

  return (
    <div className="portal-stats-table-wrap">
      <div className="portal-stats-table">
        <div className="portal-stats-table__head">
          <span>{t("portalCommon.table.invoice")}</span>
          <span>{t("portalCommon.table.client")}</span>
          <span>{t("portalCommon.table.total")}</span>
        </div>
        {visibleItems.map((item) => (
          <div key={item.invoice_number} className="portal-stats-table__row">
            <strong>{item.invoice_number}</strong>
            <span>{item.client || t("portalCommon.empty.value")}</span>
            <strong>{money(item.total)}</strong>
          </div>
        ))}
      </div>
      {canExpand ? (
        <button
          type="button"
          className="portal-ghost-button portal-stats-table__toggle"
          onClick={onToggle}
        >
          {expanded
            ? t("portalStatistics.actions.show_less")
            : t("portalStatistics.actions.show_last_ten")}
        </button>
      ) : null}
    </div>
  );
}

export default function StatisticsScreen() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState({
    from: getCurrentYearStart(),
    to: getJordanToday(),
  });
  const [appliedFilters, setAppliedFilters] = useState({
    from: getCurrentYearStart(),
    to: getJordanToday(),
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recentInvoicesExpanded, setRecentInvoicesExpanded] = useState(false);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const payload = await fetchPortalStatistics(appliedFilters);

        if (!mounted) {
          return;
        }

        setData(payload);
        setRecentInvoicesExpanded(false);
      } catch (requestError) {
        if (!mounted) {
          return;
        }

        setError(requestError.message || t("portalStatistics.errors.load_failed"));
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [appliedFilters, t]);

  const sameYearRange =
    appliedFilters.from.slice(0, 4) === appliedFilters.to.slice(0, 4);
  const monthLabel = sameYearRange
    ? formatMonthNameLabel
    : formatMonthShortYearLabel;

  const salesByTypeChart = useMemo(
    () =>
      (data?.sales?.sales_by_type2 || []).map((item) => ({
        name: prettyAreaLabel(item.type2, t),
        value: Number(item.total || 0),
      })),
    [data, t]
  );

  const posPerformanceChart = useMemo(
    () =>
      (data?.pos_analytics?.pos_performance || []).map((item) => ({
        name: item.pos_name,
        value: Number(item.total_sales || 0),
      })),
    [data]
  );

  const handleApply = () => {
    if (!filters.from || !filters.to) {
      return;
    }

    setAppliedFilters(filters);
  };

  if (loading && !data) {
    return (
      <div className="portal-stats-page">
        <div className="portal-stats-filterbar portal-panel">
          <div className="owners-skeleton owners-skeleton--date" />
        </div>
        <div className="owners-kpi-grid portal-stats-kpi-grid">
          <div className="owners-skeleton owners-skeleton--kpi" />
          <div className="owners-skeleton owners-skeleton--kpi" />
          <div className="owners-skeleton owners-skeleton--kpi" />
          <div className="owners-skeleton owners-skeleton--kpi" />
        </div>
        <div className="portal-stats-stack">
          <div className="owners-skeleton owners-skeleton--chart" />
          <div className="owners-skeleton owners-skeleton--chart" />
          <div className="owners-skeleton owners-skeleton--chart" />
        </div>
      </div>
    );
  }

  return (
    <div className="portal-stats-page">
      <section className="portal-panel portal-stats-filterbar">
        <div className="portal-stats-filterbar__copy">
          <p className="portal-eyebrow">Statistics</p>
          <h3>{t("portalStatistics.title")}</h3>
        </div>
        <div className="portal-stats-filterbar__controls">
          <label className="owners-date-picker">
            <span>{t("portalCommon.fields.from_date")}</span>
            <input
              type="date"
              dir="ltr"
              value={filters.from}
              onChange={(event) =>
                setFilters((current) => ({ ...current, from: event.target.value }))
              }
            />
          </label>
          <label className="owners-date-picker">
            <span>{t("portalCommon.fields.to_date")}</span>
            <input
              type="date"
              dir="ltr"
              value={filters.to}
              onChange={(event) =>
                setFilters((current) => ({ ...current, to: event.target.value }))
              }
            />
          </label>
          <button
            type="button"
            className="portal-primary-button portal-stats-filterbar__button"
            onClick={handleApply}
            disabled={loading}
          >
            {t("portalCommon.actions.apply")}
          </button>
        </div>
      </section>

      {error ? <div className="owners-error-state">{error}</div> : null}

      {data ? (
        <>
          <section className="owners-kpi-grid portal-stats-kpi-grid">
            <KpiCard
              label={t("portalStatistics.kpis.total_sales")}
              value={data.kpis.total_sales}
              variant="currency"
              tone="teal"
              size="sm"
              iconKey="total"
            />
            <KpiCard
              label={t("portalStatistics.kpis.total_refunds")}
              value={data.kpis.total_refunds}
              variant="currency"
              tone="ice"
              size="sm"
              iconKey="total"
            />
            <KpiCard
              label={t("portalStatistics.kpis.net_profit")}
              value={data.kpis.net_profit}
              variant="currency"
              tone="navy"
              size="sm"
              iconKey="average"
            />
            <KpiCard
              label={t("portalStatistics.kpis.invoices")}
              value={data.kpis.invoice_count}
              variant="count"
              tone="slate"
              size="sm"
              iconKey="count"
            />
          </section>

          <section className="portal-stats-section">
            <div className="portal-stats-section__title">
              <p className="portal-eyebrow">{t("portalStatistics.sections.overview.eyebrow")}</p>
              <h3>{t("portalStatistics.sections.overview.title")}</h3>
            </div>
            <div className="portal-stats-grid portal-stats-grid--two">
              <StatisticsCard
                title={t("portalStatistics.cards.monthly_net.title")}
                subtitle={money(data.kpis.net_profit)}
              >
                <div className="portal-stats-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.overview.monthly_net}>
                      <CartesianGrid strokeDasharray="4 4" stroke="rgba(47, 120, 138, 0.10)" vertical={false} />
                      <XAxis dataKey="month_start" tickFormatter={monthLabel} tick={{ fill: "#718894", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={compactMoney} tick={{ fill: "#718894", fontSize: 11 }} axisLine={false} tickLine={false} width={44} />
                      <Tooltip formatter={(value) => money(value)} labelFormatter={monthLabel} contentStyle={tooltipStyle} />
                      <Area type="monotone" dataKey="net" stroke={CHART_COLORS.primary} fill={CHART_COLORS.primary} fillOpacity={0.18} strokeWidth={2.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </StatisticsCard>

              <StatisticsCard
                title={t("portalStatistics.cards.average_invoice.title")}
                subtitle={t("portalStatistics.cards.average_invoice.subtitle")}
              >
                <div className="portal-stats-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.overview.monthly_avg_invoice}>
                      <CartesianGrid strokeDasharray="4 4" stroke="rgba(47, 120, 138, 0.10)" vertical={false} />
                      <XAxis dataKey="month_start" tickFormatter={monthLabel} tick={{ fill: "#718894", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={compactMoney} tick={{ fill: "#718894", fontSize: 11 }} axisLine={false} tickLine={false} width={44} />
                      <Tooltip formatter={(value) => money(value)} labelFormatter={monthLabel} contentStyle={tooltipStyle} />
                      <Bar dataKey="avg" fill={CHART_COLORS.secondary} radius={[10, 10, 4, 4]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </StatisticsCard>

              <StatisticsCard
                title={t("portalStatistics.cards.recent_invoices.title")}
                subtitle={t("portalStatistics.cards.recent_invoices.subtitle")}
              >
                <RecentInvoicesTable
                  items={data.overview.recent_sales}
                  expanded={recentInvoicesExpanded}
                  onToggle={() => setRecentInvoicesExpanded((current) => !current)}
                />
              </StatisticsCard>
            </div>
          </section>

          <section className="portal-stats-section">
            <div className="portal-stats-section__title">
              <p className="portal-eyebrow">{t("portalStatistics.sections.sales.eyebrow")}</p>
              <h3>{t("portalStatistics.sections.sales.title")}</h3>
            </div>
            <div className="portal-stats-grid portal-stats-grid--two">
              <StatisticsCard
                title={t("portalStatistics.cards.sales_total_amount.title")}
                subtitle={money(data.kpis.total_sales)}
              >
                <div className="portal-stats-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.sales.monthly_sales_totals}>
                      <CartesianGrid strokeDasharray="4 4" stroke="rgba(47, 120, 138, 0.10)" vertical={false} />
                      <XAxis dataKey="month_start" tickFormatter={monthLabel} tick={{ fill: "#718894", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={compactMoney} tick={{ fill: "#718894", fontSize: 11 }} axisLine={false} tickLine={false} width={44} />
                      <Tooltip formatter={(value) => money(value)} labelFormatter={monthLabel} contentStyle={tooltipStyle} />
                      <Area type="monotone" dataKey="total" stroke={CHART_COLORS.primary} fill={CHART_COLORS.primary} fillOpacity={0.18} strokeWidth={2.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </StatisticsCard>

              <StatisticsCard
                title={t("portalStatistics.cards.sales_count.title")}
                subtitle={t("portalStatistics.cards.sales_count.subtitle")}
              >
                <div className="portal-stats-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.sales.monthly_sales_count}>
                      <CartesianGrid strokeDasharray="4 4" stroke="rgba(47, 120, 138, 0.10)" vertical={false} />
                      <XAxis dataKey="month_start" tickFormatter={monthLabel} tick={{ fill: "#718894", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#718894", fontSize: 11 }} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
                      <Tooltip formatter={(value) => Number(value || 0).toLocaleString()} labelFormatter={monthLabel} contentStyle={tooltipStyle} />
                      <Bar dataKey="count" fill={CHART_COLORS.secondary} radius={[10, 10, 4, 4]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </StatisticsCard>

              <StatisticsCard
                title={t("portalStatistics.cards.sales_by_type.title")}
                subtitle={t("portalStatistics.cards.sales_by_type.subtitle")}
              >
                <div className="portal-stats-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip formatter={(value) => money(value)} contentStyle={tooltipStyle} />
                      <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                      <Pie data={salesByTypeChart} dataKey="value" nameKey="name" outerRadius="78%">
                        {salesByTypeChart.map((item, index) => (
                          <Cell key={`${item.name}-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </StatisticsCard>

              <StatisticsCard
                title={t("portalStatistics.cards.refund_totals.title")}
                subtitle={money(data.kpis.total_refunds)}
              >
                <div className="portal-stats-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.sales.monthly_refunds_totals}>
                      <CartesianGrid strokeDasharray="4 4" stroke="rgba(47, 120, 138, 0.10)" vertical={false} />
                      <XAxis dataKey="month_start" tickFormatter={monthLabel} tick={{ fill: "#718894", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={compactMoney} tick={{ fill: "#718894", fontSize: 11 }} axisLine={false} tickLine={false} width={44} />
                      <Tooltip formatter={(value) => money(value)} labelFormatter={monthLabel} contentStyle={tooltipStyle} />
                      <Area type="monotone" dataKey="refunds" stroke={CHART_COLORS.danger} fill={CHART_COLORS.danger} fillOpacity={0.16} strokeWidth={2.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </StatisticsCard>
            </div>
          </section>

          <section className="portal-stats-section">
            <div className="portal-stats-section__title">
              <p className="portal-eyebrow">
                {t("portalStatistics.sections.pos_analytics.eyebrow")}
              </p>
              <h3>{t("portalStatistics.sections.pos_analytics.title")}</h3>
            </div>
            <div className="portal-stats-grid portal-stats-grid--two">
              <StatisticsCard
                title={t("portalStatistics.cards.sales_vs_tokens.title")}
                subtitle={t("portalStatistics.cards.sales_vs_tokens.subtitle")}
              >
                <div className="portal-stats-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.pos_analytics.monthly_sales_vs_tokens}>
                      <CartesianGrid strokeDasharray="4 4" stroke="rgba(47, 120, 138, 0.10)" vertical={false} />
                      <XAxis dataKey="month_start" tickFormatter={monthLabel} tick={{ fill: "#718894", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="sales" tickFormatter={compactMoney} tick={{ fill: "#718894", fontSize: 11 }} axisLine={false} tickLine={false} width={44} />
                      <YAxis yAxisId="tokens" orientation="right" tick={{ fill: "#718894", fontSize: 11 }} axisLine={false} tickLine={false} width={34} />
                      <Tooltip
                        formatter={(value, _name, item) =>
                          item?.dataKey === "total_sales"
                            ? money(value)
                            : `${Number(value || 0).toLocaleString()} ${t("portalStatistics.tokens_label")}`
                        }
                        labelFormatter={monthLabel}
                        contentStyle={tooltipStyle}
                      />
                      <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 12 }} />
                      <Line yAxisId="sales" type="monotone" dataKey="total_sales" name={t("portalStatistics.series.sales")} stroke={CHART_COLORS.primary} strokeWidth={2.5} dot={false} />
                      <Line yAxisId="tokens" type="monotone" dataKey="total_tokens" name={t("portalStatistics.series.tokens")} stroke={CHART_COLORS.amber} strokeWidth={2.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </StatisticsCard>

              <StatisticsCard
                title={t("portalStatistics.cards.pos_performance.title")}
                subtitle={t("portalStatistics.cards.pos_performance.subtitle")}
              >
                <div className="portal-stats-chart">
                  {posPerformanceChart.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Tooltip formatter={(value) => money(value)} contentStyle={tooltipStyle} />
                        <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                        <Pie data={posPerformanceChart} dataKey="value" nameKey="name" outerRadius="78%">
                          {posPerformanceChart.map((item, index) => (
                            <Cell key={`${item.name}-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyBlock message={t("portalStatistics.empty.no_pos_sales")} />
                  )}
                </div>
              </StatisticsCard>

              <StatisticsCard
                title={t("portalStatistics.cards.top_pos_users.title")}
                subtitle={t("portalStatistics.cards.top_pos_users.subtitle")}
              >
                <RankList
                  items={data.pos_analytics.top_users_year}
                  valueKey="total_sales"
                  formatter={money}
                  emptyMessage={t("portalStatistics.empty.no_pos_user_sales")}
                />
              </StatisticsCard>

              <StatisticsCard
                title={t("portalStatistics.cards.top_pos_users_by_month.title")}
                subtitle={t("portalStatistics.cards.top_pos_users_by_month.subtitle")}
              >
                <div className="portal-stats-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.pos_analytics.top_users_monthly}>
                      <CartesianGrid strokeDasharray="4 4" stroke="rgba(47, 120, 138, 0.10)" vertical={false} />
                      <XAxis dataKey="month_start" tickFormatter={monthLabel} tick={{ fill: "#718894", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={compactMoney} tick={{ fill: "#718894", fontSize: 11 }} axisLine={false} tickLine={false} width={44} />
                      <Tooltip
                        formatter={(value, name, item) => {
                          const row = item?.payload || {};
                          if (name === "rank1_value") return [money(value), row.rank1_name || t("portalCommon.empty.value")];
                          if (name === "rank2_value") return [money(value), row.rank2_name || t("portalCommon.empty.value")];
                          if (name === "rank3_value") return [money(value), row.rank3_name || t("portalCommon.empty.value")];
                          return [money(value), name];
                        }}
                        labelFormatter={monthLabel}
                        contentStyle={tooltipStyle}
                      />
                      <Bar dataKey="rank1_value" fill={PIE_COLORS[0]} />
                      <Bar dataKey="rank2_value" fill={PIE_COLORS[1]} />
                      <Bar dataKey="rank3_value" fill={PIE_COLORS[2]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </StatisticsCard>
            </div>
          </section>

          <section className="portal-stats-section">
            <div className="portal-stats-section__title">
              <p className="portal-eyebrow">{t("portalStatistics.sections.inventory.eyebrow")}</p>
              <h3>{t("portalStatistics.sections.inventory.title")}</h3>
            </div>
            <div className="portal-stats-grid portal-stats-grid--two">
              <StatisticsCard
                title={t("portalStatistics.cards.top_sold_items_by_month.title")}
                subtitle={t("portalStatistics.cards.top_sold_items_by_month.subtitle")}
              >
                <div className="portal-stats-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.inventory.top_items_monthly}>
                      <CartesianGrid strokeDasharray="4 4" stroke="rgba(47, 120, 138, 0.10)" vertical={false} />
                      <XAxis dataKey="month_start" tickFormatter={monthLabel} tick={{ fill: "#718894", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={compactMoney} tick={{ fill: "#718894", fontSize: 11 }} axisLine={false} tickLine={false} width={44} />
                      <Tooltip
                        formatter={(value, name, item) => {
                          const row = item?.payload || {};
                          if (name === "rank1_total") return [money(value), row.rank1_name || t("portalCommon.empty.value")];
                          if (name === "rank2_total") return [money(value), row.rank2_name || t("portalCommon.empty.value")];
                          if (name === "rank3_total") return [money(value), row.rank3_name || t("portalCommon.empty.value")];
                          return [money(value), name];
                        }}
                        labelFormatter={monthLabel}
                        contentStyle={tooltipStyle}
                      />
                      <Bar dataKey="rank1_total" fill={PIE_COLORS[0]} />
                      <Bar dataKey="rank2_total" fill={PIE_COLORS[1]} />
                      <Bar dataKey="rank3_total" fill={PIE_COLORS[2]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </StatisticsCard>
            </div>
          </section>

          <section className="portal-stats-section">
            <div className="portal-stats-section__title">
              <p className="portal-eyebrow">{t("portalStatistics.sections.clients.eyebrow")}</p>
              <h3>{t("portalStatistics.sections.clients.title")}</h3>
            </div>
            <div className="portal-stats-grid portal-stats-grid--two">
              <StatisticsCard
                title={t("portalStatistics.cards.top_spending_clients.title")}
                subtitle={t("portalStatistics.cards.top_spending_clients.subtitle")}
              >
                <RankList
                  items={data.clients.top_spending_clients}
                  valueKey="total_spent"
                  formatter={money}
                  emptyMessage={t("portalStatistics.empty.no_client_spending")}
                />
              </StatisticsCard>

              <StatisticsCard
                title={t("portalStatistics.cards.client_spending_by_month.title")}
                subtitle={t("portalStatistics.cards.client_spending_by_month.subtitle")}
              >
                <div className="portal-stats-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.clients.spending_monthly}>
                      <CartesianGrid strokeDasharray="4 4" stroke="rgba(47, 120, 138, 0.10)" vertical={false} />
                      <XAxis dataKey="month_start" tickFormatter={monthLabel} tick={{ fill: "#718894", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={compactMoney} tick={{ fill: "#718894", fontSize: 11 }} axisLine={false} tickLine={false} width={44} />
                      <Tooltip
                        formatter={(value, name, item) => {
                          const row = item?.payload || {};
                          if (name === "rank1_value") return [money(value), row.rank1_name || t("portalCommon.empty.value")];
                          if (name === "rank2_value") return [money(value), row.rank2_name || t("portalCommon.empty.value")];
                          if (name === "rank3_value") return [money(value), row.rank3_name || t("portalCommon.empty.value")];
                          return [money(value), name];
                        }}
                        labelFormatter={monthLabel}
                        contentStyle={tooltipStyle}
                      />
                      <Bar dataKey="rank1_value" fill={PIE_COLORS[0]} />
                      <Bar dataKey="rank2_value" fill={PIE_COLORS[1]} />
                      <Bar dataKey="rank3_value" fill={PIE_COLORS[2]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </StatisticsCard>

              <StatisticsCard
                title={t("portalStatistics.cards.top_clients_by_sales_count.title")}
                subtitle={t("portalStatistics.cards.top_clients_by_sales_count.subtitle")}
              >
                <RankList
                  items={data.clients.top_sales_clients}
                  valueKey="sales_count"
                  formatter={(value) => Number(value || 0).toLocaleString()}
                  emptyMessage={t("portalStatistics.empty.no_client_sales_count")}
                />
              </StatisticsCard>

              <StatisticsCard
                title={t("portalStatistics.cards.sales_count_by_month.title")}
                subtitle={t("portalStatistics.cards.sales_count_by_month.subtitle")}
              >
                <div className="portal-stats-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.clients.count_monthly}>
                      <CartesianGrid strokeDasharray="4 4" stroke="rgba(47, 120, 138, 0.10)" vertical={false} />
                      <XAxis dataKey="month_start" tickFormatter={monthLabel} tick={{ fill: "#718894", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#718894", fontSize: 11 }} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
                      <Tooltip
                        formatter={(value, name, item) => {
                          const row = item?.payload || {};
                          if (name === "rank1_value") return [Number(value || 0).toLocaleString(), row.rank1_name || t("portalCommon.empty.value")];
                          if (name === "rank2_value") return [Number(value || 0).toLocaleString(), row.rank2_name || t("portalCommon.empty.value")];
                          if (name === "rank3_value") return [Number(value || 0).toLocaleString(), row.rank3_name || t("portalCommon.empty.value")];
                          return [Number(value || 0).toLocaleString(), name];
                        }}
                        labelFormatter={monthLabel}
                        contentStyle={tooltipStyle}
                      />
                      <Bar dataKey="rank1_value" fill={PIE_COLORS[0]} />
                      <Bar dataKey="rank2_value" fill={PIE_COLORS[1]} />
                      <Bar dataKey="rank3_value" fill={PIE_COLORS[2]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </StatisticsCard>
            </div>
          </section>
        </>
      ) : null}
      {loading && data ? <StatisticsSpinner /> : null}
    </div>
  );
}
