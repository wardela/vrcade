const invoiceService = require("../../../backend/services/invoiceService");
const {
  buildEinvoiceXml,
  sendEinvoice,
  extractQR,
} = require("../../../backend/einvoice");

const normalizeDateFilter = (value) => {
  const normalized = String(value || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : null;
};

const normalizeSearchQuery = (value) => {
  const normalized = String(value || "").trim();
  return normalized ? normalized : "";
};

const toPositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const toNumber = (value) => Number(value || 0);
const DEFAULT_QR = "123456789";

const normalizeLimit = (value, fallback = 20, max = 100) =>
  Math.min(toPositiveInteger(value, fallback), max);

const normalizeInvoiceNumber = (value) => String(value || "").trim();

const normalizeSearchTerm = (value) => String(value || "").trim();

const normalizeIstdMessage = (data) => {
  if (!data) {
    return "ISTD rejected the invoice request";
  }

  if (typeof data === "string") {
    if (/504 Gateway Time-out/i.test(data)) {
      return "ISTD gateway timed out. Please retry shortly.";
    }

    return data.length <= 300 ? data : `${data.slice(0, 300)}...`;
  }

  if (typeof data === "object" && data.message) {
    return String(data.message);
  }

  return "ISTD rejected the invoice request";
};

const createServiceError = (message, statusCode = 500, code = "SERVICE_ERROR", extra = {}) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  Object.assign(error, extra);
  return error;
};

const buildInvoiceFilters = ({ query, dateFrom, dateTo }) => {
  const clauses = [];
  const params = [];

  if (query) {
    params.push(`%${query}%`);
    const token = `$${params.length}`;
    clauses.push(`
      (
        ih.invoice_number ILIKE ${token}
        OR COALESCE(ih.client, '') ILIKE ${token}
        OR COALESCE(ih.client_detail, '') ILIKE ${token}
        OR TO_CHAR(ih.date, 'YYYY-MM-DD') ILIKE ${token}
      )
    `);
  }

  if (dateFrom) {
    params.push(dateFrom);
    clauses.push(`ih.date::date >= $${params.length}::date`);
  }

  if (dateTo) {
    params.push(dateTo);
    clauses.push(`ih.date::date <= $${params.length}::date`);
  }

  return {
    whereClause: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
    params,
  };
};

const listInvoices = async (
  db,
  { limit = 20, offset = 0, query = "", dateFrom = null, dateTo = null } = {},
) => {
  const normalizedLimit = Math.min(toPositiveInteger(limit, 20), 100);
  const normalizedOffset = Math.max(Number.parseInt(offset, 10) || 0, 0);
  const normalizedQuery = normalizeSearchQuery(query);
  const normalizedDateFrom = normalizeDateFilter(dateFrom);
  const normalizedDateTo = normalizeDateFilter(dateTo);
  const { whereClause, params } = buildInvoiceFilters({
    query: normalizedQuery,
    dateFrom: normalizedDateFrom,
    dateTo: normalizedDateTo,
  });

  const listParams = [...params, normalizedLimit, normalizedOffset];
  const listQuery = `
    SELECT
      ih.invoice_number,
      ih.client,
      ih.total,
      ih.type,
      ih.type2,
      ih.currency,
      ih.qr,
      ih.reference,
      TO_CHAR(ih.date, 'YYYY-MM-DD HH24:MI') AS date_time,
      TO_CHAR(ih.date, 'YYYY-MM-DD') AS invoice_date,
      COALESCE(u.full_name, u.username, 'Unknown User') AS issued_by,
      EXISTS (
        SELECT 1
        FROM refund_invoice_header rih
        WHERE rih.original_invoice_number = ih.invoice_number
      ) AS has_refund
    FROM invoice_header ih
    LEFT JOIN users u
      ON u.id = ih.user_id
    ${whereClause}
    ORDER BY ih.date DESC, ih.invoice_number DESC
    LIMIT $${listParams.length - 1}
    OFFSET $${listParams.length};
  `;

  const countQuery = `
    SELECT COUNT(*)::int AS total_count
    FROM invoice_header ih
    ${whereClause};
  `;

  const [listResult, countResult] = await Promise.all([
    db.query(listQuery, listParams),
    db.query(countQuery, params),
  ]);

  const totalCount = Number(countResult.rows[0]?.total_count || 0);

  return {
    rows: listResult.rows.map((row) => ({
      invoice_number: row.invoice_number,
      client: row.client || "",
      total: toNumber(row.total),
      type: row.type || "",
      type2: row.type2 || "",
      currency: row.currency || "JOD",
      qr: row.qr || "",
      reference: row.reference || "",
      date_time: row.date_time || "",
      invoice_date: row.invoice_date || "",
      issued_by: row.issued_by,
      has_refund: row.has_refund === true,
    })),
    total_count: totalCount,
    limit: normalizedLimit,
    offset: normalizedOffset,
    has_more: normalizedOffset + listResult.rows.length < totalCount,
  };
};

