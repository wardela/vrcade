export function buildReceiptHtml({ invoice, company, totals, qrValue, paperWidthMm = 80 }) {
  const w = `${paperWidthMm}mm`;

  const safe = (v) => (v == null ? "" : String(v));

  // IMPORTANT: inline CSS so it doesn’t depend on Tailwind/DaisyUI
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Receipt</title>
  <style>
    @page { size: ${w} auto; margin: 0; }
    html, body { margin: 0; padding: 0; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

    .receipt {
      width: ${w};
      padding: 6mm 4mm;
      font-family: Arial, Tahoma, sans-serif;
      font-size: 11px;
      color: #000;
    }

    .center { text-align: center; }
    .muted { color: #444; font-size: 10px; }
    .title { font-weight: 700; font-size: 13px; margin-top: 2mm; }
    .row { display: flex; justify-content: space-between; align-items: flex-start; gap: 6px; }
    .hr { border-top: 1px dashed #000; margin: 3mm 0; }

    .items { margin-top: 3mm; }
    .item { margin: 2mm 0; }
    .item-name { flex: 1; }
    .nums { font-variant-numeric: tabular-nums; white-space: nowrap; }

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
      ${company?.logo_url ? `<img src="${safe(company.logo_url)}" style="max-height:18mm; max-width:100%; object-fit:contain;" />` : ""}
      <div class="title">${safe(company?.company_name || invoice?.header?.company_name)}</div>
      ${company?.tax_number ? `<div class="muted">Tax No: ${safe(company.tax_number)}</div>` : ""}
    </div>

    <div class="hr"></div>

    <div class="no-break">
      <div>Invoice #: ${safe(invoice?.header?.invoice_number)}</div>
      <div>Date: ${safe(invoice?.header?.date_formatted || invoice?.header?.date)}</div>
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
      <div class="row"><div>Total discount</div><div class="nums">${Number(totals.totalDiscountIncl || 0).toFixed(3)}</div></div>
      <div class="row"><div>Total before tax</div><div class="nums">${Number(totals.totalBeforeTax || 0).toFixed(3)}</div></div>
      <div class="row"><div>Tax</div><div class="nums">${Number(totals.totalTax || 0).toFixed(3)}</div></div>

      <div class="hr"></div>

      <div class="row grand"><div>Grand total</div><div class="nums">${Number(totals.grandTotal || 0).toFixed(3)}</div></div>
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
