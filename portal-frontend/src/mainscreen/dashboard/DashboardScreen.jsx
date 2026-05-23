import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchPortalDashboard } from "../../api/portalApi";
import KpiCard from "./KpiCard";
import TrendChartCard from "./TrendChartCard";
import PaymentTypeChartCard from "./PaymentTypeChartCard";
import ActivePosSection from "./ActivePosSection";
import RecentInvoicesSection from "./RecentInvoicesSection";
import {
  compactMoney,
  formatDayMonthLabel,
  formatHourLabel,
  formatMonthNameLabel,
  getJordanToday,
  money,
} from "./utils";

const shiftWithinBounds = (current, delta, min, max) =>
  Math.min(max, Math.max(min, current + delta));

export default function DashboardScreen() {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState(getJordanToday());
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hourlyEndIndex, setHourlyEndIndex] = useState(0);
  const [dailyEndIndex, setDailyEndIndex] = useState(0);
  const [monthlyEndIndex, setMonthlyEndIndex] = useState(0);

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const payload = await fetchPortalDashboard(selectedDate);

        if (!mounted) {
          return;
        }

        setDashboard(payload);
        setHourlyEndIndex(payload.windows.default_hourly_end_index);
        setDailyEndIndex(payload.windows.default_daily_end_index);
        setMonthlyEndIndex(payload.windows.default_monthly_end_index);
      } catch (requestError) {
        if (!mounted) {
          return;
        }

        setError(requestError.message || t("portalDashboard.errors.load_failed"));
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, [selectedDate, t]);

  const handleDateChange = (event) => {
    setSelectedDate(event.target.value);
  };

  if (loading) {
    return (
      <div className="owners-dashboard">
        <div className="owners-dashboard__date-row owners-dashboard__date-row--loading">
          <div className="owners-skeleton owners-skeleton--date" />
        </div>
        <div className="owners-kpi-grid">
          <div className="owners-skeleton owners-skeleton--kpi" />
          <div className="owners-skeleton owners-skeleton--kpi" />
          <div className="owners-skeleton owners-skeleton--kpi owners-skeleton--wide" />
          <div className="owners-skeleton owners-skeleton--kpi owners-skeleton--wide" />
        </div>
        <div className="owners-chart-grid">
          <div className="owners-chart-row owners-chart-row--duo">
            <div className="owners-skeleton owners-skeleton--chart" />
            <div className="owners-skeleton owners-skeleton--chart" />
          </div>
          <div className="owners-chart-row owners-chart-row--duo">
            <div className="owners-skeleton owners-skeleton--chart" />
            <div className="owners-skeleton owners-skeleton--chart" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="owners-dashboard">
        <div className="owners-dashboard__date-row">
          <label className="owners-date-picker">
            <span>{t("portalCommon.fields.date")}</span>
            <input type="date" lang="en" dir="ltr" value={selectedDate} onChange={handleDateChange} />
          </label>
        </div>
        <div className="owners-error-state">{error}</div>
      </div>
    );
  }

  if (!dashboard) {
    return null;
  }

  return (
    <div className="owners-dashboard">
      <div className="owners-dashboard__date-row">
        <label className="owners-date-picker">
          <span>{t("portalCommon.fields.date")}</span>
          <input type="date" lang="en" dir="ltr" value={selectedDate} onChange={handleDateChange} />
        </label>
      </div>

      <section className="owners-kpi-grid">
        <KpiCard
          label={t("portalDashboard.kpis.invoice_count")}
          value={dashboard.kpis.invoice_count}
          variant="count"
          tone="slate"
          size="sm"
          iconKey="count"
        />
        <KpiCard
          label={t("portalDashboard.kpis.average_invoice_value")}
          value={dashboard.kpis.average_invoice_value}
          variant="currency"
          tone="ice"
          size="sm"
          iconKey="average"
        />
        <KpiCard
          label={t("portalDashboard.kpis.total_sales_for_day")}
          value={dashboard.kpis.total_sales}
          variant="currency"
          tone="teal"
          size="lg"
          iconKey="total"
        />
        <KpiCard
          label={t("portalDashboard.kpis.month_to_date_sales")}
          value={dashboard.kpis.month_to_date_sales}
          variant="currency"
          tone="navy"
          size="xl"
          iconKey="month"
        />
      </section>

      <section className="owners-chart-grid">
        <div className="owners-chart-row owners-chart-row--duo">
          <TrendChartCard
            title={t("portalDashboard.charts.today_sales_by_hour")}
            data={dashboard.charts.hourly_sales}
            valueKey="total_sales"
            visibleCount={dashboard.windows.hourly_visible_count}
            endIndex={hourlyEndIndex}
            maxEndIndex={dashboard.windows.default_hourly_end_index}
            onShiftBackward={() =>
              setHourlyEndIndex((value) =>
                shiftWithinBounds(
                  value,
                  -1,
                  dashboard.windows.hourly_visible_count - 1,
                  dashboard.windows.default_hourly_end_index
                )
              )
            }
            onShiftForward={() =>
              setHourlyEndIndex((value) =>
                shiftWithinBounds(
                  value,
                  1,
                  dashboard.windows.hourly_visible_count - 1,
                  dashboard.windows.default_hourly_end_index
                )
              )
            }
            labelFormatter={(item) => formatHourLabel(item.hour_index)}
            valueFormatter={money}
            axisValueFormatter={compactMoney}
            lineStyle="area"
          />

          <TrendChartCard
            title={t("portalDashboard.charts.week_sales_by_day")}
            data={dashboard.charts.daily_sales}
            valueKey="total_sales"
            visibleCount={dashboard.windows.daily_visible_count}
            endIndex={dailyEndIndex}
            maxEndIndex={dashboard.windows.default_daily_end_index}
            onShiftBackward={() =>
              setDailyEndIndex((value) =>
                shiftWithinBounds(
                  value,
                  -1,
                  dashboard.windows.daily_visible_count - 1,
                  dashboard.windows.default_daily_end_index
                )
              )
            }
            onShiftForward={() =>
              setDailyEndIndex((value) =>
                shiftWithinBounds(
                  value,
                  1,
                  dashboard.windows.daily_visible_count - 1,
                  dashboard.windows.default_daily_end_index
                )
              )
            }
            labelFormatter={(item) => formatDayMonthLabel(item.sales_date)}
            valueFormatter={money}
            axisValueFormatter={compactMoney}
            lineStyle="area"
          />
        </div>

        <div className="owners-chart-row owners-chart-row--duo">
          <TrendChartCard
            title={t("portalDashboard.charts.year_sales_by_month")}
            data={dashboard.charts.monthly_sales}
            valueKey="total_sales"
            visibleCount={dashboard.windows.monthly_visible_count}
            endIndex={monthlyEndIndex}
            maxEndIndex={dashboard.windows.default_monthly_end_index}
            onShiftBackward={() =>
              setMonthlyEndIndex((value) =>
                shiftWithinBounds(
                  value,
                  -1,
                  dashboard.windows.monthly_visible_count - 1,
                  dashboard.windows.default_monthly_end_index
                )
              )
            }
            onShiftForward={() =>
              setMonthlyEndIndex((value) =>
                shiftWithinBounds(
                  value,
                  1,
                  dashboard.windows.monthly_visible_count - 1,
                  dashboard.windows.default_monthly_end_index
                )
              )
            }
            labelFormatter={(item) => formatMonthNameLabel(item.month_start)}
            valueFormatter={money}
            axisValueFormatter={compactMoney}
            chartType="bar"
          />

          <PaymentTypeChartCard
            title={t("portalDashboard.charts.payment_types")}
            data={dashboard.charts.payment_types}
          />
        </div>
      </section>

      <ActivePosSection items={dashboard.active_pos} />
      <RecentInvoicesSection items={dashboard.recent_invoices} />
    </div>
  );
}