const getInvoiceDetail = async (db, invoiceNumber) => {
  const normalizedInvoiceNumber = String(invoiceNumber || "").trim();
  if (!normalizedInvoiceNumber) {
    return null;
  }

  const headerQuery = `
    SELECT
      ih.invoice_number,
      ih.uuid,
      ih.pos,
      ih.session_id,
      ih.user_id,
      ih.total,
      ih.client,
      ih.notes,
      ih.type,
      ih.qr,
      ih.type2,
      ih.currency,
      ih.client_contact,
      ih.client_detail,
      ih.client_det_code,
      ih.client_id,
      ih.reference,
      u.username,
      COALESCE(u.full_name, u.username) AS employee_full_name,
      ps.pos_point_id,
      COALESCE(pp.name, NULLIF(ih.pos, '')) AS pos_point_name,
      TO_CHAR(ih.date, 'YYYY-MM-DD HH24:MI') AS date_time,
      TO_CHAR(ih.date, 'YYYY-MM-DD') AS date
    FROM invoice_header ih
    LEFT JOIN users u
      ON u.id = ih.user_id
    LEFT JOIN pos_sessions ps
      ON ps.id = ih.session_id
    LEFT JOIN pos_points pp
      ON pp.id = ps.pos_point_id
    WHERE ih.invoice_number = $1
    LIMIT 1;
  `;

  const linesQuery = `
    SELECT
      il.id,
      il.invoice_number,
      il.item_number,
      il.item_price,
      il.discount,
      il.discount_percentage,
      il.tax,
      il.qty,
      il.description,
      il.total,
      il.notes,
      il.item_code,
      il.exempt,
      il.item_id,
      il.unit_number,
      il.storage_id,
      i.is_stocked,
      COALESCE(i.has_tokens, false) AS has_tokens,
      COALESCE(i.token_count, 0) AS token_count,
      COALESCE(i.is_offer_item, false) AS is_offer_item,
      s.name AS storage_name,
      u.name AS unit_name
    FROM invoice_lines il
    LEFT JOIN items i
      ON i.id = il.item_id
    LEFT JOIN storages s
      ON s.id = il.storage_id
    LEFT JOIN units u
      ON u.id = il.unit_number
    WHERE il.invoice_number = $1
    ORDER BY il.item_number ASC;
  `;

  const [headerResult, linesResult, company] = await Promise.all([
    db.query(headerQuery, [normalizedInvoiceNumber]),
    db.query(linesQuery, [normalizedInvoiceNumber]),
    invoiceService.getCompanyConfig(db),
  ]);

  if (headerResult.rowCount === 0) {
    return null;
  }

  return {
    header: headerResult.rows[0],
    lines: linesResult.rows,
    company: company || null,
  };
};

const getInvoiceCompany = async (db) => (await invoiceService.getCompanyConfig(db)) || {};

const getNextInvoiceNumber = async (db) => {
  const nextInvoiceNumber = await invoiceService.getNextInvoiceNumber(db);
  return {
    next_invoice_number: nextInvoiceNumber,
  };
};

