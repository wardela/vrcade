import { useEffect, useState, useRef } from "react";
import api from "../../utils/axiosInstance";
import { useTranslation } from "react-i18next";
import ClientList from "../invoices/clientlist";
import PayModal from "./PayModal";
import BarcodeModal from "./barcodemodal";
import ReceiptPreviewModal from "./ReceiptPreviewModal";
import HeldInvoicesModal from "./HeldInvoicesModal";
export default function POSScreen() {
    const { t } = useTranslation();
    const [posMode, setPosMode] = useState("new"); 

    const [fetchedInvoices, setFetchedInvoices] = useState([]);
    const [offset, setOffset] = useState(0);
    const [loading, setLoading] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [onlyFavs, setOnlyFavs] = useState(false);

    const [showClientPopup, setShowClientPopup] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);

    const [cartItems, setCartItems] = useState([]);
    const [openDiscountIndex, setOpenDiscountIndex] = useState(null);

    const [showPayModal, setShowPayModal] = useState(false);
    const [showBarcodeModal, setShowBarcodeModal] = useState(false);

    const [showRecentInvoices, setShowRecentInvoices] = useState(false);
    const [showReceiptPreview, setShowReceiptPreview] = useState(false);
    const [lastInvoiceNumber, setLastInvoiceNumber] = useState(null);
    const [heldInvoices, setHeldInvoices] = useState([]);
    const [showHeldModal, setShowHeldModal] = useState(false);
    const [company, setCompany] = useState(null);
const companyFetchedRef = useRef(false);

useEffect(() => {
  if (companyFetchedRef.current) return;
  companyFetchedRef.current = true;

  api
    .get("/api/invoices/company")
    .then(res => setCompany(res.data))
    .catch(err => {
      console.error("Failed to fetch company", err);
    });
}, []);


    let permissions = {};
    try {
    permissions = JSON.parse(localStorage.getItem("permissions")) || {};
    } catch {}

    const posPerm = permissions.pos || {};

    if (!posPerm.view) {
    return <NoAccess />;
    }
    const holdCurrentInvoice = () => {
    if (cartItems.length === 0) return;

    const held = {
        id: crypto.randomUUID(),
        cartItems,
        client: selectedClient,
        subtotal,
        totalDiscount,
        grandTotal,
        createdAt: new Date(),
    };

    setHeldInvoices(prev => [...prev, held]);

    // Reset POS
    setCartItems([]);
    setSelectedClient(null);
    setPosMode("new");
    };

    const restoreHeldInvoice = (held) => {
    setCartItems(held.cartItems);
    setSelectedClient(held.client || null);

    setHeldInvoices(prev =>
        prev.filter(h => h.id !== held.id)
    );

    setShowHeldModal(false);
    };
const isPermissionLocked =
  selectedInvoice && posPerm.edit === false;

const isEinvoiceLocked =
  selectedInvoice &&
  selectedInvoice.qr &&
  selectedInvoice.qr !== "123456789";

const isLocked = isPermissionLocked || isEinvoiceLocked;

    
    const barcodeBufferRef = useRef("");
    const lastKeyTimeRef = useRef(0);

    const BARCODE_TIMEOUT = 50; // ms (scanner speed threshold)

const handleBarcodeScan = (barcode) => {
    if (isLocked) return; // 🔒 BLOCK
  if (!barcode) return;

  const item = items.find(
    (i) =>
      String(i.barcode) === String(barcode) ||
      String(i.code) === String(barcode)
  );

  if (!item) {
    beep("error");
    alert(`Item not found for barcode: ${barcode}`);
    return;
  }

  addItemToCart(item);
  beep("success");
};


    useEffect(() => {
    const onKeyDown = (e) => {
    // ❌ Ignore typing inside inputs / textareas
    if (
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA"
    ) {
        return;
    }

    const now = Date.now();

    if (now - lastKeyTimeRef.current > BARCODE_TIMEOUT) {
        barcodeBufferRef.current = "";
    }

    lastKeyTimeRef.current = now;

    if (e.key === "Enter") {
        const scannedCode = barcodeBufferRef.current.trim();
        barcodeBufferRef.current = "";

        if (scannedCode.length > 0) {
        handleBarcodeScan(scannedCode);
        }
        return;
    }

    if (e.key.length === 1) {
        barcodeBufferRef.current += e.key;
    }
    };


    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    }, [items]);


    useEffect(() => {
    api.get("/api/invoices/items").then(res => {
        setItems(res.data);
    });

    api.get("/api/invoices/categories").then(res => {
        setCategories(res.data);
    });
    }, []);

    const dedupeInvoices = (arr) => {
    const map = new Map();
    arr.forEach((inv) => map.set(inv.invoice_number, inv));
    return Array.from(map.values());
    };

    const fetchInvoices = async () => {
    try {
        setLoading(true);
        const res = await api.get(`/api/invoices?limit=50&offset=${offset}`);
        setFetchedInvoices((prev) =>
        dedupeInvoices([...prev, ...res.data])
        );
    } catch (err) {
        console.error("Error fetching POS invoices:", err);
    } finally {
        setLoading(false);
    }
    };

    useEffect(() => {
    fetchInvoices();
    }, [offset]);

