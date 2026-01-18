const invoiceService = require("../services/invoiceService");
const { buildReturnInvoiceXml, sendReturnToISTD, processReturnInvoice } = require("../einvoice_return");
const { buildEinvoiceXml, sendEinvoice, extractQR } = require("../einvoice");


// GET /api/invoices?limit=100&offset=0
const getInvoices = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    const invoices = await invoiceService.getInvoices(req.db,limit, offset);
    res.status(200).json(invoices);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({ message: "Error fetching invoices", error });
  }
};

// GET /api/invoices/:invoice_number
const getInvoiceDetails = async (req, res) => {
  try {
    const { invoice_number } = req.params;
    const details = await invoiceService.getInvoiceDetails(req.db,invoice_number);
    res.status(200).json(details);
  } catch (error) {
    console.error("Error fetching invoice details:", error);
    res.status(500).json({ message: "Error fetching invoice details", error });
  }
};


const getFullInvoice = async (req, res) => {
  try {
    const { invoice_number } = req.params;
    const invoice = await invoiceService.getFullInvoice(req.db,invoice_number);

    if (!invoice.header) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    res.status(200).json(invoice);
  } catch (error) {
    console.error("Error fetching full invoice:", error);
    res.status(500).json({ message: "Error fetching full invoice", error });
  }
};


const updateInvoiceHeader = async (req, res) => {
  try {
    const { invoice_number } = req.params;

const updated = await invoiceService.updateInvoiceHeader(req.db,{
  invoice_number,
  client: req.body.client,
  notes: req.body.notes,
  type2: req.body.type2,
  currency: req.body.currency,
  client_contact: req.body.client_contact,
  client_detail: req.body.client_detail,
  client_det_code: req.body.client_det_code,
  client_id: req.body.client_id,
  type: req.body.type,
  date: req.body.date
});

    if (!updated) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    res.status(200).json({ message: "Invoice updated successfully", updated });
  } catch (error) {
    console.error("Error updating invoice:", error);
    res.status(500).json({ message: "Error updating invoice", error });
  }
};


const getNextInvoiceNumber = async (req, res) => {
  try {
    const next = await invoiceService.getNextInvoiceNumber(req.db);
    res.status(200).json({ next_invoice_number: next });
  } catch (error) {
    console.error("Error getting next invoice number:", error);
    res.status(500).json({ message: "Error getting next invoice number", error });
  }
};

const createInvoice = async (req, res) => {
  try {
    const payload = req.body; // { invoice_number, date, pos, type, client, notes, lines: [...] }
    if (!payload?.invoice_number || !Array.isArray(payload?.lines)) {
      return res.status(400).json({ message: "invoice_number and lines are required" });
    }
    const created = await invoiceService.createInvoice(req.db,payload);
    res.status(201).json(created);
  } catch (error) {
    console.error("Error creating invoice:", error);
    res.status(500).json({ message: "Error creating invoice", error });
  }
};

const searchInvoices = async (req, res) => {
  try {
    const q = req.query.q || "";
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const results = await invoiceService.searchInvoices(req.db,q, limit, offset);
    res.status(200).json(results);
  } catch (error) {
    console.error("Error searching invoices:", error);
    res.status(500).json({ message: "Error searching invoices", error });
  }
};

const getCompany = async (req, res) => {
  try {
    const config = await invoiceService.getCompanyConfig(req.db);
    res.status(200).json(config || {});
  } catch (error) {
    console.error("Error fetching company config:", error);
    res.status(500).json({ message: "Error fetching company config", error });
  }
};

// POST /api/company
const saveCompany = async (req, res) => {
  try {
    const data = req.body;
    if (!data.company_name) {
      return res.status(400).json({ message: "company_name is required" });
    }

    const saved = await invoiceService.saveCompanyConfig(req.db,data);
    res.status(201).json(saved);
  } catch (error) {
    console.error("Error saving company config:", error);
    res.status(500).json({ message: "Error saving company config", error });
  }
};

const getDailyStats = async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split("T")[0];
    const stats = await invoiceService.getDailyStats(req.db,date);
    res.status(200).json(stats);
  } catch (error) {
    console.error("Error fetching daily stats:", error);
    res.status(500).json({ message: "Error fetching daily stats", error });
  }
};

const getHourlySales = async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split("T")[0];
    const sales = await invoiceService.getHourlySales(req.db,date);
    res.status(200).json(sales);
  } catch (error) {
    console.error("Error fetching hourly sales:", error);
    res.status(500).json({ message: "Error fetching hourly sales", error });
  }
};

const getInvoicesByDate = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    // ✅ ADD THESE HEADERS
    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
      "Surrogate-Control": "no-store"
    });

    const invoices = await invoiceService.getInvoicesByDate(req.db,date);
    res.status(200).json(invoices);
  } catch (error) {
    console.error("Error fetching invoices by date:", error);
    res.status(500).json({ message: "Error fetching invoices by date", error });
  }
};


