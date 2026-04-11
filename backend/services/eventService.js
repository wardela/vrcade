const invoiceService = require("./invoiceService");

const EVENT_CATEGORY_NAME = "Events";
const EVENT_ITEM_NAME = "Payment for Event";
const EVENT_ITEM_CODE = "SYS-EVENT-PAY";
const EVENT_ITEM_TAX_PERCENTAGE = 16;
const INVOICE_NUMBER_LOCK_KEY = 904119;
const VALID_EVENT_PAYMENT_METHODS = new Set(["cash", "card", "transfer"]);
const VALID_EVENT_STATUSES = new Set(["open", "ended"]);

const createValidationError = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

const normalizeOptionalText = (value) => {
  if (value == null) return null;
  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : null;
};

const normalizeRequiredText = (value, fieldLabel) => {
  const normalized = normalizeOptionalText(value);
  if (!normalized) {
    throw createValidationError(`${fieldLabel} is required`);
  }

  return normalized;
};

const normalizeDateValue = (value, fieldLabel, { required = true } = {}) => {
  if (value == null || value === "") {
    if (!required) return null;
    throw createValidationError(`${fieldLabel} is required`);
  }

  const normalized = String(value).trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw createValidationError(`${fieldLabel} must be a valid date`);
  }

  return normalized;
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

  throw createValidationError("Event time must be a valid time");
};

const normalizeMoneyValue = (value, fieldLabel, { allowZero = false } = {}) => {
  if (value == null || value === "") {
    throw createValidationError(`${fieldLabel} is required`);
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw createValidationError(`${fieldLabel} must be a valid number`);
  }

  if (allowZero ? parsed < 0 : parsed <= 0) {
    throw createValidationError(
      `${fieldLabel} must be ${allowZero ? "zero or greater" : "greater than zero"}`,
    );
  }

  return parsed;
};

const normalizeOptionalMoneyValue = (value, fieldLabel, { defaultValue = 0 } = {}) => {
  if (value == null || value === "") return defaultValue;
  return normalizeMoneyValue(value, fieldLabel, { allowZero: true });
};

const normalizePaymentMethod = (value, fieldLabel = "Payment method") => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  if (!VALID_EVENT_PAYMENT_METHODS.has(normalized)) {
    throw createValidationError(`${fieldLabel} must be cash, card, or transfer`);
  }

  return normalized;
};

const normalizeEventStatus = (value, fieldLabel = "Event status") => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  if (!VALID_EVENT_STATUSES.has(normalized)) {
    throw createValidationError(`${fieldLabel} must be open or ended`);
  }

  return normalized;
};

const padDatePart = (value) => String(value).padStart(2, "0");

const combineDateWithCurrentLocalTime = (dateValue) => {
  const now = new Date();
  return `${dateValue} ${padDatePart(now.getHours())}:${padDatePart(now.getMinutes())}:${padDatePart(
    now.getSeconds(),
  )}.${String(now.getMilliseconds()).padStart(3, "0")}`;
};

const isGreaterThan = (left, right) => Number(left) - Number(right) > 0.000001;

const normalizeCreatePayload = (payload = {}) => {
  const totalAmount = normalizeMoneyValue(payload.total_amount, "Total amount");
  const initialPaymentAmount = normalizeOptionalMoneyValue(
    payload.initial_payment_amount,
    "Initial payment amount",
  );

  if (isGreaterThan(initialPaymentAmount, totalAmount)) {
    throw createValidationError("Initial payment amount cannot exceed total amount");
  }

  const initialPaymentDate =
    initialPaymentAmount > 0
      ? normalizeDateValue(payload.initial_payment_date, "Initial payment date")
      : normalizeDateValue(payload.initial_payment_date, "Initial payment date", {
          required: false,
        });
  const initialPaymentMethod =
    initialPaymentAmount > 0
      ? normalizePaymentMethod(payload.initial_payment_method, "Initial payment method")
      : null;

  return {
    name: normalizeRequiredText(payload.name, "Event name"),
    type: normalizeRequiredText(payload.type, "Type"),
    location: normalizeOptionalText(payload.location),
    event_date: normalizeDateValue(payload.event_date, "Event date"),
    event_time: normalizeTimeValue(payload.event_time),
    client_id: Number(payload.client_id),
    details: normalizeOptionalText(payload.details),
    notes: normalizeOptionalText(payload.notes),
    total_amount: totalAmount,
    initial_payment_amount: initialPaymentAmount,
    initial_payment_date: initialPaymentDate,
    initial_payment_method: initialPaymentMethod,
    status: "open",
  };
};