const handleInvoiceClick = async (inv) => {
  try {
    setLoading(true);
    setPosMode("view");
    setSelectedInvoice(inv);

    const res = await api.get(`/api/invoices/full/${inv.invoice_number}`);
    const data = res.data;

    // 🧾 Set client
    if (data.header?.client_id) {
      setSelectedClient({
        id: data.header.client_id,
        name: data.header.client || "—",
        phone: data.header.client_contact || null,
      });
    } else {
      setSelectedClient(null);
    }

    // 🛒 Map invoice lines → POS cart
    const mappedCart = data.lines.map((line, idx) => {
      const price = Number(line.item_price || 0);
      const qty = Number(line.qty || 1);
      const discountPct = Number(line.discount_percentage || 0) * 100;

      return {
        id: idx + 1,
        item_id: line.item_id,
        name: line.description,
        code: line.item_code || "",
        qty,
        price,
        tax: Number(line.tax || 0),
        discount: discountPct,
        discount_value: price * qty * (discountPct / 100),
        unit_number: line.unit_number ?? null,
        unit_name: line.unit_name ?? "",
        storage_id: line.storage_id ?? null,
        exempt: Boolean(line.exempt),
        is_stocked: Boolean(line.is_stocked),
        price_excl: price / (1 + (Number(line.tax || 0) / 100)),
      };
    });

    setCartItems(mappedCart);
  } catch (err) {
    console.error("Failed to load invoice into POS", err);
    alert("Failed to load invoice");
  } finally {
    setLoading(false);
  }
};


    const addItemToCart = (item) => {
    if (isLocked) return; // 🔒 BLOCK
    const qty = Number(item.usual_sales_qty || 1);
    const price = Number(item.price_with_tax || 0);
    const tax = Number(item.tax_percentage || 0);
    const discount = Number(item.usual_discount_percentage || 0);

    setCartItems((prev) => {
        // 🔁 If item already exists → increase qty
        const existingIndex = prev.findIndex(
        (ci) => ci.item_id === item.id
        );

        if (existingIndex !== -1) {
        const updated = [...prev];
        const existing = { ...updated[existingIndex] };

        const newQty = existing.qty + qty;
        existing.qty = newQty;
        existing.discount_value =
            existing.price * newQty * (existing.discount / 100);

        updated[existingIndex] = existing;
        return updated;
        }

        // ➕ New cart line
        return [
        ...prev,
        {
            id: prev.length + 1,
            item_id: item.id,
            name: item.name,
            code: item.code,
            qty,
            price,                 // price WITH tax
            tax,                   // percentage
            discount,              // percentage
            discount_value:
            price * qty * (discount / 100),

            unit_number: item.unit,
            unit_name: item.unit_name ?? "",
            storage_id: item.is_stocked
            ? item.default_storage_id || null
            : null,

            is_stocked: Boolean(item.is_stocked),
            exempt: false,

            // derived
            price_excl: price / (1 + tax / 100),
        },
        ];
    });
    };

    const updateCartItem = (index, field, value) => {
          if (isLocked) return; // 🔒 BLOCK
    setCartItems((prev) => {
        const updated = [...prev];
        const item = { ...updated[index] };

        const qty = Number(item.qty) || 0;
        const price = Number(item.price) || 0;

        if (field === "qty") {
        const newQty = Math.max(1, Number(value));
        item.qty = newQty;
        item.discount_value =
            price * newQty * (item.discount / 100);
        }

        // % input
        if (field === "discount") {
        const discPrc = Math.max(0, Number(value) || 0);
        item.discount = discPrc;
        item.discount_value =
            price * qty * (discPrc / 100);
        }

        // value input
        if (field === "discount_value") {
        const discVal = Math.max(0, Number(value) || 0);
        item.discount_value = discVal;

        item.discount =
            price * qty === 0
            ? 0
            : (discVal / (price * qty)) * 100;
        }

        updated[index] = item;
        return updated;
    });
    };

    const removeCartItem = (index) => {
          if (isLocked) return; // 🔒 BLOCK
    setCartItems((prev) =>
        prev
        .filter((_, i) => i !== index)
        .map((item, i) => ({ ...item, id: i + 1 }))
    );
    };

    const subtotal = cartItems.reduce(
  (sum, item) => sum + item.price * item.qty,
  0
);

