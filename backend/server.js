const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// PostgreSQL opsætning
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Nodemailer opsætning
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Test database-forbindelse
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Fejl ved forbindelse til PostgreSQL:', err);
  } else {
    console.log('Forbundet til PostgreSQL:', res.rows[0].now);
  }
});

// Ruter
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/customers', require('./routes/customers'));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server kører på port ${PORT}`);
});