const returnVoidInvoices = async (req, res) => {
  
  try {
    const { invoices } = req.body;
const company = await invoiceService.getCompanyConfig(req.db);

    if (!Array.isArray(invoices) || invoices.length === 0) {
      return res.status(400).json({ message: "No invoices provided." });
    }

    // Step 1 — Save void invoices (return invoice numbers generated here)
    const savedRows = await invoiceService.saveVoidInvoices(req.db,invoices);

    // Step 2 — For each saved void invoice, build the return XML
    for (const saved of savedRows) {
      const originalInvoiceNumber = saved.original_invoice_number;

      // Fetch header + lines
      const original = await invoiceService.getInvoiceForReturn(req.db,originalInvoiceNumber);

      const originalHeader = {
        invoice_number: original.header.invoice_number,
        uuid: original.header.uuid,
        total: original.header.total,
        date: original.header.date,
        type: original.header.type
      };

      const lines = original.lines;

      // Build return header
      const returnHeader = {
        return_invoice_number: saved.return_invoice_number,
        return_uuid: saved.return_uuid,
        date: saved.created_at
      };
  
      // Build XML (console.log(xml) happens inside the function)
      const xml = buildReturnInvoiceXml(returnHeader, originalHeader, lines, company);
      const sendResult = await sendReturnToISTD(xml);
      if (!sendResult.ok) {
  console.log("ISTD Return API Error:", sendResult.error);

  return res.status(400).json({
    message: "ISTD API Error",
    error: sendResult.error
  });
}


console.log("RETURN INVOICE SENT → STATUS:", sendResult.status);
await invoiceService.saveVoidInvoiceQR(
  req.db,
  saved.return_invoice_number,
  sendResult.qr
);



      // TODO next: encode → send → save QR
      console.log("Final Return XML:", xml);
      console.log("---------------------------------------------");
    }

    res.status(200).json({
      message: "Return invoices processed. XML printed in backend console.",
      saved: savedRows
    });

  } catch (error) {
    console.error("Error processing return invoices:", error);
    res.status(500).json({ message: "Error processing return invoices", error });
  }
};


const getVoidedInvoicesByDate = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    const invoices = await invoiceService.getVoidedInvoicesByDate(req.db,date);
    res.status(200).json(invoices);

  } catch (err) {
    console.error("Error fetching voided invoices:", err);
    res.status(500).json({ message: "Error fetching voided invoices", err });
  }
};

const getInvoiceForReturn = async (req, res) => {
  try {
    const { invoice_number } = req.params;

    const invoice = await invoiceService.getInvoiceForReturn(req.db,invoice_number);

    if (!invoice.header) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    res.status(200).json(invoice);
  } catch (error) {
    console.error("Error fetching invoice for return:", error);
    res.status(500).json({ message: "Error fetching invoice for return", error });
  }
};

const getUnsharedInvoices = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: "Date is required" });

    const rows = await invoiceService.getUnsharedInvoices(req.db,date);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching unshared invoices:", err);
    res.status(500).json({ message: "Error fetching unshared invoices" });
  }
};


const shareUnsharedInvoices = async (req, res) => {
  try {
    const { invoices } = req.body;

    if (!Array.isArray(invoices) || invoices.length === 0) {
      return res.status(400).json({ message: "No invoices provided" });
    }

    const results = [];

    for (const inv of invoices) {
      // Fetch header + lines
      const full = await invoiceService.getFullInvoice(req.db,inv);
      if (!full.header) {
        results.push({ invoice: inv, status: "NOT_FOUND" });
        continue;
      }

      const header = full.header;
      const lines = full.lines;

      // Convert into the format einvoice.js expects
      const invObj = {
        InvNumber: header.invoice_number,
        Date: header.date,
        Type: header.type === "cash" ? 1 : 2,
        Notes: header.notes || "",
        INVOICEUUID: header.uuid,
        HeaderTotal: Number(header.total),

        FileNo: "17925592",
        CompanyName: "Carnival Amusement & Entertainment Co.",
        INCOMESERIAL: "17925592",

        CUSTOMERNATIONALNO: "",
        CUSTOMERPOBOX: "",
        CUSTOMERPHONE: "",
        CustomerName: header.client || ""
      };

      const acts = lines.map(l => ({
        ItemNumber: l.item_number,
        Qty: Number(l.qty),
        LineTotal: Number(l.total), // including tax
        TaxVal: Number(l.tax) || 8,
        ItemDiscount: Number(l.discount) || 0,
        ItemName: l.description || "",
        ITEMNOTES: ""
      }));

      // ===== STEP 1: BUILD XML =====
      const xml = buildEinvoiceXml(invObj, acts);

      // ===== STEP 2: SEND TO TAX AUTH =====
      let apiResponse;
      try {
        apiResponse = await sendEinvoice(xml);
      } catch (err) {
        console.log("Error sending invoice:", err);
        results.push({
          invoice: inv,
          status: "SEND_FAILED",
          error: err.response?.data || err.message
        });
        continue;
      }

      // Full API response text (their JSON string)
      const responseText = JSON.stringify(apiResponse.data);

      // ===== STEP 3: EXTRACT QR =====
      const qr = extractQR(responseText);

      // ===== STEP 4: SAVE QR INTO DB =====
      if (qr) {
        await invoiceService.saveInvoiceQR(req.db,inv, qr);
      }

      results.push({
        invoice: inv,
        status: "SHARED",
        qr: qr || null,
        api_status: apiResponse.status
      });
    }

    return res.status(200).json({
      message: "All selected invoices processed",
      results
    });

  } catch (err) {
    console.error("Error sharing unshared invoices:", err);
    res.status(500).json({ message: "Backend error" });
  }
};

