import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { fetchPortalInvoiceDetail } from "../../api/portalApi";
import { prepareCompanyWithLogo } from "../../utils/companyLogo";
import { useReactToPrint } from "../reports/usePortalReactToPrint";
import PrintableInvoice from "./PrintableInvoice";

const formatCurrency = (value, currency = "JOD") =>
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

const calculateInvoiceTotals = (lines) =>
  lines.reduce(
    (acc, line) => {
      const priceIncl = Number(line.item_price || 0);
      const qty = Number(line.qty || 0);
      const taxRate = Number(line.tax || 0) / 100;
      const discountFactor = 1 - Number(line.discount_percentage || 0);
      const priceExcl = taxRate >= 0 ? priceIncl / (1 + taxRate) : priceIncl;

      acc.subtotal += priceExcl * qty * discountFactor;
      acc.tax += (priceIncl - priceExcl) * qty * discountFactor;
      acc.total += priceIncl * qty * discountFactor;
      return acc;
    },
    { subtotal: 0, tax: 0, total: 0 }
  );

function ModalShell({ children, onClose, wide = false }) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-[120] grid place-items-end bg-[rgba(24,48,58,0.42)] p-0 md:place-items-center md:p-5"
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className={`flex w-full max-h-[92dvh] flex-col overflow-hidden rounded-t-[28px] bg-white shadow-[0_-10px_40px_rgba(24,48,58,0.18)] md:rounded-[28px] ${
          wide ? "md:max-w-5xl" : "md:max-w-xl"
        }`}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

function MetaBlock({ label, value, accent = false }) {
  return (
    <article
      className={`rounded-[20px] border px-4 py-4 shadow-[0_14px_30px_rgba(39,89,104,0.08)] ${
        accent
          ? "border-[#d7ebe9] bg-gradient-to-br from-[#f2fbf7] to-white"
          : "border-[#dbe7ec] bg-gradient-to-br from-slate-50 to-white"
      }`}
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <div className="mt-3 text-base font-semibold text-slate-800">{value || "—"}</div>
    </article>
  );
}

function MoneyRow({ label, value, strong = false }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[16px] border border-[#e3edf1] bg-white px-4 py-3">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={`text-sm text-slate-800 ${strong ? "font-bold" : "font-semibold"}`}>
        {value}
      </span>
    </div>
  );
}

