const { formatTimestampWithoutTimezone } = require("../utils/jordanTimestamp");

const createPosPointError = (message, statusCode, code) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
};

const toNumber = (value) => Number(value || 0);

const normalizePosPoint = (row) => ({
  id: row.id,
  name: row.name,
  code: row.code,
  is_active: row.is_active,
  description: row.description,
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

const validateName = (value) => {
  const name = String(value || "").trim();
  if (!name) {
    throw createPosPointError("POS station name is required", 400, "POS_POINT_NAME_REQUIRED");
  }

  return name;
};

const normalizeOptionalText = (value) => {
  const normalized = String(value || "").trim();
  return normalized ? normalized : null;
};

const getPosPointById = async (db, id) => {
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
    `,
    [id],
  );

  return result.rows[0] ? normalizePosPoint(result.rows[0]) : null;
};

const assertPosPointExists = async (db, id) => {
  const posPoint = await getPosPointById(db, id);
  if (!posPoint) {
    throw createPosPointError("POS station not found", 404, "POS_POINT_NOT_FOUND");
  }

  return posPoint;
};

const listPosPoints = async (db, { activeOnly = false } = {}) => {
  const params = [];
  let whereClause = "";

  if (activeOnly) {
    params.push(true);
    whereClause = "WHERE is_active = $1";
  }

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
      ${whereClause}
      ORDER BY is_active DESC, name ASC, id ASC
    `,
    params,
  );

  return result.rows.map(normalizePosPoint);
};

const getPosPointMonitoringList = async (db) => {
  const result = await db.query(
    `
      SELECT
        pp.id,
        pp.name,
        pp.code,
        pp.is_active,
        pp.description,
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
    `,
  );

  return result.rows.map(normalizeMonitoringRow);
};

const createPosPoint = async (db, { name, description, isActive, code }) => {
  const normalizedName = validateName(name);
  const normalizedDescription = normalizeOptionalText(description);
  const normalizedCode = normalizeOptionalText(code);

  try {
    const result = await db.query(
      `
        INSERT INTO pos_points (name, code, is_active, description)
        VALUES ($1, $2, $3, $4)
        RETURNING
          id,
          name,
          code,
          is_active,
          description,
          created_at,
          updated_at
      `,
      [normalizedName, normalizedCode, isActive !== false, normalizedDescription],
    );

    return normalizePosPoint(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      throw createPosPointError(
        "A POS station with the same name or code already exists",
        409,
        "POS_POINT_DUPLICATE",
      );
    }

    throw error;
  }
};

const updatePosPoint = async (db, id, { name, description, isActive, code }) => {
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
      [id],
    );

    if (activeSessionResult.rowCount > 0) {
      throw createPosPointError(
        "End the active session before marking this POS station inactive",
        409,
        "POS_POINT_ACTIVE_SESSION_EXISTS",
      );
    }
  }

  const normalizedName = name == null ? current.name : validateName(name);
  const normalizedDescription =
    description == null ? current.description : normalizeOptionalText(description);
  const normalizedCode = code == null ? current.code : normalizeOptionalText(code);

  try {
    const result = await db.query(
      `
        UPDATE pos_points
        SET
          name = $1,
          code = $2,
          is_active = $3,
          description = $4,
          updated_at = NOW()
        WHERE id = $5
        RETURNING
          id,
          name,
          code,
          is_active,
          description,
          created_at,
          updated_at
      `,
      [normalizedName, normalizedCode, nextIsActive, normalizedDescription, id],
    );

    return normalizePosPoint(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      throw createPosPointError(
        "A POS station with the same name or code already exists",
        409,
        "POS_POINT_DUPLICATE",
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
    [posPointId],
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

module.exports = {
  createPosPoint,
  getPosPointById,
  getPosPointMonitoringList,
  getSessionsForPosPoint,
  listPosPoints,
  updatePosPoint,
};
