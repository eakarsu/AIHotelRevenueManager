const express = require('express');
const cors = require('cors');
const path = require('path');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

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
const aiWarRoomRoutes = require('./routes/aiWarRoom');
// Apply pass 5 — additive
const integrationsRoutes = require('./routes/integrations');
const laborOpsRoutes = require('./routes/laborOps');

// === Batch 04 Gaps & Frontend Mounts ===
const route_gap_no_dynamic_pricing_optimizer_endpoint_ru = require('./routes/gap-no-dynamic-pricing-optimizer-endpoint-ru');
const route_gap_no_demand_forecaster = require('./routes/gap-no-demand-forecaster');
const route_gap_no_guest_segmentation_ai = require('./routes/gap-no-guest-segmentation-ai');
const route_gap_no_review_sentiment_analyzer = require('./routes/gap-no-review-sentiment-analyzer');
const route_gap_no_competitor_rate_ai_recommender = require('./routes/gap-no-competitor-rate-ai-recommender');
const route_gap_no_upsell_recommendation_engine = require('./routes/gap-no-upsell-recommendation-engine');
const route_gap_no_loyalty_program_management = require('./routes/gap-no-loyalty-program-management');
const route_gap_no_real_time_websocket_booking_board = require('./routes/gap-no-real-time-websocket-booking-board');
const route_gap_no_webhook_surface_for_ota_event = require('./routes/gap-no-webhook-surface-for-ota-event');
const route_gap_no_file_upload_for_guest_documents = require('./routes/gap-no-file-upload-for-guest-documents');
const route_gap_no_multi_property_fleet_management = require('./routes/gap-no-multi-property-fleet-management');
const app = express();
const PORT = process.env.BACKEND_PORT || 4000;
const FRONTEND_PORT = process.env.FRONTEND_PORT || 3000;

// Security
app.use(require('helmet')());

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || `http://localhost:${FRONTEND_PORT}`,
  credentials: true,
}));

// JSON body parser
app.use(express.json());

// AI rate limiter: 20 requests/hour per user or IP
const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req, res) => (req.user?.id ? `user_${req.user.id}` : ipKeyGenerator(req, res)),
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many AI requests. Limit is 20 per hour.' });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

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
app.use('/api/ai', aiRateLimiter, aiWarRoomRoutes);
// Apply pass 5 — auth inherited from `app.use('/api', authMiddleware)` above
app.use('/api/integrations', integrationsRoutes);
app.use('/api/labor-ops', laborOpsRoutes);
app.use('/api/dynamic-pricing-ai', require('./routes/dynamicPricingAI'));
app.use('/api/review-response-ai', require('./routes/reviewResponseAI'));

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


app.use('/api/gap-no-dynamic-pricing-optimizer-endpoint-ru', route_gap_no_dynamic_pricing_optimizer_endpoint_ru);
app.use('/api/gap-no-demand-forecaster', route_gap_no_demand_forecaster);
app.use('/api/gap-no-guest-segmentation-ai', route_gap_no_guest_segmentation_ai);
app.use('/api/gap-no-review-sentiment-analyzer', route_gap_no_review_sentiment_analyzer);
app.use('/api/gap-no-competitor-rate-ai-recommender', route_gap_no_competitor_rate_ai_recommender);
app.use('/api/gap-no-upsell-recommendation-engine', route_gap_no_upsell_recommendation_engine);
app.use('/api/gap-no-loyalty-program-management', route_gap_no_loyalty_program_management);
app.use('/api/gap-no-real-time-websocket-booking-board', route_gap_no_real_time_websocket_booking_board);
app.use('/api/gap-no-webhook-surface-for-ota-event', route_gap_no_webhook_surface_for_ota_event);
app.use('/api/gap-no-file-upload-for-guest-documents', route_gap_no_file_upload_for_guest_documents);
app.use('/api/gap-no-multi-property-fleet-management', route_gap_no_multi_property_fleet_management);

app.listen(PORT, () => {
  console.log(`Hotel Revenue Manager API running on port ${PORT}`);
  console.log(`Accepting requests from http://localhost:${FRONTEND_PORT}`);
});

module.exports = app;