const getPosStats = async (req, res) => {
  try {
    const date = req.query.date;
    if (!date) return res.status(400).json({ message: "Date is required" });

    const rows = await invoiceService.getPosCounts(req.db,date);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching POS stats:", err);
    res.status(500).json({ message: "Error fetching POS stats" });
  }
};

const getLast7DaysIncome = async (req, res) => {
  try {
    const date = req.query.date;
    if (!date) return res.status(400).json({ message: "Date is required" });

    const rows = await invoiceService.getLast7DaysIncome(req.db,date);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching 7-day income:", err);
    res.status(500).json({ message: "Error fetching 7-day income" });
  }
};

const getAllClients = async (req, res) => {
  try {
    const clients = await invoiceService.getAllClients(req.db);
    res.status(200).json(clients);
  } catch (error) {
    console.error("Error fetching clients:", error);
    res.status(500).json({ message: "Error fetching clients" });
  }
};

const updateInvoiceFull = async (req, res) => {
  try {
    const { invoice_number } = req.params;
    const { header, lines } = req.body;

    if (!Array.isArray(lines)) {
      return res.status(400).json({ message: "Lines array is required" });
    }

    const updated = await invoiceService.updateInvoiceFull(
      req.db,
      invoice_number,
      header,
      lines
    );

    res.status(200).json(updated);
  } catch (error) {
    console.error("Error updating invoice fully:", error);
    res.status(500).json({ message: "Error updating invoice", error });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await invoiceService.getAllCategories(req.db);
    res.status(200).json(categories);
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).json({ message: "Error fetching categories" });
  }
};

const getItemsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const rows = await invoiceService.getItemsByCategory(req.db,categoryId);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching items:", err);
    res.status(500).json({ message: "Error fetching items" });
  }
};

const getFavoriteItems = async (req, res) => {
  try {
    const rows = await invoiceService.getFavoriteItems(req.db);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching favorite items:", err);
    res.status(500).json({ message: "Error fetching favorite items" });
  }
};

const toggleFavoriteItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const updated = await invoiceService.toggleFavoriteItem(req.db,itemId);
    res.status(200).json(updated);
  } catch (err) {
    console.error("Error toggling favorite:", err);
    res.status(500).json({ message: "Error toggling favorite" });
  }
};

// ================= UNITS CONTROLLERS =================

const getUnits = async (req, res) => {
  try {
    const rows = await invoiceService.getAllUnits(req.db);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching units:", err);
    res.status(500).json({ message: "Error fetching units" });
  }
};

const addUnit = async (req, res) => {
  try {
    const { name, description } = req.body;
    const row = await invoiceService.createUnit(req.db,{ name, description });
    res.status(201).json(row);
  } catch (err) {
    console.error("Error creating unit:", err);
    res.status(500).json({ message: "Error creating unit" });
  }
};

const editUnit = async (req, res) => {
  try {
    const { id } = req.params;
    const row = await invoiceService.updateUnit(req.db,id, req.body);
    res.status(200).json(row);
  } catch (err) {
    console.error("Error updating unit:", err);
    res.status(500).json({ message: "Error updating unit" });
  }
};

const addCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const row = await invoiceService.createCategory(req.db,{ name });
    res.status(201).json(row);
  } catch (err) {
    console.error("Error creating category:", err);
    res.status(500).json({ message: "Error creating category" });
  }
};

const editCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const row = await invoiceService.updateCategory(req.db,id, req.body);
    res.status(200).json(row);
  } catch (err) {
    console.error("Error updating category:", err);
    res.status(500).json({ message: "Error updating category" });
  }
};

const addItem = async (req, res) => {
  try {
    const newItem = await invoiceService.createItem(req.db,req.body);
    res.status(201).json(newItem);
  } catch (err) {
    console.error("Error adding item:", err);
    res.status(500).json({ message: "Error adding item" });
  }
};

