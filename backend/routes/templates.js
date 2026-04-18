const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Opret ny skabelon
router.post('/', async (req, res) => {
  const { name, content } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO templates (name, content) VALUES ($1, $2) RETURNING *',
      [name, content]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Hent alle skabeloner
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM templates');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Hent specifik skabelon
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM templates WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Skabelon ikke fundet' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;