const express = require('express');
const cors = require('cors');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const authMiddleware = require('./middleware/auth');

const authRoutes = require('./routes/auth');
const roomsRoutes = require('./routes/rooms');
const pricingRoutes = require('./routes/pricing');
const channelsRoutes = require('./routes/channels');
const guestsRoutes = require('./routes/guests');
const housekeepingRoutes = require('./routes/housekeeping');
const upsellsRoutes = require('./routes/upsells');
const reservationsRoutes = require('./routes/reservations');
const analyticsRoutes = require('./routes/analytics');
const reviewsRoutes = require('./routes/reviews');
const staffRoutes = require('./routes/staff');
const promotionsRoutes = require('./routes/promotions');
const competitorsRoutes = require('./routes/competitors');
const maintenanceRoutes = require('./routes/maintenance');
const forecastingRoutes = require('./routes/forecasting');
const billingRoutes = require('./routes/billing');
const reportsRoutes = require('./routes/reports');
const notificationsRoutes = require('./routes/notifications');

const app = express();
const PORT = process.env.BACKEND_PORT || 4000;
const FRONTEND_PORT = process.env.FRONTEND_PORT || 3000;

// CORS
app.use(cors({
  origin: [
    `http://localhost:${FRONTEND_PORT}`,
    `http://127.0.0.1:${FRONTEND_PORT}`,
  ],
  credentials: true,
}));

// JSON body parser
app.use(express.json());

// Public routes (no auth required)
app.use('/api/auth', authRoutes);

// Auth middleware for all other /api routes
app.use('/api', authMiddleware);

// Protected routes
app.use('/api/rooms', roomsRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/channels', channelsRoutes);
app.use('/api/guests', guestsRoutes);
app.use('/api/housekeeping', housekeepingRoutes);
app.use('/api/upsells', upsellsRoutes);
app.use('/api/reservations', reservationsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/promotions', promotionsRoutes);
app.use('/api/competitors', competitorsRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/forecasting', forecastingRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/notifications', notificationsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`Hotel Revenue Manager API running on port ${PORT}`);
  console.log(`Accepting requests from http://localhost:${FRONTEND_PORT}`);
});

module.exports = app;
