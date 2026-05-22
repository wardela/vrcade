import { useTranslation } from "react-i18next";
import { money } from "./utils";

export default function RecentInvoicesSection({ items }) {
  const { t } = useTranslation();

  return (
    <section className="owners-section owners-section--compact">
      <div className="owners-section__header">
        <div>
          <p className="owners-section__eyebrow">
            {t("portalDashboard.sections.recent_invoices")}
          </p>
        </div>
      </div>

      <div className="owners-invoice-list">
        {items.length === 0 ? (
          <div className="owners-empty-state">
            {t("portalDashboard.empty.no_recent_invoices")}
          </div>
        ) : (
          items.map((item) => (
            <button key={item.invoice_number} type="button" className="owners-invoice-row">
              <strong className="owners-invoice-row__number">#{item.invoice_number}</strong>
              <span className="owners-invoice-row__user">{item.issued_by}</span>
              <strong className="owners-invoice-row__amount">{money(item.total)}</strong>
            </button>
          ))
        )}
      </div>
    </section>
  );
}
