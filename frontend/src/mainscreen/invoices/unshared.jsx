import React, { useState } from "react";
import api from "../../utils/axiosInstance";
import Popup from "../../components/Popup";
import { useTranslation } from "react-i18next";
const UnsharedInvoices = () => {
  const [selectedDate, setSelectedDate] = useState("");
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedList, setSelectedList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [popupMsg, setPopupMsg] = useState("");
  const {t} = useTranslation();
  const getLocalDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getDate()).padStart(2, "0")}`;
  };

  React.useEffect(() => {
    setSelectedDate(getLocalDate());
  }, []);

  React.useEffect(() => {
    if (selectedDate) fetchInvoices();
  }, [selectedDate]);

  const fetchInvoices = async () => {
    if (!selectedDate) return;

    try {
      setLoading(true);
      const res = await api.get(
        `/api/invoices/unshared?date=${selectedDate}`
      );
      setInvoices(res.data);
    } catch (err) {
      console.error(err);
      setPopupMsg("Failed to fetch unshared invoices");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (invNo) => {
    setSelectedList((prev) =>
      prev.includes(invNo)
        ? prev.filter((x) => x !== invNo)
        : [...prev, invNo]
    );
  };

  const toggleSelectAll = () => {
    if (selectedList.length === invoices.length) {
      setSelectedList([]);
    } else {
      setSelectedList(invoices.map((i) => i.invoice_number));
    }
  };

  const shareSelected = async () => {
    if (selectedList.length === 0) {
      setPopupMsg("Select at least one invoice");
      return;
    }

    try {
      await api.post(`/api/invoices/share-unshared`, {
        invoices: selectedList,
      });

      setPopupMsg("Invoices shared successfully");
      fetchInvoices();
      setSelectedList([]);
    } catch (err) {
      console.error(err);
      setPopupMsg("Failed to share invoices");
    }
  };

  const filtered = invoices.filter((inv) =>
    inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex w-full h-screen bg-base-200">
      {/* LEFT SIDE */}
      <div className="w-2/3 bg-white border-r p-6 flex flex-col overflow-hidden">
        <h2 className="text-2xl font-semibold text-gray-700 mb-6">
          {t("UnsharedInvoices.title")}
        </h2>
        {/* Controls */}
        <div className="flex items-end gap-4 mb-4">
          <div className="flex flex-col">
            <label className="text-sm text-gray-500 mb-1">{t("UnsharedInvoices.controls.select_date")}</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border rounded-md p-2 text-gray-800 w-40"
            />
          </div>

          <div className="flex-grow">
            <label className="text-sm text-gray-500 mb-1">{t("UnsharedInvoices.controls.search_invoice")}</label>
            <input
              type="text"
              placeholder={t("UnsharedInvoices.controls.search_placeholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border rounded-md p-2 w-full text-gray-700"
            />
          </div>

          <button
            onClick={fetchInvoices}
            className="px-5 py-2 bg-[#2f788a] text-white rounded-md hover:bg-[#276472]"
          >
            {t("UnsharedInvoices.controls.load")}
          </button>
        </div>

        {/* RESULTS */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <p className="text-center text-gray-600 font-semibold mt-6">
              {t("UnsharedInvoices.loading")}
            </p>
          )}

          {!loading && invoices.length === 0 && selectedDate && (
            <p className="text-center text-gray-500 mt-6">
            {t("UnsharedInvoices.empty.no_date")}
            </p>
          )}

          {!loading && invoices.length > 0 && (
            <table className="w-full border-collapse text-sm bg-white shadow rounded-md overflow-hidden">
              <thead className="bg-gray-100 border-b text-gray-600">
                <tr>
                  <th className="p-2 border">
                    <input
                      type="checkbox"
                      checked={selectedList.length === invoices.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="p-2 border">{t("UnsharedInvoices.table.invoice_number")}</th>
                  <th className="p-2 border">{t("UnsharedInvoices.table.total")}</th>
                  <th className="p-2 border">{t("UnsharedInvoices.table.time")}</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((inv) => (
                  <tr key={inv.invoice_number} className="hover:bg-[#f1f8fa]">
                    <td className="border p-2 text-center">
                      <input
                        type="checkbox"
                        checked={selectedList.includes(inv.invoice_number)}
                        onChange={() => toggleSelect(inv.invoice_number)}
                      />
                    </td>

                    <td className="border p-2">{inv.invoice_number}</td>
                    <td className="border p-2">JD {Number(inv.total).toFixed(3)}</td>
                    <td className="border p-2 text-gray-500">{inv.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="w-1/3 bg-gray-50 p-6 flex flex-col shadow-inner overflow-hidden">
        <h3 className="text-xl font-bold text-gray-700 mb-4">
          {t("UnsharedInvoices.right_panel.title")}
        </h3>

        <div className="flex-1 overflow-y-auto border rounded-md p-3 bg-white shadow-sm">
          {selectedList.length === 0 ? (
            <p className="text-gray-400 text-sm">{t("UnsharedInvoices.empty.no_selected")}</p>
          ) : (
            selectedList.map((inv) => (
              <div
                key={inv}
                className="p-2 border-b text-gray-700 font-medium flex justify-between"
              >
                <span>{inv}</span>
                <button
                  onClick={() => toggleSelect(inv)}
                  className="text-red-500 hover:text-red-700 text-xs"
                >
                  {t("UnsharedInvoices.right_panel.remove")}
                </button>
              </div>
            ))
          )}
        </div>

        <button
          onClick={shareSelected}
          className="mt-5 px-4 py-3 text-white font-semibold rounded-md bg-[#58bc82] hover:bg-[#469a69]"
        >
         {t("UnsharedInvoices.right_panel.share_selected")}
        </button>
      </div>

      {popupMsg && (
        <Popup message={popupMsg} onClose={() => setPopupMsg("")} />
      )}
    </div>
  );
};

export default UnsharedInvoices;
