import { useEffect, useState, useRef } from "react";
import api from "../../utils/axiosInstance";
import { useTranslation } from "react-i18next";
import { formatLocalDateTime } from "../../utils/localDateTime";
import ClientList from "../invoices/clientlist";
import PayModal from "./PayModal";
import BarcodeModal from "./barcodemodal";
import ReceiptPreviewModal from "./ReceiptPreviewModal";
import HeldInvoicesModal from "./HeldInvoicesModal";
import ManualTokenChargeModal from "./ManualTokenChargeModal";
import { fetchCompanyWithLogo } from "../../utils/companyLogo";
import { logoutToLogin } from "../../utils/logout";

const decodeTokenPayload = () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return {};

    const payload = token.split(".")[1];
    if (!payload) return {};

    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload =
      normalizedPayload + "=".repeat((4 - (normalizedPayload.length % 4 || 4)) % 4);

    return JSON.parse(window.atob(paddedPayload));
  } catch {
    return {};
  }
};

const getCurrentPosUser = () => {
  const tokenPayload = decodeTokenPayload();
  const fullName = localStorage.getItem("full_name") || "";

  return {
    userId: tokenPayload.user_id || null,
    username: tokenPayload.username || fullName || "",
    fullName,
  };
};

const formatSessionDateTime = (value) => {
  if (!value) return "—";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
};

const getApiMessage = (error, fallbackMessage) =>
  error?.response?.data?.message || fallbackMessage;

const formatNumber = (value) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: Number(value || 0) % 1 === 0 ? 0 : 3,
    maximumFractionDigits: 3,
  });

const getInvoiceNumberSortValue = (invoiceNumber) => {
  const match = String(invoiceNumber || "").trim().match(/^INV-(\d+)$/i);
  return match ? Number.parseInt(match[1], 10) : -1;
};

const parsePositiveCartQuantity = (value) => {
  const normalized = String(value ?? "").trim();

  if (!/^\d+$/.test(normalized)) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
};

const selectInputText = (input) => {
  if (!input) return;

  input.focus();
  input.setSelectionRange(0, input.value.length);
};

const getRemoteSessionClosureMessage = (notice, t) => {
  if (!notice?.closed_via) return "";

  if (notice.closed_via === "admin") {
    const closedBy =
      notice.closed_by_full_name || notice.closed_by_username || t("POS.states.unknown_user");

    return t("POS.session.closed_by_admin", {
      user: closedBy,
    });
  }

  if (notice.closed_via === "system") {
    return t("POS.session.closed_by_system");
  }

  return "";
};

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
    const [showManualTokenChargeModal, setShowManualTokenChargeModal] = useState(false);
    const [isSubmittingManualTokenCharge, setIsSubmittingManualTokenCharge] = useState(false);
    const [manualTokenChargeFeedback, setManualTokenChargeFeedback] = useState(null);

    const [showRecentInvoices, setShowRecentInvoices] = useState(false);
    const [showReceiptPreview, setShowReceiptPreview] = useState(false);
    const [lastInvoiceNumber, setLastInvoiceNumber] = useState(null);
    const [receiptPreviewOptions, setReceiptPreviewOptions] = useState({
      allowCashDrawerWithoutPrint: false,
    });
    const [heldInvoices, setHeldInvoices] = useState([]);
    const [showHeldModal, setShowHeldModal] = useState(false);
    const [company, setCompany] = useState(null);
    const [activeSession, setActiveSession] = useState(null);
    const [posPoints, setPosPoints] = useState([]);
    const [isPosPointsLoading, setIsPosPointsLoading] = useState(true);
    const [selectedPosPointId, setSelectedPosPointId] = useState("");
    const [isSessionLoading, setIsSessionLoading] = useState(true);
    const [sessionActionLoading, setSessionActionLoading] = useState(false);
    const [sessionActionMode, setSessionActionMode] = useState("end");
    const [sessionError, setSessionError] = useState("");
    const [endedSessionSummary, setEndedSessionSummary] = useState(null);
    const [showEndSessionConfirm, setShowEndSessionConfirm] = useState(false);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [paymentRequestKey, setPaymentRequestKey] = useState("");
    const [selectedCartIndex, setSelectedCartIndex] = useState(null);
    const [quantityDraft, setQuantityDraft] = useState("");
    const [quantityEditError, setQuantityEditError] = useState("");
const companyFetchedRef = useRef(false);
const currentUser = getCurrentPosUser();
const paymentSubmitLockRef = useRef(false);
const sessionActionLockRef = useRef(false);
const manualTokenChargeLockRef = useRef(false);
const quantityInputRef = useRef(null);

const loadCompany = async ({ force = false } = {}) => {
  try {
    const companyConfig = await fetchCompanyWithLogo(api, { force });
    setCompany(companyConfig);
    return companyConfig;
  } catch (err) {
    console.error("Failed to fetch company", err);
    return null;
  }
};

useEffect(() => {
  if (companyFetchedRef.current) return;
  companyFetchedRef.current = true;

  loadCompany();
}, []);