const totalDiscount = cartItems.reduce(
  (sum, item) => sum + (item.discount_value || 0),
  0
);

const grandTotal = subtotal - totalDiscount;

const savePosInvoice = async ({ paymentType }) => {
  if (cartItems.length === 0) return;

  const lines = cartItems.map((it, idx) => ({
    item_number: idx + 1,
    item_id: it.item_id,
    description: it.name,
    qty: Number(it.qty),
    item_price: Number(it.price),
    discount_percentage: Number(it.discount) / 100,
    tax: Number(it.tax),
    exempt: it.exempt || false,
    notes: null,
    item_code: it.code || null,
    unit_number: it.unit_number ?? null,
    storage_id: it.storage_id ?? null,
  }));

  const payload = {
    pos: "POS-1",
    currency: "JOD",

    client_id: selectedClient?.id || null,
    client: selectedClient?.name || "",
    client_contact: selectedClient?.phone || null,
    client_detail: selectedClient?.detail || null,

    lines,
  };

  const res = await api.post("/api/invoices/pos", payload);
  return res.data;
};

const updatePosInvoice = async () => {
  if (!selectedInvoice) return;

  if (cartItems.length === 0) {
    alert("Invoice must have items");
    return;
  }

  const lines = cartItems.map((it, idx) => ({
    item_number: idx + 1,
    item_id: it.item_id || null,
    description: it.name || "",
    qty: Number(it.qty),
    item_price: Number(it.price),
    discount_percentage: Number(it.discount) / 100,
    tax: Number(it.tax || 0),
    exempt: it.exempt || false,
    notes: null, // POS does not edit line notes
    item_code: it.code || null,
    storage_id: it.storage_id ?? null,
    unit_number:
      typeof it.unit_number === "number" ? it.unit_number : null,
  }));

  const header = {
    client: selectedClient?.name || "",
    client_id: selectedClient?.id || null,
    client_contact: selectedClient?.phone || null,
    client_detail: selectedClient?.detail || null,
    client_det_code: selectedClient?.id ? "NIN" : null,
    type: "cash",
    type2: "local",
    currency: "JOD",
    notes: "POS Sales | مبيعات نقطة بيع",
    date: new Date(),
  };

  await api.put(
    `/api/invoices/${selectedInvoice.invoice_number}`,
    { header, lines }
  );

  alert("Invoice updated successfully");
};

