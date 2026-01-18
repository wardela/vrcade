import React, { useState, useMemo, useEffect } from "react";
import api from "../../utils/axiosInstance";
import * as XLSX from "xlsx";
import Popup from "../../components/Popup";
import { useTranslation } from "react-i18next";
const getToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

const InvoiceFilterPopup = ({ onClose, onSelectInvoice }) => {
  const [fromDate, setFromDate] = useState(getToday());
  const [toDate, setToDate] = useState(getToday());
  const [loading, setLoading] = useState(false);
const [popupMessage, setPopupMessage] = useState(null);
const {t} = useTranslation();
const showPopup = (message) => {
  setPopupMessage(message);
};

const closePopup = () => {
  setPopupMessage(null);
};

  const [results, setResults] = useState([]);

  // 🔎 frontend filters
  const [search, setSearch] = useState("");
  const [onlyUnshared, setOnlyUnshared] = useState(false);

const fetchInvoicesByDateRange = async () => {
  setLoading(true);
  setResults([]);

  try {
    const res = await api.get(
      `/api/invoices/by-range`,
      {
        params: {
          from: fromDate,
          to: toDate
        }
      }
    );

    setResults(res.data);
  } catch (err) {
    console.error(err);
    showPopup("Failed to fetch invoices");
  } finally {
    setLoading(false);
  }
};

  // 🧠 derived filtered list
  const filteredResults = useMemo(() => {
    return results.filter((inv) => {
      const matchesSearch =
        !search ||
        inv.invoice_number.toLowerCase().includes(search.toLowerCase());

      const isUnshared =
        inv.qr === "123456789" || inv.qr == null;

      const matchesUnshared = !onlyUnshared || isUnshared;

      return matchesSearch && matchesUnshared;
    });
  }, [results, search, onlyUnshared]);

  const grandTotal = filteredResults.reduce(
    (sum, inv) => sum + Number(inv.total || 0),
    0
  );

  const handleExportExcel = () => {
  if (filteredResults.length === 0) {
    showPopup("No invoices to export");
    return;
  }

  // Shape the data exactly how you want it in Excel
  const data = filteredResults.map((inv) => ({
    "Invoice Number": inv.invoice_number,
    "POS": inv.pos,
    "Date": inv.date,
    "Total (JD)": Number(inv.total).toFixed(3),
    "Status":
      inv.qr === "123456789" || inv.qr == null
        ? "Unshared"
        : "Shared",
  }));

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Auto column width (nice polish)
  worksheet["!cols"] = [
    { wch: 18 },
    { wch: 10 },
    { wch: 20 },
    { wch: 14 },
    { wch: 12 },
  ];

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Invoices");

  // File name
  const fileName = `Invoices_${fromDate}_to_${toDate}.xlsx`;

  // Download
  XLSX.writeFile(workbook, fileName);
};

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white w-[1100px] max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              {t("InvoiceFilter.title")}
            </h2>
            <p className="text-xs text-gray-500">
              {t("InvoiceFilter.subtitle")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-black text-lg"
          >
            ✕
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 grid grid-cols-6 gap-4 items-end bg-white border-b">
          <div>
            <label className="text-xs text-gray-500"> {t("InvoiceFilter.from")}</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full border rounded-md p-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">{t("InvoiceFilter.to")}</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full border rounded-md p-2 text-sm"
            />
          </div>

          <div className="col-span-2">
            <label className="text-xs text-gray-500">{t("InvoiceFilter.search_label")}</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="6XXXXX"
              className="w-full border rounded-md p-2 text-sm"
            />
          </div>

           

          <button
            onClick={fetchInvoicesByDateRange}
            className="bg-[#2f788a] text-white py-2 rounded-md hover:bg-[#276472] transition text-sm"
          >
            {t("InvoiceFilter.apply")}
          </button>
              <button
                onClick={handleExportExcel}
                className="px-4 py-2 rounded-md bg-emerald-600 text-white text-sm font-medium
                            hover:bg-emerald-700 transition shadow-sm"
                >
                {t("InvoiceFilter.export_excel")}
                </button>
        </div>

        <div className="flex items-center gap-3 select-none px-6 py-2">
            <button dir="ltr"
                type="button"
                onClick={() => setOnlyUnshared(!onlyUnshared)}
                className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300
                ${onlyUnshared ? "bg-red-500" : "bg-gray-300"}
                `}
            >
                <span
                className={`
                    inline-block h-4 w-4 transform rounded-full bg-white shadow
                    transition-transform duration-300
                    ${onlyUnshared ? "translate-x-6" : "translate-x-1"}
                `}
                />
            </button>
            <span className="text-sm text-gray-600 font-medium">
                {t("InvoiceFilter.only_unshared")}
            </span>
            </div>
        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <p className="text-center text-gray-500 py-6">{t("InvoiceFilter.loading")}</p>
          )}

          {!loading && filteredResults.length === 0 && (
            <p className="text-center text-gray-400 py-6">
             {t("InvoiceFilter.no_results")}
            </p>
          )}

          {filteredResults.length > 0 && (
            <table className="w-full border-collapse text-sm">
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr className="text-left text-gray-600">
                  <th className="p-3 border text-start">{t("InvoiceFilter.table.invoice_number")}</th>
                  <th className="p-3 border text-start">{t("InvoiceFilter.table.date")}</th>
                  <th className="p-3 border text-start">{t("InvoiceFilter.table.total")}</th>
                  <th className="p-3 border text-center">{t("InvoiceFilter.table.status")}</th>
                </tr>
              </thead>

              <tbody>
                {filteredResults.map((inv, idx) => {
                  const isUnshared =
                    inv.qr === "123456789" || inv.qr == null;

                  return (
                    <tr
                      key={idx}
                      onClick={() => onSelectInvoice(inv)}
                      className={`cursor-pointer transition
                        ${isUnshared ? "bg-red-50" : "bg-white"}
                        hover:bg-[#f1f8fa]
                      `}
                    >
                      <td className="p-3 border font-semibold">
                        {inv.invoice_number}
                      </td>
                      <td className="p-3 border text-xs text-gray-600">
                        {inv.date}
                      </td>
                      <td className="p-3 border text-right font-semibold">
                        JD {Number(inv.total).toFixed(3)}
                      </td>
                      <td className="p-3 border text-center">
                        {isUnshared ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">
                            {t("InvoiceFilter.status.unshared")}
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                            {t("InvoiceFilter.status.shared")}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
          <div className="border-t px-6 py-4 bg-gray-50 flex justify-between items-center">
  <span className="text-sm text-gray-600">
    {t("InvoiceFilter.footer.showing")} {filteredResults.length} / {results.length} 
  </span>

  <div className="flex items-center gap-4">
        <span className="text-lg font-bold text-[#2f788a]">
      {t("InvoiceFilter.footer.grand_total")}: JD {grandTotal.toFixed(3)}
    </span>


  </div>
</div>




      </div>
      {popupMessage && (
  <Popup
    message={popupMessage}
    onClose={closePopup}
  />
)}

    </div>
  );
};

export default InvoiceFilterPopup;
