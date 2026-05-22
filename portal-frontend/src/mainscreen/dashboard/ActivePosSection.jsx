import { useTranslation } from "react-i18next";
import { money, formatStatusLabel } from "./utils";

export default function ActivePosSection({ items }) {
  const { t } = useTranslation();

  return (
    <section className="owners-section">
      <div className="owners-section__header">
        <div>
          <p className="owners-section__eyebrow">{t("portalDashboard.sections.active_pos")}</p>
        </div>
      </div>

      <div className="owners-pos-list">
        {items.length === 0 ? (
          <div className="owners-empty-state">
            {t("portalDashboard.empty.no_pos_activity")}
          </div>
        ) : (
          items.map((item) => (
            <button key={item.id} type="button" className="owners-pos-card">
              <div className="owners-pos-card__top">
                <div>
                  <h4>{item.pos_name}</h4>
                  <p>{item.current_user}</p>
                </div>
                <span className={`owners-status-pill owners-status-pill--${String(item.session_status).toLowerCase()}`}>
                  {t(
                    `portalDashboard.status.${String(item.session_status || "")
                      .toLowerCase()
                      .replace(/[^a-z_]/g, "")}`,
                    { defaultValue: formatStatusLabel(item.session_status) }
                  )}
                </span>
              </div>

              <div className="owners-pos-card__metrics">
                <div>
                  <span>{t("portalDashboard.metrics.sales")}</span>
                  <strong>{money(item.total_sales)}</strong>
                </div>
                <div>
                  <span>{t("portalDashboard.metrics.invoices")}</span>
                  <strong>{Number(item.invoice_count || 0).toLocaleString()}</strong>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </section>
  );
}
