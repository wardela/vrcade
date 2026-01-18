import React, { useState, useEffect, useRef } from "react";
import api from "../../utils/axiosInstance";

import Popup from "../../components/Popup";
import { useTranslation } from "react-i18next";
const ItemCard = ({
  isOpen,
  onSaved,
  onClose,
  onAdded,
  itemId,
  isEdit,
  canAddItem,
  canEditItem
}) => {
const isAddMode = !isEdit;
const isEditMode = isEdit;
const {t} = useTranslation();
const canSave =
  (isAddMode && canAddItem) ||
  (isEditMode && canEditItem);

const isReadOnly =
  (isAddMode && !canAddItem) ||
  (isEditMode && !canEditItem);

  const modalRef = useRef(null);

  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);

  // ID is auto-generated, just display placeholder
  const generatedId = "Auto-Generated";

  // Fields
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [category, setCategory] = useState("");
  const [unit, setUnit] = useState("");
  const [fav, setFav] = useState(false);

  const [minQty, setMinQty] = useState(0);
  const [usualQty, setUsualQty] = useState(1);
  const [usualDiscountPct, setUsualDiscountPct] = useState(0);
  const [notes, setNotes] = useState("");

  // Pricing
  const [priceIncl, setPriceIncl] = useState(0);
  const [taxPct, setTaxPct] = useState(16);
  const [priceExcl, setPriceExcl] = useState(0);
  const [priceSource, setPriceSource] = useState("incl"); 

  const [storages, setStorages] = useState([]);
  const [storageQty, setStorageQty] = useState([]); 
  const [isStocked, setIsStocked] = useState(true);
  const [defaultStorage, setDefaultStorage] = useState("");
  const [popupMessage, setPopupMessage] = useState(null);
  
  const showPopup = (message) => {
    setPopupMessage(message);
  };
  
  const closePopup = () => {
    setPopupMessage(null);
  };

const [fieldErrors, setFieldErrors] = useState({});
const storageError = fieldErrors.defaultStorage;

useEffect(() => {
  if (!isOpen) setFieldErrors({});
}, [isOpen]);


  useEffect(() => {
  if (isOpen) {
    api.get(`/api/invoices/storages`)
      .then(res => {
        setStorages(res.data);
        setStorageQty(res.data.map(s => ({
          storage_id: s.id,
          qty: 0
        })));
      });
  }
}, [isOpen]);

useEffect(() => {
  if (!isOpen) {
    // FULL RESET when modal closes
    setName("");
    setCode("");
    setCategory("");
    setUnit("");
    setFav(false);

    setMinQty(0);
    setUsualQty(1);
    setUsualDiscountPct(0);
    setNotes("");

    setPriceIncl(0);
    setPriceExcl(0);
    setTaxPct(16);
    setPriceSource("incl");

    setIsStocked(true);
    setStorageQty([]);
  }
}, [isOpen]);

