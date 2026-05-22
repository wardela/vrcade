const reportsService = require("../services/reportsService");

const parseNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const requireFields = (res, values, message) => {
  const hasMissing = values.some((value) => value == null || value === "");
  if (hasMissing) {
    res.status(400).json({ message });
    return false;
  }

  return true;
};

const handleError = (res, error, message) => {
  console.error(message, error);
  res.status(500).json({
    message,
  });
};

exports.getCompany = async (req, res) => {
  try {
    const company = await reportsService.getCompany(req.db);
    res.json(company || {});
  } catch (error) {
    handleError(res, error, "Failed to load company details");
  }
};

exports.getClients = async (req, res) => {
  try {
    const clients = await reportsService.getClients(req.db);
    res.json(clients || []);
  } catch (error) {
    handleError(res, error, "Failed to load clients");
  }
};

exports.getItems = async (req, res) => {
  try {
    const items = await reportsService.getItems(req.db);
    res.json(items || []);
  } catch (error) {
    handleError(res, error, "Failed to load items");
  }
};

exports.getStorages = async (req, res) => {
  try {
    const storages = await reportsService.getStorages(req.db);
    res.json(storages || []);
  } catch (error) {
    handleError(res, error, "Failed to load storages");
  }
};

exports.getGeneralSalesReport = async (req, res) => {
  const { from, to, limit = 100, offset = 0 } = req.query;
  if (!requireFields(res, [from, to], "from and to are required")) return;

  try {
    const data = await reportsService.getGeneralSalesReport(req.db, {
      from,
      to,
      limit: parseNumber(limit, 100),
      offset: parseNumber(offset, 0),
    });
    res.json(data);
  } catch (error) {
    handleError(res, error, "Failed to fetch general sales report");
  }
};

exports.getSalesByClientReport = async (req, res) => {
  const { from, to, client_id, limit = 100, offset = 0 } = req.query;
  if (!requireFields(res, [from, to, client_id], "from, to and client_id are required")) return;

  try {
    const data = await reportsService.getSalesByClientReport(req.db, {
      from,
      to,
      client_id: parseNumber(client_id),
      limit: parseNumber(limit, 100),
      offset: parseNumber(offset, 0),
    });
    res.json(data);
  } catch (error) {
    handleError(res, error, "Failed to fetch client sales report");
  }
};

exports.getSalesByAreaReport = async (req, res) => {
  const { from, to, area, limit = 100, offset = 0 } = req.query;
  if (!requireFields(res, [from, to, area], "from, to and area are required")) return;

  try {
    const data = await reportsService.getSalesByAreaReport(req.db, {
      from,
      to,
      area,
      limit: parseNumber(limit, 100),
      offset: parseNumber(offset, 0),
    });
    res.json(data);
  } catch (error) {
    handleError(res, error, "Failed to fetch area sales report");
  }
};

exports.getSalesByClientDetailedReport = async (req, res) => {
  const { from, to, client_id, limit = 100, offset = 0 } = req.query;
  if (!requireFields(res, [from, to, client_id], "from, to and client_id are required")) return;

  try {
    const data = await reportsService.getSalesByClientDetailedReport(req.db, {
      from,
      to,
      client_id: parseNumber(client_id),
      limit: parseNumber(limit, 100),
      offset: parseNumber(offset, 0),
    });
    res.json(data);
  } catch (error) {
    handleError(res, error, "Failed to fetch detailed client sales report");
  }
};

exports.getItemsSoldForClientTotals = async (req, res) => {
  const { from, to, client_id, limit = 100, offset = 0 } = req.query;
  if (!requireFields(res, [from, to, client_id], "from, to and client_id are required")) return;

  try {
    const data = await reportsService.getItemsSoldForClientTotals(req.db, {
      from,
      to,
      client_id: parseNumber(client_id),
      limit: parseNumber(limit, 100),
      offset: parseNumber(offset, 0),
    });
    res.json(data);
  } catch (error) {
    handleError(res, error, "Failed to fetch client items totals report");
  }
};

exports.getPaymentTypeTotalsReport = async (req, res) => {
  const { from, to } = req.query;
  if (!requireFields(res, [from, to], "from and to are required")) return;

  try {
    const data = await reportsService.getPaymentTypeTotalsReport(req.db, { from, to });
    res.json(data);
  } catch (error) {
    handleError(res, error, "Failed to fetch payment type totals report");
  }
};

exports.getPaymentTypeDetailedReport = async (req, res) => {
  const { from, to, limit = 100, offset = 0 } = req.query;
  if (!requireFields(res, [from, to], "from and to are required")) return;

  try {
    const data = await reportsService.getPaymentTypeDetailedReport(req.db, {
      from,
      to,
      limit: parseNumber(limit, 100),
      offset: parseNumber(offset, 0),
    });
    res.json(data);
  } catch (error) {
    handleError(res, error, "Failed to fetch detailed payment type report");
  }
};

exports.getEinvoicingReport = async (req, res) => {
  const { from, to, status, limit = 100, offset = 0 } = req.query;
  if (!requireFields(res, [from, to, status], "from, to and status are required")) return;

  if (!["shared", "unshared"].includes(status)) {
    return res.status(400).json({
      message: "status must be shared or unshared",
    });
  }

  try {
    const data = await reportsService.getEinvoicingReport(req.db, {
      from,
      to,
      status,
      limit: parseNumber(limit, 100),
      offset: parseNumber(offset, 0),
    });
    res.json(data);
  } catch (error) {
    handleError(res, error, "Failed to fetch e-invoicing report");
  }
};

