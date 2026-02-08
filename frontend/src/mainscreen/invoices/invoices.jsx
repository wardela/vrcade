import React, { useState, useEffect, useRef } from "react";
import api from "../../utils/axiosInstance";
import { useReactToPrint } from "react-to-print";
import PrintableInvoice from "./PrintableInvoice";
import ClientList from "./clientlist";
import SelectItemModal from "./SelectItemModal";
import CalculatorPopup from "./calculator";
import ShareConfirmationPopup from "./shareconfirmationpopup";
import InvoiceFilterPopup from "./InvoiceFilterPopup";
import Popup from "../../components/Popup"
import { useTranslation } from "react-i18next";
const Invoices = () => {
  const [isNewInvoice, setIsNewInvoice] = useState(false);
  const [fetchedInvoices, setFetchedInvoices] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
const [isSearching, setIsSearching] = useState(false);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [type2, setType2] = useState("local");
const [clientDetailType, setClientDetailType] = useState("TN");
const [currency, setCurrency] = useState("JOD");
const [clientPhone, setClientPhone] = useState("");
const [clientDetailValue, setClientDetailValue] = useState("");
const [showClientPopup, setShowClientPopup] = useState(false);
const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(true);
const [showItemModal, setShowItemModal] = useState(false);
const [storages, setStorages] = useState([]);
const [itemModalRowIndex, setItemModalRowIndex] = useState(null);
const [showCalculator, setShowCalculator] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showShareConfirm, setShowShareConfirm] = useState(false);
const [pendingShareInvoiceNo, setPendingShareInvoiceNo] = useState(null);
const [showInvoiceFilter, setShowInvoiceFilter] = useState(false);
const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
const [popupMessage, setPopupMessage] = useState(null);
const [notesChanged, setNotesChanged] = useState(false);
const [showDiscount, setShowDiscount] = useState(true);
const [createDueBalance, setCreateDueBalance] = useState(true);
const [reference, setReference] = useState("");

const {t} = useTranslation();
const round3 = (num) => Math.round(num * 1000) / 1000;

// DISPLAY ONLY
const fmt3 = (num) =>
  num === null || num === undefined || Number.isNaN(num)
    ? ""
    : Number(num).toFixed(3);

const showPopup = (message) => {
  setPopupMessage(message);
};

const closePopup = () => {
  setPopupMessage(null);
};

useEffect(() => {
  if (window.innerWidth < 1600) {
    setIsSidebarCollapsed(true);
  }
}, []);

const [company, setCompany] = useState(null);

useEffect(() => {
  api.get(`/api/invoices/company`).then(res => {
    setCompany(res.data);
  });
}, []);

// ✅ Permissions (Sales module controls invoice add/edit/save)
let permissions = {};
try {
  const raw = localStorage.getItem("permissions");
  permissions = raw ? JSON.parse(raw) : {};
} catch {
  permissions = {};
}

const salesPerm = permissions?.sales || {};
const canAddInvoice = salesPerm?.add === true;
const canEditInvoice = salesPerm?.edit === true;

const einvPerm = permissions?.einvoicing || {};
const canShareInvoice = einvPerm?.view === true;

// you will already block the route if view=false, but keep this for safety:
const canViewInvoice = salesPerm?.view === true;

// A user can "save" only if:
// - new invoice + has add
// - existing invoice + has edit
const canSaveNew = canAddInvoice;
const canSaveExisting = canEditInvoice;


const isLocked = Boolean(
  selectedInvoice &&
  !selectedInvoice.isNew &&
  (selectedInvoice.has_refund || selectedInvoice.qr !== "123456789")
);

useEffect(() => {
  // ✅ Only auto-create a new invoice if the user has "Add"
  if (!selectedInvoice && canAddInvoice) {
    initNewInvoice();
  }
  // If no add permission, screen starts with no invoice selected (view-only until they click one)
}, []);

const ENTER_FLOW = showDiscount
  ? ["item_id", "notes", "price", "qty", "discount"]
  : ["item_id", "notes", "price", "qty"];