useEffect(() => {
  const refreshCompanyOnReturn = () => {
    if (document.visibilityState === "visible") {
      loadCompany();
    }
  };

  window.addEventListener("focus", refreshCompanyOnReturn);
  document.addEventListener("visibilitychange", refreshCompanyOnReturn);

  return () => {
    window.removeEventListener("focus", refreshCompanyOnReturn);
    document.removeEventListener("visibilitychange", refreshCompanyOnReturn);
  };
}, []);


    let permissions = {};
    try {
    permissions = JSON.parse(localStorage.getItem("permissions")) || {};
    } catch {}

    const posPerm = permissions.pos || {};
    const refundPerm = permissions.refunds || {};
    const canManualTokenCharge =
      Boolean(refundPerm.add) && activeSession?.manual_token_charges_enabled === true;

    if (!posPerm.view) {
    return <NoAccess />;
    }

    const resetPosWorkspace = () => {
    setCartItems([]);
    setSelectedClient(null);
    setSelectedInvoice(null);
    setPosMode("new");
    setOpenDiscountIndex(null);
    setShowPayModal(false);
    setShowClientPopup(false);
    setShowBarcodeModal(false);
    setShowHeldModal(false);
    setShowReceiptPreview(false);
    setLastInvoiceNumber(null);
    setReceiptPreviewOptions({ allowCashDrawerWithoutPrint: false });
    setHeldInvoices([]);
    setSelectedCartIndex(null);
    setQuantityDraft("");
    setQuantityEditError("");
    setShowManualTokenChargeModal(false);
    setIsSubmittingManualTokenCharge(false);
    setManualTokenChargeFeedback(null);
    };

    const loadActiveSession = async ({ lastSessionId = null } = {}) => {
    setIsSessionLoading(true);

    try {
        const res = await api.get("/api/pos-sessions/active", {
          params: lastSessionId ? { last_session_id: lastSessionId } : undefined,
        });
        const session = res.data?.session || null;
        const closureNotice = res.data?.closure_notice || null;
        setActiveSession(session);
        if (session?.pos_point_id) {
          setSelectedPosPointId(String(session.pos_point_id));
        }
        const closureMessage = getRemoteSessionClosureMessage(closureNotice, t);
        setSessionError(closureMessage);
    } catch (err) {
        console.error("Failed to load active POS session", err);
        setSessionError(getApiMessage(err, t("POS.session.load_status_failed")));
    } finally {
        setIsSessionLoading(false);
    }
    };

    const loadPosPoints = async () => {
    setIsPosPointsLoading(true);

    try {
        const res = await api.get("/api/pos-points?active_only=true");
        const points = res.data?.pos_points || [];
        setPosPoints(points);
        setSelectedPosPointId((current) => {
          if (activeSession?.pos_point_id) {
            return String(activeSession.pos_point_id);
          }

          if (current && points.some((point) => String(point.id) === String(current))) {
            return current;
          }

          return points[0] ? String(points[0].id) : "";
        });
    } catch (err) {
        console.error("Failed to load POS stations", err);
        setPosPoints([]);
        setSessionError((current) =>
          current || getApiMessage(err, t("POS.session.load_stations_failed")),
        );
    } finally {
        setIsPosPointsLoading(false);
    }
    };

    const handleStartSession = async () => {
    if (sessionActionLockRef.current) return;

    if (!selectedPosPointId) {
        setSessionError(t("POS.session.choose_station_required"));
        return;
    }

    sessionActionLockRef.current = true;
    setSessionActionLoading(true);
    setSessionError("");

    try {
        const res = await api.post("/api/pos-sessions/start", {
        pos_point_id: Number(selectedPosPointId),
        started_at: formatLocalDateTime(),
        });

        const session = res.data?.session || null;
        setActiveSession(session);
        if (session?.pos_point_id) {
          setSelectedPosPointId(String(session.pos_point_id));
        }
    } catch (err) {
        console.error("Failed to start POS session", err);
        setSessionError(getApiMessage(err, t("POS.session.start_failed")));
    } finally {
        sessionActionLockRef.current = false;
        setSessionActionLoading(false);
    }
    };

    const handleSessionProtectedError = async (error) => {
    const code = error?.response?.data?.code;

    if (
        code === "POS_SESSION_REQUIRED" ||
        code === "POS_SESSION_ENDED" ||
        code === "POS_SESSION_NOT_FOUND" ||
        code === "POS_SESSION_FORBIDDEN"
    ) {
        const lastSessionId = activeSession?.id || null;
        resetPosWorkspace();
        setShowManualTokenChargeModal(false);
        await loadActiveSession({ lastSessionId });
    }
    };

    const handleManualTokenChargeSubmit = async ({ tokenAmount }) => {
    if (!activeSession?.id || manualTokenChargeLockRef.current || isSubmittingManualTokenCharge) {
        return;
    }

    manualTokenChargeLockRef.current = true;
    setIsSubmittingManualTokenCharge(true);

    try {
        await api.post(`/api/pos-sessions/${activeSession.id}/manual-token-charges`, {
        token_amount: tokenAmount,
        });

        setShowManualTokenChargeModal(false);
        setManualTokenChargeFeedback({
          type: "success",
          title: t("POS.manual_tokens.feedback.success_title"),
          message: t("POS.manual_tokens.states.success", { count: formatNumber(tokenAmount) }),
        });
    } catch (err) {
        console.error("Failed to record manual token charge", err);
        await handleSessionProtectedError(err);
        setManualTokenChargeFeedback({
          type: "error",
          title: t("POS.manual_tokens.feedback.error_title"),
          message: getApiMessage(err, t("POS.manual_tokens.states.failed")),
        });
    } finally {
        manualTokenChargeLockRef.current = false;
        setIsSubmittingManualTokenCharge(false);
    }
    };

    const handleEndSession = async () => {
    if (!activeSession) return;

    setShowEndSessionConfirm(true);
    };

    const confirmEndSession = async ({ logoutAfter = false } = {}) => {
    if (!activeSession || sessionActionLoading || sessionActionLockRef.current) return;

    sessionActionLockRef.current = true;
    setSessionActionLoading(true);
    setSessionActionMode(logoutAfter ? "end-and-logout" : "end");
    setSessionError("");

    try {
        const res = await api.post(`/api/pos-sessions/${activeSession.id}/end`, {
        ended_at: formatLocalDateTime(),
        });
        setShowEndSessionConfirm(false);
        setSelectedPosPointId(activeSession?.pos_point_id ? String(activeSession.pos_point_id) : "");
        setActiveSession(null);
        resetPosWorkspace();

        if (logoutAfter) {
          try {
            logoutToLogin();
            return;
          } catch (logoutError) {
            console.error("Failed to log out after ending POS session", logoutError);
            setSessionError(t("POS.session.logout_after_end_failed"));
          }
        }

        setEndedSessionSummary(res.data);
    } catch (err) {
        console.error("Failed to end POS session", err);
        setSessionError(getApiMessage(err, t("POS.session.end_failed")));
    } finally {
        sessionActionLockRef.current = false;
        setSessionActionLoading(false);
        setSessionActionMode("end");
    }
    };

