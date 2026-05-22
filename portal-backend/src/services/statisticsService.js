const TIME_ZONE = "Asia/Amman";

const hasTableInCurrentSchema = async (db, tableName) => {
  const result = await db.query(
    `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = current_schema()
          AND table_name = $1
      ) AS supported
    `,
    [tableName]
  );

  return result.rows[0]?.supported === true;
};

const hasManualTokenChargeTable = async (db) =>
  hasTableInCurrentSchema(db, "pos_manual_token_charges");

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

const getCurrentYearStart = () => `${getJordanToday().slice(0, 4)}-01-01`;

const resolveDateRange = (fromInput, toInput) => {
  const today = getJordanToday();
  const from = normalizeDateInput(fromInput) || getCurrentYearStart();
  const to = normalizeDateInput(toInput) || today;

  return from <= to ? { from, to } : { from: to, to: from };
};

const toNumber = (value) => Number(value || 0);

const mapNumericRows = (rows, numericKeys = []) =>
  rows.map((row) => {
    const mapped = { ...row };

    numericKeys.forEach((key) => {
      mapped[key] = toNumber(mapped[key]);
    });

    return mapped;
  });

const getStatisticsKpis = async (db, { from, to }) => {
  const [salesRes, refundsRes] = await Promise.all([
    db.query(
      `
        SELECT
          COALESCE(SUM(total), 0) AS total_sales,
          COUNT(*)::int AS invoice_count
        FROM invoice_header
        WHERE date::date BETWEEN $1::date AND $2::date
      `,
      [from, to]
    ),
    db.query(
      `
        SELECT COALESCE(SUM(total), 0) AS total_refunds
        FROM refund_invoice_header
        WHERE refund_date::date BETWEEN $1::date AND $2::date
      `,
      [from, to]
    ),
  ]);

  const totalSales = toNumber(salesRes.rows[0]?.total_sales);
  const totalRefunds = toNumber(refundsRes.rows[0]?.total_refunds);

  return {
    total_sales: totalSales,
    total_refunds: totalRefunds,
    net_profit: totalSales - totalRefunds,
    invoice_count: Number(salesRes.rows[0]?.invoice_count || 0),
  };
};

