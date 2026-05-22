const TIME_ZONE = "Asia/Amman";
const HOURLY_WINDOW_SIZE = 6;
const DAILY_WINDOW_DAYS = 90;
const MONTHLY_WINDOW_MONTHS = 24;

const normalizeDateInput = (value) => {
  const normalized = String(value || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : null;
};

const getJordanToday = () => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
};

const formatJordanDate = (dateValue) => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(dateValue);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
};

const toNumber = (value) => Number(value || 0);

const toMonthStart = (dateString) => `${dateString.slice(0, 7)}-01`;
const toNextMonthStart = (dateString) => {
  const [year, month] = dateString.slice(0, 7).split("-").map(Number);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  return `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
};

const toIsoDate = (value) => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return formatJordanDate(value);
  }

  const normalized = String(value);
  return normalized.slice(0, 10);
};

const getLatestHourlyIndex = (selectedDate) => {
  if (selectedDate !== getJordanToday()) {
    return 23;
  }

  const currentHour = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    hour: "numeric",
    hour12: false,
  }).format(new Date());

  const parsed = Number.parseInt(currentHour, 10);
  return Number.isFinite(parsed) ? parsed : 23;
};

const getKpis = async (db, selectedDate) => {
  const monthStart = toMonthStart(selectedDate);
  const result = await db.query(
    `
      SELECT
        COUNT(*)::int AS invoice_count,
        COALESCE(SUM(total), 0) AS total_sales,
        COALESCE(AVG(total), 0) AS average_invoice_value
      FROM invoice_header
      WHERE date::date = $1::date
    `,
    [selectedDate]
  );

  const monthToDateResult = await db.query(
    `
      SELECT COALESCE(SUM(total), 0) AS month_to_date_sales
      FROM invoice_header
      WHERE date::date >= $1::date
        AND date::date <= $2::date
    `,
    [monthStart, selectedDate]
  );

  const row = result.rows[0] || {};

  return {
    invoice_count: Number(row.invoice_count || 0),
    total_sales: toNumber(row.total_sales),
    average_invoice_value: toNumber(row.average_invoice_value),
    month_to_date_sales: toNumber(monthToDateResult.rows[0]?.month_to_date_sales),
  };
};

const getHourlySalesSeries = async (db, selectedDate) => {
  const result = await db.query(
    `
      WITH hours AS (
        SELECT generate_series(0, 23) AS hour_index
      ),
      sales AS (
        SELECT
          EXTRACT(HOUR FROM date)::int AS hour_index,
          COALESCE(SUM(total), 0) AS total_sales
        FROM invoice_header
        WHERE date::date = $1::date
        GROUP BY 1
      )
      SELECT
        hours.hour_index,
        COALESCE(sales.total_sales, 0) AS total_sales
      FROM hours
      LEFT JOIN sales ON sales.hour_index = hours.hour_index
      ORDER BY hours.hour_index
    `,
    [selectedDate]
  );

  return result.rows.map((row) => ({
    key: `hour-${row.hour_index}`,
    hour_index: Number(row.hour_index),
    total_sales: toNumber(row.total_sales),
  }));
};

const getDailySalesSeries = async (db, selectedDate) => {
  const result = await db.query(
    `
      WITH days AS (
        SELECT generate_series(
          $1::date - (($2::int - 1) * INTERVAL '1 day'),
          $1::date,
          INTERVAL '1 day'
        )::date AS sales_date
      ),
      sales AS (
        SELECT
          date::date AS sales_date,
          COALESCE(SUM(total), 0) AS total_sales
        FROM invoice_header
        WHERE date::date >= ($1::date - (($2::int - 1) * INTERVAL '1 day'))
          AND date::date <= $1::date
        GROUP BY 1
      )
      SELECT
        days.sales_date,
        COALESCE(sales.total_sales, 0) AS total_sales
      FROM days
      LEFT JOIN sales ON sales.sales_date = days.sales_date
      ORDER BY days.sales_date
    `,
    [selectedDate, DAILY_WINDOW_DAYS]
  );

  return result.rows.map((row) => ({
    key: `day-${toIsoDate(row.sales_date)}`,
    sales_date: toIsoDate(row.sales_date),
    total_sales: toNumber(row.total_sales),
  }));
};

const getMonthlySalesSeries = async (db, selectedDate) => {
  const result = await db.query(
    `
      WITH months AS (
        SELECT generate_series(
          date_trunc('month', $1::date) - (($2::int - 1) * INTERVAL '1 month'),
          date_trunc('month', $1::date),
          INTERVAL '1 month'
        )::date AS month_start
      ),
      sales AS (
        SELECT
          date_trunc('month', date)::date AS month_start,
          COALESCE(SUM(total), 0) AS total_sales
        FROM invoice_header
        WHERE date::date >= (
          date_trunc('month', $1::date) - (($2::int - 1) * INTERVAL '1 month')
        )::date
          AND date::date < (date_trunc('month', $1::date) + INTERVAL '1 month')::date
        GROUP BY 1
      )
      SELECT
        months.month_start,
        COALESCE(sales.total_sales, 0) AS total_sales
      FROM months
      LEFT JOIN sales ON sales.month_start = months.month_start
      ORDER BY months.month_start
    `,
    [selectedDate, MONTHLY_WINDOW_MONTHS]
  );

  return result.rows.map((row) => ({
    key: `month-${toIsoDate(row.month_start)}`,
    month_start: toIsoDate(row.month_start),
    total_sales: toNumber(row.total_sales),
  }));
};

const getMonthlyPaymentTypes = async (db, selectedDate) => {
  const monthStart = toMonthStart(selectedDate);
  const nextMonthStart = toNextMonthStart(selectedDate);
  const result = await db.query(
    `
      SELECT
        COALESCE(
          SUM(
            CASE
              WHEN LOWER(BTRIM(COALESCE(ip.payment_method, ''))) = 'cash'
                THEN ip.amount
              ELSE 0
            END
          ),
          0
        ) AS cash,
        COALESCE(
          SUM(
            CASE
              WHEN LOWER(BTRIM(COALESCE(ip.payment_method, ''))) = 'card'
                THEN ip.amount
              ELSE 0
            END
          ),
          0
        ) AS card,
        COALESCE(
          SUM(
            CASE
              WHEN LOWER(BTRIM(COALESCE(ip.payment_method, ''))) = 'transfer'
                THEN ip.amount
              ELSE 0
            END
          ),
          0
        ) AS bank_transfer,
        0 AS others
      FROM invoice_payments ip
      JOIN invoice_header ih
        ON ih.id = ip.invoice_id
      WHERE ih.date::date >= $1::date
        AND ih.date::date < $2::date
    `,
    [monthStart, nextMonthStart]
  );

  const row = result.rows[0] || {};

  return [
    {
      key: "cash",
      label: "Cash",
      amount: toNumber(row.cash),
    },
    {
      key: "card",
      label: "Card",
      amount: toNumber(row.card),
    },
    {
      key: "bank_transfer",
      label: "Bank Transfer",
      amount: toNumber(row.bank_transfer),
    },
  ];
};

const getActivePosCards = async (db, selectedDate) => {
  const result = await db.query(
    `
      SELECT
        ps.id,
        COALESCE(pp.name, NULLIF(BTRIM(ps.pos), ''), 'POS') AS pos_name,
        COALESCE(u.full_name, u.username) AS current_user,
        ps.status,
        ps.started_at,
        ps.ended_at,
        COUNT(ih.invoice_number)::int AS invoice_count,
        COALESCE(SUM(ih.total), 0) AS total_sales
      FROM pos_sessions ps
      JOIN users u
        ON u.id = ps.user_id
      LEFT JOIN pos_points pp
        ON pp.id = ps.pos_point_id
      LEFT JOIN invoice_header ih
        ON ih.session_id = ps.id
      WHERE ps.started_at::date <= $1::date
        AND COALESCE(ps.ended_at::date, $1::date) >= $1::date
      GROUP BY
        ps.id,
        COALESCE(pp.name, NULLIF(BTRIM(ps.pos), ''), 'POS'),
        COALESCE(u.full_name, u.username),
        ps.status,
        ps.started_at,
        ps.ended_at
      ORDER BY
        CASE WHEN ps.status = 'active' THEN 0 ELSE 1 END,
        COALESCE(SUM(ih.total), 0) DESC,
        ps.started_at DESC
      LIMIT 8
    `,
    [selectedDate]
  );

  return result.rows.map((row) => ({
    id: row.id,
    pos_name: row.pos_name,
    current_user: row.current_user,
    session_status: row.status,
    started_at: row.started_at,
    ended_at: row.ended_at,
    invoice_count: Number(row.invoice_count || 0),
    total_sales: toNumber(row.total_sales),
  }));
};

const getRecentInvoices = async (db, selectedDate) => {
  const result = await db.query(
    `
      SELECT
        ih.invoice_number,
        ih.total,
        ih.date,
        COALESCE(u.full_name, u.username, 'Unknown User') AS issued_by
      FROM invoice_header ih
      LEFT JOIN users u
        ON u.id = ih.user_id
      WHERE ih.date::date = $1::date
      ORDER BY ih.date DESC, ih.invoice_number DESC
      LIMIT 3
    `,
    [selectedDate]
  );

  return result.rows.map((row) => ({
    invoice_number: row.invoice_number,
    total: toNumber(row.total),
    date: row.date instanceof Date ? formatJordanDate(row.date) : row.date,
    issued_by: row.issued_by,
  }));
};

const getDashboardData = async (db, selectedDateInput) => {
  const selectedDate = normalizeDateInput(selectedDateInput) || getJordanToday();

  const [
    kpis,
    hourlySales,
    dailySales,
    monthlySales,
    monthlyPaymentTypes,
    activePos,
    recentInvoices,
  ] = await Promise.all([
      getKpis(db, selectedDate),
      getHourlySalesSeries(db, selectedDate),
      getDailySalesSeries(db, selectedDate),
      getMonthlySalesSeries(db, selectedDate),
      getMonthlyPaymentTypes(db, selectedDate),
      getActivePosCards(db, selectedDate),
      getRecentInvoices(db, selectedDate),
    ]);

  return {
    selected_date: selectedDate,
    windows: {
      hourly_visible_count: HOURLY_WINDOW_SIZE,
      daily_visible_count: 7,
      monthly_visible_count: 6,
      default_hourly_end_index: getLatestHourlyIndex(selectedDate),
      default_daily_end_index: dailySales.length - 1,
      default_monthly_end_index: monthlySales.length - 1,
    },
    kpis,
    charts: {
      hourly_sales: hourlySales,
      daily_sales: dailySales,
      monthly_sales: monthlySales,
      payment_types: monthlyPaymentTypes,
    },
    active_pos: activePos,
    recent_invoices: recentInvoices,
  };
};

module.exports = {
  getDashboardData,
};
