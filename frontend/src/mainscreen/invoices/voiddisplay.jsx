import React, { useState } from "react";
import api from "../../utils/axiosInstance";
import { useReactToPrint } from "@/utils/useAppReactToPrint";
import PrintableVoidInvoice from "./PrintableVoidInvoice";
import Popup from "../../components/Popup";

const VoidedLog = () => {
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [voidedList, setVoidedList] = useState([]);
  const [search, setSearch] = useState("");
  const [popupMsg, setPopupMsg] = useState("");

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
    if (selectedDate) fetchVoided();
  }, [selectedDate]);

  const fetchVoided = async () => {
    try {
      setLoading(true);
      const res = await api.get(
        `/api/invoices/voided-by-date?date=${selectedDate}`
      );
      setVoidedList(res.data);
    } catch (err) {
      console.error(err);
      setPopupMsg("Failed to fetch voided invoices");
    } finally {
      setLoading(false);
    }
  };

  const filtered = voidedList.filter((v) =>
    v.original_invoice_number.toLowerCase().includes(search.toLowerCase())
  );

  const totalVoided = filtered.reduce(
    (acc, v) => acc + Number(v.total || 0),
    0
  );

  const printRef = React.useRef();
  const [printData, setPrintData] = useState(null);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
  });

  const printInvoice = async (v) => {
    try {
      const res = await api.get(
        `/api/invoices/return-full/${v.original_invoice_number}`
      );

      const full = res.data;

      setPrintData({
        header: full.header,
        lines: full.lines,
        qr: v.qrcode_response || "",
        returnInvoiceNumber: v.return_invoice_number,
        voidedAt: v.voided_at,
      });

      setTimeout(handlePrint, 200);
    } catch (err) {
      console.error("Error fetching original invoice for void:", err);
      setPopupMsg("Failed to load invoice for print");
    }
  };

  return (
    <div className="flex w-full h-screen bg-base-200 p-6">
      <div className="w-full bg-white rounded-xl p-6 shadow flex flex-col">
        <h2 className="text-2xl font-bold text-gray-700 mb-6">
          Voided Invoices Log
        </h2>

        <div className="flex gap-4 items-end mb-4">
          <div className="flex flex-col">
            <label className="text-gray-500 mb-1 text-sm">Select Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border p-2 rounded-md text-gray-700"
            />
          </div>

          <div className="flex-grow">
            <label className="text-gray-500 mb-1 text-sm">Search</label>
            <input
              type="text"
              placeholder="Search by invoice number"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border p-2 rounded-md w-full text-gray-700"
            />
          </div>

          <button
            onClick={fetchVoided}
            className="px-5 py-2 bg-[#2f788a] text-white rounded-lg hover:bg-[#276472]"
          >
            Load
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && (
            <p className="text-center text-gray-600 font-semibold">Loading…</p>
          )}

          {!loading && filtered.length > 0 && (
            <table className="w-full border-collapse text-sm bg-white shadow rounded overflow-hidden">
              <thead className="bg-gray-100 border-b text-gray-600">
                <tr>
                  <th className="p-2 border">Return #</th>
                  <th className="p-2 border">Original Invoice #</th>
                  <th className="p-2 border">POS</th>
                  <th className="p-2 border">Original Date</th>
                  <th className="p-2 border">Voided At</th>
                  <th className="p-2 border">Total</th>
                  <th className="p-2 border">Action</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((v) => (
                  <tr key={v.id} className="hover:bg-[#f1f8fa]">
                    <td className="p-2 border">{v.return_invoice_number}</td>
                    <td className="p-2 border">{v.original_invoice_number}</td>
                    <td className="p-2 border">{v.pos}</td>
                    <td className="p-2 border">{v.original_date}</td>
                    <td className="p-2 border">{v.voided_at}</td>
                    <td className="p-2 border">
                      JD {Number(v.total).toFixed(3)}
                    </td>
                    <td className="p-2 border">
                      <button
                        onClick={() => printInvoice(v)}
                        className="px-3 py-1 bg-[#58bc82] text-white rounded hover:bg-[#469a69]"
                      >
                        Print
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && filtered.length === 0 && selectedDate && (
            <p className="text-center text-gray-400 mt-6">
              No voided invoices.
            </p>
          )}
        </div>
        <div className="mt-4 border-t pt-4 text-right text-lg font-bold text-gray-700">
          Total Voided: JD {totalVoided.toFixed(3)}
        </div>
      </div>

      <div className="hidden">
        {printData && (
          <PrintableVoidInvoice
            ref={printRef}
            originalHeader={printData.header}
            invoiceItems={printData.lines}
            qr={printData.qr}
            returnInvoiceNumber={printData.returnInvoiceNumber}
            voidedAt={printData.voidedAt}
          />
        )}
      </div>

      {popupMsg && (
        <Popup message={popupMsg} onClose={() => setPopupMsg("")} />
      )}
    </div>
  );
};

export default VoidedLog;