const getItemById = async (req, res) => {
  try {
    const { itemId } = req.params;
    const row = await invoiceService.getItemById(req.db,itemId);

    if (!row) return res.status(404).json({ message: "Item not found" });

    res.status(200).json(row);
  } catch (err) {
    console.error("Error fetching item:", err);
    res.status(500).json({ message: "Error fetching item" });
  }
};

const updateItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const edited = await invoiceService.updateItem(req.db,itemId, req.body);

    res.status(200).json(edited);
  } catch (err) {
    console.error("Error updating item:", err);
    res.status(500).json({ message: "Error updating item" });
  }
};

const getStorages = async (req, res) => {
  try {
    const rows = await invoiceService.getAllStorages(req.db);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching storages:", err);
    res.status(500).json({ message: "Error fetching storages" });
  }
};

const addStorage = async (req, res) => {
  try {
    const { name } = req.body;
    const row = await invoiceService.createStorage(req.db,{ name });
    res.status(201).json(row);
  } catch (err) {
    console.error("Error creating storage:", err);
    res.status(500).json({ message: "Error creating storage" });
  }
};

const editStorage = async (req, res) => {
  try {
    const { id } = req.params;
    const row = await invoiceService.updateStorage(req.db,id, req.body);
    res.status(200).json(row);
  } catch (err) {
    console.error("Error updating storage:", err);
    res.status(500).json({ message: "Error updating storage" });
  }
};

const getStorageOverview = async (req, res) => {
  try {
    const rows = await invoiceService.getStorageOverview(req.db);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Error fetching storage overview" });
  }
};

const getStorageItems = async (req, res) => {
  try {
    const rows = await invoiceService.getStorageItems(req.db,req.params.id);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Error fetching storage items" });
  }
};

const getStorageLogs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const dateFrom = req.query.date_from || null;
    const dateTo = req.query.date_to || null;

    const rows = await invoiceService.getStorageLogs(
      req.db,{
      limit,
      offset,
      dateFrom,
      dateTo
    });

    res.json(rows);
  } catch (err) {
    console.error("Error fetching storage logs:", err);
    res.status(500).json({ message: "Error fetching storage logs" });
  }
};

const adjustStorageManually = async (req, res) => {
  try {
    await invoiceService.adjustStorageManually(req.db,req.body);
    res.status(200).json({ message: "Stock adjusted successfully" });
  } catch (err) {
    console.error("Storage adjust error:", err);
    res.status(500).json({ message: err.message });
  }
};

const getAllItems = async (req, res) => {
  try {
    const rows = await invoiceService.getAllItems(req.db);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching all items:", err);
    res.status(500).json({ message: "Error fetching items" });
  }
};

const createClient = async (req, res) => {
  try {
    if (!req.body.name) {
      return res.status(400).json({ message: "Client name is required" });
    }

    const client = await invoiceService.createClient(req.db,req.body);
    res.status(201).json(client);
  } catch (err) {
    console.error("Error creating client:", err);
    res.status(500).json({ message: "Error creating client" });
  }
};

const updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await invoiceService.updateClient(req.db,id, req.body);

    if (!updated) {
      return res.status(404).json({ message: "Client not found" });
    }

    res.status(200).json(updated);
  } catch (err) {
    console.error("Error updating client:", err);
    res.status(500).json({ message: "Error updating client" });
  }
};

const deleteClient = async (req, res) => {
  try {
    const { id } = req.params;
    await invoiceService.deleteClient(req.db,id);
    res.status(204).end();
  } catch (err) {
    console.error("Error deleting client:", err);
    res.status(500).json({ message: "Error deleting client" });
  }
};

const getClientById = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await invoiceService.getClientById(req.db,id);

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    res.status(200).json(client);
  } catch (err) {
    console.error("Error fetching client:", err);
    res.status(500).json({ message: "Error fetching client" });
  }
};

const getClientMonthlyTotals = async (req, res) => {
  try {
    const clientId = parseInt(req.params.id, 10);
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();

    if (Number.isNaN(clientId)) {
      return res.status(400).json({ message: "Invalid client id" });
    }

    const rows = await invoiceService.getClientMonthlyTotals(req.db,clientId, year);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching client monthly totals:", err);
    res.status(500).json({ message: "Error fetching client monthly totals" });
  }
};

const getClientMonthlySalesCount = async (req, res) => {
  try {
    const clientId = parseInt(req.params.id, 10);
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();

    if (Number.isNaN(clientId)) {
      return res.status(400).json({ message: "Invalid client id" });
    }

    const rows = await invoiceService.getClientMonthlySalesCount(req.db,clientId, year);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching client monthly sales count:", err);
    res.status(500).json({ message: "Error fetching client monthly sales count" });
  }
};