exports.getTaxDeclarationReport = async (req, res) => {
  const { from, to } = req.query;
  if (!requireFields(res, [from, to], "from and to are required")) return;

  try {
    const data = await reportsService.getTaxDeclarationReport(req.db, { from, to });
    res.json(data);
  } catch (error) {
    handleError(res, error, "Failed to fetch tax declaration report");
  }
};

exports.getInvoiceTaxSummaryReport = async (req, res) => {
  const { from, to } = req.query;
  if (!requireFields(res, [from, to], "from and to are required")) return;

  try {
    const data = await reportsService.getInvoiceTaxSummaryReport(req.db, { from, to });
    res.json(data);
  } catch (error) {
    handleError(res, error, "Failed to fetch invoice tax summary report");
  }
};

exports.getRefundsReport = async (req, res) => {
  const { from, to, limit = 100, offset = 0 } = req.query;
  if (!requireFields(res, [from, to], "from and to are required")) return;

  try {
    const data = await reportsService.getRefundsReport(req.db, {
      from,
      to,
      limit: parseNumber(limit, 100),
      offset: parseNumber(offset, 0),
    });
    res.json(data);
  } catch (error) {
    handleError(res, error, "Failed to fetch refunds report");
  }
};

exports.getRefundsByClientReport = async (req, res) => {
  const { from, to, client_id, limit = 100, offset = 0 } = req.query;
  if (!requireFields(res, [from, to, client_id], "from, to and client_id are required")) return;

  try {
    const data = await reportsService.getRefundsByClientReport(req.db, {
      from,
      to,
      client_id: parseNumber(client_id),
      limit: parseNumber(limit, 100),
      offset: parseNumber(offset, 0),
    });
    res.json(data);
  } catch (error) {
    handleError(res, error, "Failed to fetch refunds by client report");
  }
};

exports.getItemsSalesReport = async (req, res) => {
  const { from, to, limit = 100, offset = 0 } = req.query;
  if (!requireFields(res, [from, to], "from and to are required")) return;

  try {
    const data = await reportsService.getItemsSalesReport(req.db, {
      from,
      to,
      limit: parseNumber(limit, 100),
      offset: parseNumber(offset, 0),
    });
    res.json(data);
  } catch (error) {
    handleError(res, error, "Failed to fetch item sales report");
  }
};

exports.getItemSalesDetailsReport = async (req, res) => {
  const { item_id, from, to, limit = 100, offset = 0 } = req.query;
  if (!requireFields(res, [item_id, from, to], "item_id, from and to are required")) return;

  try {
    const data = await reportsService.getItemSalesDetailsReport(req.db, {
      item_id: parseNumber(item_id),
      from,
      to,
      limit: parseNumber(limit, 100),
      offset: parseNumber(offset, 0),
    });
    res.json(data);
  } catch (error) {
    handleError(res, error, "Failed to fetch item sales details report");
  }
};

exports.getStorageInventoryReport = async (req, res) => {
  const { storage_id } = req.query;
  if (!requireFields(res, [storage_id], "storage_id is required")) return;

  try {
    const data = await reportsService.getStorageInventoryReport(req.db, { storage_id });
    res.json(data);
  } catch (error) {
    handleError(res, error, "Failed to fetch storage inventory report");
  }
};

exports.getTransactionsReport = async (req, res) => {
  const {
    from,
    to,
    item_id,
    storage_id,
    direction = "BOTH",
    limit = 100,
    offset = 0,
  } = req.query;

  if (!requireFields(res, [from, to], "from and to are required")) return;

  try {
    const data = await reportsService.getTransactionsReport(req.db, {
      from,
      to,
      item_id: item_id ? parseNumber(item_id) : null,
      storage_id: storage_id ? parseNumber(storage_id) : null,
      direction,
      limit: parseNumber(limit, 100),
      offset: parseNumber(offset, 0),
    });
    res.json(data);
  } catch (error) {
    handleError(res, error, "Failed to fetch storage transactions report");
  }
};

exports.getSalesRefundsCombinedReport = async (req, res) => {
  const { from, to, limit = 100, offset = 0 } = req.query;
  if (!requireFields(res, [from, to], "from and to are required")) return;

  try {
    const data = await reportsService.getSalesRefundsCombinedReport(req.db, {
      from,
      to,
      limit: parseNumber(limit, 100),
      offset: parseNumber(offset, 0),
    });
    res.json(data);
  } catch (error) {
    handleError(res, error, "Failed to fetch combined sales and refunds report");
  }
};

exports.getSalesRefundsCombinedByClientReport = async (req, res) => {
  const { from, to, client_id, limit = 100, offset = 0 } = req.query;
  if (!requireFields(res, [from, to, client_id], "from, to and client_id are required")) return;

  try {
    const data = await reportsService.getSalesRefundsCombinedByClientReport(req.db, {
      from,
      to,
      client_id: parseNumber(client_id),
      limit: parseNumber(limit, 100),
      offset: parseNumber(offset, 0),
    });
    res.json(data);
  } catch (error) {
    handleError(res, error, "Failed to fetch combined client sales and refunds report");
  }
};
