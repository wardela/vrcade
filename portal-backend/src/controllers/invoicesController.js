const invoicesService = require("../services/invoicesService");

const parsePositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const handleError = (res, error, message) => {
  if (error?.statusCode) {
    return res.status(error.statusCode).json({
      code: error.code,
      source: error.source,
      status: error.response_status,
      message: error.message,
    });
  }

  console.error(message, error);
  return res.status(500).json({ message });
};

exports.listInvoices = async (req, res) => {
  try {
    const payload = await invoicesService.listInvoices(req.db, {
      limit: parsePositiveInteger(req.query.limit, 20),
      offset: Math.max(Number.parseInt(req.query.offset, 10) || 0, 0),
      query: req.query.q || "",
      dateFrom: req.query.date_from || "",
      dateTo: req.query.date_to || "",
    });

    return res.status(200).json(payload);
  } catch (error) {
    return handleError(res, error, "Failed to load portal invoices");
  }
};

exports.getInvoiceDetail = async (req, res) => {
  try {
    const payload = await invoicesService.getInvoiceDetail(
      req.db,
      req.params.invoiceNumber,
    );

    if (!payload) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    return res.status(200).json(payload);
  } catch (error) {
    return handleError(res, error, "Failed to load portal invoice details");
  }
};

exports.getCompany = async (req, res) => {
  try {
    const payload = await invoicesService.getInvoiceCompany(req.db);
    return res.status(200).json(payload || {});
  } catch (error) {
    return handleError(res, error, "Failed to load portal invoice company details");
  }
};

exports.getNextInvoiceNumber = async (req, res) => {
  try {
    const payload = await invoicesService.getNextInvoiceNumber(req.db);
    return res.status(200).json(payload);
  } catch (error) {
    return handleError(res, error, "Failed to load next portal invoice number");
  }
};

exports.getClients = async (req, res) => {
  try {
    const payload = await invoicesService.getInvoiceClients(req.db, {
      query: req.query.q || "",
      limit: parsePositiveInteger(req.query.limit, 100),
    });
    return res.status(200).json(payload);
  } catch (error) {
    return handleError(res, error, "Failed to load portal clients");
  }
};

exports.getItems = async (req, res) => {
  try {
    const payload = await invoicesService.getInvoiceItemCatalog(req.db, {
      query: req.query.q || "",
      limit: parsePositiveInteger(req.query.limit, 100),
    });
    return res.status(200).json(payload);
  } catch (error) {
    return handleError(res, error, "Failed to load portal items");
  }
};

exports.getItemById = async (req, res) => {
  try {
    const payload = await invoicesService.getInvoiceItemDetail(req.db, req.params.itemId);

    if (!payload) {
      return res.status(404).json({
        message: "Item not found",
      });
    }

    return res.status(200).json(payload);
  } catch (error) {
    return handleError(res, error, "Failed to load portal item details");
  }
};

exports.getStorages = async (req, res) => {
  try {
    const payload = await invoicesService.getInvoiceStorages(req.db);
    return res.status(200).json(payload);
  } catch (error) {
    return handleError(res, error, "Failed to load portal storages");
  }
};

exports.createInvoice = async (req, res) => {
  try {
    const payload = await invoicesService.createPortalInvoice(req.db, req.body, {
      userId: req.user?.user_id,
    });
    return res.status(201).json(payload);
  } catch (error) {
    return handleError(res, error, "Failed to save portal invoice");
  }
};

exports.shareInvoice = async (req, res) => {
  try {
    const payload = await invoicesService.sharePortalInvoice(
      req.db,
      req.params.invoiceNumber
    );
    return res.status(200).json(payload);
  } catch (error) {
    return handleError(res, error, "Failed to share portal invoice");
  }
};
