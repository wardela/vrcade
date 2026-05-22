const invoiceService = require("../../../backend/services/invoiceService");

const reportsService = {
  getCompany: (db) => invoiceService.getCompanyConfig(db),
  getClients: (db) => invoiceService.getAllClients(db),
  getItems: (db) => invoiceService.getAllItems(db),
  getStorages: (db) => invoiceService.getAllStorages(db),
  getGeneralSalesReport: (db, params) => invoiceService.getGeneralSalesReport(db, params),
  getSalesByClientReport: (db, params) => invoiceService.getSalesByClientReport(db, params),
  getSalesByAreaReport: (db, params) => invoiceService.getSalesByAreaReport(db, params),
  getSalesByClientDetailedReport: (db, params) =>
    invoiceService.getSalesByClientDetailedReport(db, params),
  getItemsSoldForClientTotals: (db, params) =>
    invoiceService.getItemsSoldForClientTotals(db, params),
  getPaymentTypeTotalsReport: (db, params) =>
    invoiceService.getPaymentTypeTotalsReport(db, params),
  getPaymentTypeDetailedReport: (db, params) =>
    invoiceService.getPaymentTypeDetailedReport(db, params),
  getEinvoicingReport: (db, params) => invoiceService.getEinvoicingReport(db, params),
  getTaxDeclarationReport: (db, params) => invoiceService.getTaxDeclarationReport(db, params),
  getInvoiceTaxSummaryReport: (db, params) =>
    invoiceService.getInvoiceTaxSummaryReport(db, params),
  getRefundsReport: (db, params) => invoiceService.getRefundsReport(db, params),
  getRefundsByClientReport: (db, params) => invoiceService.getRefundsByClientReport(db, params),
  getItemsSalesReport: (db, params) => invoiceService.getItemsSalesReport(db, params),
  getItemSalesDetailsReport: (db, params) =>
    invoiceService.getItemSalesDetailsReport(db, params),
  getStorageInventoryReport: (db, params) =>
    invoiceService.getStorageInventoryReport(db, params),
  getTransactionsReport: (db, params) => invoiceService.getTransactionLogsReport(db, params),
  getSalesRefundsCombinedReport: (db, params) =>
    invoiceService.getSalesRefundsCombinedReport(db, params),
  getSalesRefundsCombinedByClientReport: (db, params) =>
    invoiceService.getSalesRefundsCombinedByClientReport(db, params),
};

module.exports = reportsService;
