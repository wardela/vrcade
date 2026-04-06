const ACTIVE_STATUS = "active";
const ENDED_STATUS = "ended";

const createPosSessionError = (message, statusCode, code, details = null) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  if (details) {
    error.details = details;
  }
  return error;
};

const toNumber = (value) => Number(value || 0);

const getSessionDuration = (startedAt, endedAt) => {
  if (!startedAt) {
    return {
      duration_minutes: 0,
      duration_label: "0h 0m",
    };
  }

  const start = new Date(startedAt);
  const end = endedAt ? new Date(endedAt) : new Date();

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return {
      duration_minutes: 0,
      duration_label: "0h 0m",
    };
  }

  const diffMs = Math.max(0, end.getTime() - start.getTime());
  const durationMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  return {
    duration_minutes: durationMinutes,
    duration_label: `${hours}h ${minutes}m`,
  };
};

const normalizeSession = (row) => {
  if (!row) return null;

  const posPoint =
    row.pos_point_id == null
      ? null
      : {
          id: row.pos_point_id,
          name: row.pos_point_name,
          code: row.pos_point_code,
          is_active: row.pos_point_is_active,
          description: row.pos_point_description,
        };

  const user = {
    id: row.user_id,
    username: row.username,
    full_name: row.full_name,
  };

  return {
    id: row.id,
    user_id: row.user_id,
    username: row.username,
    full_name: row.full_name,
    user,
    pos: row.pos,
    pos_point_id: row.pos_point_id,
    pos_point_name: row.pos_point_name,
    pos_point_code: row.pos_point_code,
    pos_point: posPoint,
    started_at: row.started_at,
    ended_at: row.ended_at,
    status: row.status,
    opening_note: row.opening_note,
    closing_note: row.closing_note,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

const getPosPointById = async (db, posPointId, { forUpdate = false } = {}) => {
  const result = await db.query(
    `
      SELECT
        id,
        name,
        code,
        is_active,
        description,
        created_at,
        updated_at
      FROM pos_points
      WHERE id = $1
      ${forUpdate ? "FOR UPDATE" : ""}
    `,
    [posPointId],
  );

  return result.rows[0] || null;
};

const getSessionQuery = (forUpdate) => `
  SELECT
    ps.*,
    u.username,
    u.full_name,
    pp.id AS pos_point_id,
    pp.name AS pos_point_name,
    pp.code AS pos_point_code,
    pp.is_active AS pos_point_is_active,
    pp.description AS pos_point_description
  FROM pos_sessions ps
  JOIN users u
    ON u.id = ps.user_id
  LEFT JOIN pos_points pp
    ON pp.id = ps.pos_point_id
`;

const getSessionById = async (db, sessionId, { forUpdate = false } = {}) => {
  const result = await db.query(
    `
      ${getSessionQuery(forUpdate)}
      WHERE ps.id = $1
      ${forUpdate ? "FOR UPDATE OF ps" : ""}
    `,
    [sessionId],
  );

  return normalizeSession(result.rows[0]);
};

const getActiveSessionForUser = async (db, userId) => {
  const result = await db.query(
    `
      ${getSessionQuery(false)}
      WHERE ps.user_id = $1
        AND ps.status = $2
        AND ps.ended_at IS NULL
      ORDER BY ps.started_at DESC, ps.id DESC
      LIMIT 1
    `,
    [userId, ACTIVE_STATUS],
  );

  return normalizeSession(result.rows[0]);
};

const getActiveSessionForPosPoint = async (db, posPointId) => {
  const result = await db.query(
    `
      ${getSessionQuery(false)}
      WHERE ps.pos_point_id = $1
        AND ps.status = $2
        AND ps.ended_at IS NULL
      ORDER BY ps.started_at DESC, ps.id DESC
      LIMIT 1
    `,
    [posPointId, ACTIVE_STATUS],
  );

  return normalizeSession(result.rows[0]);
};

const assertSessionOwnership = (session, userId) => {
  if (session.user_id !== userId) {
    throw createPosSessionError(
      "You do not have access to this POS session",
      403,
      "POS_SESSION_FORBIDDEN",
    );
  }
};

const getOwnedSessionById = async (db, sessionId, userId, options = {}) => {
  const session = await getSessionById(db, sessionId, options);

  if (!session) {
    throw createPosSessionError("POS session not found", 404, "POS_SESSION_NOT_FOUND");
  }

  assertSessionOwnership(session, userId);
  return session;
};

const ensureSessionIsActive = (session) => {
  if (session.status !== ACTIVE_STATUS || session.ended_at) {
    throw createPosSessionError(
      "This POS session has already ended",
      409,
      "POS_SESSION_ENDED",
    );
  }
};

const getSessionPaymentStats = async (db, sessionId) => {
  const result = await db.query(
    `
      SELECT
        COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN amount ELSE 0 END), 0) AS total_cash,
        COALESCE(SUM(CASE WHEN payment_method = 'card' THEN amount ELSE 0 END), 0) AS total_card,
        COALESCE(SUM(CASE WHEN payment_method = 'transfer' THEN amount ELSE 0 END), 0) AS total_transfer,
        COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN amount_paid ELSE 0 END), 0) AS total_cash_received,
        COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN change_amount ELSE 0 END), 0) AS total_change_given
      FROM invoice_payments
      WHERE session_id = $1
    `,
    [sessionId],
  );

  const row = result.rows[0] || {};

  return {
    cash: toNumber(row.total_cash),
    card: toNumber(row.total_card),
    transfer: toNumber(row.total_transfer),
    total_cash_received: toNumber(row.total_cash_received),
    total_change_given: toNumber(row.total_change_given),
  };
};

const getSessionInvoiceStats = async (db, sessionId) => {
  const result = await db.query(
    `
      SELECT
        COUNT(*)::int AS invoice_count,
        COALESCE(SUM(total), 0) AS total_sales_amount
      FROM invoice_header
      WHERE session_id = $1
    `,
    [sessionId],
  );

  return {
    invoice_count: Number(result.rows[0]?.invoice_count || 0),
    total_sales_amount: toNumber(result.rows[0]?.total_sales_amount),
  };
};

const getSessionSoldItemsBreakdown = async (db, sessionId) => {
  const result = await db.query(
    `
      SELECT
        il.item_id,
        COALESCE(
          NULLIF(MAX(i.name), ''),
          NULLIF(MAX(il.description), ''),
          CONCAT('Item #', il.item_id::text)
        ) AS item_name,
        COALESCE(SUM(il.qty), 0) AS quantity_sold,
        COALESCE(SUM(il.total), 0) AS total_amount,
        CASE
          WHEN COALESCE(BOOL_OR(COALESCE(i.has_tokens, false)), false)
            THEN COALESCE(MAX(i.token_count), 0)
          ELSE 0
        END AS tokens_per_item,
        COALESCE(
          SUM(
            il.qty * CASE
              WHEN COALESCE(i.has_tokens, false) THEN COALESCE(i.token_count, 0)
              ELSE 0
            END
          ),
          0
        ) AS total_tokens,
        MAX(ih.date) AS last_sold_at
      FROM invoice_header ih
      JOIN invoice_lines il
        ON il.invoice_number = ih.invoice_number
      LEFT JOIN items i
        ON i.id = il.item_id
      WHERE ih.session_id = $1
        AND il.item_id IS NOT NULL
      GROUP BY il.item_id
      ORDER BY quantity_sold DESC, last_sold_at DESC, item_name ASC
    `,
    [sessionId],
  );

  return result.rows.map((row) => ({
    item_id: row.item_id,
    item_name: row.item_name,
    quantity_sold: toNumber(row.quantity_sold),
    total_amount: toNumber(row.total_amount),
    tokens_per_item: toNumber(row.tokens_per_item),
    total_tokens: toNumber(row.total_tokens),
    last_sold_at: row.last_sold_at,
  }));
};

const getSessionInvoices = async (db, sessionId) => {
  const result = await db.query(
    `
      SELECT
        invoice_number,
        client,
        type,
        total,
        date
      FROM invoice_header
      WHERE session_id = $1
      ORDER BY date ASC, invoice_number ASC
    `,
    [sessionId],
  );

  return result.rows.map((invoice) => ({
    ...invoice,
    total: toNumber(invoice.total),
  }));
};

const getSessionSummary = async (
  db,
  sessionId,
  { userId = null, requireOwner = true, includeInvoices = true } = {},
) => {
  const session = requireOwner
    ? await getOwnedSessionById(db, sessionId, userId)
    : await getSessionById(db, sessionId);

  if (!session) {
    throw createPosSessionError("POS session not found", 404, "POS_SESSION_NOT_FOUND");
  }

  const invoiceStats = await getSessionInvoiceStats(db, sessionId);
  const paymentStats = await getSessionPaymentStats(db, sessionId);
  const soldItemsBreakdown = await getSessionSoldItemsBreakdown(db, sessionId);
  const invoices = includeInvoices ? await getSessionInvoices(db, sessionId) : [];
  const totalTokensSold = soldItemsBreakdown.reduce(
    (sum, item) => sum + toNumber(item.total_tokens),
    0,
  );
  const duration = getSessionDuration(session.started_at, session.ended_at);

  return {
    ...session,
    employee_full_name: session.full_name || null,
    invoice_count: invoiceStats.invoice_count,
    total_sales: invoiceStats.total_sales_amount,
    total_sales_amount: invoiceStats.total_sales_amount,
    total_tokens_sold: totalTokensSold,
    duration_minutes: duration.duration_minutes,
    duration_label: duration.duration_label,
    sold_items_breakdown: soldItemsBreakdown,
    payment_totals: {
      cash: paymentStats.cash,
      card: paymentStats.card,
      transfer: paymentStats.transfer,
      bank_transfer: paymentStats.transfer,
    },
    total_cash: paymentStats.cash,
    total_card: paymentStats.card,
    total_bank_transfer: paymentStats.transfer,
    total_cash_received: paymentStats.total_cash_received,
    total_change_given: paymentStats.total_change_given,
    totals: {
      sales: invoiceStats.total_sales_amount,
      tokens_sold: totalTokensSold,
      cash: paymentStats.cash,
      card: paymentStats.card,
      bank_transfer: paymentStats.transfer,
    },
    invoices,
  };
};

const startSession = async (db, { userId, posPointId, openingNote, startedAt }) => {
  const parsedPosPointId = Number.parseInt(posPointId, 10);

  if (!Number.isInteger(parsedPosPointId) || parsedPosPointId <= 0) {
    throw createPosSessionError(
      "You must choose a POS station before starting a session",
      400,
      "POS_POINT_REQUIRED",
    );
  }

  try {
    await db.query("BEGIN");

    const existingSession = await getActiveSessionForUser(db, userId);
    if (existingSession) {
      await db.query("COMMIT");
      return {
        session: existingSession,
        already_active: true,
      };
    }

    const posPoint = await getPosPointById(db, parsedPosPointId, {
      forUpdate: true,
    });

    if (!posPoint) {
      throw createPosSessionError("POS station not found", 404, "POS_POINT_NOT_FOUND");
    }

    if (!posPoint.is_active) {
      throw createPosSessionError(
        "This POS station is inactive and cannot be used",
        409,
        "POS_POINT_INACTIVE",
      );
    }

    const occupiedSession = await getActiveSessionForPosPoint(db, parsedPosPointId);
    if (occupiedSession) {
      throw createPosSessionError(
        "This POS station already has an active session",
        409,
        "POS_POINT_OCCUPIED",
        {
          session_id: occupiedSession.id,
          user_id: occupiedSession.user_id,
          username: occupiedSession.username,
          full_name: occupiedSession.full_name,
          started_at: occupiedSession.started_at,
        },
      );
    }

    const insertResult = await db.query(
      `
        INSERT INTO pos_sessions (user_id, pos, pos_point_id, opening_note, started_at)
        VALUES ($1, $2, $3, $4, COALESCE($5, NOW()))
        RETURNING id
      `,
      [
        userId,
        posPoint.name,
        parsedPosPointId,
        openingNote || null,
        startedAt || null,
      ],
    );

    await db.query("COMMIT");

    const session = await getSessionById(db, insertResult.rows[0].id);
    return {
      session,
      already_active: false,
    };
  } catch (error) {
    await db.query("ROLLBACK");

    if (error.code === "23505") {
      const existingSession = await getActiveSessionForUser(db, userId);
      if (existingSession) {
        return {
          session: existingSession,
          already_active: true,
        };
      }

      const occupiedSession = await getActiveSessionForPosPoint(db, parsedPosPointId);
      if (occupiedSession) {
        throw createPosSessionError(
          "This POS station already has an active session",
          409,
          "POS_POINT_OCCUPIED",
          {
            session_id: occupiedSession.id,
            user_id: occupiedSession.user_id,
            username: occupiedSession.username,
            full_name: occupiedSession.full_name,
            started_at: occupiedSession.started_at,
          },
        );
      }
    }

    throw error;
  }
};

const resolveActiveSessionForUser = async (db, { userId, sessionId }) => {
  if (sessionId != null) {
    const ownedSession = await getOwnedSessionById(db, sessionId, userId);
    ensureSessionIsActive(ownedSession);
    return ownedSession;
  }

  const activeSession = await getActiveSessionForUser(db, userId);
  if (!activeSession) {
    throw createPosSessionError(
      "You need an active POS session before creating a sale",
      409,
      "POS_SESSION_REQUIRED",
    );
  }

  ensureSessionIsActive(activeSession);
  return activeSession;
};

const endSession = async (db, { sessionId, userId, closingNote, endedAt }) => {
  try {
    await db.query("BEGIN");

    const session = await getOwnedSessionById(db, sessionId, userId, {
      forUpdate: true,
    });

    ensureSessionIsActive(session);

    await db.query(
      `
        UPDATE pos_sessions
        SET
          ended_at = COALESCE($2, NOW()),
          status = $1,
          closing_note = COALESCE($3, closing_note),
          updated_at = NOW()
        WHERE id = $4
      `,
      [ENDED_STATUS, endedAt || null, closingNote || null, sessionId],
    );

    await db.query("COMMIT");
    return getSessionSummary(db, sessionId, {
      userId,
      requireOwner: true,
      includeInvoices: true,
    });
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  }
};

module.exports = {
  endSession,
  getActiveSessionForPosPoint,
  getActiveSessionForUser,
  getSessionById,
  getSessionSummary,
  resolveActiveSessionForUser,
  startSession,
};
