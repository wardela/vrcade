const RECEIPT_PRINTER_STORAGE_KEY = "pos.receiptPrinterName";
const DEFAULT_RECEIPT_CAPABILITIES = {
  directPrintSupported: false,
  cashDrawer: {
    supported: false,
    mode: null,
  },
};

export function isElectronReceiptPrintingAvailable() {
  return Boolean(window.api?.receipt?.print);
}

export async function getReceiptCapabilities() {
  if (!window.api?.receipt?.getCapabilities) {
    return DEFAULT_RECEIPT_CAPABILITIES;
  }

  const capabilities = await window.api.receipt.getCapabilities();
  return capabilities || DEFAULT_RECEIPT_CAPABILITIES;
}

export function getStoredReceiptPrinterName() {
  return localStorage.getItem(RECEIPT_PRINTER_STORAGE_KEY)?.trim() || "";
}

export function setStoredReceiptPrinterName(printerName) {
  const nextPrinterName = String(printerName || "").trim();

  if (!nextPrinterName) {
    localStorage.removeItem(RECEIPT_PRINTER_STORAGE_KEY);
    return;
  }

  localStorage.setItem(RECEIPT_PRINTER_STORAGE_KEY, nextPrinterName);
}

export async function getReceiptPrinters() {
  if (!isElectronReceiptPrintingAvailable()) {
    return [];
  }

  const printers = await window.api.receipt.getPrinters();
  return Array.isArray(printers) ? printers : [];
}

export async function printReceipt(payload) {
  if (!isElectronReceiptPrintingAvailable()) {
    return {
      success: false,
      error: "Direct receipt printing is available only in the Electron desktop app.",
    };
  }

  return window.api.receipt.print(payload);
}

export async function openCashDrawerOnly(payload = {}) {
  if (!window.api?.receipt?.openCashDrawerOnly) {
    return {
      success: false,
      supported: false,
      error: "Opening the cash drawer without printing is not available in this desktop app.",
    };
  }

  return window.api.receipt.openCashDrawerOnly(payload);
}

export async function openCashDrawer() {
  if (!window.api?.receipt?.openDrawer) {
    return {
      success: false,
      supported: false,
      error: "Independent cash drawer opening is not available in this desktop app.",
    };
  }

  return window.api.receipt.openDrawer();
}