const normalizePaymentPayload = (payload = {}, { paymentType = "regular" } = {}) => ({
  amount: normalizeMoneyValue(payload.amount, "Payment amount"),
  payment_date: normalizeDateValue(payload.payment_date, "Payment date"),
  payment_method: normalizePaymentMethod(payload.payment_method),
  payment_type: normalizeOptionalText(payload.payment_type) || paymentType,
  notes: normalizeOptionalText(payload.notes),
});

const normalizeAmountUpdatePayload = (payload = {}) => ({
  total_amount: normalizeMoneyValue(payload.total_amount, "Total amount"),
});

const normalizeStatusUpdatePayload = (payload = {}) => ({
  status: normalizeEventStatus(payload.status),
});

const getClientOrThrow = async (db, clientId) => {
  const numericClientId = Number(clientId);
  if (!Number.isInteger(numericClientId) || numericClientId <= 0) {
    throw createValidationError("Client is required");
  }

  const client = await invoiceService.getClientById(db, numericClientId);
  if (!client) {
    throw createValidationError("Selected client was not found");
  }

  return client;
};

const ensureEventInvoiceItem = async (db) => {
  const categoryLookup = await db.query(
    `
      SELECT id, COALESCE(is_system_locked, false) AS is_system_locked
      FROM categories
      WHERE LOWER(BTRIM(name)) = LOWER($1)
      ORDER BY id ASC
      LIMIT 1
    `,
    [EVENT_CATEGORY_NAME],
  );

  let categoryId = categoryLookup.rows[0]?.id ?? null;

  if (!categoryId) {
    const insertedCategory = await db.query(
      `
        INSERT INTO categories (name, is_system_locked)
        VALUES ($1, true)
        RETURNING id
      `,
      [EVENT_CATEGORY_NAME],
    );
    categoryId = insertedCategory.rows[0].id;
  } else if (!categoryLookup.rows[0].is_system_locked) {
    await db.query(`UPDATE categories SET is_system_locked = true WHERE id = $1`, [categoryId]);
  }

  const unitLookup = await db.query(
    `
      SELECT id
      FROM units
      ORDER BY id ASC
      LIMIT 1
    `,
  );

  if (unitLookup.rows.length === 0) {
    throw new Error("At least one unit record is required before creating the event payment item");
  }

  const defaultUnitId = unitLookup.rows[0].id;

  const itemLookup = await db.query(
    `
      SELECT i.id, COALESCE(i.is_system_locked, false) AS is_system_locked
      FROM items i
      INNER JOIN categories c ON c.id = i.category
      WHERE LOWER(BTRIM(i.name)) = LOWER($1)
        AND LOWER(BTRIM(c.name)) = LOWER($2)
      ORDER BY i.id ASC
      LIMIT 1
    `,
    [EVENT_ITEM_NAME, EVENT_CATEGORY_NAME],
  );

  let itemId = itemLookup.rows[0]?.id ?? null;

  if (!itemId) {
    const insertedItem = await db.query(
      `
        INSERT INTO items (
          code,
          name,
          price_with_tax,
          tax_percentage,
          category,
          fav,
          unit,
          minimum_qty_alert,
          stock_qty,
          usual_discount_percentage,
          usual_sales_qty,
          notes,
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
          offer_end_date,
          is_system_locked
        )
        VALUES (
          $1,
          $2,
          0,
          $3,
          $4,
          false,
          $5,
          0,
          0,
          0,
          1,
          $6,
          false,
          null,
          false,
          0,
          false,
          false,
          true,
          null,
          null,
          null,
          null,
          true
        )
        RETURNING id
      `,
      [
        EVENT_ITEM_CODE,
        EVENT_ITEM_NAME,
        EVENT_ITEM_TAX_PERCENTAGE,
        categoryId,
        defaultUnitId,
        "System item used automatically for event payment invoices",
      ],
    );
    itemId = insertedItem.rows[0].id;
  } else if (!itemLookup.rows[0].is_system_locked) {
    await db.query(
      `
        UPDATE items
        SET code = $1,
            name = $2,
            price_with_tax = 0,
            tax_percentage = $3,
            category = $4,
            fav = false,
            unit = COALESCE(unit, $5),
            minimum_qty_alert = 0,
            usual_discount_percentage = 0,
            usual_sales_qty = 1,
            notes = $6,
            is_stocked = false,
            default_storage_id = null,
            has_tokens = false,
            token_count = 0,
            is_offer_item = false,
            offer_is_active = false,
            offer_is_24_7 = true,
            offer_start_time = null,
            offer_end_time = null,
            offer_start_date = null,
            offer_end_date = null,
            is_system_locked = true
        WHERE id = $7
      `,
      [
        EVENT_ITEM_CODE,
        EVENT_ITEM_NAME,
        EVENT_ITEM_TAX_PERCENTAGE,
        categoryId,
        defaultUnitId,
        "System item used automatically for event payment invoices",
        itemId,
      ],
    );
  }

  return { categoryId, itemId };
};

