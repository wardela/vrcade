import { useEffect, useState, useRef } from "react";
import api from "../../utils/axiosInstance";
import EditClientModal from "./editclientmodal";
import { useReactToPrint } from "@/utils/useAppReactToPrint";
import PrintableInvoice from "../invoices/PrintableInvoice";
import { useTranslation } from "react-i18next";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";
import InvoiceViewPopup from "./InvoiceViewPopup";
import { CHART_SERIES, useChartTheme } from "../../theme/chartTheme";

export default function ProfileMainTab({ client, canEditClient }) {
  const [clientData, setClientData] = useState(null);
  const [loading, setLoading] = useState(true);
const [showEdit, setShowEdit] = useState(false);
const [viewInvoiceNo, setViewInvoiceNo] = useState(null);

const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
const [monthlyTotals, setMonthlyTotals] = useState([]);
const [loadingMonthly, setLoadingMonthly] = useState(false);
const [invoiceToPrint, setInvoiceToPrint] = useState(null);
const {t} = useTranslation();
const chartTheme = useChartTheme();
    const [company, setCompany] = useState(null);
    
    useEffect(() => {
      api.get(`/api/invoices/company`).then(res => {
        setCompany(res.data);
      });
    }, []);
useEffect(() => {
  if (!client?.id) return;

  const fetchMonthlyTotals = async () => {
    try {
      setLoadingMonthly(true);
      const res = await api.get(
        `/api/invoices/stats/client/${client.id}/monthly?year=${selectedYear}`
      );

      setMonthlyTotals(
        res.data.map((row) => ({
          month: row.month,            // "Jan"
          total: Number(row.total)     // numeric
        }))
      );
    } catch (err) {
      console.error("Error fetching monthly totals:", err);
      setMonthlyTotals([]);
    } finally {
      setLoadingMonthly(false);
    }
  };

  fetchMonthlyTotals();
}, [client?.id, selectedYear]);

const yearTotal = monthlyTotals.reduce((sum, m) => sum + (Number(m.total) || 0), 0);

const [monthlySalesCount, setMonthlySalesCount] = useState([]);
const [loadingSalesCount, setLoadingSalesCount] = useState(false);

useEffect(() => {
  if (!client?.id) return;

  const fetchMonthlySalesCount = async () => {
    try {
      setLoadingSalesCount(true);
      const res = await api.get(
        `/api/invoices/stats/client/${client.id}/monthly-count?year=${selectedYear}`
      );

      setMonthlySalesCount(
        res.data.map((row) => ({
          month: row.month,
          count: Number(row.count)
        }))
      );
    } catch (err) {
      console.error("Error fetching sales count:", err);
      setMonthlySalesCount([]);
    } finally {
      setLoadingSalesCount(false);
    }
  };

  fetchMonthlySalesCount();
}, [client?.id, selectedYear]);

const [lastInvoices, setLastInvoices] = useState([]);
const [loadingLastInvoices, setLoadingLastInvoices] = useState(false);

useEffect(() => {
  if (!client?.id) return;

  const fetchLastInvoices = async () => {
    try {
      setLoadingLastInvoices(true);
      const res = await api.get(
        `/api/invoices/stats/client/${client.id}/last-invoices`
      );
      setLastInvoices(res.data);
    } catch (err) {
      console.error("Error fetching last invoices:", err);
      setLastInvoices([]);
    } finally {
      setLoadingLastInvoices(false);
    }
  };

  fetchLastInvoices();
}, [client?.id]);

function formatDateDMY(dateString) {
  if (!dateString) return "—";

  const date = new Date(dateString);

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

  useEffect(() => {
    if (!client?.id) return;

    const fetchClient = async () => {
      try {
        const res = await api.get(
          `/api/invoices/clients/${client.id}`
        );
        setClientData(res.data);
      } catch (err) {
        console.error("Failed to load client", err);
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [client?.id]);

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

const printInvoice = async (invoiceNumber) => {
  const res = await api.get(
    `/api/invoices/full/${invoiceNumber}`
  );

  const data = res.data;

const computed = data.lines.reduce(
  (acc, l) => {
    const priceIncl = Number(l.item_price);
    const qty = Number(l.qty);
    const taxRate = Number(l.tax) / 100;
    const discountFactor = 1 - Number(l.discount_percentage || 0);

    // price without tax
    const priceExcl = priceIncl / (1 + taxRate);

    // totals
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

  // SAME as invoices.jsx
  setTimeout(handlePrint, 100);
};


  if (loading) {
    return <div className="p-6">{t("ProfileMainTab.states.loading_client")}</div>;
  }

  if (!clientData) {
    return <div className="p-6">{t("ProfileMainTab.states.client_not_found")}</div>;
  }



  return (
    <div className="flex w-full h-full gap-4 overflow-hidden">


      {/* LEFT SIDE (PERSONAL INFO) */}
      <div className="flex flex-col w-1/3 rounded-xl border bg-white overflow-hidden">

        {/* TOP BAR */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
          <div>
            <div className="text-lg font-semibold">{clientData.name}</div>
            <div className="text-sm text-gray-500">
              {clientData.phone || t("ProfileMainTab.placeholders.no_phone")}
            </div>
          </div>

          {canEditClient && (
          <button
            className="px-3 py-1 text-sm rounded-lg border hover:bg-gray-100 bg-white"
            onClick={() => setShowEdit(true)}
          >
            {t("ProfileMainTab.actions.edit")}
          </button>
          )}
        </div>

        {/* INFO SECTION */}
<div className="flex flex-col gap-5 p-4 text-sm">

  {/* Contact & Personal */}
  <Section title={t("ProfileMainTab.sections.personal_info")}>
    <div className="grid grid-cols-2 gap-4">
      <InfoRow label={t("ProfileMainTab.fields.email")} value={clientData.email} />
      <InfoRow label={t("ProfileMainTab.fields.location")} value={clientData.location} />
      <InfoRow
        label={t("ProfileMainTab.fields.dob")}
        value={formatDateDMY(clientData.dob)}
      />
    </div>
  </Section>

  {/* Identification */}
  <Section title="Identification">
    <div className="grid grid-cols-2 gap-4">
      <InfoRow
        label={t("ProfileMainTab.fields.detail_type")}
        value={clientData.detail_type}
        highlight
      />
      <InfoRow
        label={t("ProfileMainTab.fields.detail_value")}
        value={clientData.detail_value}
        highlight
      />
    </div>
  </Section>

  {/* Notes */}
  <Section title={t("ProfileMainTab.sections.notes")}>
    <div className="text-sm text-gray-700 bg-gray-50 border rounded-lg p-3 min-h-[60px]">
      {clientData.notes || t("ProfileMainTab.placeholders.no_notes")}
    </div>
  </Section>

  {/* Meta */}
  <div className="pt-3 border-t text-xs text-gray-400">
    {t("ProfileMainTab.meta.created_on")}{" "}
    {new Date(clientData.created_at).toLocaleDateString()}
  </div>

</div>

      </div>

      {/* RIGHT SIDE (EMPTY FOR NOW) */}
      <div className="flex flex-col w-2/3 rounded-xl border bg-white overflow-hidden">
      <div className="flex w-full flex-1 p-2 gap-2">
      {/* totals per month line chart */}
      <div className="flex flex-col w-1/2 h-full rounded-xl border bg-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
          <div>
            <div className="text-sm font-semibold text-gray-700">
              {t("ProfileMainTab.charts.spending_title")}
            </div>
            <div className="text-xs text-gray-500">
              Total {selectedYear}: {yearTotal.toFixed(3)} JD
            </div>
          </div>

          <div className="flex items-center gap-2" dir="ltr">
            <button
              className="px-3 py-1 text-sm rounded-lg border bg-white hover:bg-gray-100"
              onClick={() => setSelectedYear((y) => y - 1)}
            >
              ◀
            </button>

            <div className="text-sm font-semibold text-gray-700 w-[64px] text-center">
              {selectedYear}
            </div>

            <button
              className="px-3 py-1 text-sm rounded-lg border bg-white hover:bg-gray-100"
              onClick={() => setSelectedYear((y) => y + 1)}
            >
              ▶
            </button>
          </div>
        </div>

  {/* Chart */}
  <div className="flex-1 p-3" dir="ltr">
    {loadingMonthly ? (
      <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">
        Loading chart...
      </div>
    ) : (
      <div className="w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={monthlyTotals}>
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
              contentStyle={chartTheme.tooltipStyle}
              labelStyle={chartTheme.tooltipLabelStyle}
              itemStyle={chartTheme.tooltipItemStyle}
              cursor={chartTheme.tooltipCursor}
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke={CHART_SERIES.primary}
              strokeWidth={3}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    )}
  </div>
</div>


{/* sales count per month bar chart */}
<div className="flex flex-col w-1/2 h-full rounded-xl border bg-white overflow-hidden ml-2">

  {/* Header */}
  <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
    <div>
      <div className="text-sm font-semibold text-gray-700">
        {t("ProfileMainTab.charts.sales_count_title")}
      </div>
      <div className="text-xs text-gray-500">
        {t("ProfileMainTab.charts.sales_count_subtitle")}
      </div>
    </div>

<div className="flex items-center gap-2" dir="ltr">
  <button
    className="px-3 py-1 text-sm rounded-lg border bg-white hover:bg-gray-100"
    onClick={() => setSelectedYear((y) => y - 1)}
  >
    ◀
  </button>

  <div className="text-sm font-semibold text-gray-700 w-[64px] text-center">
    {selectedYear}
  </div>

  <button
    className="px-3 py-1 text-sm rounded-lg border bg-white hover:bg-gray-100"
    onClick={() => setSelectedYear((y) => y + 1)}
  >
    ▶
  </button>
</div>

  </div>

  {/* Chart */}
  <div className="flex-1 p-3 flex items-center justify-center ml-[-35px]" dir="ltr">
    {loadingSalesCount ? (
      <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">
        {t("ProfileMainTab.states.loading_chart")}
      </div>
    ) : (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={monthlySalesCount}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
          <XAxis
            dataKey="month"
            tick={{ fill: chartTheme.axis, fontSize: 12 }}
            axisLine={{ stroke: chartTheme.axisLine }}
            tickLine={{ stroke: chartTheme.axisLine }}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: chartTheme.axis, fontSize: 12 }}
            axisLine={{ stroke: chartTheme.axisLine }}
            tickLine={{ stroke: chartTheme.axisLine }}
          />
          <Tooltip
            contentStyle={chartTheme.tooltipStyle}
            labelStyle={chartTheme.tooltipLabelStyle}
            itemStyle={chartTheme.tooltipItemStyle}
            cursor={chartTheme.tooltipCursor}
          />
          <Bar
            dataKey="count"
            fill={CHART_SERIES.deep}
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    )}
  </div>
</div>

      </div>

     <div className="flex w-full flex-1 flex-col overflow-hidden   border">

  {/* Header */}
  <div className="px-4 py-3 border-b bg-gray-50">
    <div className="text-sm font-semibold text-gray-700">
      {t("ProfileMainTab.recent_sales.title")}
    </div>
    <div className="text-xs text-gray-500">
      {t("ProfileMainTab.recent_sales.subtitle")}
    </div>
  </div>

  {/* Table */}
  <div className="flex-1 overflow-auto">
    {loadingLastInvoices ? (
      <div className="h-full flex items-center justify-center text-sm text-gray-500">
        {t("ProfileMainTab.states.loading_invoices")}
      </div>
    ) : lastInvoices.length === 0 ? (
      <div className="h-full flex items-center justify-center text-sm text-gray-400">
       {t("ProfileMainTab.states.no_invoices")}
      </div>
    ) : (
      <table className="w-full text-sm">
<thead className="bg-gray-100 text-gray-600 sticky top-0 z-10">
          <tr>
            <th className="text-start px-4 py-2">{t("ProfileMainTab.table.invoice")}</th>
            <th className="text-start px-4 py-2">{t("ProfileMainTab.table.date")}</th>
            <th className="text-start px-4 py-2">{t("ProfileMainTab.table.total")}</th>
            <th className="text-center px-4 py-2">{t("ProfileMainTab.table.actions")}</th>
          </tr>
        </thead>
        <tbody>
  {lastInvoices.map((inv, index) => (
    <tr
      key={inv.invoice_number}
      className={`
        border-t
        ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}
        hover:bg-gray-100
      `}
    >
      <td className="px-4 py-2 font-medium">
        {inv.invoice_number}
      </td>

      <td className="px-4 py-2 text-gray-600">
        {inv.date}
      </td>

      <td className="px-4 py-2 text-right font-semibold">
        {Number(inv.total).toFixed(3)}
      </td>

      <td className="px-4 py-2 text-center">
        <div className="flex items-center justify-center gap-2">
          <button
            className="px-3 py-1 text-xs rounded-lg border bg-white hover:bg-gray-100"
            onClick={() => setViewInvoiceNo(inv.invoice_number)}
          >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-5">
            <path fill-rule="evenodd" d="M14.78 14.78a.75.75 0 0 1-1.06 0L6.5 7.56v5.69a.75.75 0 0 1-1.5 0v-7.5A.75.75 0 0 1 5.75 5h7.5a.75.75 0 0 1 0 1.5H7.56l7.22 7.22a.75.75 0 0 1 0 1.06Z" clip-rule="evenodd" />
          </svg>
          </button>
          <button
            className="px-3 py-1 text-xs rounded-lg border bg-white hover:bg-gray-100"
               onClick={() => printInvoice(inv.invoice_number)}
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
    )}
  </div>
      </div>
      </div>


      {showEdit && (
  <EditClientModal
    client={clientData}
    onClose={() => setShowEdit(false)}
    onUpdated={(updatedClient) => {
      setClientData(updatedClient);
    }}
  />
)}
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

function InfoRow({ label, value, highlight = false }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs uppercase tracking-wide text-gray-400">
        {label}
      </span>
      <span
        className={`font-medium ${
          highlight ? "text-gray-900" : "text-gray-700"
        }`}
      >
        {value || "—"}
      </span>
    </div>
  );
}
function Section({ title, children }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
        {title}
      </h3>
      {children}
    </div>
  );
}
