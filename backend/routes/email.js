const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');
const { authMiddleware } = require('../middleware/auth');
const { generateInvoiceHTML } = require('./pdf');

// Send faktura som e-mail
router.post('/send-invoice/:invoiceId', authMiddleware, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const transporter = req.app.locals.transporter;

    // Hent faktura
    const invoiceResult = await pool.query(
      'SELECT * FROM invoices WHERE id = $1 AND user_id = $2',
      [req.params.invoiceId, req.userId]
    );
    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Faktura ikke fundet' });
    }
    const invoice = invoiceResult.rows[0];

    // Hent firma-indstillinger
    const companyResult = await pool.query(
      'SELECT * FROM company_settings WHERE user_id = $1 LIMIT 1',
      [req.userId]
    );
    const company = companyResult.rows[0] || {};

    // Generer PDF
    const html = generateInvoiceHTML(invoice, company);

    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    // Send e-mail
    const mailOptions = {
      from: `"${company.company_name || 'Faktura-Generator'}" <${process.env.EMAIL_USER}>`,
      to: invoice.customer_email,
      subject: `Faktura ${invoice.invoice_number} fra ${company.company_name || 'Dit Firma'}`,
      html: `
        <p>Hej ${invoice.customer_name},</p>
        <p>Vedhæftet finder du faktura <strong>${invoice.invoice_number}</strong>.</p>
        <p><strong>Beløb:</strong> ${Number(invoice.total).toLocaleString('da-DK', { minimumFractionDigits: 2 })} DKK<br>
        <strong>Betalingsfrist:</strong> ${new Date(invoice.due_date).toLocaleDateString('da-DK')}</p>
        ${company.bank_name ? `<p><strong>Bankoverførsel:</strong><br>${company.bank_name}<br>Reg. nr.: ${company.reg_number || '-'}<br>Konto nr.: ${company.account_number || '-'}</p>` : ''}
        <p>Med venlig hilsen,<br>${company.company_name || ''}</p>
      `,
      attachments: [
        {
          filename: `${invoice.invoice_number}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: 'Faktura sendt' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Kunne ikke sende e-mail' });
  }
});

module.exports = router;
