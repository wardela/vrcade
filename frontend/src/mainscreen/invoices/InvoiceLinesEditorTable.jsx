import React from "react";

const InvoiceLinesEditorTable = ({
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
}) => {
  return (
    <div className="w-full min-w-0 h-full overflow-x-auto overflow-y-auto">
      <div className="min-w-max">
        <table className="border-collapse text-xs table-auto">
          <thead className="text-gray-700 text-xs">
            <tr>
              <th className="sticky top-0 z-20 bg-gray-100 border p-2 text-center w-12 min-w-[48px]">
                {t("Invoices.items.exempt")}
              </th>
              <th className="sticky top-0 z-20 bg-gray-100 border p-2 text-center w-12 min-w-[48px]">
                #
              </th>
              <th className="sticky top-0 z-20 bg-gray-100 border p-2 text-center w-24 min-w-[96px]">
                {t("Invoices.items.item_id")}
              </th>
              <th className="sticky top-0 z-20 bg-gray-100 border p-2 text-start w-40 min-w-[160px]">
                {t("Invoices.items.name")}
              </th>
              <th className="sticky top-0 z-20 bg-gray-100 border p-2 text-start w-40 min-w-[160px]">
                {t("Invoices.items.item_notes")}
              </th>
              <th className="sticky top-0 z-20 bg-gray-100 border p-2 text-start w-28 min-w-[112px]">
                {t("Invoices.items.unit_price_incl")}
              </th>
              <th className="sticky top-0 z-20 bg-gray-100 border p-2 text-start w-20 min-w-[80px]">
                {t("Invoices.items.tax_percent")}
              </th>
              <th className="sticky top-0 z-20 bg-gray-100 border p-2 text-start w-28 min-w-[112px]">
                {t("Invoices.items.unit_price_excl")}
              </th>
              <th className="sticky top-0 z-20 bg-gray-100 border p-2 text-start w-20 min-w-[80px]">
                {t("Invoices.items.unit")}
              </th>
              <th className="sticky top-0 z-20 bg-gray-100 border p-2 text-start w-20 min-w-[80px]">
                {t("Invoices.items.qty")}
              </th>
              <th className="sticky top-0 z-20 bg-gray-100 border p-2 text-start w-40 min-w-[160px]">
                {t("Invoices.items.storage")}
              </th>

              {showDiscount && (
                <th className="sticky top-0 z-20 bg-gray-100 border p-2 text-start w-24 min-w-[96px]">
                  {t("Invoices.items.discount_percent")}
                </th>
              )}

              {showDiscount && (
                <th className="sticky top-0 z-20 bg-gray-100 border p-2 text-start w-28 min-w-[112px]">
                  {t("Invoices.items.discount_value")}
                </th>
              )}

              <th className="sticky top-0 z-20 bg-gray-100 border p-2 text-start w-32 min-w-[128px]">
                {t("Invoices.items.tax_value")}
              </th>
              <th className="sticky top-0 z-20 bg-gray-100 border p-2 text-start w-32 min-w-[128px]">
                {t("Invoices.items.total_incl")}
              </th>
              <th className="sticky top-0 z-20 bg-gray-100 border p-2 text-center w-12 min-w-[48px]">
                {t("Invoices.items.delete")}
              </th>
            </tr>
          </thead>

          <tbody>
            {invoiceItems.map((item, index) => {
              const priceIncl = Number(item.price) || 0;
              const taxPrc = Number(item.tax) || 0;
              const qty = Number(item.qty) || 0;
              const discVal = Number(item.discount_value) || 0;

              const priceExcl = priceIncl / (1 + taxPrc / 100);
              const totalIncl = qty * priceIncl - discVal;
              const discValExcl = discVal / (1 + taxPrc / 100);
              const totalExcl = qty * priceExcl - discValExcl;
              const taxVal = totalIncl - totalExcl;

              return (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="border p-2 text-center">
                    <input
                      type="checkbox"
                      checked={item.exempt || false}
                      disabled={!isEditable}
                      onChange={(e) => {
                        const wantExempt = e.target.checked;

                        if (
                          wantExempt &&
                          (clientDetailType !== "TN" || !clientDetailValue?.trim())
                        ) {
                          showPopup(t("Invoices.messages.exempt_requires_tax"));
                          return;
                        }

                        updateItem(index, "exempt", wantExempt);
                      }}
                    />
                  </td>

                  <td className="border p-2 text-center font-semibold text-gray-700">
                    {item.id}
                  </td>

                  <td className="border p-2">
                    <input
                      ref={(el) => {
                        cellRefs.current[index] ??= {};
                        cellRefs.current[index].item_id = el;
                      }}
                      type="number"
                      value={item.item_id || ""}
                      disabled={!isEditable}
                      className="w-full min-w-[96px] border rounded px-2 py-1 text-center"
                      onFocus={selectAllOnFocus}
                      onChange={(e) => {
                        const val = e.target.value;

                        setInvoiceItems((prev) => {
                          const copy = [...prev];
                          copy[index] = {
                            ...copy[index],
                            item_id: val ? Number(val) : null,
                            _isValidItem: false,
                          };
                          return copy;
                        });
                      }}
                      onBlur={() => {
                        setInvoiceItems((prev) => {
                          const copy = [...prev];
                          if (!copy[index]._isValidItem) {
                            copy[index] = {
                              ...copy[index],
                              item_id: null,
                              code: "",
                              desc: "",
                            };
                          }
                          return copy;
                        });
                      }}
                      onKeyDown={async (e) => {
                        if (e.key !== "Enter") return;

                        e.preventDefault();

                        if (!item.item_id) {
                          setItemModalRowIndex(index);
                          setShowItemModal(true);
                          return;
                        }

                        const ok = await handleItemIdLookup(index);

                        if (!ok) {
                          cellRefs.current[index]?.item_id?.focus();
                          return;
                        }

                        handleEnterNavigation(index, "item_id");
                      }}
                    />
                  </td>

                  <td className="border p-2">
                    <div className="px-2 py-1 text-sm text-gray-700 min-w-[160px]">
                      {item.desc}
                    </div>
                  </td>

                  <td className="border p-2">
                    <input
                      ref={(el) => {
                        cellRefs.current[index] ??= {};
                        cellRefs.current[index].notes = el;
                      }}
                      type="text"
                      value={item.notes || ""}
                      onChange={(e) => {
                        updateItem(index, "notes", e.target.value);
                        setNotesChanged(true);
                      }}
                      disabled={false}
                      className="w-full min-w-[160px] border rounded px-2 py-1"
                      onFocus={selectAllOnFocus}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (isEditable) {
                            handleEnterNavigation(index, "notes");
                          } else {
                            e.target.blur();
                          }
                        }
                      }}
                    />
                  </td>

                  <td className="border p-2">
                    <input
                      ref={(el) => {
                        cellRefs.current[index] ??= {};
                        cellRefs.current[index].price = el;
                      }}
                      type="text"
                      value={item._price_raw ?? item.price}
                      disabled={!isEditable}
                      className="w-full min-w-[112px] border rounded px-2 py-1"
                      onFocus={selectAllOnFocus}
                      onChange={(e) =>
                        handleCalcField(index, "price", e.target.value)
                      }
                      onBlur={() => commitCalcField(index, "price")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          commitCalcField(index, "price");
                          handleEnterNavigation(index, "price");
                        }
                      }}
                    />
                  </td>

                  <td className="border p-2">
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={taxPrc}
                      onChange={(e) =>
                        updateItem(index, "tax", parseFloat(e.target.value) || 0)
                      }
                      disabled={!isEditable || item.exempt}
                      className="w-full min-w-[80px] border rounded px-2 py-1"
                    />
                  </td>

                  <td className="border p-2">
                    <input
                      type="text"
                      value={item._price_excl_raw ?? fmt3(item.price_excl)}
                      disabled={!isEditable}
                      className="w-full min-w-[112px] border rounded px-2 py-1"
                      onFocus={selectAllOnFocus}
                      onChange={(e) =>
                        handleCalcField(index, "price_excl", e.target.value)
                      }
                      onBlur={() => commitCalcField(index, "price_excl")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          commitCalcField(index, "price_excl");
                          handleEnterNavigation(index, "price_excl");
                        }
                      }}
                    />
                  </td>

                  <td className="border p-2">
                    <div className="px-2 py-1 text-sm text-gray-700 min-w-[80px]">
                      {item.unit_name || "-"}
                    </div>
                  </td>

                  <td className="border p-2">
                    <input
                      ref={(el) => {
                        cellRefs.current[index] ??= {};
                        cellRefs.current[index].qty = el;
                      }}
                      type="text"
                      value={item._qty_raw ?? fmt3(item.qty)}
                      disabled={!isEditable}
                      className="w-full min-w-[80px] border rounded px-2 py-1"
                      onFocus={selectAllOnFocus}
                      onChange={(e) =>
                        handleCalcField(index, "qty", e.target.value)
                      }
                      onBlur={() => commitCalcField(index, "qty")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          commitCalcField(index, "qty");
                          handleEnterNavigation(index, "qty");
                        }
                      }}
                    />
                  </td>

                  <td className="border p-2">
                    <select
                      value={item.storage_id || ""}
                      onChange={(e) =>
                        updateItem(
                          index,
                          "storage_id",
                          e.target.value ? Number(e.target.value) : null
                        )
                      }
                      disabled={!isEditable || !item.is_stocked}
                      className={`w-full min-w-[160px] border rounded px-2 py-1 ${
                        !item.is_stocked
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      <option value="">{t("Invoices.items.select_storage")}</option>
                      {storages.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  {showDiscount && (
                    <td className="border p-2">
                      <input
                        ref={(el) => {
                          cellRefs.current[index] ??= {};
                          cellRefs.current[index].discount = el;
                        }}
                        type="number"
                        step="0.1"
                        value={item.discount}
                        onChange={(e) =>
                          updateItem(
                            index,
                            "discount",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        disabled={!isEditable}
                        className="w-full min-w-[96px] border rounded px-2 py-1"
                        onFocus={selectAllOnFocus}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleEnterNavigation(index, "discount");
                          }
                        }}
                      />
                    </td>
                  )}

                  {showDiscount && (
                    <td className="border p-2">
                      <input
                        type="text"
                        value={item._discount_value_raw ?? fmt3(item.discount_value)}
                        disabled={!isEditable}
                        className="w-full min-w-[112px] border rounded px-2 py-1"
                        onFocus={selectAllOnFocus}
                        onChange={(e) =>
                          handleCalcField(index, "discount_value", e.target.value)
                        }
                        onBlur={() => commitCalcField(index, "discount_value")}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            commitCalcField(index, "discount_value");
                            handleEnterNavigation(index, "discount_value");
                          }
                        }}
                      />
                    </td>
                  )}

                  <td className="border p-2 font-semibold text-gray-700 min-w-[128px]">
                    {taxVal.toFixed(3)}
                  </td>

                  <td className="border p-2 font-semibold text-gray-700 min-w-[128px]">
                    {totalIncl.toFixed(3)}
                  </td>

                  <td className="border p-2 text-center">
                    <button
                      type="button"
                      onClick={() => deleteLine(index)}
                      disabled={!isEditable}
                      title={t("Invoices.items.delete")}
                      className={`p-1 rounded transition ${
                        isEditable
                          ? "text-red-600 hover:bg-red-50 hover:text-red-700"
                          : "text-gray-300 cursor-not-allowed"
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21
                             c.342.052.682.107 1.022.166m-1.022-.165
                             L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077
                             H8.084a2.25 2.25 0 0 1-2.244-2.077
                             L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397
                             m-12 .562c.34-.059.68-.114 1.022-.165
                             m0 0a48.11 48.11 0 0 1 3.478-.397
                             m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201
                             a51.964 51.964 0 0 0-3.32 0
                             c-1.18.037-2.09 1.022-2.09 2.201v.916
                             m7.5 0a48.667 48.667 0 0 0-7.5 0"
                        />
                      </svg>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvoiceLinesEditorTable;