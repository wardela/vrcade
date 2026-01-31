// einvoice_return.js
// Build Return Invoice XML + Encode + Send

const axios = require("axios");

function NToZ(v) {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return 0;
  return Number(v);
}

function roundTo9(n) { return Math.round(NToZ(n) * 1e9) / 1e9; }
function formatAmount9(n) { return roundTo9(n).toFixed(9); }


function buildReturnInvoiceXml(returnHeader, originalHeader, lines, company) {
  // returnHeader:
  // {
  //   return_invoice_number,
  //   return_uuid,
  //   date
  // }

  // originalHeader:
  // {
  //   invoice_number,
  //   uuid,
  //   total,
  //   date,
  //   type
  // }

  // lines: array of original invoice lines
  let totalEx = 0;
  let totalDis = 0;
  let totalTax = 0;

  for (const l of lines) {
    const qty = NToZ(l.qty);
    const price = NToZ(l.price);
    const tax = NToZ(l.tax);
    const taxRate = tax / 100;

    const discountRate = NToZ(l.discount_percentage);
    const discountFactor = 1 - discountRate;

    const lineDiscount =
    qty * price * (NToZ(l.discount_percentage)) / (1 + taxRate);

      totalDis += lineDiscount;

    const DISAMOUNT = formatAmount9(totalDis);

    const lineTotalIncl = qty * price * discountFactor;
    const lineTotalEx = taxRate > 0 ? lineTotalIncl / (1 + taxRate) : lineTotalIncl;
    const lineTax = lineTotalIncl - lineTotalEx;

    totalEx += lineTotalEx;
    totalTax += lineTax;
  }

  const EXAMOUNT = formatAmount9(totalEx);
  const DISAMOUNT = formatAmount9(totalDis);
  const TAXAMOUNT = formatAmount9(totalTax);
  const INAMOUNT = formatAmount9(totalEx + totalTax);
function formatDateYYYYMMDD(value) {
  const d = new Date(value);
  if (!value || Number.isNaN(d.getTime())) return new Date().toISOString().substring(0, 10);
  return d.toISOString().substring(0, 10);
}

const issueDate = formatDateYYYYMMDD(returnHeader.date);

  const typeCodeMap = {
  local:       { cash: "012", credit: "022" },
  export:      { cash: "112", credit: "122" },
  development: { cash: "212", credit: "222" },
};

const payType = String(originalHeader.type || "").toLowerCase();
const scopeType = String(originalHeader.type2 || "").toLowerCase();

const invoiceTypeCodeName =
  typeCodeMap?.[scopeType]?.[payType] || "012"; // safe fallback

  let xml = "";
console.log(company)
  xml += `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" `;
  xml += `xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" `;
  xml += `xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" `;
  xml += `xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">\n`;

  xml += `<cbc:ProfileID>reporting:1.0</cbc:ProfileID>\n`;

  xml += `<cbc:ID>${returnHeader.return_invoice_number}</cbc:ID>\n`;
  xml += `<cbc:UUID>${returnHeader.return_uuid}</cbc:UUID>\n`;
  xml += `<cbc:IssueDate>${issueDate}</cbc:IssueDate>\n`;

xml += `<cbc:InvoiceTypeCode name="${invoiceTypeCodeName}">381</cbc:InvoiceTypeCode>\n`;

  xml += `<cbc:DocumentCurrencyCode>${originalHeader.currency}</cbc:DocumentCurrencyCode>\n`;
  xml += `<cbc:TaxCurrencyCode>${originalHeader.currency}</cbc:TaxCurrencyCode>\n`;

  // Billing reference to the original invoice
  xml += `<cac:BillingReference>\n`;
  xml += `<cac:InvoiceDocumentReference>\n`;
  xml += `<cbc:ID>${originalHeader.invoice_number}</cbc:ID>\n`;
  xml += `<cbc:UUID>${originalHeader.uuid}</cbc:UUID>\n`;
  xml += `<cbc:DocumentDescription>${originalHeader.total}</cbc:DocumentDescription>\n`;
  xml += `</cac:InvoiceDocumentReference>\n`;
  xml += `</cac:BillingReference>\n`;

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

  // Buyer Information (AccountingCustomerParty) – empty buyer (valid for B2C return)
xml += `<cac:AccountingCustomerParty>\n`;
xml += `<cac:Party>\n`;
xml += `<cac:PostalAddress>\n`;
xml += `<cac:Country>\n`;
xml += `<cbc:IdentificationCode>JO</cbc:IdentificationCode>\n`;
xml += `</cac:Country>\n`;
xml += `</cac:PostalAddress>\n`;
xml += `<cac:PartyTaxScheme>\n`;
xml += `<cac:TaxScheme>\n`;
xml += `<cbc:ID>VAT</cbc:ID>\n`;
xml += `</cac:TaxScheme>\n`;
xml += `</cac:PartyTaxScheme>\n`;
xml += `<cac:PartyLegalEntity>\n`;
xml += `</cac:PartyLegalEntity>\n`;
xml += `</cac:Party>\n`;
xml += `</cac:AccountingCustomerParty>\n`;

    // Seller/Supplier Info (SellerSupplierParty) – INCOMESERIAL
  xml += `<cac:SellerSupplierParty>\n`;
  xml += `<cac:Party>\n`;
  xml += `<cac:PartyIdentification>\n`;
  xml += `<cbc:ID>${company.tax_serial}</cbc:ID>\n`;
  xml += `</cac:PartyIdentification>\n`;
  xml += `</cac:Party>\n`;
  xml += `</cac:SellerSupplierParty>\n`;
  
  //means
  xml += `<cac:PaymentMeans>\n`;
  xml += `<cbc:PaymentMeansCode listID="UN/ECE 4461">10</cbc:PaymentMeansCode>\n`;
  xml += `<cbc:InstructionNote>${returnHeader.refund_reason}</cbc:InstructionNote>\n`;
  xml += `</cac:PaymentMeans>\n`;

  // Totals
  xml += `<cac:AllowanceCharge><cbc:ChargeIndicator>false</cbc:ChargeIndicator>`;
  xml += `<cbc:AllowanceChargeReason>discount</cbc:AllowanceChargeReason>`;
  xml += `<cbc:Amount currencyID="JO">${DISAMOUNT}</cbc:Amount></cac:AllowanceCharge>\n`;

// FULL INVOICE TAX SUMMARY (TaxTotal with multiple TaxSubtotal)
// TaxTotal + grouped TaxSubtotal (based on REFUND lines)
// ================= HEADER TAX TOTAL (PER ITEM) =================
xml += `<cac:TaxTotal>\n`;

// total tax for the whole refund invoice
xml += `<cbc:TaxAmount currencyID="JO">${TAXAMOUNT}</cbc:TaxAmount>\n`;

// one TaxSubtotal PER ITEM (like reference file)
for (const l of lines) {
  const qty = NToZ(l.qty);
  const price = NToZ(l.price);
  const taxVal = NToZ(l.tax);
  const taxRate = taxVal / 100;

  const discRate = NToZ(l.discount_percentage);
  const lineTotalIncl = qty * price * (1 - discRate);

  if (lineTotalIncl === 0) continue;

  const lineEx = taxRate > 0
    ? roundTo9(lineTotalIncl / (1 + taxRate))
    : roundTo9(lineTotalIncl);

  const lineTax = roundTo9(lineTotalIncl - lineEx);
  if (lineTax === 0) continue;

  xml += `<cac:TaxSubtotal>\n`;
  xml += `<cbc:TaxableAmount currencyID="JO">${EXAMOUNT}</cbc:TaxableAmount>\n`;
  xml += `<cbc:TaxAmount currencyID="JO">${formatAmount9(lineTax)}</cbc:TaxAmount>\n`;

  xml += `<cac:TaxCategory>\n`;
  xml += `<cbc:ID schemeAgencyID="6" schemeID="UN/ECE 5305">S</cbc:ID>\n`;
  xml += `<cbc:Percent>${formatAmount9(taxVal)}</cbc:Percent>\n`;
  xml += `<cac:TaxScheme>\n`;
  xml += `<cbc:ID>VAT</cbc:ID>\n`;
  xml += `</cac:TaxScheme>\n`;
  xml += `</cac:TaxCategory>\n`;

  xml += `</cac:TaxSubtotal>\n`;
}

xml += `</cac:TaxTotal>\n`;

const EXAMMERF = Number(EXAMOUNT) + Number(DISAMOUNT);
  xml += `<cac:LegalMonetaryTotal>\n`;
  xml += `<cbc:TaxExclusiveAmount currencyID="JO">${EXAMMERF}</cbc:TaxExclusiveAmount>\n`;
  xml += `<cbc:TaxInclusiveAmount currencyID="JO">${INAMOUNT}</cbc:TaxInclusiveAmount>\n`;
  xml += `<cbc:AllowanceTotalAmount currencyID="JO">${DISAMOUNT}</cbc:AllowanceTotalAmount>\n`;
  xml += `<cbc:PrepaidAmount currencyID="JO">0</cbc:PrepaidAmount>\n`;
  xml += `<cbc:PayableAmount currencyID="JO">${INAMOUNT}</cbc:PayableAmount>\n`;
  xml += `</cac:LegalMonetaryTotal>\n`;

  // Lines

for (const l of lines) {
  const qty = NToZ(l.qty);
  const price = NToZ(l.price);
  const tax = NToZ(l.tax);

  const taxRate = tax / 100;

const discRate = NToZ(l.discount_percentage);
const lineTotalIncl = qty * price * (1 - discRate);

  const lineTotalEx = taxRate > 0 ? roundTo9(lineTotalIncl / (1 + taxRate)) : lineTotalIncl;
  const lineTax = roundTo9(lineTotalIncl - lineTotalEx);

  xml += `<cac:InvoiceLine>\n`;
  xml += `<cbc:ID>${l.item_number}</cbc:ID>\n`;

  xml += `<cbc:InvoicedQuantity unitCode="PCE">${qty.toFixed(2)}</cbc:InvoicedQuantity>\n`;

  // before tax
  xml += `<cbc:LineExtensionAmount currencyID="JO">${formatAmount9(lineTotalEx)}</cbc:LineExtensionAmount>\n`;

  xml += `<cac:TaxTotal>\n`;

  // tax only
  xml += `<cbc:TaxAmount currencyID="JO">${formatAmount9(lineTax)}</cbc:TaxAmount>\n`;

  // total including tax (rounding amount)
  xml += `<cbc:RoundingAmount currencyID="JO">${formatAmount9(lineTotalIncl)}</cbc:RoundingAmount>\n`;

  xml += `<cac:TaxSubtotal>\n`;
  xml += `<cbc:TaxableAmount currencyID="JO" >${formatAmount9(lineTotalEx)}</cbc:TaxableAmount>\n`;
  xml += `<cbc:TaxAmount currencyID="JO">${formatAmount9(lineTax)}</cbc:TaxAmount>\n`;

  xml += `<cac:TaxCategory>\n`;
  xml += `<cbc:ID schemeAgencyID="6" schemeID="UN/ECE 5305">${taxRate > 0 ? "S" : "O"}</cbc:ID>\n`;
  xml += `<cbc:Percent>${formatAmount9(tax)}</cbc:Percent>\n`;
  xml += `<cac:TaxScheme>\n`;
  xml += `<cbc:ID schemeAgencyID="6" schemeID="UN/ECE 5153">VAT</cbc:ID>\n`;
  xml += `</cac:TaxScheme>\n`;
  xml += `</cac:TaxCategory>\n`;

  xml += `</cac:TaxSubtotal>\n`;
  xml += `</cac:TaxTotal>\n`;

  // Item
  xml += `<cac:Item><cbc:Name>${l.item_name}</cbc:Name></cac:Item>\n`;

  // Price (unit price BEFORE tax)
const unitPriceIncl = price * (1 - discRate);
const unitPriceEx = taxRate > 0 ? roundTo9(unitPriceIncl / (1 + taxRate)) : unitPriceIncl;
const unitrefex = price / (1 + taxRate);

  xml += `<cac:Price>\n`;
  xml += `<cbc:PriceAmount currencyID="JO">${unitrefex}</cbc:PriceAmount>\n`;
  xml += `<cbc:BaseQuantity unitCode="C62">1</cbc:BaseQuantity>\n`;

  xml += `<cac:AllowanceCharge>\n`;
  xml += `<cbc:ChargeIndicator>false</cbc:ChargeIndicator>\n`;
  xml += `<cbc:AllowanceChargeReason>DISCOUNT</cbc:AllowanceChargeReason>\n`;

const lineDiscountAmount =
  qty * price * NToZ(l.discount_percentage) / (1 + taxRate);

xml += `<cbc:Amount currencyID="JO">${formatAmount9(lineDiscountAmount)}</cbc:Amount>\n`;


  xml += `</cac:AllowanceCharge>\n`;
  xml += `</cac:Price>\n`;

  xml += `</cac:InvoiceLine>\n`;
}
  xml += `</Invoice>`;
console.log(xml)
  return xml;
}
// MINIFY XML
function minifyXml(xmlStr) {
  return xmlStr
    .split("\n")
    .map(line => line.trim())
    .join("");
}