const getInvoiceClients = async (db, { query = "", limit = 100 } = {}) => {
  const normalizedQuery = normalizeSearchTerm(query);
  const normalizedLimit = normalizeLimit(limit, 100, 200);

  const params = [normalizedLimit];
  const filters = [];

  if (normalizedQuery) {
    params.unshift(`%${normalizedQuery}%`);
    filters.push(`
      (
        c.name ILIKE $1
        OR COALESCE(c.phone, '') ILIKE $1
        OR COALESCE(c.detail_value, '') ILIKE $1
        OR CAST(c.id AS TEXT) ILIKE $1
      )
    `);
  }

  const limitToken = `$${params.length}`;
  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const result = await db.query(
    `
      SELECT
        c.id,
        c.name,
        c.phone,
        c.detail_type,
        c.detail_value
      FROM clients c
      ${whereClause}
      ORDER BY c.name ASC, c.id ASC
      LIMIT ${limitToken}
    `,
    params
  );

  return result.rows;
};

const getInvoiceItemCatalog = async (db, { query = "", limit = 100 } = {}) => {
  const normalizedQuery = normalizeSearchTerm(query);
  const normalizedLimit = normalizeLimit(limit, 100, 200);

  const params = [];
  const clauses = [];

  if (normalizedQuery) {
    params.push(`%${normalizedQuery}%`);
    const token = `$${params.length}`;
    params.push(/^\d+$/.test(normalizedQuery) ? Number(normalizedQuery) : null);
    const idToken = `$${params.length}`;
    clauses.push(`
      (
        i.name ILIKE ${token}
        OR COALESCE(i.code, '') ILIKE ${token}
        OR (${idToken}::int IS NOT NULL AND i.id = ${idToken})
      )
    `);
  }

  params.push(normalizedLimit);
  const limitToken = `$${params.length}`;
  const whereClause = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  const result = await db.query(
    `
      SELECT
        i.id,
        i.code,
        i.name,
        i.fav,
        i.category,
        c.name AS category_name,
        i.price_with_tax,
        i.tax_percentage,
        i.unit,
        u.name AS unit_name,
        i.stock_qty,
        i.minimum_qty_alert,
        i.usual_discount_percentage,
        i.usual_sales_qty,
        i.notes,
        i.is_stocked,
        i.default_storage_id,
        s.name AS default_storage_name
      FROM items i
      LEFT JOIN categories c
        ON c.id = i.category
      LEFT JOIN units u
        ON u.id = i.unit
      LEFT JOIN storages s
        ON s.id = i.default_storage_id
      ${whereClause}
      ORDER BY i.name ASC, i.id ASC
      LIMIT ${limitToken}
    `,
    params
  );

  return result.rows;
};

const getInvoiceItemDetail = async (db, itemId) => {
  const normalizedItemId = Number.parseInt(itemId, 10);
  if (!Number.isInteger(normalizedItemId) || normalizedItemId <= 0) {
    return null;
  }

  return invoiceService.getItemById(db, normalizedItemId);
};

const getInvoiceStorages = async (db) => invoiceService.getAllStorages(db);

const createPortalInvoice = async (db, payload, { userId } = {}) => {
  const normalizedUserId = Number.parseInt(userId, 10);
  if (!Number.isInteger(normalizedUserId) || normalizedUserId <= 0) {
    throw createServiceError("Authenticated user is missing", 401, "AUTH_REQUIRED");
  }

  const created = await invoiceService.createInvoice(db, {
    ...payload,
    user_id: normalizedUserId,
    pos: payload?.pos || "POS-1",
  });

  if (!created?.header) {
    throw createServiceError("Invoice could not be saved", 400, "INVOICE_SAVE_FAILED");
  }

  const detail = await getInvoiceDetail(db, created.header.invoice_number);

  return {
    header: {
      ...created.header,
      qr: created.header.qr || DEFAULT_QR,
    },
    lines: created.lines || [],
    detail,
  };
};

