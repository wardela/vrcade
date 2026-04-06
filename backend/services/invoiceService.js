const { PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const s3 = require("../config/s3");

const DEFAULT_QR = "123456789";

const createItemValidationError = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

const createPosItemError = (message, code = "POS_ITEM_INVALID", statusCode = 400) => {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  return error;
};

const parseBooleanFlag = (value, defaultValue = false) => {
  if (value == null || value === "") return defaultValue;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "off"].includes(normalized)) return false;
  }

  return Boolean(value);
};

const padDatePart = (value) => String(value).padStart(2, "0");

const normalizeDateValue = (value) => {
  if (value == null || value === "") return null;
  if (value instanceof Date) {
    return `${value.getFullYear()}-${padDatePart(value.getMonth() + 1)}-${padDatePart(value.getDate())}`;
  }

  const normalized = String(value).trim().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : null;
};

const normalizeTimeValue = (value) => {
  if (value == null || value === "") return null;
  const normalized = String(value).trim();

  if (/^\d{2}:\d{2}$/.test(normalized)) {
    return `${normalized}:00`;
  }

  if (/^\d{2}:\d{2}:\d{2}$/.test(normalized)) {
    return normalized;
  }

  return null;
};

const getCurrentLocalOfferParts = (now = new Date()) => ({
  currentDate: `${now.getFullYear()}-${padDatePart(now.getMonth() + 1)}-${padDatePart(now.getDate())}`,
  currentTime: `${padDatePart(now.getHours())}:${padDatePart(now.getMinutes())}:${padDatePart(now.getSeconds())}`,
});

const normalizeItemTokenConfig = (data = {}) => {
  const hasTokens = parseBooleanFlag(data.has_tokens, false);

  const rawTokenCount = data.token_count;
  const parsedTokenCount =
    rawTokenCount == null || rawTokenCount === ""
      ? 0
      : Number(rawTokenCount);

  if (!Number.isFinite(parsedTokenCount)) {
    throw createItemValidationError("Token count must be a valid number");
  }

  if (!Number.isInteger(parsedTokenCount)) {
    throw createItemValidationError("Token count must be a whole number");
  }

  if (parsedTokenCount < 0) {
    throw createItemValidationError("Token count cannot be negative");
  }

  if (hasTokens && parsedTokenCount <= 0) {
    throw createItemValidationError("Token count must be greater than zero when tokens are enabled");
  }

  return {
    has_tokens: hasTokens,
    token_count: hasTokens ? parsedTokenCount : 0,
  };
};

const normalizeItemOfferConfig = (data = {}) => {
  const isOfferItem = parseBooleanFlag(data.is_offer_item, false);

  if (!isOfferItem) {
    return {
      is_offer_item: false,
      offer_is_active: false,
      offer_is_24_7: true,
      offer_start_time: null,
      offer_end_time: null,
      offer_start_date: null,
      offer_end_date: null,
    };
  }

  const offerIsActive = parseBooleanFlag(data.offer_is_active, false);
  const offerIs247 = parseBooleanFlag(data.offer_is_24_7, true);
  const offerStartTime = offerIs247 ? null : normalizeTimeValue(data.offer_start_time);
  const offerEndTime = offerIs247 ? null : normalizeTimeValue(data.offer_end_time);
  const offerStartDate = normalizeDateValue(data.offer_start_date);
  const offerEndDate = normalizeDateValue(data.offer_end_date);

  if (!offerIs247 && offerIsActive && (!offerStartTime || !offerEndTime)) {
    throw createItemValidationError("Start and end time are required for active scheduled offers");
  }

  if (!offerIs247 && offerStartTime && offerEndTime && offerEndTime <= offerStartTime) {
    throw createItemValidationError("Offer end time must be later than the start time");
  }

  if ((data.offer_start_date && !offerStartDate) || (data.offer_end_date && !offerEndDate)) {
    throw createItemValidationError("Offer dates must be valid");
  }

  if (offerStartDate && offerEndDate && offerEndDate < offerStartDate) {
    throw createItemValidationError("Offer end date cannot be before the start date");
  }

  return {
    is_offer_item: true,
    offer_is_active: offerIsActive,
    offer_is_24_7: offerIs247,
    offer_start_time: offerStartTime,
    offer_end_time: offerEndTime,
    offer_start_date: offerStartDate,
    offer_end_date: offerEndDate,
  };
};

const isOfferItemCurrentlyAvailable = (item, currentParts = getCurrentLocalOfferParts()) => {
  if (!parseBooleanFlag(item?.is_offer_item, false)) {
    return true;
  }

  if (!parseBooleanFlag(item?.offer_is_active, false)) {
    return false;
  }

  const offerStartDate = normalizeDateValue(item?.offer_start_date);
  const offerEndDate = normalizeDateValue(item?.offer_end_date);

  if (offerStartDate && currentParts.currentDate < offerStartDate) {
    return false;
  }

  if (offerEndDate && currentParts.currentDate > offerEndDate) {
    return false;
  }

  if (parseBooleanFlag(item?.offer_is_24_7, true)) {
    return true;
  }

  const offerStartTime = normalizeTimeValue(item?.offer_start_time);
  const offerEndTime = normalizeTimeValue(item?.offer_end_time);

  if (!offerStartTime || !offerEndTime) {
    return false;
  }

  return currentParts.currentTime >= offerStartTime && currentParts.currentTime <= offerEndTime;
};

const sortItemsForPos = (items) =>
  [...items].sort((left, right) => {
    const leftCategory = Number(left.category || 0);
    const rightCategory = Number(right.category || 0);

    if (leftCategory !== rightCategory) {
      return leftCategory - rightCategory;
    }

    const offerWeightDiff =
      Number(parseBooleanFlag(right.is_offer_item, false)) -
      Number(parseBooleanFlag(left.is_offer_item, false));

    if (offerWeightDiff !== 0) {
      return offerWeightDiff;
    }

    return String(left.name || "").localeCompare(String(right.name || ""));
  });

const assertInvoiceEditable = async (db, invoice_number, client) => {
  // 1️⃣ Check QR
  const qrRes = await db.query(
    `SELECT qr FROM invoice_header WHERE invoice_number = $1`,
    [invoice_number],
  );

  if (qrRes.rows.length === 0) {
    throw new Error("Invoice not found");
  }

  if (qrRes.rows[0].qr !== DEFAULT_QR) {
    throw new Error("Invoice already shared — editing forbidden");
  }

  // 2️⃣ Check refunds
  const refundRes = await db.query(
    `
    SELECT 1
    FROM refund_invoice_header
    WHERE original_invoice_number = $1
    LIMIT 1
    `,
    [invoice_number],
  );

  if (refundRes.rows.length > 0) {
    throw new Error("Invoice has refunds — editing forbidden");
  }
};

// Fetch 100 invoices at a time
const getInvoices = async (db, limit = 100, offset = 0) => {
  const query = `
SELECT 
  ih.invoice_number,
  ih.client,
  ih.total,
  ih.qr,

  EXISTS (
    SELECT 1
    FROM refund_invoice_header rih
    WHERE rih.original_invoice_number = ih.invoice_number
  ) AS has_refund

FROM invoice_header ih
ORDER BY ih.invoice_number DESC
LIMIT $1 OFFSET $2;
  `;
  const result = await db.query(query, [limit, offset]);
  return result.rows;
};

// Fetch invoice details (lines)
const getInvoiceDetails = async (db, invoice_number) => {
  const query = `
    SELECT 
      item_number,
      description,
      qty,
      item_price,
      total
    FROM invoice_lines
    WHERE invoice_number = $1
    ORDER BY item_number ASC
  `;
  const result = await db.query(query, [invoice_number]);
  return result.rows;
};

const getFullInvoice = async (db, invoice_number) => {
  const headerQuery = `
  SELECT 
    invoice_number,
    uuid,
    pos,
    session_id,
    user_id,
    total,
    client,
    notes,
    type,
    qr,
    type2,
    currency,
    client_contact,
    client_detail,
    client_det_code,
    client_id,
    reference,
    TO_CHAR(date, 'YYYY-MM-DD') AS date
  FROM invoice_header
  WHERE invoice_number = $1
`;
  const linesQuery = `
  SELECT
  il.id,
  il.invoice_number,
  il.item_number,
  il.item_price,
  il.discount,
  il.discount_percentage,
  il.tax,
  il.qty,
  il.description,
  il.total,
  il.notes,
  il.item_code,
  il.exempt,
  il.item_id,
  il.unit_number,
  il.storage_id,
  i.is_stocked,
  COALESCE(i.has_tokens, false) AS has_tokens,
  COALESCE(i.token_count, 0) AS token_count,
  COALESCE(i.is_offer_item, false) AS is_offer_item,
  s.name AS storage_name,
  u.name AS unit_name
FROM invoice_lines il
LEFT JOIN items i ON i.id = il.item_id   -- ✅ ADD
LEFT JOIN storages s ON s.id = il.storage_id
LEFT JOIN units u ON u.id = il.unit_number
WHERE il.invoice_number = $1
ORDER BY il.item_number;
`;

  const headerResult = await db.query(headerQuery, [invoice_number]);
  const linesResult = await db.query(linesQuery, [invoice_number]);

  return {
    header: headerResult.rows[0],
    lines: linesResult.rows,
  };
};

