const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { authMiddleware } = require('../middleware/auth');

// Opret Stripe Checkout session
router.post('/create-checkout-session', authMiddleware, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const userResult = await pool.query('SELECT email FROM users WHERE id = $1', [req.userId]);
    const user = userResult.rows[0];

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID_PRO,
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings?success=true`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings?canceled=true`,
      customer_email: user.email,
      metadata: { userId: req.userId },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Kunne ikke oprette betaling' });
  }
});

// Webhook til at håndtere betalingshændelser
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook fejl:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const pool = req.app.locals.pool;

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata.userId;

    await pool.query(
      "UPDATE users SET plan = 'pro', stripe_customer_id = $1 WHERE id = $2",
      [session.customer, userId]
    );
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    const customerId = subscription.customer;

    await pool.query(
      "UPDATE users SET plan = 'free' WHERE stripe_customer_id = $1",
      [customerId]
    );
  }

  res.json({ received: true });
});

module.exports = router;