const sharePortalInvoice = async (db, invoiceNumber) => {
  const normalizedInvoiceNumber = normalizeInvoiceNumber(invoiceNumber);
  if (!normalizedInvoiceNumber) {
    throw createServiceError("Invoice number is required", 400, "INVOICE_NUMBER_REQUIRED");
  }

  const company = await invoiceService.getCompanyConfig(db);
  if (!company) {
    throw createServiceError(
      "Company configuration not found",
      500,
      "COMPANY_CONFIG_MISSING"
    );
  }

  const full = await invoiceService.getFullInvoice(db, normalizedInvoiceNumber);
  if (!full?.header) {
    throw createServiceError("Invoice not found", 404, "INVOICE_NOT_FOUND");
  }

  if (full.header.qr && full.header.qr !== DEFAULT_QR) {
    return {
      message: "Invoice already shared",
      qr: full.header.qr,
      already_shared: true,
    };
  }

  const header = full.header;
  const lines = full.lines || [];

  const invoicePayload = {
    InvNumber: header.invoice_number,
    Date: header.date,
    Type: header.type,
    Type2: header.type2,
    Notes: header.notes || "",
    INVOICEUUID: header.uuid,
    HeaderTotal: Number(header.total),
    Currency: header.currency || "JOD",
    FileNo: "1",
    CompanyName: "1",
    INCOMESERIAL: "1",
    CUSTOMER_ID_CODE: header.client_det_code || "NIN",
    CUSTOMER_ID_VALUE: header.client_detail || "",
    CUSTOMERPHONE: header.client_contact || "079",
    CUSTOMERPOBOX: "",
    CustomerName: header.client || "",
  };

  const linePayload = lines.map((line) => ({
    ItemNumber: line.item_number,
    Qty: Number(line.qty),
    LineTotal: Number(line.total),
    TaxVal:
      line.tax === null || line.tax === undefined || Number.isNaN(Number(line.tax))
        ? 8
        : Number(line.tax),
    ItemDiscount: (() => {
      const hasDiscountPercent =
        line.discount_percentage !== null &&
        line.discount_percentage !== undefined &&
        String(line.discount_percentage).trim() !== "";
      const discountRaw = Number(line.discount_percentage);
      if (hasDiscountPercent && Number.isFinite(discountRaw) && discountRaw > 0) {
        return discountRaw > 1 ? discountRaw / 100 : discountRaw;
      }

      const itemPrice = Number(line.item_price) || 0;
      const discountValue = Number(line.discount);
      if (itemPrice > 0 && Number.isFinite(discountValue) && discountValue > 0) {
        return discountValue / itemPrice;
      }

      return 0;
    })(),
    OriginalPrice: Number(line.item_price),
    ItemName: line.description,
    ITEMNOTES: "",
    Exempt: line.exempt === true,
  }));

  const xml = buildEinvoiceXml(invoicePayload, linePayload, company);
  if (!xml) {
    throw createServiceError("XML generation failed", 400, "EINV_XML_FAILED");
  }

  try {
    const response = await sendEinvoice(xml, company);
    const qr = extractQR(JSON.stringify(response.data));

    if (!qr) {
      throw createServiceError("No QR returned from ISTD", 400, "EINV_QR_MISSING");
    }

    await invoiceService.saveInvoiceQR(db, normalizedInvoiceNumber, qr);

    return {
      message: "Invoice shared successfully",
      qr,
      api_status: response.status,
      already_shared: false,
    };
  } catch (error) {
    if (error.response) {
      throw createServiceError(
        normalizeIstdMessage(error.response.data),
        error.response.status,
        "ISTD_ERROR",
        {
          source: "ISTD",
          response_status: error.response.status,
        }
      );
    }

    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      throw createServiceError(
        "Timed out waiting for ISTD response",
        504,
        "ISTD_TIMEOUT",
        { source: "ISTD" }
      );
    }

    if (error.request) {
      throw createServiceError(
        "No response from ISTD servers",
        502,
        "ISTD_NO_RESPONSE",
        { source: "ISTD" }
      );
    }

    if (error.statusCode) {
      throw error;
    }

    throw createServiceError(
      error.message || "Unexpected error while sharing invoice",
      500,
      "SYSTEM_SHARE_ERROR",
      { source: "SYSTEM" }
    );
  }
};

module.exports = {
  listInvoices,
  getInvoiceDetail,
  getInvoiceCompany,
  getNextInvoiceNumber,
  getInvoiceClients,
  getInvoiceItemCatalog,
  getInvoiceItemDetail,
  getInvoiceStorages,
  createPortalInvoice,
  sharePortalInvoice,
};