const cellRefs = useRef([]);

  const dedupeInvoices = (arr) => {
  const map = new Map();
  arr.forEach((inv) => map.set(inv.invoice_number, inv));
  return Array.from(map.values());
};

  const getLocalDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
};

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/invoices?limit=100&offset=${offset}`);
      setFetchedInvoices((prev) => dedupeInvoices([...prev, ...res.data]));
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [offset]);

  const loadMore = () => setOffset((prev) => prev + 100);

  useEffect(() => {
  api.get(`/api/invoices/storages`)
    .then(res => setStorages(res.data))
    .catch(console.error);
}, []);



  const [clientName, setClientName] = useState("");
const [invoiceDate, setInvoiceDate] = useState(getLocalDate());
const [paymentType, setPaymentType] = useState("credit");
const [invoiceNumber, setInvoiceNumber] = useState("");
const isExistingInvoice = Boolean(selectedInvoice && !selectedInvoice?.isNew && !isNewInvoice);
const isNewMode = Boolean(isNewInvoice || selectedInvoice?.isNew);

const canSaveThisInvoice =
  !isLocked &&
  (isNewMode ? canSaveNew : canSaveExisting);

const isEditable = canSaveThisInvoice;

useEffect(() => {
  // Only auto-toggle in NEW invoice mode
  if (!isNewMode) return;

  if (paymentType === "credit") {
    setCreateDueBalance(true);
  } else if (paymentType === "cash") {
    setCreateDueBalance(false);
  }
}, [paymentType, isNewMode]);


const [notes, setNotes] = useState("");
const [invoiceItems, setInvoiceItems] = useState([
  {
    id: 1,
    item_id: null,
    code: "",
    desc: "",
    notes: "",
    price: 0,
    price_excl: 0,
    tax: 0,
    qty: 1,
    discount: 0,
    discount_value: 0,
    unit_number: null,
    unit_name: "",
    storage_id: null,
    exempt: false,

    _isValidItem: false, // ✅ ADD THIS
  },
]);

const updateItem = (index, field, value) => {
  const updated = [...invoiceItems];
  const item = updated[index];

  item.unit_name = item.unit_name ?? "";
  item.unit_number = item.unit_number ?? null;

  const qty = Number(item.qty) || 0;
  const tax = Number(item.tax) || 0;
  const priceIncl = Number(item.price) || 0;

  if (field === "discount") {
    const discPrc = Number(value) || 0;
    item.discount = discPrc;
    item.discount_value = priceIncl * qty * (discPrc / 100);
  }

  else if (field === "discount_value") {
    const discVal = Number(value) || 0;
    item.discount_value = discVal;
    item.discount =
      priceIncl === 0 || qty === 0
        ? 0
        : (discVal / (priceIncl * qty)) * 100;
  }

  else if (field === "price") {
    const priceInclNew = Number(value) || 0;
    item.price = priceInclNew;
    item.price_excl = priceInclNew / (1 + tax / 100);
    item.discount_value = priceInclNew * qty * (item.discount / 100);
  }

  else if (field === "price_excl") {
    const priceExcl = Number(value) || 0;
item.price_excl = priceExcl;
item.price = priceExcl * (1 + tax / 100);
item.discount_value = item.price * qty * (item.discount / 100);
  }

  else if (field === "qty") {
    const newQty = Number(value) || 0;
    item.qty = newQty;
    item.discount_value = priceIncl * newQty * (item.discount / 100);
  }

  else if (field === "exempt") {
    const isExempt = Boolean(value);
    item.exempt = isExempt;

    if (isExempt) {
      item.tax = 0;
      const priceInclNow = Number(item.price) || 0;
item.price_excl = priceInclNow;
item.discount_value = priceInclNow * qty * (item.discount / 100);
    }
  }

  else if (field === "tax") {
    const newTax = Number(value) || 0;
item.tax = newTax;
const priceInclNow = Number(item.price) || 0;
item.price_excl = priceInclNow / (1 + newTax / 100);
item.discount_value = priceInclNow * qty * (item.discount / 100);
  }

  else {
    item[field] = value;
  }

  setInvoiceItems(updated);
};


// Since price includes tax, remove the tax portion before summing
const totalBeforeTax = invoiceItems.reduce((sum, item) => {
  const priceExTax = item.price / (1 + item.tax / 100);
  return sum + item.qty * priceExTax * (1 - item.discount / 100);
}, 0);

const totalTax = invoiceItems.reduce((sum, item) => {
  const priceExTax = item.price / (1 + item.tax / 100);
  return sum + item.qty * priceExTax * (item.tax / 100) * (1 - item.discount / 100);
}, 0);

const grandTotal = totalBeforeTax + totalTax;


  const handleInvoiceClick = async (inv) => {
    if (window.innerWidth < 1600) {
  setIsSidebarCollapsed(true);
}

  try {
    setIsNewInvoice(false);
    setSelectedInvoice(inv);
    const res = await api.get(`/api/invoices/full/${inv.invoice_number}`);
    const data = res.data;

    // Fill header fields
    setInvoiceNumber(data.header.invoice_number);
    setClientName(data.header.client || "");
    setInvoiceDate(data.header.date);
    setPaymentType(data.header.type);
    setNotes(data.header.notes || "");
    setReference(data.header.reference || "");
    // NEW FIELDS
    setType2(data.header.type2 || "local");
    setCurrency(data.header.currency || "JOD");
    setClientPhone(data.header.client_contact || "");
    setClientDetailType(data.header.client_det_code || "TN");
    setClientDetailValue(data.header.client_detail || "");
    setSelectedInvoice((prev) => ({
      ...prev,
      client_id: data.header.client_id || null,
    }));

    // Map invoice lines to your frontend structure
const formattedItems = data.lines.map((line) => {
  const priceIncl = Number(line.item_price || 0);
  const taxRate = Number(line.tax || 0) / 100;
  const QTY = Number(line.qty);
  const discountPercentage = Number(line.discount_percentage || 0);
  const discountValue = priceIncl * discountPercentage * QTY;

  return {
    id: line.item_number,
    item_id: line.item_id || null,
    desc: line.description || "",
    qty: QTY,
    price: priceIncl,
    price_excl: round3(priceIncl / (1 + taxRate)),
    discount: round3(discountPercentage * 100),
    discount_value: discountValue,
    tax: round3(Number(line.tax || 0)),
    notes: line.notes || "",
    code: line.item_code || "",
    unit_number: line.item_unit_id || line.unit_number || null,
    unit_name: line.unit_name || "",
    storage_id: line.storage_id || null,
    is_stocked: Boolean(line.is_stocked),
    exempt: line.exempt || false,
    _isValidItem: true,
  };
});

    setInvoiceItems(formattedItems);
    setQrCode(data.header.qr || "");
  } catch (error) {
    console.error("Error fetching full invoice:", error);

  }
};
useEffect(() => {
  // Reset notes changed flag when a different invoice is selected
  setNotesChanged(false);
}, [selectedInvoice?.invoice_number]);

const handleItemIdLookup = async (rowIndex) => {
  const row = invoiceItems[rowIndex];

  // ❌ Block if empty
  if (!row?.item_id) {
    showPopup(t("Invoices.messages.item_required"));
    return false;
  }

  try {
    const res = await api.get(
      `/api/invoices/items/${row.item_id}`
    );

    const item = res.data;
    if (!item) {
      showPopup(t("Invoices.messages.item_not_found"));
      return false;
    }

    setInvoiceItems((prev) =>
      prev.map((r, i) => {
        if (i !== rowIndex) return r;

        const qty = Number(item.usual_sales_qty || 1);
        const tax = Number(item.tax_percentage || 0);
        const priceIncl = Number(item.price_with_tax || 0);
        const discPrc = Number(item.usual_discount_percentage || 0);

return {
  ...r,
  item_id: item.id,
  code: item.code,
  desc: item.name,
  notes: item.notes || "",

  // 🔥 FULL PRECISION — NO ROUNDING
  price: Number(item.price_with_tax || 0),
  tax: Number(item.tax_percentage || 0),
  qty: Number(item.usual_sales_qty || 1),
  discount: Number(item.usual_discount_percentage || 0),

  unit_number: item.unit,
  unit_name: item.unit_name ?? "",
  exempt: false,
  storage_id: item.is_stocked ? item.default_storage_id || null : null,

  // 🔥 DERIVED VALUES — STILL NO ROUNDING
  price_excl:
    Number(item.price_with_tax || 0) /
    (1 + Number(item.tax_percentage || 0) / 100),

  discount_value:
    Number(item.price_with_tax || 0) *
    Number(item.usual_sales_qty || 1) *
    (Number(item.usual_discount_percentage || 0) / 100),

  _isValidItem: true,
  is_stocked: Boolean(item.is_stocked),
};

      })
    );

    return true; // ✅ VALID ITEM
  } catch (err) {
    showPopup(t("Invoices.messages.item_not_found"));
    return false;
  }
};


const handleSearch = async () => {
  try {
    setLoading(true);
    setIsSearching(true);
    setOffset(0); // reset offset
    const res = await api.get(
      `/api/invoices/search?q=${encodeURIComponent(searchQuery)}&limit=100&offset=0`
    );
    setFetchedInvoices(dedupeInvoices(res.data));
  } catch (error) {
    console.error("Error searching invoices:", error);
    showPopup(t("Invoices.messages.failed_search"));
  } finally {
    setLoading(false);
  }
};

const handleSearchLoadMore = async () => {
  try {
    const nextOffset = offset + 100;
    setLoading(true);
    const res = await api.get(
      `/api/invoices/search?q=${encodeURIComponent(searchQuery)}&limit=100&offset=${nextOffset}`
    );
    setFetchedInvoices((prev) => [...prev, ...res.data]);
    setOffset(nextOffset);
  } catch (error) {
    console.error("Error loading more search results:", error);
  } finally {
    setLoading(false);
  }
};

const deleteLine = (index) => {
  setInvoiceItems(prev =>
    prev
      .filter((_, i) => i !== index)
      .map((item, i) => ({
        ...item,
        id: i + 1 // re-number lines
      }))
  );
};

useEffect(() => {
  // If client detail is no longer valid for exemption
  const invalidForExempt =
    clientDetailType !== "TN" || !clientDetailValue?.trim();

  if (!invalidForExempt) return;

  // Auto-clear exempt items
  setInvoiceItems((prev) =>
    prev.map((item) =>
      item.exempt
        ? { ...item, exempt: false }
        : item
    )
  );
}, [clientDetailType, clientDetailValue]);

const handleItemSelected = (item) => {
const qty = Number(item.usual_sales_qty || 1);
const price = Number(item.price_with_tax || 0);
const tax = Number(item.tax_percentage || 0);
const discount = Number(item.usual_discount_percentage || 0);

  setInvoiceItems(prev => {
    // Fill existing row
    if (itemModalRowIndex !== null) {
      const updated = [...prev];
      updated[itemModalRowIndex] = {
        ...updated[itemModalRowIndex],
        item_id: item.id,
        code: item.code,
        desc: item.name,
        notes: item.notes || "",
        price,
        tax,
        qty,
        discount,
        unit_number: item.unit,
        unit_name: item.unit_name ?? "",
        exempt: false,
        storage_id: item.is_stocked ? item.default_storage_id || null : null,
        price_excl: round3(price / (1 + tax / 100)),
        discount_value: round3(price * qty * (discount / 100)),
        is_stocked: Boolean(item.is_stocked),
        _isValidItem: true,
      };
      return updated;
    }

    // Add new item
    return [
      ...prev,
      {
        id: prev.length + 1,
        item_id: item.id,
        code: item.code,
        desc: item.name,
        notes: item.notes || "",
        price,
        tax,
        qty,
        discount,
        unit_number: item.unit,
        unit_name: item.unit_name ?? "",
        exempt: false,
        price_excl: round3(price / (1 + tax / 100)),
        discount_value: round3(price * qty * (discount / 100)),
        storage_id: item.default_storage_id || null,
        _isValidItem: true,
      }
    ];
  });

  setShowItemModal(false);
  setItemModalRowIndex(null);

  requestAnimationFrame(() => {
    cellRefs.current[itemModalRowIndex]?.notes?.focus();
  });
};

const addEmptyLine = () => {
  if (!isEditable) return;

  setInvoiceItems(prev => [
    ...prev,
   {
  id: prev.length + 1,
  item_id: null,
  code: "",
  desc: "",
  notes: "",
  price: 0,
  price_excl: 0,
  tax: 0,
  qty: 1,
  discount: 0,
  discount_value: 0,
  unit_number: null,
  unit_name: "",
  storage_id: null,
  exempt: false,
  is_stocked: false,

  _isValidItem: false, // ✅
}
  ]);
};

const handleEnterNavigation = async (rowIndex, field) => {
  const colIndex = ENTER_FLOW.indexOf(field);
  if (colIndex === -1) return;

  // Next field in same row
  if (colIndex < ENTER_FLOW.length - 1) {
    const nextField = ENTER_FLOW[colIndex + 1];
    cellRefs.current[rowIndex]?.[nextField]?.focus();
    return;
  }

  // LAST FIELD → add new line
  addEmptyLine();

  // Wait for React to render the new row
  requestAnimationFrame(() => {
    const nextRow = rowIndex + 1;
    cellRefs.current[nextRow]?.item_id?.focus();
  });
};

const selectAllOnFocus = (e) => {
  // works for input/textarea
  e.target.select?.();
};

const evalMath = (value) => {
  if (typeof value !== "string") return Number(value) || 0;

  // Allow only numbers, + - * / . ( )
  if (!/^[0-9+\-*/().\s]+$/.test(value)) return null;

  try {
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${value})`)();
    if (Number.isFinite(result)) return Number(result);
    return null;
  } catch {
    return null;
  }
};

