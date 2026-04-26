const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// Momsrapport
router.get('/vat', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { year } = req.query;
    const selectedYear = year || new Date().getFullYear();

    const result = await pool.query(
      `SELECT
        EXTRACT(QUARTER FROM issue_date) as quarter,
        SUM(subtotal) as total_subtotal,
        SUM(vat_total) as total_vat,
        SUM(total) as total_amount,
        COUNT(*) as invoice_count
       FROM invoices
       WHERE user_id = $1 AND EXTRACT(YEAR FROM issue_date) = $2
       GROUP BY EXTRACT(QUARTER FROM issue_date)
       ORDER BY quarter`,
      [req.userId, selectedYear]
    );

    const yearly = await pool.query(
      `SELECT
        SUM(subtotal) as total_subtotal,
        SUM(vat_total) as total_vat,
        SUM(total) as total_amount,
        COUNT(*) as invoice_count
       FROM invoices
       WHERE user_id = $1 AND EXTRACT(YEAR FROM issue_date) = $2`,
      [req.userId, selectedYear]
    );

    res.json({
      year: selectedYear,
      quarters: result.rows,
      yearly: yearly.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Kunne ikke generere rapport' });
  }
});

// Eksportér moms som CSV
router.get('/vat/export', authMiddleware, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { year } = req.query;
    const selectedYear = year || new Date().getFullYear();

    const result = await pool.query(
      `SELECT
        invoice_number,
        issue_date,
        customer_name,
        subtotal,
        vat_total,
        total
       FROM invoices
       WHERE user_id = $1 AND EXTRACT(YEAR FROM issue_date) = $2
       ORDER BY issue_date`,
      [req.userId, selectedYear]
    );

    const headers = 'Fakturanummer,Dato,Kunde,Subtotal,Moms,Total\n';
    const rows = result.rows.map(r =>
      `${r.invoice_number},${r.issue_date},${r.customer_name},${r.subtotal},${r.vat_total},${r.total}`
    ).join('\n');

    const totalSubtotal = result.rows.reduce((s, r) => s + Number(r.subtotal), 0);
    const totalVat = result.rows.reduce((s, r) => s + Number(r.vat_total), 0);
    const total = result.rows.reduce((s, r) => s + Number(r.total), 0);

    const csv = headers + rows + `\n,,,${totalSubtotal},${totalVat},${total}`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="momsrapport-${selectedYear}.csv"`);
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Kunne ikke eksportere rapport' });
  }
});

module.exports = router;