const getClientLastInvoices = async (req, res) => {
  try {
    const clientId = parseInt(req.params.id, 10);
    const limit = parseInt(req.query.limit, 10) || 10;

    if (Number.isNaN(clientId)) {
      return res.status(400).json({ message: "Invalid client id" });
    }

    const rows = await invoiceService.getClientLastInvoices(req.db,clientId, limit);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching client last invoices:", err);
    res.status(500).json({ message: "Error fetching client last invoices" });
  }
};

const getClientInvoicesByDateRange = async (req, res) => {
  try {
    const clientId = parseInt(req.params.id, 10);
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({ message: "from and to are required" });
    }

    const rows = await invoiceService.getClientInvoicesByDateRange(
      req.db,
      clientId,
      from,
      to
    );

    res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching client history:", err);
    res.status(500).json({ message: "Error fetching client history" });
  }
};

const searchItemsGlobal = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();

    if (q.length < 2) {
      return res.status(200).json([]);
    }

    const rows = await invoiceService.searchItemsGlobal(req.db,q);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Item search error:", err);
    res.status(500).json({ message: "Error searching items" });
  }
};

// ===== REFUND CONTROLLERS =====

// GET /api/invoices/refunds/next-number
const getNextRefundInvoiceNumber = async (req, res) => {
  try {
    const next = await invoiceService.getNextRefundInvoiceNumber(req.db);
    res.status(200).json({ next_refund_invoice_number: next });
  } catch (err) {
    console.error("Error getting next refund number:", err);
    res.status(500).json({ message: "Error getting next refund number" });
  }
};

// GET /api/invoices/refunds/summary/:invoice_number
const getRefundSummaryForOriginal = async (req, res) => {
  try {
    const { invoice_number } = req.params;
    const rows = await invoiceService.getRefundSummaryForOriginal(req.db,invoice_number);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error getting refund summary:", err);
    res.status(500).json({ message: "Error getting refund summary" });
  }
};
 
// POST /api/invoices/refunds
const createRefundInvoice = async (req, res) => {
  try {
    const {
      original_invoice_number,
        refund_date,
      refund_reason,
      lines,
      return_to_storage // ✅ RECEIVE IT
    } = req.body;

    const refundDate =
  refund_date && !Number.isNaN(Date.parse(refund_date))
    ? refund_date
    : new Date().toISOString().slice(0, 10);

    if (!original_invoice_number || !refund_reason || !Array.isArray(lines)) {
      return res.status(400).json({
        message: "original_invoice_number, refund_reason, and lines are required"
      });
    }

    const created = await invoiceService.createRefundInvoice(req.db,{
      original_invoice_number,
      refund_date: refundDate,
      refund_reason,
      lines,
      return_to_storage // ✅ FORWARD IT
    });

    res.status(201).json(created);
  } catch (err) {
    console.error("Error creating refund invoice:", err);
    res.status(400).json({
      message: err.message || "Error creating refund invoice"
    });
  }
};

// GET /api/invoices/refunds/full/:refund_invoice_number
const getRefundFullInvoice = async (req, res) => {
  try {
    const { refund_invoice_number } = req.params;
    const data = await invoiceService.getRefundFullInvoice(req.db,refund_invoice_number);

    if (!data?.header) {
      return res.status(404).json({ message: "Refund invoice not found" });
    }

    res.status(200).json(data);
  } catch (err) {
    console.error("Error fetching refund invoice:", err);
    res.status(500).json({ message: "Error fetching refund invoice" });
  }
};

// GET /api/invoices/refunds
const getRefundInvoices = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const rows = await invoiceService.getRefundInvoices(req.db,limit, offset);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching refund invoices:", err);
    res.status(500).json({ message: "Error fetching refund invoices" });
  }
};