const handleCalcField = (index, field, rawValue) => {
  setInvoiceItems(prev => {
    const updated = [...prev];
    updated[index] = {
      ...updated[index],
      [`_${field}_raw`]: rawValue
    };
    return updated;
  });
};
const commitCalcField = (index, field) => {
  setInvoiceItems(prev => {
    const updated = [...prev];
    const item = { ...updated[index] };

    const raw = item[`_${field}_raw`];

    if (raw === undefined) return prev;

    const evaluated = evalMath(raw);

    if (evaluated === null) return prev;

    // Round the evaluated value
    item[field] = evaluated;

    const qty = Number(item.qty || 0);
    const tax = Number(item.tax || 0);
    const priceIncl = Number(item.price || 0);

    if (field === "price") {
      item.price_excl = evaluated / (1 + tax / 100);
      item.discount_value = evaluated * qty * (item.discount / 100);
    }

    if (field === "price_excl") {
      item.price = evaluated * (1 + tax / 100);
      item.discount_value = item.price * qty * (item.discount / 100);
    }


    if (field === "qty") {
      item.discount_value = priceIncl * evaluated * (item.discount / 100);
    }

    if (field === "discount_value") {
      item.discount =
        priceIncl && qty
          ? (evaluated / (priceIncl * qty)) * 100
          : 0;
    }

    delete item[`_${field}_raw`];
    updated[index] = item;

    return updated;
  });
};

const isTypingInInput = (e) => {
  const tag = e.target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || e.target.isContentEditable;
};

const saveInvoice = async () => {
  // ❌ Credit invoice must have a client
  if (paymentType === "credit" && !selectedInvoice?.client_id) {
    showPopup(t("Invoices.messages.client_required_credit"));
    return null;
  }

  // ❌ Exempt validation
  const hasInvalidExemptItems =
    invoiceItems.some(
      (item) =>
        item.exempt &&
        (clientDetailType !== "TN" || !clientDetailValue?.trim())
    );

  if (hasInvalidExemptItems) {
    showPopup(
      t("Invoices.messages.invalid_exempt")
    );
    return null;
  }

if (invoiceItems.length === 0) {
  showPopup(t("Invoices.messages.no_items"));
  return null;
}

const hasInvalidItems = invoiceItems.some(it => !it._isValidItem);

if (hasInvalidItems) {
  showPopup(t("Invoices.messages.invalid_items"));
  return null;
}

const hasMissingStorage = invoiceItems.some(
  item => item.is_stocked && !item.storage_id
);

if (hasMissingStorage) {
  showPopup(t("Invoices.messages.missing_storage"));
  return null;
}


  if (isNewInvoice) {
    const lines = invoiceItems.map((it, idx) => ({
      item_number: it.id ?? idx + 1,
      item_id: it.item_id || null,
      description: it.desc || "",
      qty: Number(it.qty || 0),
      item_price: Number(it.price),
      discount_percentage: Number(it.discount / 100),
      tax: Number(it.tax || 0),
      exempt: it.exempt || false,
      notes: it.notes || "",
      item_code: it.code || "",
      storage_id: it.storage_id || null,
      unit_number:
        typeof it.unit_number === "number" ? it.unit_number : null,
    }));

const payload = {
  invoice_number: invoiceNumber,
  date: invoiceDate,
  pos: "POS-1",
  type: paymentType,
  type2,
  currency,
  client_contact: clientPhone,
  client_det_code: clientDetailType,
  client_detail: clientDetailValue,
  client_id: selectedInvoice?.client_id || null,
  client: clientName,
  notes,
  reference, // ✅ NEW
  lines,
  create_due_balance: Boolean(createDueBalance),
};


    const res = await api.post(`/api/invoices`, payload);
    const created = res.data;

    if (!created?.header) {
      showPopup(t("Invoices.messages.cannot_save"));
      return null;
    }

    setFetchedInvoices((prev) => [
      {
        ...created.header,
        qr: created.header.qr ?? "123456789", // ✅ normalize
      },
      ...prev,
    ]);
    setIsNewInvoice(false);
    setSelectedInvoice(created.header);

    return created.header.invoice_number;
  }

  // EXISTING invoice
  const lines = invoiceItems.map((it, idx) => ({
    item_number: it.id ?? idx + 1,
    item_id: it.item_id || null,
    description: it.desc || "",
    qty: Number(it.qty || 0),
    item_price: Number(it.price),
    discount_percentage: Number(it.discount / 100),
    tax: Number(it.tax || 0),
    exempt: it.exempt || false,
    notes: it.notes || "",
    item_code: it.code || "",
    storage_id: it.storage_id || null,
    unit_number:
      typeof it.unit_number === "number" ? it.unit_number : null,
  }));
 
await api.put(`/api/invoices/${invoiceNumber}`, {
  header: {
    client: clientName,
    notes,
    reference, // ✅ NEW
    type2,
    currency,
    client_contact: clientPhone,
    client_detail: clientDetailValue,
    client_det_code: clientDetailType,
    client_id: selectedInvoice?.client_id || null,
    type: paymentType,
    date: invoiceDate,
  },
  lines,
});

  return invoiceNumber;
};

