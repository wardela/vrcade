// ================================================
//  TEST E-INVOICING FOR WONKA INVOICES (SAFE)
//  Generates XML ONLY — DOES NOT SEND TO ISTD
// ================================================

const { Pool } = require("pg");
const { buildReturnInvoiceXml } =
  require("./einvoice_return");


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
async function testreturnEinvoice(refundInvoiceNumber) {
  const client = await pgPool.connect();

  try {
    console.log(`\n🔁 Building refund e-invoice: ${refundInvoiceNumber}`);

    // 1️⃣ Refund header
    const refundHeaderRes = await client.query(
      `SELECT * FROM refund_invoice_header WHERE refund_invoice_number = $1`,
      [refundInvoiceNumber]
    );
    if (refundHeaderRes.rows.length === 0) {
      console.log("❌ Refund invoice not found");
      return;
    }
    const refundHeader = refundHeaderRes.rows[0];

    // 2️⃣ Original invoice header
    const originalHeaderRes = await client.query(
      `SELECT * FROM invoice_header WHERE invoice_number = $1`,
      [refundHeader.original_invoice_number]
    );
    const originalHeader = originalHeaderRes.rows[0];

    // 3️⃣ Refund quantities
    const refundLinesRes = await client.query(
      `SELECT item_number, refund_qty
       FROM refund_invoice_lines
       WHERE refund_invoice_number = $1`,
      [refundInvoiceNumber]
    );

    const refundQtyMap = new Map();
    for (const r of refundLinesRes.rows) {
      refundQtyMap.set(Number(r.item_number), Number(r.refund_qty));
    }

    // 4️⃣ Original invoice lines
    const originalLinesRes = await client.query(
      `SELECT *
       FROM invoice_lines
       WHERE invoice_number = $1
       ORDER BY item_number`,
      [refundHeader.original_invoice_number]
    );

    // 5️⃣ Merge lines
    const refundLines = [];

    for (const l of originalLinesRes.rows) {
      const refundQty = refundQtyMap.get(Number(l.item_number)) || 0;
      if (refundQty <= 0) continue;
      refundLines.push({
  item_number: l.item_number,
  qty: refundQty,
  price: Number(l.item_price),
  tax: Number(l.tax),
  discount_percentage: Number(l.discount_percentage) || 0,
  item_name: l.description
});

    }

    if (refundLines.length === 0) {
      console.log("❌ No refundable lines");
      return;
    }

    // 6️⃣ Build XML
    const xml = buildReturnInvoiceXml(
      {
        return_invoice_number: refundHeader.refund_invoice_number,
        return_uuid: refundHeader.refund_uuid,
        date: refundHeader.refund_date
      },
      {
        invoice_number: originalHeader.invoice_number,
        uuid: originalHeader.uuid,
        total: originalHeader.total,
        date: originalHeader.date,
        type: originalHeader.type
      },
      refundLines
    );

    console.log("\n================ REFUND XML ================\n");
    console.log(xml);
    console.log("\n===========================================\n");

  } catch (err) {
    console.error("❌ Refund e-invoice error:", err);
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

testreturnEinvoice(invoiceNumber);