const createInvoiceForEventPayment = async (
  db,
  { event, client, payment, itemId, userId = null },
) => {
  await db.query(`SELECT pg_advisory_xact_lock($1)`, [INVOICE_NUMBER_LOCK_KEY]);

  const invoiceNumber = await invoiceService.getNextInvoiceNumber(db);
  const createdInvoice = await invoiceService.createInvoice(
    db,
    {
      invoice_number: invoiceNumber,
      date: combineDateWithCurrentLocalTime(payment.payment_date),
      pos: "POS-1",
      type: "credit",
      type2: "local",
      currency: "JOD",
      client_contact: client.phone || null,
      client_det_code: client.detail_type || null,
      client_detail: client.detail_value || null,
      client_id: client.id,
      client: client.name,
      notes: event.name,
      reference: null,
      user_id: userId,
      create_due_balance: false,
      lines: [
        {
          item_number: 1,
          item_id: itemId,
          description: EVENT_ITEM_NAME,
          qty: 1,
          item_price: payment.amount,
          discount_percentage: 0,
          tax: EVENT_ITEM_TAX_PERCENTAGE,
          notes: event.name,
          item_code: EVENT_ITEM_CODE,
          storage_id: null,
          unit_number: null,
          exempt: false,
        },
      ],
    },
    { manageTransaction: false },
  );

  if (!createdInvoice?.header?.id) {
    throw new Error("Failed to create invoice for event payment");
  }

  return createdInvoice;
};

const getEventPayments = async (db, eventId) => {
  const result = await db.query(
    `
      SELECT
        ep.id,
        ep.event_id,
        ep.amount,
        TO_CHAR(ep.payment_date, 'YYYY-MM-DD') AS payment_date,
        ep.payment_method,
        ep.payment_type,
        ep.notes,
        ep.created_at,
        ep.updated_at,
        ep.invoice_id,
        ih.invoice_number,
        ih.type AS invoice_type,
        ih.type2 AS invoice_locality,
        ih.date AS invoice_date
      FROM event_payments ep
      LEFT JOIN invoice_header ih
        ON ih.id = ep.invoice_id
      WHERE ep.event_id = $1
      ORDER BY ep.payment_date ASC, ep.id ASC
    `,
    [eventId],
  );

  return result.rows;
};

