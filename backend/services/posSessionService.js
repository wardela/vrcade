const ACTIVE_STATUS = "active";
const ENDED_STATUS = "ended";
const CLOSE_VIA_USER = "user";
const CLOSE_VIA_ADMIN = "admin";
const CLOSE_VIA_SYSTEM = "system";
const {
  formatTimestampWithoutTimezone,
  getJordanCurrentTimestamp,
  parseFloatingTimestamp,
} = require("../utils/jordanTimestamp");

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

  const start = parseFloatingTimestamp(startedAt);
  const end = endedAt
    ? parseFloatingTimestamp(endedAt)
    : parseFloatingTimestamp(getJordanCurrentTimestamp());

  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
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
    started_at: formatTimestampWithoutTimezone(row.started_at),
    ended_at: formatTimestampWithoutTimezone(row.ended_at),
    status: row.status,
    opening_note: row.opening_note,
    closing_note: row.closing_note,
    created_at: formatTimestampWithoutTimezone(row.created_at),
    updated_at: formatTimestampWithoutTimezone(row.updated_at),
    closed_via: row.closed_via || null,
    closed_by_user_id: row.closed_by_user_id || null,
    closed_by_username: row.closed_by_username || null,
    closed_by_full_name: row.closed_by_full_name || null,
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
    closed_by_user.username AS closed_by_username,
    closed_by_user.full_name AS closed_by_full_name,
    pp.id AS pos_point_id,
    pp.name AS pos_point_name,
    pp.code AS pos_point_code,
    pp.is_active AS pos_point_is_active,
    pp.description AS pos_point_description
  FROM pos_sessions ps
  JOIN users u
    ON u.id = ps.user_id
  LEFT JOIN users closed_by_user
    ON closed_by_user.id = ps.closed_by_user_id
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

const assertUserHasPosPermission = async (db, userId, permission = "view") => {
  const permissionColumnMap = {
    view: "can_view",
    add: "can_add",
    edit: "can_edit",
    delete: "can_delete",
  };

  const permissionColumn = permissionColumnMap[permission];
  if (!permissionColumn) {
    throw createPosSessionError("Invalid POS permission check", 500, "POS_PERMISSION_INVALID");
  }

  const result = await db.query(
    `
      SELECT ${permissionColumn} AS allowed
      FROM user_permissions
      WHERE user_id = $1
        AND module = 'pos'
      LIMIT 1
    `,
    [userId],
  );

  if (!result.rows[0]?.allowed) {
    throw createPosSessionError("You do not have permission for this POS action", 403, "POS_FORBIDDEN");
  }
};

const getSummaryDuration = (startedAt, endedAt) => {
  const duration = getSessionDuration(startedAt, endedAt);
  return {
    duration_minutes: duration.duration_minutes,
    duration_label: duration.duration_label,
  };
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
    last_sold_at: formatTimestampWithoutTimezone(row.last_sold_at),
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
    date: formatTimestampWithoutTimezone(invoice.date),
  }));
};

const getRangeInvoiceStats = async (db, { from, to }) => {
  const result = await db.query(
    `
      SELECT
        COUNT(*)::int AS invoice_count,
        COALESCE(SUM(total), 0) AS total_sales_amount
      FROM invoice_header ih
      JOIN pos_sessions ps
        ON ps.id = ih.session_id
      WHERE ps.started_at <= $2
        AND COALESCE(ps.ended_at, timezone('Asia/Amman', NOW())) >= $1
    `,
    [from, to],
  );

  return {
    invoice_count: Number(result.rows[0]?.invoice_count || 0),
    total_sales_amount: toNumber(result.rows[0]?.total_sales_amount),
  };
};