const beep = (type = "success") => {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  if (type === "success") {
    osc.frequency.value = 1000; // high beep
    gain.gain.value = 0.1;
  } else {
    osc.frequency.value = 250; // low error beep
    gain.gain.value = 0.15;
  }

  osc.start();
  osc.stop(ctx.currentTime + 0.12);
};

  return (
    <div className="w-full h-full bg-base-200 flex flex-col lg:flex-row gap-3 p-3">

      {/* ================= LEFT: RECENT INVOICES ================= */}
      
{showRecentInvoices && (
  <div className="
    hidden lg:flex
    lg:w-2/12
    bg-base-100 rounded-xl shadow
    flex-col
    overflow-hidden
  ">
    <div className="px-4 py-3 border-b flex items-center justify-between bg-gray-50">
    <h2 className="text-sm font-semibold text-gray-700 tracking-wide">
        {t("POS.recent_invoices.title")}
    </h2>

    <button
        className="w-8 h-8 flex items-center justify-center rounded-lg 
                border border-green-500 text-green-600
                hover:bg-green-500 hover:text-white transition"
        title={t("POS.recent_invoices.new_invoice")}
    >
        +
    </button>
    </div>

          <div className="flex-1 overflow-y-auto divide-y">
            {fetchedInvoices.map((inv, index) => (
                <div
                key={index}
                onClick={() => handleInvoiceClick(inv)}
                className={`px-4 py-3 text-sm cursor-pointer transition
                    ${
                    selectedInvoice?.invoice_number === inv.invoice_number
                        ? "bg-[#e5f6f8] font-semibold text-[#2f788a]"
                        : inv.has_refund && inv.qr !== "123456789"
                        ? "bg-gray-50"
                        : inv.has_refund
                            ? "bg-red-50"
                            : inv.qr && inv.qr !== "123456789"
                            ? "bg-green-50"
                            : "bg-white"
                    }
                    hover:bg-[#f1f8fa]
                `}
                >
                <div className="font-medium truncate">
                    {inv.invoice_number}
                </div>
                <div className="text-xs text-gray-500 flex justify-between">
                    <span className="truncate">
                    {inv.client || "—"}
                    </span>
                    <span className="font-semibold">
                    {Number(inv.total).toFixed(3)}
                    </span>
                </div>
                </div>
            ))}

            {loading && (
                <div className="p-4 text-center text-sm text-gray-500">
                {t("Invoices.loading")}
                </div>
            )}
            </div>
        </div>
)}
      {/* ================= CENTER: ITEMS GRID ================= */}
    <div className="
    flex-1
    bg-base-100 rounded-xl shadow
    flex flex-col
    overflow-hidden
    ">
    {/* Search + Categories */}
    <div className="p-4 border-b flex flex-col gap-3">

        {/* Search row */}
<div className="flex gap-2">
  {/* Toggle Recent Invoices */}
  <button
    onClick={() => setShowRecentInvoices(v => !v)}
    className={`btn btn-outline ${showRecentInvoices ? "btn-active" : ""}`}
    title="Toggle recent invoices"
  >
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clock-icon lucide-clock"><path d="M12 6v6l4 2"/><circle cx="12" cy="12" r="10"/></svg>
  </button>

  <input
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    placeholder={t("POS.search.placeholder")}
    className="input input-bordered w-full"
  />


  {/* Manual Barcode */}
  <button
    onClick={() => setShowBarcodeModal(true)}
    className="btn btn-outline"
    title="Enter barcode manually"
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
      <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
      <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
      <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
      <path d="M8 7v10"/>
      <path d="M12 7v10"/>
      <path d="M17 7v10"/>
    </svg>
  </button>
  {heldInvoices.length > 0 && (
  <button
    className="btn btn-warning relative"
    onClick={() => setShowHeldModal(true)}
  >
    {t("POS.actions.held")}
    <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full px-2">
      {heldInvoices.length}
    </span>
  </button>
)}
</div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto">

        {/* Favorites */}
        <button
            onClick={() => setOnlyFavs(v => !v)}
            className={`btn btn-sm whitespace-nowrap ${
            onlyFavs ? "btn-warning" : "btn-outline"
            }`}
        >
            ★
        </button>

        {/* All */}
        <button
            onClick={() => setSelectedCategory("all")}
            className={`btn btn-sm whitespace-nowrap ${
            selectedCategory === "all" ? "btn-primary" : "btn-outline"
            }`}
        >
            {t("POS.categories.all")}
        </button>

        {/* System categories */}
        {categories.map(c => (
            <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`btn btn-sm whitespace-nowrap ${
                selectedCategory === c.id ? "btn-primary" : "btn-outline"
            }`}
            >
            {c.name}
            </button>
        ))}
        </div>
    </div>

    {/* Items grid */}
    <div className="flex-1 p-4 overflow-y-auto">
        <div className="
        grid
        grid-cols-2
        sm:grid-cols-3
        md:grid-cols-4
        xl:grid-cols-5
        gap-3
        ">
        {items
            .filter(i => {
            if (onlyFavs && !i.fav) return false;
            if (selectedCategory !== "all" && i.category !== selectedCategory)
                return false;

            const q = search.toLowerCase();
            return (
                i.name.toLowerCase().includes(q) ||
                (i.code || "").toLowerCase().includes(q) ||
                String(i.id).includes(q)
            );
            })
            .map(i => (
            <div
            key={i.id}
            onClick={() => addItemToCart(i)}
            className="
                border rounded-lg p-3
                cursor-pointer
                hover:bg-base-200
                transition
                flex flex-col gap-1
            "
            >
                {/* Name */}
                <div className="font-medium text-sm ">
                {i.name}
                </div>

                {/* Price */}
                <div className="text-sm font-semibold">
                {Number(i.price_with_tax).toFixed(3)} JOD
                </div>

                {/* Stock */}
                <div
                className={`text-xs font-medium ${
                    !i.is_stocked
                    ? "text-blue-600"
                    : i.stock_qty <= 0
                        ? "text-red-600"
                        : i.stock_qty <= i.minimum_qty_alert
                        ? "text-orange-600"
                        : "text-green-600"
                }`}
                >
                {!i.is_stocked
                    ?  t("POS.items.not_stocked")
                    : `${t("POS.items.stock")} : ${Number(i.stock_qty).toFixed(3)}`}
                </div>

                {/* Usual discount */}
                {Number(i.usual_discount_percentage) > 0 && (
                <div className="text-xs text-blue-600 font-semibold">
                    {t("POS.items.usual_discount")} : {Number(i.usual_discount_percentage)}%
                </div>
                )}
            </div>
            ))}
        </div>
    </div>
    </div>

      {/* ================= RIGHT: CART & TOTALS ================= */}
