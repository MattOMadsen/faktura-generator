const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');

function generateInvoiceHTML(invoice, company) {
  const items = invoice.line_items || [];
  const issueDate = new Date(invoice.issue_date).toLocaleDateString('da-DK');
  const dueDate = new Date(invoice.due_date).toLocaleDateString('da-DK');

  const itemsRows = items.map(item => `
    <tr>
      <td style="padding:10px;border-bottom:1px solid #e5e7eb;">${item.description}</td>
      <td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:center;">${item.quantity}</td>
      <td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:right;">${Number(item.unit_price).toLocaleString('da-DK',{minimumFractionDigits:2})} DKK</td>
      <td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:right;">${Number(item.line_total).toLocaleString('da-DK',{minimumFractionDigits:2})} DKK</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="da">
<head>
  <meta charset="UTF-8">
  <title>Faktura ${invoice.invoice_number}</title>
  <style>
    @page { margin: 40px; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size:14px; color:#333; line-height:1.5; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:40px; }
    .logo { font-size:28px; font-weight:bold; color:#2E8B57; }
    .invoice-title { font-size:36px; font-weight:bold; color:#2E8B57; }
    .info-box { background:#f9fafb; padding:16px; border-radius:8px; margin-bottom:20px; }
    .info-label { font-size:11px; color:#6b7280; text-transform:uppercase; letter-spacing:0.5px; }
    .info-value { font-size:14px; font-weight:600; color:#111; }
    table { width:100%; border-collapse:collapse; margin-top:20px; }
    th { text-align:left; padding:12px 10px; background:#f3f4f6; font-weight:600; font-size:12px; text-transform:uppercase; color:#6b7280; }
    .summary { margin-top:30px; width:300px; margin-left:auto; }
    .summary-row { display:flex; justify-content:space-between; padding:8px 0; }
    .summary-row.total { font-size:18px; font-weight:bold; border-top:2px solid #2E8B57; padding-top:12px; margin-top:8px; }
    .footer { margin-top:60px; padding-top:20px; border-top:1px solid #e5e7eb; font-size:12px; color:#6b7280; }
    .footer-grid { display:flex; justify-content:space-between; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="invoice-title">FAKTURA</div>
      <div style="margin-top:8px; color:#6b7280;">${invoice.invoice_number}</div>
    </div>
    <div style="text-align:right;">
      <div class="logo">${company?.company_name || 'Dit Firma'}</div>
      <div style="color:#6b7280; margin-top:4px;">${company?.company_address || ''}</div>
      <div style="color:#6b7280;">CVR: ${company?.company_cvr || ''}</div>
    </div>
  </div>

  <div style="display:flex; gap:20px; margin-bottom:30px;">
    <div class="info-box" style="flex:1;">
      <div class="info-label">Faktura til</div>
      <div class="info-value">${invoice.customer_name}</div>
      <div style="color:#6b7280; margin-top:4px;">${invoice.customer_address || ''}</div>
      <div style="color:#6b7280;">${invoice.customer_email}</div>
      ${invoice.customer_cvr ? `<div style="color:#6b7280;">CVR: ${invoice.customer_cvr}</div>` : ''}
    </div>
    <div class="info-box" style="flex:1;">
      <div class="info-label">Fakturadato</div>
      <div class="info-value">${issueDate}</div>
      <div class="info-label" style="margin-top:12px;">Betalingsfrist</div>
      <div class="info-value">${dueDate}</div>
      <div class="info-label" style="margin-top:12px;">Betalingsbetingelser</div>
      <div class="info-value">Netto ${invoice.payment_terms || 14} dage</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:50%;">Beskrivelse</th>
        <th style="width:15%;text-align:center;">Antal</th>
        <th style="width:20%;text-align:right;">Enhedspris</th>
        <th style="width:15%;text-align:right;">Beløb</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRows}
    </tbody>
  </table>

  <div class="summary">
    <div class="summary-row">
      <span>Subtotal</span>
      <span>${Number(invoice.subtotal).toLocaleString('da-DK',{minimumFractionDigits:2})} DKK</span>
    </div>
    <div class="summary-row">
      <span>Moms (${invoice.vat_rate || 25}%)</span>
      <span>${Number(invoice.vat_total).toLocaleString('da-DK',{minimumFractionDigits:2})} DKK</span>
    </div>
    <div class="summary-row total">
      <span>Total</span>
      <span>${Number(invoice.total).toLocaleString('da-DK',{minimumFractionDigits:2})} DKK</span>
    </div>
  </div>

  <div class="footer">
    <div class="footer-grid">
      <div>
        <div class="info-label">Bank</div>
        <div>${company?.bank_name || ''}</div>
        <div>Reg. nr.: ${company?.reg_number || ''}</div>
        <div>Konto nr.: ${company?.account_number || ''}</div>
      </div>
      <div>
        <div class="info-label">Kontakt</div>
        <div>${company?.company_email || ''}</div>
        <div>${company?.company_phone || ''}</div>
      </div>
      <div style="text-align:right;">
        <div class="info-label">Status</div>
        <div style="font-weight:bold; color:${invoice.status==='paid'?'#2E8B57':'#FF6347'}">
          ${invoice.status==='paid'?'BETALT':'UBETALT'}
        </div>
      </div>
    </div>
    ${invoice.notes ? `<div style="margin-top:20px; padding:12px; background:#f9fafb; border-radius:6px;"><strong>Noter:</strong> ${invoice.notes}</div>` : ''}
  </div>
</body>
</html>`;
}

// Generer PDF
router.post('/generate/:invoiceId', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const invoiceResult = await pool.query('SELECT * FROM invoices WHERE id = $1', [req.params.invoiceId]);
    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Faktura ikke fundet' });
    }

    const invoice = invoiceResult.rows[0];
    const companyResult = await pool.query(
      'SELECT * FROM company_settings WHERE user_id = $1 LIMIT 1',
      [invoice.user_id || 1]
    );
    const company = companyResult.rows[0] || {};

    const html = generateInvoiceHTML(invoice, company);

    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${invoice.invoice_number}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Kunne ikke generere PDF' });
  }
});

module.exports = router;
