const express = require('express');
const router = express.Router();

// Hent alle kunder
router.get('/', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query(
      'SELECT * FROM customers ORDER BY name ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Kunne ikke hente kunder' });
  }
});

// Hent en kunde
router.get('/:id', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query(
      'SELECT * FROM customers WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Kunde ikke fundet' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Kunne ikke hente kunde' });
  }
});

// Opret kunde
router.post('/', async (req, res) => {
  const { name, email, address, cvr, ean, phone, notes } = req.body;
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query(
      `INSERT INTO customers (name, email, address, cvr, ean, phone, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [name, email, address, cvr, ean, phone, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Kunne ikke oprette kunde' });
  }
});

// Opdater kunde
router.patch('/:id', async (req, res) => {
  const { name, email, address, cvr, ean, phone, notes } = req.body;
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query(
      `UPDATE customers SET
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        address = COALESCE($3, address),
        cvr = COALESCE($4, cvr),
        ean = COALESCE($5, ean),
        phone = COALESCE($6, phone),
        notes = COALESCE($7, notes)
       WHERE id = $8 RETURNING *`,
      [name, email, address, cvr, ean, phone, notes, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Kunde ikke fundet' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Kunne ikke opdatere kunde' });
  }
});

// Slet kunde
router.delete('/:id', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    await pool.query('DELETE FROM customers WHERE id = $1', [req.params.id]);
    res.json({ message: 'Kunde slettet' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Kunne ikke slette kunde' });
  }
});

module.exports = router;