useEffect(() => {
  loadActiveSession();
  loadPosPoints();
}, []);

useEffect(() => {
  if (!activeSession?.id) return undefined;

  let cancelled = false;

  const pollActiveSessionStatus = async () => {
    if (document.visibilityState === "hidden") return;

    try {
      const res = await api.get("/api/pos-sessions/active", {
        params: {
          last_session_id: activeSession.id,
        },
      });

      if (cancelled) return;

      const nextSession = res.data?.session || null;
      const closureNotice = res.data?.closure_notice || null;

      if (nextSession?.id === activeSession.id) {
        return;
      }

      if (!nextSession) {
        resetPosWorkspace();
        setActiveSession(null);
        setShowEndSessionConfirm(false);
        setEndedSessionSummary(null);
        setSessionError(
          getRemoteSessionClosureMessage(closureNotice, t) || t("POS.session.closed_remotely"),
        );
        return;
      }

      setActiveSession(nextSession);
      setSessionError("");
    } catch (error) {
      if (!cancelled) {
        console.error("Failed to poll active POS session", error);
      }
    }
  };

  const intervalId = window.setInterval(pollActiveSessionStatus, 5000);
  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      pollActiveSessionStatus();
    }
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);

  return () => {
    cancelled = true;
    window.clearInterval(intervalId);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };
}, [activeSession, t]);

useEffect(() => {
  if (showPayModal) {
    setPaymentRequestKey(crypto.randomUUID());
  } else {
    setPaymentRequestKey("");
    setIsProcessingPayment(false);
    paymentSubmitLockRef.current = false;
  }
}, [showPayModal]);

useEffect(() => {
  if (selectedCartIndex == null) {
    setQuantityDraft("");
    setQuantityEditError("");
    return;
  }

  const selectedCartItem = cartItems[selectedCartIndex];
  if (!selectedCartItem) {
    setSelectedCartIndex(null);
    setQuantityDraft("");
    setQuantityEditError("");
    return;
  }

  setQuantityDraft(String(selectedCartItem.qty));
}, [cartItems, selectedCartIndex]);

