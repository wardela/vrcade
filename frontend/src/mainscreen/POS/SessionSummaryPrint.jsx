import { forwardRef } from "react";
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

const getPosLabel = (summary, t) => {
  const name = summary?.pos_point_name || summary?.pos || "";
  const id = summary?.pos_point_id;

  if (name && id) {
    return `${name} (#${id})`;
  }

  if (name) return name;
  if (id) return t("POSMonitor.print.pos_station_fallback", { id });
  return "—";
};

const getSessionNumbersLabel = (sessionIds) => {
  if (!Array.isArray(sessionIds) || sessionIds.length === 0) {
    return "—";
  }

  return sessionIds.join(", ");
};

const SummaryMetricsTable = ({ summary, t }) => (
  <div className="mb-3 border border-gray-300 rounded-sm overflow-hidden">
    <div className="bg-gray-100 px-3 py-1.5 font-semibold">
      {t("POSMonitor.print.financial_summary")}
    </div>
    <table className="print-table w-full border-collapse text-[10px]">
      <tbody>
        <tr className="border-t">
          <CellLabel>{t("POSMonitor.summary.total_sales")}</CellLabel>
          <CellValue dir="ltr">{formatCurrency(summary.total_sales)}</CellValue>
          <CellLabel>{t("POSMonitor.summary.sold_tokens")}</CellLabel>
          <CellValue dir="ltr">{formatCount(summary.total_tokens_sold)}</CellValue>
          <CellLabel>{t("POSMonitor.summary.manual_charged_tokens")}</CellLabel>
          <CellValue dir="ltr">{formatCount(summary.manual_tokens_charged)}</CellValue>
          <CellLabel>{t("POSMonitor.summary.total_tokens_charged")}</CellLabel>
          <CellValue dir="ltr">{formatCount(summary.total_tokens_charged)}</CellValue>
        </tr>
        <tr className="border-t">
          <CellLabel>{t("POSMonitor.summary.cash")}</CellLabel>
          <CellValue dir="ltr">{formatCurrency(summary.total_cash)}</CellValue>
          <CellLabel>{t("POSMonitor.summary.card")}</CellLabel>
          <CellValue dir="ltr">{formatCurrency(summary.total_card)}</CellValue>
          <CellLabel>{t("POSMonitor.summary.transfer")}</CellLabel>
          <CellValue dir="ltr">{formatCurrency(summary.total_bank_transfer)}</CellValue>
          <CellLabel>{t("POSMonitor.summary.cash_received")}</CellLabel>
          <CellValue dir="ltr">{formatCurrency(summary.total_cash_received)}</CellValue>
          <CellLabel>{t("POSMonitor.summary.change_given")}</CellLabel>
          <CellValue dir="ltr">{formatCurrency(summary.total_change_given)}</CellValue>
        </tr>
      </tbody>
    </table>
  </div>
);