const shareSingleInvoice = async (req, res) => {

  const company = await invoiceService.getCompanyConfig(req.db);

  if (!company) {
    return res.status(500).json({
      message: "Company configuration not found"
    });
  }

  try {
    const { invoice_number } = req.params;

    // 1) Fetch full invoice
    const full = await invoiceService.getFullInvoice(req.db,invoice_number);
    if (!full?.header) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const header = full.header;
    const lines = full.lines;

    // 2) Map to einvoice format (SAME as test_einvoice.js)
    const invObj = {
      InvNumber: header.invoice_number,
      Date: header.date,
      Type: header.type,         // "cash" | "credit"
      Type2: header.type2,       // "local" | "export" | "development"
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

    const acts = lines.map(l => ({
      ItemNumber: l.item_number,
      Qty: Number(l.qty),
      LineTotal: Number(l.total),
      TaxVal:
      l.tax === null || l.tax === undefined || Number.isNaN(Number(l.tax))
        ? 8
        : Number(l.tax),
      ItemDiscount: Number(l.discount_percentage) || 0,
      OriginalPrice: Number(l.item_price),
      ItemName: l.description,
      ITEMNOTES: "",
      Exempt: l.exempt === true  
    }));

    // 3) Build XML
    const xml = buildEinvoiceXml(invObj, acts, company);
    if (!xml) {
      return res.status(400).json({ message: "XML generation failed" });
    }

    console.log("\n================= E-INVOICE XML =================");
    console.log(xml);
    console.log("================================================\n");
    // 4) Send to ISTD
   const response = await sendEinvoice(xml, company);

    // 5) Extract QR
    const qr = extractQR(JSON.stringify(response.data));
     if (!qr) {
      return res.status(400).json({ message: "No QR returned from ISTD" });
     }

    // 6) Save QR
     await invoiceService.saveInvoiceQR(req.db,invoice_number, qr);

    return res.status(200).json({
      message: "Invoice shared successfully",
     qr,
      api_status: response.status
    });

} catch (err) {
  console.error("Share invoice error:", err);

  // Axios error from ISTD
  if (err.response) {
    return res.status(err.response.status).json({
      success: false,
      source: "ISTD",
      status: err.response.status,
      message:
        err.response.data && Object.keys(err.response.data).length
          ? err.response.data
          : "ISTD rejected the invoice request",
      headers: err.response.headers || null
    });
  }

  // Network / timeout error
  if (err.request) {
    return res.status(502).json({
      success: false,
      source: "ISTD",
      status: 502,
      message: "No response from ISTD servers"
    });
  }

  // Internal error
  return res.status(500).json({
    success: false,
    source: "SYSTEM",
    message: err.message || "Unexpected error while sharing invoice"
  });
}
};

const shareRefundInvoice = async (req, res) => {

    const company = await invoiceService.getCompanyConfig(req.db);

  if (!company) {
    return res.status(500).json({
      message: "Company configuration not found"
    });
  }
  try {
    const { refund_invoice_number } = req.params;

    // 1) Get refund + merged original lines (your service already returns joined data)
    const full = await invoiceService.getRefundFullInvoice(req.db,refund_invoice_number);
    if (!full?.header) {
      return res.status(404).json({ message: "Refund invoice not found" });
    }

    // 2) If already shared, block
    const DEFAULT_QR = "123456789";
    if (full.header.qr && full.header.qr !== DEFAULT_QR) {
      return res.status(400).json({ message: "Refund invoice already shared" });
    }

    // 3) Get original header (needed in XML billing reference)
    const original = await invoiceService.getFullInvoice(req.db,full.header.original_invoice_number);
    if (!original?.header) {
      return res.status(404).json({ message: "Original invoice not found" });
    }

    // 4) Map refund header + original header + refund lines to return-einvoice format
    const returnHeader = {
      return_invoice_number: full.header.refund_invoice_number,
      return_uuid: full.header.refund_uuid,
      date: full.header.refund_date,
      refund_reason: full.header.refund_reason,
      total: full.header.total
    };

    const originalHeader = {
      invoice_number: original.header.invoice_number,
      uuid: original.header.uuid,
      total: original.header.total,
      date: original.header.date,
      type: original.header.type,     // cash | credit
      type2: original.header.type2,
      currency: original.header.currency,
    };

    const lines = (full.lines || []).map(l => ({
      item_number: l.item_number,
      qty: Number(l.refund_qty),
      price: Number(l.item_price),
      tax: Number(l.tax),
      discount_percentage: Number(l.discount_percentage) || 0,
      item_name: l.description
    }));

    if (lines.length === 0) {
      return res.status(400).json({ message: "Refund invoice has no lines" });
    }

    // 5) Load company config (Client-Id / Secret-Key)
    const cfg = await invoiceService.getCompanyConfig(req.db);
    if (!cfg?.client_id || !cfg?.secret_key) {
      return res.status(400).json({ message: "Company config missing client_id/secret_key" });
    }

    // 6) Send to ISTD
    const result = await processReturnInvoice(returnHeader, originalHeader, lines, cfg, company);

    if (!result.ok) {
        console.log("ISTD ERROR RESPONSE:", result.error);

      return res.status(400).json({
        message: "Refund sharing failed",
        error: result.error
      });
    }

    if (!result.qr) {
      return res.status(400).json({
        message: "No QR returned from ISTD",
        api_status: result.status
      });
    }

    // 7) Save QR on refund header
    await invoiceService.saveRefundInvoiceQR(req.db,refund_invoice_number, result.qr);

    return res.status(200).json({
      message: "Refund invoice shared successfully",
      qr: result.qr,
      api_status: result.status
    });

  } catch (err) {
    console.error("Share refund invoice error:", err);
    return res.status(500).json({
      message: "Failed to share refund invoice",
      error: err.response?.data || err.message
    });
  }
};

const getInvoicesByDateRange = async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) {
      return res.status(400).json({ message: "from and to are required" });
    }

    const rows = await invoiceService.getInvoicesByDateRange(req.db,from, to);
    res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch invoices" });
  }
};

