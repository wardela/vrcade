import React, { useEffect } from "react";
import InvoiceLinesEditorTable from "./InvoiceLinesEditorTable";

const InvoiceLinesModal = ({
  open,
  onClose,
  t,
  invoiceItems,
  showDiscount,
  isEditable,
  clientDetailType,
  clientDetailValue,
  storages,
  cellRefs,
  selectAllOnFocus,
  fmt3,
  updateItem,
  setInvoiceItems,
  handleItemIdLookup,
  handleEnterNavigation,
  setItemModalRowIndex,
  setShowItemModal,
  handleCalcField,
  commitCalcField,
  deleteLine,
  showPopup,
  notesChanged,
  setNotesChanged,
  addEmptyLine,
  totalBeforeTax,
  totalTax,
  grandTotal,
}) => {
  useEffect(() => {
    if (!open) return;

    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        onClick={onClose}
      />

      <div className="relative z-10 w-[97vw] max-w-[1800px] h-[92vh] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden min-w-0">
        <div className="flex items-center justify-between px-5 py-4 border-b bg-gray-50">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              {t("Invoices.items.expanded_editor_title", "Invoice Lines")}
            </h3>
            <p className="text-sm text-gray-500">
              {t(
                "Invoices.items.expanded_editor_subtitle",
                "Any change here updates the invoice immediately."
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isEditable && (
              <button
                onClick={addEmptyLine}
                className="px-4 py-2 text-sm rounded-lg border border-[#2f788a] text-[#2f788a] hover:bg-[#2f788a]/10 transition"
              >
                {t("Invoices.add_empty_line")}
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg bg-[#2f788a] text-white hover:bg-[#276472] transition"
            >
              {t("Invoices.actions.close", "Close")}
            </button>
          </div>
        </div>

<div className="flex-1 min-h-0 min-w-0 p-4 overflow-hidden">
  <div className="h-full w-full min-w-0 rounded-xl border border-gray-200 overflow-hidden bg-white">
            <InvoiceLinesEditorTable
              t={t}
              invoiceItems={invoiceItems}
              showDiscount={showDiscount}
              isEditable={isEditable}
              clientDetailType={clientDetailType}
              clientDetailValue={clientDetailValue}
              storages={storages}
              cellRefs={cellRefs}
              selectAllOnFocus={selectAllOnFocus}
              fmt3={fmt3}
              updateItem={updateItem}
              setInvoiceItems={setInvoiceItems}
              handleItemIdLookup={handleItemIdLookup}
              handleEnterNavigation={handleEnterNavigation}
              setItemModalRowIndex={setItemModalRowIndex}
              setShowItemModal={setShowItemModal}
              handleCalcField={handleCalcField}
              commitCalcField={commitCalcField}
              deleteLine={deleteLine}
              showPopup={showPopup}
              notesChanged={notesChanged}
              setNotesChanged={setNotesChanged}
            />
          </div>
        </div>

        <div className="border-t bg-gray-50 px-5 py-4">
          <div className="flex justify-end">
            <div className="w-full max-w-sm text-sm">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">
                  {t("Invoices.totals.total_before_tax")}
                </span>
                <span className="font-semibold text-gray-800">
                  JD {fmt3(totalBeforeTax)}
                </span>
              </div>

              <div className="flex justify-between mb-2">
                <span className="text-gray-600">
                  {t("Invoices.totals.total_tax")}
                </span>
                <span className="font-semibold text-gray-800">
                  JD {fmt3(totalTax)}
                </span>
              </div>

              <div className="flex justify-between border-t pt-2 text-lg font-bold text-[#2f788a]">
                <span>{t("Invoices.totals.grand_total")}</span>
                <span>JD {fmt3(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceLinesModal;