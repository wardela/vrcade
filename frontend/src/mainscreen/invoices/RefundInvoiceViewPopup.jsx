import { useEffect, useState, useRef, useMemo } from "react";
import api from "../../utils/axiosInstance";
import { useReactToPrint } from "react-to-print";
import PrintableRefundInvoice from "./printablerefundinvoice";
import ShareConfirmationPopup from "./shareconfirmationpopup";
import Popup from "../../components/Popup";
import { useTranslation } from "react-i18next";
export default function RefundInvoiceViewPopup({ refundInvoiceNumber, onClose }) {
  // ===== Permissions =====
let permissions = {};
try {
  const raw = localStorage.getItem("permissions");
  permissions = raw ? JSON.parse(raw) : {};
} catch {
  permissions = {};
}

const canShareRefund = permissions?.einvoicing?.view === true;

  const [loading, setLoading] = useState(true);
  const [refund, setRefund] = useState(null);
  const {t} = useTranslation();
  const [shareTarget, setShareTarget] = useState(null);
  const [sharing, setSharing] = useState(false);
const [popupMessage, setPopupMessage] = useState(null);

const showPopup = (message) => {
  setPopupMessage(message);
};

const closePopup = () => {
  setPopupMessage(null);
};


  useEffect(() => {
    if (!refundInvoiceNumber) return;

    const fetchRefund = async () => {
      try {
        setLoading(true);

        const res = await api.get(
          `/api/invoices/refunds/full/${refundInvoiceNumber}`
        );

        setRefund(res.data);
      } catch (err) {
        console.error("Error loading refund invoice:", err);
        setRefund(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRefund();
  }, [refundInvoiceNumber]);


  const printRef = useRef();

const handlePrint = useReactToPrint({
  content: () => printRef.current,
});


  const printableItems = useMemo(() => {
  if (!refund?.lines) return [];

  return refund.lines.map(l => ({
    desc: l.description,
    qty: Number(l.refund_qty),
    price: Number(l.item_price),
    tax: Number(l.tax),
    discount: Number(l.discount_percentage || 0)
  }));
}, [refund]);

const shareRefundInvoice = async (refundInvoiceNumber) => {
  if (!canShareRefund) return;
  try {
    setSharing(true);

    await api.post(
      `/api/invoices/refunds/share/${refundInvoiceNumber}`
    );

    showPopup(
      t("RefundView.share.success", {
        number: refundInvoiceNumber
      })
    );


    // refresh refund list
    setRefundInvoices([]);
    setRefundOffset(0);
    fetchRefundInvoices(true);

  } catch (err) {
    console.error("Share refund error:", err);
    showPopup(
      err?.response?.data?.message ||
      t("RefundView.share.failed")
    );
  } finally {
    setSharing(false);
    setShareTarget(null);
  }
};

const [company, setCompany] = useState(null);

useEffect(() => {
  api
    .get(`/api/invoices/company`)
    .then(res => setCompany(res.data))
    .catch(console.error);
}, []);


  if (!refundInvoiceNumber) return null;


  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="w-[90%] max-w-4xl max-h-[90vh] bg-white rounded-xl shadow-xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
          <div>
            <div className="text-lg font-semibold text-gray-700">
              {refundInvoiceNumber}
            </div>
            <div className="text-sm text-gray-500">
              {t("RefundView.subtitle")}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 border rounded bg-[#2f788a] text-white hover:bg-[#276472]"
            >
              {t("RefundView.buttons.print")}
            </button>

          {canShareRefund && (
            <button
              onClick={() => setShareTarget(refundInvoiceNumber)}
              className="px-3 py-1.5 border rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              {t("RefundView.buttons.share")}
            </button>
          )}

            <button
              onClick={onClose}
              className="px-3 py-1.5 border rounded hover:bg-gray-100"
            >
              {t("RefundView.buttons.close")}
            </button>
          </div>

        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-6">
          {loading || !refund?.header ? (
            <div className="text-center text-gray-500">
              {t("RefundView.loading")}
            </div>
          ) : (
            <>
              {/* Header info */}
              <div className="grid grid-cols-3 gap-4 text-sm mb-6">
                <Info label={t("RefundView.info.refund_date")} value={refund.header.refund_date} />
                <Info
                  label={t("RefundView.info.original_invoice")}
                  value={refund.header.original_invoice_number}
                />
                <Info label={t("RefundView.info.reason")} value={refund.header.refund_reason} />
              </div>

              {/* Lines */}
              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 text-gray-600">
                    <tr>
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">{t("RefundView.table.item")}</th>
                    <th className="px-3 py-2 text-right">{t("RefundView.table.orig_qty")}</th>
                    <th className="px-3 py-2 text-right">{t("RefundView.table.refund_qty")}</th>
                    <th className="px-3 py-2 text-right">{t("RefundView.table.price")}</th>
                    <th className="px-3 py-2 text-right">{t("RefundView.table.tax_pct")}</th>
                    <th className="px-3 py-2 text-right">{t("RefundView.table.disc_pct")}</th>
                    <th className="px-3 py-2 text-right">{t("RefundView.table.line_total")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {refund.lines.map((l, i) => (
                        <tr className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <td className="px-3 py-2">{l.item_number}</td>

                            <td className="px-3 py-2">
                                {l.description || "—"}
                            </td>

                            <td className="px-3 py-2 text-right">
                                {Number(l.original_qty).toFixed(2)}
                            </td>

                            <td className="px-3 py-2 text-right font-medium">
                                {Number(l.refund_qty).toFixed(2)}
                            </td>

                            <td className="px-3 py-2 text-right">
                                JD {Number(l.item_price).toFixed(3)}
                            </td>

                            <td className="px-3 py-2 text-right">
                                {Number(l.tax).toFixed(2)}%
                            </td>

                            <td className="px-3 py-2 text-right">
                                {Number(l.discount_percentage || 0).toFixed(2)}%
                            </td>

                            <td className="px-3 py-2 text-right font-semibold">
                              JD {(
                                Number(l.original_qty) > 0
                                  ? (Number(l.original_total) / Number(l.original_qty)) * Number(l.refund_qty)
                                  : 0
                              ).toFixed(3)}
                            </td>
                        </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total */}
              <div className="flex justify-end mt-6">
                <div className="w-64">
                  <Row
                    label={t("RefundView.totals.refund_total")}
                    value={refund.header.total}
                    bold
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      {refund?.header && (
  <div style={{ display: "none" }}>
    <PrintableRefundInvoice
      ref={printRef}
      company={company}    
      refundNumber={refund.header.refund_invoice_number}
      originalInvoice={refund.header.original_invoice_number}
      refundDate={refund.header.refund_date}
      refundReason={refund.header.refund_reason}
      invoiceItems={refund.lines}
      totalBeforeTax={
        printableItems.reduce(
          (s, i) => s + (i.price / (1 + i.tax / 100)) * i.qty,
          0
        )
      }
      totalTax={
        printableItems.reduce(
          (s, i) =>
            s +
            ((i.price - i.price / (1 + i.tax / 100)) * i.qty),
          0
        )
      }
      grandTotal={Number(refund.header.total)}
      qr={refund.header.qr}
    />
  </div>
)}
{shareTarget && (
  <ShareConfirmationPopup
    title="Share Refund Invoice"
    message={`Sharing refund invoice ${shareTarget} with ISTD.\nAfter sharing, edits cannot be made.`}
    confirmText="Yes, Share"
    cancelText="No"
    loading={sharing}
    onConfirm={() => shareRefundInvoice(shareTarget)}
    onCancel={() => setShareTarget(null)}
  />
)}
      {popupMessage && (
  <Popup
    message={popupMessage}
    onClose={closePopup}
  />
)}
    </div>
  );
}

/* helpers */

function Info({ label, value }) {
  return (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="font-medium">{value || "—"}</div>
    </div>
  );
}

function Row({ label, value, bold }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-600">{label}</span>
      <span className={bold ? "font-semibold" : ""}>
        JD {Number(value || 0).toFixed(3)}
      </span>
    </div>
  );
}
