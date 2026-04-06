const RECEIPT_PRINTER_STORAGE_KEY = "pos.receiptPrinterName";

export function isElectronReceiptPrintingAvailable() {
  return Boolean(window.api?.receipt?.print);
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
