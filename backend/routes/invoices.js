const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { generatePDF } = require('../utils/pdfGenerator');
const nodemailer = require('nodemailer');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Opret ny faktura
router.post('/', async (req, res) => {
  const { customerName, customerEmail, customerAddress, amount, dueDate, description } = req.body;
  const vat = amount * 0.25;
  const total = amount + vat;

  try {
    const result = await pool.query(
      'INSERT INTO invoices (customer_name, customer_email, customer_address, amount, vat, total, due_date, description, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [customerName, customerEmail, customerAddress, amount, vat, total, dueDate, description, 'unpaid']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Hent alle fakturaer
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM invoices ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send faktura via e-mail
router.post('/:id/send', async (req, res) => {
  const { id } = req.params;
  try {
    const invoice = await pool.query('SELECT * FROM invoices WHERE id = $1', [id]);
    if (invoice.rows.length === 0) {
      return res.status(404).json({ error: 'Faktura ikke fundet' });
    }

    const pdf = generatePDF(invoice.rows[0]);
    const pdfBlob = await pdf.toBlob();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: invoice.rows[0].customer_email,
      subject: 'Din faktura',
      text: `Hej ${invoice.rows[0].customer_name},

Her er din faktura for ${invoice.rows[0].description}.

Beløb: ${invoice.rows[0].total} DKK
Forfaldsdato: ${invoice.rows[0].due_date}

Venlig hilsen,
Faktura-Generator`,
      attachments: [
        {
          filename: `faktura_${id}.pdf`,
          content: pdfBlob,
        },
      ],
    });

    await pool.query('UPDATE invoices SET status = $1 WHERE id = $2', ['sent', id]);
    res.json({ success: true, message: 'Faktura sendt via e-mail' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;