const uploadCompanyLogoController = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    await invoiceService.uploadCompanyLogo(req.db,req.file);
    res.status(200).json({ message: "Logo uploaded successfully" });

  } catch (err) {
    console.error("Logo upload error:", err);
    res.status(500).json({ message: "Logo upload failed" });
  }
};

// ======================
// Reports
// ======================

const getGeneralSalesReport = async (req, res) => {
  try {
    const {
      from,
      to,
      limit = 100,
      offset = 0
    } = req.query;

    if (!from || !to) {
      return res.status(400).json({ message: "from and to are required" });
    }

    const result = await invoiceService.getGeneralSalesReport(req.db,{
      from,
      to,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.status(200).json(result);
  } catch (err) {
    console.error("General sales report error:", err);
    res.status(500).json({
      message: "Failed to fetch general sales report"
    });
  }
};

const getSalesByAreaReport = async (req, res) => {
  try {
    const {
      from,
      to,
      area,
      limit = 100,
      offset = 0
    } = req.query;

    if (!from || !to || !area) {
      return res.status(400).json({
        message: "from, to and area are required"
      });
    }

    if (!["local", "export", "development"].includes(area)) {
      return res.status(400).json({
        message: "Invalid area"
      });
    }

    const result = await invoiceService.getSalesByAreaReport(req.db,{
      from,
      to,
      area,
      limit: Number(limit),
      offset: Number(offset)
    });

    res.status(200).json(result);
  } catch (err) {
    console.error("Sales by area report error:", err);
    res.status(500).json({
      message: "Failed to fetch sales by area report"
    });
  }
};


const getSalesByClientReport = async (req, res) => {
  try {
    const {
      from,
      to,
      client_id,
      limit = 100,
      offset = 0
    } = req.query;

    if (!from || !to || !client_id) {
      return res.status(400).json({
        message: "from, to and client_id are required"
      });
    }

    const result = await invoiceService.getSalesByClientReport(req.db,{
      from,
      to,
      client_id: parseInt(client_id),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.status(200).json(result);
  } catch (err) {
    console.error("Sales by client report error:", err);
    res.status(500).json({
      message: "Failed to fetch sales by client report"
    });
  }
};

const getEinvoicingReport = async (req, res) => {
  try {
    const {
      from,
      to,
      status,
      limit = 100,
      offset = 0
    } = req.query;

    if (!from || !to || !status) {
      return res.status(400).json({
        message: "from, to and status are required"
      });
    }

    if (!["shared", "unshared"].includes(status)) {
      return res.status(400).json({
        message: "status must be shared or unshared"
      });
    }

    const result = await invoiceService.getEinvoicingReport(req.db,{
      from,
      to,
      status,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.status(200).json(result);
  } catch (err) {
    console.error("E-invoicing report error:", err);
    res.status(500).json({
      message: "Failed to fetch e-invoicing report"
    });
  }
};

const getTaxDeclarationReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) {
      return res.status(400).json({ message: "from and to required" });
    }

    const data = await invoiceService.getTaxDeclarationReport(req.db,{ from, to });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load tax declaration report" });
  }
};

const getRefundsReport = async (req, res) => {
  const { from, to, limit = 100, offset = 0 } = req.query;
  if (!from || !to) {
    return res.status(400).json({ message: "from and to required" });
  }

  const data = await invoiceService.getRefundsReport(req.db,{
    from,
    to,
    limit: Number(limit),
    offset: Number(offset)
  });

  res.json(data);
};

const getRefundsByClientReport = async (req, res) => {
  const { from, to, client_id, limit = 100, offset = 0 } = req.query;
  if (!from || !to || !client_id) {
    return res.status(400).json({ message: "from, to, client_id required" });
  }

  const data = await invoiceService.getRefundsByClientReport(req.db,{
    client_id: Number(client_id),
    from,
    to,
    limit: Number(limit),
    offset: Number(offset)
  });

  res.json(data);
};

const getItemsSalesReport = async (req, res) => {
  try {
    const { from, to, limit = 100, offset = 0 } = req.query;

    if (!from || !to) {
      return res.status(400).json({ message: "from and to are required" });
    }

    const data = await invoiceService.getItemsSalesReport(req.db,{
      from,
      to,
      limit: Number(limit),
      offset: Number(offset)
    });

    res.json(data);
  } catch (err) {
    console.error("Items sales report error:", err);
    res.status(500).json({ message: "Failed to fetch items sales report" });
  }
};

const getItemSalesDetailsReport = async (req, res) => {
  try {
    const {
      item_id,
      from,
      to,
      limit = 100,
      offset = 0
    } = req.query;

    if (!item_id || !from || !to) {
      return res.status(400).json({
        message: "item_id, from, and to are required"
      });
    }

    const data = await invoiceService.getItemSalesDetailsReport(req.db,{
      item_id: Number(item_id),
      from,
      to,
      limit: Number(limit),
      offset: Number(offset)
    });

    res.json(data);
  } catch (err) {
    console.error("Item sales details report error:", err);
    res.status(500).json({ message: "Failed to fetch item sales report" });
  }
};

const getStorageInventoryReport = async (req, res) => {
  try {
    const { storage_id } = req.query;

    if (!storage_id) {
      return res.status(400).json({ message: "storage_id is required" });
    }

    const data = await invoiceService.getStorageInventoryReport(req.db,{
      storage_id
    });

    res.json(data);
  } catch (err) {
    console.error("Storage inventory report error:", err);
    res.status(500).json({ message: "Failed to fetch storage inventory report" });
  }
};

const getTransactionsReport = async (req, res) => {
  try {
    const {
      from,
      to,
      item_id,
      storage_id,
      direction = "BOTH",
      limit = 100,
      offset = 0
    } = req.query;

    if (!from || !to) {
      return res.status(400).json({ message: "from and to are required" });
    }

    const rows = await invoiceService.getTransactionLogsReport(req.db,{
      from,
      to,
      item_id: item_id ? Number(item_id) : null,
      storage_id: storage_id ? Number(storage_id) : null,
      direction,
      limit: Number(limit),
      offset: Number(offset)
    });

    res.json(rows);
  } catch (err) {
    console.error("Transactions report error:", err);
    res.status(500).json({ message: "Failed to fetch transactions report" });
  }
};

// ====== Dashboard ======
const getDashboardKpis = async (req, res) => {
  try {
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();
    const data = await invoiceService.getDashboardKpis(req.db,year);
    res.json(data);
  } catch (err) {
    console.error("Dashboard KPI error:", err);
    res.status(500).json({ message: "Failed to fetch dashboard KPIs" });
  }
};

const getDashboardOverview = async (req, res) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();
    const result = await invoiceService.getDashboardOverview(req.db,year);
    return res.status(200).json(result);
  } catch (err) {
    console.error("getDashboardOverview error:", err);
    return res.status(500).json({
      message: "Failed to fetch dashboard overview",
      error: err.message
    });
  }
};

const getDashboardSales = async (req, res) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();
    const result = await invoiceService.getDashboardSales(req.db,year);
    return res.status(200).json(result);
  } catch (err) {
    console.error("getDashboardSales error:", err);
    return res.status(500).json({
      message: "Failed to fetch dashboard sales",
      error: err.message
    });
  }
};

