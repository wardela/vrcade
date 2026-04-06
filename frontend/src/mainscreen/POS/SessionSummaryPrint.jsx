import React, { forwardRef } from "react";
import BrandLogo from "../../components/brandlogo";
import { useTranslation } from "react-i18next";

const formatDateTime = (value) => {
  if (!value) return "—";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
};

const formatCurrency = (value) => `${Number(value || 0).toFixed(3)} JOD`;

const formatCount = (value) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: Number(value || 0) % 1 === 0 ? 0 : 3,
    maximumFractionDigits: 3,
  });

const getPrintScale = (rowCount) => {
  if (rowCount <= 10) return 1;
  if (rowCount <= 16) return 0.95;
  if (rowCount <= 22) return 0.9;
  if (rowCount <= 28) return 0.85;
  return 0.8;
};

const SessionSummaryPrint = forwardRef(({ session, company }, ref) => {
  const { t, i18n } = useTranslation();
  const soldItems = session?.sold_items_breakdown || [];
  const scale = getPrintScale(soldItems.length);
  const isArabic = i18n.language === "ar";
  const pageDir = isArabic ? "rtl" : "ltr";
  const textAlign = isArabic ? "text-right" : "text-left";

  if (!session) return null;

  return (
    <div
      ref={ref}
      dir={pageDir}
      className="page bg-white text-[10px] text-gray-900 font-sans"
      style={{
        width: "198mm",
        height: "285mm",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top center",
          width: `${100 / scale}%`,
          minHeight: `${100 / scale}%`,
        }}
      >
        <div
          className="p-8"
          style={{
            lineHeight: "1.35",
            position: "relative",
            minHeight: "285mm",
            maxHeight: "285mm",
            overflow: "hidden",
          }}
        >
          <style>{`
            @page {
              size: A4;
              margin: 6mm;
            }

            @media print {
              body {
                width: 210mm;
                height: 297mm;
                overflow: hidden;
              }

              .page {
                page-break-after: avoid;
                page-break-inside: avoid;
              }
            }
          `}</style>

          <div className="flex justify-between items-start pb-4 mb-3 border-b border-gray-400">
            <div className="flex gap-4 items-start max-w-[65%]">
              <div className="w-20 h-20 flex items-center justify-center flex-shrink-0">
                {company?.logo_url && (
                  <img
                    src={company.logo_url}
                    alt={t("POSMonitor.print.company_logo")}
                    className="max-h-full max-w-full object-contain"
                  />
                )}
              </div>

              <div className={`${textAlign} leading-snug`}>
                <h2 className="text-xl font-bold text-black">{company?.company_name}</h2>

                {company?.company_location && (
                  <p className="text-sm text-gray-700 mt-1">{company.company_location}</p>
                )}

                {company?.phone_number && (
                  <p className="text-sm text-gray-700 mt-0.5" dir="ltr">
                    {company.phone_number}
                  </p>
                )}
              </div>
            </div>

            {company?.tax_number && (
              <div className={`${textAlign} border border-gray-300 rounded-md px-5 py-3`}>
                <p className="text-xs text-gray-600 mb-1">{t("POSMonitor.print.tax_number")}</p>
                <p className="text-lg font-semibold tracking-wide" dir="ltr">
                  {company.tax_number}
                </p>
              </div>
            )}
          </div>

          <div className="mb-4 flex justify-center">
            <div className="flex items-center gap-4 px-4 py-1.5 border border-gray-500 rounded-md text-[12px] text-gray-800 tracking-wide">
              <span className="font-bold whitespace-nowrap">{t("POSMonitor.print.title")}</span>
              <span className="font-bold whitespace-nowrap">|</span>
              <span className="text-gray-700 whitespace-nowrap">
                {t("POSMonitor.labels.session_number_prefix")}
                {" "}
                <span dir="ltr" className="font-mono text-gray-900">{session.id}</span>
              </span>
            </div>
          </div>

          <div className="mb-3 border border-gray-300 rounded-sm overflow-hidden">
            <div className="bg-gray-100 px-3 py-1.5 font-semibold">{t("POSMonitor.print.session_info")}</div>
            <table className="w-full border-collapse text-[10px]">
              <tbody>
                <tr className="border-t">
                  <CellLabel>{t("POSMonitor.labels.session_id")}</CellLabel>
                  <CellValue dir="ltr">#{session.id}</CellValue>
                  <CellLabel>{t("POSMonitor.labels.pos_station")}</CellLabel>
                  <CellValue>{session.pos_point_name || session.pos || "—"}</CellValue>
                  <CellLabel>{t("POSMonitor.labels.employee_name")}</CellLabel>
                  <CellValue>
                    {session.employee_full_name || session.full_name || session.username || "—"}
                  </CellValue>
                </tr>
                <tr className="border-t">
                  <CellLabel>{t("POSMonitor.labels.started")}</CellLabel>
                  <CellValue dir="ltr">{formatDateTime(session.started_at)}</CellValue>
                  <CellLabel>{t("POSMonitor.labels.ended")}</CellLabel>
                  <CellValue dir="ltr">{formatDateTime(session.ended_at)}</CellValue>
                  <CellLabel>{t("POSMonitor.labels.duration")}</CellLabel>
                  <CellValue dir="ltr">{session.duration_label || "—"}</CellValue>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mb-3 border border-gray-300 rounded-sm overflow-hidden">
            <div className="bg-gray-100 px-3 py-1.5 font-semibold">{t("POSMonitor.print.financial_summary")}</div>
            <table className="w-full border-collapse text-[10px]">
              <tbody>
                <tr className="border-t">
                  <CellLabel>{t("POSMonitor.summary.total_sales")}</CellLabel>
                  <CellValue dir="ltr">{formatCurrency(session.total_sales)}</CellValue>
                  <CellLabel>{t("POSMonitor.summary.total_tokens")}</CellLabel>
                  <CellValue dir="ltr">{formatCount(session.total_tokens_sold)}</CellValue>
                  <CellLabel>{t("POSMonitor.summary.cash")}</CellLabel>
                  <CellValue dir="ltr">{formatCurrency(session.total_cash)}</CellValue>
                  <CellLabel>{t("POSMonitor.summary.card")}</CellLabel>
                  <CellValue dir="ltr">{formatCurrency(session.total_card)}</CellValue>
                  <CellLabel>{t("POSMonitor.summary.transfer")}</CellLabel>
                  <CellValue dir="ltr">{formatCurrency(session.total_bank_transfer)}</CellValue>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="border border-gray-300 rounded-sm overflow-hidden">
            <div className="bg-gray-100 px-3 py-1.5 font-semibold">{t("POSMonitor.session.sold_items_breakdown")}</div>

            {(soldItems || []).length === 0 ? (
              <div className="px-3 py-4 text-center text-[10px] text-gray-500">
                {t("POSMonitor.print.no_sold_items")}
              </div>
            ) : (
              <table className="w-full border-collapse text-[9px]">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-2 py-1.5 text-start font-semibold w-[40%]">{t("POSMonitor.table.item")}</th>
                    <th className="px-2 py-1.5 text-center font-semibold w-[12%]">{t("POSMonitor.table.qty_sold")}</th>
                    <th className="px-2 py-1.5 text-end font-semibold w-[18%]">{t("POSMonitor.table.total_sales")}</th>
                    <th className="px-2 py-1.5 text-center font-semibold w-[15%]">{t("POSMonitor.table.tokens_per_item")}</th>
                    <th className="px-2 py-1.5 text-end font-semibold w-[15%]">{t("POSMonitor.table.total_tokens")}</th>
                  </tr>
                </thead>
                <tbody>
                  {soldItems.map((item, index) => (
                    <tr key={item.item_id || `${item.item_name}-${index}`} className="border-t">
                      <td className="px-2 py-1 align-top">{item.item_name || t("POSMonitor.print.item_fallback", { id: item.item_id })}</td>
                      <td className="px-2 py-1 text-center align-top" dir="ltr">
                        {formatCount(item.quantity_sold)}
                      </td>
                      <td className="px-2 py-1 text-end align-top" dir="ltr">
                        {formatCurrency(item.total_amount)}
                      </td>
                      <td className="px-2 py-1 text-center align-top" dir="ltr">
                        {formatCount(item.tokens_per_item)}
                      </td>
                      <td className="px-2 py-1 text-end align-top" dir="ltr">
                        {formatCount(item.total_tokens)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div
            className="absolute bottom-0 left-0 w-full bg-white border-t border-gray-300 py-2"
            dir="ltr"
          >
            <div className="text-center text-[11px] text-gray-700 flex items-center justify-center gap-2">
              <span className="text-gray-500">{t("POSMonitor.print.powered_by")}</span>
              <BrandLogo size={16} />
              <span className="font-semibold tracking-wide">INNOVATION ELEMENTS™</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

function CellLabel({ children }) {
  return (
    <td className="bg-gray-50 px-2 py-1.5 font-semibold text-gray-700 border-s border-gray-300 whitespace-nowrap">
      {children}
    </td>
  );
}

function CellValue({ children, dir }) {
  return (
    <td className="px-2 py-1.5 text-gray-900" dir={dir}>
      {children}
    </td>
  );
}

export default SessionSummaryPrint;
