// ================================================
//  TEST E-INVOICING FOR WONKA INVOICES (SAFE)
//  Generates XML ONLY — DOES NOT SEND TO ISTD
// ================================================

const { Pool } = require("pg");
const { buildEinvoiceXml, sendEinvoice, extractQR } = require("./einvoice");

// -------------------------------------------
// POSTGRES CONNECTION (same as wonka.js)
// -------------------------------------------
const pgPool = new Pool({
  host: "82.29.179.227",
  user: "postgres",
  password: "Kr1stjanv2km10z172#",
  database: "sales_system",
  port: 5432,
});

// -------------------------------------------
// BUILD XML FOR SELECTED INVOICE
// -------------------------------------------
async function testEinvoice(invoiceNumber) {
  const client = await pgPool.connect();
  try {
    console.log(`\n🔍 Fetching invoice ${invoiceNumber} ...`);

    // ----- HEADER -----
    const headerRes = await client.query(
      `SELECT * FROM invoice_header WHERE invoice_number = $1`,
      [invoiceNumber]
    );

    if (headerRes.rows.length === 0) {
      console.log(`❌ No header found for invoice ${invoiceNumber}`);
      return;
    }
    const header = headerRes.rows[0];

    // ----- LINES -----
    const linesRes = await client.query(
      `SELECT * FROM invoice_lines WHERE invoice_number = $1 ORDER BY item_number ASC`,
      [invoiceNumber]
    );
    const lines = linesRes.rows;

    if (lines.length === 0) {
      console.log("❌ No lines found for this invoice");
      return;
    }

    console.log(`📦 Loaded ${lines.length} line(s)`);

    // ---------------------------------------
    //  Convert into einvoice.js DATA FORMAT
    // ---------------------------------------

    const inv = {
      InvNumber: header.invoice_number,
      Date: header.date,                         // very important!
      Type: header.type === "cash" ? 1 : 2,
      Notes: header.notes || "",
      INVOICEUUID: header.uuid,
      HeaderTotal: Number(header.total),

      // Company fields (same as jingo system)
      FileNo: "17925592",
      CompanyName: "Carnival Amusement & Entertainment Co.",
      INCOMESERIAL: "17925592",

      CUSTOMERNATIONALNO: "",
      CUSTOMERPOBOX: "",
      CUSTOMERPHONE: header.client || "",
      CustomerName: header.client || "",
    };

const acts = lines.map(l => ({
  ItemNumber: l.item_number,
  Qty: Number(l.qty),
  LineTotal: Number(l.total),            
  TaxVal: Number(l.tax) || 8,
  ItemDiscount: Number(l.discount_percentage) || 0,   // 0.20
  OriginalPrice: Number(l.item_price),                // 1.00
  ItemName: l.description,
  ITEMNOTES: ""
}));


    // ---------------------------------------
    //  BUILD XML
    // ---------------------------------------

const xml = buildEinvoiceXml(inv, acts);

if (!xml) {
  console.log("❌ XML generation failed or invoice skipped");
  return;
}

console.log("\n==============================");
console.log("📄 XML BUILT — SENDING TO ISTD...");
console.log("==============================\n");

// SEND TO ISTD
let response;

try {
  response = await sendEinvoice(xml);
} catch (err) {
  console.log("❌ Failed sending invoice to ISTD");
  return;
}
console.log("📨 ISTD Response Status:", response.status);
console.log("📨 ISTD Response Data:", response.data);

// Extract QR from response JSON
const qr = extractQR(JSON.stringify(response.data));

if (!qr) {
  console.log("❌ No QR returned by ISTD");
  return;
}

console.log("✅ Extracted QR:", qr);

// Save QR to DB
await client.query(
  `UPDATE invoice_header SET qr = $1 WHERE invoice_number = $2`,
  [qr, invoiceNumber]
);

console.log("💾 QR saved to DB successfully!");

    console.log(xml);

    console.log("\n==============================");
    console.log("✅ XML BUILD COMPLETE");
    console.log("==============================\n");

  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    client.release();
  }
}

// -------------------------------------------
// RUN SCRIPT FROM TERMINAL
// -------------------------------------------

const invoiceNumber = process.argv[2];
if (!invoiceNumber) {
  console.log("Usage: node test_einvoice.js <invoiceNumber>");
  process.exit(1);
}

testEinvoice(invoiceNumber);
