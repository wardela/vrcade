import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { money } from "./utils";

const PAYMENT_COLORS = {
  cash: "#2f788a",
  card: "#5db5c2",
  bank_transfer: "#9cd7df",
};

function PaymentTooltip({ active, payload }) {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0]?.payload;

  if (!item) {
    return null;
  }

  return (
    <div className="owners-chart-tooltip">
      <p>{item.label}</p>
      <strong>{money(item.value)}</strong>
    </div>
  );
}

export default function PaymentTypeChartCard({ title, data = [] }) {
  const { t } = useTranslation();
  const chartData = useMemo(
    () =>
      data
        .filter((item) => item?.key !== "others")
        .map((item) => ({
          ...item,
          label: t(`portalCommon.payment_methods.${item.key}`, {
            defaultValue: item.label,
          }),
          value: Number(item.amount || 0),
          color: PAYMENT_COLORS[item.key] || "#d9e8ed",
        })),
    [data, t]
  );

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <article className="owners-chart-card owners-chart-card--pie">
      <div className="owners-chart-card__header">
        <div>
          <p className="owners-chart-card__eyebrow">{title}</p>
          <h4>{money(total)}</h4>
        </div>
      </div>

      <div className="owners-payment-card__body">
        <div className="owners-payment-card__canvas">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<PaymentTooltip />} />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="label"
                innerRadius={52}
                outerRadius={80}
                paddingAngle={3}
                stroke="#ffffff"
                strokeWidth={3}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.key} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="owners-payment-card__legend">
          {chartData.map((item) => {
            const share = total > 0 ? Math.round((item.value / total) * 100) : 0;

            return (
              <div key={item.key} className="owners-payment-card__legend-item">
                <div className="owners-payment-card__legend-copy">
                  <span
                    className="owners-payment-card__legend-dot"
                    style={{ backgroundColor: item.color }}
                    aria-hidden="true"
                  />
                  <div className="owners-payment-card__legend-text">
                    <strong>{item.label}</strong>
                  </div>
                </div>
                <div className="owners-payment-card__legend-values">
                  <span>{money(item.value)}</span>
                  <small>{share}%</small>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}