const getOverviewStatistics = async (db, { from, to }) => {
  const [monthlyNetRes, monthlyAvgRes, lowStockRes, recentSalesRes] =
    await Promise.all([
      db.query(
        `
          WITH months AS (
            SELECT generate_series(
              date_trunc('month', $1::date),
              date_trunc('month', $2::date),
              INTERVAL '1 month'
            )::date AS month_start
          ),
          sales AS (
            SELECT
              date_trunc('month', date)::date AS month_start,
              COALESCE(SUM(total), 0)::numeric AS sales_total
            FROM invoice_header
            WHERE date::date BETWEEN $1::date AND $2::date
            GROUP BY 1
          ),
          refunds AS (
            SELECT
              date_trunc('month', refund_date)::date AS month_start,
              COALESCE(SUM(total), 0)::numeric AS refunds_total
            FROM refund_invoice_header
            WHERE refund_date::date BETWEEN $1::date AND $2::date
            GROUP BY 1
          )
          SELECT
            months.month_start,
            COALESCE(sales.sales_total, 0) - COALESCE(refunds.refunds_total, 0) AS net
          FROM months
          LEFT JOIN sales ON sales.month_start = months.month_start
          LEFT JOIN refunds ON refunds.month_start = months.month_start
          ORDER BY months.month_start
        `,
        [from, to]
      ),
      db.query(
        `
          WITH months AS (
            SELECT generate_series(
              date_trunc('month', $1::date),
              date_trunc('month', $2::date),
              INTERVAL '1 month'
            )::date AS month_start
          ),
          agg AS (
            SELECT
              date_trunc('month', date)::date AS month_start,
              COUNT(*)::int AS cnt,
              COALESCE(SUM(total), 0)::numeric AS sum_total
            FROM invoice_header
            WHERE date::date BETWEEN $1::date AND $2::date
            GROUP BY 1
          )
          SELECT
            months.month_start,
            CASE
              WHEN COALESCE(agg.cnt, 0) = 0 THEN 0
              ELSE agg.sum_total / agg.cnt
            END AS avg
          FROM months
          LEFT JOIN agg ON agg.month_start = months.month_start
          ORDER BY months.month_start
        `,
        [from, to]
      ),
      db.query(
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
          LIMIT 20
        `
      ),
      db.query(
        `
          SELECT
            invoice_number,
            TO_CHAR(date, 'YYYY-MM-DD') AS date,
            client,
            total,
            type,
            pos,
            currency,
            qr
          FROM invoice_header
          WHERE date::date BETWEEN $1::date AND $2::date
          ORDER BY date DESC, invoice_number DESC
          LIMIT 10
        `,
        [from, to]
      ),
    ]);

  return {
    monthly_net: mapNumericRows(monthlyNetRes.rows, ["net"]),
    monthly_avg_invoice: mapNumericRows(monthlyAvgRes.rows, ["avg"]),
    low_stock: mapNumericRows(lowStockRes.rows, [
      "stock_qty",
      "minimum_qty_alert",
      "deficit",
    ]),
    recent_sales: mapNumericRows(recentSalesRes.rows, ["total"]),
  };
};

const getSalesStatistics = async (db, { from, to }) => {
  const [
    monthlySalesTotalsRes,
    monthlySalesCountRes,
    monthlyRefundsTotalsRes,
    salesByType2Res,
  ] = await Promise.all([
    db.query(
      `
        WITH months AS (
          SELECT generate_series(
            date_trunc('month', $1::date),
            date_trunc('month', $2::date),
            INTERVAL '1 month'
          )::date AS month_start
        ),
        agg AS (
          SELECT
            date_trunc('month', date)::date AS month_start,
            COALESCE(SUM(total), 0)::numeric AS total
          FROM invoice_header
          WHERE date::date BETWEEN $1::date AND $2::date
          GROUP BY 1
        )
        SELECT
          months.month_start,
          COALESCE(agg.total, 0) AS total
        FROM months
        LEFT JOIN agg ON agg.month_start = months.month_start
        ORDER BY months.month_start
      `,
      [from, to]
    ),
    db.query(
      `
        WITH months AS (
          SELECT generate_series(
            date_trunc('month', $1::date),
            date_trunc('month', $2::date),
            INTERVAL '1 month'
          )::date AS month_start
        ),
        agg AS (
          SELECT
            date_trunc('month', date)::date AS month_start,
            COUNT(*)::int AS count
          FROM invoice_header
          WHERE date::date BETWEEN $1::date AND $2::date
          GROUP BY 1
        )
        SELECT
          months.month_start,
          COALESCE(agg.count, 0) AS count
        FROM months
        LEFT JOIN agg ON agg.month_start = months.month_start
        ORDER BY months.month_start
      `,
      [from, to]
    ),
    db.query(
      `
        WITH months AS (
          SELECT generate_series(
            date_trunc('month', $1::date),
            date_trunc('month', $2::date),
            INTERVAL '1 month'
          )::date AS month_start
        ),
        agg AS (
          SELECT
            date_trunc('month', refund_date)::date AS month_start,
            COALESCE(SUM(total), 0)::numeric AS refunds
          FROM refund_invoice_header
          WHERE refund_date::date BETWEEN $1::date AND $2::date
          GROUP BY 1
        )
        SELECT
          months.month_start,
          COALESCE(agg.refunds, 0) AS refunds
        FROM months
        LEFT JOIN agg ON agg.month_start = months.month_start
        ORDER BY months.month_start
      `,
      [from, to]
    ),
    db.query(
      `
        WITH types AS (
          SELECT * FROM (VALUES ('local'), ('export'), ('development')) AS t(type2)
        ),
        agg AS (
          SELECT
            COALESCE(type2, 'local')::text AS type2,
            COALESCE(SUM(total), 0)::numeric AS total
          FROM invoice_header
          WHERE date::date BETWEEN $1::date AND $2::date
          GROUP BY 1
        )
        SELECT
          types.type2,
          COALESCE(agg.total, 0) AS total
        FROM types
        LEFT JOIN agg ON agg.type2 = types.type2
        ORDER BY types.type2
      `,
      [from, to]
    ),
  ]);

  return {
    monthly_sales_totals: mapNumericRows(monthlySalesTotalsRes.rows, ["total"]),
    monthly_sales_count: mapNumericRows(monthlySalesCountRes.rows, ["count"]),
    monthly_refunds_totals: mapNumericRows(monthlyRefundsTotalsRes.rows, ["refunds"]),
    sales_by_type2: mapNumericRows(salesByType2Res.rows, ["total"]),
  };
};

const getInventoryStatistics = async (db, { from, to }) => {
  const [topItemsRes, deadItemsRes, inOutRes] = await Promise.all([
    db.query(
      `
        WITH months AS (
          SELECT generate_series(
            date_trunc('month', $1::date),
            date_trunc('month', $2::date),
            INTERVAL '1 month'
          )::date AS month_start
        ),
        monthly_sales AS (
          SELECT
            date_trunc('month', ih.date)::date AS month_start,
            il.item_id,
            i.name AS item_name,
            SUM(il.total) AS total
          FROM invoice_lines il
          JOIN invoice_header ih
            ON ih.invoice_number = il.invoice_number
          JOIN items i
            ON i.id = il.item_id
          WHERE ih.date::date BETWEEN $1::date AND $2::date
          GROUP BY 1, il.item_id, i.name
        ),
        ranked AS (
          SELECT
            *,
            ROW_NUMBER() OVER (PARTITION BY month_start ORDER BY total DESC) AS rn
          FROM monthly_sales
        )
        SELECT
          m.month_start,
          MAX(CASE WHEN r.rn = 1 THEN r.total END) AS rank1_total,
          MAX(CASE WHEN r.rn = 1 THEN r.item_name END) AS rank1_name,
          MAX(CASE WHEN r.rn = 2 THEN r.total END) AS rank2_total,
          MAX(CASE WHEN r.rn = 2 THEN r.item_name END) AS rank2_name,
          MAX(CASE WHEN r.rn = 3 THEN r.total END) AS rank3_total,
          MAX(CASE WHEN r.rn = 3 THEN r.item_name END) AS rank3_name
        FROM months m
        LEFT JOIN ranked r ON r.month_start = m.month_start
        GROUP BY m.month_start
        ORDER BY m.month_start
      `,
      [from, to]
    ),
    db.query(
      `
        SELECT
          i.id,
          i.name,
          COALESCE(SUM(CASE WHEN ih.date::date BETWEEN $1::date AND $2::date THEN il.qty ELSE 0 END), 0) AS sold_qty
        FROM items i
        LEFT JOIN invoice_lines il
          ON il.item_id = i.id
        LEFT JOIN invoice_header ih
          ON ih.invoice_number = il.invoice_number
        GROUP BY i.id
        HAVING COALESCE(SUM(CASE WHEN ih.date::date BETWEEN $1::date AND $2::date THEN il.qty ELSE 0 END), 0) = 0
        ORDER BY i.created_at ASC
        LIMIT 10
      `,
      [from, to]
    ),
    db.query(
      `
        WITH months AS (
          SELECT generate_series(
            date_trunc('month', $1::date),
            date_trunc('month', $2::date),
            INTERVAL '1 month'
          )::date AS month_start
        ),
        agg AS (
          SELECT
            date_trunc('month', created_at)::date AS month_start,
            SUM(CASE WHEN direction = 'IN' THEN qty ELSE 0 END) AS in_qty,
            SUM(CASE WHEN direction = 'OUT' THEN qty ELSE 0 END) AS out_qty
          FROM transaction_logs
          WHERE created_at::date BETWEEN $1::date AND $2::date
          GROUP BY 1
        )
        SELECT
          months.month_start,
          COALESCE(agg.in_qty, 0) AS in_qty,
          COALESCE(agg.out_qty, 0) AS out_qty
        FROM months
        LEFT JOIN agg ON agg.month_start = months.month_start
        ORDER BY months.month_start
      `,
      [from, to]
    ),
  ]);

  return {
    top_items_monthly: mapNumericRows(topItemsRes.rows, [
      "rank1_total",
      "rank2_total",
      "rank3_total",
    ]),
    dead_items: mapNumericRows(deadItemsRes.rows, ["sold_qty"]),
    monthly_inout: mapNumericRows(inOutRes.rows, ["in_qty", "out_qty"]),
  };
};

const getClientStatistics = async (db, { from, to }) => {
  const [spendingMonthly, countMonthly, topSpending, topSales] = await Promise.all([
    db.query(
      `
        WITH ranked AS (
          SELECT
            date_trunc('month', ih.date)::date AS month_start,
            c.id AS client_id,
            c.name AS client_name,
            SUM(ih.total) AS total_spent,
            ROW_NUMBER() OVER (
              PARTITION BY date_trunc('month', ih.date)::date
              ORDER BY SUM(ih.total) DESC
            ) AS rn
          FROM invoice_header ih
          JOIN clients c ON c.id = ih.client_id
          WHERE ih.date::date BETWEEN $1::date AND $2::date
          GROUP BY 1, c.id, c.name
        )
        SELECT
          month_start,
          MAX(CASE WHEN rn = 1 THEN total_spent END) AS rank1_value,
          MAX(CASE WHEN rn = 1 THEN client_name END) AS rank1_name,
          MAX(CASE WHEN rn = 2 THEN total_spent END) AS rank2_value,
          MAX(CASE WHEN rn = 2 THEN client_name END) AS rank2_name,
          MAX(CASE WHEN rn = 3 THEN total_spent END) AS rank3_value,
          MAX(CASE WHEN rn = 3 THEN client_name END) AS rank3_name
        FROM ranked
        WHERE rn <= 3
        GROUP BY month_start
        ORDER BY month_start
      `,
      [from, to]
    ),
    db.query(
      `
        WITH ranked AS (
          SELECT
            date_trunc('month', ih.date)::date AS month_start,
            c.id AS client_id,
            c.name AS client_name,
            COUNT(*) AS sales_count,
            ROW_NUMBER() OVER (
              PARTITION BY date_trunc('month', ih.date)::date
              ORDER BY COUNT(*) DESC
            ) AS rn
          FROM invoice_header ih
          JOIN clients c ON c.id = ih.client_id
          WHERE ih.date::date BETWEEN $1::date AND $2::date
          GROUP BY 1, c.id, c.name
        )
        SELECT
          month_start,
          MAX(CASE WHEN rn = 1 THEN sales_count END) AS rank1_value,
          MAX(CASE WHEN rn = 1 THEN client_name END) AS rank1_name,
          MAX(CASE WHEN rn = 2 THEN sales_count END) AS rank2_value,
          MAX(CASE WHEN rn = 2 THEN client_name END) AS rank2_name,
          MAX(CASE WHEN rn = 3 THEN sales_count END) AS rank3_value,
          MAX(CASE WHEN rn = 3 THEN client_name END) AS rank3_name
        FROM ranked
        WHERE rn <= 3
        GROUP BY month_start
        ORDER BY month_start
      `,
      [from, to]
    ),
    db.query(
      `
        SELECT
          c.id,
          c.name,
          SUM(ih.total) AS total_spent
        FROM invoice_header ih
        JOIN clients c ON c.id = ih.client_id
        WHERE ih.date::date BETWEEN $1::date AND $2::date
        GROUP BY c.id, c.name
        ORDER BY total_spent DESC
        LIMIT 10
      `,
      [from, to]
    ),
    db.query(
      `
        SELECT
          c.id,
          c.name,
          COUNT(*) AS sales_count
        FROM invoice_header ih
        JOIN clients c ON c.id = ih.client_id
        WHERE ih.date::date BETWEEN $1::date AND $2::date
        GROUP BY c.id, c.name
        ORDER BY sales_count DESC
        LIMIT 10
      `,
      [from, to]
    ),
  ]);

  return {
    spending_monthly: mapNumericRows(spendingMonthly.rows, [
      "rank1_value",
      "rank2_value",
      "rank3_value",
    ]),
    count_monthly: mapNumericRows(countMonthly.rows, [
      "rank1_value",
      "rank2_value",
      "rank3_value",
    ]),
    top_spending_clients: mapNumericRows(topSpending.rows, ["total_spent"]),
    top_sales_clients: mapNumericRows(topSales.rows, ["sales_count"]),
  };
};

const getPosStatistics = async (db, { from, to }) => {
  const manualTokenChargesEnabled = await hasManualTokenChargeTable(db);

  const monthlySalesVsTokensQuery = `
    WITH months AS (
      SELECT generate_series(
        date_trunc('month', $1::date),
        date_trunc('month', $2::date),
        INTERVAL '1 month'
      )::date AS month_start
    ),
    monthly_sales AS (
      SELECT
        date_trunc('month', ih.date)::date AS month_start,
        COALESCE(SUM(ih.total), 0)::numeric AS total_sales
      FROM invoice_header ih
      WHERE ih.session_id IS NOT NULL
        AND ih.date::date BETWEEN $1::date AND $2::date
      GROUP BY 1
    ),
    monthly_item_tokens AS (
      SELECT
        date_trunc('month', ih.date)::date AS month_start,
        COALESCE(
          SUM(
            il.qty * CASE
              WHEN COALESCE(i.has_tokens, false) THEN COALESCE(i.token_count, 0)
              ELSE 0
            END
          ),
          0
        )::numeric AS total_tokens
      FROM invoice_header ih
      JOIN invoice_lines il
        ON il.invoice_number = ih.invoice_number
      LEFT JOIN items i
        ON i.id = il.item_id
      WHERE ih.session_id IS NOT NULL
        AND ih.date::date BETWEEN $1::date AND $2::date
      GROUP BY 1
    ),
    monthly_manual_tokens AS (
      ${
        manualTokenChargesEnabled
          ? `
      SELECT
        date_trunc('month', charged_at)::date AS month_start,
        COALESCE(SUM(token_amount), 0)::numeric AS total_tokens
      FROM pos_manual_token_charges
      WHERE charged_at::date BETWEEN $1::date AND $2::date
      GROUP BY 1
      `
          : `
      SELECT
        NULL::date AS month_start,
        0::numeric AS total_tokens
      WHERE false
      `
      }
    )
    SELECT
      months.month_start,
      COALESCE(monthly_sales.total_sales, 0) AS total_sales,
      COALESCE(monthly_item_tokens.total_tokens, 0)
        + COALESCE(monthly_manual_tokens.total_tokens, 0) AS total_tokens
    FROM months
    LEFT JOIN monthly_sales
      ON monthly_sales.month_start = months.month_start
    LEFT JOIN monthly_item_tokens
      ON monthly_item_tokens.month_start = months.month_start
    LEFT JOIN monthly_manual_tokens
      ON monthly_manual_tokens.month_start = months.month_start
    ORDER BY months.month_start
  `;

  const posPerformanceQuery = `
    WITH pos_totals AS (
      SELECT
        COALESCE(pp.id::text, CONCAT('session-pos:', COALESCE(ps.id::text, 'unknown'))) AS pos_key,
        COALESCE(NULLIF(MAX(pp.name), ''), NULLIF(MAX(ps.pos), ''), 'Unknown POS') AS pos_name,
        COALESCE(SUM(ih.total), 0)::numeric AS total_sales
      FROM invoice_header ih
      JOIN pos_sessions ps
        ON ps.id = ih.session_id
      LEFT JOIN pos_points pp
        ON pp.id = ps.pos_point_id
      WHERE ih.date::date BETWEEN $1::date AND $2::date
      GROUP BY COALESCE(pp.id::text, CONCAT('session-pos:', COALESCE(ps.id::text, 'unknown')))
    )
    SELECT pos_key, pos_name, total_sales
    FROM pos_totals
    WHERE total_sales > 0
    ORDER BY total_sales DESC, pos_name ASC
  `;

  const topUsersMonthlyQuery = `
    WITH ranked AS (
      SELECT
        date_trunc('month', ih.date)::date AS month_start,
        COALESCE(ih.user_id::text, 'unknown') AS user_key,
        COALESCE(NULLIF(MAX(u.full_name), ''), NULLIF(MAX(u.username), ''), 'Unknown User') AS user_name,
        COALESCE(SUM(ih.total), 0)::numeric AS total_sales,
        ROW_NUMBER() OVER (
          PARTITION BY date_trunc('month', ih.date)::date
          ORDER BY COALESCE(SUM(ih.total), 0) DESC, COALESCE(ih.user_id::text, 'unknown')
        ) AS rn
      FROM invoice_header ih
      LEFT JOIN users u
        ON u.id = ih.user_id
      WHERE ih.session_id IS NOT NULL
        AND ih.date::date BETWEEN $1::date AND $2::date
      GROUP BY 1, COALESCE(ih.user_id::text, 'unknown')
    )
    SELECT
      month_start,
      MAX(CASE WHEN rn = 1 THEN total_sales END) AS rank1_value,
      MAX(CASE WHEN rn = 1 THEN user_name END) AS rank1_name,
      MAX(CASE WHEN rn = 2 THEN total_sales END) AS rank2_value,
      MAX(CASE WHEN rn = 2 THEN user_name END) AS rank2_name,
      MAX(CASE WHEN rn = 3 THEN total_sales END) AS rank3_value,
      MAX(CASE WHEN rn = 3 THEN user_name END) AS rank3_name
    FROM ranked
    WHERE rn <= 3
    GROUP BY month_start
    ORDER BY month_start
  `;

  const topUsersRangeQuery = `
    SELECT
      COALESCE(ih.user_id::text, 'unknown') AS user_key,
      COALESCE(NULLIF(MAX(u.full_name), ''), NULLIF(MAX(u.username), ''), 'Unknown User') AS user_name,
      COALESCE(SUM(ih.total), 0)::numeric AS total_sales
    FROM invoice_header ih
    LEFT JOIN users u
      ON u.id = ih.user_id
    WHERE ih.session_id IS NOT NULL
      AND ih.date::date BETWEEN $1::date AND $2::date
    GROUP BY COALESCE(ih.user_id::text, 'unknown')
    HAVING COALESCE(SUM(ih.total), 0) > 0
    ORDER BY total_sales DESC, user_name ASC
    LIMIT 10
  `;

  const [monthlySalesVsTokens, posPerformance, topUsersMonthly, topUsersRange] =
    await Promise.all([
      db.query(monthlySalesVsTokensQuery, [from, to]),
      db.query(posPerformanceQuery, [from, to]),
      db.query(topUsersMonthlyQuery, [from, to]),
      db.query(topUsersRangeQuery, [from, to]),
    ]);

  return {
    manual_token_charges_enabled: manualTokenChargesEnabled,
    monthly_sales_vs_tokens: mapNumericRows(monthlySalesVsTokens.rows, [
      "total_sales",
      "total_tokens",
    ]),
    pos_performance: mapNumericRows(posPerformance.rows, ["total_sales"]),
    top_users_monthly: mapNumericRows(topUsersMonthly.rows, [
      "rank1_value",
      "rank2_value",
      "rank3_value",
    ]),
    top_users_year: mapNumericRows(topUsersRange.rows, ["total_sales"]),
  };
};

const getReceiptsStatistics = async (db, { from, to }) => {
  const [monthlyDueVsPaid, topClientsOutstanding, topOutstandingBalances, agingBalances] =
    await Promise.all([
      db.query(
        `
          WITH months AS (
            SELECT generate_series(
              date_trunc('month', $1::date),
              date_trunc('month', $2::date),
              INTERVAL '1 month'
            )::date AS month_start
          ),
          due_agg AS (
            SELECT
              date_trunc('month', db.date)::date AS month_start,
              COALESCE(SUM(db.amount), 0) AS due
            FROM due_balances db
            WHERE db.date::date BETWEEN $1::date AND $2::date
            GROUP BY 1
          ),
          paid_agg AS (
            SELECT
              date_trunc('month', rv.date)::date AS month_start,
              COALESCE(SUM(rv.amount), 0) AS paid
            FROM receipt_voucher rv
            WHERE rv.date::date BETWEEN $1::date AND $2::date
            GROUP BY 1
          )
          SELECT
            months.month_start,
            COALESCE(due_agg.due, 0) AS due,
            COALESCE(paid_agg.paid, 0) AS paid
          FROM months
          LEFT JOIN due_agg ON due_agg.month_start = months.month_start
          LEFT JOIN paid_agg ON paid_agg.month_start = months.month_start
          ORDER BY months.month_start
        `,
        [from, to]
      ),
      db.query(
        `
          SELECT
            c.id,
            c.name,
            SUM(db.amount) - COALESCE(SUM(rv.amount), 0) AS outstanding
          FROM due_balances db
          LEFT JOIN receipt_voucher rv
            ON rv.due_balance_id = db.id
          LEFT JOIN clients c
            ON c.id = db.client_id
          WHERE db.date::date BETWEEN $1::date AND $2::date
          GROUP BY c.id, c.name
          HAVING SUM(db.amount) - COALESCE(SUM(rv.amount), 0) > 0
          ORDER BY outstanding DESC
          LIMIT 8
        `,
        [from, to]
      ),
      db.query(
        `
          SELECT
            db.id,
            db.reason,
            TO_CHAR(db.date, 'YYYY-MM-DD') AS date,
            c.name AS client,
            db.amount,
            COALESCE(SUM(rv.amount), 0) AS paid
          FROM due_balances db
          LEFT JOIN receipt_voucher rv
            ON rv.due_balance_id = db.id
          LEFT JOIN clients c
            ON c.id = db.client_id
          WHERE db.date::date BETWEEN $1::date AND $2::date
          GROUP BY db.id, c.name
          HAVING COALESCE(SUM(rv.amount), 0) < db.amount
          ORDER BY (db.amount - COALESCE(SUM(rv.amount), 0)) DESC
          LIMIT 10
        `,
        [from, to]
      ),
      db.query(
        `
          SELECT
            db.id,
            db.reason,
            TO_CHAR(db.date, 'YYYY-MM-DD') AS date,
            c.name AS client,
            db.amount,
            TO_CHAR(COALESCE(MAX(rv.date), db.date), 'YYYY-MM-DD') AS last_payment_date,
            CURRENT_DATE - COALESCE(MAX(rv.date), db.date) AS aging_days
          FROM due_balances db
          LEFT JOIN receipt_voucher rv
            ON rv.due_balance_id = db.id
          LEFT JOIN clients c
            ON c.id = db.client_id
          WHERE db.date::date BETWEEN $1::date AND $2::date
          GROUP BY db.id, db.date, c.name
          ORDER BY aging_days DESC
          LIMIT 10
        `,
        [from, to]
      ),
    ]);

  return {
    monthly_due_vs_paid: mapNumericRows(monthlyDueVsPaid.rows, ["due", "paid"]),
    top_clients_outstanding: mapNumericRows(topClientsOutstanding.rows, ["outstanding"]),
    top_outstanding_balances: mapNumericRows(topOutstandingBalances.rows, [
      "amount",
      "paid",
    ]),
    aging_balances: mapNumericRows(agingBalances.rows, ["amount", "aging_days"]),
  };
};

const getStatisticsData = async (db, fromInput, toInput) => {
  const range = resolveDateRange(fromInput, toInput);

  const [kpis, overview, sales, inventory, clients, posAnalytics, receipts] =
    await Promise.all([
      getStatisticsKpis(db, range),
      getOverviewStatistics(db, range),
      getSalesStatistics(db, range),
      getInventoryStatistics(db, range),
      getClientStatistics(db, range),
      getPosStatistics(db, range),
      getReceiptsStatistics(db, range),
    ]);

  return {
    range,
    kpis,
    overview,
    sales,
    inventory,
    clients,
    pos_analytics: posAnalytics,
    receipts,
  };
};

module.exports = {
  getStatisticsData,
};
