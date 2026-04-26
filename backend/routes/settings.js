const express = require('express');
const router = express.Router();

// Hent firma-indstillinger
router.get('/company', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query(
      'SELECT * FROM company_settings WHERE user_id = $1 LIMIT 1',
      [1]
    );
    res.json(result.rows[0] || {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Kunne ikke hente indstillinger' });
  }
});

// Opdater firma-indstillinger
router.put('/company', async (req, res) => {
  const {
    company_name, company_address, company_cvr, company_email,
    company_phone, bank_name, reg_number, account_number,
    payment_terms, vat_rate
  } = req.body;

  try {
    const pool = req.app.locals.pool;
    const existing = await pool.query(
      'SELECT * FROM company_settings WHERE user_id = $1 LIMIT 1',
      [1]
    );

    let result;
    if (existing.rows.length > 0) {
      result = await pool.query(
        `UPDATE company_settings SET
          company_name = $1, company_address = $2, company_cvr = $3,
          company_email = $4, company_phone = $5, bank_name = $6,
          reg_number = $7, account_number = $8, payment_terms = $9,
          vat_rate = $10, updated_at = NOW()
         WHERE user_id = $11 RETURNING *`,
        [
          company_name, company_address, company_cvr, company_email,
          company_phone, bank_name, reg_number, account_number,
          payment_terms, vat_rate, 1
        ]
      );
    } else {
      result = await pool.query(
        `INSERT INTO company_settings (
          user_id, company_name, company_address, company_cvr,
          company_email, company_phone, bank_name, reg_number,
          account_number, payment_terms, vat_rate
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
        [
          1, company_name, company_address, company_cvr,
          company_email, company_phone, bank_name, reg_number,
          account_number, payment_terms, vat_rate
        ]
      );
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Kunne ikke gemme indstillinger' });
  }
});

module.exports = router;