useEffect(() => {
  if (selectedCartIndex == null || !quantityInputRef.current) return;

  requestAnimationFrame(() => {
    selectInputText(quantityInputRef.current);
  });
}, [selectedCartIndex]);

    const holdCurrentInvoice = () => {
    if (isPosBlocked || cartItems.length === 0) return;

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

const selectedPosPoint =
  posPoints.find((point) => String(point.id) === String(selectedPosPointId)) || null;

const isLocked = isPermissionLocked || isEinvoiceLocked;
const isPosBlocked =
  isLocked || isSessionLoading || !activeSession || sessionActionLoading;

    
    const barcodeBufferRef = useRef("");
    const lastKeyTimeRef = useRef(0);

    const BARCODE_TIMEOUT = 50; // ms (scanner speed threshold)

const handleBarcodeScan = (barcode) => {
    if (isPosBlocked) return; // 🔒 BLOCK
  if (!barcode) return;

  const item = items.find(
    (i) =>
      String(i.barcode) === String(barcode) ||
      String(i.code) === String(barcode)
  );

  if (!item) {
    beep("error");
    alert(t("POS.states.item_not_found", { barcode }));
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
    api.get("/api/invoices/items?context=pos").then(res => {
        setItems(res.data);
    });

    api.get("/api/invoices/categories").then(res => {
        setCategories(res.data);
    });
    }, []);

    const dedupeAndSortInvoices = (arr) => {
    const map = new Map();
    arr.forEach((inv) => map.set(inv.invoice_number, inv));
    return Array.from(map.values()).sort((left, right) => {
      const rightValue = getInvoiceNumberSortValue(right.invoice_number);
      const leftValue = getInvoiceNumberSortValue(left.invoice_number);

      if (rightValue !== leftValue) {
        return rightValue - leftValue;
      }

      return String(right.invoice_number || "").localeCompare(String(left.invoice_number || ""));
    });
    };

    const fetchInvoices = async ({ reset = false } = {}) => {
    if (!activeSession?.pos_point_id) {
        setFetchedInvoices([]);
        return;
    }

    try {
        setLoading(true);
        const nextOffset = reset ? 0 : offset;
        const res = await api.get("/api/invoices", {
          params: {
            limit: 50,
            offset: nextOffset,
            pos_point_id: activeSession.pos_point_id,
          },
        });
        setFetchedInvoices((prev) =>
        dedupeAndSortInvoices([...(reset ? [] : prev), ...(res.data || [])])
        );
    } catch (err) {
        console.error("Error fetching POS invoices:", err);
    } finally {
        setLoading(false);
    }
    };

    useEffect(() => {
    if (!activeSession?.pos_point_id) {
      setFetchedInvoices([]);
      return;
    }

    setFetchedInvoices([]);
    setOffset(0);
    }, [activeSession?.pos_point_id]);

    useEffect(() => {
    if (!activeSession?.pos_point_id) return;
    fetchInvoices({ reset: offset === 0 });
    }, [offset, activeSession?.pos_point_id]);

const handleInvoiceClick = async (inv) => {
  try {
    setLoading(true);
    setPosMode("view");
    setSelectedInvoice(inv);

    const res = await api.get(`/api/invoices/full/${inv.invoice_number}`, {
      params: {
        context: "pos",
      },
    });
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
        has_tokens: Boolean(line.has_tokens),
        token_count: Number(line.token_count || 0),
        price_excl: price / (1 + (Number(line.tax || 0) / 100)),
      };
    });

    setCartItems(mappedCart);
    setSelectedCartIndex(null);
    setQuantityDraft("");
    setQuantityEditError("");
  } catch (err) {
    console.error("Failed to load invoice into POS", err);
    alert(t("POS.states.load_failed"));
  } finally {
    setLoading(false);
  }
};


    const addItemToCart = (item) => {
    if (isPosBlocked) return; // 🔒 BLOCK
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
            has_tokens: Boolean(item.has_tokens),
            token_count: Number(item.token_count || 0),
            exempt: false,

            // derived
            price_excl: price / (1 + tax / 100),
        },
        ];
    });
    };

    const updateCartItem = (index, field, value) => {
          if (isPosBlocked) return; // 🔒 BLOCK
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

    const selectCartItem = (index) => {
    if (isPosBlocked) return;

    setSelectedCartIndex(index);
    setQuantityEditError("");
    };

    const applySelectedCartQuantity = (index = selectedCartIndex) => {
    if (index == null || !cartItems[index]) return;

    const nextQty = parsePositiveCartQuantity(quantityDraft);
    if (!nextQty) {
        setQuantityEditError(t("POS.cart.invalid_quantity"));
        quantityInputRef.current?.focus();
        quantityInputRef.current?.select();
        return;
    }

    updateCartItem(index, "qty", nextQty);
    setQuantityDraft(String(nextQty));
    setQuantityEditError("");
    setSelectedCartIndex(null);
    };

    const removeCartItem = (index) => {
          if (isPosBlocked) return; // 🔒 BLOCK
    setSelectedCartIndex((current) => {
        if (current == null) return current;
        if (current === index) return null;
        if (current > index) return current - 1;
        return current;
    });
    setQuantityEditError("");
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
const totalTokens = cartItems.reduce(
  (sum, item) =>
    sum +
    (item.has_tokens ? Number(item.token_count || 0) * Number(item.qty || 0) : 0),
  0,
);

const savePosInvoice = async ({ payments }) => {
  if (!activeSession) {
    throw new Error("No active POS session");
  }

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
    pos: activeSession.pos_point_name || activeSession.pos || "POS-1",
    currency: "JOD",
    session_id: activeSession.id,
    user_id: currentUser.userId,
    date: formatLocalDateTime(),
    idempotency_key: paymentRequestKey,

    client_id: selectedClient?.id || null,
    client: selectedClient?.name || "",
    client_contact: selectedClient?.phone || null,
    client_detail: selectedClient?.detail || null,

    lines,
    payments,
  };

  const res = await api.post("/api/invoices/pos", payload);
  return res.data;
};

const updatePosInvoice = async () => {
  if (!selectedInvoice) return;

  if (cartItems.length === 0) {
    alert(t("POS.states.no_items"));
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
    date: formatLocalDateTime(),
  };

  await api.put(
    `/api/invoices/${selectedInvoice.invoice_number}`,
    { header, lines },
    {
      params: {
        context: "pos",
      },
    },
  );

  alert(t("POS.states.save_success"));
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
    <div className="relative w-full h-full bg-base-200 flex flex-col gap-3 p-3">

      {activeSession && (
      <div className="bg-base-100 rounded-xl shadow border border-base-300 px-4 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-700">
            {t("POS.session.session_number", { id: activeSession.id })}
          </span>
          <span className="text-gray-600">
            {t("POS.session.user")}: <span className="font-semibold text-gray-900">{activeSession.username || currentUser.username || t("POS.states.unknown_user")}</span>
          </span>
          <span className="text-gray-600">
            {t("POS.session.station")}: <span className="font-semibold text-gray-900">{activeSession.pos_point_name || activeSession.pos || "—"}</span>
          </span>
          <span className="text-gray-600">
            {t("POS.session.started")}: <span className="font-semibold text-gray-900">{formatSessionDateTime(activeSession.started_at)}</span>
          </span>
        </div>

        <button
          type="button"
          className="btn btn-outline btn-error"
          disabled={sessionActionLoading}
          onClick={handleEndSession}
        >
          {sessionActionLoading ? t("POS.session.ending") : t("POS.session.end_session")}
        </button>
      </div>
      )}

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-3">

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
<div className="flex items-center gap-2 overflow-x-auto">
  {/* Toggle Recent Invoices */}
  <button
    onClick={() => setShowRecentInvoices(v => !v)}
    className={`btn btn-outline shrink-0 ${showRecentInvoices ? "btn-active" : ""}`}
    title={t("POS.search.toggle_recent")}
  >
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clock-icon lucide-clock"><path d="M12 6v6l4 2"/><circle cx="12" cy="12" r="10"/></svg>
  </button>

  <input
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    placeholder={t("POS.search.placeholder")}
    className="input input-bordered min-w-[240px] flex-1"
  />


  {/* Manual Barcode */}
  <button
    onClick={() => setShowBarcodeModal(true)}
    className="btn btn-outline shrink-0"
    title={t("POS.search.manual_barcode")}
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
  {canManualTokenCharge && activeSession?.id && (
  <button
    type="button"
    onClick={() => setShowManualTokenChargeModal(true)}
    className="btn btn-outline shrink-0 whitespace-nowrap"
    title={t("POS.manual_tokens.title")}
  >
    {t("POS.manual_tokens.actions.open")}
  </button>
)}
  {heldInvoices.length > 0 && (
  <button
    className="btn btn-warning relative shrink-0"
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
            .sort((left, right) => {
            const offerDiff = Number(Boolean(right.is_offer_item)) - Number(Boolean(left.is_offer_item));
            if (offerDiff !== 0) return offerDiff;
            return String(left.name || "").localeCompare(String(right.name || ""));
            })
            .map(i => (
            <div
            key={i.id}
            onClick={() => addItemToCart(i)}
            className={`rounded-xl border p-3 cursor-pointer transition flex flex-col gap-2 shadow-sm ${
                i.is_offer_item
                  ? "border-amber-300 bg-gradient-to-br from-amber-50 via-white to-orange-50 hover:border-amber-400 hover:shadow-amber-100"
                  : "border-base-300 bg-white hover:bg-base-200"
            }`}
            >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-medium text-sm text-gray-900">
                    {i.name}
                  </div>

                  {i.is_offer_item && (
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                      {t("POS.items.offer")}
                    </span>
                  )}
                </div>

                <div className="text-sm font-semibold text-gray-900">
                {Number(i.price_with_tax).toFixed(3)} JOD
                </div>

                {i.has_tokens && (
                  <div className="flex items-center justify-start">
                    <span className="rounded-full bg-[#2f788a] px-3 py-1 text-xs font-semibold text-white shadow-sm">
                      {formatNumber(i.token_count)} {t("POS.items.tokens")}
                    </span>
                  </div>
                )}

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
      <div
        key={cart.id}
        className={`p-4 transition-colors ${
          selectedCartIndex === i
            ? "bg-blue-50 ring-1 ring-blue-200"
            : "hover:bg-gray-50"
        }`}
        onClick={() => selectCartItem(i)}
      >
        
        {/* ================= Item Header ================= */}
        <div className="flex items-start justify-between gap-3 mb-3">
          
          {/* Item Name */}
          <h3 className="font-medium text-base flex-1">
            {cart.name}
          </h3>

          {/* Remove Button */}
          <button
            className="text-gray-400 hover:text-red-600 transition-colors p-1"
            onClick={(event) => {
              event.stopPropagation();
              removeCartItem(i);
            }}
            aria-label={t("POS.aria.remove_item")}
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
              onClick={(event) => {
                event.stopPropagation();
                const nextQty = Math.max(1, Number(cart.qty) - 1);
                updateCartItem(i, "qty", nextQty);
              }}
              aria-label={t("POS.aria.decrease_quantity")}
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
              onClick={(event) => {
                event.stopPropagation();
                updateCartItem(i, "qty", Number(cart.qty) + 1);
              }}
              aria-label={t("POS.aria.increase_quantity")}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              </button>
          </div>
        </div>

        {selectedCartIndex === i && (
          <div className="mb-3 rounded-lg border border-blue-200 bg-white px-3 py-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                {t("POS.cart.quantity")}
              </label>
              <input
                ref={quantityInputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={quantityDraft}
                onClick={(event) => event.stopPropagation()}
                onFocus={(event) => {
                  event.stopPropagation();
                  selectInputText(event.target);
                }}
                onMouseUp={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  selectInputText(event.currentTarget);
                }}
                onChange={(event) => {
                  setQuantityDraft(event.target.value.replace(/[^\d]/g, ""));
                  setQuantityEditError("");
                }}
                onKeyDown={(event) => {
                  event.stopPropagation();

                  if (event.key === "Enter") {
                    event.preventDefault();
                    applySelectedCartQuantity(i);
                    return;
                  }

                  if (event.key === "Escape") {
                    setQuantityDraft(String(cart.qty));
                    setQuantityEditError("");
                  }
                }}
                className="input input-sm input-bordered w-full sm:max-w-[120px]"
                placeholder={String(cart.qty)}
              />
              <span className="text-xs text-gray-500">
                {t("POS.cart.quantity_enter_hint")}
              </span>
            </div>

            {quantityEditError && (
              <div className="mt-2 text-xs font-medium text-red-600">
                {quantityEditError}
              </div>
            )}
          </div>
        )}

        {cart.has_tokens && Number(cart.token_count) > 0 && (
          <div className="mb-2 flex items-center justify-start">
            <span className="rounded-full bg-[#2f788a]/10 px-3 py-1 text-xs font-semibold text-[#2f788a]">
              {formatNumber(cart.token_count)} {t("POS.items.tokens")} / {t("POS.cart.per_item")}
              {Number(cart.qty) > 1
                ? ` • ${formatNumber(Number(cart.token_count) * Number(cart.qty))} ${t("POS.items.tokens_total")}`
                : ""}
            </span>
          </div>
        )}

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

    <div className="flex justify-between items-center">
      <span className="text-gray-600">{t("POS.totals.tokens")}</span>
      <span className="font-medium text-[#2f788a]">
        {formatNumber(totalTokens)} {t("POS.items.tokens")}
      </span>
    </div>

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
  disabled={isPosBlocked || cartItems.length === 0}
  onClick={holdCurrentInvoice}
>
  {t("POS.actions.hold")}
</button>

      <button
        className="btn btn-primary flex-1"
        disabled={isPosBlocked || cartItems.length === 0}
        onClick={() => {
          setPaymentRequestKey(crypto.randomUUID());
          setShowPayModal(true);
        }}
      >
        {t("POS.actions.pay")}
      </button>

      <button
        className="btn btn-ghost flex-1"
        disabled={isPosBlocked}
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
    setReceiptPreviewOptions({ allowCashDrawerWithoutPrint: false });
    setShowReceiptPreview(true);
  }}
>
  {t("POS.actions.print")}
</button>


        <button
        className={`btn flex-1 ${
            isPosBlocked
            ? "btn-disabled"
            : "btn-primary"
        }`}
        disabled={isPosBlocked}
        onClick={async () => {
            try {
            await updatePosInvoice();
            fetchInvoices({ reset: true }); // refresh recent list
            } catch (err) {
            console.error(err);
            alert(t("POS.states.save_failed"));
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
  submitting={isProcessingPayment}
onConfirm={async ({ payments }) => {
  if (paymentSubmitLockRef.current || isProcessingPayment) return;

  paymentSubmitLockRef.current = true;
  setIsProcessingPayment(true);

  try {
    const saved = await savePosInvoice({ payments });

    if (!saved?.header?.invoice_number) {
      throw new Error("Invoice number missing");
    }

    // ✅ store invoice number
    setLastInvoiceNumber(saved.header.invoice_number);
    setReceiptPreviewOptions({
      allowCashDrawerWithoutPrint: payments.some(
        (payment) => payment.payment_method === "cash" && Number(payment.amount || 0) > 0,
      ),
    });

    // close payment modal
    setShowPayModal(false);

    // 🔥 open receipt preview
    setShowReceiptPreview(true);

    // reset POS
    setCartItems([]);
    setSelectedClient(null);
    setSelectedCartIndex(null);
    setQuantityDraft("");
    setQuantityEditError("");

    fetchInvoices({ reset: true });
  } catch (err) {
    console.error("POS save failed:", err);
    await handleSessionProtectedError(err);
    alert(getApiMessage(err, t("POS.states.complete_payment_failed")));
  } finally {
    paymentSubmitLockRef.current = false;
    setIsProcessingPayment(false);
  }
}}

/>
<BarcodeModal
  open={showBarcodeModal}
  onClose={() => setShowBarcodeModal(false)}
  onSubmit={(barcode) => handleBarcodeScan(barcode)}
/>
<ManualTokenChargeModal
  open={showManualTokenChargeModal}
  submitting={isSubmittingManualTokenCharge}
  posPointName={activeSession?.pos_point_name || activeSession?.pos || ""}
  onClose={() => setShowManualTokenChargeModal(false)}
  onSubmit={handleManualTokenChargeSubmit}
/>
<ActionFeedbackModal
  open={Boolean(manualTokenChargeFeedback)}
  title={manualTokenChargeFeedback?.title}
  message={manualTokenChargeFeedback?.message}
  tone={manualTokenChargeFeedback?.type}
  onClose={() => setManualTokenChargeFeedback(null)}
/>
<ReceiptPreviewModal
  open={showReceiptPreview}
  invoiceNumber={lastInvoiceNumber}
  company={company}
  allowCashDrawerWithoutPrint={receiptPreviewOptions.allowCashDrawerWithoutPrint}
  onClose={() => {
    setShowReceiptPreview(false);
    setLastInvoiceNumber(null);
    setReceiptPreviewOptions({ allowCashDrawerWithoutPrint: false });
  }}
/>
<HeldInvoicesModal
  open={showHeldModal}
  invoices={heldInvoices}
  onSelect={restoreHeldInvoice}
  onClose={() => setShowHeldModal(false)}
/>
<EndSessionConfirmModal
  open={showEndSessionConfirm}
  session={activeSession}
  loading={sessionActionLoading}
  loadingAction={sessionActionMode}
  error={sessionError}
  onCancel={() => setShowEndSessionConfirm(false)}
  onConfirm={() => confirmEndSession()}
  onConfirmAndLogout={() => confirmEndSession({ logoutAfter: true })}
/>
      </div>

      {(isSessionLoading || !activeSession) && (
      <div className="absolute inset-0 z-30 flex items-center justify-center bg-base-200/80 backdrop-blur-sm p-4">
        <div className="w-full max-w-lg rounded-2xl border border-base-300 bg-white shadow-2xl p-6">
          <div className="mb-4">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2f788a]">
              {t("POS.session.required_badge")}
            </div>
            <h2 className="mt-2 text-2xl font-bold text-gray-900">
              {t("POS.session.required_title")}
            </h2>
            <p className="mt-3 text-sm text-gray-600">
              {t("POS.session.current_user")}: <span className="font-semibold text-gray-900">{currentUser.username || t("POS.states.unknown_user")}</span>
            </p>
            {currentUser.fullName && (
              <p className="mt-1 text-sm text-gray-500">{currentUser.fullName}</p>
            )}
          </div>

          {sessionError && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {sessionError}
            </div>
          )}

          {isSessionLoading ? (
            <div className="flex items-center gap-3 rounded-xl border border-base-300 bg-base-100 px-4 py-4 text-sm text-gray-600">
              <span className="loading loading-spinner loading-md text-[#2f788a]"></span>
              {t("POS.session.checking")}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-base-300 bg-base-100 p-4">
                <div className="text-sm font-semibold text-gray-800">{t("POS.session.choose_station")}</div>
                <p className="mt-1 text-xs text-gray-500">
                  {t("POS.session.choose_station_hint")}
                </p>

                {isPosPointsLoading ? (
                  <div className="mt-4 flex items-center gap-3 text-sm text-gray-600">
                    <span className="loading loading-spinner loading-sm text-[#2f788a]"></span>
                    {t("POS.session.loading_stations")}
                  </div>
                ) : posPoints.length === 0 ? (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    {t("POS.session.no_stations")}
                  </div>
                ) : (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {posPoints.map((point) => {
                      const isSelected = String(point.id) === String(selectedPosPointId);

                      return (
                        <button
                          key={point.id}
                          type="button"
                          onClick={() => setSelectedPosPointId(String(point.id))}
                          className={`rounded-2xl border px-4 py-4 text-left transition ${
                            isSelected
                              ? "border-[#2f788a] bg-[#2f788a]/8 shadow-sm"
                              : "border-base-300 bg-white hover:border-[#2f788a]/40"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="font-semibold text-gray-900">{point.name}</div>
                            <span
                              className={`h-4 w-4 rounded-full border ${
                                isSelected
                                  ? "border-[#2f788a] bg-[#2f788a]"
                                  : "border-gray-300 bg-white"
                              }`}
                            />
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            {point.description || t("POS.session.station_ready")}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {selectedPosPoint && (
                <div className="rounded-xl border border-[#2f788a]/15 bg-[#2f788a]/5 px-4 py-3 text-sm text-gray-700">
                  {t("POS.session.starting_on")} <span className="font-semibold text-gray-900">{selectedPosPoint.name}</span>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={sessionActionLoading || isPosPointsLoading || !selectedPosPointId}
                  onClick={handleStartSession}
                >
                  {sessionActionLoading ? t("POS.session.starting") : t("POS.session.start_session")}
                </button>

                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={sessionActionLoading}
                  onClick={async () => {
                    await loadPosPoints();
                    await loadActiveSession();
                  }}
                >
                  {t("POS.session.refresh_status")}
                </button>

 
              </div>
            </div>
          )}
        </div>
      </div>
      )}

      {endedSessionSummary && (
      <EndSessionSummaryModal
        summary={endedSessionSummary}
        fallbackUsername={currentUser.username}
        onClose={() => setEndedSessionSummary(null)}
      />
      )}
    </div>
  );
}

function NoAccess() {
  const { t } = useTranslation();
  return (
    <div className="flex h-full w-full items-center justify-center bg-base-200 p-6">
      <div className="rounded-2xl border border-base-300 bg-white px-8 py-10 text-center shadow-xl">
        <h2 className="text-xl font-bold text-gray-900">{t("POS.no_access.title")}</h2>
        <p className="mt-2 text-sm text-gray-600">
          {t("POS.no_access.message")}
        </p>
      </div>
    </div>
  );
}

function EndSessionConfirmModal({
  open,
  session,
  loading,
  loadingAction,
  error,
  onCancel,
  onConfirm,
  onConfirmAndLogout,
}) {
  const { t } = useTranslation();
  if (!open || !session) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="border-b px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">{t("POS.session.end_session")}</h2>
          <p className="mt-1 text-sm text-gray-500">
            {t("POS.session.end_confirm_message", { id: session.id })}
          </p>
        </div>

        <div className="px-6 py-5 text-sm text-gray-700">
          <div className="rounded-xl border border-base-300 bg-base-100 px-4 py-4">
            <div>
              {t("POS.session.user")}: <span className="font-semibold text-gray-900">{session.username || "—"}</span>
            </div>
            <div className="mt-2">
              {t("POS.session.started")}: <span className="font-semibold text-gray-900">{formatSessionDateTime(session.started_at)}</span>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="grid gap-3 px-6 py-4 sm:grid-cols-2">
          <button
            type="button"
            className="btn btn-outline w-full sm:col-span-2"
            onClick={onCancel}
            disabled={loading}
          >
            {t("PayModal.actions.cancel")}
          </button>
          <button
            type="button"
            className="btn btn-error w-full whitespace-normal text-center leading-tight"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading && loadingAction === "end"
              ? t("POS.session.ending")
              : t("POS.session.confirm_end")}
          </button>
          <button
            type="button"
            className="btn btn-primary w-full whitespace-normal text-center leading-tight"
            onClick={onConfirmAndLogout}
            disabled={loading}
          >
            {loading && loadingAction === "end-and-logout"
              ? t("POS.session.ending_and_logging_out")
              : t("POS.session.end_and_logout")}
          </button>
        </div>
      </div>
    </div>
  );
}

function EndSessionSummaryModal({ summary, fallbackUsername, onClose }) {
  const { t } = useTranslation();
  if (!summary) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        <div className="border-b px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">{t("POS.session.summary_title")}</h2>
          <p className="mt-1 text-sm text-gray-500">
            {t("POS.session.summary_subtitle", { id: summary.id })}
          </p>
        </div>

        <div className="grid gap-4 px-6 py-5 md:grid-cols-2">
          <div className="rounded-xl bg-base-200 px-4 py-3">
            <div className="text-xs uppercase tracking-wide text-gray-500">
              {t("POS.session.number_of_invoices")}
            </div>
            <div className="mt-1 font-semibold text-gray-900">
              {summary.invoice_count || 0}
            </div>
          </div>

          <div className="rounded-xl bg-base-200 px-4 py-3">
            <div className="text-xs uppercase tracking-wide text-gray-500">
              {t("POS.session.user")}
            </div>
            <div className="mt-1 font-semibold text-gray-900">
              {summary.username || fallbackUsername}
            </div>
          </div>

          <div className="rounded-xl bg-base-200 px-4 py-3">
            <div className="text-xs uppercase tracking-wide text-gray-500">
              {t("POS.session.started")}
            </div>
            <div className="mt-1 font-semibold text-gray-900">
              {formatSessionDateTime(summary.started_at)}
            </div>
          </div>

          <div className="rounded-xl bg-base-200 px-4 py-3">
            <div className="text-xs uppercase tracking-wide text-gray-500">
              {t("POS.session.ended")}
            </div>
            <div className="mt-1 font-semibold text-gray-900">
              {formatSessionDateTime(summary.ended_at)}
            </div>
          </div>
        </div>

        <div className="flex justify-end px-6 py-4">
          <button
            type="button"
            className="btn btn-primary"
            onClick={onClose}
          >
            {t("POS.actions.back")}
          </button>
        </div>
      </div>
    </div>
  );
}

function ActionFeedbackModal({ open, title, message, tone = "success", onClose }) {
  const { t } = useTranslation();

  if (!open) return null;

  const toneClasses =
    tone === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-emerald-200 bg-emerald-50 text-emerald-700";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="border-b px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        </div>

        <div className="px-6 py-5">
          <div className={`rounded-xl border px-4 py-4 text-sm ${toneClasses}`}>
            {message}
          </div>
        </div>

        <div className="flex justify-end px-6 py-4">
          <button type="button" className="btn btn-primary" onClick={onClose}>
            {t("POS.actions.ok")}
          </button>
        </div>
      </div>
    </div>
  );
}
