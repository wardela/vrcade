import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useReactToPrint } from "./usePortalReactToPrint";
import api from "./apiClient";
import { useTranslation } from "react-i18next";
import SalesRefundsCombinedByClientReportPrint from "./printables/SalesRefundsCombinedByClientReportPrint";

const PAGE_SIZE_DEFAULT = 100;
const fmt3 = (n) => Number(n || 0).toFixed(3);
const isNonZero = (n) => Math.abs(Number(n || 0)) > 0.0005;

const SalesRefundsCombinedByClientReport = forwardRef(
  ({ dateFrom, dateTo, company, selectedClient, pageSize = PAGE_SIZE_DEFAULT }, ref) => {
    const { t } = useTranslation();

    const [rows, setRows] = useState([]);
    const [offset, setOffset] = useState(0);
    const [loading, setLoading] = useState(false);
    const [totalSum, setTotalSum] = useState(0);
    const [totalCount, setTotalCount] = useState(0);

    const printRef = useRef();
    const [printRows, setPrintRows] = useState([]);
    const [pendingPrint, setPendingPrint] = useState(false);

    const canGoPrev = offset > 0;
    const canGoNext = offset + pageSize < totalCount;

    const showRefundCols = useMemo(() => {
      return (rows || []).some((r) => isNonZero(r?.refund_total));
    }, [rows]);

    const fetchPage = async (newOffset = 0) => {
      if (!dateFrom || !dateTo || !selectedClient?.id) return;

      try {
        setLoading(true);

        const res = await api.get(
          `/api/portal/reports/sales/sales-refunds-combined-by-client`,
          {
            params: {
              from: dateFrom,
              to: dateTo,
              client_id: selectedClient.id,
              limit: pageSize,
              offset: newOffset,
            },
          }
        );

        setRows(res.data.rows || []);
        setTotalSum(res.data.total_sum || 0);
        setTotalCount(res.data.total_count || 0);
        setOffset(newOffset);
      } catch (err) {
        console.error("Failed to fetch sales+refunds combined by client report", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchForPrint = async () => {
      if (!dateFrom || !dateTo || !selectedClient?.id) return;

      const res = await api.get(
        `/api/portal/reports/sales/sales-refunds-combined-by-client`,
        {
          params: {
            from: dateFrom,
            to: dateTo,
            client_id: selectedClient.id,
            limit: 1000000,
            offset: 0,
          },
        }
      );

      setPrintRows(res.data.rows || []);
      setTotalSum(res.data.total_sum || 0);
      setTotalCount(res.data.total_count || 0);
    };

    const handlePrint = useReactToPrint({
      content: () => printRef.current,
      documentTitle: "Sales & Refunds Combined By Client Report",
      pageStyle: `
        @page { size: A4; margin: 0 !important; }
        html, body { margin: 0 !important; padding: 0 !important; }
        * { box-sizing: border-box; }
      `,
    });

    useEffect(() => {
      if (pendingPrint && printRows.length > 0) {
        handlePrint();
        setPendingPrint(false);
      }
    }, [pendingPrint, printRows, handlePrint]);

    useImperativeHandle(ref, () => ({
      apply: () => fetchPage(0),
      print: async () => {
        await fetchForPrint();
        setPendingPrint(true);
      },
    }));

    return (
      <div className="border rounded-lg bg-white flex flex-col flex-1 min-h-0">
        <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto">
          <table className="min-w-[840px] w-full text-sm">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-start">{t("SalesReports.table.invoice")}</th>
                <th className="px-4 py-3 text-start">{t("SalesReports.table.date")}</th>
                <th className="px-4 py-3 text-end">{t("SalesReports.table.total")}</th>

                {showRefundCols && (
                  <>
                    <th className="px-4 py-3 text-start">
                      {t("RefundInvoices.builder.title") || "Refund Invoice #"}
                    </th>
                    <th className="px-4 py-3 text-end">
                      {t("RefundInvoices.footer.refund_total") || "Refund Total"}
                    </th>
                  </>
                )}

                <th className="px-4 py-3 text-end">
                  {t("ReceiptPreviewModal.totals.grand_total") || "Grand Total"}
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {loading && (
                <tr>
                  <td
                    colSpan={showRefundCols ? 7 : 5}
                    className="px-4 py-6 text-center text-gray-400"
                  >
                    {t("SalesReports.states.loading")}
                  </td>
                </tr>
              )}

              {!loading && rows.length === 0 && (
                <tr>
                  <td
                    colSpan={showRefundCols ? 7 : 5}
                    className="px-4 py-6 text-center text-gray-400"
                  >
                    {t("SalesReports.states.empty")}
                  </td>
                </tr>
              )}

              {!loading &&
                rows.map((r) => (
                  <tr key={r.invoice_number}>
                    <td className="px-4 py-2 font-medium">{r.invoice_number}</td>
                    <td className="px-4 py-2">{r.date}</td>
                    <td className="px-4 py-2 text-end font-medium">
                      {fmt3(r.invoice_total)}
                    </td>

                    {showRefundCols && (
                      <>
                        <td className="px-4 py-2">{r.refund_invoice_number || "-"}</td>
                        <td className="px-4 py-2 text-end">{fmt3(r.refund_total)}</td>
                      </>
                    )}

                    <td className="px-4 py-2 text-end font-semibold">
                      {fmt3(r.grand_total)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center px-4 py-3 border-t bg-gray-50">
          <span className="text-xs text-gray-500">
            {t("SalesReports.summary.showing")} {offset + 1}-
            {Math.min(offset + rows.length, totalCount)} / {totalCount}
          </span>

          <span className="text-sm font-semibold text-gray-700">
            {t("SalesReports.summary.total_sales")} : {fmt3(totalSum)}
          </span>

          <div className="flex gap-2">
            <button
              disabled={!canGoPrev || loading}
              onClick={() => fetchPage(offset - pageSize)}
              className="px-3 py-1 border rounded text-sm disabled:opacity-50"
            >
              {t("SalesReports.actions.previous")}
            </button>

            <button
              disabled={!canGoNext || loading}
              onClick={() => fetchPage(offset + pageSize)}
              className="px-3 py-1 border rounded text-sm disabled:opacity-50"
            >
              {t("SalesReports.actions.next")}
            </button>
          </div>
        </div>

        <div className="hidden">
          {company && selectedClient && (
            <SalesRefundsCombinedByClientReportPrint
              ref={printRef}
              rows={printRows}
              company={company}
              dateFrom={dateFrom}
              dateTo={dateTo}
              totalSum={totalSum}
              totalCount={totalCount}
              client={selectedClient}
            />
          )}
        </div>
      </div>
    );
  }
);

export default SalesRefundsCombinedByClientReport;
