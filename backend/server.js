const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
require('dotenv').config();

const app = express();
app.use(cors());

// Stripe webhook skal bruge raw body
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());

// PostgreSQL opsætning
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
app.locals.pool = pool;

// Nodemailer opsætning
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
app.locals.transporter = transporter;

// Test database-forbindelse
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Fejl ved forbindelse til PostgreSQL:', err);
  } else {
    console.log('Forbundet til PostgreSQL:', res.rows[0].now);
  }
});

// Ruter
app.use('/api/auth', require('./routes/auth'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/pdf', require('./routes/pdf').router);
app.use('/api/settings', require('./routes/settings'));
app.use('/api/email', require('./routes/email'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/stripe', require('./routes/stripe'));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server kører på port ${PORT}`);
});
