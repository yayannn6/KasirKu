const formatRp = (n) => 'Rp ' + Number(n).toLocaleString('id-ID')
const paymentLabel = { cash: 'Tunai', qris: 'QRIS', debit: 'Debit' }

export function printReceipt(trx) {
  const date = new Date(trx.created_at).toLocaleString('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  const itemsHtml = (trx.items || []).map((item) => `
    <div class="item">
      <div class="item-name">${item.product_name}</div>
      <div class="item-row">
        <span>${item.quantity} x ${formatRp(item.price)}</span>
        <span>${formatRp(item.subtotal)}</span>
      </div>
    </div>
  `).join('')

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Struk ${trx.transaction_number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      background: #4b5563;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px 12px;
      font-family: 'Courier New', Courier, monospace;
    }
    .toolbar {
      width: 300px;
      display: flex;
      gap: 8px;
      margin-bottom: 14px;
    }
    .toolbar button {
      flex: 1;
      padding: 10px 0;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      font-family: -apple-system, sans-serif;
    }
    .btn-print { background: #1d4ed8; color: #fff; }
    .btn-print:hover { background: #1e40af; }
    .btn-close { background: #e5e7eb; color: #374151; }
    .btn-close:hover { background: #d1d5db; }

    .receipt-wrap {
      position: relative;
      width: 300px;
    }
    /* Gigi atas struk */
    .receipt-teeth-top, .receipt-teeth-bottom {
      width: 300px;
      height: 12px;
      display: block;
    }
    .receipt-teeth-top {
      background: radial-gradient(circle at 10px 0, transparent 8px, #fffef9 8px);
      background-size: 20px 12px;
      background-position: top left;
    }
    .receipt-teeth-bottom {
      background: radial-gradient(circle at 10px 12px, transparent 8px, #fffef9 8px);
      background-size: 20px 12px;
      background-position: bottom left;
    }

    .receipt {
      background: #fffef9;
      width: 300px;
      padding: 4px 18px 16px;
      box-shadow: 0 6px 28px rgba(0,0,0,0.4);
    }

    .header { text-align: center; padding: 8px 0 4px; }
    .store-name { font-size: 17px; font-weight: bold; letter-spacing: 3px; }
    .store-sub { font-size: 10px; color: #9ca3af; margin-top: 2px; }

    .sep-dash { border: none; border-top: 1px dashed #bbb; margin: 8px 0; }
    .sep-solid { border: none; border-top: 1.5px solid #333; margin: 8px 0; }

    .info-grid { font-size: 10.5px; margin-bottom: 2px; }
    .info-row { display: flex; justify-content: space-between; margin: 3px 0; }
    .info-label { color: #9ca3af; }
    .info-val { font-weight: bold; text-align: right; max-width: 55%; }

    .items-title { font-size: 9px; font-weight: bold; color: #9ca3af; letter-spacing: 1px; margin-bottom: 4px; }
    .item { margin: 5px 0; }
    .item-name { font-size: 11px; font-weight: bold; }
    .item-row { display: flex; justify-content: space-between; font-size: 10.5px; color: #6b7280; padding-left: 4px; margin-top: 1px; }

    .total-row { display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; }
    .pay-row { display: flex; justify-content: space-between; font-size: 10.5px; color: #555; margin: 3px 0; }
    .change-row { display: flex; justify-content: space-between; font-size: 12px; font-weight: bold; color: #15803d; margin-top: 4px; }

    .footer { text-align: center; margin-top: 10px; font-size: 9.5px; color: #9ca3af; line-height: 1.7; }

    @media print {
      html, body { background: white; padding: 0; display: block; }
      .toolbar { display: none !important; }
      .receipt-teeth-top, .receipt-teeth-bottom { display: none; }
      .receipt {
        box-shadow: none;
        width: 100%;
        padding: 8px 12px;
      }
      @page { margin: 0; size: 80mm auto; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <button class="btn-print" onclick="window.print()">🖨️ Print Struk</button>
    <button class="btn-close" onclick="window.close()">✕ Tutup</button>
  </div>

  <div class="receipt-wrap">
    <div class="receipt-teeth-top"></div>
    <div class="receipt">
      <div class="header">
        <div class="store-name">KASIRKU</div>
        <div class="store-sub">Sistem Kasir Konter</div>
      </div>

      <hr class="sep-dash">

      <div class="info-grid">
        <div class="info-row">
          <span class="info-label">No. Transaksi</span>
          <span class="info-val">${trx.transaction_number}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Tanggal</span>
          <span class="info-val">${date}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Kasir</span>
          <span class="info-val">${trx.cashier?.name || '-'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Pembayaran</span>
          <span class="info-val">${paymentLabel[trx.payment_method] || trx.payment_method}</span>
        </div>
      </div>

      <hr class="sep-dash">

      <div class="items-title">ITEM BELANJA</div>
      ${itemsHtml}

      <hr class="sep-solid">

      <div class="total-row"><span>TOTAL</span><span>${formatRp(trx.total)}</span></div>
      <div class="pay-row">
        <span>Bayar (${paymentLabel[trx.payment_method] || trx.payment_method})</span>
        <span>${formatRp(trx.paid_amount)}</span>
      </div>
      <div class="change-row"><span>Kembalian</span><span>${formatRp(trx.change_amount)}</span></div>

      <hr class="sep-dash">

      <div class="footer">
        ★ Terima kasih atas kunjungan Anda! ★<br>
        Barang yang sudah dibeli tidak dapat dikembalikan.
      </div>
    </div>
    <div class="receipt-teeth-bottom"></div>
  </div>
</body>
</html>`

  const win = window.open('', '_blank', 'width=380,height=720,scrollbars=yes,resizable=yes')
  if (win) {
    win.document.write(html)
    win.document.close()
    win.focus()
  }
}