// BASE64 ENCODE
function encodeXmlBase64(minified) {
  return Buffer.from(minified, "utf8").toString("base64");
}

// EXTRACT QR FROM ISTD RESPONSE
function extractQR(responseText) {
  const key = `"EINV_QR":"`;
  const start = responseText.indexOf(key);
  if (start === -1) return null;
  const from = start + key.length;
  const end = responseText.indexOf(`"`, from);
  if (end === -1) return null;
  return responseText.substring(from, end);
}

async function sendReturnToISTD(xml, cfg, company = {}) {
  const EINV_URL = "https://backend.jofotara.gov.jo/core/invoices/";



  // optional (only if you use it)
  const COOKIE = cfg.cookie ? String(cfg.cookie).trim()
    : "4fdb7136e666916d0e373058e9e5c44e|7480c8b0e4ce7933ee164081a50488f1";

  try {
    const minified = minifyXml(xml);
    const base64 = encodeXmlBase64(minified);

    const payload = { invoice: base64 };

    const headers = {
      "client-id": company.client_id.trim(),
      "secret-key": company.secret_key.trim(),
      "Content-Type": "application/json",
    };
console.log("client-id :",company.client_id)
console.log("secret-key :",company.secret_key)
    // only attach cookie if you actually need it
    if (COOKIE) headers.Cookie = `stickounet=${COOKIE}`;

    const response = await axios.post(EINV_URL, payload, { headers });

    const qr = extractQR(JSON.stringify(response.data));

    return {
      ok: true,
      status: response.status,
      data: response.data,
      qr: qr
    };

  } catch (error) {
    return {
      ok: false,
      error: error.response?.data || error.message
    };
  }
}

async function processReturnInvoice(returnHeader, originalHeader, lines, cfg, company = {}) {
  const xml = buildReturnInvoiceXml(returnHeader, originalHeader, lines , company);
  const result = await sendReturnToISTD(xml, cfg, company);
  return { xml, ...result };
}

module.exports = {
  buildReturnInvoiceXml,
  processReturnInvoice,
  sendReturnToISTD  
};