const getInvoiceHeaderById = async (db, id) => {
  const result = await db.query(
    `
      SELECT
        id,
        invoice_number,
        uuid,
        date,
        pos,
        total,
        client,
        notes,
        type,
        qr,
        type2,
        currency,
        client_contact,
        client_detail,
        client_det_code,
        client_id,
        reference,
        user_id,
        session_id
      FROM invoice_header
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  );

  return result.rows[0] || null;
};

const updateInvoiceHeader = async (
  db,
  {
    invoice_number,
    client,
    notes,
    type2,
    currency,
    client_contact,
    client_detail,
    client_det_code,
    client_id,
    type,
    date,
  },
) => {
  try {
    await db.query("BEGIN");

    await assertInvoiceEditable(invoice_number, db);

    const sql = `
      UPDATE invoice_header 
      SET 
        client = $1,
        notes = $2,
        type2 = $3,
        currency = $4,
        client_contact = $5,
        client_detail = $6,
        client_det_code = $7,
        client_id = $8,
        type = $9,
        date = COALESCE($10, date),
        updated_at = NOW()
      WHERE invoice_number = $11
      RETURNING *;
    `;

    const values = [
      client,
      notes,
      type2,
      currency,
      client_contact,
      client_detail,
      client_det_code,
      client_id,
      type,
      date || null,
      invoice_number,
    ];

    const result = await db.query(sql, values);

    await db.query("COMMIT");
    return result.rows[0];
  } catch (err) {
    await db.query("ROLLBACK");
    throw err;
  } finally {
  }
};

// Get next invoice serial without inserting anything
const getNextInvoiceNumber = async (db) => {
  const { rows } = await db.query(`
    SELECT invoice_number 
    FROM invoice_header 
    WHERE invoice_number LIKE 'INV-%'
    ORDER BY CAST(SUBSTRING(invoice_number FROM 5)::INT AS INTEGER) DESC 
    LIMIT 1
  `);

  let nextNumber = "INV-001";
  if (rows.length > 0) {
    const last = parseInt(rows[0].invoice_number.replace("INV-", ""), 10);
    nextNumber = `INV-${String(last + 1).padStart(3, "0")}`;
  }
  return nextNumber;
};

// Create invoice (header + lines) in one transaction
const createInvoice = async (
  db,
  {
    invoice_number,
    date,
    pos,
    type,
    client,
    notes,
    reference, // ✅ NEW
    lines,
    type2,
    currency,
    client_contact,
    client_detail,
    client_det_code,
    client_id,
    user_id,
    session_id,
    create_due_balance,
  },
  options = {},
) => {
  const manageTransaction = options.manageTransaction !== false;

  try {
    if (manageTransaction) {
      await db.query("BEGIN");
    }

    const validLines = lines
      .filter((ln) => Number.isInteger(ln.item_id))
      .map((ln, idx) => ({
        ...ln,
        item_number: idx + 1, // ✅ FORCE SEQUENTIAL NUMBERING
      }));

    // ❌ No real items → do NOT save invoice
    if (validLines.length === 0) {
      if (manageTransaction) {
        await db.query("ROLLBACK");
      }
      return null; // or throw new Error("Invoice has no items")
    }
    // Compute total on server for safety
    let headerTotal = 0;
    for (const ln of validLines) {
      const qty = Number(ln.qty || 0);
      const priceIncl = Number(ln.item_price || 0);
      const taxRate = Number(ln.tax || 0) / 100;

      // discount_percentage frontend sends 0–1 or 0–100?
      const discPrc = ln.discount_percentage
        ? Number(ln.discount_percentage)
        : 0;

      // Convert 15% → 0.15 automatically
      const discFactor = discPrc > 1 ? discPrc / 100 : discPrc;

      // Discount VALUE per item (per unit)
      const discountValue = priceIncl * discFactor;

      // Save for DB → discount column stores VALUE per unit
      ln.discount = discountValue; // full precision
      ln.discount_percentage = discFactor; // full precision

      // price excluding tax
      const priceExcl = priceIncl / (1 + taxRate);

      // total excluding discount/tax
      const totalExcl = qty * priceExcl * (1 - discFactor);

      // total INCLUDING tax
      const totalIncl = qty * priceIncl * (1 - discFactor);

      ln._computed_total = totalIncl; // FULL PRECISION
      headerTotal += totalIncl;
    }

    const headerSql = `
  INSERT INTO invoice_header (
    invoice_number,
    date,
    pos,
    type,
    client,
    notes,
    reference,
    total,
    type2,
    currency,
    client_contact,
    client_detail,
    client_det_code,
    client_id,
    user_id,
    session_id
  )
  VALUES (
    $1, COALESCE($2, NOW()), $3, $4, $5, $6, $7, $8,
    $9, $10, $11, $12, $13, $14, $15, $16
  )
  RETURNING invoice_number, pos, total, client, notes, type, date,
            type2, currency, client_contact, client_detail, client_det_code,
            client_id, reference, user_id, session_id, id
`;

    const headerVals = [
      invoice_number,
      date || null,
      pos || "POS-1",
      type || "cash",
      client || "",
      notes || "",
      reference || null, // ✅ NEW
      headerTotal,
      type2 || null,
      currency || "JOD",
      client_contact || null,
      client_detail || null,
      client_det_code || null,
      client_id || null,
      user_id || null,
      session_id || null,
    ];

    const headerRes = await db.query(headerSql, headerVals);

    // 🔥 CREATE DUE BALANCE (IF REQUESTED)
    if (
      create_due_balance === true &&
      type === "credit" &&
      client_id &&
      headerTotal > 0
    ) {
      await db.query(
        `
    INSERT INTO due_balances
      (reason, date, amount, client_id, notes)
    VALUES ($1, $2, $3, $4, $5)
    `,
        [
          invoice_number, // reason
          date || new Date(), // invoice date
          headerTotal, // grand total
          client_id, // client
          `ذمة للفاتورة رقم ${invoice_number}`, // notes
        ],
      );
    }

    const lineSql = `
  INSERT INTO invoice_lines (
    invoice_number,
    item_number,
    item_id,
    item_price,
    discount_percentage,
    tax,
    qty,
    description,
    notes,
    item_code,
    unit_number,
    exempt,
    total,
    storage_id
  )
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
  RETURNING
    item_number,
    description,
    qty,
    item_price,
    discount,
    tax,
    total,
    notes,
    item_code,
    unit_number,
    exempt,
    storage_id;
`;
    const insertedLines = [];
    for (const ln of validLines) {
      let storageId = ln.storage_id ?? null;

      const itemRes = await db.query(
        "SELECT is_stocked, default_storage_id FROM items WHERE id = $1",
        [ln.item_id],
      );

      const isStocked = itemRes.rows[0]?.is_stocked === true;
      const defaultStorage = itemRes.rows[0]?.default_storage_id ?? null;

      if (isStocked && !storageId) {
        storageId = defaultStorage;
      }

      if (isStocked && !storageId) {
        throw new Error(`Stocked item ${ln.item_id} requires a storage`);
      }

      const vals = [
        invoice_number,
        ln.item_number,
        ln.item_id || null,
        ln.item_price,
        ln.discount_percentage,
        ln.tax,
        ln.qty,
        ln.description,
        ln.notes || null,
        ln.item_code || null,
        ln.unit_number || null,
        ln.exempt || false,
        ln._computed_total,
        storageId,
      ];
      const r = await db.query(lineSql, vals);
      insertedLines.push(r.rows[0]);

      if (ln.item_id && storageId) {
        await db.query(
          `SELECT adjust_stock($1,$2,$3,$4,'OUT','invoice',$5,$6)`,
          [
            invoice_number, // transaction_id
            ln.item_id, // item
            storageId, // storage
            ln.qty, // qty
            date, // ✅ invoice date
            `Invoice ${invoice_number}`, // notes
          ],
        );
      }
    }

    if (manageTransaction) {
      await db.query("COMMIT");
    }
    return { header: headerRes.rows[0], lines: insertedLines };
  } catch (err) {
    if (manageTransaction) {
      await db.query("ROLLBACK");
    }
    throw err;
  } finally {
  }
};

const searchInvoices = async (db, query, limit = 100, offset = 0) => {
  const sql = `
  SELECT 
    invoice_number,
    pos,
    total,
    qr,
    TO_CHAR(date, 'YYYY-MM-DD HH24:MI') AS date
  FROM invoice_header
  WHERE invoice_number ILIKE $1
  ORDER BY date DESC
  LIMIT $2 OFFSET $3
  `;
  const result = await db.query(sql, [`%${query}%`, limit, offset]);
  return result.rows;
};

const saveCompanyConfig = async (
  db,
  {
    company_name,
    tax_number,
    tax_serial,
    client_id,
    secret_key,
    logo_url,
    phone_number,
    company_location,
    email,
    invoice_terms,
    auto_pos_einvoicing, // ✅ NEW
  },
) => {
  const existing = await db.query(`SELECT id FROM company_config LIMIT 1`);

  // =========================
  // UPDATE EXISTING CONFIG
  // =========================
  if (existing.rows.length > 0) {
    const id = existing.rows[0].id;

    const result = await db.query(
      `
      UPDATE company_config
      SET
        company_name        = $1,
        tax_number          = $2,
        tax_serial          = $3,
        client_id           = $4,
        secret_key          = $5,
        logo_url            = COALESCE($6, logo_url),
        phone_number        = $7,
        company_location    = $8,
        email               = $9,
        invoice_terms       = $10,
        auto_pos_einvoicing = COALESCE($11, auto_pos_einvoicing),
        updated_at          = NOW()
      WHERE id = $12
      RETURNING *;
      `,
      [
        company_name,
        tax_number,
        tax_serial,
        client_id,
        secret_key,
        logo_url || null,
        phone_number || null,
        company_location || null,
        email || null,
        invoice_terms || null,
        auto_pos_einvoicing ?? null,
        id,
      ],
    );

    return result.rows[0];
  }

  // =========================
  // INSERT FIRST CONFIG
  // =========================
  const result = await db.query(
    `
    INSERT INTO company_config
      (
        company_name,
        tax_number,
        tax_serial,
        client_id,
        secret_key,
        logo_url,
        phone_number,
        company_location,
        email,
        invoice_terms,
        auto_pos_einvoicing
      )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    RETURNING *;
    `,
    [
      company_name,
      tax_number,
      tax_serial,
      client_id,
      secret_key,
      logo_url || null,
      phone_number || null,
      company_location || null,
      email || null,
      invoice_terms || null,
      auto_pos_einvoicing ?? true, // ✅ default ON
    ],
  );

  return result.rows[0];
};

const getCompanyConfig = async (db) => {
  const result = await db.query(
    `SELECT * FROM company_config ORDER BY id DESC LIMIT 1`,
  );

  const company = result.rows[0] || null;
  if (!company) return null;

  if (company.logo_url) {
    company.logo_url = await getCompanyLogoSignedUrl(db, company.logo_url);
  }

  return company;
};

// Daily KPIs for a given date
const getDailyStats = async (db, date) => {
  const query = `
    SELECT 
      COALESCE(SUM(total),0) AS total_income,
      COUNT(DISTINCT invoice_number) AS total_invoices,
      COUNT(DISTINCT client) AS total_clients
    FROM invoice_header
    WHERE DATE(date) = $1
  `;
  const { rows } = await db.query(query, [date]);
  return rows[0];
};

// Hourly sales count (activity)
const getHourlySales = async (db, date) => {
  const query = `
    SELECT
      TO_CHAR(date, 'HH24') AS hour_24,
      COUNT(*) AS invoice_count
    FROM invoice_header
    WHERE DATE(date) = $1
    GROUP BY hour_24
    ORDER BY hour_24;
  `;
  const { rows } = await db.query(query, [date]);

  // Fill missing hours (10 AM – 10 PM)
  const formatted = [];
  for (let hour = 10; hour <= 22; hour++) {
    const found = rows.find((r) => parseInt(r.hour_24, 10) === hour);
    const displayHour = ((hour + 11) % 12) + 1 + (hour >= 12 ? " PM" : " AM");
    formatted.push({
      hour: displayHour,
      sales: found ? parseInt(found.invoice_count, 10) : 0,
    });
  }

  return formatted;
};

const getInvoicesByDate = async (db, date) => {
  const sql = `
    SELECT 
      invoice_number,
      pos,
      total,
      qr,
      TO_CHAR(date, 'YYYY-MM-DD HH24:MI') AS date
    FROM invoice_header
    WHERE date >= $1::date
      AND date < ($1::date + INTERVAL '1 day')
    ORDER BY date ASC;
  `;
  const { rows } = await db.query(sql, [date]);
  return rows;
};

const getNextReturnInvoiceNumber = async (db) => {
  const result = await db.query(`
    SELECT return_invoice_number
    FROM void_invoices
    ORDER BY id DESC
    LIMIT 1
  `);

  if (result.rows.length === 0) return "RET-001";

  const last = result.rows[0].return_invoice_number;
  const num = parseInt(last.replace("RET-", ""), 10);
  return `RET-${String(num + 1).padStart(3, "0")}`;
};

const saveVoidInvoices = async (db, invoiceNumbers) => {
  const results = [];

  for (const original of invoiceNumbers) {
    const returnNo = await getNextReturnInvoiceNumber(db);

    const insertSql = `
      INSERT INTO void_invoices 
        (original_invoice_number, return_invoice_number)
      VALUES ($1, $2)
      RETURNING *;
    `;

    const res = await db.query(insertSql, [original, returnNo]);
    results.push(res.rows[0]);
  }

  return results;
};

const getVoidedInvoicesByDate = async (db, date) => {
  const sql = `
SELECT
  v.id,
  v.original_invoice_number,
  v.return_invoice_number,
  v.return_uuid,
  v.qrcode_response,
  TO_CHAR(v.created_at, 'YYYY-MM-DD HH24:MI') AS voided_at,

  h.pos,
  h.total,
  TO_CHAR(h.date, 'YYYY-MM-DD HH24:MI') AS original_date

FROM void_invoices v
LEFT JOIN invoice_header h
  ON h.invoice_number = v.original_invoice_number

WHERE DATE(h.date) = $1
ORDER BY v.created_at ASC;
  `;

  const result = await db.query(sql, [date]);
  return result.rows;
};

const getInvoiceForReturn = async (db, invoice_number) => {
  const headerQuery = `
    SELECT 
      invoice_number,
      uuid,
      date,
      pos,
      total,
      client,
      notes,
      type,
      type2,
      currency
    FROM invoice_header
    WHERE invoice_number = $1
  `;

  const linesQuery = `
    SELECT 
      item_number,
      description AS item_name,
      qty,
      item_price AS price,
      discount,
      discount_percentage,
      tax,
      total
    FROM invoice_lines
    WHERE invoice_number = $1
    ORDER BY item_number ASC
  `;

  const headerResult = await db.query(headerQuery, [invoice_number]);
  const linesResult = await db.query(linesQuery, [invoice_number]);

  return {
    header: headerResult.rows[0],
    lines: linesResult.rows,
  };
};

const saveVoidInvoiceQR = async (db, return_invoice_number, qr) => {
  const query = `
    UPDATE void_invoices
    SET qrcode_response = $2
    WHERE return_invoice_number = $1
    RETURNING *;
  `;
  const result = await db.query(query, [return_invoice_number, qr]);
  return result.rows[0];
};

const getUnsharedInvoices = async (db, date) => {
  const sql = `
    SELECT 
      invoice_number,
      pos,
      total,
      TO_CHAR(date, 'YYYY-MM-DD HH24:MI') AS date
    FROM invoice_header
    WHERE DATE(date) = $1
      AND (qr = $2 OR qr IS NULL)
    ORDER BY date ASC;
  `;
  const res = await db.query(sql, [date, DEFAULT_QR]);
  return res.rows;
};

const saveInvoiceQR = async (db, invoice_number, qr) => {
  const sql = `
    UPDATE invoice_header
    SET qr = $2, updated_at = NOW()
    WHERE invoice_number = $1
    RETURNING *;
  `;
  const res = await db.query(sql, [invoice_number, qr]);
  return res.rows[0];
};

const getPosCounts = async (db, date) => {
  const sql = `
    SELECT 
      pos,
      COUNT(*) AS sales_count
    FROM invoice_header
    WHERE DATE(date) = $1
    GROUP BY pos
    ORDER BY pos ASC;
  `;

  const { rows } = await db.query(sql, [date]);
  return rows;
};

const getLast7DaysIncome = async (db, date) => {
  const sql = `
    SELECT
      TO_CHAR(d.day, 'YYYY-MM-DD') AS day,
      COALESCE(SUM(i.total), 0) AS income
    FROM (
      SELECT generate_series(
        ($1::date - INTERVAL '6 days'),
        $1::date,
        INTERVAL '1 day'
      ) AS day
    ) d
    LEFT JOIN invoice_header i
      ON DATE(i.date) = DATE(d.day)
    GROUP BY d.day
    ORDER BY d.day;
  `;

  const { rows } = await db.query(sql, [date]);
  return rows;
};

const getAllClients = async (db) => {
  const sql = `
    SELECT 
      id,
      name,
      phone,
      detail_type,
      detail_value
    FROM clients
    ORDER BY id ASC;
  `;
  const result = await db.query(sql);
  return result.rows;
};

const updateInvoiceFull = async (db, invoice_number, header, lines) => {
  try {
    await db.query("BEGIN");

    // ❌ REMOVE THIS LINE - we'll check manually below
    // await assertInvoiceEditable(db, invoice_number);

    // ✅ CHECK IF INVOICE IS LOCKED
    const qrRes = await db.query(
      `SELECT qr FROM invoice_header WHERE invoice_number = $1`,
      [invoice_number],
    );

    if (qrRes.rows.length === 0) {
      throw new Error("Invoice not found");
    }

    const isLocked = qrRes.rows[0].qr !== "123456789";

    // ✅ CHECK IF REFUNDS EXIST
    const refundRes = await db.query(
      `SELECT 1 FROM refund_invoice_header WHERE original_invoice_number = $1 LIMIT 1`,
      [invoice_number],
    );

    const hasRefunds = refundRes.rows.length > 0;

    // ✅ IF LOCKED/HAS_REFUNDS → ONLY ALLOW NOTES UPDATE
    if (isLocked || hasRefunds) {
      // Only update header notes field
      const headerSql = `
  UPDATE invoice_header
  SET notes=$1, reference=$2, updated_at=NOW()
  WHERE invoice_number=$3
  RETURNING *;
`;

      await db.query(headerSql, [
        header.notes,
        header.reference || null,
        invoice_number,
      ]);

      // Update line item notes only
      for (const ln of lines) {
        await db.query(
          `UPDATE invoice_lines 
           SET notes = $1 
           WHERE invoice_number = $2 AND item_number = $3`,
          [ln.notes || null, invoice_number, ln.item_number],
        );
      }

      await db.query("COMMIT");
      return { invoice_number, message: "Notes updated successfully" };
    }

    // ✅ IF NOT LOCKED → FULL UPDATE (existing code)
    // 1) Update header
    const headerSql = `
  UPDATE invoice_header
  SET client=$1, notes=$2, reference=$3, type2=$4, currency=$5,
      client_contact=$6, client_detail=$7, client_det_code=$8,
      client_id=$9, type=$10, date=$11, updated_at=NOW()
  WHERE invoice_number=$12
  RETURNING *;
`;

    await db.query(headerSql, [
      header.client,
      header.notes,
      header.reference || null, // ✅ NEW
      header.type2,
      header.currency,
      header.client_contact,
      header.client_detail,
      header.client_det_code,
      header.client_id,
      header.type,
      header.date,
      invoice_number,
    ]);

    // 🔄 REVERT OLD STOCK (IN)
    const oldLines = await db.query(
      `
      SELECT item_id, storage_id, qty
      FROM invoice_lines
      WHERE invoice_number = $1
      `,
      [invoice_number],
    );

    for (const ln of oldLines.rows) {
      if (ln.item_id && ln.storage_id) {
        await db.query(
          `SELECT adjust_stock($1,$2,$3,$4,'IN','invoice-edit',$5,$6)`,
          [
            `${invoice_number}-REV`,
            ln.item_id,
            ln.storage_id,
            ln.qty,
            header.date, // ✅ invoice date
            `Revert invoice ${invoice_number}`,
          ],
        );
      }
    }

    // 2) Delete old lines
    await db.query(`DELETE FROM invoice_lines WHERE invoice_number=$1`, [
      invoice_number,
    ]);

    // 3) Insert updated lines
    let headerTotal = 0;

    for (const ln of lines) {
      const qty = Number(ln.qty || 0);
      const priceIncl = Number(ln.item_price || 0);
      const taxRate = Number(ln.tax || 0) / 100;
      const discFactor = ln.discount_percentage || 0;
      let storageId = ln.storage_id ?? null;

      const itemRes = await db.query(
        "SELECT is_stocked, default_storage_id FROM items WHERE id = $1",
        [ln.item_id],
      );
      // comment
      const isStocked = itemRes.rows[0]?.is_stocked === true;
      const defaultStorage = itemRes.rows[0]?.default_storage_id ?? null;

      if (isStocked && !storageId) {
        storageId = defaultStorage;
      }

      if (isStocked && !storageId) {
        throw new Error(`Stocked item ${ln.item_id} requires a storage`);
      }

      const totalIncl = qty * priceIncl * (1 - discFactor);
      headerTotal += totalIncl;

      await db.query(
        `
        INSERT INTO invoice_lines (
          invoice_number,
          item_number,
          item_id,
          item_price,
          discount,
          tax,
          qty,
          description,
          total,
          discount_percentage,
          notes,
          item_code,
          unit_number,
          exempt,
          storage_id
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15
        )
        `,
        [
          invoice_number,
          ln.item_number,
          ln.item_id || null,
          priceIncl,
          priceIncl * discFactor,
          ln.tax,
          ln.qty,
          ln.description || "",
          totalIncl,
          discFactor,
          ln.notes || null,
          ln.item_code || null,
          typeof ln.unit_number === "number" ? ln.unit_number : null,
          ln.exempt || false,
          storageId,
        ],
      );

      // 🔻 APPLY NEW STOCK (OUT)
      if (ln.item_id && storageId) {
        await db.query(
          `SELECT adjust_stock($1,$2,$3,$4,'OUT','invoice-edit',$5,$6)`,
          [
            invoice_number,
            ln.item_id,
            storageId,
            qty,
            header.date, // ✅ same invoice date
            `Updated invoice ${invoice_number}`,
          ],
        );
      }
    }

    // Update header total
    await db.query(
      "UPDATE invoice_header SET total=$1 WHERE invoice_number=$2",
      [headerTotal, invoice_number],
    );

    await db.query("COMMIT");

    return { invoice_number, headerTotal };
  } catch (err) {
    await db.query("ROLLBACK");
    throw err;
  }
};

const getAllCategories = async (db) => {
  const sql = `
    SELECT c.id, c.name,
           COUNT(i.id) AS items_count
    FROM categories c
    LEFT JOIN items i ON i.category = c.id
    GROUP BY c.id
    ORDER BY c.id ASC;
  `;
  const result = await db.query(sql);
  return result.rows;
};

const getItemsByCategory = async (db, categoryId) => {
  const sql = `
    SELECT 
      i.id,
      i.category,
      i.code,
      i.name,
      i.price_with_tax,
      i.tax_percentage,
      i.stock_qty,
      i.fav,
      COALESCE(i.has_tokens, false) AS has_tokens,
      COALESCE(i.token_count, 0) AS token_count,
      COALESCE(i.is_offer_item, false) AS is_offer_item,
      COALESCE(i.offer_is_active, false) AS offer_is_active,
      COALESCE(i.offer_is_24_7, true) AS offer_is_24_7,
      i.offer_start_time,
      i.offer_end_time,
      i.offer_start_date,
      i.offer_end_date,
      c.name AS category_name,
      u.name AS unit_name
    FROM items i
    LEFT JOIN categories c ON c.id = i.category
    LEFT JOIN units u ON u.id = i.unit
    WHERE i.category = $1
    ORDER BY i.id ASC;
  `;

  const result = await db.query(sql, [categoryId]);
  return result.rows;
};

const getFavoriteItems = async (db) => {
  const sql = `
    SELECT 
      i.id,
      i.category,
      i.code,
      i.name,
      i.price_with_tax,
      i.tax_percentage,
      i.stock_qty,
      i.fav,
      COALESCE(i.has_tokens, false) AS has_tokens,
      COALESCE(i.token_count, 0) AS token_count,
      COALESCE(i.is_offer_item, false) AS is_offer_item,
      COALESCE(i.offer_is_active, false) AS offer_is_active,
      COALESCE(i.offer_is_24_7, true) AS offer_is_24_7,
      i.offer_start_time,
      i.offer_end_time,
      i.offer_start_date,
      i.offer_end_date,
      c.name AS category_name,
      u.name AS unit_name
    FROM items i
    LEFT JOIN categories c ON c.id = i.category
    LEFT JOIN units u ON u.id = i.unit
    WHERE i.fav = true
    ORDER BY i.id ASC;
  `;
  const result = await db.query(sql);
  return result.rows;
};

const toggleFavoriteItem = async (db, itemId) => {
  const sql = `
    UPDATE items
    SET fav = NOT fav
    WHERE id = $1
    RETURNING id, fav;
  `;
  const result = await db.query(sql, [itemId]);
  return result.rows[0];
};

const getAllUnits = async (db) => {
  const sql = `
    SELECT id, name, description
    FROM units
    ORDER BY id ASC;
  `;
  const res = await db.query(sql);
  return res.rows;
};

const createUnit = async (db, { name, description }) => {
  const sql = `
    INSERT INTO units (name, description)
    VALUES ($1, $2)
    RETURNING id, name, description;
  `;
  const res = await db.query(sql, [name, description]);
  return res.rows[0];
};

const updateUnit = async (db, id, { name, description }) => {
  const sql = `
    UPDATE units
    SET name = $1,
        description = $2
    WHERE id = $3
    RETURNING id, name, description;
  `;
  const res = await db.query(sql, [name, description, id]);
  return res.rows[0];
};

const createCategory = async (db, { name }) => {
  const sql = `
    INSERT INTO categories (name)
    VALUES ($1)
    RETURNING id, name, created_at;
  `;
  const res = await db.query(sql, [name]);
  return res.rows[0];
};

const updateCategory = async (db, id, { name }) => {
  const lockedCategory = await db.query(
    `
      SELECT COALESCE(is_system_locked, false) AS is_system_locked
      FROM categories
      WHERE id = $1
    `,
    [id],
  );

  if (lockedCategory.rows[0]?.is_system_locked) {
    throw createItemValidationError("This category is system-required and cannot be edited");
  }

  const sql = `
    UPDATE categories
    SET name = $1
    WHERE id = $2
    RETURNING id, name, created_at;
  `;
  const res = await db.query(sql, [name, id]);
  return res.rows[0];
};

const createItem = async (db, data) => {
  try {
    await db.query("BEGIN");

    const tokenConfig = normalizeItemTokenConfig(data);
    const offerConfig = normalizeItemOfferConfig(data);

    if (!data.is_stocked) {
      data.minimum_qty_alert = 0;
    }

    const itemSql = `
      INSERT INTO items (
        code, name, price_with_tax, tax_percentage,
        category, fav, unit, minimum_qty_alert, stock_qty,
        usual_discount_percentage, usual_sales_qty, notes,
        is_stocked,
        default_storage_id,
        has_tokens,
        token_count,
        is_offer_item,
        offer_is_active,
        offer_is_24_7,
        offer_start_time,
        offer_end_time,
        offer_start_date,
        offer_end_date
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,0,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
      RETURNING *;
    `;

    const itemRes = await db.query(itemSql, [
      data.code || null,
      data.name,
      data.price_with_tax,
      data.tax_percentage,
      data.category,
      data.fav || false,
      data.unit,
      data.minimum_qty_alert || 0,
      data.usual_discount_percentage || 0,
      data.usual_sales_qty || 1,
      data.notes || null,
      data.is_stocked ?? true,
      data.default_storage_id || null,
      tokenConfig.has_tokens,
      tokenConfig.token_count,
      offerConfig.is_offer_item,
      offerConfig.offer_is_active,
      offerConfig.offer_is_24_7,
      offerConfig.offer_start_time,
      offerConfig.offer_end_time,
      offerConfig.offer_start_date,
      offerConfig.offer_end_date,
    ]);

    const item = itemRes.rows[0];

    // Initial stock per storage (ONLY if stocked)
    if (item.is_stocked && Array.isArray(data.storages)) {
      const initDate =
        data.initial_stock_date || new Date().toISOString().slice(0, 10); // YYYY-MM-DD

      for (const s of data.storages) {
        if (!s.qty || s.qty <= 0) continue;

        await db.query(`SELECT adjust_stock($1,$2,$3,$4,'IN','init',$5,$6)`, [
          `INIT-${item.id}`,
          item.id,
          s.storage_id,
          s.qty,
          initDate, // ✅ NEW (date)
          "Initial stock on item creation",
        ]);
      }
    }

    await db.query("COMMIT");
    return item;
  } catch (err) {
    await db.query("ROLLBACK");
    throw err;
  } finally {
  }
};

const getItemById = async (db, id) => {
  const sql = `
SELECT 
  i.id,
  i.code,
  i.name,
  i.price_with_tax,
  i.tax_percentage,
  i.category,
  i.fav,
  i.unit,
  u.name AS unit_name,
  i.minimum_qty_alert,
  i.stock_qty,
  i.usual_discount_percentage,
  i.usual_sales_qty,
  i.notes,
  i.is_stocked,
  i.default_storage_id,
  COALESCE(i.has_tokens, false) AS has_tokens,
  COALESCE(i.token_count, 0) AS token_count,
  COALESCE(i.is_offer_item, false) AS is_offer_item,
  COALESCE(i.offer_is_active, false) AS offer_is_active,
  COALESCE(i.offer_is_24_7, true) AS offer_is_24_7,
  i.offer_start_time,
  i.offer_end_time,
  i.offer_start_date,
  i.offer_end_date
FROM items i
LEFT JOIN units u ON u.id = i.unit
WHERE i.id = $1
  `;
  const res = await db.query(sql, [id]);
  return res.rows[0];
};

const updateItem = async (db, id, data) => {
  const lockedItem = await db.query(
    `
      SELECT COALESCE(is_system_locked, false) AS is_system_locked
      FROM items
      WHERE id = $1
    `,
    [id],
  );

  if (lockedItem.rows[0]?.is_system_locked) {
    throw createItemValidationError("This item is system-required and cannot be edited");
  }

  const tokenConfig = normalizeItemTokenConfig(data);
  const offerConfig = normalizeItemOfferConfig(data);
  const sql = `
    UPDATE items
SET code=$1,
    name=$2,
    price_with_tax=$3,
    tax_percentage=$4,
    category=$5,
    fav=$6,
    unit=$7,
    minimum_qty_alert=$8,
    usual_discount_percentage=$9,
    usual_sales_qty=$10,
    notes=$11,
    is_stocked=$12,
    default_storage_id=$13,
    has_tokens=$14,
    token_count=$15,
    is_offer_item=$16,
    offer_is_active=$17,
    offer_is_24_7=$18,
    offer_start_time=$19,
    offer_end_time=$20,
    offer_start_date=$21,
    offer_end_date=$22
WHERE id=$23
RETURNING *;
  `;
  const res = await db.query(sql, [
    data.code,
    data.name,
    data.price_with_tax,
    data.tax_percentage,
    data.category,
    data.fav,
    data.unit,
    data.is_stocked ? data.minimum_qty_alert : 0,
    data.usual_discount_percentage,
    data.usual_sales_qty,
    data.notes,
    data.is_stocked ?? true,
    data.default_storage_id || null,
    tokenConfig.has_tokens,
    tokenConfig.token_count,
    offerConfig.is_offer_item,
    offerConfig.offer_is_active,
    offerConfig.offer_is_24_7,
    offerConfig.offer_start_time,
    offerConfig.offer_end_time,
    offerConfig.offer_start_date,
    offerConfig.offer_end_date,
    id,
  ]);
  return res.rows[0];
};

const getAllStorages = async (db) => {
  const sql = `
    SELECT id, name, location, created_at
    FROM storages
    ORDER BY id ASC;
  `;
  const res = await db.query(sql);
  return res.rows;
};

const createStorage = async (db, { name }) => {
  const sql = `
    INSERT INTO storages (name)
    VALUES ($1)
    RETURNING id, name, created_at;
  `;
  const res = await db.query(sql, [name]);
  return res.rows[0];
};

const updateStorage = async (db, id, { name }) => {
  const sql = `
    UPDATE storages
    SET name = $1
    WHERE id = $2
    RETURNING id, name, created_at;
  `;
  const res = await db.query(sql, [name, id]);
  return res.rows[0];
};

const getStorageOverview = async (db) => {
  const sql = `
    SELECT
      s.id,
      s.name,
      s.location,
      COUNT(si.item_id) AS items_count,
      COALESCE(SUM(si.qty), 0) AS total_qty
    FROM storages s
    LEFT JOIN storage_items si ON si.storage_id = s.id
    GROUP BY s.id, s.location
    ORDER BY s.id;
  `;
  const res = await db.query(sql);
  return res.rows;
};

const getStorageItems = async (db, storageId) => {
  const sql = `
    SELECT
    i.id AS item_id,
    i.code,
    i.name,
    u.name AS unit_name,
    si.qty
    FROM storage_items si
    JOIN items i ON i.id = si.item_id
    LEFT JOIN units u ON u.id = i.unit
    WHERE si.storage_id = $1
    ORDER BY i.name;
  `;
  const res = await db.query(sql, [storageId]);
  return res.rows;
};

const getStorageLogs = async (
  db,
  { limit = 100, offset = 0, dateFrom = null, dateTo = null },
) => {
  const params = [];
  let where = "";

  if (dateFrom && dateTo) {
    params.push(dateFrom, dateTo);
    where = `
      WHERE tl.created_at >= $${params.length - 1}::date
        AND tl.created_at < ($${params.length}::date + interval '1 day')
    `;
  }

  params.push(limit, offset);

  const sql = `
    SELECT
      tl.id,
      TO_CHAR(tl.created_at, 'YYYY-MM-DD HH24:MI') AS date,

      i.id   AS item_id,
      i.code AS item_code,
      i.name AS item_name,
      u.name AS unit_name,

      s.name AS storage_name,

      tl.direction,
      tl.qty,
      tl.type,
      tl.transaction_id,
      tl.notes
    FROM transaction_logs tl
    JOIN items i ON i.id = tl.item_id
    LEFT JOIN units u ON u.id = i.unit
    JOIN storages s ON s.id = tl.storage_id
    ${where}
    ORDER BY tl.created_at DESC
    LIMIT $${params.length - 1}
    OFFSET $${params.length};
  `;

  const res = await db.query(sql, params);
  return res.rows;
};

const adjustStorageManually = async (
  db,
  {
    item_id,
    qty,
    type, // IN | OUT | TRANSFER
    from_storage_id,
    to_storage_id,
    notes,
    date, // ✅ NEW
  },
) => {
  try {
    await db.query("BEGIN");

    const txId = `MAN-${Date.now()}`;
    const txDate = date || new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    if (type === "IN") {
      await db.query(`SELECT adjust_stock($1,$2,$3,$4,'IN','manual',$5,$6)`, [
        txId,
        item_id,
        to_storage_id,
        qty,
        txDate,
        notes,
      ]);
    }

    if (type === "OUT") {
      await db.query(`SELECT adjust_stock($1,$2,$3,$4,'OUT','manual',$5,$6)`, [
        txId,
        item_id,
        from_storage_id,
        qty,
        txDate,
        notes,
      ]);
    }

    if (type === "TRANSFER") {
      // OUT
      await db.query(
        `SELECT adjust_stock($1,$2,$3,$4,'OUT','transfer',$5,$6)`,
        [txId, item_id, from_storage_id, qty, txDate, notes],
      );

      // IN
      await db.query(`SELECT adjust_stock($1,$2,$3,$4,'IN','transfer',$5,$6)`, [
        txId,
        item_id,
        to_storage_id,
        qty,
        txDate,
        notes,
      ]);
    }

    await db.query("COMMIT");
  } catch (err) {
    await db.query("ROLLBACK");
    throw err;
  } finally {
  }
};

const getAllItems = async (db, { context = null } = {}) => {
  const { rows } = await db.query(`
    SELECT
      i.*,
      COALESCE(i.has_tokens, false) AS has_tokens,
      COALESCE(i.token_count, 0) AS token_count,
      COALESCE(i.is_offer_item, false) AS is_offer_item,
      COALESCE(i.offer_is_active, false) AS offer_is_active,
      COALESCE(i.offer_is_24_7, true) AS offer_is_24_7,
      u.name AS unit_name
    FROM items i
    LEFT JOIN units u ON u.id = i.unit
    ORDER BY i.name
  `);

  if (context !== "pos") {
    return rows;
  }

  const currentParts = getCurrentLocalOfferParts();

  return sortItemsForPos(
    rows.filter((item) => isOfferItemCurrentlyAvailable(item, currentParts)),
  );
};

const assertPosItemsCurrentlySellable = async (db, lines = []) => {
  const itemIds = [
    ...new Set(
      lines
        .map((line) => Number.parseInt(line?.item_id, 10))
        .filter((itemId) => Number.isInteger(itemId) && itemId > 0),
    ),
  ];

  if (itemIds.length === 0) {
    return;
  }

  const result = await db.query(
    `
      SELECT
        id,
        name,
        COALESCE(is_offer_item, false) AS is_offer_item,
        COALESCE(offer_is_active, false) AS offer_is_active,
        COALESCE(offer_is_24_7, true) AS offer_is_24_7,
        offer_start_time,
        offer_end_time,
        offer_start_date,
        offer_end_date
      FROM items
      WHERE id = ANY($1::int[])
    `,
    [itemIds],
  );

  const itemsById = new Map(result.rows.map((item) => [Number(item.id), item]));
  const currentParts = getCurrentLocalOfferParts();

  for (const itemId of itemIds) {
    const item = itemsById.get(itemId);

    if (!item) {
      throw createPosItemError(`Item ${itemId} was not found`, "POS_ITEM_NOT_FOUND", 404);
    }

    if (!isOfferItemCurrentlyAvailable(item, currentParts)) {
      throw createPosItemError(
        `${item.name || `Item ${itemId}`} is not available for sale right now`,
        "POS_ITEM_UNAVAILABLE",
        409,
      );
    }
  }
};

// ================= CLIENTS =================

const createClient = async (db, data) => {
  const sql = `
    INSERT INTO clients (
      name,
      phone,
      email,
      location,
      dob,
      notes,
      detail_type,
      detail_value
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING *;
  `;

  const values = [
    data.name,
    data.phone || null,
    data.email || null,
    data.location || null,
    data.dob || null,
    data.notes || null,
    data.detail_type || null,
    data.detail_value || null,
  ];

  const res = await db.query(sql, values);
  return res.rows[0];
};

const updateClient = async (db, id, data) => {
  const sql = `
    UPDATE clients
    SET
      name = $1,
      phone = $2,
      email = $3,
      location = $4,
      dob = $5,
      notes = $6,
      detail_type = $7,
      detail_value = $8,
      updated_at = NOW()
    WHERE id = $9
    RETURNING *;
  `;

  const values = [
    data.name,
    data.phone || null,
    data.email || null,
    data.location || null,
    data.dob || null,
    data.notes || null,
    data.detail_type || null,
    data.detail_value || null,
    id,
  ];

  const res = await db.query(sql, values);
  return res.rows[0];
};

const deleteClient = async (db, id) => {
  await db.query(`DELETE FROM clients WHERE id = $1`, [id]);
};

const getClientById = async (db, id) => {
  const sql = `
    SELECT *
    FROM clients
    WHERE id = $1
  `;
  const res = await db.query(sql, [id]);
  return res.rows[0];
};

const getClientMonthlyTotals = async (db, clientId, year) => {
  const sql = `
    SELECT
      m.month_num,
      TO_CHAR(TO_DATE(m.month_num::text, 'MM'), 'Mon') AS month,
      COALESCE(SUM(h.total), 0) AS total
    FROM (
      SELECT generate_series(1, 12) AS month_num
    ) m
    LEFT JOIN invoice_header h
      ON h.client_id = $1
     AND EXTRACT(YEAR FROM h.date) = $2
     AND EXTRACT(MONTH FROM h.date) = m.month_num
    GROUP BY m.month_num
    ORDER BY m.month_num;
  `;

  const res = await db.query(sql, [clientId, year]);
  return res.rows;
};

const getClientMonthlySalesCount = async (db, clientId, year) => {
  const sql = `
    SELECT
      m.month_num,
      TO_CHAR(TO_DATE(m.month_num::text, 'MM'), 'Mon') AS month,
      COALESCE(COUNT(h.id), 0) AS count
    FROM (
      SELECT generate_series(1, 12) AS month_num
    ) m
    LEFT JOIN invoice_header h
      ON h.client_id = $1
     AND EXTRACT(YEAR FROM h.date) = $2
     AND EXTRACT(MONTH FROM h.date) = m.month_num
    GROUP BY m.month_num
    ORDER BY m.month_num;
  `;

  const res = await db.query(sql, [clientId, year]);
  return res.rows;
};

const getClientLastInvoices = async (db, clientId, limit = 10) => {
  const sql = `
    SELECT
      invoice_number,
      TO_CHAR(date, 'YYYY-MM-DD HH24:MI') AS date,
      total
    FROM invoice_header
    WHERE client_id = $1
    ORDER BY date DESC
    LIMIT $2;
  `;

  const res = await db.query(sql, [clientId, limit]);
  return res.rows;
};

const getClientInvoicesByDateRange = async (db, clientId, from, to) => {
  const sql = `
    SELECT
      invoice_number,
      TO_CHAR(date, 'YYYY-MM-DD HH24:MI') AS date,
      total
    FROM invoice_header
    WHERE client_id = $1
      AND date >= $2
      AND date < ($3::date + interval '1 day')
    ORDER BY date DESC;
  `;
  const res = await db.query(sql, [clientId, from, to]);
  return res.rows;
};

const searchItemsGlobal = async (db, q, limit = 20) => {
  const isNumber = /^\d+$/.test(q);

  const sql = `
    SELECT
      i.id,
      i.code,
      i.name,
      i.price_with_tax,
      i.stock_qty,
      COALESCE(i.has_tokens, false) AS has_tokens,
      COALESCE(i.token_count, 0) AS token_count,
      COALESCE(i.is_offer_item, false) AS is_offer_item,
      COALESCE(i.offer_is_active, false) AS offer_is_active,
      COALESCE(i.offer_is_24_7, true) AS offer_is_24_7,
      i.offer_start_time,
      i.offer_end_time,
      i.offer_start_date,
      i.offer_end_date,
      c.name AS category_name,
      u.name AS unit_name
    FROM items i
    LEFT JOIN categories c ON c.id = i.category
    LEFT JOIN units u ON u.id = i.unit
    WHERE
      i.name ILIKE $1
      OR i.code ILIKE $1
      OR ($2::int IS NOT NULL AND i.id = $2)
    ORDER BY i.name
    LIMIT $3;
  `;

  const params = [`%${q}%`, isNumber ? Number(q) : null, limit];

  const res = await db.query(sql, params);
  return res.rows;
};

// =======================
// REFUND INVOICES
// =======================

const getNextRefundInvoiceNumber = async (db) => {
  const { rows } = await db.query(`
    SELECT refund_invoice_number
    FROM refund_invoice_header
    WHERE refund_invoice_number LIKE 'RFD-%'
    ORDER BY CAST(SUBSTRING(refund_invoice_number FROM 5)::INT AS INTEGER) DESC
    LIMIT 1
  `);

  if (rows.length === 0) return "RFD-001";

  const last = rows[0].refund_invoice_number;
  const num = parseInt(last.replace("RFD-", ""), 10);
  return `RFD-${String(num + 1).padStart(3, "0")}`;
};

const getRefundSummaryForOriginal = async (db, originalInvoiceNumber) => {
  const sql = `
    SELECT
      ril.item_number,
      COALESCE(SUM(ril.refund_qty), 0) AS refunded_qty
    FROM refund_invoice_header rih
    JOIN refund_invoice_lines ril
      ON ril.refund_invoice_number = rih.refund_invoice_number
    WHERE rih.original_invoice_number = $1
    GROUP BY ril.item_number
    ORDER BY ril.item_number;
  `;
  const res = await db.query(sql, [originalInvoiceNumber]);
  return res.rows;
};

const getRefundInvoices = async (db, limit = 100, offset = 0) => {
  const sql = `
    SELECT
      refund_invoice_number,
      original_invoice_number,
      total,
      qr,
      TO_CHAR(refund_date, 'YYYY-MM-DD HH24:MI') AS refund_date,
      refund_reason
    FROM refund_invoice_header
    ORDER BY refund_date DESC
    LIMIT $1 OFFSET $2;
  `;
  const res = await db.query(sql, [limit, offset]);
  return res.rows;
};

const getRefundFullInvoice = async (db, refund_invoice_number) => {
  const headerSql = `
 SELECT
    rih.refund_invoice_number,
    rih.refund_uuid,
    rih.original_invoice_number,
    rih.refund_reason,
    rih.total,
    rih.qr,
    TO_CHAR(rih.refund_date, 'YYYY-MM-DD HH24:MI') AS refund_date
  FROM refund_invoice_header rih
  WHERE rih.refund_invoice_number = $1
  `;

  const linesSql = `
    SELECT
      ril.id,
      ril.item_number,
      ril.refund_qty,

      il.description,
      il.qty            AS original_qty,
      il.item_price,
      il.tax,
      il.discount_percentage,
      il.total          AS original_total

    FROM refund_invoice_lines ril
    JOIN refund_invoice_header rih
      ON rih.refund_invoice_number = ril.refund_invoice_number
    JOIN invoice_lines il
      ON il.invoice_number = rih.original_invoice_number
     AND il.item_number = ril.item_number

    WHERE ril.refund_invoice_number = $1
    ORDER BY ril.item_number;
  `;

  const headerRes = await db.query(headerSql, [refund_invoice_number]);
  const linesRes = await db.query(linesSql, [refund_invoice_number]);

  return {
    header: headerRes.rows[0],
    lines: linesRes.rows,
  };
};

const createRefundInvoice = async (
  db,
  {
    original_invoice_number,
    refund_date,
    refund_reason,
    lines,
    return_to_storage = true,
  },
) => {
  const shouldReturnToStorage = return_to_storage === true;

  try {
    await db.query("BEGIN");

    // 1) Fetch original invoice lines (we need qty, total, item_id, storage_id)
    const origLinesRes = await db.query(
      `
      SELECT
        item_number,
        qty,
        total,
        item_id,
        storage_id
      FROM invoice_lines
      WHERE invoice_number = $1
      ORDER BY item_number;
      `,
      [original_invoice_number],
    );

    if (origLinesRes.rows.length === 0) {
      throw new Error("Original invoice not found or has no lines");
    }

    const origMap = new Map();
    for (const r of origLinesRes.rows) {
      origMap.set(Number(r.item_number), {
        qty: Number(r.qty || 0),
        total: Number(r.total || 0),
        item_id: r.item_id ? Number(r.item_id) : null,
        storage_id: r.storage_id ? Number(r.storage_id) : null,
      });
    }

    // 2) Already refunded summary (to prevent over-refund)
    const refundedRes = await db.query(
      `
      SELECT
        ril.item_number,
        COALESCE(SUM(ril.refund_qty), 0) AS refunded_qty
      FROM refund_invoice_header rih
      JOIN refund_invoice_lines ril
        ON ril.refund_invoice_number = rih.refund_invoice_number
      WHERE rih.original_invoice_number = $1
      GROUP BY ril.item_number;
      `,
      [original_invoice_number],
    );

    const refundedMap = new Map();
    for (const r of refundedRes.rows) {
      refundedMap.set(Number(r.item_number), Number(r.refunded_qty || 0));
    }

    // 3) Validate incoming lines and compute header total (based on original line net/unit)
    const picked = (lines || [])
      .map((x) => ({
        item_number: Number(x.item_number),
        refund_qty: Number(x.refund_qty),
      }))
      .filter((x) => x.item_number && x.refund_qty > 0);

    if (picked.length === 0) {
      throw new Error("No refund quantities provided");
    }

    let refundTotal = 0;

    for (const ln of picked) {
      const orig = origMap.get(ln.item_number);
      if (!orig) throw new Error(`Invalid item_number: ${ln.item_number}`);

      const already = refundedMap.get(ln.item_number) || 0;
      const available = orig.qty - already;

      if (available <= 0) {
        throw new Error(`Line ${ln.item_number} is already fully refunded`);
      }

      if (ln.refund_qty > available) {
        throw new Error(
          `Refund qty too high on line ${ln.item_number}. Available: ${available}`,
        );
      }

      const unitNet = orig.qty === 0 ? 0 : orig.total / orig.qty; // original net per 1 unit (incl tax)
      refundTotal += unitNet * ln.refund_qty;
    }

    refundTotal = Number(refundTotal.toFixed(3));

    // 4) Generate refund invoice number and insert header
    const refund_invoice_number = await getNextRefundInvoiceNumber(db);

    const headerIns = await db.query(
      `
      INSERT INTO refund_invoice_header (
        refund_invoice_number,
        original_invoice_number,
        refund_reason,
        refund_date,
        total
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
      `,
      [
        refund_invoice_number,
        original_invoice_number,
        refund_reason,
        refund_date, // ← from controller
        refundTotal,
      ],
    );

    // 5) Insert lines + return stock (IN)
    const insertedLines = [];

    for (const ln of picked) {
      const orig = origMap.get(ln.item_number);

      const lineIns = await db.query(
        `
        INSERT INTO refund_invoice_lines
          (refund_invoice_number, item_number, refund_qty)
        VALUES ($1, $2, $3)
        RETURNING *;
        `,
        [refund_invoice_number, ln.item_number, ln.refund_qty],
      );

      insertedLines.push(lineIns.rows[0]);

      // Return stock
      // 🔁 OPTIONAL: Return stock only if enabled
      if (shouldReturnToStorage && orig.item_id && orig.storage_id) {
        await db.query(`SELECT adjust_stock($1,$2,$3,$4,'IN','refund',$5,$6)`, [
          refund_invoice_number,
          orig.item_id,
          orig.storage_id,
          ln.refund_qty,
          refund_date, // ✅ refund date
          `Refund of ${original_invoice_number} (line ${ln.item_number})`,
        ]);
      }
      console.log("RETURN STOCK:", shouldReturnToStorage);
    }

    await db.query("COMMIT");
    return { header: headerIns.rows[0], lines: insertedLines };
  } catch (err) {
    await db.query("ROLLBACK");
    throw err;
  } finally {
  }
};

const saveRefundInvoiceQR = async (db, refund_invoice_number, qr) => {
  const sql = `
    UPDATE refund_invoice_header
    SET qr = $2, updated_at = NOW()
    WHERE refund_invoice_number = $1
    RETURNING *;
  `;
  const res = await db.query(sql, [refund_invoice_number, qr]);
  return res.rows[0];
};

const getInvoicesByDateRange = async (db, from, to) => {
  const sql = `
    SELECT
      invoice_number,
      pos,
      total,
      qr,
      TO_CHAR(date, 'YYYY-MM-DD HH24:MI') AS date
    FROM invoice_header
    WHERE date >= $1::date
      AND date < ($2::date + INTERVAL '1 day')
    ORDER BY date DESC;
  `;
  const { rows } = await db.query(sql, [from, to]);
  return rows;
};

const uploadCompanyLogo = async (db, file) => {
  const ext = file.originalname.split(".").pop();
  const key = `company/logo-${Date.now()}.${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.WASABI_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }),
  );

  // store ONLY the key
  const existing = await db.query(`SELECT id FROM company_config LIMIT 1`);

  if (existing.rows.length > 0) {
    await db.query(
      `UPDATE company_config SET logo_url=$1, updated_at=NOW() WHERE id=$2`,
      [key, existing.rows[0].id],
    );
  } else {
    await db.query(
      `INSERT INTO company_config (company_name, logo_url) VALUES ('', $1)`,
      [key],
    );
  }

  return key;
};

const getCompanyLogoSignedUrl = async (db, key) => {
  if (!key) return null;

  const command = new GetObjectCommand({
    Bucket: process.env.WASABI_BUCKET,
    Key: key,
  });

  return await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 min
};

// =========================
// REPORTS
// =========================
const getGeneralSalesReport = async (db, { from, to, limit, offset }) => {
  try {
    // 1️⃣ Paginated rows
    const rowsRes = await db.query(
      `
      SELECT
        invoice_number,
        TO_CHAR(date, 'DD-MM-YYYY') AS date,
        client,
        type,
        total
      FROM invoice_header
      WHERE date::date BETWEEN $1 AND $2
      ORDER BY invoice_number ASC
      LIMIT $3 OFFSET $4
      `,
      [from, to, limit, offset],
    );

    // 2️⃣ Total sum + count (NO limit / offset)
    const totalRes = await db.query(
      `
      SELECT
        COALESCE(SUM(total), 0) AS total_sum,
        COUNT(*) AS total_count
      FROM invoice_header
      WHERE date::date BETWEEN $1 AND $2
      `,
      [from, to],
    );

    return {
      rows: rowsRes.rows,
      total_sum: Number(totalRes.rows[0].total_sum),
      total_count: Number(totalRes.rows[0].total_count),
    };
  } finally {
  }
};

const getSalesByClientReport = async (
  db,
  { from, to, client_id, limit, offset },
) => {
  try {
    const rowsRes = await db.query(
      `
      SELECT
        invoice_number,
        TO_CHAR(date, 'DD-MM-YYYY') AS date,
        client,
        type,
        total
      FROM invoice_header
      WHERE client_id = $1
        AND date::date BETWEEN $2 AND $3
      ORDER BY invoice_number ASC
      LIMIT $4 OFFSET $5
      `,
      [client_id, from, to, limit, offset],
    );

    const totalRes = await db.query(
      `
      SELECT
        COALESCE(SUM(total), 0) AS total_sum,
        COUNT(*) AS total_count
      FROM invoice_header
      WHERE client_id = $1
        AND date::date BETWEEN $2 AND $3
      `,
      [client_id, from, to],
    );

    return {
      rows: rowsRes.rows,
      total_sum: Number(totalRes.rows[0].total_sum),
      total_count: Number(totalRes.rows[0].total_count),
    };
  } finally {
  }
};

const getSalesByAreaReport = async (db, { from, to, area, limit, offset }) => {
  try {
    const rowsRes = await db.query(
      `
      SELECT
        invoice_number,
        TO_CHAR(date, 'DD-MM-YYYY') AS date,
        client,
        type,
        total
      FROM invoice_header
      WHERE type2 = $1
        AND date::date BETWEEN $2 AND $3
      ORDER BY invoice_number ASC
      LIMIT $4 OFFSET $5
      `,
      [area, from, to, limit, offset],
    );

    const totalRes = await db.query(
      `
      SELECT
        COALESCE(SUM(total), 0) AS total_sum,
        COUNT(*) AS total_count
      FROM invoice_header
      WHERE type2 = $1
        AND date::date BETWEEN $2 AND $3
      `,
      [area, from, to],
    );

    return {
      rows: rowsRes.rows,
      total_sum: Number(totalRes.rows[0].total_sum),
      total_count: Number(totalRes.rows[0].total_count),
    };
  } finally {
  }
};

const getSalesByClientDetailedReport = async (
  db,
  { from, to, client_id, limit, offset },
) => {
  try {
    // 1️⃣ Paginated detailed rows (invoice lines)
    const rowsRes = await db.query(
      `
      SELECT
        il.invoice_number,
        TO_CHAR(ih.date, 'DD-MM-YYYY') AS invoice_date,
        COALESCE(i.name, il.description) AS item_name,
        il.qty,
        il.item_price AS price,
        il.discount,
        il.total
      FROM invoice_lines il
      JOIN invoice_header ih
        ON ih.invoice_number = il.invoice_number
      LEFT JOIN items i
        ON i.id = il.item_id
      WHERE
        ih.client_id = $1
        AND ih.date::date BETWEEN $2 AND $3
      ORDER BY ih.date ASC, il.invoice_number ASC, il.item_number ASC
      LIMIT $4 OFFSET $5
      `,
      [client_id, from, to, limit, offset],
    );

    // 2️⃣ Total count (NO pagination)
    const countRes = await db.query(
      `
      SELECT COUNT(*) AS total_count
      FROM invoice_lines il
      JOIN invoice_header ih
        ON ih.invoice_number = il.invoice_number
      WHERE
        ih.client_id = $1
        AND ih.date::date BETWEEN $2 AND $3
      `,
      [client_id, from, to],
    );

    return {
      rows: rowsRes.rows,
      total_count: Number(countRes.rows[0].total_count),
    };
  } finally {
  }
};

const getItemsSoldForClientTotals = async (
  db,
  { from, to, client_id, limit, offset },
) => {
  try {
    // 1️⃣ Aggregated rows (paginated)
    const rowsRes = await db.query(
      `
      SELECT
        il.item_id,
        COALESCE(i.name, il.description) AS item_name,
        u.name AS unit,
        SUM(il.qty) AS total_qty
      FROM invoice_lines il
      JOIN invoice_header ih
        ON ih.invoice_number = il.invoice_number
      LEFT JOIN items i
        ON i.id = il.item_id
      LEFT JOIN units u
        ON u.id = i.unit
      WHERE
        ih.client_id = $1
        AND ih.date::date BETWEEN $2 AND $3
      GROUP BY
        il.item_id,
        item_name,
        u.name
      ORDER BY
        item_name ASC
      LIMIT $4 OFFSET $5
      `,
      [client_id, from, to, limit, offset],
    );

    // 2️⃣ Total distinct items count (NO pagination)
    const countRes = await db.query(
      `
      SELECT COUNT(*) AS total_count
      FROM (
        SELECT il.item_id
        FROM invoice_lines il
        JOIN invoice_header ih
          ON ih.invoice_number = il.invoice_number
        WHERE
          ih.client_id = $1
          AND ih.date::date BETWEEN $2 AND $3
        GROUP BY il.item_id
      ) t
      `,
      [client_id, from, to],
    );

    return {
      rows: rowsRes.rows,
      total_count: Number(countRes.rows[0].total_count),
    };
  } finally {
  }
};

const getEinvoicingReport = async (db, { from, to, status, limit, offset }) => {
  try {
    const whereStatus =
      status === "shared"
        ? "(qr IS NOT NULL AND qr <> $3)"
        : "(qr IS NULL OR qr = $3)";

    const rowsQuery = `
      SELECT
        invoice_number,
        TO_CHAR(date, 'DD-MM-YYYY') AS date,
        client,
        total,
        qr
      FROM invoice_header
      WHERE date::date BETWEEN $1 AND $2
        AND ${whereStatus}
      ORDER BY invoice_number ASC
      LIMIT $4 OFFSET $5;
    `;

    const sumQuery = `
      SELECT
        COUNT(*)::int AS total_count,
        COALESCE(SUM(total), 0) AS total_sum
      FROM invoice_header
      WHERE date::date BETWEEN $1 AND $2
        AND ${whereStatus};
    `;

    const rowsRes = await db.query(rowsQuery, [
      from,
      to,
      DEFAULT_QR,
      limit,
      offset,
    ]);

    const sumRes = await db.query(sumQuery, [from, to, DEFAULT_QR]);

    return {
      rows: rowsRes.rows,
      total_count: sumRes.rows[0].total_count,
      total_sum: sumRes.rows[0].total_sum,
    };
  } finally {
  }
};


const getTaxDeclarationReport = async (db, { from, to }) => {
  const q = `
    /* =========================
       1) SALES (normal invoices)
       ========================= */
    WITH sales_base AS (
      SELECT
        ih.type2,
        COALESCE(il.exempt, false) AS exempt,
        COALESCE(ROUND(il.tax)::int, 0) AS tax_int,
        il.total AS amount
      FROM invoice_header ih
      JOIN invoice_lines il
        ON il.invoice_number = ih.invoice_number
      WHERE ih.type2 IN ('local', 'export', 'development')
        AND ih.date >= $1 AND ih.date < $2
    ),
    sales_bucketed AS (
      SELECT
        type2,
        CASE
          WHEN type2 IN ('export', 'development') THEN
            CASE WHEN exempt THEN 'exempt' ELSE '0' END
          ELSE
            CASE WHEN exempt THEN 'exempt' ELSE tax_int::text END
        END AS bucket,
        COALESCE(SUM(amount), 0) AS sales_total
      FROM sales_base
      GROUP BY type2, bucket
    ),

    /* =========================
       2) REFUNDS (linked to original invoice)
       - classify by ORIGINAL invoice header/lines
       - sum only refunded items/qty
       ========================= */
    refunds_base AS (
      SELECT
        ih.type2,
        COALESCE(il.exempt, false) AS exempt,
        COALESCE(ROUND(il.tax)::int, 0) AS tax_int,

        /* refund amount proportional to refunded qty */
        (
          (il.total / NULLIF(il.qty, 0)) * ril.refund_qty
        )::numeric(12,3) AS amount

      FROM refund_invoice_header rih
      JOIN refund_invoice_lines ril
        ON ril.refund_invoice_number = rih.refund_invoice_number

      /* original invoice header (for type2 + date filtering on original invoice) */
      JOIN invoice_header ih
        ON ih.invoice_number = rih.original_invoice_number

      /* original invoice line (to get exempt/tax/total/qty) */
      JOIN invoice_lines il
        ON il.invoice_number = rih.original_invoice_number
       AND il.item_number = ril.item_number

      WHERE ih.type2 IN ('local', 'export', 'development')
        AND ih.date >= $1 AND ih.date < $2
    ),
    refunds_bucketed AS (
      SELECT
        type2,
        CASE
          WHEN type2 IN ('export', 'development') THEN
            CASE WHEN exempt THEN 'exempt' ELSE '0' END
          ELSE
            CASE WHEN exempt THEN 'exempt' ELSE tax_int::text END
        END AS bucket,
        COALESCE(SUM(amount), 0) AS refunds_total
      FROM refunds_base
      GROUP BY type2, bucket
    )

    /* =========================
       3) Merge buckets (sales + refunds)
       ========================= */
    SELECT
      COALESCE(s.type2, r.type2) AS type2,
      COALESCE(s.bucket, r.bucket) AS bucket,
      COALESCE(s.sales_total, 0) AS sales_total,
      COALESCE(r.refunds_total, 0) AS refunds_total,
      (COALESCE(s.sales_total, 0) - COALESCE(r.refunds_total, 0)) AS grand_total
    FROM sales_bucketed s
    FULL OUTER JOIN refunds_bucketed r
      ON r.type2 = s.type2
     AND r.bucket = s.bucket
    ORDER BY 1, 2;
  `;

  const res = await db.query(q, [from, to]);

  // Helper: fetch bucket row (sales/refunds/grand)
  const getBucket = (type2, bucket) => {
    const row = res.rows.find((r) => r.type2 === type2 && r.bucket === String(bucket));
    return {
      sales_total: Number(row?.sales_total || 0),
      refunds_total: Number(row?.refunds_total || 0),
      grand_total: Number(row?.grand_total || 0),
    };
  };

  // export
  const exportSales = {
    zero_tax: getBucket("export", "0"),
    exempt: getBucket("export", "exempt"),
  };

  // development
  const developmentSales = {
    zero_tax: getBucket("development", "0"),
    exempt: getBucket("development", "exempt"),
  };

  // local (exempt + 0..16)
  const localTaxed = {};
  for (let i = 0; i <= 16; i++) localTaxed[i] = getBucket("local", String(i));

  const localSales = {
    exempt: getBucket("local", "exempt"),
    taxed: localTaxed,
  };

  // overall totals (sum grand totals)
  const grand_total =
    exportSales.zero_tax.grand_total +
    exportSales.exempt.grand_total +
    developmentSales.zero_tax.grand_total +
    developmentSales.exempt.grand_total +
    localSales.exempt.grand_total +
    Object.values(localSales.taxed).reduce((s, v) => s + (v.grand_total || 0), 0);

  // Optional: also return global sales/refunds totals if you want
  const sales_total =
    exportSales.zero_tax.sales_total +
    exportSales.exempt.sales_total +
    developmentSales.zero_tax.sales_total +
    developmentSales.exempt.sales_total +
    localSales.exempt.sales_total +
    Object.values(localSales.taxed).reduce((s, v) => s + (v.sales_total || 0), 0);

  const refunds_total =
    exportSales.zero_tax.refunds_total +
    exportSales.exempt.refunds_total +
    developmentSales.zero_tax.refunds_total +
    developmentSales.exempt.refunds_total +
    localSales.exempt.refunds_total +
    Object.values(localSales.taxed).reduce((s, v) => s + (v.refunds_total || 0), 0);

  return {
    export_sales: exportSales,
    development_sales: developmentSales,
    local_sales: localSales,
    totals: {
      sales_total,
      refunds_total,
      grand_total,
    },
  };
};



const getRefundsReport = async (db, { from, to, limit, offset }) => {
  try {
    const rowsRes = await db.query(
      `
      SELECT
        r.refund_invoice_number,
        r.original_invoice_number,
        r.refund_date,
        h.client,
        h.type,
        r.total
      FROM refund_invoice_header r
      JOIN invoice_header h
        ON h.invoice_number = r.original_invoice_number
      WHERE r.refund_date >= $1
        AND r.refund_date <  $2
      ORDER BY r.refund_date DESC
      LIMIT $3 OFFSET $4
      `,
      [from, to, limit, offset],
    );

    const totalsRes = await db.query(
      `
      SELECT
        COUNT(*) AS total_count,
        COALESCE(SUM(total), 0) AS total_sum
      FROM refund_invoice_header
      WHERE refund_date >= $1
        AND refund_date <  $2
      `,
      [from, to],
    );

    return {
      rows: rowsRes.rows,
      total_count: Number(totalsRes.rows[0].total_count),
      total_sum: Number(totalsRes.rows[0].total_sum),
    };
  } finally {
  }
};

const getRefundsByClientReport = async (
  db,
  { client_id, from, to, limit, offset },
) => {
  try {
    const rowsRes = await db.query(
      `
      SELECT
        r.refund_invoice_number,
        r.original_invoice_number,
        r.refund_date,
        h.client,
        h.type,
        r.total
      FROM refund_invoice_header r
      JOIN invoice_header h
        ON h.invoice_number = r.original_invoice_number
      WHERE h.client_id = $1
        AND r.refund_date >= $2
        AND r.refund_date <  $3
      ORDER BY r.refund_date DESC
      LIMIT $4 OFFSET $5
      `,
      [client_id, from, to, limit, offset],
    );

    const totalsRes = await db.query(
      `
      SELECT
        COUNT(*) AS total_count,
        COALESCE(SUM(r.total), 0) AS total_sum
      FROM refund_invoice_header r
      JOIN invoice_header h
        ON h.invoice_number = r.original_invoice_number
      WHERE h.client_id = $1
        AND r.refund_date >= $2
        AND r.refund_date <  $3
      `,
      [client_id, from, to],
    );

    return {
      rows: rowsRes.rows,
      total_count: Number(totalsRes.rows[0].total_count),
      total_sum: Number(totalsRes.rows[0].total_sum),
    };
  } finally {
  }
};

const getItemsSalesReport = async (db, { from, to, limit, offset }) => {
  try {
    const rowsRes = await db.query(
      `
      SELECT
        il.item_id,
        i.name AS item_name,
        u.name AS unit_name,
        SUM(il.qty)   AS total_qty,
        SUM(il.total) AS total_sales
      FROM invoice_lines il
      JOIN invoice_header ih
        ON ih.invoice_number = il.invoice_number
      LEFT JOIN items i ON i.id = il.item_id
      LEFT JOIN units u ON u.id = il.unit_number
      WHERE
        ih.date::date BETWEEN $1 AND $2
        AND il.item_id IS NOT NULL
      GROUP BY il.item_id, i.name, u.name
      ORDER BY total_sales DESC
      LIMIT $3 OFFSET $4
      `,
      [from, to, limit, offset],
    );

    const totalsRes = await db.query(
      `
      SELECT
        COUNT(DISTINCT il.item_id) AS items_count,
        COALESCE(SUM(il.total), 0) AS grand_total_sales
      FROM invoice_lines il
      JOIN invoice_header ih
        ON ih.invoice_number = il.invoice_number
      WHERE
        ih.date::date BETWEEN $1 AND $2
        AND il.item_id IS NOT NULL
      `,
      [from, to],
    );

    return {
      rows: rowsRes.rows,
      items_count: Number(totalsRes.rows[0].items_count),
      grand_total_sales: Number(totalsRes.rows[0].grand_total_sales),
    };
  } finally {
  }
};

const getItemSalesDetailsReport = async (
  db,
  { item_id, from, to, limit, offset },
) => {
  try {
    const rowsRes = await db.query(
      `
      SELECT
        TO_CHAR(ih.date, 'DD-MM-YYYY') AS date,
        il.invoice_number,
        c.name                  AS client,
        il.qty,
        u.name                  AS unit_name,
        il.total
      FROM invoice_lines il
      JOIN invoice_header ih
        ON ih.invoice_number = il.invoice_number
      LEFT JOIN clients c
        ON c.id = ih.client_id
      LEFT JOIN units u
        ON u.id = il.unit_number
      WHERE
        il.item_id = $1
        AND ih.date::date BETWEEN $2 AND $3
      ORDER BY ih.date DESC, il.invoice_number DESC
      LIMIT $4 OFFSET $5
      `,
      [item_id, from, to, limit, offset],
    );

    const totalsRes = await db.query(
      `
      SELECT
        COUNT(*)                 AS records_count,
        COALESCE(SUM(il.total),0) AS total_sales,
        COALESCE(SUM(il.qty),0)   AS total_qty
      FROM invoice_lines il
      JOIN invoice_header ih
        ON ih.invoice_number = il.invoice_number
      WHERE
        il.item_id = $1
        AND ih.date::date BETWEEN $2 AND $3
      `,
      [item_id, from, to],
    );

    return {
      rows: rowsRes.rows,
      records_count: Number(totalsRes.rows[0].records_count),
      total_sales: Number(totalsRes.rows[0].total_sales),
      total_qty: Number(totalsRes.rows[0].total_qty),
    };
  } finally {
  }
};

const getStorageInventoryReport = async (db, { storage_id }) => {
  try {
    const res = await db.query(
      `
      SELECT
        i.id        AS item_id,
        i.name      AS item_name,
        u.name      AS unit_name,
        si.qty
      FROM storage_items si
      JOIN items i ON i.id = si.item_id
      LEFT JOIN units u ON u.id = i.unit
      WHERE si.storage_id = $1
      ORDER BY i.name;
      `,
      [storage_id],
    );

    return {
      rows: res.rows,
    };
  } finally {
  }
};

const getTransactionLogsReport = async (
  db,
  { from, to, item_id, storage_id, direction, limit, offset },
) => {
  try {
    const res = await db.query(
      `
      SELECT
        TO_CHAR(tl.created_at, 'DD-MM-YYYY') AS date,
        i.name        AS item_name,
        s.name        AS storage_name,
        tl.direction,
        tl.qty,
        u.name        AS unit_name,
        tl.transaction_id AS ref
      FROM transaction_logs tl
      JOIN items i ON i.id = tl.item_id
      JOIN storages s ON s.id = tl.storage_id
      LEFT JOIN units u ON u.id = i.unit
      WHERE
        tl.created_at::date BETWEEN $1 AND $2
        AND ($3::int IS NULL OR tl.item_id = $3)
        AND ($4::int IS NULL OR tl.storage_id = $4)
        AND ($5::text = 'BOTH' OR tl.direction = $5)
      ORDER BY tl.created_at DESC
      LIMIT $6 OFFSET $7
      `,
      [
        from,
        to,
        item_id || null,
        storage_id || null,
        direction || "BOTH",
        limit,
        offset,
      ],
    );

    return res.rows;
  } finally {
  }
};

const getSalesRefundsCombinedReport = async (db, { from, to, limit, offset }) => {
  // net tolerance: exclude fully-refunded invoices
  const EPS = 0.0005;

  // 1) paginated rows
  const rowsRes = await db.query(
    `
    WITH refund_agg AS (
      SELECT
        r.original_invoice_number,
        SUM(COALESCE(r.total, 0))::numeric AS refund_total,
        STRING_AGG(r.refund_invoice_number::text, ', ' ORDER BY r.refund_date DESC) AS refund_invoice_numbers,
        MAX(r.refund_date) AS last_refund_date
      FROM refund_invoice_header r
      WHERE r.refund_date::date BETWEEN $1 AND $2
      GROUP BY r.original_invoice_number
    )
    SELECT
      h.invoice_number,
      TO_CHAR(h.date, 'DD-MM-YYYY') AS date,
      h.client,
      h.total::numeric AS invoice_total,

      COALESCE(ra.refund_invoice_numbers, '') AS refund_invoice_number,
      COALESCE(ra.refund_total, 0)::numeric AS refund_total,

      (h.total::numeric - COALESCE(ra.refund_total, 0)::numeric) AS grand_total
    FROM invoice_header h
    LEFT JOIN refund_agg ra
      ON ra.original_invoice_number = h.invoice_number
    WHERE h.date::date BETWEEN $1 AND $2
      AND (h.total::numeric - COALESCE(ra.refund_total, 0)::numeric) > $5
    ORDER BY h.invoice_number ASC
    LIMIT $3 OFFSET $4
    `,
    [from, to, limit, offset, EPS]
  );

  // 2) totals (no limit/offset)
  const totalsRes = await db.query(
    `
    WITH refund_agg AS (
      SELECT
        r.original_invoice_number,
        SUM(COALESCE(r.total, 0))::numeric AS refund_total
      FROM refund_invoice_header r
      WHERE r.refund_date::date BETWEEN $1 AND $2
      GROUP BY r.original_invoice_number
    )
    SELECT
      COUNT(*)::int AS total_count,
      COALESCE(SUM(h.total::numeric - COALESCE(ra.refund_total, 0)::numeric), 0)::numeric AS total_sum
    FROM invoice_header h
    LEFT JOIN refund_agg ra
      ON ra.original_invoice_number = h.invoice_number
    WHERE h.date::date BETWEEN $1 AND $2
      AND (h.total::numeric - COALESCE(ra.refund_total, 0)::numeric) > $3
    `,
    [from, to, EPS]
  );

  return {
    rows: rowsRes.rows,
    total_count: Number(totalsRes.rows[0].total_count || 0),
    total_sum: Number(totalsRes.rows[0].total_sum || 0),
  };
};

const getSalesRefundsCombinedByClientReport = async (
  db,
  { from, to, client_id, limit, offset }
) => {
  const EPS = 0.0005;

  const rowsRes = await db.query(
    `
    WITH refund_agg AS (
      SELECT
        r.original_invoice_number,
        SUM(COALESCE(r.total, 0))::numeric AS refund_total,
        STRING_AGG(
          r.refund_invoice_number::text,
          ', ' ORDER BY r.refund_date DESC
        ) AS refund_invoice_numbers
      FROM refund_invoice_header r
      WHERE r.refund_date::date BETWEEN $1 AND $2
      GROUP BY r.original_invoice_number
    )
    SELECT
      h.invoice_number,
      TO_CHAR(h.date, 'DD-MM-YYYY') AS date,
      h.client,
      h.total::numeric AS invoice_total,
      COALESCE(ra.refund_invoice_numbers, '') AS refund_invoice_number,
      COALESCE(ra.refund_total, 0)::numeric AS refund_total,
      (h.total::numeric - COALESCE(ra.refund_total, 0)::numeric) AS grand_total
    FROM invoice_header h
    LEFT JOIN refund_agg ra
      ON ra.original_invoice_number = h.invoice_number
    WHERE h.date::date BETWEEN $1 AND $2
      AND h.client_id = $3
      AND (h.total::numeric - COALESCE(ra.refund_total, 0)::numeric) > $6
    ORDER BY h.invoice_number ASC
    LIMIT $4 OFFSET $5
    `,
    [from, to, client_id, limit, offset, EPS]
  );

  const totalsRes = await db.query(
    `
    WITH refund_agg AS (
      SELECT
        r.original_invoice_number,
        SUM(COALESCE(r.total, 0))::numeric AS refund_total
      FROM refund_invoice_header r
      WHERE r.refund_date::date BETWEEN $1 AND $2
      GROUP BY r.original_invoice_number
    )
    SELECT
      COUNT(*)::int AS total_count,
      COALESCE(
        SUM(h.total::numeric - COALESCE(ra.refund_total, 0)::numeric),
        0
      )::numeric AS total_sum
    FROM invoice_header h
    LEFT JOIN refund_agg ra
      ON ra.original_invoice_number = h.invoice_number
    WHERE h.date::date BETWEEN $1 AND $2
      AND h.client_id = $3
      AND (h.total::numeric - COALESCE(ra.refund_total, 0)::numeric) > $4
    `,
    [from, to, client_id, EPS]
  );

  return {
    rows: rowsRes.rows,
    total_count: Number(totalsRes.rows[0].total_count || 0),
    total_sum: Number(totalsRes.rows[0].total_sum || 0),
  };
};
// ================= DASHBOARD KPIs =================
const getDashboardKpis = async (db, year) => {
  const salesRes = await db.query(
    `
    SELECT
      COALESCE(SUM(total), 0) AS total_sales,
      COUNT(*) AS invoice_count
    FROM invoice_header
    WHERE EXTRACT(YEAR FROM date) = $1
    `,
    [year],
  );

  const refundsRes = await db.query(
    `
    SELECT COALESCE(SUM(total), 0) AS total_refunds
    FROM refund_invoice_header
    WHERE EXTRACT(YEAR FROM refund_date) = $1
    `,
    [year],
  );

  const totalSales = Number(salesRes.rows[0].total_sales);
  const totalRefunds = Number(refundsRes.rows[0].total_refunds);

  return {
    total_sales: totalSales,
    total_refunds: totalRefunds,
    net_profit: totalSales - totalRefunds,
    invoice_count: Number(salesRes.rows[0].invoice_count),
  };
};

const getDashboardOverview = async (db, year) => {
  // 1) Monthly net (sales - refunds) for selected year
  const monthlyNetRes = await db.query(
    `
    WITH months AS (
      SELECT generate_series(1, 12) AS m
    ),
    sales AS (
      SELECT
        EXTRACT(MONTH FROM date)::int AS m,
        COALESCE(SUM(total), 0)::numeric AS sales_total
      FROM invoice_header
      WHERE EXTRACT(YEAR FROM date)::int = $1
      GROUP BY 1
    ),
    refunds AS (
      SELECT
        EXTRACT(MONTH FROM refund_date)::int AS m,
        COALESCE(SUM(total), 0)::numeric AS refunds_total
      FROM refund_invoice_header
      WHERE EXTRACT(YEAR FROM refund_date)::int = $1
      GROUP BY 1
    )
    SELECT
      months.m AS month_index,
      COALESCE(sales.sales_total, 0) - COALESCE(refunds.refunds_total, 0) AS net
    FROM months
    LEFT JOIN sales ON sales.m = months.m
    LEFT JOIN refunds ON refunds.m = months.m
    ORDER BY months.m;
    `,
    [year],
  );

  // 2) Monthly average invoice total (month sum / month count) for selected year
  const monthlyAvgRes = await db.query(
    `
    WITH months AS (
      SELECT generate_series(1, 12) AS m
    ),
    agg AS (
      SELECT
        EXTRACT(MONTH FROM date)::int AS m,
        COUNT(*)::int AS cnt,
        COALESCE(SUM(total), 0)::numeric AS sum_total
      FROM invoice_header
      WHERE EXTRACT(YEAR FROM date)::int = $1
      GROUP BY 1
    )
    SELECT
      months.m AS month_index,
      CASE
        WHEN COALESCE(agg.cnt, 0) = 0 THEN 0
        ELSE (agg.sum_total / agg.cnt)
      END AS avg
    FROM months
    LEFT JOIN agg ON agg.m = months.m
    ORDER BY months.m;
    `,
    [year],
  );

  // 3) Low stock alerts (NOT year-based)
  const lowStockRes = await db.query(
    `
    SELECT
      id,
      name,
      stock_qty,
      minimum_qty_alert,
      (minimum_qty_alert - stock_qty) AS deficit
    FROM items
    WHERE is_stocked = true
      AND (stock_qty - minimum_qty_alert) < 0
    ORDER BY (stock_qty - minimum_qty_alert) ASC
    LIMIT 50;
    `,
  );

  // 4) Recent sales (last 10 invoices) (NOT year-based)
  const recentSalesRes = await db.query(
    `
    SELECT
      invoice_number,
      date,
      client,
      total,
      type,
      pos,
      currency,
      qr
    FROM invoice_header
    ORDER BY invoice_number DESC
    LIMIT 10;
    `,
  );

  return {
    year,
    monthly_net: monthlyNetRes.rows,
    monthly_avg_invoice: monthlyAvgRes.rows,
    low_stock: lowStockRes.rows,
    recent_sales: recentSalesRes.rows,
  };
};

const getDashboardSales = async (db, year) => {
  // 1) Monthly sales totals
  const monthlySalesTotalsRes = await db.query(
    `
    WITH months AS (
      SELECT generate_series(1, 12) AS m
    ),
    agg AS (
      SELECT
        EXTRACT(MONTH FROM date)::int AS m,
        COALESCE(SUM(total), 0)::numeric AS total
      FROM invoice_header
      WHERE EXTRACT(YEAR FROM date)::int = $1
      GROUP BY 1
    )
    SELECT
      months.m AS month_index,
      COALESCE(agg.total, 0) AS total
    FROM months
    LEFT JOIN agg ON agg.m = months.m
    ORDER BY months.m;
    `,
    [year],
  );

  // 2) Monthly sales count
  const monthlySalesCountRes = await db.query(
    `
    WITH months AS (
      SELECT generate_series(1, 12) AS m
    ),
    agg AS (
      SELECT
        EXTRACT(MONTH FROM date)::int AS m,
        COUNT(*)::int AS count
      FROM invoice_header
      WHERE EXTRACT(YEAR FROM date)::int = $1
      GROUP BY 1
    )
    SELECT
      months.m AS month_index,
      COALESCE(agg.count, 0) AS count
    FROM months
    LEFT JOIN agg ON agg.m = months.m
    ORDER BY months.m;
    `,
    [year],
  );

  // 3) Monthly refunds totals
  const monthlyRefundsTotalsRes = await db.query(
    `
    WITH months AS (
      SELECT generate_series(1, 12) AS m
    ),
    agg AS (
      SELECT
        EXTRACT(MONTH FROM refund_date)::int AS m,
        COALESCE(SUM(total), 0)::numeric AS refunds
      FROM refund_invoice_header
      WHERE EXTRACT(YEAR FROM refund_date)::int = $1
      GROUP BY 1
    )
    SELECT
      months.m AS month_index,
      COALESCE(agg.refunds, 0) AS refunds
    FROM months
    LEFT JOIN agg ON agg.m = months.m
    ORDER BY months.m;
    `,
    [year],
  );

  // 4) Sales by type2 (local / export / development)
  //    Ensure all 3 show up even if empty
  const salesByType2Res = await db.query(
    `
    WITH types AS (
      SELECT * FROM (VALUES ('local'), ('export'), ('development')) AS t(type2)
    ),
    agg AS (
      SELECT
        COALESCE(type2, 'local')::text AS type2,
        COALESCE(SUM(total), 0)::numeric AS total
      FROM invoice_header
      WHERE EXTRACT(YEAR FROM date)::int = $1
      GROUP BY 1
    )
    SELECT
      types.type2,
      COALESCE(agg.total, 0) AS total
    FROM types
    LEFT JOIN agg ON agg.type2 = types.type2
    ORDER BY types.type2;
    `,
    [year],
  );

  return {
    year,
    monthly_sales_totals: monthlySalesTotalsRes.rows,
    monthly_sales_count: monthlySalesCountRes.rows,
    monthly_refunds_totals: monthlyRefundsTotalsRes.rows,
    sales_by_type2: salesByType2Res.rows,
  };
};

const getDashboardInventory = async (db, year) => {
  try {
    /* ===========================
       1) Top 3 sold items / month
       =========================== */
    const topItemsRes = await db.query(
      `
      WITH months AS (
        SELECT generate_series(1,12) AS month
      ),
      monthly_sales AS (
        SELECT
          EXTRACT(MONTH FROM ih.date)::int AS month,
          il.item_id,
          i.name AS item_name,
          SUM(il.total) AS total
        FROM invoice_lines il
        JOIN invoice_header ih
          ON ih.invoice_number = il.invoice_number
        JOIN items i
          ON i.id = il.item_id
        WHERE EXTRACT(YEAR FROM ih.date)::int = $1
        GROUP BY month, il.item_id, i.name
      ),
      ranked AS (
        SELECT *,
              ROW_NUMBER() OVER (PARTITION BY month ORDER BY total DESC) AS rn
        FROM monthly_sales
      )
      SELECT
        m.month,

        MAX(CASE WHEN r.rn = 1 THEN r.total END)      AS rank1_total,
        MAX(CASE WHEN r.rn = 1 THEN r.item_name END) AS rank1_name,

        MAX(CASE WHEN r.rn = 2 THEN r.total END)      AS rank2_total,
        MAX(CASE WHEN r.rn = 2 THEN r.item_name END) AS rank2_name,

        MAX(CASE WHEN r.rn = 3 THEN r.total END)      AS rank3_total,
        MAX(CASE WHEN r.rn = 3 THEN r.item_name END) AS rank3_name

      FROM months m
      LEFT JOIN ranked r ON r.month = m.month
      GROUP BY m.month
      ORDER BY m.month;
    `,
      [year],
    );

    /* ===========================
       2) Dead items (top 5)
       =========================== */
    const deadItemsRes = await db.query(`
      SELECT
        i.id,
        i.name,
        COALESCE(SUM(il.qty), 0) AS sold_qty
      FROM items i
      LEFT JOIN invoice_lines il ON il.item_id = i.id
      GROUP BY i.id
      HAVING COALESCE(SUM(il.qty), 0) = 0
      ORDER BY i.created_at ASC
      LIMIT 5;
    `);

    /* ===========================
       3) Monthly IN / OUT totals
       =========================== */
    const inOutRes = await db.query(
      `
      SELECT
        EXTRACT(MONTH FROM created_at)::int AS month,
        SUM(CASE WHEN direction = 'IN'  THEN qty ELSE 0 END) AS in_qty,
        SUM(CASE WHEN direction = 'OUT' THEN qty ELSE 0 END) AS out_qty
      FROM transaction_logs
      WHERE EXTRACT(YEAR FROM created_at) = $1
      GROUP BY month
      ORDER BY month;
    `,
      [year],
    );

    return {
      top_items_monthly: topItemsRes.rows,
      dead_items: deadItemsRes.rows,
      monthly_inout: inOutRes.rows,
    };
  } finally {
  }
};

const getDashboardClients = async (db, year) => {
  // ============================
  // TOP 3 CLIENTS PER MONTH – SPENDING
  // ============================
  const spendingMonthly = await db.query(
    `
    WITH ranked AS (
  SELECT
    EXTRACT(MONTH FROM ih.date)::int AS month,
    c.id AS client_id,
    c.name AS client_name,
    SUM(ih.total) AS total_spent,
    ROW_NUMBER() OVER (
      PARTITION BY EXTRACT(MONTH FROM ih.date)::int
      ORDER BY SUM(ih.total) DESC
    ) AS rn
  FROM invoice_header ih
  JOIN clients c ON c.id = ih.client_id
  WHERE EXTRACT(YEAR FROM ih.date)::int = $1
  GROUP BY
    EXTRACT(MONTH FROM ih.date)::int,
    c.id,
    c.name
)
SELECT
  month,

  MAX(CASE WHEN rn = 1 THEN total_spent END) AS rank1_value,
  MAX(CASE WHEN rn = 1 THEN client_name END) AS rank1_name,

  MAX(CASE WHEN rn = 2 THEN total_spent END) AS rank2_value,
  MAX(CASE WHEN rn = 2 THEN client_name END) AS rank2_name,

  MAX(CASE WHEN rn = 3 THEN total_spent END) AS rank3_value,
  MAX(CASE WHEN rn = 3 THEN client_name END) AS rank3_name
FROM ranked
WHERE rn <= 3
GROUP BY month
ORDER BY month;
  `,
    [year],
  );

  // ============================
  // TOP 3 CLIENTS PER MONTH – SALES COUNT
  // ============================
  const countMonthly = await db.query(
    `
    WITH ranked AS (
  SELECT
    EXTRACT(MONTH FROM ih.date)::int AS month,
    c.id AS client_id,
    c.name AS client_name,
    COUNT(*) AS sales_count,
    ROW_NUMBER() OVER (
      PARTITION BY EXTRACT(MONTH FROM ih.date)::int
      ORDER BY COUNT(*) DESC
    ) AS rn
  FROM invoice_header ih
  JOIN clients c ON c.id = ih.client_id
  WHERE EXTRACT(YEAR FROM ih.date)::int = $1
  GROUP BY
    EXTRACT(MONTH FROM ih.date)::int,
    c.id,
    c.name
)
SELECT
  month,

  MAX(CASE WHEN rn = 1 THEN sales_count END) AS rank1_value,
  MAX(CASE WHEN rn = 1 THEN client_name END) AS rank1_name,

  MAX(CASE WHEN rn = 2 THEN sales_count END) AS rank2_value,
  MAX(CASE WHEN rn = 2 THEN client_name END) AS rank2_name,

  MAX(CASE WHEN rn = 3 THEN sales_count END) AS rank3_value,
  MAX(CASE WHEN rn = 3 THEN client_name END) AS rank3_name
FROM ranked
WHERE rn <= 3
GROUP BY month
ORDER BY month;
  `,
    [year],
  );

  // ============================
  // KPI – TOP 3 SPENDING (YEAR)
  // ============================
  const topSpending = await db.query(
    `
    SELECT
      c.id,
      c.name,
      SUM(ih.total) AS total_spent
    FROM invoice_header ih
    JOIN clients c ON c.id = ih.client_id
    WHERE EXTRACT(YEAR FROM ih.date) = $1
    GROUP BY c.id, c.name
    ORDER BY total_spent DESC
    LIMIT 10
  `,
    [year],
  );

  // ============================
  // KPI – TOP 3 SALES COUNT (YEAR)
  // ============================
  const topSales = await db.query(
    `
    SELECT
      c.id,
      c.name,
      COUNT(*) AS sales_count
    FROM invoice_header ih
    JOIN clients c ON c.id = ih.client_id
    WHERE EXTRACT(YEAR FROM ih.date) = $1
    GROUP BY c.id, c.name
    ORDER BY sales_count DESC
    LIMIT 10
  `,
    [year],
  );

  return {
    spending_monthly: spendingMonthly.rows,
    count_monthly: countMonthly.rows,
    top_spending_clients: topSpending.rows,
    top_sales_clients: topSales.rows,
  };
};

// ─── 1. Daily KPIs (total sales + invoice count for a given date) ───────────
const getMobileDailyKpis = async (db, date) => {
  const res = await db.query(
    `
    SELECT
      COALESCE(SUM(total), 0) AS total_sales,
      COUNT(*)::int           AS invoice_count
    FROM invoice_header
    WHERE date::date = $1::date
    `,
    [date]
  );

  return {
    date,
    total_sales: Number(res.rows[0].total_sales),
    invoice_count: res.rows[0].invoice_count,
  };
};


// ─── 2. Monthly KPIs (total sales amount + invoice count for a given month) ──
const getMobileMonthlyKpis = async (db, year, month) => {
  const monthStr = String(month).padStart(2, "0");

  const from = `${year}-${monthStr}-01`;

  const res = await db.query(
    `
    SELECT
      COALESCE(SUM(total), 0) AS total_sales,
      COUNT(*)::int           AS invoice_count
    FROM invoice_header
    WHERE date::date >= $1::date
      AND date::date <  ($1::date + INTERVAL '1 month')
    `,
    [from]
  );

  return {
    year,
    month,
    total_sales: Number(res.rows[0].total_sales),
    invoice_count: res.rows[0].invoice_count,
  };
};


// ─── 3. Low-stock alerts (same logic as desktop) ────────────────────────────
const getMobileLowStock = async (db) => {
  const res = await db.query(
    `
    SELECT
      id,
      name,
      stock_qty,
      minimum_qty_alert,
      (minimum_qty_alert - stock_qty) AS deficit
    FROM items
    WHERE is_stocked = true
      AND (stock_qty - minimum_qty_alert) < 0
    ORDER BY (stock_qty - minimum_qty_alert) ASC
    LIMIT 50
    `,
  );

  return res.rows;
};

const deleteStorageTransaction = async (db, log_id) => {
  try {
    await db.query("BEGIN");

    await db.query(`SELECT delete_stock_transaction($1)`, [log_id]);

    await db.query("COMMIT");
  } catch (err) {
    await db.query("ROLLBACK");
    throw err;
  }
};

const getNextReceiptVoucherNumber = async (db) => {
  const res = await db.query(`
    SELECT
      'RV-' || LPAD(
        (
          COALESCE(
            MAX(CAST(SUBSTRING(receipt_number FROM 4) AS INTEGER)),
            0
          ) + 1
        )::TEXT,
        4,
        '0'
      ) AS next_number
    FROM receipt_voucher
  `);

  return res.rows[0].next_number;
};

const createDueBalance = async (
  db,
  { reason, date, amount, client_id, notes },
) => {
  try {
    const dueDate =
      date && !Number.isNaN(Date.parse(date))
        ? date
        : new Date().toISOString().slice(0, 10);

    const result = await db.query(
      `
      INSERT INTO due_balances
        (reason, date, amount, client_id, notes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
      `,
      [reason, dueDate, amount, client_id, notes || null],
    );

    return result.rows[0];
  } catch (err) {
    throw err;
  }
};

const updateDueBalance = async (
  db,
  dueBalanceId,
  { reason, date, amount, notes },
) => {
  try {
    const result = await db.query(
      `
      UPDATE due_balances
      SET
        reason = COALESCE($1, reason),
        date   = COALESCE($2, date),
        amount = COALESCE($3, amount),
        notes  = COALESCE($4, notes),
        updated_at = NOW()
      WHERE id = $5
      RETURNING *;
      `,
      [reason, date, amount, notes, dueBalanceId],
    );

    if (result.rows.length === 0) {
      throw new Error("Due balance not found");
    }

    return result.rows[0];
  } catch (err) {
    throw err;
  }
};

const deleteDueBalance = async (db, dueBalanceId) => {
  try {
    const result = await db.query(
      `
      DELETE FROM due_balances
      WHERE id = $1
      RETURNING *;
      `,
      [dueBalanceId],
    );

    if (result.rows.length === 0) {
      throw new Error("Due balance not found");
    }

    return result.rows[0];
  } catch (err) {
    throw err;
  }
};

const getDueBalanceById = async (db, dueBalanceId) => {
  try {
    const result = await db.query(
      `
      SELECT
        db.id,
        db.reason,
        TO_CHAR(db.date, 'YYYY-MM-DD') AS date,
        db.amount,
        db.client_id,
        c.name AS client_name,
        db.notes
      FROM due_balances db
      LEFT JOIN clients c
        ON c.id = db.client_id
      WHERE db.id = $1;
      `,
      [dueBalanceId],
    );

    if (result.rows.length === 0) {
      throw new Error("Due balance not found");
    }

    return result.rows[0];
  } catch (err) {
    throw err;
  }
};

const createReceiptVoucher = async (
  db,
  { due_balance_id, date, type, amount, reason, notes },
) => {
  try {
    // 1️⃣ get client_id from due balance
    const dueRes = await db.query(
      `
      SELECT client_id
      FROM due_balances
      WHERE id = $1
      `,
      [due_balance_id],
    );

    if (dueRes.rows.length === 0) {
      throw new Error("Due balance not found");
    }

    const client_id = dueRes.rows[0].client_id;

    // 2️⃣ generate RV number
    const receipt_number = await getNextReceiptVoucherNumber(db);

    // 3️⃣ normalize date
    const rvDate =
      date && !Number.isNaN(Date.parse(date))
        ? date
        : new Date().toISOString().slice(0, 10);

    // 4️⃣ insert
    const result = await db.query(
      `
      INSERT INTO receipt_voucher
        (due_balance_id, client_id, receipt_number, date, type, amount, reason, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
      `,
      [
        due_balance_id,
        client_id,
        receipt_number,
        rvDate,
        type,
        amount,
        reason || null,
        notes || null,
      ],
    );

    return result.rows[0];
  } catch (err) {
    throw err;
  }
};

const updateReceiptVoucher = async (
  db,
  receiptVoucherId,
  { date, type, amount, reason, notes },
) => {
  try {
    const rvDate = date && !Number.isNaN(Date.parse(date)) ? date : null;

    const result = await db.query(
      `
      UPDATE receipt_voucher
      SET
        date   = COALESCE($1, date),
        type   = COALESCE($2, type),
        amount = COALESCE($3, amount),
        reason = COALESCE($4, reason),
        notes  = COALESCE($5, notes)
      WHERE id = $6
      RETURNING *;
      `,
      [rvDate, type, amount, reason, notes, receiptVoucherId],
    );

    if (result.rows.length === 0) {
      throw new Error("Receipt voucher not found");
    }

    return result.rows[0];
  } catch (err) {
    throw err;
  }
};

const deleteReceiptVoucher = async (db, receiptVoucherId) => {
  try {
    const result = await db.query(
      `
      DELETE FROM receipt_voucher
      WHERE id = $1
      RETURNING *;
      `,
      [receiptVoucherId],
    );

    if (result.rows.length === 0) {
      throw new Error("Receipt voucher not found");
    }

    return result.rows[0];
  } catch (err) {
    throw err;
  }
};

const createReceiptCheque = async (
  db,
  {
    receipt_voucher_id,
    cheque_number,
    cheque_amount,
    due_date,
    beneficiary_bank,
  },
) => {
  try {
    const chequeDueDate =
      due_date && !Number.isNaN(Date.parse(due_date))
        ? due_date
        : new Date().toISOString().slice(0, 10);

    const result = await db.query(
      `
      INSERT INTO receipt_cheques
        (receipt_voucher_id, cheque_number, cheque_amount, due_date, beneficiary_bank)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
      `,
      [
        receipt_voucher_id,
        cheque_number,
        cheque_amount,
        chequeDueDate,
        beneficiary_bank,
      ],
    );

    return result.rows[0];
  } catch (err) {
    throw err;
  }
};

const updateReceiptCheque = async (
  db,
  chequeId,
  { cheque_number, cheque_amount, due_date, beneficiary_bank },
) => {
  try {
    const result = await db.query(
      `
      UPDATE receipt_cheques
      SET
        cheque_number     = COALESCE($1, cheque_number),
        cheque_amount     = COALESCE($2, cheque_amount),
        due_date          = COALESCE($3, due_date),
        beneficiary_bank  = COALESCE($4, beneficiary_bank)
      WHERE id = $5
      RETURNING *;
      `,
      [cheque_number, cheque_amount, due_date, beneficiary_bank, chequeId],
    );

    if (result.rows.length === 0) {
      throw new Error("Receipt cheque not found");
    }

    return result.rows[0];
  } catch (err) {
    throw err;
  }
};

const deleteReceiptCheque = async (db, chequeId) => {
  try {
    const result = await db.query(
      `
      DELETE FROM receipt_cheques
      WHERE id = $1
      RETURNING *;
      `,
      [chequeId],
    );

    if (result.rows.length === 0) {
      throw new Error("Receipt cheque not found");
    }

    return result.rows[0];
  } catch (err) {
    throw err;
  }
};

const getDueBalances = async (
  db,
  { page = 1, limit = 20, client_id, from_date, to_date },
) => {
  const offset = (page - 1) * limit;

  const filters = [];
  const values = [];

  if (client_id) {
    values.push(client_id);
    filters.push(`db.client_id = $${values.length}`);
  }

  if (from_date) {
    values.push(from_date);
    filters.push(`db.date >= $${values.length}`);
  }

  if (to_date) {
    values.push(to_date);
    filters.push(`db.date <= $${values.length}`);
  }

  const whereClause =
    filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";

  const dataQuery = `
    SELECT
      db.id,
      db.reason,
      db.amount,
      db.date,

      COALESCE(SUM(rv.amount), 0) AS paid,

      CASE
        WHEN COALESCE(SUM(rv.amount), 0) = 0 THEN 'outstanding'
        WHEN COALESCE(SUM(rv.amount), 0) < db.amount THEN 'pending'
        ELSE 'completed'
      END AS state,

      c.name AS client

    FROM due_balances db

    LEFT JOIN receipt_voucher rv
      ON rv.due_balance_id = db.id

    LEFT JOIN clients c
      ON c.id = db.client_id

    ${whereClause}

    GROUP BY
      db.id,
      db.date,
      c.name

    ORDER BY db.id DESC

    LIMIT $${values.length + 1}
    OFFSET $${values.length + 2};
  `;

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM due_balances db
    ${whereClause};
  `;

  const dataValues = [...values, limit, offset];

  const dataRes = await db.query(dataQuery, dataValues);
  const countRes = await db.query(countQuery, values);

  return {
    data: dataRes.rows,
    pagination: {
      page,
      limit,
      total: Number(countRes.rows[0].total),
      totalPages: Math.ceil(countRes.rows[0].total / limit),
    },
  };
};

const getReceiptVouchersByDueBalance = async (db, dueBalanceId) => {
  try {
    const result = await db.query(
      `
      SELECT
        rv.id,
        rv.receipt_number,
        TO_CHAR(rv.date, 'YYYY-MM-DD') AS date,
        rv.amount,
        rv.type,
        rv.reason
      FROM receipt_voucher rv
      WHERE rv.due_balance_id = $1
      ORDER BY rv.date ASC, rv.id ASC;
      `,
      [dueBalanceId],
    );

    return result.rows;
  } catch (err) {
    throw err;
  }
};

const getReceiptVoucherDetails = async (db, receiptVoucherId) => {
  try {
    const rvRes = await db.query(
      `
      SELECT
        rv.id,
        rv.receipt_number,
        rv.type,
        rv.amount,
        rv.reason,
        rv.notes,
        TO_CHAR(rv.date, 'YYYY-MM-DD') AS date,
        c.name AS client
      FROM receipt_voucher rv
      LEFT JOIN clients c
        ON c.id = rv.client_id
      WHERE rv.id = $1;
      `,
      [receiptVoucherId],
    );

    if (rvRes.rows.length === 0) {
      throw new Error("Receipt voucher not found");
    }

    const receipt = rvRes.rows[0];

    let cheques = [];

    if (receipt.type === "cheque") {
      const chequeRes = await db.query(
        `
        SELECT
          id,
          cheque_number,
          cheque_amount,
          TO_CHAR(due_date, 'YYYY-MM-DD') AS due_date,
          beneficiary_bank
        FROM receipt_cheques
        WHERE receipt_voucher_id = $1
        ORDER BY id ASC;
        `,
        [receiptVoucherId],
      );

      cheques = chequeRes.rows;
    }

    return {
      receipt_number: receipt.receipt_number,
      type: receipt.type,
      amount: receipt.amount,
      client: receipt.client,
      date: receipt.date,
      reason: receipt.reason,
      notes: receipt.notes,
      cheques,
    };
  } catch (err) {
    throw err;
  }
};

const createStandaloneReceipt = async (
  db,
  { client_id, date, amount, type, reason, notes, cheques = [] },
) => {
  try {
    await db.query("BEGIN");

    // normalize date (DO NOT override user input)
    const finalDate = date;

    // 1️⃣ Create due balance
    const dueRes = await db.query(
      `
      INSERT INTO due_balances
        (reason, date, amount, client_id, notes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id;
      `,
      [reason, finalDate, amount, client_id, notes || null],
    );

    const due_balance_id = dueRes.rows[0].id;

    // 2️⃣ Generate RV number
    const receipt_number = await getNextReceiptVoucherNumber(db);

    // 3️⃣ Create receipt voucher
    const rvRes = await db.query(
      `
      INSERT INTO receipt_voucher
        (due_balance_id, client_id, receipt_number, date, type, amount, reason, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id;
      `,
      [
        due_balance_id,
        client_id,
        receipt_number,
        finalDate,
        type,
        amount,
        reason || null,
        notes || null,
      ],
    );

    const receipt_voucher_id = rvRes.rows[0].id;

    // 4️⃣ Create cheques if needed
    if (type === "cheque") {
      for (const ch of cheques) {
        await db.query(
          `
          INSERT INTO receipt_cheques
            (receipt_voucher_id, cheque_number, cheque_amount, due_date, beneficiary_bank)
          VALUES ($1, $2, $3, $4, $5)
          `,
          [
            receipt_voucher_id,
            ch.cheque_number,
            ch.cheque_amount,
            ch.due_date,
            ch.beneficiary_bank,
          ],
        );
      }
    }

    await db.query("COMMIT");

    return {
      due_balance_id,
      receipt_voucher_id,
    };
  } catch (err) {
    await db.query("ROLLBACK");
    throw err;
  }
};

const getClientReceiptsTotals = async (
  db,
  { client_id, from_date, to_date },
) => {
  if (!client_id) {
    throw new Error("client_id is required");
  }

  const filters = [];
  const values = [];

  values.push(client_id);
  filters.push(`db.client_id = $${values.length}`);

  if (from_date) {
    values.push(from_date);
    filters.push(`db.date >= $${values.length}`);
  }

  if (to_date) {
    values.push(to_date);
    filters.push(`db.date <= $${values.length}`);
  }

  const whereClause =
    filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";

  const query = `
    SELECT
      COALESCE(SUM(db.amount), 0)          AS total_balance,
      COALESCE(SUM(rv.amount), 0)          AS total_paid,
      COALESCE(SUM(db.amount), 0)
        - COALESCE(SUM(rv.amount), 0)      AS total_outstanding
    FROM due_balances db
    LEFT JOIN receipt_voucher rv
      ON rv.due_balance_id = db.id
    ${whereClause};
  `;

  const res = await db.query(query, values);

  return {
    total_balance: Number(res.rows[0].total_balance),
    total_paid: Number(res.rows[0].total_paid),
    total_outstanding: Number(res.rows[0].total_outstanding),
  };
};

// ===== receipts dashboard block =====

const getReceiptsMonthlyDueVsPaid = async (db, year) => {
  const query = `
    WITH months AS (
      SELECT generate_series(1, 12) AS month_index
    )
    SELECT
      m.month_index,
      COALESCE(SUM(db.amount), 0) AS due,
      COALESCE(SUM(rv.amount), 0) AS paid
    FROM months m
    LEFT JOIN due_balances db
      ON EXTRACT(MONTH FROM db.date) = m.month_index
     AND EXTRACT(YEAR FROM db.date) = $1
    LEFT JOIN receipt_voucher rv
      ON rv.due_balance_id = db.id
     AND EXTRACT(YEAR FROM rv.date) = $1
    GROUP BY m.month_index
    ORDER BY m.month_index;
  `;

  const res = await db.query(query, [year]);
  return res.rows;
};

const getTopClientsByOutstanding = async (db, year) => {
  const query = `
    SELECT
      c.id,
      c.name,
      SUM(db.amount) - COALESCE(SUM(rv.amount), 0) AS outstanding
    FROM due_balances db
    LEFT JOIN receipt_voucher rv
      ON rv.due_balance_id = db.id
    LEFT JOIN clients c
      ON c.id = db.client_id
    WHERE EXTRACT(YEAR FROM db.date) = $1
    GROUP BY c.id, c.name
    HAVING SUM(db.amount) - COALESCE(SUM(rv.amount), 0) > 0
    ORDER BY outstanding DESC
    LIMIT 5;
  `;

  return (await db.query(query, [year])).rows;
};

const getTopOutstandingBalances = async (db, year) => {
  const query = `
    SELECT
      db.id,
      db.reason,
      db.date,
      c.name AS client,
      db.amount,
      COALESCE(SUM(rv.amount), 0) AS paid
    FROM due_balances db
    LEFT JOIN receipt_voucher rv
      ON rv.due_balance_id = db.id
    LEFT JOIN clients c
      ON c.id = db.client_id
    WHERE EXTRACT(YEAR FROM db.date) = $1
    GROUP BY db.id, c.name
    HAVING COALESCE(SUM(rv.amount), 0) < db.amount
    ORDER BY (db.amount - COALESCE(SUM(rv.amount), 0)) DESC
    LIMIT 10;
  `;

  return (await db.query(query, [year])).rows;
};

const getAgingBalances = async (db) => {
  const query = `
    SELECT
      db.id,
      db.reason,
      db.date,
      c.name AS client,
      db.amount,
      COALESCE(MAX(rv.date), db.date) AS last_payment_date,
      CURRENT_DATE - COALESCE(MAX(rv.date), db.date) AS aging_days
    FROM due_balances db
    LEFT JOIN receipt_voucher rv
      ON rv.due_balance_id = db.id
    LEFT JOIN clients c
      ON c.id = db.client_id
    GROUP BY db.id, db.date, c.name
    ORDER BY aging_days DESC
    LIMIT 10;
  `;

  return (await db.query(query)).rows;
};

const getReceiptsDashboard = async (db, year) => {
  const monthly_due_vs_paid = await getReceiptsMonthlyDueVsPaid(db, year);
  const top_clients_outstanding = await getTopClientsByOutstanding(db, year);
  const top_outstanding_balances = await getTopOutstandingBalances(db, year);
  const aging_balances = await getAgingBalances(db);

  return {
    monthly_due_vs_paid,
    top_clients_outstanding,
    top_outstanding_balances,
    aging_balances,
  };
};

// ===============================
// Report: Receipts by Client (RV list)
// ===============================
const getClientReceiptsReport = async (
  db,
  { client_id, from, to, limit, offset },
) => {
  if (!client_id) throw new Error("client_id is required");
  if (!from || !to) throw new Error("from and to are required");

  // 1️⃣ Rows
  const rowsRes = await db.query(
    `
    SELECT
      rv.receipt_number,
      TO_CHAR(rv.date, 'YYYY-MM-DD') AS date,
      rv.amount,
      rv.reason
    FROM receipt_voucher rv
    INNER JOIN due_balances db
      ON db.id = rv.due_balance_id
    WHERE db.client_id = $1
      AND db.date BETWEEN $2 AND $3
    ORDER BY rv.date ASC, rv.id ASC
    LIMIT $4 OFFSET $5
    `,
    [client_id, from, to, limit, offset],
  );

  // 2️⃣ Totals
  const totalRes = await db.query(
    `
    SELECT
      COALESCE(SUM(rv.amount), 0) AS total_sum,
      COUNT(rv.id) AS total_count
    FROM receipt_voucher rv
    INNER JOIN due_balances db
      ON db.id = rv.due_balance_id
    WHERE db.client_id = $1
      AND db.date BETWEEN $2 AND $3
    `,
    [client_id, from, to],
  );

  return {
    rows: rowsRes.rows,
    total_sum: Number(totalRes.rows[0].total_sum),
    total_count: Number(totalRes.rows[0].total_count),
  };
};

const getPrintableDueBalance = async (db, dueBalanceId) => {
  // 1️⃣ Due balance header
  const dueRes = await db.query(
    `
    SELECT
      db.id,
      db.reason,
      TO_CHAR(db.date, 'YYYY-MM-DD') AS date,
      db.amount,
      c.name AS client
    FROM due_balances db
    LEFT JOIN clients c ON c.id = db.client_id
    WHERE db.id = $1
    `,
    [dueBalanceId],
  );

  if (dueRes.rows.length === 0) {
    throw new Error("Due balance not found");
  }

  // 2️⃣ Receipt vouchers
  const rvRes = await db.query(
    `
    SELECT
      rv.receipt_number,
      TO_CHAR(rv.date, 'YYYY-MM-DD') AS date,
      rv.amount,
      rv.reason,
      rv.type
    FROM receipt_voucher rv
    WHERE rv.due_balance_id = $1
    ORDER BY rv.date ASC, rv.id ASC
    `,
    [dueBalanceId],
  );

  // 3️⃣ Totals
  const totalsRes = await db.query(
    `
    SELECT
      db.amount AS total_due,
      COALESCE(SUM(rv.amount), 0) AS total_paid,
      db.amount - COALESCE(SUM(rv.amount), 0) AS total_outstanding
    FROM due_balances db
    LEFT JOIN receipt_voucher rv
      ON rv.due_balance_id = db.id
    WHERE db.id = $1
    GROUP BY db.amount
    `,
    [dueBalanceId],
  );

  return {
    due: dueRes.rows[0],
    receipts: rvRes.rows,
    totals: totalsRes.rows[0],
  };
};

module.exports = {
  getInvoices,
  getInvoiceDetails,
  getFullInvoice,
  getInvoiceHeaderById,
  updateInvoiceHeader,
  createInvoice,
  getNextInvoiceNumber,
  searchInvoices,
  saveCompanyConfig,
  getCompanyConfig,
  getDailyStats,
  getHourlySales,
  getInvoicesByDate,
  getNextReturnInvoiceNumber,
  saveVoidInvoices,
  getVoidedInvoicesByDate,
  getInvoiceForReturn,
  saveVoidInvoiceQR,
  getUnsharedInvoices,
  saveInvoiceQR,
  getPosCounts,
  getLast7DaysIncome,
  getAllClients,
  updateInvoiceFull,
  getAllCategories,
  getItemsByCategory,
  getFavoriteItems,
  toggleFavoriteItem,
  getAllUnits,
  createUnit,
  updateUnit,
  createCategory,
  updateCategory,
  createItem,
  getItemById,
  updateItem,
  getAllStorages,
  createStorage,
  updateStorage,
  getStorageOverview,
  getStorageItems,
  getStorageLogs,
  adjustStorageManually,
  getAllItems,
  assertPosItemsCurrentlySellable,
  createClient,
  updateClient,
  deleteClient,
  getClientById,
  getClientMonthlyTotals,
  getClientMonthlySalesCount,
  getClientLastInvoices,
  getClientInvoicesByDateRange,
  searchItemsGlobal,
  getNextRefundInvoiceNumber,
  getRefundSummaryForOriginal,
  getRefundInvoices,
  getRefundFullInvoice,
  createRefundInvoice,
  saveRefundInvoiceQR,
  getInvoicesByDateRange,
  uploadCompanyLogo,
  getCompanyLogoSignedUrl,
  getGeneralSalesReport,
  getSalesByClientReport,
  getSalesByAreaReport,
  getSalesByClientDetailedReport,
  getEinvoicingReport,
  getTaxDeclarationReport,
  getRefundsReport,
  getRefundsByClientReport,
  getItemsSalesReport,
  getItemSalesDetailsReport,
  getStorageInventoryReport,
  getTransactionLogsReport,
  getSalesRefundsCombinedReport,
  getSalesRefundsCombinedByClientReport,
  getDashboardKpis,
  getDashboardOverview,
  getDashboardSales,
  getDashboardInventory,
  getDashboardClients,
  getItemsSoldForClientTotals,
  deleteStorageTransaction,
  createDueBalance,
  updateDueBalance,
  deleteDueBalance,
  getDueBalanceById,
  createReceiptVoucher,
  updateReceiptVoucher,
  deleteReceiptVoucher,
  createReceiptCheque,
  updateReceiptCheque,
  deleteReceiptCheque,
  getDueBalances,
  getReceiptVouchersByDueBalance,
  getReceiptVoucherDetails,
  createStandaloneReceipt,
  getClientReceiptsTotals,
  getReceiptsDashboard,
  getClientReceiptsReport,
  getPrintableDueBalance,
  getMobileDailyKpis,
  getMobileMonthlyKpis,
  getMobileLowStock,
};