<div
  className={`
    relative
    w-full
    lg:w-3/12
    bg-base-100 rounded-xl shadow
    flex flex-col
    overflow-hidden
    p-2
    transition-opacity duration-300
    ${isLocked ? "opacity-70" : "opacity-100"}
  `}
>
        {/* Client */}
<button
  onClick={() => !isLocked && setShowClientPopup(true)}
  className="
    group
    w-full
    relative
    overflow-hidden
    border-2 border-blue-200 rounded-xl px-5 py-4
    flex items-center justify-between
    bg-gradient-to-br from-white via-blue-50/30 to-gray-50/30
    hover:border-blue-400
    hover:shadow-lg hover:shadow-blue-200/50
    transition-all duration-300
    hover:scale-[1.02]
    active:scale-[0.98]
  "
>
  {/* Animated background gradient */}
  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-gray-500/5 to-pink-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
  
  {/* Shimmer effect */}
  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
  
  <div className="flex items-center gap-3 relative z-10">
    {/* Epic SVG Icon with animation */}
    <div className="relative">
      <div className="absolute inset-0 bg-blue-400 rounded-lg blur-md opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
      <div className="relative bg-gradient-to-br from-blue-500 to-gray-600 p-2.5 rounded-lg group-hover:scale-110 transition-transform duration-300">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="white" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="group-hover:rotate-12 transition-transform duration-300"
        >
          <path d="M16 2v2"/>
          <path d="M7 22v-2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"/>
          <path d="M8 2v2"/>
          <circle cx="12" cy="11" r="3"/>
          <rect x="3" y="4" width="18" height="18" rx="2"/>
        </svg>
      </div>
    </div>
    
    <div className="flex flex-col text-start">
      <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
        {t("POS.cart.customer")}
      </span>
      <span className="font-bold text-base text-gray-800 group-hover:text-blue-700 transition-colors">
        {selectedClient ? selectedClient.name : t("POS.cart.walk_in")}
      </span>
    </div>
  </div>
  
  <div className="flex flex-row gap-3 items-center relative z-10">
    <span className="text-blue-600 font-medium text-sm group-hover:translate-x-1 transition-transform">
      {selectedClient ? "" : t("POS.cart.select")} 
    </span>
{selectedClient && !isLocked && (      <button
        onClick={(e) => {
          e.stopPropagation();
          setSelectedClient(null);
        }}
        className="
          px-3 py-1 
          text-xs font-semibold
          text-red-600 
          bg-red-50
          border border-red-200
          rounded-md
          hover:bg-red-100 
          hover:border-red-300
          hover:scale-105
          active:scale-95
          transition-all duration-200
        "
      >
        {t("POS.cart.clear_customer")}
      </button>
    )}
  </div>