const SoldItemsTable = ({ soldItems, t }) => (
  <div className="border border-gray-300 rounded-sm overflow-hidden">
    <div className="bg-gray-100 px-3 py-1.5 font-semibold">
      {t("POSMonitor.session.sold_items_breakdown")}
    </div>

    {soldItems.length === 0 ? (
      <div className="px-3 py-4 text-center text-[10px] text-gray-500">
        {t("POSMonitor.print.no_sold_items")}
      </div>
    ) : (
      <table className="print-table w-full border-collapse text-[9px]">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-2 py-1.5 text-start font-semibold w-[40%]">
              {t("POSMonitor.table.item")}
            </th>
            <th className="px-2 py-1.5 text-center font-semibold w-[12%]">
              {t("POSMonitor.table.qty_sold")}
            </th>
            <th className="px-2 py-1.5 text-end font-semibold w-[18%]">
              {t("POSMonitor.table.total_sales")}
            </th>
            <th className="px-2 py-1.5 text-center font-semibold w-[15%]">
              {t("POSMonitor.table.tokens_per_item")}
            </th>
            <th className="px-2 py-1.5 text-end font-semibold w-[15%]">
              {t("POSMonitor.table.total_tokens")}
            </th>
          </tr>
        </thead>
        <tbody>
          {soldItems.map((item, index) => (
            <tr key={item.item_id || `${item.item_name}-${index}`} className="border-t">
              <td className="px-2 py-1 align-top">
                {item.item_name || t("POSMonitor.print.item_fallback", { id: item.item_id })}
              </td>
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
);

const AggregateInfoTable = ({ summary, t }) => (
  <div className="mb-3 border border-gray-300 rounded-sm overflow-hidden">
    <div className="bg-gray-100 px-3 py-1.5 font-semibold">
      {t("POSMonitor.print.session_info")}
    </div>
    <table className="print-table w-full border-collapse text-[10px]">
      <tbody>
        <tr className="border-t">
          <CellLabel>{t("POSMonitor.labels.time_frame")}</CellLabel>
          <CellValue dir="ltr">
            {formatDateTime(summary.timeframe_start || summary.started_at)}
            {" - "}
            {formatDateTime(summary.timeframe_end || summary.ended_at)}
          </CellValue>
          <CellLabel>{t("POSMonitor.print.pos_station_filter")}</CellLabel>
          <CellValue>{summary.pos_station_filter || summary.pos_point_name}</CellValue>
          <CellLabel>{t("POSMonitor.labels.sessions_count")}</CellLabel>
          <CellValue dir="ltr">{summary.session_count || 0}</CellValue>
        </tr>
        <tr className="border-t">
          <CellLabel>{t("POSMonitor.labels.duration")}</CellLabel>
          <CellValue dir="ltr">{summary.duration_label || "—"}</CellValue>
          <CellLabel>{t("POSMonitor.labels.pos_count")}</CellLabel>
          <CellValue dir="ltr">{summary.pos_point_count || 0}</CellValue>
          <CellLabel>{t("POSMonitor.summary.invoices")}</CellLabel>
          <CellValue dir="ltr">{summary.invoice_count || 0}</CellValue>
        </tr>
      </tbody>
    </table>
  </div>
);

const PosBreakdownInfoTable = ({ summary, t }) => (
  <div className="mb-3 border border-gray-300 rounded-sm overflow-hidden">
    <div className="bg-gray-100 px-3 py-1.5 font-semibold">
      {t("POSMonitor.print.session_info")}
    </div>
    <table className="print-table w-full border-collapse text-[10px]">
      <tbody>
        <tr className="border-t">
          <CellLabel>{t("POSMonitor.labels.pos_station")}</CellLabel>
          <CellValue>{getPosLabel(summary, t)}</CellValue>
          <CellLabel>{t("POSMonitor.labels.sessions_count")}</CellLabel>
          <CellValue dir="ltr">{summary.session_count || 0}</CellValue>
          <CellLabel>{t("POSMonitor.labels.duration")}</CellLabel>
          <CellValue dir="ltr">{summary.duration_label || "—"}</CellValue>
        </tr>
        <tr className="border-t">
          <CellLabel>{t("POSMonitor.print.sessions_list")}</CellLabel>
          <CellValue colSpan={5} dir="ltr">
            {getSessionNumbersLabel(summary.session_ids)}
          </CellValue>
        </tr>
      </tbody>
    </table>
  </div>
);

const PrintHeader = ({ company, reportTitle, textAlign, t, showSessionTag, sessionId }) => (
  <>
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
        <span className="font-bold whitespace-nowrap">{reportTitle}</span>
        {showSessionTag ? (
          <>
            <span className="font-bold whitespace-nowrap">|</span>
            <span className="text-gray-700 whitespace-nowrap">
              {t("POSMonitor.labels.session_number_prefix")}{" "}
              <span dir="ltr" className="font-mono text-gray-900">
                {sessionId}
              </span>
            </span>
          </>
        ) : null}
      </div>
    </div>
  </>
);

const PrintFooter = ({ t }) => (
  <div className="mt-6 border-t border-gray-300 py-2 print-footer" dir="ltr">
    <div className="text-center text-[11px] text-gray-700 flex items-center justify-center gap-2">
      <span className="text-gray-500">{t("POSMonitor.print.powered_by")}</span>
      <BrandLogo size={16} />
      <span className="font-semibold tracking-wide">INNOVATION ELEMENTS™</span>
    </div>
  </div>
);

const PrintStyles = () => (
  <style>{`
    @page {
      size: A4 portrait;
      margin: 0;
    }

    @media print {
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #fff !important;
      }

      body {
        width: 210mm;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .print-sheet {
        width: 210mm !important;
        min-height: 297mm !important;
        margin: 0 auto !important;
        box-sizing: border-box !important;
        background: #fff !important;
        box-shadow: none !important;
        break-after: page;
        page-break-after: always;
      }

      .print-sheet:last-child {
        break-after: auto;
        page-break-after: auto;
      }

      .print-sheet__inner {
        min-height: 297mm;
        padding: 8mm 8mm 10mm;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
      }

      .print-keep-together {
        break-inside: avoid;
        page-break-inside: avoid;
      }

      .print-table {
        width: 100%;
        border-collapse: collapse;
      }

      .print-table thead {
        display: table-header-group;
      }

      .print-table tfoot {
        display: table-footer-group;
      }

      .print-table tr,
      .print-table td,
      .print-table th {
        break-inside: avoid;
        page-break-inside: avoid;
      }

      .print-section-gap {
        margin-top: 5mm;
      }

      .print-footer {
        margin-top: auto;
      }
    }
  `}</style>
);

const PrintSheet = ({ children, dir }) => (
  <div dir={dir} className="print-sheet bg-white text-[10px] text-gray-900 font-sans">
    <div className="print-sheet__inner" style={{ lineHeight: "1.35" }}>
      <PrintStyles />
      {children}
    </div>
  </div>
);

const AggregateSummaryPrint = ({ session, company, pageDir, textAlign, t }) => {
  const posSummaries = session?.pos_summaries || [];
  const soldItems = session?.sold_items_breakdown || [];

  return (
    <>
      <PrintSheet dir={pageDir}>
        <PrintHeader
          company={company}
          reportTitle={t("POSMonitor.print.aggregate_title")}
          textAlign={textAlign}
          t={t}
          showSessionTag={false}
        />

        <section className="print-keep-together">
          <AggregateInfoTable summary={session} t={t} />
        </section>
        <section className="print-keep-together">
          <SummaryMetricsTable summary={session} t={t} />
        </section>
        <section className="print-section-gap">
          <SoldItemsTable soldItems={soldItems} t={t} />
        </section>

        <div className="mt-5 mb-3 border-b border-gray-300 pb-2 print-keep-together">
          <h3 className="text-[12px] font-bold text-gray-900">
            {t("POSMonitor.print.pos_breakdown_title")}
          </h3>
        </div>

        {posSummaries.length === 0 ? (
          <div className="rounded-sm border border-dashed border-gray-300 px-4 py-5 text-center text-[10px] text-gray-500 print-keep-together">
            {t("POSMonitor.print.no_matching_sessions")}
          </div>
        ) : null}
        <PrintFooter t={t} />
      </PrintSheet>

      {posSummaries.map((posSummary, index) => (
        <PrintSheet
          key={`${posSummary.pos_point_id || posSummary.pos_point_name}-${index}`}
          dir={pageDir}
        >
          <PrintHeader
            company={company}
            reportTitle={t("POSMonitor.print.aggregate_title")}
            textAlign={textAlign}
            t={t}
            showSessionTag={false}
          />

          <section className="print-keep-together">
            <div className="mb-2 flex items-center justify-between border-b border-gray-200 pb-1.5">
              <div className="text-[11px] font-bold text-gray-900">
                {getPosLabel(posSummary, t)}
              </div>
              <div className="text-[10px] text-gray-600">
                {t("POSMonitor.labels.sessions_count")}: {posSummary.session_count || 0}
              </div>
            </div>

            <PosBreakdownInfoTable summary={posSummary} t={t} />
          </section>

          <section className="print-keep-together">
            <SummaryMetricsTable summary={posSummary} t={t} />
          </section>

          <section className="print-section-gap">
            <SoldItemsTable soldItems={posSummary.sold_items_breakdown || []} t={t} />
          </section>

          <PrintFooter t={t} />
        </PrintSheet>
      ))}
    </>
  );
};

const SingleSessionPrint = ({ session, company, pageDir, textAlign, t }) => {
  const soldItems = session?.sold_items_breakdown || [];
  const scale = getPrintScale(soldItems.length);

  return (
    <div
      dir={pageDir}
      className="page bg-white text-[10px] text-gray-900 font-sans"
      style={{
        width: "210mm",
        minHeight: "297mm",
        overflow: "hidden",
        boxSizing: "border-box",
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
          className="px-[8mm] pb-[10mm] pt-[8mm]"
          style={{
            lineHeight: "1.35",
            position: "relative",
            minHeight: "297mm",
            maxHeight: "297mm",
            overflow: "hidden",
            boxSizing: "border-box",
            backgroundColor: "#fff",
          }}
        >
          <style>{`
            @page {
              size: A4;
              margin: 0;
            }

            @media print {
              html, body {
                margin: 0;
                padding: 0;
                background: #fff !important;
              }

              body {
                width: 210mm;
                height: 297mm;
                overflow: hidden;
              }

              .page {
                width: 210mm !important;
                min-height: 297mm !important;
                margin: 0 !important;
                page-break-after: avoid;
                page-break-inside: avoid;
                box-shadow: none !important;
                background: #fff !important;
              }
            }
          `}</style>

          <PrintHeader
            company={company}
            reportTitle={t("POSMonitor.print.title")}
            textAlign={textAlign}
            t={t}
            showSessionTag
            sessionId={session.id}
          />

          <div className="mb-3 border border-gray-300 rounded-sm overflow-hidden">
            <div className="bg-gray-100 px-3 py-1.5 font-semibold">
              {t("POSMonitor.print.session_info")}
            </div>
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

          <SummaryMetricsTable summary={session} t={t} />
          <SoldItemsTable soldItems={soldItems} t={t} />

          <div
            className="absolute bottom-[8mm] left-[8mm] right-[8mm] bg-white border-t border-gray-300 py-2"
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
};

const SessionSummaryPrint = forwardRef(({ session, company }, ref) => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";
  const pageDir = isArabic ? "rtl" : "ltr";
  const textAlign = isArabic ? "text-right" : "text-left";

  if (!session) return null;

  return (
    <div ref={ref}>
      {session.summary_kind === "aggregate" ? (
        <AggregateSummaryPrint
          session={session}
          company={company}
          pageDir={pageDir}
          textAlign={textAlign}
          t={t}
        />
      ) : (
        <SingleSessionPrint
          session={session}
          company={company}
          pageDir={pageDir}
          textAlign={textAlign}
          t={t}
        />
      )}
    </div>
  );
});

SessionSummaryPrint.displayName = "SessionSummaryPrint";

function CellLabel({ children }) {
  return (
    <td className="bg-gray-50 px-2 py-1.5 font-semibold text-gray-700 border-s border-gray-300 whitespace-nowrap">
      {children}
    </td>
  );
}

function CellValue({ children, dir, colSpan }) {
  return (
    <td className="px-2 py-1.5 text-gray-900" dir={dir} colSpan={colSpan}>
      {children}
    </td>
  );
}

export default SessionSummaryPrint;
