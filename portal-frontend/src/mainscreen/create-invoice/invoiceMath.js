const round3 = (num) => Math.round(Number(num || 0) * 1000) / 1000;

export const format3 = (num) =>
  num === null || num === undefined || Number.isNaN(Number(num))
    ? "0.000"
    : Number(num).toFixed(3);

export const getLocalDate = () => {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const combineDateWithCurrentLocalTime = (dateValue, sourceDate = new Date()) => {
  const pad = (value, length = 2) => String(value).padStart(length, "0");

  if (!dateValue) {
    return `${sourceDate.getFullYear()}-${pad(sourceDate.getMonth() + 1)}-${pad(
      sourceDate.getDate()
    )} ${pad(sourceDate.getHours())}:${pad(sourceDate.getMinutes())}:${pad(
      sourceDate.getSeconds()
    )}.${pad(sourceDate.getMilliseconds(), 3)}`;
  }

  if (dateValue.includes("T")) {
    return dateValue.replace("T", " ");
  }

  if (dateValue.includes(" ")) {
    return dateValue;
  }

  return `${dateValue} ${pad(sourceDate.getHours())}:${pad(
    sourceDate.getMinutes()
  )}:${pad(sourceDate.getSeconds())}.${pad(sourceDate.getMilliseconds(), 3)}`;
};

export const createEmptyInvoiceItem = (id = 1) => ({
  id,
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
  _isValidItem: false,
});

export const createInvoiceItemFromCatalog = (item, id, quantity) => {
  const qty = Number(quantity || item?.usual_sales_qty || 1);
  const price = Number(item?.price_with_tax || 0);
  const tax = Number(item?.tax_percentage || 0);
  const discount = Number(item?.usual_discount_percentage || 0);

  return {
    id,
    item_id: item?.id || null,
    code: item?.code || "",
    desc: item?.name || "",
    notes: item?.notes || "",
    price,
    price_excl: price / (1 + tax / 100),
    tax,
    qty,
    discount,
    discount_value: price * qty * (discount / 100),
    unit_number: item?.unit ?? null,
    unit_name: item?.unit_name || "",
    storage_id: item?.is_stocked ? item?.default_storage_id || null : null,
    exempt: false,
    is_stocked: item?.is_stocked === true,
    _isValidItem: true,
  };
};

export const applyInvoiceItemUpdate = (sourceItem, field, value) => {
  const item = {
    ...sourceItem,
    unit_name: sourceItem?.unit_name ?? "",
    unit_number: sourceItem?.unit_number ?? null,
  };

  const qty = Number(item.qty) || 0;
  const tax = Number(item.tax) || 0;
  const priceIncl = Number(item.price) || 0;

  if (field === "discount") {
    const discountPercent = Number(value) || 0;
    item.discount = discountPercent;
    item.discount_value = priceIncl * qty * (discountPercent / 100);
    return item;
  }

  if (field === "discount_value") {
    const discountValue = Number(value) || 0;
    item.discount_value = discountValue;
    item.discount = priceIncl === 0 || qty === 0 ? 0 : (discountValue / (priceIncl * qty)) * 100;
    return item;
  }

  if (field === "price") {
    const nextPriceIncl = Number(value) || 0;
    item.price = nextPriceIncl;
    item.price_excl = nextPriceIncl / (1 + tax / 100);
    item.discount_value = nextPriceIncl * qty * (item.discount / 100);
    return item;
  }

  if (field === "price_excl") {
    const priceExcl = Number(value) || 0;
    item.price_excl = priceExcl;
    item.price = priceExcl * (1 + tax / 100);
    item.discount_value = item.price * qty * (item.discount / 100);
    return item;
  }

  if (field === "qty") {
    const nextQty = Number(value) || 0;
    item.qty = nextQty;
    item.discount_value = priceIncl * nextQty * (item.discount / 100);
    return item;
  }

  if (field === "exempt") {
    const isExempt = Boolean(value);
    item.exempt = isExempt;

    if (isExempt) {
      item.tax = 0;
      item.price_excl = Number(item.price) || 0;
      item.discount_value = (Number(item.price) || 0) * qty * (item.discount / 100);
    }

    return item;
  }

  if (field === "tax") {
    const nextTax = Number(value) || 0;
    item.tax = nextTax;
    item.price_excl = priceIncl / (1 + nextTax / 100);
    item.discount_value = priceIncl * qty * (item.discount / 100);
    return item;
  }

  item[field] = value;
  return item;
};

export const calculateInvoiceTotals = (invoiceItems = []) => {
  const totalBeforeTax = invoiceItems.reduce((sum, item) => {
    const priceExTax = Number(item.price || 0) / (1 + Number(item.tax || 0) / 100);
    return sum + Number(item.qty || 0) * priceExTax * (1 - Number(item.discount || 0) / 100);
  }, 0);

  const totalTax = invoiceItems.reduce((sum, item) => {
    const priceExTax = Number(item.price || 0) / (1 + Number(item.tax || 0) / 100);
    return (
      sum +
      Number(item.qty || 0) *
        priceExTax *
        (Number(item.tax || 0) / 100) *
        (1 - Number(item.discount || 0) / 100)
    );
  }, 0);

  return {
    totalBeforeTax,
    totalTax,
    grandTotal: totalBeforeTax + totalTax,
  };
};

export const calculateInvoiceLineValues = (item) => {
  const priceIncl = Number(item?.price) || 0;
  const taxPercent = Number(item?.tax) || 0;
  const qty = Number(item?.qty) || 0;
  const discountValue = Number(item?.discount_value) || 0;

  const priceExcl = priceIncl / (1 + taxPercent / 100);
  const totalIncl = qty * priceIncl - discountValue;
  const discountValueExcl = discountValue / (1 + taxPercent / 100);
  const totalExcl = qty * priceExcl - discountValueExcl;
  const taxValue = totalIncl - totalExcl;

  return {
    priceIncl,
    priceExcl,
    qty,
    discountValue,
    totalIncl,
    totalExcl,
    taxValue,
    taxPercent,
  };
};

export const normalizeInvoiceItemsForPrint = (lines = []) =>
  lines.map((line) => ({
    desc: line.description || line.desc || "",
    qty: Number(line.qty || 0),
    price: Number(line.item_price ?? line.price ?? 0),
    tax: Number(line.tax || 0),
    discount:
      line.discount != null && line.item_price == null
        ? Number(line.discount || 0)
        : Number(line.discount_percentage || 0) * 100,
    notes: line.notes || "",
    unit_name: line.unit_name || "",
  }));

export const buildInvoicePayload = ({
  invoiceNumber,
  invoiceDate,
  paymentType,
  type2,
  currency,
  clientPhone,
  clientDetailType,
  clientDetailValue,
  clientId,
  clientName,
  notes,
  reference,
  createDueBalance,
  invoiceItems,
}) => ({
  invoice_number: invoiceNumber,
  date: combineDateWithCurrentLocalTime(invoiceDate),
  pos: "POS-1",
  type: paymentType,
  type2,
  currency,
  client_contact: clientPhone,
  client_det_code: clientDetailType,
  client_detail: clientDetailValue,
  client_id: clientId || null,
  client: clientName || "",
  notes: notes || "",
  reference: reference || "",
  create_due_balance: Boolean(createDueBalance),
  lines: (invoiceItems || []).map((item, index) => ({
    item_number: item.id ?? index + 1,
    item_id: item.item_id || null,
    description: item.desc || "",
    qty: Number(item.qty || 0),
    item_price: Number(item.price || 0),
    discount_percentage: Number(item.discount || 0) / 100,
    tax: Number(item.tax || 0),
    exempt: item.exempt || false,
    notes: item.notes || "",
    item_code: item.code || "",
    storage_id: item.storage_id || null,
    unit_number: typeof item.unit_number === "number" ? item.unit_number : null,
  })),
});

export const buildPrintableInvoiceData = ({ detail, company }) => {
  const lines = detail?.lines || [];
  const totals = calculateInvoiceTotals(
    lines.map((line) => ({
      price: Number(line.item_price || 0),
      tax: Number(line.tax || 0),
      qty: Number(line.qty || 0),
      discount: Number(line.discount_percentage || 0) * 100,
    }))
  );

  return {
    company,
    invoiceNumber: detail?.header?.invoice_number || "",
    clientName: detail?.header?.client || "",
    invoiceDate: detail?.header?.date || "",
    paymentType: detail?.header?.type || "cash",
    notes: detail?.header?.notes || "",
    reference: detail?.header?.reference || "",
    invoiceItems: normalizeInvoiceItemsForPrint(lines),
    totalBeforeTax: totals.totalBeforeTax,
    totalTax: totals.totalTax,
    grandTotal: totals.grandTotal,
    qr: detail?.header?.qr || "",
  };
};

export const nextLineId = (items = []) =>
  items.reduce((maxId, item) => Math.max(maxId, Number(item.id || 0)), 0) + 1;

export const resequenceInvoiceItems = (items = []) =>
  items.map((item, index) => ({
    ...item,
    id: index + 1,
  }));

export const sanitizeInvoiceItemForModal = (item) => ({
  ...item,
  price: round3(Number(item?.price || 0)),
  price_excl: round3(Number(item?.price_excl || 0)),
  qty: round3(Number(item?.qty || 0)),
  discount: round3(Number(item?.discount || 0)),
  discount_value: round3(Number(item?.discount_value || 0)),
  tax: round3(Number(item?.tax || 0)),
});