const initNewInvoice = async () => {
  try {
    const res = await api.get(`/api/invoices/next-number`);
    const nextNo = res.data.next_invoice_number;

    setIsNewInvoice(true);
    setSelectedInvoice({ invoice_number: nextNo, isNew: true });

    // Header defaults
    setInvoiceNumber(nextNo);
    setClientName("");
    setClientPhone("");
    setClientDetailType("TN");
    setClientDetailValue("");
    setInvoiceDate(getLocalDate());
    setPaymentType("credit");
    setCurrency("JOD");
    setType2("local");
    setNotes("");
    setReference("");
    setCreateDueBalance(true); // default for new invoices

    // Items → ONE EMPTY LINE
    setInvoiceItems([
      {
        id: 1,
        item_id: null,
        desc: "",
        notes: "",
        price: 0,
        price_excl: 0,
        tax: 0,
        qty: 1,
        discount: 0,
        discount_value: 0,
        unit_number: null,
        unit_name: "",
        storage_id: null,
        exempt: false,
        _isValidItem: false,
        is_stocked: false,
      },
    ]);

    // Focus first cell
    requestAnimationFrame(() => {
      cellRefs.current[0]?.item_id?.focus();
    });
  } catch (err) {
    console.error(err);
    showPopup(t("Invoices.messages.failed_init"));
  }
};

const requestShareInvoice = async () => {
  if (!canShareInvoice) return;
  let invNo = selectedInvoice?.invoice_number;

  // If new → save first
  if (isNewInvoice) {
    invNo = await saveInvoice();
    if (!invNo) return;
  }

  setPendingShareInvoiceNo(invNo);
  setShowShareConfirm(true);
};


const shareInvoice = async (invoiceNumber) => {
  try {
    const response = await api.post(`/api/invoices/share/${invoiceNumber}`);

    showPopup(t("Invoices.messages.invoice_shared"));

    // Refresh invoices list (QR will now exist)
    fetchInvoices();
  } catch (err) {
    console.error("Share invoice error:", err);

    // Check if it's an ISTD error response
    if (err.response?.data) {
      const errorData = err.response.data;
      
      if (errorData.source === "ISTD") {
        // Format ISTD error message
        let errorMessage = `ISTD Error (${errorData.status}): `;
        
        if (typeof errorData.message === 'object') {
          errorMessage += JSON.stringify(errorData.message);
        } else {
          errorMessage += errorData.message || "Request rejected by ISTD";
        }
        
        showPopup(errorMessage);
      } else {
        // System error
        showPopup(errorData.message || t("Invoices.messages.failed_share"));
      }
    } else {
      // Network or unknown error
      showPopup(t("Invoices.messages.failed_share"));
    }
  }
};

useEffect(() => {
  const handleKeyDown = (e) => {
    const isCtrlOrCmd = e.ctrlKey || e.metaKey;
    if (!isCtrlOrCmd) return;

    const key = e.key.toLowerCase();

    // ✅ Always intercept these shortcuts (even inside inputs)
    if (key === "s") {
      e.preventDefault();
      e.stopPropagation();

      if (!isEditable) return;

      document
        .querySelector("button[data-action='save-invoice']")
        ?.click();
      return;
    }

    if (key === "l") {
      e.preventDefault();
      e.stopPropagation();

      if (!isEditable) return;

      addEmptyLine();

      requestAnimationFrame(() => {
        const nextRow = invoiceItems.length;
        cellRefs.current[nextRow]?.item_id?.focus();
      });
      return;
    }

    if (key === "/") {
      e.preventDefault();
      e.stopPropagation();

      setShowCalculator(true);
      return;
    }

    // (Optional) if you want other shortcuts later, you can still block when typing:
    // const tag = e.target.tagName;
    // const typing = tag === "INPUT" || tag === "TEXTAREA" || e.target.isContentEditable;
    // if (typing) return;
  };

  window.addEventListener("keydown", handleKeyDown, true); // capture
  return () => window.removeEventListener("keydown", handleKeyDown, true);
}, [invoiceItems, isEditable]);

// To manage focus for item name fields
const nameRefs = useRef([]);

const printRef = useRef();

const handlePrint = useReactToPrint({
  content: () => printRef.current,
  pageStyle: `
    @page { size: A4; margin: 6mm; }
    body { -webkit-print-color-adjust: exact; }
  `
});

