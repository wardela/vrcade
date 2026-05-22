const {
  formatTimestampWithoutTimezone,
  getJordanCurrentTimestamp,
  parseFloatingTimestamp,
} = require("../utils/jordanTimestamp");
const { assertModulePermission } = require("./permissionService");
const invoiceService = require("../../../backend/services/invoiceService");

const ACTIVE_STATUS = "active";
const ENDED_STATUS = "ended";
const CLOSE_VIA_ADMIN = "admin";

const ZERO_MANUAL_TOKEN_STATS = Object.freeze({
  charge_count: 0,
  total_tokens: 0,
});

const toNumber = (value) => Number(value || 0);

const createPortalPosError = (message, statusCode, code, details = null) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  if (details) {
    error.details = details;
  }
  return error;
};

const normalizeOptionalText = (value) => {
  const normalized = String(value || "").trim();
  return normalized ? normalized : null;
};

const validateName = (value) => {
  const name = String(value || "").trim();

  if (!name) {
    throw createPortalPosError(
      "POS station name is required",
      400,
      "POS_POINT_NAME_REQUIRED"
    );
  }

  return name;
};

const normalizeEcrCredentials = ({ hasEcr, ecrMid, ecrTid, ecrSecureKey }) => {
  const enabled = Boolean(hasEcr);
  const normalizedMid = normalizeOptionalText(ecrMid);
  const normalizedTid = normalizeOptionalText(ecrTid);
  const normalizedSecureKey = normalizeOptionalText(ecrSecureKey);

  if (!enabled) {
    return {
      hasEcr: false,
      ecrMid: null,
      ecrTid: null,
      ecrSecureKey: null,
    };
  }

  if (!normalizedMid || !normalizedTid || !normalizedSecureKey) {
    throw createPortalPosError(
      "Merchant ID, Terminal ID, and Secure Key are required when ECR is enabled",
      400,
      "POS_POINT_ECR_CONFIG_REQUIRED"
    );
  }

  return {
    hasEcr: true,
    ecrMid: normalizedMid,
    ecrTid: normalizedTid,
    ecrSecureKey: normalizedSecureKey,
  };
};

const formatDurationLabelFromMinutes = (value) => {
  const durationMinutes = Math.max(0, Math.floor(toNumber(value)));
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  return `${hours}h ${minutes}m`;
};

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

const normalizePosPoint = (row) => ({
  id: row.id,
  name: row.name,
  code: row.code,
  is_active: row.is_active,
  description: row.description,
  has_ecr: row.has_ecr === true,
  ...(Object.prototype.hasOwnProperty.call(row, "ecr_mid") ? { ecr_mid: row.ecr_mid } : {}),
  ...(Object.prototype.hasOwnProperty.call(row, "ecr_tid") ? { ecr_tid: row.ecr_tid } : {}),
  ...(Object.prototype.hasOwnProperty.call(row, "ecr_secure_key")
    ? { ecr_secure_key: row.ecr_secure_key }
    : {}),
  created_at: formatTimestampWithoutTimezone(row.created_at),
  updated_at: formatTimestampWithoutTimezone(row.updated_at),
});

const normalizeMonitoringRow = (row) => ({
  ...normalizePosPoint(row),
  session_count: Number(row.session_count || 0),
  active_session: row.active_session_id
    ? {
        id: row.active_session_id,
        user_id: row.active_user_id,
        username: row.active_username,
        full_name: row.active_full_name,
        started_at: formatTimestampWithoutTimezone(row.active_started_at),
        status: row.active_status,
      }
    : null,
});

