import { useEffect, useMemo, useState, useRef } from "react";
import api from "../../utils/axiosInstance";
import { useReactToPrint } from "@/utils/useAppReactToPrint";
import InvoiceViewPopup from "../clients/InvoiceViewPopup";
import PrintableInvoice from "../invoices/PrintableInvoice";
import { useTranslation } from "react-i18next";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { CHART_SERIES, useChartTheme } from "../../theme/chartTheme";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function Spinner() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-6 h-6 border-2 border-gray-300 border-t-[#2f788a] rounded-full animate-spin" />
    </div>
  );
}

function money(n) {
  const x = Number(n || 0);
  return `${x.toFixed(3)} JD`;
}

export default function DashboardOverviewBlock({
  title = "Overview",
  onOpenInvoice, // optional callback(invoice_number)
}) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const { t } = useTranslation();
  const chartTheme = useChartTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);      // initial load
  const [yearLoading, setYearLoading] = useState(false); // only when year changes

  const [viewInvoiceNo, setViewInvoiceNo] = useState(null);

    const printRef = useRef();
    const handlePrint = useReactToPrint({
    content: () => printRef.current,
    });

    const [printInvoiceData, setPrintInvoiceData] = useState({
    invoiceNumber: "",
    clientName: "",
    invoiceDate: "",
    paymentType: "",
    notes: "",
    invoiceItems: [],
    totalBeforeTax: 0,
    totalTax: 0,
    grandTotal: 0,
    qr: ""
    });

    const [company, setCompany] = useState(null);
    
    useEffect(() => {
      api.get(`/api/invoices/company`).then(res => {
        setCompany(res.data);
      });
    }, []);

  const fetchOverview = async (y, { yearChange = false } = {}) => {
    try {
      if (yearChange) setYearLoading(true);
      else setLoading(true);

      const res = await api.get(`/api/invoices/stats/dashboard-overview`, {
        params: { year: y },
      });
      setData(res.data);
    } catch (err) {
      console.error("Failed to load dashboard overview", err);
    } finally {
      if (yearChange) setYearLoading(false);
      else setLoading(false);
    }
  };

  const printInvoice = async (invoiceNumber) => {
  const res = await api.get(`/api/invoices/full/${invoiceNumber}`);
  const data = res.data;

  const computed = data.lines.reduce(
    (acc, l) => {
      const priceIncl = Number(l.item_price);
      const qty = Number(l.qty);
      const taxRate = Number(l.tax) / 100;
      const discountFactor = 1 - Number(l.discount_percentage || 0);

      const priceExcl = priceIncl / (1 + taxRate);

      const lineSubtotal = priceExcl * qty * discountFactor;
      const lineTax = (priceIncl - priceExcl) * qty * discountFactor;
      const lineTotal = priceIncl * qty * discountFactor;

      acc.subtotal += lineSubtotal;
      acc.tax += lineTax;
      acc.total += lineTotal;

      return acc;
    },
    { subtotal: 0, tax: 0, total: 0 }
  );

  setPrintInvoiceData({
    invoiceNumber: data.header.invoice_number,
    clientName: data.header.client,
    invoiceDate: data.header.date,
    paymentType: data.header.type,
    notes: data.header.notes,
    invoiceItems: data.lines.map(l => ({
      desc: l.description,
      qty: Number(l.qty),
      price: Number(l.item_price),
      tax: Number(l.tax),
      discount: Number(l.discount_percentage) * 100
    })),
    totalBeforeTax: computed.subtotal,
    totalTax: computed.tax,
    grandTotal: computed.total,
    qr: data.header.qr
  });

  setTimeout(handlePrint, 100);
};

  useEffect(() => {
    fetchOverview(year, { yearChange: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // don’t re-fetch on the initial mount twice
    if (year === currentYear && data === null) return;
    fetchOverview(year, { yearChange: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  const monthlyNet = useMemo(() => {
    const rows = data?.monthly_net || [];
    // enforce 12 months in UI even if backend sends less (defensive)
    const map = new Map(rows.map(r => [Number(r.month_index), r]));
    return MONTHS.map((m, i) => {
      const r = map.get(i + 1);
      return { month: m, net: Number(r?.net || 0) };
    });
  }, [data]);

  const monthlyAvg = useMemo(() => {
    const rows = data?.monthly_avg_invoice || [];
    const map = new Map(rows.map(r => [Number(r.month_index), r]));
    return MONTHS.map((m, i) => {
      const r = map.get(i + 1);
      return { month: m, avg: Number(r?.avg || 0) };
    });
  }, [data]);

  const lowStock = data?.low_stock || [];
  const recentSales = data?.recent_sales || [];

  const openInvoice = (invoice_number) => {
    if (typeof onOpenInvoice === "function") return onOpenInvoice(invoice_number);
    // fallback: do nothing (you can wire it later)
    console.log("Open invoice:", invoice_number);
  };

  const shareInvoice = async (invoice_number) => {
    try {
      await api.post(`/api/invoices/share/${invoice_number}`);
      // you can toast here (if you have a toast system)
      fetchOverview(year, { yearChange: false }); // refresh (so “shared” indicators update if you show them)
    } catch (err) {
      console.error("Share invoice failed:", err);
    }
  };

  const HeaderBar = (
    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border rounded-t-xl shadow-sm">
      <div className="flex flex-col">
        <h2 className="text-lg font-semibold text-gray-800">{t("DashOverview.title")}</h2>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 bg-white border rounded-lg px-2 py-1">
          <button
            onClick={() => setYear((y) => y - 1)}
            className="px-2 py-1 hover:bg-gray-100 rounded"
            title="Previous year"
          >
            ‹
          </button>

          <span className="font-medium text-gray-700 w-16 text-center">
            {year}
          </span>

          <button
            onClick={() => setYear((y) => y + 1)}
            className="px-2 py-1 hover:bg-gray-100 rounded"
            title="Next year"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );

  // initial skeleton
  if (loading && !data) {
    return (
      <div className="space-y-4">
        <div className="h-16 bg-white rounded-xl border shadow-sm animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="h-80 bg-white rounded-xl border shadow-sm animate-pulse" />
          <div className="lg:col-span-2 h-80 bg-white rounded-xl border shadow-sm animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-96 bg-white rounded-xl border shadow-sm animate-pulse" />
          <div className="h-96 bg-white rounded-xl border shadow-sm animate-pulse" />
        </div>
      </div>
    );
  }

 return (
    <div className="flex flex-col h-full min-h-0">

      {/* ================= HEADER ================= */}
      {HeaderBar}

      {/* ================= CONTENT ================= */}
      <div className="flex-1 min-h-0 flex flex-col gap-4 p-3 bg-white border rounded-b-lg">

        {/* ================= TOP HALF ================= */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Net (Sales - Refunds) */}
          <div className="lg:col-span-2 bg-white rounded-xl border p-5 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">
                {t("DashOverview.net_title")}
              </h3>
              <span className="text-xs text-gray-500">{t("DashOverview.months_12")}</span>
            </div>

            <div dir="ltr" className="flex-1 min-h-0">
              {yearLoading ? (
                <Spinner />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyNet}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: chartTheme.axis, fontSize: 12 }}
                      axisLine={{ stroke: chartTheme.axisLine }}
                      tickLine={{ stroke: chartTheme.axisLine }}
                    />
                    <YAxis
                      tick={{ fill: chartTheme.axis, fontSize: 12 }}
                      axisLine={{ stroke: chartTheme.axisLine }}
                      tickLine={{ stroke: chartTheme.axisLine }}
                    />
                    <Tooltip
                      formatter={money}
                      contentStyle={chartTheme.tooltipStyle}
                      labelStyle={chartTheme.tooltipLabelStyle}
                      itemStyle={chartTheme.tooltipItemStyle}
                      cursor={chartTheme.tooltipCursor}
                    />
                    <Area
                      type="monotone"
                      dataKey="net"
                      stroke={CHART_SERIES.primary}
                      fill={CHART_SERIES.primary}
                      fillOpacity={chartTheme.areaOpacity}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-white rounded-xl border p-5 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">
                {t("DashOverview.low_stock_title")}
              </h3>
              <span className="text-xs text-gray-500">
                {lowStock.length} {t("DashOverview.low_stock_items")}
              </span>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto pr-1">
              {lowStock.length === 0 ? (
                <div className="text-sm text-gray-500 bg-gray-50 border rounded-lg p-3">
                 {t("DashOverview.months_12")}
                </div>
              ) : (
                <ul className="space-y-2">
                  {lowStock.map((it) => (
                    <li
                      key={it.id}
                      className="flex items-center justify-between bg-red-50 border border-red-100 p-2 rounded-lg"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800 truncate">
                          {it.name}
                        </p>
                        <p className="text-xs text-gray-600">
                          {t("DashOverview.low_stock_min")}: {it.minimum_qty_alert} • {t("DashOverview.low_stock_current")}: {it.stock_qty}
                        </p>
                      </div>
                      <div className="text-right pl-3">
                        <p className="text-xs text-gray-500">{t("DashOverview.low_stock_deficit")}</p>
                        <p className="font-bold text-red-600">
                          {Number(it.deficit).toFixed(3)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* ================= BOTTOM HALF ================= */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Recent Sales */}
          <div className="bg-white rounded-xl border flex flex-col min-h-0">

            <div className="flex items-center justify-between px-5 py-3 border-b bg-gray-50">
              <h3 className="font-semibold text-gray-800">{t("DashOverview.recent_sales_title")}</h3>
              <span className="text-xs text-gray-500">{t("DashOverview.recent_sales_last")}</span>
            </div>

            <div className="border-b bg-white">
              <table className="w-full text-sm">
                <thead className="text-gray-500">
                  <tr>
                    <th className="text-start py-2 px-5">{t("DashOverview.table_invoice")}</th>
                    <th className="text-start py-2 px-5">{t("DashOverview.table_client")}</th>
                    <th className="text-end py-2 px-5">{t("DashOverview.table_total")}</th>
                    <th className="text-end py-2 px-5">{t("DashOverview.table_actions")}</th>
                  </tr>
                </thead>
              </table>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto">
              <table className="w-full text-sm">
                <tbody>
                  {recentSales.map((inv) => (
                    <tr
                      key={inv.invoice_number}
                      className="border-b last:border-none"
                    >
                      <td className="py-2 px-5 font-medium">
                        {inv.invoice_number}
                      </td>
                      <td className="py-2 px-5 truncate">
                        {inv.client || "—"}
                      </td>
                      <td className="py-2 px-5 text-end">
                        {money(inv.total)}
                      </td>
                        <td className="py-2 px-5 text-end">
                        <div className="flex items-center justify-end gap-2">
                            <button
                            className="px-3 py-1 text-xs rounded-lg border bg-white hover:bg-gray-100"
                            onClick={() => setViewInvoiceNo(inv.invoice_number)}
                            title="Preview"
                            >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-5">
                            <path fill-rule="evenodd" d="M14.78 14.78a.75.75 0 0 1-1.06 0L6.5 7.56v5.69a.75.75 0 0 1-1.5 0v-7.5A.75.75 0 0 1 5.75 5h7.5a.75.75 0 0 1 0 1.5H7.56l7.22 7.22a.75.75 0 0 1 0 1.06Z" clip-rule="evenodd" />
                            </svg>
                            </button>

                            <button
                            className="px-3 py-1 text-xs rounded-lg border bg-white hover:bg-gray-100"
                            onClick={() => printInvoice(inv.invoice_number)}
                            title="Print"
                            >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-5">
                            <path fill-rule="evenodd" d="M5 2.75C5 1.784 5.784 1 6.75 1h6.5c.966 0 1.75.784 1.75 1.75v3.552c.377.046.752.097 1.126.153A2.212 2.212 0 0 1 18 8.653v4.097A2.25 2.25 0 0 1 15.75 15h-.241l.305 1.984A1.75 1.75 0 0 1 14.084 19H5.915a1.75 1.75 0 0 1-1.73-2.016L4.492 15H4.25A2.25 2.25 0 0 1 2 12.75V8.653c0-1.082.775-2.034 1.874-2.198.374-.056.75-.107 1.127-.153L5 6.25v-3.5Zm8.5 3.397a41.533 41.533 0 0 0-7 0V2.75a.25.25 0 0 1 .25-.25h6.5a.25.25 0 0 1 .25.25v3.397ZM6.608 12.5a.25.25 0 0 0-.247.212l-.693 4.5a.25.25 0 0 0 .247.288h8.17a.25.25 0 0 0 .246-.288l-.692-4.5a.25.25 0 0 0-.247-.212H6.608Z" clip-rule="evenodd" />
                            </svg>
                            </button>
                        </div>
                        </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Avg Invoice */}
          <div className="bg-white rounded-xl border p-5 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">
                {t("DashOverview.avg_invoice_title")}
              </h3>
              <span className="text-xs text-gray-500">{t("DashOverview.months_12")}</span>
            </div>

            <div dir="ltr" className="flex-1 min-h-0">
              {yearLoading ? (
                <Spinner />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyAvg}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: chartTheme.axis, fontSize: 12 }}
                      axisLine={{ stroke: chartTheme.axisLine }}
                      tickLine={{ stroke: chartTheme.axisLine }}
                    />
                    <YAxis
                      tick={{ fill: chartTheme.axis, fontSize: 12 }}
                      axisLine={{ stroke: chartTheme.axisLine }}
                      tickLine={{ stroke: chartTheme.axisLine }}
                    />
                    <Tooltip
                      formatter={money}
                      contentStyle={chartTheme.tooltipStyle}
                      labelStyle={chartTheme.tooltipLabelStyle}
                      itemStyle={chartTheme.tooltipItemStyle}
                      cursor={chartTheme.tooltipCursor}
                    />
                    <Bar dataKey="avg" fill={CHART_SERIES.primary} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <p className="text-xs text-gray-500 mt-2">
              {t("DashOverview.avg_invoice_hint")}
            </p>
          </div>

        </div>
      </div>
      {viewInvoiceNo && (
        <InvoiceViewPopup
            invoiceNumber={viewInvoiceNo}
            onClose={() => setViewInvoiceNo(null)}
        />
        )}

        <div className="hidden">
        <PrintableInvoice
            ref={printRef}
            company={company}    
            invoiceNumber={printInvoiceData.invoiceNumber}
            clientName={printInvoiceData.clientName}
            invoiceDate={printInvoiceData.invoiceDate}
            paymentType={printInvoiceData.paymentType}
            notes={printInvoiceData.notes}
            invoiceItems={printInvoiceData.invoiceItems}
            totalBeforeTax={printInvoiceData.totalBeforeTax}
            totalTax={printInvoiceData.totalTax}
            grandTotal={printInvoiceData.grandTotal}
            qr={printInvoiceData.qr}
        />
        </div>
    </div>
  );

}
