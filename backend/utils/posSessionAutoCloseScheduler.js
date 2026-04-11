const pool = require("../config/db");
const posSessionService = require("../services/posSessionService");

const JORDAN_TIME_ZONE = "Asia/Amman";
const AUTO_CLOSE_HOUR = 3;
const AUTO_CLOSE_MINUTE = 0;
const CHECK_INTERVAL_MS = 60 * 1000;

let schedulerIntervalId = null;
let lastScheduledRunDayKey = null;

const quoteIdent = (value) => `"${String(value).replace(/"/g, "\"\"")}"`;

const getJordanParts = (date = new Date()) => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: JORDAN_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
};

const buildJordanDayKey = (parts) => `${parts.year}-${parts.month}-${parts.day}`;

const buildJordanCutoffTimestamp = (parts) =>
  `${parts.year}-${parts.month}-${parts.day} ${String(AUTO_CLOSE_HOUR).padStart(2, "0")}:${String(
    AUTO_CLOSE_MINUTE,
  ).padStart(2, "0")}:00.000`;

const shiftJordanDayParts = (parts, deltaDays) => {
  const utcDate = new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)));
  utcDate.setUTCDate(utcDate.getUTCDate() + deltaDays);

  return {
    year: String(utcDate.getUTCFullYear()).padStart(4, "0"),
    month: String(utcDate.getUTCMonth() + 1).padStart(2, "0"),
    day: String(utcDate.getUTCDate()).padStart(2, "0"),
  };
};

const getMostRecentAutoCloseCutoff = (parts) => {
  const hour = Number(parts.hour || 0);
  const minute = Number(parts.minute || 0);
  const hasReachedTodayCutoff =
    hour > AUTO_CLOSE_HOUR ||
    (hour === AUTO_CLOSE_HOUR && minute >= AUTO_CLOSE_MINUTE);

  const cutoffDay = hasReachedTodayCutoff ? parts : shiftJordanDayParts(parts, -1);
  return buildJordanCutoffTimestamp({
    ...parts,
    ...cutoffDay,
  });
};

const getTenantSchemas = async (client) => {
  const schemaResult = await client.query(`
    SELECT DISTINCT schema_name
    FROM (
      SELECT 'dev_sales'::text AS schema_name
      UNION
      SELECT schema_name FROM public.tenants
    ) schemas
    WHERE schema_name IS NOT NULL
    ORDER BY schema_name ASC
  `);

  return schemaResult.rows.map((row) => row.schema_name).filter(Boolean);
};

const withTenantDb = async (schemaName, callback) => {
  const client = await pool.connect();

  try {
    await client.query(`SET search_path TO ${quoteIdent(schemaName)}`);
    await callback({
      query: (text, params) => client.query(text, params),
    });
  } finally {
    client.release();
  }
};

const autoCloseAcrossSchemas = async ({ endedAt, startedBefore = null, reason }) => {
  const rootClient = await pool.connect();

  try {
    const schemas = await getTenantSchemas(rootClient);
    let closedCount = 0;

    for (const schemaName of schemas) {
      await withTenantDb(schemaName, async (db) => {
        const result = await posSessionService.autoCloseOpenSessions(db, {
          endedAt,
          startedBefore,
          closingNote: reason,
        });

        closedCount += Number(result.closed_count || 0);
      });
    }

    return {
      schema_count: schemas.length,
      closed_count: closedCount,
    };
  } finally {
    rootClient.release();
  }
};

const runStartupCatchUp = async () => {
  const jordanParts = getJordanParts();
  const cutoff = getMostRecentAutoCloseCutoff(jordanParts);
  const result = await autoCloseAcrossSchemas({
    endedAt: cutoff,
    startedBefore: cutoff,
    reason: "Automatically closed by the POS daily scheduler catch-up.",
  });

  if (result.closed_count > 0) {
    console.log(
      `✓ POS auto-close catch-up closed ${result.closed_count} session(s) across ${result.schema_count} schema(s)`,
    );
  }
};

const runScheduledAutoClose = async () => {
  const jordanParts = getJordanParts();
  const dayKey = buildJordanDayKey(jordanParts);
  const endedAt = buildJordanCutoffTimestamp(jordanParts);

  const result = await autoCloseAcrossSchemas({
    endedAt,
    reason: "Automatically closed by the POS daily scheduler at 3:00 AM.",
  });

  lastScheduledRunDayKey = dayKey;
  console.log(
    `✓ POS 3:00 AM auto-close closed ${result.closed_count} session(s) across ${result.schema_count} schema(s)`,
  );
};

const maybeRunScheduledAutoClose = async () => {
  const jordanParts = getJordanParts();
  const dayKey = buildJordanDayKey(jordanParts);
  const hour = Number(jordanParts.hour || 0);
  const minute = Number(jordanParts.minute || 0);

  if (
    hour === AUTO_CLOSE_HOUR &&
    minute === AUTO_CLOSE_MINUTE &&
    lastScheduledRunDayKey !== dayKey
  ) {
    await runScheduledAutoClose();
  }
};

const startPosSessionAutoCloseScheduler = async () => {
  if (schedulerIntervalId) {
    return;
  }

  await runStartupCatchUp();

  schedulerIntervalId = setInterval(() => {
    maybeRunScheduledAutoClose().catch((error) => {
      console.error("❌ POS auto-close scheduler failed:", error);
    });
  }, CHECK_INTERVAL_MS);

  console.log("✓ POS session auto-close scheduler started");
};

module.exports = {
  startPosSessionAutoCloseScheduler,
};