const normalizeSession = (row) => {
  if (!row) {
    return null;
  }

  const posPoint =
    row.pos_point_id == null
      ? null
      : {
          id: row.pos_point_id,
          name: row.pos_point_name,
          code: row.pos_point_code,
          is_active: row.pos_point_is_active,
          description: row.pos_point_description,
          has_ecr: row.pos_point_has_ecr === true,
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
    pos_point_has_ecr: row.pos_point_has_ecr === true,
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
    pp.description AS pos_point_description,
    pp.has_ecr AS pos_point_has_ecr
  FROM pos_sessions ps
  JOIN users u
    ON u.id = ps.user_id
  LEFT JOIN users closed_by_user
    ON closed_by_user.id = ps.closed_by_user_id
  LEFT JOIN pos_points pp
    ON pp.id = ps.pos_point_id
`;

const getPosPointById = async (db, id, { forUpdate = false } = {}) => {
  const result = await db.query(
    `
      SELECT
        id,
        name,
        code,
        is_active,
        description,
        has_ecr,
        ecr_mid,
        ecr_tid,
        ecr_secure_key,
        created_at,
        updated_at
      FROM pos_points
      WHERE id = $1
      ${forUpdate ? "FOR UPDATE" : ""}
    `,
    [id]
  );

  return result.rows[0] ? normalizePosPoint(result.rows[0]) : null;
};

const assertPosPointExists = async (db, id) => {
  const posPoint = await getPosPointById(db, id);
  if (!posPoint) {
    throw createPortalPosError("POS station not found", 404, "POS_POINT_NOT_FOUND");
  }

  return posPoint;
};

const getSessionById = async (db, sessionId, { forUpdate = false } = {}) => {
  const result = await db.query(
    `
      ${getSessionQuery(forUpdate)}
      WHERE ps.id = $1
      ${forUpdate ? "FOR UPDATE OF ps" : ""}
    `,
    [sessionId]
  );

  return normalizeSession(result.rows[0]);
};

const ensureSessionIsActive = (session) => {
  if (session.status !== ACTIVE_STATUS || session.ended_at) {
    throw createPortalPosError("This POS session has already ended", 409, "POS_SESSION_ENDED");
  }
};

const hasManualTokenChargeTable = async (db) => {
  const result = await db.query(
    `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = current_schema()
          AND table_name = 'pos_manual_token_charges'
      ) AS supported
    `
  );

  return result.rows[0]?.supported === true;
};

const hasPosSessionPosPointSupport = async (db) => {
  const result = await db.query(
    `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'pos_sessions'
          AND column_name = 'pos_point_id'
      ) AS supported
    `
  );

  return result.rows[0]?.supported === true;
};

const getPosMonitoringOverview = async (db) => {
  const result = await db.query(
    `
      SELECT
        pp.id,
        pp.name,
        pp.code,
        pp.is_active,
        pp.description,
        pp.has_ecr,
        pp.created_at,
        pp.updated_at,
        COALESCE(hist.session_count, 0)::int AS session_count,
        active_session.id AS active_session_id,
        active_session.user_id AS active_user_id,
        active_session.started_at AS active_started_at,
        active_session.status AS active_status,
        active_user.username AS active_username,
        active_user.full_name AS active_full_name
      FROM pos_points pp
      LEFT JOIN LATERAL (
        SELECT
          ps.id,
          ps.user_id,
          ps.started_at,
          ps.status
        FROM pos_sessions ps
        WHERE ps.pos_point_id = pp.id
          AND ps.status = 'active'
          AND ps.ended_at IS NULL
        ORDER BY ps.started_at DESC, ps.id DESC
        LIMIT 1
      ) active_session ON true
      LEFT JOIN users active_user
        ON active_user.id = active_session.user_id
      LEFT JOIN LATERAL (
        SELECT COUNT(*) AS session_count
        FROM pos_sessions ps
        WHERE ps.pos_point_id = pp.id
      ) hist ON true
      ORDER BY pp.is_active DESC, pp.name ASC, pp.id ASC
    `
  );

  const posPoints = result.rows.map(normalizeMonitoringRow);
  const activeSessions = posPoints
    .filter((posPoint) => posPoint.active_session)
    .map((posPoint) => ({
      ...posPoint.active_session,
      pos_point_id: posPoint.id,
      pos_point_name: posPoint.name,
      pos_point_code: posPoint.code || null,
    }));

  return {
    pos_points: posPoints,
    active_sessions: activeSessions,
    summary: {
      total_pos_points: posPoints.length,
      active_pos_points: posPoints.filter((posPoint) => posPoint.is_active).length,
      inactive_pos_points: posPoints.filter((posPoint) => !posPoint.is_active).length,
      occupied_pos_points: activeSessions.length,
      total_sessions: posPoints.reduce(
        (sum, posPoint) => sum + Number(posPoint.session_count || 0),
        0
      ),
    },
  };
};

const getMonitoringCompany = async (db) => {
  return (await invoiceService.getCompanyConfig(db)) || {};
};

const createPosPoint = async (
  db,
  { name, description, isActive, code, hasEcr, ecrMid, ecrTid, ecrSecureKey }
) => {
  const normalizedName = validateName(name);
  const normalizedDescription = normalizeOptionalText(description);
  const normalizedCode = normalizeOptionalText(code);
  const ecrConfig = normalizeEcrCredentials({
    hasEcr,
    ecrMid,
    ecrTid,
    ecrSecureKey,
  });

  try {
    const result = await db.query(
      `
        INSERT INTO pos_points (
          name,
          code,
          is_active,
          description,
          has_ecr,
          ecr_mid,
          ecr_tid,
          ecr_secure_key
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING
          id,
          name,
          code,
          is_active,
          description,
          has_ecr,
          ecr_mid,
          ecr_tid,
          ecr_secure_key,
          created_at,
          updated_at
      `,
      [
        normalizedName,
        normalizedCode,
        isActive !== false,
        normalizedDescription,
        ecrConfig.hasEcr,
        ecrConfig.ecrMid,
        ecrConfig.ecrTid,
        ecrConfig.ecrSecureKey,
      ]
    );

    return normalizePosPoint(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      throw createPortalPosError(
        "A POS station with the same name or code already exists",
        409,
        "POS_POINT_DUPLICATE"
      );
    }

    throw error;
  }
};

const updatePosPoint = async (
  db,
  id,
  { name, description, isActive, code, hasEcr, ecrMid, ecrTid, ecrSecureKey }
) => {
  const current = await assertPosPointExists(db, id);
  const nextIsActive = isActive == null ? current.is_active : Boolean(isActive);

  if (current.is_active && !nextIsActive) {
    const activeSessionResult = await db.query(
      `
        SELECT id
        FROM pos_sessions
        WHERE pos_point_id = $1
          AND status = 'active'
          AND ended_at IS NULL
        LIMIT 1
      `,
      [id]
    );

    if (activeSessionResult.rowCount > 0) {
      throw createPortalPosError(
        "End the active session before marking this POS station inactive",
        409,
        "POS_POINT_ACTIVE_SESSION_EXISTS"
      );
    }
  }

  const normalizedName = name == null ? current.name : validateName(name);
  const normalizedDescription =
    description == null ? current.description : normalizeOptionalText(description);
  const normalizedCode = code == null ? current.code : normalizeOptionalText(code);
  const nextHasEcr = hasEcr == null ? current.has_ecr : Boolean(hasEcr);
  const ecrConfig = nextHasEcr
    ? normalizeEcrCredentials({
        hasEcr: true,
        ecrMid: ecrMid == null ? current.ecr_mid : ecrMid,
        ecrTid: ecrTid == null ? current.ecr_tid : ecrTid,
        ecrSecureKey: ecrSecureKey == null ? current.ecr_secure_key : ecrSecureKey,
      })
    : {
        hasEcr: false,
        ecrMid: current.ecr_mid || null,
        ecrTid: current.ecr_tid || null,
        ecrSecureKey: current.ecr_secure_key || null,
      };

  try {
    const result = await db.query(
      `
        UPDATE pos_points
        SET
          name = $1,
          code = $2,
          is_active = $3,
          description = $4,
          has_ecr = $5,
          ecr_mid = $6,
          ecr_tid = $7,
          ecr_secure_key = $8,
          updated_at = NOW()
        WHERE id = $9
        RETURNING
          id,
          name,
          code,
          is_active,
          description,
          has_ecr,
          ecr_mid,
          ecr_tid,
          ecr_secure_key,
          created_at,
          updated_at
      `,
      [
        normalizedName,
        normalizedCode,
        nextIsActive,
        normalizedDescription,
        ecrConfig.hasEcr,
        ecrConfig.ecrMid,
        ecrConfig.ecrTid,
        ecrConfig.ecrSecureKey,
        id,
      ]
    );

    return normalizePosPoint(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      throw createPortalPosError(
        "A POS station with the same name or code already exists",
        409,
        "POS_POINT_DUPLICATE"
      );
    }

    throw error;
  }
};

const getSessionsForPosPoint = async (db, posPointId) => {
  const posPoint = await assertPosPointExists(db, posPointId);

  const result = await db.query(
    `
      SELECT
        ps.id,
        ps.user_id,
        u.username,
        u.full_name,
        ps.started_at,
        ps.ended_at,
        ps.status,
        COALESCE(invoice_stats.invoice_count, 0)::int AS invoice_count,
        COALESCE(invoice_stats.total_sales_amount, 0) AS total_sales_amount
      FROM pos_sessions ps
      JOIN users u
        ON u.id = ps.user_id
      LEFT JOIN LATERAL (
        SELECT
          COUNT(*) AS invoice_count,
          COALESCE(SUM(total), 0) AS total_sales_amount
        FROM invoice_header ih
        WHERE ih.session_id = ps.id
      ) invoice_stats ON true
      WHERE ps.pos_point_id = $1
      ORDER BY
        CASE
          WHEN ps.status = 'active' AND ps.ended_at IS NULL THEN 0
          ELSE 1
        END,
        ps.started_at DESC,
        ps.id DESC
    `,
    [posPointId]
  );

  return {
    pos_point: posPoint,
    sessions: result.rows.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      username: row.username,
      full_name: row.full_name,
      started_at: formatTimestampWithoutTimezone(row.started_at),
      ended_at: formatTimestampWithoutTimezone(row.ended_at),
      status: row.status,
      invoice_count: Number(row.invoice_count || 0),
      total_sales_amount: toNumber(row.total_sales_amount),
    })),
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
    [sessionId]
  );

  return {
    invoice_count: Number(result.rows[0]?.invoice_count || 0),
    total_sales_amount: toNumber(result.rows[0]?.total_sales_amount),
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
    [sessionId]
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

const getSessionManualTokenStats = async (
  db,
  sessionId,
  { manualTokenChargesEnabled = null } = {}
) => {
  const supported =
    manualTokenChargesEnabled == null
      ? await hasManualTokenChargeTable(db)
      : manualTokenChargesEnabled;

  if (!supported) {
    return ZERO_MANUAL_TOKEN_STATS;
  }

  const result = await db.query(
    `
      SELECT
        COUNT(*)::int AS charge_count,
        COALESCE(SUM(token_amount), 0) AS total_tokens
      FROM pos_manual_token_charges
      WHERE session_id = $1
    `,
    [sessionId]
  );

  return {
    charge_count: Number(result.rows[0]?.charge_count || 0),
    total_tokens: toNumber(result.rows[0]?.total_tokens),
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
    [sessionId]
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
    [sessionId]
  );

  return result.rows.map((invoice) => ({
    ...invoice,
    total: toNumber(invoice.total),
    date: formatTimestampWithoutTimezone(invoice.date),
  }));
};

const buildSessionSummary = async (
  db,
  rawSession,
  {
    includeInvoices = true,
    manualTokenChargesEnabled = null,
  } = {}
) => {
  const session = {
    ...rawSession,
    manual_token_charges_enabled:
      manualTokenChargesEnabled == null
        ? await hasManualTokenChargeTable(db)
        : manualTokenChargesEnabled,
  };

  const [invoiceStats, paymentStats, soldItemsBreakdown, manualTokenStats, invoices] =
    await Promise.all([
      getSessionInvoiceStats(db, session.id),
      getSessionPaymentStats(db, session.id),
      getSessionSoldItemsBreakdown(db, session.id),
      getSessionManualTokenStats(db, session.id, {
        manualTokenChargesEnabled: session.manual_token_charges_enabled,
      }),
      includeInvoices ? getSessionInvoices(db, session.id) : Promise.resolve([]),
    ]);

  const totalTokensSold = soldItemsBreakdown.reduce(
    (sum, item) => sum + toNumber(item.total_tokens),
    0
  );
  const manualTokensCharged = manualTokenStats.total_tokens;
  const totalTokensCharged = totalTokensSold + manualTokensCharged;
  const duration = getSessionDuration(session.started_at, session.ended_at);

  return {
    ...session,
    employee_full_name: session.full_name || null,
    invoice_count: invoiceStats.invoice_count,
    total_sales: invoiceStats.total_sales_amount,
    total_sales_amount: invoiceStats.total_sales_amount,
    total_tokens_sold: totalTokensSold,
    manual_tokens_charged: manualTokensCharged,
    total_tokens_charged: totalTokensCharged,
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
      manual_tokens_charged: manualTokensCharged,
      total_tokens_charged: totalTokensCharged,
      cash: paymentStats.cash,
      card: paymentStats.card,
      bank_transfer: paymentStats.transfer,
    },
    invoices,
  };
};

const getSessionSummary = async (db, sessionId, { includeInvoices = true } = {}) => {
  const rawSession = await getSessionById(db, sessionId);

  if (!rawSession) {
    throw createPortalPosError("POS session not found", 404, "POS_SESSION_NOT_FOUND");
  }

  return buildSessionSummary(db, rawSession, { includeInvoices });
};

const closeSessionRecord = async (
  db,
  { sessionId, closingNote, endedAt, closedByUserId }
) => {
  const session = await getSessionById(db, sessionId, { forUpdate: true });

  if (!session) {
    throw createPortalPosError("POS session not found", 404, "POS_SESSION_NOT_FOUND");
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
      CLOSE_VIA_ADMIN,
      closedByUserId,
      sessionId,
    ]
  );
};

const forceCloseSession = async (db, { sessionId, actingUserId, closingNote, endedAt }) => {
  await assertModulePermission(db, actingUserId, "pos", "edit");

  try {
    await db.query("BEGIN");
    await closeSessionRecord(db, {
      sessionId,
      closingNote,
      endedAt,
      closedByUserId: actingUserId,
    });
    await db.query("COMMIT");
    return getSessionSummary(db, sessionId, { includeInvoices: true });
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  }
};

const validateSummaryRange = ({ from, to }) => {
  const normalizedFrom = formatTimestampWithoutTimezone(from);
  const normalizedTo = formatTimestampWithoutTimezone(to);

  if (!normalizedFrom || !normalizedTo) {
    throw createPortalPosError(
      "A valid start and end time are required",
      400,
      "POS_SUMMARY_RANGE_REQUIRED"
    );
  }

  const parsedFrom = parseFloatingTimestamp(normalizedFrom);
  const parsedTo = parseFloatingTimestamp(normalizedTo);

  if (!parsedFrom || !parsedTo || parsedFrom.getTime() > parsedTo.getTime()) {
    throw createPortalPosError(
      "The selected time frame is invalid",
      400,
      "POS_SUMMARY_RANGE_INVALID"
    );
  }

  return {
    from: normalizedFrom,
    to: normalizedTo,
  };
};

const getOverlappingSessions = async (
  db,
  { from, to, posPointId = null, posPointName = null }
) => {
  const posPointSupport = await hasPosSessionPosPointSupport(db);
  const params = [from, to];
  let posPointClause = "";

  if (posPointSupport) {
    if (posPointId != null) {
      params.push(posPointId);
      const idParamIndex = params.length;

      if (posPointName) {
        params.push(posPointName);
        posPointClause = `
          AND (
            ps.pos_point_id = $${idParamIndex}
            OR LOWER(COALESCE(NULLIF(pp.name, ''), NULLIF(ps.pos, ''))) = LOWER($${params.length})
          )
        `;
      } else {
        posPointClause = `AND ps.pos_point_id = $${idParamIndex}`;
      }
    }

    const result = await db.query(
      `
        ${getSessionQuery(false)}
        WHERE ps.started_at <= $2
          AND COALESCE(ps.ended_at, timezone('Asia/Amman', NOW())) >= $1
          ${posPointClause}
        ORDER BY
          COALESCE(pp.name, ps.pos) ASC,
          ps.started_at ASC,
          ps.id ASC
      `,
      params
    );

    return result.rows.map(normalizeSession);
  }

  if (posPointId != null && posPointName) {
    params.push(posPointName);
    posPointClause = `
      AND LOWER(COALESCE(NULLIF(BTRIM(ps.pos), ''), 'POS-1')) = LOWER($${params.length})
    `;
  }

  const result = await db.query(
    `
      SELECT
        ps.*,
        u.username,
        u.full_name,
        closed_by_user.username AS closed_by_username,
        closed_by_user.full_name AS closed_by_full_name,
        NULL::integer AS pos_point_id,
        COALESCE(NULLIF(BTRIM(ps.pos), ''), 'POS-1') AS pos_point_name,
        NULL::text AS pos_point_code,
        NULL::boolean AS pos_point_is_active,
        NULL::text AS pos_point_description,
        NULL::boolean AS pos_point_has_ecr
      FROM pos_sessions ps
      JOIN users u
        ON u.id = ps.user_id
      LEFT JOIN users closed_by_user
        ON closed_by_user.id = ps.closed_by_user_id
      WHERE ps.started_at <= $2
        AND COALESCE(ps.ended_at, timezone('Asia/Amman', NOW())) >= $1
        ${posPointClause}
      ORDER BY
        COALESCE(NULLIF(BTRIM(ps.pos), ''), 'POS-1') ASC,
        ps.started_at ASC,
        ps.id ASC
    `,
    params
  );

  return result.rows.map(normalizeSession);
};

const getAggregateItemKey = (item) =>
  item?.item_id != null ? `id:${item.item_id}` : `name:${item?.item_name || ""}`;

const mergeSoldItemsBreakdown = (sessionSummaries) => {
  const soldItemsMap = new Map();

  for (const sessionSummary of sessionSummaries) {
    for (const item of sessionSummary.sold_items_breakdown || []) {
      const key = getAggregateItemKey(item);
      const existing = soldItemsMap.get(key);

      if (!existing) {
        soldItemsMap.set(key, {
          item_id: item.item_id ?? null,
          item_name: item.item_name || null,
          quantity_sold: toNumber(item.quantity_sold),
          total_amount: toNumber(item.total_amount),
          total_tokens: toNumber(item.total_tokens),
          last_sold_at: item.last_sold_at || null,
        });
        continue;
      }

      existing.item_name = existing.item_name || item.item_name || null;
      existing.quantity_sold += toNumber(item.quantity_sold);
      existing.total_amount += toNumber(item.total_amount);
      existing.total_tokens += toNumber(item.total_tokens);

      if (item.last_sold_at && (!existing.last_sold_at || item.last_sold_at > existing.last_sold_at)) {
        existing.last_sold_at = item.last_sold_at;
      }
    }
  }

  return Array.from(soldItemsMap.values())
    .map((item) => ({
      ...item,
      tokens_per_item:
        item.quantity_sold > 0
          ? Number((item.total_tokens / item.quantity_sold).toFixed(3))
          : 0,
    }))
    .sort((a, b) => {
      if (b.quantity_sold !== a.quantity_sold) {
        return b.quantity_sold - a.quantity_sold;
      }

      const aTime = a.last_sold_at ? new Date(a.last_sold_at).getTime() : 0;
      const bTime = b.last_sold_at ? new Date(b.last_sold_at).getTime() : 0;

      if (bTime !== aTime) {
        return bTime - aTime;
      }

      return String(a.item_name || "").localeCompare(String(b.item_name || ""));
    });
};

const getSessionGroupKey = (sessionSummary) =>
  sessionSummary.pos_point_id != null
    ? `pos:${sessionSummary.pos_point_id}`
    : `name:${sessionSummary.pos_point_name || sessionSummary.pos || "unassigned"}`;

const buildCombinedSessionSummary = ({
  sessionSummaries,
  summaryKind,
  timeframeStart,
  timeframeEnd,
  filterPosPoint = null,
  filterPosLabel,
  manualTokenChargesEnabled,
}) => {
  const soldItemsBreakdown = mergeSoldItemsBreakdown(sessionSummaries);
  const invoiceCount = sessionSummaries.reduce(
    (sum, session) => sum + Number(session.invoice_count || 0),
    0
  );
  const totalSales = sessionSummaries.reduce(
    (sum, session) => sum + toNumber(session.total_sales_amount),
    0
  );
  const totalTokensSold = sessionSummaries.reduce(
    (sum, session) => sum + toNumber(session.total_tokens_sold),
    0
  );
  const manualTokensCharged = sessionSummaries.reduce(
    (sum, session) => sum + toNumber(session.manual_tokens_charged),
    0
  );
  const totalTokensCharged = sessionSummaries.reduce(
    (sum, session) => sum + toNumber(session.total_tokens_charged),
    0
  );
  const durationMinutes = sessionSummaries.reduce(
    (sum, session) => sum + Number(session.duration_minutes || 0),
    0
  );
  const totalCash = sessionSummaries.reduce(
    (sum, session) => sum + toNumber(session.total_cash),
    0
  );
  const totalCard = sessionSummaries.reduce(
    (sum, session) => sum + toNumber(session.total_card),
    0
  );
  const totalBankTransfer = sessionSummaries.reduce(
    (sum, session) => sum + toNumber(session.total_bank_transfer),
    0
  );
  const totalCashReceived = sessionSummaries.reduce(
    (sum, session) => sum + toNumber(session.total_cash_received),
    0
  );
  const totalChangeGiven = sessionSummaries.reduce(
    (sum, session) => sum + toNumber(session.total_change_given),
    0
  );
  const sessionIds = sessionSummaries.map((session) => session.id).filter(Number.isInteger);
  const posPointCount = new Set(sessionSummaries.map(getSessionGroupKey)).size;
  const posPointId = filterPosPoint?.id ?? null;
  const posPointName = filterPosLabel || filterPosPoint?.name || "All POS Stations";

  return {
    id: null,
    summary_kind: summaryKind,
    manual_token_charges_enabled: manualTokenChargesEnabled,
    timeframe_start: timeframeStart,
    timeframe_end: timeframeEnd,
    started_at: timeframeStart,
    ended_at: timeframeEnd,
    status: ENDED_STATUS,
    employee_full_name: null,
    invoice_count: invoiceCount,
    total_sales: totalSales,
    total_sales_amount: totalSales,
    total_tokens_sold: totalTokensSold,
    manual_tokens_charged: manualTokensCharged,
    total_tokens_charged: totalTokensCharged,
    duration_minutes: durationMinutes,
    duration_label: formatDurationLabelFromMinutes(durationMinutes),
    session_count: sessionSummaries.length,
    session_ids: sessionIds,
    pos_point_count: posPointCount,
    pos: posPointName,
    pos_point_id: posPointId,
    pos_point_name: posPointName,
    pos_station_filter: posPointName,
    sold_items_breakdown: soldItemsBreakdown,
    payment_totals: {
      cash: totalCash,
      card: totalCard,
      transfer: totalBankTransfer,
      bank_transfer: totalBankTransfer,
    },
    total_cash: totalCash,
    total_card: totalCard,
    total_bank_transfer: totalBankTransfer,
    total_cash_received: totalCashReceived,
    total_change_given: totalChangeGiven,
    totals: {
      sales: totalSales,
      tokens_sold: totalTokensSold,
      manual_tokens_charged: manualTokensCharged,
      total_tokens_charged: totalTokensCharged,
      cash: totalCash,
      card: totalCard,
      bank_transfer: totalBankTransfer,
    },
    invoices: [],
  };
};

const getAggregateSessionSummary = async (db, { from, to, posPointId = null }) => {
  const range = validateSummaryRange({ from, to });
  const normalizedPosPointId =
    posPointId == null || posPointId === "" ? null : Number.parseInt(posPointId, 10);

  if (normalizedPosPointId != null && (!Number.isInteger(normalizedPosPointId) || normalizedPosPointId <= 0)) {
    throw createPortalPosError("Invalid POS station id", 400, "POS_POINT_INVALID_ID");
  }

  const [manualTokenChargesEnabled, filteredPosPoint] = await Promise.all([
    hasManualTokenChargeTable(db),
    normalizedPosPointId == null ? Promise.resolve(null) : getPosPointById(db, normalizedPosPointId),
  ]);

  if (normalizedPosPointId != null && !filteredPosPoint) {
    throw createPortalPosError("POS station not found", 404, "POS_POINT_NOT_FOUND");
  }

  const overlappingSessions = await getOverlappingSessions(db, {
    ...range,
    posPointId: normalizedPosPointId,
    posPointName: filteredPosPoint?.name || null,
  });

  const sessionSummaries = await Promise.all(
    overlappingSessions.map((session) =>
      buildSessionSummary(db, session, {
        includeInvoices: false,
        manualTokenChargesEnabled,
      })
    )
  );

  const groupedSessions = new Map();
  for (const sessionSummary of sessionSummaries) {
    const key = getSessionGroupKey(sessionSummary);
    const existing = groupedSessions.get(key);

    if (existing) {
      existing.sessions.push(sessionSummary);
      continue;
    }

    groupedSessions.set(key, {
      pos_point_id: sessionSummary.pos_point_id ?? null,
      pos_point_name: sessionSummary.pos_point_name || sessionSummary.pos || "Unassigned POS",
      sessions: [sessionSummary],
    });
  }

  const posSummaries = Array.from(groupedSessions.values())
    .map((group) =>
      buildCombinedSessionSummary({
        sessionSummaries: group.sessions,
        summaryKind: "aggregate-pos",
        timeframeStart: range.from,
        timeframeEnd: range.to,
        filterPosPoint: {
          id: group.pos_point_id,
          name: group.pos_point_name,
        },
        filterPosLabel: group.pos_point_name,
        manualTokenChargesEnabled,
      })
    )
    .sort((a, b) => {
      const nameCompare = String(a.pos_point_name || "").localeCompare(String(b.pos_point_name || ""));
      if (nameCompare !== 0) {
        return nameCompare;
      }

      return toNumber(a.pos_point_id) - toNumber(b.pos_point_id);
    });

  const filterLabel = filteredPosPoint?.name || "All POS Stations";
  const summary = buildCombinedSessionSummary({
    sessionSummaries,
    summaryKind: "aggregate",
    timeframeStart: range.from,
    timeframeEnd: range.to,
    filterPosPoint: filteredPosPoint
      ? {
          id: filteredPosPoint.id,
          name: filteredPosPoint.name,
        }
      : null,
    filterPosLabel: filterLabel,
    manualTokenChargesEnabled,
  });

  return {
    ...summary,
    pos_summaries: posSummaries,
  };
};

module.exports = {
  createPosPoint,
  forceCloseSession,
  getAggregateSessionSummary,
  getMonitoringCompany,
  getPosMonitoringOverview,
  getPosPointById,
  getSessionSummary,
  getSessionsForPosPoint,
  updatePosPoint,
};