const getRangePaymentStats = async (db, { from, to }) => {
  const result = await db.query(
    `
      SELECT
        COALESCE(SUM(CASE WHEN ip.payment_method = 'cash' THEN ip.amount ELSE 0 END), 0) AS total_cash,
        COALESCE(SUM(CASE WHEN ip.payment_method = 'card' THEN ip.amount ELSE 0 END), 0) AS total_card,
        COALESCE(SUM(CASE WHEN ip.payment_method = 'transfer' THEN ip.amount ELSE 0 END), 0) AS total_transfer,
        COALESCE(SUM(CASE WHEN ip.payment_method = 'cash' THEN ip.amount_paid ELSE 0 END), 0) AS total_cash_received,
        COALESCE(SUM(CASE WHEN ip.payment_method = 'cash' THEN ip.change_amount ELSE 0 END), 0) AS total_change_given
      FROM invoice_payments ip
      JOIN pos_sessions ps
        ON ps.id = ip.session_id
      WHERE ps.started_at <= $2
        AND COALESCE(ps.ended_at, timezone('Asia/Amman', NOW())) >= $1
    `,
    [from, to],
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

const getRangeSoldItemsBreakdown = async (db, { from, to }) => {
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
      JOIN pos_sessions ps
        ON ps.id = ih.session_id
      JOIN invoice_lines il
        ON il.invoice_number = ih.invoice_number
      LEFT JOIN items i
        ON i.id = il.item_id
      WHERE ps.started_at <= $2
        AND COALESCE(ps.ended_at, timezone('Asia/Amman', NOW())) >= $1
        AND il.item_id IS NOT NULL
      GROUP BY il.item_id
      ORDER BY quantity_sold DESC, last_sold_at DESC, item_name ASC
    `,
    [from, to],
  );

  return result.rows.map((row) => ({
    item_id: row.item_id,
    item_name: row.item_name,
    quantity_sold: toNumber(row.quantity_sold),
    total_amount: toNumber(row.total_amount),
    tokens_per_item: toNumber(row.tokens_per_item),
    total_tokens: toNumber(row.total_tokens),
    last_sold_at: formatTimestampWithoutTimezone(row.last_sold_at),
  }));
};

const getRangeSessionMeta = async (db, { from, to }) => {
  const result = await db.query(
    `
      SELECT
        COUNT(*)::int AS session_count,
        COUNT(DISTINCT pos_point_id)::int AS pos_point_count
      FROM pos_sessions
      WHERE started_at <= $2
        AND COALESCE(ended_at, timezone('Asia/Amman', NOW())) >= $1
    `,
    [from, to],
  );

  return {
    session_count: Number(result.rows[0]?.session_count || 0),
    pos_point_count: Number(result.rows[0]?.pos_point_count || 0),
  };
};

const validateSummaryRange = ({ from, to }) => {
  const normalizedFrom = formatTimestampWithoutTimezone(from);
  const normalizedTo = formatTimestampWithoutTimezone(to);

  if (!normalizedFrom || !normalizedTo) {
    throw createPosSessionError(
      "A valid start and end time are required",
      400,
      "POS_SUMMARY_RANGE_REQUIRED",
    );
  }

  const parsedFrom = parseFloatingTimestamp(normalizedFrom);
  const parsedTo = parseFloatingTimestamp(normalizedTo);

  if (!parsedFrom || !parsedTo || parsedFrom.getTime() > parsedTo.getTime()) {
    throw createPosSessionError(
      "The selected time frame is invalid",
      400,
      "POS_SUMMARY_RANGE_INVALID",
    );
  }

  return {
    from: normalizedFrom,
    to: normalizedTo,
  };
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

const getAggregateSessionSummary = async (db, { from, to }) => {
  const range = validateSummaryRange({ from, to });
  const [sessionMeta, invoiceStats, paymentStats, soldItemsBreakdown] = await Promise.all([
    getRangeSessionMeta(db, range),
    getRangeInvoiceStats(db, range),
    getRangePaymentStats(db, range),
    getRangeSoldItemsBreakdown(db, range),
  ]);

  const totalTokensSold = soldItemsBreakdown.reduce(
    (sum, item) => sum + toNumber(item.total_tokens),
    0,
  );
  const duration = getSummaryDuration(range.from, range.to);

  return {
    id: null,
    summary_kind: "aggregate",
    timeframe_start: range.from,
    timeframe_end: range.to,
    started_at: range.from,
    ended_at: range.to,
    status: ENDED_STATUS,
    employee_full_name: null,
    invoice_count: invoiceStats.invoice_count,
    total_sales: invoiceStats.total_sales_amount,
    total_sales_amount: invoiceStats.total_sales_amount,
    total_tokens_sold: totalTokensSold,
    duration_minutes: duration.duration_minutes,
    duration_label: duration.duration_label,
    session_count: sessionMeta.session_count,
    pos_point_count: sessionMeta.pos_point_count,
    pos: "All POS Stations",
    pos_point_name: "All POS Stations",
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
    invoices: [],
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
        INSERT INTO pos_sessions (
          user_id,
          pos,
          pos_point_id,
          opening_note,
          started_at,
          created_at,
          updated_at
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          COALESCE($5, timezone('Asia/Amman', NOW())),
          timezone('Asia/Amman', NOW()),
          timezone('Asia/Amman', NOW())
        )
        RETURNING id
      `,
      [
        userId,
        posPoint.name,
        parsedPosPointId,
        openingNote || null,
        formatTimestampWithoutTimezone(startedAt) || null,
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

const buildSessionClosureNotice = (session) => {
  if (!session || !session.ended_at) {
    return null;
  }

  if (session.closed_via !== CLOSE_VIA_ADMIN && session.closed_via !== CLOSE_VIA_SYSTEM) {
    return null;
  }

  return {
    session_id: session.id,
    closed_via: session.closed_via,
    closed_at: session.ended_at,
    closed_by_user_id: session.closed_by_user_id || null,
    closed_by_username: session.closed_by_username || null,
    closed_by_full_name: session.closed_by_full_name || null,
  };
};

const getActiveSessionStatusForUser = async (db, { userId, lastSessionId = null } = {}) => {
  const session = await getActiveSessionForUser(db, userId);
  if (session) {
    return {
      session,
      closure_notice: null,
    };
  }

  const parsedLastSessionId = Number.parseInt(lastSessionId, 10);
  if (!Number.isInteger(parsedLastSessionId) || parsedLastSessionId <= 0) {
    return {
      session: null,
      closure_notice: null,
    };
  }

  const lastSession = await getSessionById(db, parsedLastSessionId);
  if (!lastSession || lastSession.user_id !== userId) {
    return {
      session: null,
      closure_notice: null,
    };
  }

  return {
    session: null,
    closure_notice: buildSessionClosureNotice(lastSession),
  };
};

const closeSessionRecord = async (
  db,
  {
    sessionId,
    userId = null,
    requireOwner = true,
    closingNote,
    endedAt,
    closedVia = CLOSE_VIA_USER,
    closedByUserId = null,
  },
) => {
  const session = requireOwner
    ? await getOwnedSessionById(db, sessionId, userId, {
        forUpdate: true,
      })
    : await getSessionById(db, sessionId, {
        forUpdate: true,
      });

  if (!session) {
    throw createPosSessionError("POS session not found", 404, "POS_SESSION_NOT_FOUND");
  }

  ensureSessionIsActive(session);

  const normalizedEndedAt = formatTimestampWithoutTimezone(endedAt) || null;

  await db.query(
    `
      UPDATE pos_sessions
      SET
        ended_at = COALESCE($2, timezone('Asia/Amman', NOW())),
        status = $1,
        closing_note = COALESCE($3, closing_note),
        closed_via = $4,
        closed_by_user_id = $5,
        updated_at = timezone('Asia/Amman', NOW())
      WHERE id = $6
    `,
    [
      ENDED_STATUS,
      normalizedEndedAt,
      closingNote || null,
      closedVia,
      closedByUserId,
      sessionId,
    ],
  );
};

const endSession = async (db, { sessionId, userId, closingNote, endedAt }) => {
  try {
    await db.query("BEGIN");
    await closeSessionRecord(db, {
      sessionId,
      userId,
      requireOwner: true,
      closingNote,
      endedAt,
      closedVia: CLOSE_VIA_USER,
      closedByUserId: userId,
    });

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

const forceCloseSession = async (db, { sessionId, actingUserId, closingNote, endedAt }) => {
  await assertUserHasPosPermission(db, actingUserId, "edit");

  try {
    await db.query("BEGIN");
    await closeSessionRecord(db, {
      sessionId,
      requireOwner: false,
      closingNote,
      endedAt,
      closedVia: CLOSE_VIA_ADMIN,
      closedByUserId: actingUserId,
    });

    await db.query("COMMIT");
    return getSessionSummary(db, sessionId, {
      requireOwner: false,
      includeInvoices: true,
    });
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  }
};

const autoCloseOpenSessions = async (
  db,
  {
    endedAt = null,
    startedBefore = null,
    closingNote = "Automatically closed by the POS daily scheduler.",
  } = {},
) => {
  const params = [ACTIVE_STATUS];
  let startedBeforeClause = "";

  if (startedBefore) {
    params.push(formatTimestampWithoutTimezone(startedBefore));
    startedBeforeClause = `AND started_at < $${params.length}`;
  }

  const activeResult = await db.query(
    `
      SELECT id
      FROM pos_sessions
      WHERE status = $1
        AND ended_at IS NULL
        ${startedBeforeClause}
      ORDER BY started_at ASC, id ASC
    `,
    params,
  );

  const closedSessionIds = [];

  for (const row of activeResult.rows) {
    const sessionId = Number(row.id);

    try {
      await db.query("BEGIN");
      await closeSessionRecord(db, {
        sessionId,
        requireOwner: false,
        closingNote,
        endedAt,
        closedVia: CLOSE_VIA_SYSTEM,
        closedByUserId: null,
      });
      await db.query("COMMIT");
      closedSessionIds.push(sessionId);
    } catch (error) {
      await db.query("ROLLBACK");

      if (error?.code === "POS_SESSION_ENDED" || error?.code === "POS_SESSION_NOT_FOUND") {
        continue;
      }

      throw error;
    }
  }

  return {
    closed_count: closedSessionIds.length,
    closed_session_ids: closedSessionIds,
  };
};

module.exports = {
  assertUserHasPosPermission,
  autoCloseOpenSessions,
  endSession,
  forceCloseSession,
  getActiveSessionForPosPoint,
  getActiveSessionStatusForUser,
  getActiveSessionForUser,
  getAggregateSessionSummary,
  getSessionById,
  getSessionSummary,
  resolveActiveSessionForUser,
  startSession,
};
