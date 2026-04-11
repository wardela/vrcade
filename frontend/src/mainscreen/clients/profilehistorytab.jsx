import { useEffect, useState, useRef } from "react";
import * as XLSX from "xlsx";
import api from "../../utils/axiosInstance";
import { useReactToPrint } from "@/utils/useAppReactToPrint";
import PrintableInvoice from "../invoices/PrintableInvoice";
import InvoiceViewPopup from "./InvoiceViewPopup";
import Popup from "../../components/Popup";
import { useTranslation } from "react-i18next";
export default function ClientProfileHistory({ client }) {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const formatDate = (d) => d.toISOString().split("T")[0];

  const [fromDate, setFromDate] = useState(formatDate(firstDayOfMonth));
  const [toDate, setToDate] = useState(formatDate(today));

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewInvoiceNo, setViewInvoiceNo] = useState(null);
  const {t} = useTranslation();
const [popupMessage, setPopupMessage] = useState(null);

const showPopup = (message) => {
  setPopupMessage(message);
};

const closePopup = () => {
  setPopupMessage(null);
};
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

  const fetchHistory = async () => {
    if (!client?.id || !fromDate || !toDate) return;

    try {
      setLoading(true);
      const res = await api.get(
        `/api/invoices/clients/${client.id}/history`,
        {
          params: {
            from: fromDate,
            to: toDate
          }
        }
      );
      setInvoices(res.data || []);
    } catch (err) {
      console.error("Error fetching history:", err);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  if (client?.id) {
    fetchHistory();
  }
}, [client?.id]);

  const clearFilters = () => {
    setFromDate("");
    setToDate("");
    setInvoices([]);
  };

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

        const priceExcl = priceIncl / (1 + taxRate);

        acc.subtotal += priceExcl * qty * discountFactor;
        acc.tax += (priceIncl - priceExcl) * qty * discountFactor;
        acc.total += priceIncl * qty * discountFactor;

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

  const handleExportExcel = () => {
  if (invoices.length === 0) {
    showPopup("No invoices to export");
    return;
  }

  const data = invoices.map((inv) => ({
    "Invoice Number": inv.invoice_number,
    "Date": inv.date,
    "Total (JD)": Number(inv.total).toFixed(3),
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  worksheet["!cols"] = [
    { wch: 18 },
    { wch: 20 },
    { wch: 14 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Client History");

  const fileName = `Client_${client.id}_Invoices_${fromDate}_to_${toDate}.xlsx`;

  XLSX.writeFile(workbook, fileName);
};

  return (
    <div className="flex flex-col w-full h-full rounded-xl border bg-white overflow-hidden">

      {/* HEADER */}
      <div className="px-4 py-3 border-b bg-gray-50">
        <div className="text-sm font-semibold text-gray-700">
          {t("ProfileHistoryTab.header.title")}
        </div>
        <div className="text-xs text-gray-500">
          {t("ProfileHistoryTab.header.subtitle")}
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex items-end gap-3 px-4 py-3 border-b bg-white justify-between">
<div className="flex items-end gap-3">
  <div className="flex flex-col">
    <label className="text-xs text-gray-500 mb-1">{t("ProfileHistoryTab.filters.from")}</label>
    <input
      type="date"
      value={fromDate}
      onChange={(e) => setFromDate(e.target.value)}
      className="h-[38px] px-3 border rounded-lg text-sm"
    />
  </div>

  <div className="flex flex-col">
    <label className="text-xs text-gray-500 mb-1">{t("ProfileHistoryTab.filters.to")}</label>
    <input
      type="date"
      value={toDate}
      onChange={(e) => setToDate(e.target.value)}
      className="h-[38px] px-3 border rounded-lg text-sm"
    />
  </div>

        <div className="h-10 w-px bg-gray-300 mx-1" />


  <button
    onClick={fetchHistory}
    className="h-[38px] px-4 text-sm rounded-lg border bg-white hover:bg-gray-100"
  >
    {t("ProfileHistoryTab.filters.apply")}
  </button>

  <button
    onClick={clearFilters}
    className="h-[38px] px-4 text-sm rounded-lg border hover:bg-gray-100"
  >
    {t("ProfileHistoryTab.filters.clear")}
  </button>
</div>


        <div className="flex items-center">
        <button
          onClick={handleExportExcel}
          className="px-4 py-2 text-sm rounded-lg
                    bg-emerald-600 text-white
                    hover:bg-emerald-700 transition"
        >
          {t("ProfileHistoryTab.actions.export_excel")}
        </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="h-full flex items-center justify-center text-sm text-gray-500">
            {t("ProfileHistoryTab.states.loading")}
          </div>
        ) : invoices.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-gray-400">
            {t("ProfileHistoryTab.states.empty")}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-gray-600 sticky top-0 z-10">
              <tr>
                <th className="text-start px-4 py-2">{t("ProfileHistoryTab.table.invoice")}</th>
                <th className="text-start px-4 py-2">{t("ProfileHistoryTab.table.date")}</th>
                <th className="text-end px-4 py-2">{t("ProfileHistoryTab.table.total")}</th>
                <th className="text-center px-4 py-2">{t("ProfileHistoryTab.table.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv, index) => (
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
                        {t("ProfileHistoryTab.actions.view")}
                      </button>
                      <button
                        className="px-3 py-1 text-xs rounded-lg border bg-white hover:bg-gray-100"
                        onClick={() => printInvoice(inv.invoice_number)}
                      >
                        {t("ProfileHistoryTab.actions.print")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {viewInvoiceNo && (
        <InvoiceViewPopup
          invoiceNumber={viewInvoiceNo}
          onClose={() => setViewInvoiceNo(null)}
        />
      )}
      {popupMessage && (
  <Popup
    message={popupMessage}
    onClose={closePopup}
  />
)}
      <div className="hidden">
        <PrintableInvoice
          ref={printRef}
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