const getEventDetails = async (db, eventId) => {
  const eventResult = await db.query(
    `
      SELECT
        e.id,
        e.name,
        e.type,
        e.location,
        TO_CHAR(e.event_date, 'YYYY-MM-DD') AS event_date,
        TO_CHAR(e.event_time, 'HH24:MI:SS') AS event_time,
        e.client_id,
        c.name AS client_name,
        c.phone AS client_phone,
        c.detail_type AS client_detail_type,
        c.detail_value AS client_detail_value,
        e.status,
        e.details,
        e.notes,
        e.total_amount,
        e.created_at,
        e.updated_at,
        COALESCE(payments.total_paid, 0) AS total_paid,
        e.total_amount - COALESCE(payments.total_paid, 0) AS remaining_balance
      FROM events e
      INNER JOIN clients c
        ON c.id = e.client_id
      LEFT JOIN (
        SELECT event_id, SUM(amount) AS total_paid
        FROM event_payments
        GROUP BY event_id
      ) payments
        ON payments.event_id = e.id
      WHERE e.id = $1
    `,
    [eventId],
  );

  if (eventResult.rows.length === 0) {
    return null;
  }

  const event = eventResult.rows[0];
  const payments = await getEventPayments(db, eventId);

  return {
    ...event,
    payments,
  };
};

const listEvents = async (db) => {
  const result = await db.query(
    `
      SELECT
        e.id,
        e.name,
        e.type,
        e.location,
        TO_CHAR(e.event_date, 'YYYY-MM-DD') AS event_date,
        TO_CHAR(e.event_time, 'HH24:MI:SS') AS event_time,
        e.client_id,
        c.name AS client_name,
        e.status,
        e.total_amount,
        COALESCE(payments.total_paid, 0) AS total_paid,
        e.total_amount - COALESCE(payments.total_paid, 0) AS remaining_balance,
        e.created_at,
        e.updated_at
      FROM events e
      INNER JOIN clients c
        ON c.id = e.client_id
      LEFT JOIN (
        SELECT event_id, SUM(amount) AS total_paid
        FROM event_payments
        GROUP BY event_id
      ) payments
        ON payments.event_id = e.id
      ORDER BY e.event_date DESC, e.id DESC
    `,
  );

  return result.rows;
};