const isReadOnlyUser = !canAddInvoice && !canEditInvoice;

  return (
    <div className="flex w-full h-screen bg-base-200">
{/* ===== Left Column - Fetched Invoices ===== */}
<div
  className={`
    border-r border-gray-300 bg-gray-100 flex flex-col
    transition-all duration-300 ease-in-out
    ${isSidebarCollapsed ? "w-0 opacity-0 overflow-hidden" : "w-[320px]"}
  `}
>
  {/* Header */}
<div className="p-4 border-b bg-white shadow-sm space-y-3">

  {/* ───── Top Row: Title + Actions ───── */}
  <div className="flex items-center justify-between">
    <h2 className="text-lg font-semibold text-gray-700">
      {t("Invoices.recent_invoices")}
    </h2>

    <div className="flex items-center gap-2">


      <button
        onClick={() => setIsSidebarCollapsed(true)}
        className="
          p-2 rounded-md
          border border-gray-300
          text-gray-500
          hover:bg-gray-100
          transition
        "
        title="Hide invoice list"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="w-4 h-4"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
    </div>
  </div>

  {/* ───── Search Bar ───── */}
  <div className="relative ">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-gray-400"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-4.35-4.35M9.5 17a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z"
      />
    </svg>

    <input
      type="text"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      placeholder={t("Invoices.search_placeholder")}
      className="
        w-full ps-9 pe-24 py-2
        border rounded-md
        text-sm text-gray-700
        focus:ring-2 focus:ring-[#2f788a]
        focus:outline-none text-start
      "
    />

    <div className="absolute end-1 top-1/2 -translate-y-1/2 flex gap-1">
      <button
        onClick={handleSearch}
        className="
          px-3 py-1.5 text-xs
          bg-[#2f788a] text-white
          rounded
          hover:bg-[#276472]
          transition
        "
      >
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4">
  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
</svg>

      </button>

      <button
        onClick={() => setShowInvoiceFilter(true)}
        className="
          px-3 py-1.5 text-xs
          border border-[#2f788a]
          text-[#2f788a]
          rounded
          hover:bg-[#2f788a]/10
          transition
        "
      >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
      </svg>
      </button>
    </div>
  </div>

</div>


  {/* Table of Recent Invoices */}
  <div className="flex-grow overflow-y-auto ">
    <table className="w-full border-collapse table-fixed text-sm bg-white rounded-md shadow">
      <thead className="bg-gray-100 border-b">
        <tr className="text-start text-gray-600">
          <th className="p-2 border">#</th>
          <th className="p-2 border">{t("Invoices.table.client")}</th>
          <th className="p-2 border">{t("Invoices.table.total")}</th>
        </tr>
      </thead>
<tbody>
  {fetchedInvoices.map((inv, index) => (
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
            : inv.qr && inv.qr !== "123456789"
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
            <td className="border px-2 py-1 whitespace-nowrap text-right">
          {Number(inv.total).toFixed(3)}
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
      {t("Invoices.load_more")}
    </button>
  </div>
)}
{loading && <p className="text-center text-gray-500 my-4">{t("Invoices.loading")}</p>}
  </div>
</div>


{/* ===== Right Column - Invoice Editor ===== */}
<div
  className={`
    flex-1 bg-white flex flex-col overflow-y-auto
    transition-all duration-300
  `}
>
{/* Header */}
<div className="p-6 border-b shadow flex flex-col gap-4">
<div className="flex items-center justify-between mb-4">
  {/* Title */}
<div className="flex items-center gap-3">
  {isSidebarCollapsed && (
    <button
      onClick={() => setIsSidebarCollapsed(false)}
      className="
        p-2 rounded-md border border-gray-300
        hover:bg-gray-100 transition
        shadow-sm
      "
      title="Show invoice list"
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
      {canAddInvoice && (
        <button
          onClick={initNewInvoice}
          className="
            px-3 py-1.5 text-sm
            bg-[#2f788a] text-white
            rounded-md
            hover:bg-[#276472]
            transition
          "
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </button>
      )}
  <h2 className="text-2xl font-semibold text-gray-700">
    {t("Invoices.create_view_invoice")}
  </h2>
</div>


  {/* Calculator Button */}
  <button
    onClick={() => setShowCalculator(true)}
    className="
      flex items-center gap-2
      px-3 py-1.5
      text-sm font-medium
      text-[#2f788a]
      border border-[#2f788a]/30
      rounded-lg
      hover:bg-[#2f788a]/10
      hover:border-[#2f788a]/50
      transition
    "
    title="Open Calculator"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className="w-5 h-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25V13.5Zm0 2.25h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25V18Zm2.498-6.75h.007v.008h-.007v-.008Zm0 2.25h.007v.008h-.007V13.5Zm0 2.25h.007v.008h-.007v-.008Zm0 2.25h.007v.008h-.007V18Zm2.504-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V13.5Zm0 2.25h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V18Zm2.498-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V13.5ZM8.25 6h7.5v2.25h-7.5V6ZM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 0 0 2.25 2.25h10.5a2.25 2.25 0 0 0 2.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0 0 12 2.25Z"
      />
    </svg>

    <span className="hidden sm:inline">
       {t("Invoices.calculator")}
    </span>
  </button>
</div>


<div className="grid grid-cols-2 gap-4">

  {/* Invoice Number */}
  <div>
    <label className="text-sm text-gray-500">{t("Invoices.invoice_number")}</label>
    <input
      type="text"
      readOnly
      value={invoiceNumber}
      onChange={(e) => setInvoiceNumber(e.target.value)}
      className="w-full border rounded-md p-2 mt-1 text-gray-700"
      placeholder={t("Invoices.invoice_number_placeholder")}
    />
  </div>


{/* Client Selection */}
<div className="flex flex-col">
  <label className="text-sm text-gray-500">{t("Invoices.client_name")}</label>
  <div className="flex gap-2 items-center mt-1">

    {/* Search Button */}
    <button
      className="w-1/8 border rounded-md flex justify-center items-center p-2 hover:bg-gray-600 transition text-white bg-gray-400"
      onClick={() => setShowClientPopup(true)}
      disabled={!selectedInvoice || !isEditable}
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
          d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
        />
      </svg>
    </button>

    {/* Client Name Input */}
    <input
      type="text"
      value={clientName}
      onChange={(e) => setClientName(e.target.value)}
      className={`w-7/8 border rounded-md p-2 text-gray-700 ${
        selectedInvoice ? "bg-white" : "bg-gray-100 cursor-not-allowed"
      }`}
      placeholder={t("Invoices.client_name_placeholder")}
      disabled={!selectedInvoice || !isEditable}
    />
  </div>
</div>


  {/* Date */}
  <div>
    <label className="text-sm text-gray-500">{t("Invoices.date")}</label>
    <input
      type="date"
      value={invoiceDate}
      onChange={(e) => setInvoiceDate(e.target.value)}
      className="w-full border rounded-md p-2 mt-1 text-gray-700"
      disabled={!isEditable}
    />
  </div>

  

  {/* Payment Type */}
<div className="flex flex-col gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
  {/* Payment Type Toggle */}
  <div className="flex flex-col gap-2">
    <label className="text-sm font-medium text-gray-700">
      {t("Invoices.payment_type")}
    </label>

    <div
      className={`flex rounded-lg overflow-hidden border border-gray-300 shadow-sm ${
        !isEditable ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      {/* CREDIT OPTION */}
      <button
        onClick={() => isEditable && setPaymentType("credit")}
        className={`flex-1 py-2.5 px-4 text-sm font-medium transition-all duration-200 
          ${paymentType === "credit"
            ? "bg-[#2f788a] text-white shadow-inner"
            : "bg-white text-gray-700 hover:bg-gray-50"
          }
          ${!isEditable ? "" : "active:scale-[0.98]"}
        `}
        disabled={!isEditable}
      >
        {t("Invoices.payment_credit")}
      </button>

      {/* CASH OPTION */}
      <button
        onClick={() => isEditable && setPaymentType("cash")}
        className={`flex-1 py-2.5 px-4 text-sm font-medium transition-all duration-200 border-l border-gray-300
          ${paymentType === "cash"
            ? "bg-[#2f788a] text-white shadow-inner"
            : "bg-white text-gray-700 hover:bg-gray-50"
          }
          ${!isEditable ? "" : "active:scale-[0.98]"}
        `}
        disabled={!isEditable}
      >
        {t("Invoices.payment_cash")}
      </button>
    </div>
  </div>

  {/* Create Due Balance (NEW invoices only) */}
  {isNewMode && (
    <div className="flex items-center gap-2 pt-1">
      <input
        type="checkbox"
        id="create-due-balance"
        checked={createDueBalance}
        disabled={!isEditable}
        onChange={(e) => setCreateDueBalance(e.target.checked)}
        className={`w-4 h-4 rounded border-gray-300 text-[#2f788a] focus:ring-[#2f788a] focus:ring-offset-0 focus:ring-2 transition
          ${!isEditable ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
      />
      <label 
        htmlFor="create-due-balance"
        className={`text-sm text-gray-700 select-none
          ${!isEditable ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
      >
        {t("Invoices.create_due_balance")}
      </label>
    </div>
  )}
</div>
</div>

<div
  className={`grid grid-cols-2 gap-4 transition-all duration-300 overflow-hidden h-full
    ${isHeaderCollapsed ? "max-h-0 opacity-0" : "max-h-[500px] opacity-100"}
  `}
>

  {/* Currency */}
  <div>
    <label className="text-sm text-gray-500">{t("Invoices.currency")}</label>
    <select
      className={`w-full border rounded-md p-2 mt-1 text-gray-700 ${
        !isEditable ? "bg-gray-100 cursor-not-allowed" : ""
      }`}
      disabled={!isEditable}
      value={currency}
      onChange={(e) => setCurrency(e.target.value)}
    >
      <option value="JOD">JOD</option>
      <option value="USD">USD</option>
      <option value="SAR">SAR</option>
      <option value="EUR">EUR</option>
    </select>
  </div>


  {/* Client Detail Type + Value */}
<div className="flex flex-col">
  <label className="text-sm text-gray-500">{t("Invoices.client_detail")}</label>

  <div className="flex gap-2">
    {/* TYPE DROPDOWN */}
    <select
      className={`w-1/3 border rounded-md p-2 mt-1 text-gray-700 ${
        !isEditable ? "bg-gray-100 cursor-not-allowed" : ""
      }`}
      disabled={!isEditable}
      value={clientDetailType}
      onChange={(e) => setClientDetailType(e.target.value)}
    >
      <option value="TN">{t("Invoices.client_detail_tax")}</option>
      <option value="NIN">{t("Invoices.client_detail_national")}</option>
      <option value="PN">{t("Invoices.client_detail_personal")}</option>
    </select>

    {/* VALUE INPUT */}
    <input
      type="text"
      value={clientDetailValue}
      onChange={(e) => setClientDetailValue(e.target.value)}
      className={`w-2/3 border rounded-md p-2 mt-1 text-gray-700 ${
        !isEditable ? "bg-gray-100 cursor-not-allowed" : ""
      }`}
      placeholder={t("Invoices.client_detail_placeholder")}
      disabled={!isEditable}
    />
  </div>
</div>

{/* Type2 (Local / Export / Development) */}
  <div>
    <label className="text-sm text-gray-500">{t("Invoices.invoice_type")}</label>
    <select
      className={`w-full border rounded-md p-2 mt-1 text-gray-700 ${
        !isEditable ? "bg-gray-100 cursor-not-allowed" : ""
      }`}
      disabled={!isEditable}
      value={type2}
      onChange={(e) => setType2(e.target.value)}
    >
      <option value="local">{t("Invoices.invoice_type_local")}</option>
      <option value="export">{t("Invoices.invoice_type_export")}</option>
      <option value="development">{t("Invoices.invoice_type_development")}</option>
    </select>
  </div>

  {/* Client Phone Number */}
  <div>
    <label className="text-sm text-gray-500">{t("Invoices.client_phone")}</label>
    <input
      type="text"
      value={clientPhone}
      onChange={(e) => setClientPhone(e.target.value)}
      className={`w-full border rounded-md p-2 mt-1 text-gray-700 ${
        !isEditable ? "bg-gray-100 cursor-not-allowed" : ""
      }`}
      placeholder={t("Invoices.client_phone_placeholder")}
      disabled={!isEditable}
    />
  </div>

  {/* Notes */}
{/* Notes */}
<div>
  <label className="text-sm text-gray-500">{t("Invoices.notes")}</label>
  <input
    type="text"
    value={notes}
    onChange={(e) => {
      setNotes(e.target.value);
      setNotesChanged(true); // ✅ Mark as changed
    }}
    className={`w-full border rounded-md p-2 mt-1 text-gray-700 ${
      selectedInvoice ? "bg-white" : "bg-gray-100 cursor-not-allowed"
    }`}
    placeholder={t("Invoices.notes_placeholder")}
    disabled={!selectedInvoice}
  />
</div> 
<div>
  <label className="text-sm text-gray-500">
    {t("Invoices.reference")}
  </label>
  <input
    type="text"
    value={reference}
    onChange={(e) => setReference(e.target.value)}
    className={`w-full border rounded-md p-2 mt-1 text-gray-700 ${
      !isEditable ? "bg-gray-100 cursor-not-allowed" : ""
    }`}
    disabled={!isEditable}
    placeholder={t("Invoices.reference_placeholder")}
  />
</div>
</div>
<div className={isLocked ? "pointer-events-auto" : ""}>
<div className="flex items-center justify-end gap-2"> 
<button
  onClick={() => setIsHeaderCollapsed((prev) => !prev)}
  className="p-2 rounded-md border border-gray-300 hover:bg-gray-100 transition flex items-center justify-center"
  title={isHeaderCollapsed ? "Expand header" : "Collapse header"}
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={`w-6 h-6 transition-transform duration-300 ${
      isHeaderCollapsed ? "rotate-180" : "rotate-0"
    }`}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m4.5 18.75 7.5-7.5 7.5 7.5"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m4.5 12.75 7.5-7.5 7.5 7.5"
    />
  </svg>
</button>
<button
  onClick={() => setShowDiscount(prev => !prev)}
  className="p-2 rounded-md border border-gray-300 hover:bg-gray-100 transition flex items-center justify-center"
  title={showDiscount ? "Hide discount columns" : "Show discount columns"}
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    {showDiscount ? (
      // eye-off icon
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="m8.99 14.993 6-6m6 3.001c0 1.268-.63 2.39-1.593 3.069a3.746 3.746 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043 3.745 3.745 0 0 1-3.068 1.593c-1.268 0-2.39-.63-3.068-1.593a3.745 3.745 0 0 1-3.296-1.043 3.746 3.746 0 0 1-1.043-3.297 3.746 3.746 0 0 1-1.593-3.068c0-1.268.63-2.39 1.593-3.068a3.746 3.746 0 0 1 1.043-3.297 3.745 3.745 0 0 1 3.296-1.042 3.745 3.745 0 0 1 3.068-1.594c1.268 0 2.39.63 3.068 1.593a3.745 3.745 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.297 3.746 3.746 0 0 1 1.593 3.068ZM9.74 9.743h.008v.007H9.74v-.007Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm4.125 4.5h.008v.008h-.008v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
</svg>

    ) : (
      // eye icon
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="m9 14.25 6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0c1.1.128 1.907 1.077 1.907 2.185ZM9.75 9h.008v.008H9.75V9Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm4.125 4.5h.008v.008h-.008V13.5Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
</svg>

    )}
  </svg>
</button>
</div>
</div>
</div>

  {/* Table of Items */}
<div className="flex-grow p-3 overflow-y-auto relative">
<div>
  <table className="w-full border-collapse text-sm rounded-md overflow-hidden shadow">
  <thead className="bg-gray-100 border-b text-gray-700 text-sm">
    <tr>
      <th className="border p-2 text-center w-12">{t("Invoices.items.exempt")}</th>
      <th className="border p-2 text-center w-12">#</th>
      <th className="border p-2 text-center w-24">{t("Invoices.items.item_id")}</th>
      <th className="border p-2 text-start w-40">{t("Invoices.items.name")}</th>
      <th className="border p-2 text-start w-40">{t("Invoices.items.item_notes")}</th>
      <th className="border p-2 text-start w-28">{t("Invoices.items.unit_price_incl")}</th>
      <th className="border p-2 text-start w-20">{t("Invoices.items.tax_percent")}</th>
      <th className="border p-2 text-start w-28">{t("Invoices.items.unit_price_excl")}</th>
      <th className="border p-2 text-start w-20">{t("Invoices.items.unit")}</th>
      <th className="border p-2 text-start w-20">{t("Invoices.items.qty")}</th>
      <th className="border p-2 text-start w-40">{t("Invoices.items.storage")}</th>
      {showDiscount && (
      <th className="border p-2 text-start w-24">{t("Invoices.items.discount_percent")}</th>
      )}
      {showDiscount && (
      <th className="border p-2 text-start w-28">{t("Invoices.items.discount_value")}</th>
      )}
      <th className="border p-2 text-start w-32">{t("Invoices.items.tax_value")}</th>
      <th className="border p-2 text-start w-32">{t("Invoices.items.total_incl")}</th>
      <th className="border p-2 text-center w-12">{t("Invoices.items.delete")}</th>
    </tr>
  </thead>

  <tbody>
    {invoiceItems.map((item, index) => {
const priceIncl = Number(item.price) || 0;
const taxPrc = Number(item.tax) || 0;
const qty = Number(item.qty) || 0;
const discPrc = Number(item.discount) || 0;
const discVal = Number(item.discount_value) || 0;

const priceExcl = priceIncl / (1 + taxPrc / 100);
const totalIncl = qty * priceIncl - discVal;
const discValExcl = discVal / (1 + taxPrc / 100);
const totalExcl = qty * priceExcl - discValExcl;
const taxVal = totalIncl - totalExcl;


      return (
        <tr key={index} className="hover:bg-gray-50">

          {/* Exempt */}
          <td className="border p-2 text-center">
            <input
              type="checkbox"
              checked={item.exempt || false}
              disabled={!isEditable}
              onChange={(e) => {
                const wantExempt = e.target.checked;

                // ❌ Rule: Exempt requires Tax Number + value
                if (
                  wantExempt &&
                  (clientDetailType !== "TN" || !clientDetailValue?.trim())
                ) {
                showPopup(
                  t("Invoices.messages.exempt_requires_tax")
                );
                  return; // ⛔ block change
                }

                updateItem(index, "exempt", wantExempt);
              }}
            />
          </td>

          {/* Serial */}
          <td className="border p-2 text-center font-semibold text-gray-700">
            {item.id}
          </td>

          <td className="border p-2">
<input
  ref={el => {
    cellRefs.current[index] ??= {};
    cellRefs.current[index].item_id = el;
  }}
  type="number"
  value={item.item_id || ""}
  disabled={!isEditable}
  className="w-full border rounded px-2 py-1 text-center"
  onFocus={selectAllOnFocus}
onChange={(e) => {
  const val = e.target.value;

  setInvoiceItems(prev => {
    const copy = [...prev];
    copy[index] = {
      ...copy[index],
      item_id: val ? Number(val) : null,
      _isValidItem: false, // ❌ typing invalidates
    };
    return copy;
  });
}}
onBlur={() => {
  setInvoiceItems(prev => {
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

  // 🔹 CASE 1: EMPTY → open modal
  if (!item.item_id) {
    setItemModalRowIndex(index);
    setShowItemModal(true);
    return;
  }

  // 🔹 CASE 2: HAS ID → validate from DB
  const ok = await handleItemIdLookup(index);

  if (!ok) {
    cellRefs.current[index]?.item_id?.focus();
    return;
  }

  // 🔹 CASE 3: VALID → move forward
  handleEnterNavigation(index, "item_id");
}}

/>
</td>

{/* Item Name (read-only) */}
<td className="border p-2">
  <div className="px-2 py-1 text-sm text-gray-700">
    {item.desc}
  </div>
</td>


          {/* Notes */}
<td className="border p-2">
  <input
    ref={el => {
      cellRefs.current[index] ??= {};
      cellRefs.current[index].notes = el;
    }}
    type="text"
    value={item.notes || ""}
    onChange={(e) => {
      updateItem(index, "notes", e.target.value);
      setNotesChanged(true); // ✅ Mark as changed
    }}
    disabled={false}
    className="w-full border rounded px-2 py-1"
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

{/* Unit Price Incl. */}
<td className="border p-2">
  <input
    ref={el => {
      cellRefs.current[index] ??= {};
      cellRefs.current[index].price = el; 
    }}
    type="text"
    value={item._price_raw ?? item.price}
    disabled={!isEditable}
    className="w-full border rounded px-2 py-1"
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

          {/* Tax % */}
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
              className="w-full border rounded px-2 py-1"
            />
          </td>

{/* Unit Price Excl. */}
<td className="border p-2">
<input
  type="text"
  value={item._price_excl_raw ?? fmt3(item.price_excl)}
  disabled={!isEditable}
  className="w-full border rounded px-2 py-1"
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


          {/* Unit */}
{/* Unit (read-only) */}
<td className="border p-2">
  <div className="px-2 py-1 text-sm text-gray-700">
    {item.unit_name || "-"}
  </div>
</td>


          {/* Qty */}
          <td className="border p-2">
<input
  ref={el => {
    cellRefs.current[index] ??= {};
    cellRefs.current[index].qty = el;
  }}
  type="text"
  value={item._qty_raw ?? fmt3(item.qty)}
  disabled={!isEditable}
  className="w-full border rounded px-2 py-1"
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

          {/* storage */}
<td className="border p-2">
  <select
    value={item.storage_id || ""}
    onChange={(e) =>
      updateItem(index, "storage_id",
        e.target.value ? Number(e.target.value) : null
      )
    }
disabled={
  !isEditable || !item.is_stocked
}  
className={`w-full border rounded px-2 py-1
  ${!item.is_stocked ? "bg-gray-100 text-gray-400 cursor-not-allowed" : ""}
`}  >
    <option value="">{t("Invoices.items.select_storage")}</option>
    {storages.map(s => (
      <option key={s.id} value={s.id}>
        {s.name}
      </option>
    ))}
  </select>
</td>
        
          {/* Discount % */}
          {showDiscount && (

          <td className="border p-2">
          <input
            ref={el => {
              cellRefs.current[index] ??= {};
              cellRefs.current[index].discount = el;
            }}
            type="number"
            step="0.1"
            value={item.discount}
            onChange={(e) =>
              updateItem(index, "discount", parseFloat(e.target.value) || 0)
            }
            disabled={!isEditable}
            className="w-full border rounded px-2 py-1"
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

          {/* Discount Value */}
          {showDiscount && (
          <td className="border p-2">
          <input
            type="text"
            value={item._discount_value_raw ?? fmt3(item.discount_value)}
            disabled={!isEditable}
            className="w-full border rounded px-2 py-1"
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
          {/* Tax Value */}
          <td className="border p-2 font-semibold text-gray-700">
            {taxVal.toFixed(3)}
          </td>

          {/* Total Incl */}
          <td className="border p-2 font-semibold text-gray-700">
            {totalIncl.toFixed(3)}
          </td>
{/* Delete */}
<td className="border p-2 text-center">
  <button
    type="button"
    onClick={() => deleteLine(index)}
    disabled={!isEditable}
    title="Delete line"
    className={`p-1 rounded transition
      ${
        isEditable
          ? "text-red-600 hover:bg-red-50 hover:text-red-700"
          : "text-gray-300 cursor-not-allowed"
      }
    `}
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
{/* Sticky Add Empty Line */}
<div className="sticky  p-2 flex justify-start z-10">
<button
  onClick={addEmptyLine}
  disabled={!isEditable}
  className={`px-3 py-1 text-xs rounded-xl border transition
    ${
      isEditable
        ? "border-[#2f788a] text-[#2f788a] hover:bg-[#f0f8fa]"
        : "border-gray-300 text-gray-400 cursor-not-allowed"
    }
  `}
>
  {t("Invoices.add_empty_line")}
</button>

</div>

</div>
{/* + Add Line Button */}
<div className="p-4 flex justify-start">
{isEditable && (
  <div className="p-4 flex justify-start">
    <button
      onClick={() => isEditable && setShowItemModal(true)}
      className="px-4 py-2 bg-[#2f788a] text-white rounded hover:bg-[#276472] transition shadow"
    >
      {t("Invoices.add_item")}
    </button>
  </div>
)}
</div>


  {/* Totals + Actions */}
  <div className="border-t p-6 bg-gray-50">
    <div className="flex justify-between items-start">
      {/* Action Buttons */}
      <div className="flex gap-3">

 <button
    data-action="save-invoice"
    onClick={async () => {
      try {
        const savedNo = await saveInvoice();
        if (savedNo) {
          showPopup(t("Invoices.messages.invoice_saved"));
          setNotesChanged(false); // ✅ Reset after save
          
          // Only initialize new invoice if user has ADD permission AND not locked
          if (canAddInvoice && !isLocked) {
            await initNewInvoice();
          }
        }
      } catch (err) {
        console.error(err);
        showPopup(t("Invoices.messages.failed_save"));
      }
    }}
    disabled={
      // Enable if: (editable) OR (locked but notes changed)
      !isEditable && !notesChanged
    }
    className={`px-4 py-2 rounded-md transition ${
      (!isEditable && !notesChanged)
        ? "bg-gray-400 text-gray-200 cursor-not-allowed"
        : "bg-[#2E8B6D] text-white hover:bg-green-700"
    }`}
  >
    {t("Invoices.actions.save")}
  </button>


<div className={selectedInvoice &&
    selectedInvoice.qr &&
    selectedInvoice.qr == "123456789" ? "pointer-events-auto" : ""}>
{canShareInvoice && (
  <div
    className={
      selectedInvoice &&
      selectedInvoice.qr &&
      selectedInvoice.qr === "123456789"
        ? "pointer-events-auto"
        : ""
    }
  >
    <button
      onClick={requestShareInvoice}
      disabled={
        selectedInvoice &&
        selectedInvoice.qr &&
        selectedInvoice.qr !== "123456789"
      }
      className="px-4 py-2 rounded-md bg-[#1B5F73] text-white hover:bg-blue-700 disabled:opacity-50"
    >
      {isNewInvoice ? t("Invoices.actions.save_and_share") : t("Invoices.actions.share")}
    </button>
  </div>
)}
</div>

<div className={isLocked ? "pointer-events-auto" : ""}>
  <button
    onClick={handlePrint}
    className="px-4 py-2 rounded-md bg-[#555] text-white hover:bg-[#333] transition"
  >
    {t("Invoices.actions.print")}
  </button>
</div>

      </div>

      {/* Totals */}
      <div className="w-1/3 text-sm">
        <div className="flex justify-between mb-2">
          <span className="text-gray-600">{t("Invoices.totals.total_before_tax")}</span>
          <span className="font-semibold text-gray-800">
            JD JD {fmt3(totalBeforeTax)}
          </span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-gray-600">{t("Invoices.totals.total_tax")}</span>
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
<div className="hidden">
  {company && (
    <PrintableInvoice
      ref={printRef}
      company={company}    
      invoiceNumber={invoiceNumber}
      clientName={clientName}
      invoiceDate={invoiceDate}
      paymentType={paymentType}
      notes={notes}
      invoiceItems={invoiceItems}
      totalBeforeTax={totalBeforeTax}
      totalTax={totalTax}
      grandTotal={grandTotal}
      reference={reference}
      qr={qrCode}
    />
  )}
</div>
{showClientPopup && (
  <ClientList
    onClose={() => setShowClientPopup(false)}
    onSelect={(client) => {
      setClientName(client.name);
      setClientPhone(client.phone || "");
      setClientDetailType(client.detail_type || "");
      setClientDetailValue(client.detail_value || "");

      // VERY IMPORTANT → store client_id inside selectedInvoice
      setSelectedInvoice((prev) => ({
        ...prev,
        client_id: client.id
      }));

      setShowClientPopup(false);
    }}
  />
)}
<SelectItemModal
  open={showItemModal}
  onClose={() => setShowItemModal(false)}
  onSelect={handleItemSelected}
/>
<CalculatorPopup
  open={showCalculator}
  onClose={() => setShowCalculator(false)}
/>
{showShareConfirm && (
  <ShareConfirmationPopup
    invoiceNumber={pendingShareInvoiceNo}
    onCancel={() => {
      setShowShareConfirm(false);
      setPendingShareInvoiceNo(null);
    }}
    onConfirm={async () => {
      try {
        await shareInvoice(pendingShareInvoiceNo);
      } finally {
        setShowShareConfirm(false);
        setPendingShareInvoiceNo(null);
      }
    }}
  />
)}
{showInvoiceFilter && (
  <InvoiceFilterPopup
    onClose={() => setShowInvoiceFilter(false)}
    onSelectInvoice={(inv) => {
      handleInvoiceClick(inv);
      setShowInvoiceFilter(false);
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
};

export default Invoices;