</button>

{/* Cart */}
<div className="flex-1 overflow-y-auto divide-y divide-gray-200">
  {cartItems.map((cart, i) => {
    const isDiscountOpen = openDiscountIndex === i;

    return (
      <div key={cart.id} className="p-4 hover:bg-gray-50 transition-colors">
        
        {/* ================= Item Header ================= */}
        <div className="flex items-start justify-between gap-3 mb-3">
          
          {/* Item Name */}
          <h3 className="font-medium text-base flex-1">
            {cart.name}
          </h3>

          {/* Remove Button */}
          <button
            className="text-gray-400 hover:text-red-600 transition-colors p-1"
            onClick={() => removeCartItem(i)}
            aria-label="Remove item"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ================= Price and Quantity Row ================= */}
        <div className="flex items-center justify-between mb-2">
          
          {/* Unit Price */}
          <span className="text-sm text-gray-600">
            {cart.price.toFixed(3)} JOD
          </span>

          {/* Quantity Controls */}
          <div className="flex items-center gap-3 bg-gray-100 rounded-lg px-2 py-1">
            <button
              className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
              onClick={() => updateCartItem(i, "qty", cart.qty - 1)}
              aria-label="Decrease quantity"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>

            <span className="text-sm font-semibold w-6 text-center">
              {cart.qty}
            </span>

            <button
              className="w-7 h-7 flex items-center justify-center rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              onClick={() => updateCartItem(i, "qty", cart.qty + 1)}
              aria-label="Increase quantity"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              </button>
          </div>
        </div>

        {/* ================= Line Total ================= */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-900">
            {t("POS.cart.total")} : {(cart.price * cart.qty - cart.discount_value).toFixed(3)} JOD
          </span>
        </div>

        {/* ================= Discount Section ================= */}
        <div className="space-y-2">
          
          {/* Discount Indicator/Toggle */}
          {!isDiscountOpen && cart.discount > 0 ? (
            <button
              className="text-xs text-green-600 font-medium flex items-center gap-1 hover:text-green-700"
             onClick={() => {
  if (isLocked) return;
  setOpenDiscountIndex(i);
}}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              {cart.discount.toFixed(2)}% {t("POS.cart.discount_applied")}
            </button>
          ) : !isDiscountOpen ? (
            <button
              className="text-xs text-blue-600 font-medium flex items-center gap-1 hover:text-blue-700"
              onClick={() => {
  if (isLocked) return;
  setOpenDiscountIndex(i);
}}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {t("POS.cart.add_discount")}
            </button>
          ) : null}

          {/* Discount Editor */}
          {isDiscountOpen && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-3">
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">
                  {t("POS.cart.apply_discount")}
                </span>
                <button
                  className="text-gray-400 hover:text-gray-600"
                  onClick={() => setOpenDiscountIndex(null)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                
                {/* Percentage Input */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                     {t("POS.cart.percentage")}
                  </label>
                  <input
                    type="number"
                    className="input input-sm input-bordered w-full"
                      disabled={isLocked}
                    value={Number(cart.discount).toFixed(2)}
                    onChange={(e) => updateCartItem(i, "discount", e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                {/* Value Input */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {t("POS.cart.amount")}
                  </label>
                  <input
                    type="number"
                    className="input input-sm input-bordered w-full"
                    value={Number(cart.discount_value).toFixed(3)}
                      disabled={isLocked}
                    onChange={(e) => updateCartItem(i, "discount_value", e.target.value)}
                    placeholder="0.000"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    );
  })}
</div>


{/* ================= Totals ================= */}
<div className="m-4 p-4 bg-base-100 rounded-lg border border-gray-200 shadow-sm">
  
  <div className="space-y-2 text-sm">
    
    {/* Subtotal */}
    <div className="flex justify-between items-center">
      <span className="text-gray-600">{t("POS.totals.subtotal")}</span>
      <span className="font-medium text-gray-900">
        {subtotal.toFixed(3)} JOD
      </span>
    </div>

    {/* Discount */}
    {totalDiscount > 0 && (
      <div className="flex justify-between items-center">
        <span className="text-gray-600">{t("POS.totals.discount")}</span>
        <span className="font-medium text-green-600">
          −{totalDiscount.toFixed(3)} JOD
        </span>
      </div>
    )}

  </div>

  {/* Divider */}
<div className="border-t border-dashed border-gray-300 my-3"></div>

  {/* Grand Total */}
  <div className="flex justify-between items-center text-sm">
    <span className="font-semibold text-gray-900">{t("POS.totals.total")}</span>
    <span className="font-bold text-gray-900">
      {grandTotal.toFixed(3)} JOD
    </span>
  </div>

</div>


        {/* Actions */}
<div className="p-4 border-t flex gap-2">
  {posMode === "new" ? (
    <>
<button
  className="btn btn-outline flex-1"
  disabled={cartItems.length === 0}
  onClick={holdCurrentInvoice}
>
  {t("POS.actions.hold")}
</button>

      <button
        className="btn btn-primary flex-1"
        disabled={cartItems.length === 0}
        onClick={() => setShowPayModal(true)}
      >
        {t("POS.actions.pay")}
      </button>

      <button
        className="btn btn-ghost flex-1"
        onClick={() => {
          setCartItems([]);
          setSelectedClient(null);
        }}
      >
        {t("POS.actions.clear")}
      </button>
    </>
  ) : (
    <>
<button
  className="btn btn-outline flex-1"
  disabled={!selectedInvoice}
  onClick={() => {
    if (!selectedInvoice?.invoice_number) return;

    setLastInvoiceNumber(selectedInvoice.invoice_number);
    setShowReceiptPreview(true);
  }}
>
  {t("POS.actions.print")}
</button>


        <button
        className={`btn flex-1 ${
            isLocked
            ? "btn-disabled"
            : "btn-primary"
        }`}
        disabled={isLocked}
        onClick={async () => {
            try {
            await updatePosInvoice();
            fetchInvoices(); // refresh recent list
            } catch (err) {
            console.error(err);
            alert("Failed to save invoice");
            }
        }}
        >
        {t("POS.actions.save")}
        </button>


      <button
        className="btn btn-ghost flex-1"
        onClick={() => {
          setCartItems([]);
          setSelectedClient(null);
          setSelectedInvoice(null);
          setPosMode("new");
        }}
      >
        {t("POS.actions.back")}
      </button>
    </>
  )}
</div>

      </div>
{showClientPopup && (
  <ClientList
    open={showClientPopup}
    onClose={() => setShowClientPopup(false)}
    onSelect={(client) => {
      setSelectedClient({
        id: client.id,
        name: client.name,
      });
      setShowClientPopup(false);
    }}
  />
)}
<PayModal
  open={showPayModal}
  onClose={() => setShowPayModal(false)}
  grandTotal={grandTotal}
onConfirm={async ({ paymentType, cashPaid, change }) => {
  try {
    const saved = await savePosInvoice({ paymentType });

    if (!saved?.header?.invoice_number) {
      throw new Error("Invoice number missing");
    }

    // ✅ store invoice number
    setLastInvoiceNumber(saved.header.invoice_number);

    // close payment modal
    setShowPayModal(false);

    // 🔥 open receipt preview
    setShowReceiptPreview(true);

    // reset POS
    setCartItems([]);
    setSelectedClient(null);

    fetchInvoices();
  } catch (err) {
    console.error("POS save failed:", err);
    alert("Failed to complete payment");
  }
}}

/>
<BarcodeModal
  open={showBarcodeModal}
  onClose={() => setShowBarcodeModal(false)}
  onSubmit={(barcode) => handleBarcodeScan(barcode)}
/>
<ReceiptPreviewModal
  open={showReceiptPreview}
  invoiceNumber={lastInvoiceNumber}
  company={company}
  onClose={() => {
    setShowReceiptPreview(false);
    setLastInvoiceNumber(null);
  }}
/>
<HeldInvoicesModal
  open={showHeldModal}
  invoices={heldInvoices}
  onSelect={restoreHeldInvoice}
  onClose={() => setShowHeldModal(false)}
/>
    </div>
  );
}
