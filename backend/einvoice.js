// einvoice.js
// =============================================
//  E-Invoicing: XML → Base64 → API Call
//  Ported from Access SCreateInvoiceXML logic
// =============================================

const axios = require("axios");

const EINV_URL = "https://backend.jofotara.gov.jo/core/invoices/";

const STICKOUNET_COOKIE =
  "4fdb7136e666916d0e373058e9e5c44e|7480c8b0e4ce7933ee164081a50488f1";

const RETRYABLE_HTTP_STATUSES = new Set([502, 503, 504]);
const RETRYABLE_NETWORK_CODES = new Set([
  "ECONNABORTED",
  "ECONNRESET",
  "ETIMEDOUT",
  "EAI_AGAIN",
  "ENOTFOUND",
]);

const EINV_TIMEOUT_MS = readIntEnv("EINV_TIMEOUT_MS", 8000, 1);
const EINV_MAX_RETRIES = 0;
const EINV_RETRY_BACKOFF_MS = readIntEnv("EINV_RETRY_BACKOFF_MS", 1500, 100);
const EINV_DEBUG = process.env.EINV_DEBUG === "true";
const EINV_LOG_XML = process.env.EINV_LOG_XML === "true";

// ---------------- HELPER FUNCTIONS ----------------
function readIntEnv(name, fallback, min) {
  const parsed = Number(process.env[name]);
  if (!Number.isFinite(parsed)) return fallback;

  const intValue = Math.trunc(parsed);
  if (intValue < min) return fallback;

  return intValue;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function logEinvoiceDebug(...args) {
  if (EINV_DEBUG) {
    console.log(...args);
  }
}

function truncateForLog(value, maxLength = 300) {
  if (value === null || value === undefined) return "";
  const text = typeof value === "string" ? value : JSON.stringify(value);
  if (!text) return "";
  return text.length <= maxLength ? text : `${text.slice(0, maxLength)}...`;
}

function shouldRetryEinvoice(error) {
  const status = error?.response?.status;
  if (status && RETRYABLE_HTTP_STATUSES.has(status)) {
    return true;
  }

  const code = String(error?.code || "").toUpperCase();
  if (RETRYABLE_NETWORK_CODES.has(code)) {
    return true;
  }

  return /timeout/i.test(String(error?.message || ""));
}

function extractInvoiceId(xmlInvoice) {
  return xmlInvoice.match(/<cbc:ID>(.*?)<\/cbc:ID>/)?.[1] || "Unknown";
}

function resolveEinvoiceCredentials(company) {
  const clientId = company?.client_id?.trim?.() || process.env.EINV_CLIENT_ID?.trim?.();
  const secretKey = company?.secret_key?.trim?.() || process.env.EINV_SECRET_KEY?.trim?.();

  if (!clientId || !secretKey) {
    const err = new Error(
      "Missing e-invoice credentials: set company client_id/secret_key or EINV_CLIENT_ID/EINV_SECRET_KEY env vars"
    );
    err.code = "EINV_CONFIG_MISSING";
    throw err;
  }

  return { clientId, secretKey };
}

function extractQR(responseText) {
  if (!responseText) return null;

  const startKey = `"EINV_QR":"`;
  const start = responseText.indexOf(startKey);
  if (start === -1) return null;

  const from = start + startKey.length;
  const end = responseText.indexOf(`"`, from); // next quote ends the value
  if (end === -1) return null;

  return responseText.substring(from, end);
}

function NToZ(v) {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return 0;
  return Number(v);
}

function roundTo9(n) {
  n = NToZ(n);
  return Math.round(n * 1e9) / 1e9;
}

function formatAmount9(n) {
  return roundTo9(n).toFixed(9); // "0.000000000"
}


function PRICECAL(price, taxVal) {
  // TODO: replace with your real logic.
  return NToZ(price);
}


function formatDateYYYYMMDD(d) {
  if (!d) return "";
  const date = d instanceof Date ? d : new Date(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// -------------------------------------------------
//  buildEinvoiceXml
//  Mirrors SCreateInvoiceXML (without UUID generation / DB writes)
// -------------------------------------------------
/**
 * @param {object} invoice  header-level data (maps to INVFILE + CFF)
 *  {
 *    InvNumber,           // number/string
 *    Date,                // Date or ISO string
 *    Type,                // 1 or 2
 *    Notes,
 *    INVOICEUUID,         // uuid from invoice_header.uuid
 *    HeaderTotal,         // total including tax from invoice_header.total
 *
 *    // CompanyFile (CFF) fields:
 *    FileNo,
 *    CompanyName,
 *    INCOMESERIAL,
 *
 *    // Customer / INVFILE fields:
 *    CUSTOMERNATIONALNO,
 *    CUSTOMERPOBOX,
 *    CUSTOMERPHONE,
 *    CustomerName
 *  }
 *
 * @param {Array} actions  line-level data (maps to INVACTIONS + ITEMS)
 *  each action:
 *  {
 *    ItemNumber,
 *    Qty,
 *    LineTotal,      // total of the line INCLUDING tax (invoice_lines.total)
 *    TaxVal,         // tax percent from DB (invoice_lines.tax)
 *    ItemDiscount,   // percent (kept for compatibility, but we’ll treat as 0)
 *    ItemName,
 *    ITEMNOTES
 *  }
 */
function buildEinvoiceXml(invoice, actions, company) {  // ------------ HEADER TOTALS (correct reverse VAT from lines) ------------
  //
  // We compute:
  //  - headerTotalInclTax   = sum of line totals including tax
  //  - headerBeforeTax      = sum of line totals / (1 + taxRate)
  //  - headerTaxTotal       = sum of (line total - before tax)
  //
  // LineTotal in actions = line TOTAL including tax.

  if (NToZ(invoice.HeaderTotal) === 0) {
    console.warn("[EINV] Invoice total is 0, skipping XML generation");
    return null; 
  }

  let headerTotalInclTax = 0;
  let headerBeforeTax = 0;
  let headerTaxTotal = 0;


    for (const act of actions) {

    // ======== LINE SKIP RULES =========
    const qty = NToZ(act.Qty);
    const unitPriceInclTax = NToZ(act.OriginalPrice);
    const lineTotal = NToZ(act.LineTotal);
    const isFree = act.ItemDiscount === 1 || act.ItemDiscount === 1.00;

    if (qty === 0 || unitPriceInclTax === 0 || lineTotal === 0 || isFree) {
      logEinvoiceDebug(`[EINV] Skipping line #${act.ItemNumber} (invalid or 100% discount)`);
      continue;
    }

    // ======== NORMAL LINE PROCESSING AFTER THIS ========

    const taxRate = NToZ(act.TaxVal) / 100;
    const lineTotalIncl = NToZ(act.LineTotal); // total INCLUDING tax for the whole line
    logEinvoiceDebug(`[EINV] Line ${act.ItemNumber} total incl tax:`, lineTotalIncl);
    headerTotalInclTax += lineTotalIncl;

    if (taxRate > 0) {
      const lineWithoutTax = roundTo9(lineTotalIncl / (1 + taxRate));
      logEinvoiceDebug(`[EINV] Line ${act.ItemNumber} total before tax:`, lineWithoutTax);
      const lineTax = roundTo9(lineTotalIncl - lineWithoutTax);
      logEinvoiceDebug(`[EINV] Line ${act.ItemNumber} tax:`, lineTax);

      headerBeforeTax += lineWithoutTax;
      headerTaxTotal += lineTax;
    } else {
      // zero-tax lines: all goes to before-tax, no tax
      headerBeforeTax += lineTotalIncl;
    }
  }

  const EXAMOUNT = formatAmount9(headerBeforeTax);     
  const TAXAMOUNT = formatAmount9(headerTaxTotal);     
  const INAMOUNT = formatAmount9(headerTotalInclTax);   
  const PAAMOUNT = INAMOUNT;                            


// ========= CORRECT ISTD HEADER DISCOUNT CALCULATION ==========

// 1) Discount percentage (same for all lines in your system)
let headerDiscountRate = 0;
if (actions.length > 0) {
  headerDiscountRate = NToZ(actions[0].ItemDiscount); // e.g. 0.20
}

// 2) Total after discount INCLUDING VAT (what invoice.total stores)
const afterDiscountTotalInclTax = NToZ(invoice.HeaderTotal);  // e.g. 2.800

// 3) Reverse discount → find original total INCLUDING VAT
//    original_total_incl_tax = after / (1 - discount)
const originalTotalInclTax = roundTo9(
  afterDiscountTotalInclTax / (1 - headerDiscountRate)
);

// 4) Reverse VAT → find original BEFORE TAX total
//    before_tax_original = original_incl_tax / (1 + tax)
const avgTaxRate = actions.length > 0 ? NToZ(actions[0].TaxVal) / 100 : 0.08;

const beforeTaxOriginal = roundTo9(
  originalTotalInclTax / (1 + avgTaxRate)
);

// 5) Header discount = before-tax-original × discount%
const headerDiscountAmount = roundTo9(
  beforeTaxOriginal * headerDiscountRate
);

// 6) Format for XML
const DISAMOUNT = formatAmount9(headerDiscountAmount);
const totnotax = formatAmount9(beforeTaxOriginal);


  // ------------ HEADER PART (Invoice tag to LegalMonetaryTotal) ------------

// InvoiceTypeCode name depends on:
// type  (cash/credit) + type2 (local/export/development)
//
// cash  + local        = 012
// credit+ local        = 022
// cash  + export       = 112
// credit+ export       = 122
// cash  + development  = 212
// credit+ development  = 222

const payType = String(invoice.Type || "").toLowerCase();      // "cash" | "credit"
const scopeType = String(invoice.Type2 || "").toLowerCase();   // "local" | "export" | "development"

const typeCodeMap = {
  local:       { cash: "012", credit: "022" },
  export:      { cash: "112", credit: "122" },
  development: { cash: "212", credit: "222" },
};

const invoiceTypeCodeName =
  typeCodeMap?.[scopeType]?.[payType] || "012"; // fallback


  const issueDate = formatDateYYYYMMDD(invoice.Date);
  const uuidPart = invoice.INVOICEUUID
    ? `<cbc:UUID>${invoice.INVOICEUUID}</cbc:UUID>\n`
    : ""; // we now pass INVOICEUUID from DB

  let xml = "";

  xml += `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" `;
  xml += `xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" `;
  xml += `xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" `;
  xml += `xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">\n`;

  xml += `<cbc:ProfileID>reporting:1.0</cbc:ProfileID>\n`;
  xml += `<cbc:ID>${invoice.InvNumber}</cbc:ID>\n`;
  if (uuidPart) xml += uuidPart;
  xml += `<cbc:IssueDate>${issueDate}</cbc:IssueDate>\n`;

  xml += `<cbc:InvoiceTypeCode name="${invoiceTypeCodeName}">388</cbc:InvoiceTypeCode>\n`;
  xml += `<cbc:Note>${invoice.Notes || ""}</cbc:Note>\n`;

  const invoiceCurrency = invoice.Currency || "JOD";

  xml += `<cbc:DocumentCurrencyCode>${invoiceCurrency}</cbc:DocumentCurrencyCode>\n`;
  xml += `<cbc:TaxCurrencyCode>${invoiceCurrency}</cbc:TaxCurrencyCode>\n`;

  xml += `<cac:AdditionalDocumentReference>\n`;
  xml += `<cbc:ID>ICV</cbc:ID>\n`;
  xml += `<cbc:UUID>2</cbc:UUID>\n`;
  xml += `</cac:AdditionalDocumentReference>\n`;

  // Supplier Information (AccountingSupplierParty) – from CompanyFile (CFF)
  xml += `<cac:AccountingSupplierParty>\n`;
  xml += `<cac:Party>\n`;
  xml += `<cac:PostalAddress>\n`;
  xml += `<cac:Country>\n`;
  xml += `<cbc:IdentificationCode>JO</cbc:IdentificationCode>\n`;
  xml += `</cac:Country>\n`;
  xml += `</cac:PostalAddress>\n`;
  xml += `<cac:PartyTaxScheme>\n`;
  xml += `<cbc:CompanyID>${company.tax_number}</cbc:CompanyID>\n`;
  xml += `<cac:TaxScheme>\n`;
  xml += `<cbc:ID>VAT</cbc:ID>\n`;
  xml += `</cac:TaxScheme>\n`;
  xml += `</cac:PartyTaxScheme>\n`;
  xml += `<cac:PartyLegalEntity>\n`;
  xml += `<cbc:RegistrationName>${company.company_name}</cbc:RegistrationName>\n`;
  xml += `</cac:PartyLegalEntity>\n`;
  xml += `</cac:Party>\n`;
  xml += `</cac:AccountingSupplierParty>\n`;

  // Buyer Information (AccountingCustomerParty) – from INVFILE
  xml += `<cac:AccountingCustomerParty>\n`;
  xml += `<cac:Party>\n`;
  xml += `<cac:PartyIdentification>\n`;
  
  const customerIdScheme = invoice.CUSTOMER_ID_CODE || "NIN";
  const customerIdValue  = invoice.CUSTOMER_ID_VALUE || "";

  xml += `<cbc:ID schemeID="${customerIdScheme}">${customerIdValue}</cbc:ID>\n`;

  xml += `</cac:PartyIdentification>\n`;
  xml += `<cac:PostalAddress>\n`;
  xml += `<cbc:PostalZone>${invoice.CUSTOMERPOBOX || ""}</cbc:PostalZone>\n`;
  xml += `<cbc:CountrySubentityCode>JO-AM</cbc:CountrySubentityCode>\n`;
  xml += `<cac:Country>\n`;
  xml += `<cbc:IdentificationCode>JO</cbc:IdentificationCode>\n`;
  xml += `</cac:Country>\n`;
  xml += `</cac:PostalAddress>\n`;
  xml += `<cac:PartyTaxScheme>\n`;
  xml += `<cbc:CompanyID>1</cbc:CompanyID>\n`;
  xml += `<cac:TaxScheme>\n`;
  xml += `<cbc:ID>VAT</cbc:ID>\n`;
  xml += `</cac:TaxScheme>\n`;
  xml += `</cac:PartyTaxScheme>\n`;
  xml += `<cac:PartyLegalEntity>\n`;
  xml += `<cbc:RegistrationName>${invoice.CustomerName || ""}</cbc:RegistrationName>\n`;
  xml += `</cac:PartyLegalEntity>\n`;
  xml += `</cac:Party>\n`;
  xml += `<cac:AccountingContact>\n`;
  xml += `<cbc:Telephone>${invoice.CUSTOMERPHONE || "079"}</cbc:Telephone>\n`;
  xml += `</cac:AccountingContact>\n`;
  xml += `</cac:AccountingCustomerParty>\n`;

  // Seller/Supplier Info (SellerSupplierParty) – INCOMESERIAL
  xml += `<cac:SellerSupplierParty>\n`;
  xml += `<cac:Party>\n`;
  xml += `<cac:PartyIdentification>\n`;
  xml += `<cbc:ID>${company.tax_serial}</cbc:ID>\n`;
  xml += `</cac:PartyIdentification>\n`;
  xml += `</cac:Party>\n`;
  xml += `</cac:SellerSupplierParty>\n`;

  // AllowanceCharge (header discount)
  xml += `<cac:AllowanceCharge>\n`;
  xml += `<cbc:ChargeIndicator>false</cbc:ChargeIndicator>\n`;
  xml += `<cbc:AllowanceChargeReason>discount</cbc:AllowanceChargeReason>\n`;
  xml += `<cbc:Amount currencyID="JO">${DISAMOUNT}</cbc:Amount>\n`;
  xml += `</cac:AllowanceCharge>\n`;

  // TaxTotal (header)
  xml += `<cac:TaxTotal>\n`;
  xml += `<cbc:TaxAmount currencyID="JO">${TAXAMOUNT}</cbc:TaxAmount>\n`;
  xml += `</cac:TaxTotal>\n`;

  // LegalMonetaryTotal (using your exact rules)
  xml += `<cac:LegalMonetaryTotal>\n`;
  xml += `<cbc:TaxExclusiveAmount currencyID="JO">${totnotax}</cbc:TaxExclusiveAmount>\n`;
  xml += `<cbc:TaxInclusiveAmount currencyID="JO">${INAMOUNT}</cbc:TaxInclusiveAmount>\n`;
  xml += `<cbc:AllowanceTotalAmount currencyID="JO">${DISAMOUNT}</cbc:AllowanceTotalAmount>\n`;
  xml += `<cbc:PayableAmount currencyID="JO">${PAAMOUNT}</cbc:PayableAmount>\n`;
  xml += `</cac:LegalMonetaryTotal>\n`;

  // ------------ INVOICE LINES (using DB line totals) ------------

  for (const act of actions) {    

    // ======== LINE SKIP RULES =========
    const qty = NToZ(act.Qty);
    const unitPriceInclTax = NToZ(act.OriginalPrice);
    const lineTotal = NToZ(act.LineTotal);
    const isFree = act.ItemDiscount === 1 || act.ItemDiscount === 1.00;

    if (qty === 0 || unitPriceInclTax === 0 || lineTotal === 0 || isFree) {
      logEinvoiceDebug(`[EINV] Skipping XML line #${act.ItemNumber}`);
      continue;
    }

    const taxVal = NToZ(act.TaxVal);
    const taxRate = taxVal / 100;

    // LineTotal from DB = TOTAL line amount INCLUDING tax
    const lineTotalIncl = NToZ(act.LineTotal);

    let priceWithoutTax;
    let lineTaxRounded;
    let lineNetRounded;

    if (taxRate > 0) {
      priceWithoutTax = roundTo9(lineTotalIncl / (1 + taxRate));
      lineTaxRounded = roundTo9(lineTotalIncl - priceWithoutTax);
      lineNetRounded = priceWithoutTax;
    } else {
      // zero-VAT line
      priceWithoutTax = lineTotalIncl;
      lineTaxRounded = 0;
      lineNetRounded = lineTotalIncl;
    }

    // XML fields:
    const LEXTENSIONAMOUNT = formatAmount9(lineNetRounded);   // BEFORE tax
    const TAXAMOUNT_LINE   = formatAmount9(lineTaxRounded);   // tax only
    const INAMOUNT_LINE    = formatAmount9(lineTotalIncl);    // total INCLUDING tax

    // ORIGINAL UNIT PRICE BEFORE DISCOUNT AND BEFORE TAX


// price before tax:
const unitPriceBeforeTax = roundTo9(unitPriceInclTax / (1 + taxRate));

// discount must be based on BEFORE TAX price
const discountAmount = roundTo9(unitPriceBeforeTax * act.Qty * act.ItemDiscount);

// XML discount must show full discount:
const DISAMOUNT_LINE = formatAmount9(discountAmount);

// PriceAmount in XML MUST BE:
// original price BEFORE tax (not discounted)
const pricePerUnit = unitPriceBeforeTax;



    const itemNameCombined = `${act.ItemName || ""}${
      act.ITEMNOTES ? "-" + act.ITEMNOTES : ""
    }`;

    let taxCategoryId;

    if (act.Exempt === true) {
      // Exempt item → always Z
      taxCategoryId = "Z";
    } else if (taxVal === 0) {
      taxCategoryId = "O";
    } else {
      taxCategoryId = "S";
    }

    xml += `<cac:InvoiceLine>\n`;
    xml += `<cbc:ID>${act.ItemNumber}</cbc:ID>\n`;
    xml += `<cbc:InvoicedQuantity unitCode="PCE">${qty}</cbc:InvoicedQuantity>\n`;
    xml += `<cbc:LineExtensionAmount currencyID="JO">${LEXTENSIONAMOUNT}</cbc:LineExtensionAmount>\n`;

    xml += `<cac:TaxTotal>\n`;
    xml += `<cbc:TaxAmount currencyID="JO">${TAXAMOUNT_LINE}</cbc:TaxAmount>\n`;
    xml += `<cbc:RoundingAmount currencyID="JO">${INAMOUNT_LINE}</cbc:RoundingAmount>\n`;
    xml += `<cac:TaxSubtotal>\n`;
    xml += `<cbc:TaxAmount currencyID="JO">${TAXAMOUNT_LINE}</cbc:TaxAmount>\n`;
    xml += `<cac:TaxCategory>\n`;
    xml += `<cbc:ID schemeAgencyID="6" schemeID="UN/ECE 5305">${taxCategoryId}</cbc:ID>\n`;
    xml += `<cbc:Percent>${taxVal}</cbc:Percent>\n`;
    xml += `<cac:TaxScheme>\n`;
    xml += `<cbc:ID schemeAgencyID="6" schemeID="UN/ECE 5153">VAT</cbc:ID>\n`;
    xml += `</cac:TaxScheme>\n`;
    xml += `</cac:TaxCategory>\n`;
    xml += `</cac:TaxSubtotal>\n`;
    xml += `</cac:TaxTotal>\n`;

    xml += `<cac:Item>\n`;
    xml += `<cbc:Name>${itemNameCombined}</cbc:Name>\n`;
    xml += `</cac:Item>\n`;

    xml += `<cac:Price>\n`;
    xml += `<cbc:PriceAmount currencyID="JO">${formatAmount9(pricePerUnit)}</cbc:PriceAmount>\n`;
    xml += `<cac:AllowanceCharge>\n`;
    xml += `<cbc:ChargeIndicator>false</cbc:ChargeIndicator>\n`;
    xml += `<cbc:AllowanceChargeReason>DISCOUNT</cbc:AllowanceChargeReason>\n`;
    xml += `<cbc:Amount currencyID="JO">${DISAMOUNT_LINE}</cbc:Amount>\n`;
    xml += `</cac:AllowanceCharge>\n`;
    xml += `</cac:Price>\n`;

    xml += `</cac:InvoiceLine>\n`;
  }

  xml += `</Invoice>`;
  logEinvoiceDebug("[EINV] XML build summary:", {
    invoiceNo: invoice.InvNumber,
    headerTotalDb: invoice.HeaderTotal,
    taxExclusiveAmount: EXAMOUNT,
    taxAmount: TAXAMOUNT,
    taxInclusiveAmount: INAMOUNT,
    lineCount: actions.length,
  });

  if (EINV_LOG_XML) {
    logEinvoiceDebug("[EINV] Generated XML:", xml);
  }

  return xml;
}

// ---------------- MINIFY + ENCODE + SEND ----------------

function minifyXml(xmlStr) {
  if (!xmlStr) return "";
  return xmlStr
    .split("\n")
    .map((line) => line.trim())
    .join("");
}

/**
 * Encode XML in Base64 (UTF-8), same as Python:
 *  base64.b64encode(xml_minified.encode("utf-8")).decode("utf-8")
 */
function encodeXmlBase64(xmlMinified) {
  return Buffer.from(xmlMinified, "utf8").toString("base64");
}

/**
 * Send e-invoice to ISTD backend
 * @param {string} xmlInvoice - full XML invoice string with declaration
 * @returns {Promise<{ status:number, data:any }>} - API response
 */
async function sendEinvoice(xmlInvoice, company) {
  const xmlMinified = minifyXml(xmlInvoice);
  const encodedXml = encodeXmlBase64(xmlMinified);
  const payload = { invoice: encodedXml };
  const { clientId, secretKey } = resolveEinvoiceCredentials(company);
  const invoiceId = extractInvoiceId(xmlInvoice);
  const maxAttempts = EINV_MAX_RETRIES + 1;

  const headers = {
    "client-id": clientId,
    "secret-key": secretKey,
    "Content-Type": "application/json",
    Cookie: `stickounet=${STICKOUNET_COOKIE}`,
  };

  logEinvoiceDebug(
    `[EINV] Sending invoice ${invoiceId} (xmlLen=${xmlMinified.length}, base64Len=${encodedXml.length}, timeout=${EINV_TIMEOUT_MS}ms, retries=${EINV_MAX_RETRIES})`
  );

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await axios.post(EINV_URL, payload, {
        headers,
        timeout: EINV_TIMEOUT_MS,
      });

      return {
        status: response.status,
        data: response.data,
      };
    } catch (error) {
      const status = error?.response?.status || "N/A";
      const code = error?.code || "UNKNOWN";
      const retryable = shouldRetryEinvoice(error) && attempt < maxAttempts;
      const snippet = truncateForLog(error?.response?.data);

      console.error(
        `[EINV] Send failed for ${invoiceId} (attempt ${attempt}/${maxAttempts}, status=${status}, code=${code}${retryable ? ", retrying" : ""})`
      );
      if (snippet) {
        logEinvoiceDebug(`[EINV] Response snippet: ${snippet}`);
      }

      if (!retryable) {
        throw error;
      }

      await wait(EINV_RETRY_BACKOFF_MS * attempt);
    }
  }
}


module.exports = {
  buildEinvoiceXml,
  sendEinvoice,
  minifyXml,
  encodeXmlBase64,
  // helpers in case you want them elsewhere:
  NToZ,
  PRICECAL,
  roundTo9,
  formatAmount9,
  extractQR,
};
