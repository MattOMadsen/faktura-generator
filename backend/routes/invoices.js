const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// Hent alle fakturaer
router.get('/', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query(
      `SELECT i.*, c.name as customer_name
       FROM invoices i
       LEFT JOIN customers c ON i.customer_id = c.id
       ORDER BY i.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Kunne ikke hente fakturaer' });
  }
});

// Hent en enkelt faktura
router.get('/:id', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query(
      'SELECT * FROM invoices WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Faktura ikke fundet' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Kunne ikke hente faktura' });
  }
});

// Opret faktura
router.post('/', async (req, res) => {
  const {
    customer_id,
    customer_name,
    customer_email,
    customer_address,
    customer_cvr,
    customer_ean,
    line_items,
    subtotal,
    vat_total,
    total,
    vat_rate,
    due_date,
    issue_date,
    payment_terms,
    notes,
  } = req.body;

  try {
    const pool = req.app.locals.pool;

    // Generer fakturanummer: FAK-YYYY-XXXX
    const year = new Date().getFullYear();
    const countResult = await pool.query(
      "SELECT COUNT(*) FROM invoices WHERE invoice_number LIKE 'FAK-' || $1 || '-%'",
      [year]
    );
    const count = parseInt(countResult.rows[0].count) + 1;
    const invoiceNumber = `FAK-${year}-${String(count).padStart(4, '0')}`;

    const result = await pool.query(
      `INSERT INTO invoices (
        invoice_number, customer_id, customer_name, customer_email,
        customer_address, customer_cvr, customer_ean, line_items,
        subtotal, vat_total, total, vat_rate, due_date, issue_date,
        payment_terms, status, notes
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
      RETURNING *`,
      [
        invoiceNumber, customer_id, customer_name, customer_email,
        customer_address, customer_cvr, customer_ean, JSON.stringify(line_items || []),
        subtotal, vat_total, total, vat_rate || 25, due_date, issue_date || new Date(),
        payment_terms || 14, 'unpaid', notes
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Kunne ikke oprette faktura' });
  }
});

// Opdater faktura status
router.patch('/:id/status', async (req, res) => {
  const { status } = req.body;
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query(
      'UPDATE invoices SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Faktura ikke fundet' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Kunne ikke opdatere faktura' });
  }
});

// Slet faktura
router.delete('/:id', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    await pool.query('DELETE FROM invoices WHERE id = $1', [req.params.id]);
    res.json({ message: 'Faktura slettet' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Kunne ikke slette faktura' });
  }
});

module.exports = router;
