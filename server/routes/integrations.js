/*
 * routes/integrations.js — Apply pass 5
 *
 * 503-on-no-key stubs for OTA / payment / loyalty integrations called out in
 * batch_04 §26 "missing non-AI features". JWT auth is provided by the global
 * `app.use('/api', authMiddleware)` mounted in server/index.js — no extra
 * middleware needed here.
 */

const express = require('express');
const router = express.Router();

function requireEnv(req, res, providerName, vars) {
  const missing = vars.filter((v) => !process.env[v] || String(process.env[v]).startsWith('your_'));
  if (missing.length) {
    res.status(503).json({
      error: 'integration_not_configured',
      provider: providerName,
      missing_env: missing,
      message: `${providerName} not configured. Set ${missing.join(', ')} to enable.`,
    });
    return false;
  }
  return true;
}

// Expedia / Rapid API distribution
router.post('/expedia/sync', async (req, res) => {
  if (!requireEnv(req, res, 'Expedia', ['EXPEDIA_API_KEY', 'EXPEDIA_PARTNER_ID'])) return;
  res.json({ status: 'stub_with_creds', note: 'Expedia auth ok; map rate plans + inventory.' });
});

// Booking.com Connectivity API
router.post('/bookingcom/sync', async (req, res) => {
  if (!requireEnv(req, res, 'Booking.com', ['BOOKINGCOM_USERNAME', 'BOOKINGCOM_PASSWORD', 'BOOKINGCOM_HOTEL_ID'])) return;
  res.json({ status: 'stub_with_creds', note: 'Booking.com creds present; implement OTA_HotelRateAmountNotifRQ.' });
});

// Stripe — payment processing
router.post('/stripe/charge', async (req, res) => {
  if (!requireEnv(req, res, 'Stripe', ['STRIPE_SECRET_KEY'])) return;
  res.json({ status: 'stub_with_creds', note: 'Stripe key present; implement PaymentIntent + capture flow.' });
});

// Loyalty (Hilton Honors / Marriott Bonvoy / IHG One Rewards mock)
router.post('/loyalty/lookup', async (req, res) => {
  if (!requireEnv(req, res, 'Loyalty', ['LOYALTY_PROVIDER', 'LOYALTY_API_KEY'])) return;
  res.json({ status: 'stub_with_creds', note: 'Loyalty provider configured; implement member lookup.' });
});

module.exports = router;
