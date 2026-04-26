const express = require('express');
const router = express.Router();

// Hent alle skabeloner
router.get('/', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query(
      'SELECT * FROM templates ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Kunne ikke hente skabeloner' });
  }
});

// Hent standard-skabelon
router.get('/default', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query(
      'SELECT * FROM templates WHERE is_default = true LIMIT 1'
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ingen standard-skabelon fundet' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Kunne ikke hente skabelon' });
  }
});

// Opret skabelon
router.post('/', async (req, res) => {
  const { name, html, is_default } = req.body;
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query(
      'INSERT INTO templates (name, html, is_default) VALUES ($1,$2,$3) RETURNING *',
      [name, html, is_default || false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Kunne ikke oprette skabelon' });
  }
});

// Slet skabelon
router.delete('/:id', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    await pool.query('DELETE FROM templates WHERE id = $1', [req.params.id]);
    res.json({ message: 'Skabelon slettet' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Kunne ikke slette skabelon' });
  }
});

module.exports = router;