export default function InvoiceDetailModal({ invoiceNumber, open, onClose }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage === "ar" ? "ar-JO" : undefined;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [invoice, setInvoice] = useState(null);
  const [printing, setPrinting] = useState(false);
  const printRef = useRef(null);

  const printableData = useMemo(() => {
    if (!invoice?.header || !invoice?.lines) {
      return null;
    }

    const totals = calculateInvoiceTotals(invoice.lines);

    return {
      company: invoice.company,
      invoiceNumber: invoice.header.invoice_number,
      clientName: invoice.header.client,
      invoiceDate: invoice.header.date,
      paymentType: invoice.header.type,
      notes: invoice.header.notes,
      reference: invoice.header.reference,
      invoiceItems: invoice.lines.map((line) => ({
        desc: line.description,
        qty: Number(line.qty || 0),
        price: Number(line.item_price || 0),
        tax: Number(line.tax || 0),
        discount: Number(line.discount_percentage || 0) * 100,
        notes: line.notes || "",
        unit_name: line.unit_name || "",
      })),
      totalBeforeTax: totals.subtotal,
      totalTax: totals.tax,
      grandTotal: totals.total,
      qr: invoice.header.qr,
    };
  }, [invoice]);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: invoice?.header?.invoice_number
      ? `invoice-${invoice.header.invoice_number}`
      : "invoice",
    onBeforePrint: () => setPrinting(true),
    onAfterPrint: () => setPrinting(false),
  });

  useEffect(() => {
    if (!open || !invoiceNumber) return;

    let disposed = false;

    const loadInvoice = async () => {
      try {
        setLoading(true);
        setError("");
        const payload = await fetchPortalInvoiceDetail(invoiceNumber);
        const preparedCompany = await prepareCompanyWithLogo(payload.company || null);

        if (!disposed) {
          setInvoice({
            header: payload.header,
            lines: payload.lines || [],
            company: preparedCompany,
          });
        }
      } catch (requestError) {
        if (!disposed) {
          setInvoice(null);
          setError(requestError.message || t("portalInvoices.errors.detail_load_failed"));
        }
      } finally {
        if (!disposed) {
          setLoading(false);
        }
      }
    };

    loadInvoice();
    return () => {
      disposed = true;
    };
  }, [invoiceNumber, open, t]);

  if (!open) return null;

  const header = invoice?.header || null;
  const lines = invoice?.lines || [];
  const totals = calculateInvoiceTotals(lines);

  return (
    <ModalShell onClose={onClose} wide>
      <div className="border-b border-[#e2ecef] px-5 py-5 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="portal-eyebrow">{t("portalShell.modules.invoices")}</p>
            <h3 className="text-xl font-semibold text-slate-800">
              {header?.invoice_number || invoiceNumber}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {t("InvoiceViewPopup.header.preview")}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[46px] items-center justify-center rounded-[16px] border border-[#d9e8ec] bg-white px-4 text-sm font-semibold text-slate-600 transition hover:-translate-y-[1px]"
          >
            {t("InvoiceViewPopup.actions.close")}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
        {loading ? (
          <div className="rounded-[24px] border border-[#dbe7ec] bg-[#fbfdfe] px-5 py-10 text-center text-sm text-slate-500">
            {t("InvoiceViewPopup.states.loading")}
          </div>
        ) : error ? (
          <div className="rounded-[24px] border border-[#f1d4d4] bg-[#fff7f7] px-5 py-5 text-sm text-[#8e3d3d]">
            {error}
          </div>
        ) : header ? (
          <div className="grid gap-5">
            <section className="rounded-[28px] border border-[#dbe7ec] bg-[#fbfdfe] p-5 shadow-[0_18px_36px_rgba(39,89,104,0.08)]">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[#2f788a]">
                    {t("portalInvoices.summary_card_label")}
                  </p>
                  <h4 className="mt-2 text-2xl font-semibold text-slate-800">
                    {header.client || t("portalCommon.empty.walk_in_client")}
                  </h4>
                  {header.client_detail ? (
                    <p className="mt-2 text-sm text-slate-500">{header.client_detail}</p>
                  ) : null}
                  {header.client_contact ? (
                    <p className="mt-1 text-sm text-slate-500">{header.client_contact}</p>
                  ) : null}
                </div>

                <div className="inline-flex w-fit items-center rounded-full bg-[#edf7fb] px-4 py-2 text-sm font-semibold text-[#2f788a]">
                  {formatCurrency(header.total, header.currency)}
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MetaBlock
                  label={t("InvoiceViewPopup.info.date")}
                  value={formatDateTime(header.date_time || header.date, locale)}
                />
                <MetaBlock
                  label={t("InvoiceViewPopup.info.payment")}
                  value={header.type || t("InvoiceViewPopup.info.empty")}
                />
                <MetaBlock
                  label={t("InvoiceViewPopup.info.type")}
                  value={header.type2 || t("InvoiceViewPopup.info.empty")}
                />
                <MetaBlock
                  label={t("InvoiceViewPopup.info.currency")}
                  value={header.currency || "JOD"}
                  accent
                />
              </div>

              {(header.reference || header.notes || header.pos_point_name || header.employee_full_name) ? (
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {header.reference ? (
                    <MetaBlock label={t("portalCommon.fields.reference")} value={header.reference} />
                  ) : null}
                  {header.pos_point_name ? (
                    <MetaBlock label={t("POSMonitor.labels.pos_station")} value={header.pos_point_name} />
                  ) : null}
                  {header.employee_full_name ? (
                    <MetaBlock label={t("portalInvoices.issued_by")} value={header.employee_full_name} />
                  ) : null}
                  {header.notes ? <MetaBlock label={t("portalCommon.fields.notes")} value={header.notes} /> : null}
                </div>
              ) : null}
            </section>

            <section className="rounded-[28px] border border-[#dbe7ec] bg-white shadow-[0_18px_36px_rgba(39,89,104,0.08)]">
              <div className="border-b border-[#e4edf1] px-5 py-4">
                <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[#2f788a]">
                  {t("portalCreateInvoice.items.title")}
                </p>
              </div>

              <div className="grid gap-3 p-4 md:hidden">
                {lines.map((line, index) => (
                  <article
                    key={`${line.id || line.item_number}-${index}`}
                    className="rounded-[22px] border border-[#e2ecef] bg-[#fbfdfe] p-4 shadow-[0_12px_24px_rgba(39,89,104,0.06)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                          {t("InvoiceViewPopup.table.index")} {line.item_number || index + 1}
                        </p>
                        <h5 className="mt-2 text-base font-semibold text-slate-800">
                          {line.description}
                        </h5>
                      </div>
                      <div className="text-end text-sm font-semibold text-slate-800">
                        {formatCurrency(line.total, header.currency)}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <MetaBlock label={t("InvoiceViewPopup.table.qty")} value={line.qty} />
                      <MetaBlock
                        label={t("InvoiceViewPopup.table.unit")}
                        value={formatCurrency(line.item_price, header.currency)}
                      />
                      <MetaBlock label={t("InvoiceViewPopup.table.tax")} value={`${Number(line.tax || 0)}%`} />
                      <MetaBlock
                        label={t("InvoiceViewPopup.table.discount")}
                        value={
                          line.discount_percentage
                            ? `${Number(line.discount_percentage) * 100}%`
                            : "—"
                        }
                      />
                    </div>

                    {line.notes ? (
                      <div className="mt-4 rounded-[16px] border border-[#e2ecef] bg-white px-4 py-3 text-sm text-slate-500">
                        {line.notes}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[860px] text-sm">
                  <thead className="bg-[#f6fafc] text-slate-500">
                    <tr>
                      <th className="px-4 py-3 text-start">
                        {t("InvoiceViewPopup.table.index")}
                      </th>
                      <th className="px-4 py-3 text-start">
                        {t("InvoiceViewPopup.table.item")}
                      </th>
                      <th className="px-4 py-3 text-start">
                        {t("InvoiceViewPopup.table.qty")}
                      </th>
                      <th className="px-4 py-3 text-start">
                        {t("InvoiceViewPopup.table.unit")}
                      </th>
                      <th className="px-4 py-3 text-start">
                        {t("InvoiceViewPopup.table.tax")}
                      </th>
                      <th className="px-4 py-3 text-start">
                        {t("InvoiceViewPopup.table.discount")}
                      </th>
                      <th className="px-4 py-3 text-start">
                        {t("portalInvoices.line_total")}
                      </th>
                      <th className="px-4 py-3 text-start">
                        {t("InvoiceViewPopup.table.total")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line, index) => (
                      <tr
                        key={`${line.id || line.item_number}-${index}`}
                        className={index % 2 === 0 ? "bg-white" : "bg-[#fbfdfe]"}
                      >
                        <td className="px-4 py-3 font-medium text-slate-700">
                          {line.item_number || index + 1}
                        </td>
                        <td className="px-4 py-3 text-slate-700">{line.description}</td>
                        <td className="px-4 py-3 text-slate-600">{line.qty}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {formatCurrency(line.item_price, header.currency)}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{Number(line.tax || 0)}%</td>
                        <td className="px-4 py-3 text-slate-600">
                          {line.discount_percentage
                            ? `${Number(line.discount_percentage) * 100}%`
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {formatCurrency(
                            Number(line.item_price || 0) * Number(line.qty || 0),
                            header.currency
                          )}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800">
                          {formatCurrency(line.total, header.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-[28px] border border-[#dbe7ec] bg-[#fbfdfe] p-5 shadow-[0_18px_36px_rgba(39,89,104,0.08)]">
              <div className="grid gap-3 sm:max-w-[420px] sm:[margin-inline-start:auto]">
                <MoneyRow
                  label={t("InvoiceViewPopup.totals.grand_excl")}
                  value={formatCurrency(totals.subtotal, header.currency)}
                />
                <MoneyRow
                  label={t("InvoiceViewPopup.totals.tax_total")}
                  value={formatCurrency(totals.tax, header.currency)}
                />
                <MoneyRow
                  label={t("InvoiceViewPopup.totals.grand")}
                  value={formatCurrency(totals.total || header.total, header.currency)}
                  strong
                />
              </div>
            </section>
          </div>
        ) : (
          <div className="rounded-[24px] border border-[#dbe7ec] bg-[#fbfdfe] px-5 py-10 text-center text-sm text-slate-500">
            {t("portalInvoices.not_found")}
          </div>
        )}
      </div>

      <div className="border-t border-[#e2ecef] bg-white px-5 py-4 sm:px-6">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[48px] items-center justify-center rounded-[16px] border border-[#d9e8ec] bg-white px-4 text-sm font-semibold text-slate-600 transition hover:-translate-y-[1px]"
          >
            {t("InvoiceViewPopup.actions.close")}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            disabled={!printableData || printing}
            className="inline-flex min-h-[48px] items-center justify-center rounded-[16px] bg-[#2f788a] px-5 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(47,120,138,0.24)] transition hover:-translate-y-[1px] disabled:cursor-wait disabled:opacity-70"
          >
            {printing ? t("portalCommon.states.preparing_print") : t("portalCommon.actions.print")}
          </button>
        </div>
      </div>

      <div className="hidden">
        {printableData ? (
          <PrintableInvoice
            ref={printRef}
            company={printableData.company}
            invoiceNumber={printableData.invoiceNumber}
            clientName={printableData.clientName}
            invoiceDate={printableData.invoiceDate}
            paymentType={printableData.paymentType}
            notes={printableData.notes}
            reference={printableData.reference}
            invoiceItems={printableData.invoiceItems}
            totalBeforeTax={printableData.totalBeforeTax}
            totalTax={printableData.totalTax}
            grandTotal={printableData.grandTotal}
            qr={printableData.qr}
          />
        ) : null}
      </div>
    </ModalShell>
  );
}
