const createRequestError = (message, statusCode = 400, code = "POS_REQUEST_INVALID") => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
};

const validateIdempotencyKey = (idempotencyKey) => {
  const normalized = String(idempotencyKey || "").trim();

  if (!normalized) {
    throw createRequestError(
      "Payment request key is required",
      400,
      "POS_IDEMPOTENCY_REQUIRED",
    );
  }

  if (normalized.length > 120) {
    throw createRequestError(
      "Payment request key is too long",
      400,
      "POS_IDEMPOTENCY_INVALID",
    );
  }

  return normalized;
};

const reservePosInvoiceRequest = async (db, { idempotencyKey, userId, sessionId }) => {
  const normalizedKey = validateIdempotencyKey(idempotencyKey);

  const result = await db.query(
    `
      INSERT INTO pos_invoice_requests (idempotency_key, user_id, session_id)
      VALUES ($1, $2, $3)
      RETURNING id, idempotency_key, invoice_id
    `,
    [normalizedKey, userId, sessionId || null],
  );

  return result.rows[0];
};

const markPosInvoiceRequestCompleted = async (db, { idempotencyKey, invoiceId }) => {
  const normalizedKey = validateIdempotencyKey(idempotencyKey);

  await db.query(
    `
      UPDATE pos_invoice_requests
      SET
        invoice_id = $2,
        updated_at = NOW()
      WHERE idempotency_key = $1
    `,
    [normalizedKey, invoiceId],
  );
};

const getPosInvoiceRequestByKey = async (db, idempotencyKey) => {
  const normalizedKey = validateIdempotencyKey(idempotencyKey);

  const result = await db.query(
    `
      SELECT
        id,
        idempotency_key,
        invoice_id,
        user_id,
        session_id,
        created_at,
        updated_at
      FROM pos_invoice_requests
      WHERE idempotency_key = $1
      LIMIT 1
    `,
    [normalizedKey],
  );

  return result.rows[0] || null;
};

module.exports = {
  getPosInvoiceRequestByKey,
  markPosInvoiceRequestCompleted,
  reservePosInvoiceRequest,
  validateIdempotencyKey,
};