const createEvent = async (db, payload, { userId = null } = {}) => {
  const normalized = normalizeCreatePayload(payload);
  const client = await getClientOrThrow(db, normalized.client_id);

  try {
    await db.query("BEGIN");

    const { itemId } = await ensureEventInvoiceItem(db);

    const insertedEvent = await db.query(
      `
        INSERT INTO events (
          name,
          type,
          location,
          event_date,
          event_time,
          client_id,
          details,
          notes,
          total_amount,
          status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `,
      [
        normalized.name,
        normalized.type,
        normalized.location,
        normalized.event_date,
        normalized.event_time,
        client.id,
        normalized.details,
        normalized.notes,
        normalized.total_amount,
        normalized.status,
      ],
    );

    const eventId = insertedEvent.rows[0].id;

    if (normalized.initial_payment_amount > 0) {
      const createdInvoice = await createInvoiceForEventPayment(db, {
        event: { id: eventId, name: normalized.name },
        client,
        itemId,
        userId,
        payment: {
          amount: normalized.initial_payment_amount,
          payment_date: normalized.initial_payment_date,
        },
      });

      await db.query(
        `
          INSERT INTO event_payments (
            event_id,
            amount,
            payment_date,
            payment_method,
            payment_type,
            invoice_id,
            notes
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
        [
          eventId,
          normalized.initial_payment_amount,
          normalized.initial_payment_date,
          normalized.initial_payment_method,
          "initial",
          createdInvoice.header.id,
          normalized.notes,
        ],
      );
    }

    await db.query("COMMIT");
    return getEventDetails(db, eventId);
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  }
};

const addEventPayment = async (db, eventId, payload, { userId = null } = {}) => {
  const normalizedEventId = Number(eventId);
  if (!Number.isInteger(normalizedEventId) || normalizedEventId <= 0) {
    throw createValidationError("Event id is invalid");
  }

  const payment = normalizePaymentPayload(payload);

  try {
    await db.query("BEGIN");

    const eventResult = await db.query(
      `
        SELECT
          e.id,
          e.name,
          e.client_id,
          e.total_amount,
          COALESCE((
            SELECT SUM(amount)
            FROM event_payments
            WHERE event_id = e.id
          ), 0) AS total_paid
        FROM events e
        WHERE e.id = $1
        FOR UPDATE
      `,
      [normalizedEventId],
    );

    if (eventResult.rows.length === 0) {
      throw createValidationError("Event not found");
    }

    const event = eventResult.rows[0];
    const remainingBalance = Number(event.total_amount) - Number(event.total_paid);

    if (isGreaterThan(payment.amount, remainingBalance)) {
      throw createValidationError("Payment amount cannot exceed the remaining balance");
    }

    const client = await getClientOrThrow(db, event.client_id);
    const { itemId } = await ensureEventInvoiceItem(db);
    const createdInvoice = await createInvoiceForEventPayment(db, {
      event,
      client,
      itemId,
      userId,
      payment,
    });

    const insertedPayment = await db.query(
      `
        INSERT INTO event_payments (
          event_id,
          amount,
          payment_date,
          payment_method,
          payment_type,
          invoice_id,
          notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `,
      [
        normalizedEventId,
        payment.amount,
        payment.payment_date,
        payment.payment_method,
        payment.payment_type,
        createdInvoice.header.id,
        payment.notes,
      ],
    );

    await db.query("COMMIT");

    return {
      payment_id: insertedPayment.rows[0].id,
      event: await getEventDetails(db, normalizedEventId),
      invoice: createdInvoice.header,
    };
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  }
};

const updateEventAmount = async (db, eventId, payload) => {
  const normalizedEventId = Number(eventId);
  if (!Number.isInteger(normalizedEventId) || normalizedEventId <= 0) {
    throw createValidationError("Event id is invalid");
  }

  const { total_amount } = normalizeAmountUpdatePayload(payload);

  try {
    await db.query("BEGIN");

    const eventResult = await db.query(
      `
        SELECT
          e.id,
          COALESCE((
            SELECT SUM(amount)
            FROM event_payments
            WHERE event_id = e.id
          ), 0) AS total_paid
        FROM events e
        WHERE e.id = $1
        FOR UPDATE
      `,
      [normalizedEventId],
    );

    if (eventResult.rows.length === 0) {
      throw createValidationError("Event not found");
    }

    const totalPaid = Number(eventResult.rows[0].total_paid || 0);
    if (isGreaterThan(totalPaid, total_amount)) {
      throw createValidationError("Total amount cannot be less than the amount already paid");
    }

    await db.query(
      `
        UPDATE events
        SET total_amount = $2,
            updated_at = NOW()
        WHERE id = $1
      `,
      [normalizedEventId, total_amount],
    );

    await db.query("COMMIT");
    return getEventDetails(db, normalizedEventId);
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  }
};

const updateEventStatus = async (db, eventId, payload) => {
  const normalizedEventId = Number(eventId);
  if (!Number.isInteger(normalizedEventId) || normalizedEventId <= 0) {
    throw createValidationError("Event id is invalid");
  }

  const { status } = normalizeStatusUpdatePayload(payload);

  const updated = await db.query(
    `
      UPDATE events
      SET status = $2,
          updated_at = NOW()
      WHERE id = $1
      RETURNING id
    `,
    [normalizedEventId, status],
  );

  if (updated.rows.length === 0) {
    throw createValidationError("Event not found");
  }

  return getEventDetails(db, normalizedEventId);
};

module.exports = {
  EVENT_CATEGORY_NAME,
  EVENT_ITEM_NAME,
  ensureEventInvoiceItem,
  listEvents,
  createEvent,
  getEventDetails,
  getEventPayments,
  addEventPayment,
  updateEventAmount,
  updateEventStatus,
};