const getDashboardInventory = async (req, res) => {
  const year = Number(req.query.year);
  if (!year) return res.status(400).json({ message: "Year required" });

  try {
    const data = await invoiceService.getDashboardInventory(req.db,year);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load inventory dashboard" });
  }
};

const getDashboardClients = async (req, res) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();
    const data = await invoiceService.getDashboardClients(req.db,year);
    res.json(data);
  } catch (err) {
    console.error("Dashboard clients error:", err);
    res.status(500).json({ message: "Failed to fetch clients dashboard" });
  }
};

module.exports = {
  getInvoices,
  getInvoiceDetails,
  getFullInvoice,
  updateInvoiceHeader,
  createInvoice,
  getNextInvoiceNumber, 
  searchInvoices,
  getCompany,
  saveCompany,
  getDailyStats,
  getHourlySales,
  getInvoicesByDate,
  returnVoidInvoices,
  getVoidedInvoicesByDate,
  getInvoiceForReturn,
  shareUnsharedInvoices,
  getUnsharedInvoices,
  getPosStats,
  getLast7DaysIncome,
  getAllClients,
  updateInvoiceFull,
  getCategories,
  getItemsByCategory,
  getFavoriteItems,
  toggleFavoriteItem,
  getUnits,
  addUnit,
  editUnit,
  addCategory,
  editCategory,
  addItem,
  getItemById,
  updateItem,
  getStorages,
  addStorage,
  editStorage,
  getStorageOverview,
  getStorageItems,
  getStorageLogs,
  adjustStorageManually,
  getAllItems,
  createClient,
  updateClient,
  deleteClient,
  getClientById,
  getClientMonthlyTotals,
  getClientMonthlySalesCount,
  getClientLastInvoices,
  getClientInvoicesByDateRange,
  searchItemsGlobal,
  getNextRefundInvoiceNumber,
  getRefundSummaryForOriginal,
  createRefundInvoice,
  getRefundFullInvoice,
  getRefundInvoices,
  shareSingleInvoice,
  shareRefundInvoice,
  getInvoicesByDateRange,
  uploadCompanyLogoController,
  getGeneralSalesReport,
  getSalesByAreaReport,
  getSalesByClientReport,
  getEinvoicingReport,
  getTaxDeclarationReport,
  getRefundsReport,
  getRefundsByClientReport,
  getItemsSalesReport,
  getItemSalesDetailsReport,
  getStorageInventoryReport,
  getTransactionsReport,
  getDashboardKpis,
  getDashboardOverview,
  getDashboardSales,
  getDashboardInventory,
  getDashboardClients
};
