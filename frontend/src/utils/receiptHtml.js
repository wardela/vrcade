export const DEFAULT_RECEIPT_TAX_LABEL = "Tax @ 16.00 %";

export function buildReceiptHtml({
  invoice,
  company,
  totals,
  qrValue,
  paperWidthMm = 80,
  labels = {},
}) {
  const w = `${paperWidthMm}mm`;
  const contentWidthMm = `${Math.max(Number(paperWidthMm) - 6, 58)}mm`;
  const text = {
    invoiceNumber: labels.invoiceNumber || "Invoice #",
    date: labels.date || "Date",
    pointOfSale: labels.pointOfSale || "Point of Sale",
    employee: labels.employee || "Employee",
    totalDiscount: labels.totalDiscount || "Total discount",
    totalBeforeTax: labels.totalBeforeTax || "Total before tax",
    tax: labels.tax || DEFAULT_RECEIPT_TAX_LABEL,
    grandTotal: labels.grandTotal || "Grand total",
  };

  const safe = (v) =>
    v == null
      ? ""
      : String(v)
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;")
          .replaceAll("'", "&#39;");

  const logoSrc = company?.logo_data_url || company?.logo_src || company?.logo_url || "";

  // IMPORTANT: inline CSS so it doesn’t depend on Tailwind/DaisyUI
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Receipt</title>
  <style>
    @page { size: ${w} auto; margin: 0; }
    html, body {
      width: ${w};
      max-width: ${w};
      margin: 0;
      padding: 0;
      overflow: hidden;
      background: #fff;
    }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

    .receipt {
      width: ${contentWidthMm};
      max-width: ${contentWidthMm};
      margin: 0 auto;
      padding: 4mm 1.5mm 5mm;
      font-family: Arial, Tahoma, sans-serif;
      font-size: 10px;
      line-height: 1.25;
      color: #000;
    }

    .center { text-align: center; }
    .muted { color: #444; font-size: 10px; }
    .title { font-weight: 700; font-size: 13px; margin-top: 2mm; }
    .row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: flex-start;
      column-gap: 2mm;
      width: 100%;
    }
    .hr { border-top: 1px dashed #000; margin: 3mm 0; }

    .items { margin-top: 3mm; }
    .item { margin: 2mm 0; }
    .item-name {
      min-width: 0;
      overflow-wrap: anywhere;
      word-break: break-word;
    }
    .nums {
      min-width: 16mm;
      text-align: right;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }

    .totals .row { margin: 1.2mm 0; }
    .grand { font-weight: 700; font-size: 12px; }

    .qr { margin-top: 4mm; display: flex; justify-content: center; }
    .qr img { width: 32mm; height: 32mm; }

    /* Avoid weird breaking */
    .no-break { break-inside: avoid; page-break-inside: avoid; }
  </style>
</head>

<body>
  <div class="receipt">
    <div class="center no-break">
      ${logoSrc ? `<img src="${safe(logoSrc)}" style="max-height:18mm; max-width:100%; object-fit:contain;" />` : ""}
      <div class="title">${safe(company?.company_name || invoice?.header?.company_name)}</div>
      ${company?.tax_number ? `<div class="muted">Tax No: ${safe(company.tax_number)}</div>` : ""}
    </div>

    <div class="hr"></div>

    <div class="no-break">
      <div>${safe(text.invoiceNumber)}: ${safe(invoice?.header?.invoice_number)}</div>
      <div>${safe(text.date)}: ${safe(invoice?.header?.date_formatted || invoice?.header?.date)}</div>
      ${
        invoice?.header?.pos_point_name
          ? `<div>${safe(text.pointOfSale)}: ${safe(invoice.header.pos_point_name)}</div>`
          : ""
      }
      ${
        invoice?.header?.employee_full_name
          ? `<div>${safe(text.employee)}: ${safe(invoice.header.employee_full_name)}</div>`
          : ""
      }
    </div>

    <div class="hr"></div>

    <div class="items">
      ${(invoice?.lines || []).map((ln) => {
        const qty = Math.round(Number(ln.qty || 0));
        const price = Number(ln.item_price || 0);
        const lineTotal = qty * price;

        return `
          <div class="row item">
            <div class="item-name">${qty} × ${safe(ln.description)}</div>
            <div class="nums">${lineTotal.toFixed(3)}</div>
          </div>
        `;
      }).join("")}
    </div>

    <div class="hr"></div>

    <div class="totals no-break">
      <div class="row"><div>${safe(text.totalDiscount)}</div><div class="nums">${Number(totals.totalDiscountIncl || 0).toFixed(3)}</div></div>
      <div class="row"><div>${safe(text.totalBeforeTax)}</div><div class="nums">${Number(totals.totalBeforeTax || 0).toFixed(3)}</div></div>
      <div class="row"><div>${safe(text.tax)}</div><div class="nums">${Number(totals.totalTax || 0).toFixed(3)}</div></div>

      <div class="hr"></div>

      <div class="row grand"><div>${safe(text.grandTotal)}</div><div class="nums">${Number(totals.grandTotal || 0).toFixed(3)}</div></div>
    </div>

    <div class="qr no-break">
      ${qrValue ? `<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrValue)}" />` : ""}
    </div>

    <div class="center muted" style="margin-top:3mm;">
      Powered by innovationelements.org
    </div>
  </div>
</body>
</html>`;
}
