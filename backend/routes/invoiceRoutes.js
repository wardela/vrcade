const express = require("express");
const router = express.Router();
const invoiceController = require("../controllers/invoiceController");
const { uploadLogoMemory } = require("../middleware/upload");
const { authMiddleware } = require("../middleware/authMiddleware");
const tenantDb = require("../middleware/tenantDb");

router.use(authMiddleware);
router.use(tenantDb);


router.get("/company", invoiceController.getCompany);
router.post("/company", invoiceController.saveCompany);
router.post("/company/logo", uploadLogoMemory.single("logo"), invoiceController.uploadCompanyLogoController);


router.get("/return-full/:invoice_number", invoiceController.getInvoiceForReturn);

router.get("/next-number", invoiceController.getNextInvoiceNumber);
router.get("/by-date", invoiceController.getInvoicesByDate);
router.get("/voided-by-date", invoiceController.getVoidedInvoicesByDate);
router.post("/void-return", invoiceController.returnVoidInvoices);
router.get("/by-range", invoiceController.getInvoicesByDateRange);

router.post("/share/:invoice_number", invoiceController.shareSingleInvoice);
router.post("/refunds/share/:refund_invoice_number", invoiceController.shareRefundInvoice);

// ===== Refund Invoices =====
router.get("/refunds/next-number", invoiceController.getNextRefundInvoiceNumber);
router.get("/refunds/summary/:invoice_number", invoiceController.getRefundSummaryForOriginal);
router.post("/refunds", invoiceController.createRefundInvoice);
router.get("/refunds/full/:refund_invoice_number", invoiceController.getRefundFullInvoice);
router.get("/refunds", invoiceController.getRefundInvoices);

// Due balances
router.post("/due-balances", invoiceController.createDueBalance);
router.put("/due-balances/:id", invoiceController.updateDueBalance);
router.delete("/due-balances/:id", invoiceController.deleteDueBalance);
router.get("/due-balances/:id", invoiceController.getDueBalanceById);

// Receipt vouchers
router.post("/receipt-vouchers", invoiceController.createReceiptVoucher);
router.put("/receipt-vouchers/:id", invoiceController.updateReceiptVoucher);
router.delete("/receipt-vouchers/:id", invoiceController.deleteReceiptVoucher);

// Receipt cheques
router.post("/receipt-cheques", invoiceController.createReceiptCheque);
router.put("/receipt-cheques/:id", invoiceController.updateReceiptCheque);
router.delete("/receipt-cheques/:id", invoiceController.deleteReceiptCheque);

// Due balances (GET with pagination & filters)
router.get("/due-balances", invoiceController.getDueBalances);

// Receipt vouchers by due balance
router.get("/due-balances/:due_balance_id/receipt-vouchers", invoiceController.getReceiptVouchersByDueBalance);

// Receipt voucher details
router.get("/receipt-vouchers/:id", invoiceController.getReceiptVoucherDetails);

router.post("/receipts/standalone", invoiceController.createStandaloneReceipt);

router.get("/receipts/totals", invoiceController.getClientReceiptsTotals);

router.get("/stats/dashboard-receipts", invoiceController.getReceiptsDashboard);

router.get("/reports/receipts/by-client", invoiceController.getClientReceiptsReport);

router.get("/due-balances/:id/print", invoiceController.getPrintableDueBalance);

// ✅ ADD THESE
router.get("/stats/daily", invoiceController.getDailyStats);
router.get("/stats/hourly", invoiceController.getHourlySales);
router.get("/stats/pos", invoiceController.getPosStats);
router.get("/stats/last7days", invoiceController.getLast7DaysIncome)
router.get("/items/search", invoiceController.searchItemsGlobal);

// other routes
router.get("/", invoiceController.getInvoices);
router.get("/search", invoiceController.searchInvoices);
router.get("/full/:invoice_number", invoiceController.getFullInvoice);
router.post("/", invoiceController.createInvoice);
router.put("/:invoice_number", invoiceController.updateInvoiceFull);

router.get("/categories", invoiceController.getCategories);
router.get("/categories/:categoryId/items", invoiceController.getItemsByCategory);
router.post("/categories", invoiceController.addCategory);
router.put("/categories/:id", invoiceController.editCategory);
router.get("/items/favorites", invoiceController.getFavoriteItems);
router.patch("/items/:itemId/toggle-fav", invoiceController.toggleFavoriteItem);
router.post("/items", invoiceController.addItem);
router.get("/items/:itemId", invoiceController.getItemById);
router.put("/items/:itemId", invoiceController.updateItem);

router.get("/storages", invoiceController.getStorages);
router.post("/storages", invoiceController.addStorage);
router.put("/storages/:id", invoiceController.editStorage);

router.post("/storage-adjust", invoiceController.adjustStorageManually);
router.delete("/storage-monitor/transaction/:id", invoiceController.deleteStorageTransaction);
router.get("/items", invoiceController.getAllItems);

router.get("/storage-monitor/overview", invoiceController.getStorageOverview);
router.get("/storage-monitor/:id/items", invoiceController.getStorageItems);
router.get("/storage-monitor/logs", invoiceController.getStorageLogs);

router.get("/units", invoiceController.getUnits);
router.post("/units", invoiceController.addUnit);
router.put("/units/:id", invoiceController.editUnit);

router.get("/unshared", invoiceController.getUnsharedInvoices);
router.post("/share-unshared", invoiceController.shareUnsharedInvoices);

router.get("/clients", invoiceController.getAllClients);
router.get("/clients/:id", invoiceController.getClientById);
router.get("/stats/client/:id/monthly", invoiceController.getClientMonthlyTotals);
router.get("/stats/client/:id/monthly-count", invoiceController.getClientMonthlySalesCount);
router.get("/stats/client/:id/last-invoices", invoiceController.getClientLastInvoices);
router.get("/clients/:id/history", invoiceController.getClientInvoicesByDateRange);
router.post("/clients", invoiceController.createClient);
router.put("/clients/:id", invoiceController.updateClient);
router.delete("/clients/:id", invoiceController.deleteClient);

// ========= Reports =========
router.get("/reports/sales/general", invoiceController.getGeneralSalesReport);
router.get("/reports/sales/by-client", invoiceController.getSalesByClientReport);
router.get("/reports/sales/by-area", invoiceController.getSalesByAreaReport);
router.get("/reports/sales/by-client-detailed", invoiceController.getSalesByClientDetailedReport);
router.get("/reports/sales/items-by-client-totals", invoiceController.getItemsSoldForClientTotals);
router.get("/reports/einvoicing", invoiceController.getEinvoicingReport);
router.get("/reports/einvoicing/tax-declaration", invoiceController.getTaxDeclarationReport);
router.get("/reports/refunds/general", invoiceController.getRefundsReport);
router.get("/reports/refunds/by-client", invoiceController.getRefundsByClientReport);
router.get("/reports/items/sales", invoiceController.getItemsSalesReport);
router.get("/reports/items/sales/details", invoiceController.getItemSalesDetailsReport);
router.get("/reports/storage/inventory", invoiceController.getStorageInventoryReport);
router.get("/reports/storage/transactions", invoiceController.getTransactionsReport);

// ======== Dashboard =========
router.get("/stats/dashboard-kpis", invoiceController.getDashboardKpis);
router.get("/stats/dashboard-overview", invoiceController.getDashboardOverview);
router.get("/stats/dashboard-sales", invoiceController.getDashboardSales);
router.get("/stats/dashboard-inventory", invoiceController.getDashboardInventory);
router.get("/stats/dashboard-clients", invoiceController.getDashboardClients);

module.exports = router;
