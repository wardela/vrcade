const express = require("express");
const authController = require("../controllers/authController");
const dashboardController = require("../controllers/dashboardController");
const invoicesController = require("../controllers/invoicesController");
const posMonitorController = require("../controllers/posMonitorController");
const reportsController = require("../controllers/reportsController");
const statisticsController = require("../controllers/statisticsController");
const { requireModulePermission } = require("../middleware/requireModulePermission");

const router = express.Router();

router.get("/session", authController.me);
router.get("/dashboard", dashboardController.getDashboard);
router.get("/statistics", statisticsController.getStatistics);
router.get(
  "/invoices/company",
  requireModulePermission("sales", "view"),
  invoicesController.getCompany
);
router.get(
  "/invoices/next-number",
  requireModulePermission("sales", "add"),
  invoicesController.getNextInvoiceNumber
);
router.get(
  "/invoices/clients",
  requireModulePermission("sales", "view"),
  invoicesController.getClients
);
router.get(
  "/invoices/items",
  requireModulePermission("sales", "view"),
  invoicesController.getItems
);
router.get(
  "/invoices/items/:itemId",
  requireModulePermission("sales", "view"),
  invoicesController.getItemById
);
router.get(
  "/invoices/storages",
  requireModulePermission("sales", "view"),
  invoicesController.getStorages
);
router.post(
  "/invoices",
  requireModulePermission("sales", "add"),
  invoicesController.createInvoice
);
router.post(
  "/invoices/:invoiceNumber/share",
  requireModulePermission("einvoicing", "view"),
  invoicesController.shareInvoice
);
router.get(
  "/invoices",
  requireModulePermission("sales", "view"),
  invoicesController.listInvoices
);
router.get(
  "/invoices/:invoiceNumber",
  requireModulePermission("sales", "view"),
  invoicesController.getInvoiceDetail
);
router.get(
  "/monitoring/pos/company",
  requireModulePermission("pos", "view"),
  posMonitorController.getCompany
);
router.get(
  "/monitoring/pos/overview",
  requireModulePermission("pos", "view"),
  posMonitorController.getOverview
);
router.get(
  "/monitoring/pos/sessions/active",
  requireModulePermission("pos", "view"),
  posMonitorController.getActiveSessions
);
router.get(
  "/monitoring/pos/sessions/aggregate-summary",
  requireModulePermission("pos", "view"),
  posMonitorController.getAggregateSummary
);
router.get(
  "/monitoring/pos/sessions/:id/detail",
  requireModulePermission("pos", "view"),
  posMonitorController.getSessionDetail
);
router.get(
  "/monitoring/pos/sessions/:id/summary",
  requireModulePermission("pos", "view"),
  posMonitorController.getSessionSummary
);
router.post(
  "/monitoring/pos/sessions/:id/force-close",
  requireModulePermission("pos", "edit"),
  posMonitorController.forceCloseSession
);
router.get(
  "/monitoring/pos/points/:id",
  requireModulePermission("pos", "view"),
  posMonitorController.getPosPoint
);
router.get(
  "/monitoring/pos/points/:id/sessions",
  requireModulePermission("pos", "view"),
  posMonitorController.getPosPointSessions
);
router.post(
  "/monitoring/pos/points",
  requireModulePermission("pos", "add"),
  posMonitorController.createPosPoint
);
router.put(
  "/monitoring/pos/points/:id",
  requireModulePermission("pos", "edit"),
  posMonitorController.updatePosPoint
);
router.get("/reports/company", reportsController.getCompany);
router.get("/reports/clients", reportsController.getClients);
router.get("/reports/items", reportsController.getItems);
router.get("/reports/storages", reportsController.getStorages);
router.get("/reports/sales/general", reportsController.getGeneralSalesReport);
router.get("/reports/sales/by-client", reportsController.getSalesByClientReport);
router.get("/reports/sales/by-area", reportsController.getSalesByAreaReport);
router.get(
  "/reports/sales/by-client-detailed",
  reportsController.getSalesByClientDetailedReport
);
router.get(
  "/reports/sales/items-by-client-totals",
  reportsController.getItemsSoldForClientTotals
);
router.get(
  "/reports/sales/sales-refunds-combined",
  reportsController.getSalesRefundsCombinedReport
);
router.get(
  "/reports/sales/sales-refunds-combined-by-client",
  reportsController.getSalesRefundsCombinedByClientReport
);
router.get("/reports/payment-types/totals", reportsController.getPaymentTypeTotalsReport);
router.get(
  "/reports/payment-types/detailed",
  reportsController.getPaymentTypeDetailedReport
);
router.get("/reports/einvoicing", reportsController.getEinvoicingReport);
router.get(
  "/reports/einvoicing/tax-declaration",
  reportsController.getTaxDeclarationReport
);
router.get(
  "/reports/einvoicing/invoice-tax-summary",
  reportsController.getInvoiceTaxSummaryReport
);
router.get("/reports/refunds/general", reportsController.getRefundsReport);
router.get("/reports/refunds/by-client", reportsController.getRefundsByClientReport);
router.get("/reports/items/sales", reportsController.getItemsSalesReport);
router.get("/reports/items/sales/details", reportsController.getItemSalesDetailsReport);
router.get("/reports/storage/inventory", reportsController.getStorageInventoryReport);
router.get("/reports/storage/transactions", reportsController.getTransactionsReport);

module.exports = router;
