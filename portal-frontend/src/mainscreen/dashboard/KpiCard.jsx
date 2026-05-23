import {
  BadgeDollarSign,
  CalendarDays,
  ReceiptText,
  TrendingUp,
} from "lucide-react";
import { compactMoney, money } from "./utils";
import { formatPortalNumber } from "../../utils/portalFormatting";

const formatByVariant = (value, variant) => {
  if (variant === "count") {
    return formatPortalNumber(value);
  }

  if (variant === "currency-compact") {
    return `${compactMoney(value)} JD`;
  }

  return money(value);
};

const ICONS = {
  count: ReceiptText,
  average: TrendingUp,
  total: BadgeDollarSign,
  month: CalendarDays,
};

const getIconKey = (label, variant, iconKey) => {
  if (iconKey && ICONS[iconKey]) {
    return iconKey;
  }

  const normalizedLabel = String(label || "").toLowerCase();

  if (normalizedLabel.includes("average")) {
    return "average";
  }

  if (normalizedLabel.includes("month")) {
    return "month";
  }

  if (variant === "count" || normalizedLabel.includes("count")) {
    return "count";
  }

  return "total";
};

export default function KpiCard({
  label,
  value,
  variant = "currency",
  tone = "teal",
  size = "sm",
  iconKey,
}) {
  const resolvedIconKey = getIconKey(label, variant, iconKey);
  const Icon = ICONS[resolvedIconKey];

  return (
    <article className={`owners-kpi-card owners-kpi-card--${tone} owners-kpi-card--${size}`}>
      <div className="owners-kpi-card__top">
        <div className={`owners-kpi-card__icon owners-kpi-card__icon--${tone}`}>
          <Icon aria-hidden="true" strokeWidth={2} />
        </div>
        <p className="owners-kpi-card__label">{label}</p>
      </div>

      <h3 className="owners-kpi-card__value">{formatByVariant(value, variant)}</h3>
    </article>
  );
}
