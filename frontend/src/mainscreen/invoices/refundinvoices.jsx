import React, { useEffect, useMemo, useState } from "react";
import api from "../../utils/axiosInstance";
import RefundInvoiceViewPopup from "./RefundInvoiceViewPopup";
import Popup from "../../components/Popup";
import { useTranslation } from "react-i18next";
export default function RefundInvoices() {

  // ===== Permissions =====
let permissions = {};
try {
  const raw = localStorage.getItem("permissions");
  permissions = raw ? JSON.parse(raw) : {};
} catch {
  permissions = {};
}

const refundPerm = permissions?.refunds || {};
const einvPerm = permissions?.einvoicing || {};

const canAddRefund = refundPerm?.add === true;
const canShareRefund = einvPerm?.view === true;
const {t} = useTranslation();
// view is already enforced by routing, but keep for safety
const canViewRefund = refundPerm?.view === true;

const isReadOnlyRefund = !canAddRefund;

  const [fetchedInvoices, setFetchedInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const DEFAULT_QR = "123456789";

  const [listMode, setListMode] = useState("original"); 
  const [selectedRefundInvoice, setSelectedRefundInvoice] = useState(null);
  const [showRefundPopup, setShowRefundPopup] = useState(false);

  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const [header, setHeader] = useState(null);
  const [lines, setLines] = useState([]);
  const [returnToStorage, setReturnToStorage] = useState(true);
  const [refundDate, setRefundDate] = useState(
  new Date().toISOString().substring(0, 10)
);
const [popupMessage, setPopupMessage] = useState(null);

const showPopup = (message) => {
  setPopupMessage(message);
};

const closePopup = () => {
  setPopupMessage(null);
};

  const [refundedSummary, setRefundedSummary] = useState([]); // [{item_number, refunded_qty}]
  const refundedMap = useMemo(() => {
    const m = new Map();
    for (const r of refundedSummary) {
      m.set(Number(r.item_number), Number(r.refunded_qty || 0));
    }
    return m;
  }, [refundedSummary]);

  const [refundReason, setRefundReason] = useState("");
  const [saving, setSaving] = useState(false);

  const [refundInvoices, setRefundInvoices] = useState([]);
    const [refundOffset, setRefundOffset] = useState(0);

  const dedupeInvoices = (arr) => {
    const map = new Map();
    arr.forEach((inv) => map.set(inv.invoice_number, inv));
    return Array.from(map.values());
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await api.get(
        `/api/invoices?limit=100&offset=${offset}`
      );
      setFetchedInvoices((prev) => dedupeInvoices([...prev, ...res.data]));
    } catch (err) {
      console.error("Error fetching invoices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset]);

  const loadMore = () => setOffset((prev) => prev + 100);

  const handleSearch = async () => {
    try {
      setLoading(true);
      setIsSearching(true);
      setOffset(0);
      const res = await api.get(
        `/api/invoices/search?q=${encodeURIComponent(
          searchQuery
        )}&limit=100&offset=0`
      );
      setFetchedInvoices(dedupeInvoices(res.data));
    } catch (err) {
      console.error("Search error:", err);
      showPopup(t("RefundInvoices.messages.search_failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleSearchLoadMore = async () => {
    try {
      const nextOffset = offset + 100;
      setLoading(true);
      const res = await api.get(
        `/api/invoices/search?q=${encodeURIComponent(
          searchQuery
        )}&limit=100&offset=${nextOffset}`
      );
      setFetchedInvoices((prev) => dedupeInvoices([...prev, ...res.data]));
      setOffset(nextOffset);
    } catch (err) {
      console.error("Load more search error:", err);
    } finally {
      setLoading(false);
    }
  };

const fetchRefundInvoices = async (reset = false) => {
  try {
    setLoading(true);

    const currentOffset = reset ? 0 : refundOffset;

    const res = await api.get(
      `/api/invoices/refunds?limit=100&offset=${currentOffset}`
    );

    setRefundInvoices((prev) =>
      reset ? res.data : [...prev, ...res.data]
    );

  } catch (err) {
    console.error("Error fetching refund invoices:", err);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  if (listMode === "refund") {
    setRefundInvoices([]);
    setRefundOffset(0);
    fetchRefundInvoices(true);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [listMode]);

  const handleInvoiceClick = async (inv) => {
    try {
      setSelectedInvoice(inv);
      setRefundReason("");

      // 1) fetch full original invoice
      const res = await api.get(
        `/api/invoices/full/${inv.invoice_number}`
      );

      const data = res.data;
      setHeader(data.header);

      // 2) fetch refund summary for original invoice (already refunded quantities)
      const sumRes = await api.get(
        `/api/invoices/refunds/summary/${inv.invoice_number}`
      );
      setRefundedSummary(sumRes.data || []);

      // 3) map lines and add refund_qty input per line
      const formatted = (data.lines || []).map((l) => {
        const qty = Number(l.qty || 0);
        const priceWithTax = Number(l.item_price || 0);
        const taxPct = Number(l.tax || 0);
        const discountPct = Number(l.discount_percentage || 0); // 0–1
        const discountValuePerUnit = Number(l.discount || 0);
        const total = Number(l.total || 0);

        const taxFactor = taxPct / 100;
        const priceWithoutTax = priceWithTax / (1 + taxFactor);

        const unitNetAfterDiscount = priceWithTax * (1 - discountPct);
        const taxValuePerUnit =
            unitNetAfterDiscount - unitNetAfterDiscount / (1 + taxFactor);

        return {
            item_number: Number(l.item_number),
            description: l.description || "",
            qty,
            refund_qty: 0,

            // prices
            price_with_tax: Number(priceWithTax || 0),
            price_without_tax: Number(priceWithoutTax.toFixed(3)),

            // discount
            discount_percentage: Number(discountPct || 0),
            discount_value_per_unit: discountValuePerUnit,

            // tax
            tax_percentage: Number(taxPct || 0),
            tax_value_per_unit: Number(taxValuePerUnit.toFixed(3)),

            // totals
            line_total: total
        };
        });


      setLines(formatted);
    } catch (err) {
      console.error("Error opening invoice:", err);
      showPopup(t("RefundInvoices.messages.open_failed"));
    }
  };

  const updateRefundQty = (item_number, value) => {
    setLines((prev) =>
      prev.map((ln) => {
        if (ln.item_number !== item_number) return ln;

        const v = Number(value || 0);
        if (!Number.isFinite(v) || v < 0) return { ...ln, refund_qty: 0 };

        const already = refundedMap.get(item_number) || 0;
        const available = Number(ln.qty || 0) - already;

        return {
          ...ln,
          refund_qty: v > available ? available : v
        };
      })
    );
  };

const refundTotal = useMemo(() => {
  let sum = 0;

  for (const ln of lines) {
    const rq = Number(ln.refund_qty || 0);
    if (rq <= 0) continue;

    const unitFinal =
      ln.price_with_tax * (1 - ln.discount_percentage);

    sum += unitFinal * rq;
  }

  return Number(sum.toFixed(3));
}, [lines]);

  const hasAnyRefund = useMemo(
    () => lines.some((l) => Number(l.refund_qty || 0) > 0),
    [lines]
  );

  const saveRefund = async () => {
    if (!canAddRefund) return;
    if (!header?.invoice_number) {
      showPopup(t("RefundInvoices.messages.select_invoice"));
      return;
    }
    if (!hasAnyRefund) {
      showPopup(t("RefundInvoices.messages.enter_qty"));
      return;
    }
    if (!refundReason.trim()) {
      showPopup(t("RefundInvoices.messages.reason_required"));
      return;
    }

    try {
      setSaving(true);

    const payload = {
      original_invoice_number: header.invoice_number,
      refund_reason: refundReason.trim(),
      refund_date: refundDate, // ✅ ADD THIS
      return_to_storage: returnToStorage,
      lines: lines
        .filter((l) => Number(l.refund_qty || 0) > 0)
        .map((l) => ({
          item_number: l.item_number,
          refund_qty: Number(l.refund_qty)
        }))
    };


      const res = await api.post(`/api/invoices/refunds`, payload);

      showPopup(t("RefundInvoices.messages.saved_success"));

      // Refresh summary and reset inputs
      const sumRes = await api.get(
        `/api/invoices/refunds/summary/${header.invoice_number}`
      );
      setRefundedSummary(sumRes.data || []);

      setLines((prev) => prev.map((x) => ({ ...x, refund_qty: 0 })));
      setRefundReason("");
    } catch (err) {
      console.error("Save refund error:", err);
      showPopup(err?.response?.data?.message || t("RefundInvoices.messages.save_failed"));
    } finally {
      setSaving(false);
    }
  };

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

useEffect(() => {
  if (window.innerWidth < 1600) {
    setIsSidebarCollapsed(true);
  }
}, []);

  return (
    <div className="flex w-full h-screen bg-base-200">
      {/* ===== Left Column - Original Invoices ===== */}
<div
  className={`
    border-r border-gray-300 bg-gray-100 flex flex-col
    transition-all duration-300 ease-in-out
    ${isSidebarCollapsed ? "w-0 opacity-0 overflow-hidden" : "w-[320px]"}
  `}
>
<div className="p-4 border-b bg-white shadow-sm flex flex-col gap-4">
  {/* Top row: title + collapse */}
  <div className="flex items-center justify-between">
    <h2 className="text-lg font-semibold text-gray-800">
      {t("RefundInvoices.sidebar.title")}
    </h2>

    <button
      onClick={() => setIsSidebarCollapsed(true)}
      className="
        p-2 rounded-md border border-gray-300
        text-gray-500 hover:bg-gray-100 transition
      "
      title="Hide list"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="w-4 h-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 19l-7-7 7-7"
        />
      </svg>
    </button>
  </div>

{/* Mode switch */}
<div className="flex rounded-lg bg-gray-100 p-1 overflow-hidden">
  <button
    onClick={() => setListMode("original")}
    className={`flex-1 px-3 py-2 text-sm rounded-md transition
      whitespace-nowrap
      ${
        listMode === "original"
          ? "bg-white shadow text-[#2f788a] font-semibold"
          : "text-gray-600 hover:text-gray-800"
      }
    `}
  >
    {/* Full label */}
    <span className="hidden sm:inline">
      {t("RefundInvoices.sidebar.mode_original_short")}
    </span>

    {/* Short label */}
    <span className="sm:hidden">
      {t("RefundInvoices.sidebar.mode_original_short")}
    </span>
  </button>

  <button
    onClick={() => setListMode("refund")}
    className={`flex-1 px-3 py-2 text-sm rounded-md transition
      whitespace-nowrap
      ${
        listMode === "refund"
          ? "bg-white shadow text-[#2f788a] font-semibold"
          : "text-gray-600 hover:text-gray-800"
      }
    `}
  >
    {/* Full label */}
    <span className="hidden sm:inline">
     {t("RefundInvoices.sidebar.mode_refund_full")}
    </span>

    {/* Short label */}
    <span className="sm:hidden">
       {t("RefundInvoices.sidebar.mode_refund_short")}
    </span>
  </button>
</div>


  {/* Search */}
  <div className="relative flex gap-2">
    <div className="relative flex-grow">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder={t("RefundInvoices.sidebar.search_placeholder")}
        className="
          w-full border rounded-md py-2 pl-9 pr-3 text-sm
          text-gray-700 bg-white
          focus:ring-2 focus:ring-[#2f788a]
          focus:outline-none
        "
      />

      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-4 h-4 absolute left-3 top-2.5 text-gray-400"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-4.35-4.35M9.5 17a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z"
        />
      </svg>
    </div>

    <button
      onClick={handleSearch}
      className="
        px-4 py-2 text-sm font-medium
        bg-[#2f788a] text-white rounded-md
        hover:bg-[#276472] transition
      "
    >
      {t("RefundInvoices.sidebar.search_button")}
    </button>
  </div>
</div>


        <div className="flex-grow overflow-y-auto">
          <table className="w-full border-collapse text-sm bg-white rounded-md shadow">
<thead className="bg-gray-100 border-b">
  <tr className="text-start text-gray-600">
    {listMode === "original" ? (
      <>
        <th className="p-2 border">{t("RefundInvoices.table.invoice")}</th>
        <th className="p-2 border">{t("RefundInvoices.table.client")}</th>
        <th className="p-2 border">{t("RefundInvoices.table.total")}</th>
      </>
    ) : (
      <>
        <th className="p-2 border">{t("RefundInvoices.table.refund_number")} </th>
        <th className="p-2 border">{t("RefundInvoices.table.original_invoice")}</th>
        <th className="p-2 border">{t("RefundInvoices.table.total")}</th>
      </>
    )}
  </tr>
</thead>


<tbody>
  {listMode === "original" &&
    fetchedInvoices.map((inv, index) => (
     <tr
  key={index}
  onClick={() => handleInvoiceClick(inv)}
  className={`cursor-pointer transition
    ${
      selectedInvoice?.invoice_number === inv.invoice_number
        ? "bg-[#e5f6f8] font-semibold text-[#2f788a]"
        : inv.has_refund && inv.qr !== "123456789"
          ? "bg-purple-50"
          : inv.has_refund
            ? "bg-red-50"
            : inv.qr !== "123456789"
              ? "bg-green-50"
              : "bg-white"
    }
    hover:bg-[#f1f8fa]
  `}
>

<td className="border px-2 py-1 whitespace-nowrap overflow-hidden text-ellipsis">
  <span className="block truncate">
    {inv.invoice_number}
  </span>
</td>

<td className="border p-2 max-w-[160px]">
  <div className="truncate whitespace-nowrap overflow-hidden">
    {inv.client || "—"}
  </div>
</td>
        <td className="border p-2">
          {Number(inv.total || 0).toFixed(3)}
        </td>
      </tr>
    ))}

{listMode === "refund" &&
  refundInvoices.map((rfd) => (
    <tr
      key={rfd.refund_invoice_number}
      onClick={() => {
        setSelectedRefundInvoice(rfd.refund_invoice_number);
        setShowRefundPopup(true);
      }}
      className={`px-3 py-2 cursor-pointer hover:bg-gray-100
    ${rfd.qr && rfd.qr !== DEFAULT_QR ? "bg-green-50" : ""}
  `}
    >
<td className="border p-2 whitespace-nowrap overflow-hidden text-ellipsis">
  <span className="block truncate">
    {rfd.refund_invoice_number}
  </span>
</td>

<td className="border p-2 whitespace-nowrap overflow-hidden text-ellipsis">
  {rfd.original_invoice_number}
</td>
      <td className="border p-2 text-right font-semibold text-red-600">
       {Number(rfd.total || 0).toFixed(3)}
      </td>
    </tr>
  ))}

</tbody>

          </table>

          {!loading && fetchedInvoices.length >= 100 && (
            <div className="text-center my-4">
              <button
                onClick={isSearching ? handleSearchLoadMore : loadMore}
                className="px-4 py-2 bg-[#2f788a] text-white rounded hover:bg-[#276472] transition"
              >
                {t("RefundInvoices.sidebar.load_more")}
              </button>
            </div>
          )}

          {loading && (
            <p className="text-center text-gray-500 my-4">{t("RefundInvoices.sidebar.loading")}</p>
          )}
        </div>
      </div>

      {/* ===== Right Column - Refund Builder ===== */}
      <div
        className={`w-full bg-white flex flex-col overflow-y-auto transition
          ${isReadOnlyRefund ? "opacity-70" : ""}
        `}
      >
        <div className="p-6 border-b shadow flex flex-col gap-4">
          <div className="flex items-center justify-between">
            {isSidebarCollapsed && (
              <button
                onClick={() => setIsSidebarCollapsed(false)}
                className="
                  p-2 rounded-md border border-gray-300
                  hover:bg-gray-100 transition shadow-sm
                "
                title="Show list"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="w-5 h-5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
            <h2 className="text-2xl font-semibold text-gray-700">
              {t("RefundInvoices.builder.title")}
            </h2>

            {canAddRefund && (
              <button
                onClick={saveRefund}
                disabled={!header || saving}
                className={`px-4 py-2 rounded-md text-white transition
                  ${!header || saving ? "bg-gray-400 cursor-not-allowed" : "bg-[#2f788a] hover:bg-[#276472]"}
                `}
              >
                {saving ? t("RefundInvoices.builder.saving") : t("RefundInvoices.builder.save")}
              </button>
            )}
          </div>

          {!header ? (
            <div className="p-4 bg-gray-50 border rounded text-gray-600">
              {t("RefundInvoices.builder.empty_hint")}
            </div>
          ) : (
            <>
<div className="grid grid-cols-4 gap-4">
  <div>
    <div className="text-sm text-gray-500"> {t("RefundInvoices.builder.original_invoice")}</div>
    <div className="font-semibold text-gray-800">
      {header.invoice_number}
    </div>
  </div>

  <div>
    <div className="text-sm text-gray-500"> {t("RefundInvoices.builder.invoice_date")}</div>
    <div className="font-semibold text-gray-800">
      {header.date
        ? new Date(header.date).toLocaleDateString()
        : "—"}
    </div>
  </div>

  <div>
    <div className="text-sm text-gray-500"> {t("RefundInvoices.builder.client")}</div>
    <div className="font-semibold text-gray-800">
      {header.client || "—"}
    </div>
  </div>

  <div>
    <div className="text-sm text-gray-500"> {t("RefundInvoices.builder.original_total")}</div>
    <div className="font-semibold text-gray-800">
      JD {Number(header.total || 0).toFixed(3)}
    </div>
  </div>
</div>



              {/* Refund reason */}
              <div>
                <label className="text-sm text-gray-500">{t("RefundInvoices.builder.refund_reason")}</label>
                <textarea
                  value={refundReason}
                    disabled={!canAddRefund}
                  onChange={(e) => setRefundReason(e.target.value)}
                  rows={2}
                  className="w-full border rounded-md p-2 mt-1 text-gray-700"
                  placeholder={t("RefundInvoices.builder.refund_reason_placeholder")}
                />
              </div>
              <div>
                <label className="text-sm text-gray-500">{t("RefundInvoices.builder.refund_date")}</label>
                <input
                  type="date"
                  value={refundDate}
                  onChange={(e) => setRefundDate(e.target.value)}
                    disabled={!canAddRefund}
                  className="w-full border rounded-md p-2 mt-1 text-gray-700"
                />
              </div>
              <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                checked={returnToStorage}
                onChange={(e) => setReturnToStorage(e.target.checked)}
                  disabled={!canAddRefund}
                className="w-4 h-4 accent-[#2f788a]"
                id="returnToStorage"
              />
              <label
                htmlFor="returnToStorage"
                className="text-sm text-gray-700 select-none"
              >
                {t("RefundInvoices.builder.return_to_storage")}
              </label>
            </div>
            </>
          )}
        </div>

        {/* Lines */}
        <div className="flex-grow p-6 overflow-y-auto">
          {header && (
            <table className="w-full border-collapse text-sm rounded-md overflow-hidden shadow">
              <thead className="bg-gray-100 border-b text-gray-700 text-sm">
               <tr>
                <th className="border p-2 text-center w-16">{t("RefundInvoices.lines.line")}</th>
                <th className="border p-2 text-start">{t("RefundInvoices.lines.item")}</th>

                <th className="border p-2 text-center w-32">{t("RefundInvoices.lines.price")}</th>
                <th className="border p-2 text-center w-24">{t("RefundInvoices.lines.discount_pct")}</th>
                <th className="border p-2 text-center w-24">{t("RefundInvoices.lines.tax_pct")}</th>
                <th className="border p-2 text-center w-32">{t("RefundInvoices.lines.net_per_unit")}</th>

                <th className="border p-2 text-center w-28">{t("RefundInvoices.lines.original_qty")}</th>
                <th className="border p-2 text-center w-28">{t("RefundInvoices.lines.refunded_qty")}</th>
                <th className="border p-2 text-center w-28">{t("RefundInvoices.lines.available_qty")}</th>
                <th className="border p-2 text-center w-32">{t("RefundInvoices.lines.refund_qty")}</th>
                <th className="border p-2 text-center w-40">{t("RefundInvoices.lines.refund_value")}</th>
               </tr>
              </thead>

              <tbody>
                {lines.map((ln) => {
                  const already = refundedMap.get(ln.item_number) || 0;
                  const available = Number(ln.qty || 0) - already;

                  const qty = Number(ln.qty || 0);
                  const unitFinal =
                  ln.price_with_tax * (1 - ln.discount_percentage);

                  const refundValue =
                  unitFinal * Number(ln.refund_qty || 0);

                  return (
                    <tr key={ln.item_number} className="hover:bg-gray-50">
                      <td className="border p-2 text-center font-semibold text-gray-700">
                        {ln.item_number}
                      </td>
                      <td className="border p-2">{ln.description}</td>
                        <td className="border p-2 text-right">
                        JD {Number(ln.price_with_tax || 0).toFixed(3)}
                        </td>

                        <td className="border p-2 text-center">
                        {(Number(ln.discount_percentage || 0) * 100).toFixed(2)}%
                        </td>

                        <td className="border p-2 text-center">
                        {Number(ln.tax_percentage || 0).toFixed(2)}%
                        </td>

                        <td className="border p-2 text-right font-semibold">
                        JD {(
                        Number(ln.price_with_tax || 0) *
                        (1 - Number(ln.discount_percentage || 0))
                        ).toFixed(3)}
                        </td>
                      <td className="border p-2 text-center">
                        {Number(ln.qty || 0).toFixed(2)}
                      </td>
                      <td className="border p-2 text-center">
                        {Number(already).toFixed(2)}
                      </td>
                      <td className="border p-2 text-center font-semibold">
                        {Number(available).toFixed(2)}
                      </td>
                      <td className="border p-2 text-center">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={ln.refund_qty}
                          onChange={(e) =>
                            updateRefundQty(ln.item_number, e.target.value)
                          }
                            disabled={!canAddRefund || available <= 0}
                          className={`w-28 border rounded px-2 py-1 text-center ${
                            available <= 0 ? "bg-gray-100 cursor-not-allowed" : ""
                          }`}
                        />
                      </td>
                      <td className="border p-2 text-right font-semibold text-gray-700">
                        JD {Number(refundValue ?? 0).toFixed(3)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer totals */}
        <div className="border-t p-6 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-gray-600">
              {header ? (
                <>
                  {t("RefundInvoices.footer.refunding_from")} <span className="font-semibold">{header.invoice_number}</span>
                </>
              ) : (
                t("RefundInvoices.footer.no_invoice")
              )}
            </div>

            <div className="text-lg font-bold text-[#2f788a]">
              {t("RefundInvoices.footer.refund_total")}:  {refundTotal.toFixed(3)}
            </div>
          </div>
        </div>
      </div>

      {showRefundPopup && (
  <RefundInvoiceViewPopup
    refundInvoiceNumber={selectedRefundInvoice}
    onClose={() => {
      setShowRefundPopup(false);
      setSelectedRefundInvoice(null);
    }}
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
