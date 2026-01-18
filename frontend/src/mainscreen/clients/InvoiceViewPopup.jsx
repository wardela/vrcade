import { useEffect, useState } from "react";
import api from "../../utils/axiosInstance";
import { useTranslation } from "react-i18next";
export default function InvoiceViewPopup({ invoiceNumber, onClose }) {
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState(null);
  const {t} = useTranslation();
  useEffect(() => {
    if (!invoiceNumber) return;

    const fetchInvoice = async () => {
      try {
        setLoading(true);

        const res = await api.get(
          `/api/invoices/full/${invoiceNumber}`
        );

        // ✅ MAP BACKEND SHAPE → FRONTEND SHAPE
        setInvoice({
          header: res.data.header,
          lines: res.data.lines
        });

      } catch (err) {
        console.error("Error loading invoice:", err);
        setInvoice(null);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [invoiceNumber]);

  const calculateTotalTax = () => {
  if (!invoice?.lines) return 0;

  return invoice.lines.reduce((sum, line) => {
    const qty = Number(line.qty) || 0;
    const priceIncl = Number(line.total) || 0;
    const taxPercent = Number(line.tax) || 0;

    if (qty === 0 || taxPercent === 0) return sum;

    const taxRate = taxPercent / 100;
    const divider = taxRate + 1;

    const netUnitPrice = priceIncl / divider;
    const taxPerUnit = priceIncl - netUnitPrice;

    const lineTax = taxPerUnit * qty;

    return sum + lineTax;
  }, 0);
};


  if (!invoiceNumber) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="w-[90%] max-w-6xl max-h-[90vh] bg-white rounded-xl shadow-xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
          <div>
            <div className="text-lg font-semibold text-gray-700">
           {invoiceNumber}
            </div>
            <div className="text-sm text-gray-500">
              {t("InvoiceViewPopup.header.preview")}
            </div>
          </div>

          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-100"
          >
            {t("InvoiceViewPopup.actions.close")}
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-6">
          {loading || !invoice?.header ? (
            <div className="text-center text-gray-500">
              {t("InvoiceViewPopup.states.loading")}
            </div>
          ) : (
            <>
              {/* HEADER INFO */}
              <div className="grid grid-cols-4 gap-4 mb-6 text-sm">
                <Info label={t("InvoiceViewPopup.info.date")} value={invoice.header.date} />
                <Info label={t("InvoiceViewPopup.info.payment")} value={invoice.header.type} />
                <Info label={t("InvoiceViewPopup.info.type")} value={invoice.header.type2} />
                <Info label={t("InvoiceViewPopup.info.currency")} value={invoice.header.currency} />
              </div>

              {/* LINES */}
              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 text-gray-600">
                    <tr>
                      <th className="px-3 py-2">#</th>
                      <th className="px-3 py-2 text-start">{t("InvoiceViewPopup.table.item")}</th>
                      <th className="px-3 py-2 text-start">{t("InvoiceViewPopup.table.qty")}</th>
                      <th className="px-3 py-2 text-start">{t("InvoiceViewPopup.table.unit")}</th>
                      <th className="px-3 py-2 text-start">{t("InvoiceViewPopup.table.tax")}</th>
                      <th className="px-3 py-2 text-start">{t("InvoiceViewPopup.table.discount")}</th>
                      <th className="px-3 py-2 text-start">{t("InvoiceViewPopup.table.total")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.lines.map((l, i) => (
                      <tr
                        key={i}
                        className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        <td className="px-3 py-2">{l.item_number}</td>
                        <td className="px-3 py-2 text-start">{l.description}</td>
                        <td className="px-3 py-2 text-start">{l.qty}</td>
                        <td className="px-3 py-2 text-start">
                          {Number(l.item_price).toFixed(3)}
                        </td>
                        <td className="px-3 py-2 text-start">{l.tax}</td>
                          <td className="px-3 py-2 text-start">
                                {l.discount_percentage
                                ? `${Number(l.discount_percentage) * 100}%`
                                : "—"}
                            </td>
                        <td className="px-3 py-2 text-start font-semibold">
                          {Number(l.total).toFixed(3)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* TOTALS */}
              <div className="flex justify-end mt-6">
                <div className="w-80 text-sm space-y-2">
                <Row label={t("InvoiceViewPopup.totals.grand_excl")} value={invoice.header.total - calculateTotalTax()} />
                <Row label={t("InvoiceViewPopup.totals.tax_total")} value={calculateTotalTax()} />
                  <Row
                    label={t("InvoiceViewPopup.totals.grand")}
                    value={invoice.header.total}
                    bold
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* helpers */

function Info({ label, value }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="font-medium">{value || "—"}</span>
    </div>
  );
}

function Row({ label, value, bold }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-600">{label}</span>
      <span className={bold ? "font-semibold" : ""}>
        {Number(value || 0).toFixed(3)}
      </span>
    </div>
  );
}