useEffect(() => {
  if (isOpen && isEdit && itemId) {
    api.get(`/api/invoices/items/${itemId}`)
      .then(res => {
        const d = res.data;

        setName(d.name);
        setCode(d.code);
        setCategory(d.category);
        setUnit(d.unit);
        setFav(d.fav);

        setPriceIncl(Number(d.price_with_tax));
        setTaxPct(Number(d.tax_percentage));

        // Force correct EXCL calculation
        setPriceSource("incl");

        setMinQty(d.minimum_qty_alert);
        setUsualQty(d.usual_sales_qty);
        setUsualDiscountPct(d.usual_discount_percentage);
        setNotes(d.notes || "");
        setIsStocked(d.is_stocked ?? true);
        setDefaultStorage(d.default_storage_id || "");
      })
      .catch(() => showPopup(t("ItemCard.messages.load_failed")));
  }

  if (isOpen && !isEdit) {
    // RESET ALL FIELDS FOR ADD MODE
    setIsStocked(true);
    setName("");
    setCode("");
    setCategory("");
    setUnit("");
    setFav(false);
    setPriceIncl(0);
    setPriceExcl(0);
    setTaxPct(16);
    setMinQty(0);
    setUsualQty(1);
    setUsualDiscountPct(0);
    setNotes("");
    setDefaultStorage("");
  }
}, [isOpen, isEdit, itemId]);

  // Load categories + units
  useEffect(() => {
    if (isOpen) {
      api.get(`/api/invoices/categories`).then((res) => setCategories(res.data));
      api.get(`/api/invoices/units`).then((res) => setUnits(res.data));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Click outside to close
  useEffect(() => {
    function handleOutside(e) {
      if (modalRef.current && !modalRef.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const validateFields = () => {
  const errors = {};

  if (!name.trim()) errors.name = "Item name is required";
  if (!category) errors.category = "Category is required";
  if (!unit) errors.unit = "Unit is required";
  if (!priceIncl || Number(priceIncl) <= 0)
    errors.priceIncl = "Price must be greater than zero";

  if (isStocked && !defaultStorage)
    errors.defaultStorage = "Default storage is required for stocked items";

  setFieldErrors(errors);
  return Object.keys(errors).length === 0;
};

const saveItem = async () => {
  if (!canSave) return;

  const isValid = validateFields();
  if (!isValid) return;


  try {
    const payload = {
      name,
      code,
      category,
      unit,
      fav,
      price_with_tax: priceIncl,
      tax_percentage: taxPct,
      minimum_qty_alert: minQty,
      usual_sales_qty: usualQty,
      usual_discount_percentage: usualDiscountPct,
      notes,
      is_stocked: isStocked,
      default_storage_id: defaultStorage || null
    };

    if (!isEdit && isStocked) {
      payload.storages = storageQty.filter(s => s.qty > 0);
    }

if (isEdit) {
  await api.put(`/api/invoices/items/${itemId}`, payload);
  if (onSaved) await onSaved();
  onClose();
  return;
}

const res = await api.post(`/api/invoices/items`, payload);
if (onSaved) await onSaved();
onClose();

  } catch (err) {
    console.error("Error saving item:", err);
    showPopup(t("ItemCard.messages.save_failed"));
  }
};



useEffect(() => {
    const tax = taxPct / 100;

    if (priceSource === "incl") {
        const excl = priceIncl / (1 + tax);
        setPriceExcl(Number(excl.toFixed(3)));
    } 
}, [priceIncl, taxPct]);

useEffect(() => {
    const tax = taxPct / 100;

    if (priceSource === "excl") {
        const incl = priceExcl * (1 + tax);
        setPriceIncl(Number(incl.toFixed(3)));
    }
}, [priceExcl, taxPct]);


  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div
        ref={modalRef}
        className="bg-white w-[750px] max-h-[90vh] overflow-auto rounded-lg p-6 shadow-xl"
      >
        <h2 className="text-xl font-semibold mb-4 text-gray-700">
        {isEdit ? t("ItemCard.title_edit") : t("ItemCard.title_add")}
        </h2>

        {/* BASICS */}
        <div className="mb-4 border-b pb-4">
          <h3 className="text-md font-semibold text-gray-600 mb-2">{t("ItemCard.sections.basics")}</h3>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-gray-600">{t("ItemCard.fields.item_id")}</label>
              <input
                disabled
                value={generatedId}
                className="w-full border rounded px-3 py-2 bg-gray-100 text-gray-500"
              />
            </div>

            <div className="col-span-1">
              <label className="text-sm text-gray-600">{t("ItemCard.fields.name")}</label>
              <input
                className={`w-full border rounded px-3 py-2 ${
                  fieldErrors.name ? "border-red-500 ring-2 ring-red-200" : ""
                }`}
                disabled={isReadOnly}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setFieldErrors(prev => ({ ...prev, name: null }));
                }}
              />
              {fieldErrors.name && (
                <p className="text-xs text-red-600 mt-1">{fieldErrors.name}</p>
              )}
            </div>

            <div>
              <label className="text-sm text-gray-600">{t("ItemCard.fields.code")}</label>
              <input
                className="w-full border rounded px-3 py-2"
                  disabled={isReadOnly}
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* CATEGORY + UNIT */}
        <div className="mb-4 border-b pb-4">
          <h3 className="text-md font-semibold text-gray-600 mb-2">{t("ItemCard.sections.classification")}</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">{t("ItemCard.fields.category")}</label>
<select
  className={`w-full border rounded px-3 py-2 ${
    fieldErrors.category ? "border-red-500 ring-2 ring-red-200" : ""
  }`}
  value={category}
  disabled={isReadOnly}
  onChange={(e) => {
    setCategory(e.target.value);
    setFieldErrors(prev => ({ ...prev, category: null }));
  }}
>
{fieldErrors.category && (
  <p className="text-xs text-red-600 mt-1">{fieldErrors.category}</p>
)}
                <option value="">{t("ItemCard.actions.select")}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-600">{t("ItemCard.fields.unit")}</label>
              <select
                className={`w-full border rounded px-3 py-2 ${
                  fieldErrors.unit ? "border-red-500 ring-2 ring-red-200" : ""
                }`}
                value={unit}
                disabled={isReadOnly}
                onChange={(e) => {
                  setUnit(e.target.value);
                  setFieldErrors(prev => ({ ...prev, unit: null }));
                }}
              >
                              <option value="">{t("ItemCard.actions.select")}</option>
                              {units.map((u) => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                              ))}
                            </select>
                            {fieldErrors.unit && (
                <p className="text-xs text-red-600 mt-1">{fieldErrors.unit}</p>
              )}
            </div>
          </div>
        </div>

        {/* FINANCIALS */}
        <div className="mb-4 border-b pb-4">
          <h3 className="text-md font-semibold text-gray-600 mb-2">{t("ItemCard.sections.financials")}</h3>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-gray-600">{t("ItemCard.fields.price_incl")}</label>
              <input
                type="number"
                className={`w-full border rounded px-3 py-2 ${
                  fieldErrors.priceIncl ? "border-red-500 ring-2 ring-red-200" : ""
                }`}
                value={priceIncl}
                disabled={isReadOnly}
                onChange={(e) => {
                  setPriceSource("incl");
                  setPriceIncl(Number(e.target.value));
                  setFieldErrors(prev => ({ ...prev, priceIncl: null }));
                }}
              />
              {fieldErrors.priceIncl && (
                <p className="text-xs text-red-600 mt-1">{fieldErrors.priceIncl}</p>
              )}
            </div>

            <div>
              <label className="text-sm text-gray-600">{t("ItemCard.fields.tax_pct")}</label>
              <input
                type="number"
                className="w-full border rounded px-3 py-2"
                value={taxPct}
                  disabled={isReadOnly}
                onChange={(e) => {
                    setPriceSource("incl"); // tax recalcs from incl as the primary value
                    setTaxPct(Number(e.target.value));
                }}
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">{t("ItemCard.fields.price_excl")}</label>
              <input
                type="number"
                className="w-full border rounded px-3 py-2"
                value={priceExcl}  
                disabled={isReadOnly}
                onChange={(e) => {
                    setPriceSource("excl");
                    setPriceExcl(Number(e.target.value));
                }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border rounded-lg p-4 bg-white mb-2">
          <div>
            <p className="text-sm font-medium text-gray-700">
              {t("ItemCard.fields.stock_managed")}
            </p>
            <p className="text-xs text-gray-500">
              {t("ItemCard.fields.stock_hint")}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsStocked(!isStocked)}
              disabled={isReadOnly}
              dir="ltr"
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition 
              ${isStocked ? "bg-[#2f788a]" : "bg-gray-300"}
            `}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition
                ${isStocked ? "translate-x-6" : "translate-x-1"}
              `}
            />
          </button>
        </div>

        {!isEdit && isStocked && (
  <div className="mb-4 border-b pb-4">
    <h3 className="text-md font-semibold text-gray-600 mb-2">
      {t("ItemCard.sections.initial_stock")}
    </h3>

    <div className="grid grid-cols-2 gap-4">
      {storages.map((s, idx) => (
        <div key={s.id} className="flex gap-2 items-center">
          <span className="w-1/2 text-sm text-gray-700">
            {s.name}
          </span>
          <input
            type="number"
            className="w-1/2 border rounded px-2 py-1"
            value={storageQty[idx]?.qty || 0}
              disabled={isReadOnly}
            onChange={(e) => {
              const copy = [...storageQty];
              copy[idx].qty = Number(e.target.value);
              setStorageQty(copy);
            }}
          />
        </div>
      ))}
    </div>
  </div>
)}

{isStocked && (
  <div className="mb-4 border-b pb-4">
    <div className="border rounded-xl p-5 bg-gray-50">

      {/* Section Header */}
      <h3 className="text-sm font-semibold text-gray-700 mb-5">
        {t("ItemCard.sections.stock_controls")}
      </h3>

      {/* Controls Grid */}
      <div className="grid grid-cols-2 gap-5">

        {/* Minimum Quantity Alert */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            {t("ItemCard.fields.min_qty")}
          </label>
          <input
            type="number"
            value={minQty}
              disabled={isReadOnly}
            onChange={(e) => setMinQty(Number(e.target.value))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm
                       focus:ring-2 focus:ring-[#2f788a] focus:outline-none"
          />
          <p className="mt-1 text-[11px] text-gray-400">
            {t("ItemCard.fields.min_qty_hint")}
          </p>
        </div>

        {/* Default Storage */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            {t("ItemCard.fields.default_storage")}
          </label>
          <select
            value={defaultStorage}
            onChange={(e) => {
              setDefaultStorage(e.target.value);
              setStorageError(false);
            }}
            disabled={isReadOnly}
            className={`
              w-full rounded-md px-3 py-2 text-sm bg-white
              border transition
              ${
                storageError
                  ? "border-red-500 ring-2 ring-red-200"
                  : "border-gray-300 focus:ring-2 focus:ring-[#2f788a]"
              }
            `}
          >
            <option value="">{t("ItemCard.actions.select_storage")}</option>
            {storages.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          {storageError && (
            <p className="mt-2 text-xs text-red-600">
              {t("ItemCard.errors.default_storage_required")}
            </p>
          )}
          <p className="mt-1 text-[11px] text-gray-400">
            {t("ItemCard.fields.default_storage_hint")}
          </p>
        </div>

      </div>
    </div>
  </div>
)}

        {/* USUALS */}
        <div className="mb-2 border-b pb-4">
          <h3 className="text-md font-semibold text-gray-600 mb-2">{t("ItemCard.sections.standard_settings")}</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">{t("ItemCard.fields.standard_discount")}</label>
              <input
                type="number"
                className="w-full border rounded px-3 py-2"
                value={usualDiscountPct}
                  disabled={isReadOnly}
                onChange={(e) => setUsualDiscountPct(Number(e.target.value))}
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">{t("ItemCard.fields.standard_qty")}</label>
              <input
                type="number"
                className="w-full border rounded px-3 py-2"
                value={usualQty}
                  disabled={isReadOnly}
                onChange={(e) => setUsualQty(Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        {/* STOCK + FAV */}
                       
<div className=" flex items-center gap-3 mb-2 border-b pb-2">

  {/* Star toggle icon */}
  <button
    onClick={() => setFav(!fav)}
      disabled={isReadOnly}
    className="flex justify-center items-center p-1.5 rounded-md hover:bg-gray-100 transition"
  >
    {fav ? (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="#2f788a"
        className="w-6 h-6 drop-shadow-sm"
      >
        <path
          fillRule="evenodd"
          d="M10.788 3.21c.448-1.077 1.976-1.077 
             2.424 0l2.082 5.006 5.404.434c1.164.093 
             1.636 1.545.749 2.305l-4.117 3.527 
             1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 
             18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425
             l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305
             l5.404-.434 2.082-5.005Z"
          clipRule="evenodd"
        />
      </svg>
    ) : (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.8"
        stroke="#9aa0a6"
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 
             5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04 
             .701.663.321.988l-4.204 3.602a.563.563 0 0 
             0-.182.557l1.285 5.385a.562.562 0 0 
             1-.84.61l-4.725-2.885a.562.562 0 0 
             0-.586 0L6.982 20.54a.562.562 0 0 
             1-.84-.61l1.285-5.386a.562.562 0 0 
             0-.182-.557l-4.204-3.602a.562.562 0 0 
             1 .321-.988l5.518-.442a.563.563 0 0 
             0 .475-.345L11.48 3.5Z"
        />
      </svg>
    )}
  </button>

  {/* Label */}
  <span className="text-gray-700 text-sm">{t("ItemCard.fields.favorite")}</span>
</div>
        {/* NOTES */}
        <div className="mb-4">
          <h3 className="text-md font-semibold text-gray-600 mb-2">{t("ItemCard.sections.notes")}</h3>
          <textarea
            className="w-full border rounded px-3 py-2 min-h-[80px]"
            value={notes}
              disabled={isReadOnly}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* BUTTON */}
        <div className="flex justify-end">
        {canSave && (
          <button
            onClick={saveItem}
            className="px-5 py-2 bg-[#2f788a] text-white rounded hover:bg-[#276472]"
          >
            {isEditMode ? t("ItemCard.actions.save_changes") : t("ItemCard.actions.save")}
          </button>
        )}
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

export default ItemCard;
