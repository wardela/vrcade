import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchPortalInvoices } from "../../api/portalApi";
import InvoiceDetailModal from "./InvoiceDetailModal";

const PAGE_SIZE = 20;
const pad = (value) => String(value).padStart(2, "0");
const getDefaultDateFilters = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());

  return {
    dateFrom: `${year}-${month}-01`,
    dateTo: `${year}-${month}-${day}`,
  };
};

const money = (value, currency = "JOD") =>
  `${Number(value || 0).toFixed(3)} ${currency || "JOD"}`;

const formatDateTime = (value, locale) => {
  if (!value) return "—";

  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
};

function NoAccess() {
  const { t } = useTranslation();

  return (
    <div className="rounded-[28px] border border-[#f1d4d4] bg-[#fff7f7] px-5 py-6 text-center shadow-[0_18px_36px_rgba(166,74,74,0.08)]">
      <p className="portal-eyebrow">{t("portalShell.modules.invoices")}</p>
      <h3 className="text-lg font-semibold text-[#8e3d3d]">
        {t("portalInvoices.no_access")}
      </h3>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="rounded-[24px] border border-dashed border-[#dbe7ec] bg-[#fbfdfe] px-5 py-10 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

function SearchField({ label, children }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-600">
      <span>{label}</span>
      {children}
    </label>
  );
}

export default function InvoicesScreen({ session }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage === "ar" ? "ar-JO" : undefined;
  const salesPerm = session?.permissions?.sales || {};
  const canView = salesPerm.view === true;
  const defaultDateFilters = getDefaultDateFilters();

  const [queryInput, setQueryInput] = useState("");
  const [filters, setFilters] = useState({
    q: "",
    dateFrom: defaultDateFilters.dateFrom,
    dateTo: defaultDateFilters.dateTo,
  });
  const [dateFromInput, setDateFromInput] = useState(defaultDateFilters.dateFrom);
  const [dateToInput, setDateToInput] = useState(defaultDateFilters.dateTo);
  const [rows, setRows] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const loadInvoices = async ({
    nextOffset = 0,
    append = false,
    nextFilters = filters,
  } = {}) => {
    try {
      setError("");
      if (append) setLoadingMore(true);
      else setLoading(true);

      const payload = await fetchPortalInvoices({
        limit: PAGE_SIZE,
        offset: nextOffset,
        q: nextFilters.q,
        dateFrom: nextFilters.dateFrom,
        dateTo: nextFilters.dateTo,
      });

      setRows((currentRows) =>
        append ? [...currentRows, ...(payload.rows || [])] : payload.rows || []
      );
      setOffset(nextOffset);
      setHasMore(payload.has_more === true);
      setTotalCount(Number(payload.total_count || 0));
    } catch (requestError) {
      setError(requestError.message || t("portalInvoices.errors.load_failed"));
      if (!append) {
        setRows([]);
        setHasMore(false);
        setTotalCount(0);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!canView) return;
    loadInvoices({ nextOffset: 0, append: false, nextFilters: filters });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView, filters.q, filters.dateFrom, filters.dateTo, t]);

  if (!canView) {
    return <NoAccess />;
  }

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setFilters({
      q: queryInput.trim(),
      dateFrom: dateFromInput,
      dateTo: dateToInput,
    });
  };

  const handleResetFilters = () => {
    const nextDefaults = getDefaultDateFilters();
    setQueryInput("");
    setDateFromInput(nextDefaults.dateFrom);
    setDateToInput(nextDefaults.dateTo);
    setFilters({
      q: "",
      dateFrom: nextDefaults.dateFrom,
      dateTo: nextDefaults.dateTo,
    });
  };

  const subtitle =
    filters.q || filters.dateFrom || filters.dateTo
      ? t("portalInvoices.summary.matching_invoices", { count: totalCount })
      : t("portalInvoices.summary.recent_invoices", { count: totalCount });

  return (
    <>
      <div className="grid min-w-0 gap-5">
        <section className="min-w-0 rounded-[28px] border border-[#dbe7ec] bg-[#fbfdfe] p-5 shadow-[0_18px_36px_rgba(39,89,104,0.08)]">
          <p className="portal-eyebrow">{t("portalShell.modules.invoices")}</p>
          <h2 className="text-3xl font-semibold text-slate-800">
            {t("portalInvoices.title")}
          </h2>

          <form
            className="mt-5 grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_minmax(0,1fr)_auto_auto]"
            onSubmit={handleSearchSubmit}
          >
            <SearchField label={t("portalCommon.actions.search")}>
              <input
                type="search"
                value={queryInput}
                onChange={(event) => setQueryInput(event.target.value)}
                placeholder={t("portalInvoices.placeholders.search")}
                className="min-h-[52px] rounded-[18px] border border-[#d8e6eb] bg-white px-4 py-3 text-sm text-slate-700 shadow-[0_12px_24px_rgba(39,89,104,0.07)] outline-none transition focus:border-[#2f788a] focus:ring-4 focus:ring-[#2f788a]/10"
              />
            </SearchField>

            <SearchField label={t("portalCommon.fields.from_date")}>
              <input
                type="date"
                dir="ltr"
                value={dateFromInput}
                onChange={(event) => setDateFromInput(event.target.value)}
                className="min-h-[52px] rounded-[18px] border border-[#d8e6eb] bg-white px-4 py-3 text-sm text-slate-700 shadow-[0_12px_24px_rgba(39,89,104,0.07)] outline-none transition focus:border-[#2f788a] focus:ring-4 focus:ring-[#2f788a]/10"
              />
            </SearchField>

            <SearchField label={t("portalCommon.fields.to_date")}>
              <input
                type="date"
                dir="ltr"
                value={dateToInput}
                onChange={(event) => setDateToInput(event.target.value)}
                className="min-h-[52px] rounded-[18px] border border-[#d8e6eb] bg-white px-4 py-3 text-sm text-slate-700 shadow-[0_12px_24px_rgba(39,89,104,0.07)] outline-none transition focus:border-[#2f788a] focus:ring-4 focus:ring-[#2f788a]/10"
              />
            </SearchField>

            <button
              type="submit"
              className="inline-flex min-h-[52px] items-center justify-center rounded-[18px] bg-[#2f788a] px-5 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(47,120,138,0.24)] transition hover:-translate-y-[1px]"
            >
              {t("portalCommon.actions.search")}
            </button>

            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex min-h-[52px] items-center justify-center rounded-[18px] border border-[#d9e8ec] bg-white px-5 text-sm font-semibold text-slate-600 transition hover:-translate-y-[1px]"
            >
              {t("portalCommon.actions.reset")}
            </button>
          </form>
        </section>

        <section className="min-w-0 rounded-[28px] border border-[#dbe7ec] bg-white shadow-[0_18px_36px_rgba(39,89,104,0.08)]">
          <div className="flex flex-col gap-2 border-b border-[#e4edf1] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[#2f788a]">
                {t("portalInvoices.list_label")}
              </p>
              <h3 className="mt-1 text-lg font-semibold text-slate-800">{subtitle}</h3>
            </div>
          </div>

          <div className="p-4">
            {loading ? (
              <EmptyState message={t("portalCommon.states.loading")} />
            ) : error ? (
              <div className="rounded-[24px] border border-[#f1d4d4] bg-[#fff7f7] px-5 py-5 text-sm text-[#8e3d3d]">
                {error}
              </div>
            ) : rows.length === 0 ? (
              <EmptyState message={t("portalInvoices.empty")} />
            ) : (
              <>
                <div className="grid gap-3 lg:hidden">
                  {rows.map((invoice) => (
                    <article
                      key={invoice.invoice_number}
                      className="rounded-[24px] border border-[#dbe7ec] bg-[#fbfdfe] p-4 shadow-[0_12px_24px_rgba(39,89,104,0.06)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#2f788a]">
                            {t("portalCommon.table.invoice")}
                          </p>
                          <h4 className="mt-2 text-lg font-semibold text-slate-800">
                            #{invoice.invoice_number}
                          </h4>
                          <p className="mt-1 truncate text-sm text-slate-500">
                            {invoice.client || t("portalCommon.empty.walk_in_client")}
                          </p>
                        </div>
                        <div className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-[0_8px_20px_rgba(39,89,104,0.08)]">
                          {money(invoice.total, invoice.currency)}
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-[18px] border border-[#e2ecef] bg-white px-4 py-3">
                          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                            {t("portalCommon.fields.date")}
                          </p>
                          <p className="mt-2 text-sm font-semibold text-slate-800">
                            {formatDateTime(invoice.date_time, locale)}
                          </p>
                        </div>
                        <div className="rounded-[18px] border border-[#e2ecef] bg-white px-4 py-3">
                          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                            {t("portalInvoices.issued_by")}
                          </p>
                          <p className="mt-2 text-sm font-semibold text-slate-800">
                            {invoice.issued_by || "—"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => setSelectedInvoice(invoice.invoice_number)}
                          className="inline-flex min-h-[46px] items-center justify-center rounded-[16px] border border-[#d9e8ec] bg-white px-4 text-sm font-semibold text-[#2f788a] transition hover:-translate-y-[1px]"
                        >
                          {t("portalCommon.actions.view")}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="hidden min-w-0 overflow-x-auto lg:block">
                  <table className="w-full min-w-[980px] text-sm">
                    <thead className="bg-[#f6fafc] text-slate-500">
                      <tr>
                        <th className="px-4 py-3 text-start">
                          {t("DashOverview.table_invoice")}
                        </th>
                        <th className="px-4 py-3 text-start">
                          {t("DashOverview.table_client")}
                        </th>
                        <th className="px-4 py-3 text-start">{t("portalCommon.fields.date")}</th>
                        <th className="px-4 py-3 text-start">{t("portalInvoices.issued_by")}</th>
                        <th className="px-4 py-3 text-end">
                          {t("DashOverview.table_total")}
                        </th>
                        <th className="px-4 py-3 text-end">
                          {t("DashOverview.table_actions")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((invoice, index) => (
                        <tr
                          key={invoice.invoice_number}
                          className={index % 2 === 0 ? "bg-white" : "bg-[#fbfdfe]"}
                        >
                          <td className="px-4 py-4 font-semibold text-slate-800">
                            #{invoice.invoice_number}
                          </td>
                          <td className="px-4 py-4 text-slate-600">
                            {invoice.client || t("portalCommon.empty.walk_in_client")}
                          </td>
                          <td className="px-4 py-4 text-slate-600">
                            {formatDateTime(invoice.date_time, locale)}
                          </td>
                          <td className="px-4 py-4 text-slate-600">
                            {invoice.issued_by || "—"}
                          </td>
                          <td className="px-4 py-4 text-end font-semibold text-slate-800">
                            {money(invoice.total, invoice.currency)}
                          </td>
                          <td className="px-4 py-4 text-end">
                            <button
                              type="button"
                              onClick={() => setSelectedInvoice(invoice.invoice_number)}
                              className="inline-flex min-h-[40px] items-center justify-center rounded-[14px] border border-[#d9e8ec] bg-white px-4 text-sm font-semibold text-[#2f788a] transition hover:-translate-y-[1px]"
                            >
                              {t("portalCommon.actions.view")}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {hasMore ? (
                  <div className="mt-4 flex justify-center">
                    <button
                      type="button"
                      disabled={loadingMore}
                      onClick={() =>
                        loadInvoices({
                          nextOffset: offset + rows.length,
                          append: true,
                          nextFilters: filters,
                        })
                      }
                      className="inline-flex min-h-[48px] items-center justify-center rounded-[16px] border border-[#d9e8ec] bg-white px-5 text-sm font-semibold text-slate-700 transition hover:-translate-y-[1px] disabled:cursor-wait disabled:opacity-70"
                    >
                      {loadingMore
                        ? t("portalCommon.states.loading")
                        : t("portalCommon.actions.load_more")}
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </section>
      </div>

      <InvoiceDetailModal
        open={Boolean(selectedInvoice)}
        invoiceNumber={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
      />
    </>
  );
}
