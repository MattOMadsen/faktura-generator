const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

// Registrering
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail og adgangskode er påkrævet' });
  }

  try {
    const pool = req.app.locals.pool;

    // Tjek om bruger findes
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'En bruger med denne e-mail findes allerede' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Opret bruger
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, name, plan) VALUES ($1, $2, $3, $4) RETURNING id, email, name, plan, created_at',
      [email, passwordHash, name || null, 'free']
    );

    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name, plan: user.plan } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Kunne ikke oprette bruger' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail og adgangskode er påkrævet' });
  }

  try {
    const pool = req.app.locals.pool;

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Forkert e-mail eller adgangskode' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Forkert e-mail eller adgangskode' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Kunne ikke logge ind' });
  }
});

// Hent nuværende bruger
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Ingen token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const pool = req.app.locals.pool;
    const result = await pool.query('SELECT id, email, name, plan FROM users WHERE id = $1', [decoded.userId]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Bruger ikke fundet' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(401).json({ error: 'Ugyldig token' });
  }
});

module.exports = router;
