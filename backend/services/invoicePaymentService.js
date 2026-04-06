const VALID_METHODS = new Set(["cash", "card", "transfer"]);
const MILL_FACTOR = 1000;

const createPaymentError = (message, statusCode = 400, code = "INVALID_PAYMENT") => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
};

const toMills = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    throw createPaymentError("Payment amounts must be valid numbers");
  }

  return Math.round(numeric * MILL_FACTOR);
};

const fromMills = (value) => Number((value / MILL_FACTOR).toFixed(3));

const normalizePayments = (payments) => {
  if (!Array.isArray(payments) || payments.length === 0) {
    throw createPaymentError("At least one payment row is required", 400, "PAYMENT_REQUIRED");
  }

  if (payments.length > 2) {
    throw createPaymentError("A sale can have at most two payment rows", 400, "PAYMENT_TOO_MANY_ROWS");
  }

  const normalized = payments.map((payment, index) => {
    const paymentMethod = String(payment?.payment_method || "").trim().toLowerCase();

    if (!VALID_METHODS.has(paymentMethod)) {
      throw createPaymentError("Payment method must be cash, card, or transfer", 400, "PAYMENT_METHOD_INVALID");
    }

    const amountMills = toMills(payment.amount);
    if (amountMills <= 0) {
      throw createPaymentError("Payment amount must be greater than zero", 400, "PAYMENT_AMOUNT_INVALID");
    }

    const amountPaidMills =
      payment.amount_paid == null || payment.amount_paid === ""
        ? null
        : toMills(payment.amount_paid);

    return {
      payment_method: paymentMethod,
      amount_mills: amountMills,
      amount_paid_mills: amountPaidMills,
      payment_order: index + 1,
      reference_note: payment.reference_note ? String(payment.reference_note).trim() : null,
    };
  });

  if (normalized.length === 2) {
    if (normalized[0].payment_method === normalized[1].payment_method) {
      throw createPaymentError(
        "Split payments must use two different payment methods",
        400,
        "PAYMENT_SPLIT_DUPLICATE_METHOD",
      );
    }
  }

  return normalized;
};

const validateAndPreparePayments = ({ payments, invoiceTotal, sessionId, userId }) => {
  const normalized = normalizePayments(payments);
  const invoiceTotalMills = toMills(invoiceTotal);
  const paymentSumMills = normalized.reduce((sum, payment) => sum + payment.amount_mills, 0);

  if (paymentSumMills !== invoiceTotalMills) {
    throw createPaymentError(
      "Payment rows must add up exactly to the invoice total",
      400,
      "PAYMENT_TOTAL_MISMATCH",
    );
  }

  return normalized.map((payment) => {
    if (payment.payment_method === "cash") {
      if (payment.amount_paid_mills == null) {
        throw createPaymentError(
          "Cash payments require amount paid",
          400,
          "PAYMENT_CASH_AMOUNT_PAID_REQUIRED",
        );
      }

      if (payment.amount_paid_mills < payment.amount_mills) {
        throw createPaymentError(
          "Cash amount paid cannot be less than the cash due",
          400,
          "PAYMENT_CASH_INSUFFICIENT",
        );
      }

      return {
        session_id: sessionId || null,
        user_id: userId || null,
        payment_method: payment.payment_method,
        amount: fromMills(payment.amount_mills),
        amount_paid: fromMills(payment.amount_paid_mills),
        change_amount: fromMills(payment.amount_paid_mills - payment.amount_mills),
        payment_order: payment.payment_order,
        reference_note: payment.reference_note,
      };
    }

    return {
      session_id: sessionId || null,
      user_id: userId || null,
      payment_method: payment.payment_method,
      amount: fromMills(payment.amount_mills),
      amount_paid: null,
      change_amount: null,
      payment_order: payment.payment_order,
      reference_note: payment.reference_note,
    };
  });
};

const createInvoicePayments = async (db, { invoiceId, payments }) => {
  const inserted = [];

  for (const payment of payments) {
    const result = await db.query(
      `
        INSERT INTO invoice_payments (
          invoice_id,
          session_id,
          user_id,
          payment_method,
          amount,
          amount_paid,
          change_amount,
          payment_order,
          reference_note
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING
          id,
          invoice_id,
          session_id,
          user_id,
          payment_method,
          amount,
          amount_paid,
          change_amount,
          payment_order,
          reference_note,
          created_at,
          updated_at
      `,
      [
        invoiceId,
        payment.session_id,
        payment.user_id,
        payment.payment_method,
        payment.amount,
        payment.amount_paid,
        payment.change_amount,
        payment.payment_order,
        payment.reference_note,
      ],
    );

    inserted.push(result.rows[0]);
  }

  return inserted;
};

const getInvoicePaymentsByInvoiceId = async (db, invoiceId) => {
  const result = await db.query(
    `
      SELECT
        id,
        invoice_id,
        session_id,
        user_id,
        payment_method,
        amount,
        amount_paid,
        change_amount,
        payment_order,
        reference_note,
        created_at,
        updated_at
      FROM invoice_payments
      WHERE invoice_id = $1
      ORDER BY payment_order ASC, id ASC
    `,
    [invoiceId],
  );

  return result.rows.map((row) => ({
    ...row,
    amount: Number(row.amount || 0),
    amount_paid: row.amount_paid == null ? null : Number(row.amount_paid),
    change_amount: row.change_amount == null ? null : Number(row.change_amount),
  }));
};

module.exports = {
  createInvoicePayments,
  getInvoicePaymentsByInvoiceId,
  validateAndPreparePayments,
};
