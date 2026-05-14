const express = require('express');
const router = express.Router();
const pool = require('../db');
const { runRevenueWarRoom, persistAnalysis } = require('../services/openrouter');

// POST /api/ai/revenue-war-room
router.post('/revenue-war-room', async (req, res) => {
  try {
    // Run 3 DB queries in parallel
    const [pricingRes, competitorRes, reservationRes] = await Promise.all([
      pool.query('SELECT pr.*, r.status as room_status FROM pricing_rules pr LEFT JOIN rooms r ON r.type = pr.room_type LIMIT 50'),
      pool.query('SELECT * FROM competitors ORDER BY created_at DESC LIMIT 20'),
      pool.query(`SELECT * FROM reservations WHERE check_in >= NOW() - interval '30 days' ORDER BY check_in DESC LIMIT 100`),
    ]);

    const pricingData = {
      rules: pricingRes.rows,
      room_count: (await pool.query('SELECT COUNT(*) FROM rooms').catch(() => ({ rows: [{ count: 0 }] }))).rows[0].count,
      occupied_count: (await pool.query("SELECT COUNT(*) FROM rooms WHERE status = 'Occupied'").catch(() => ({ rows: [{ count: 0 }] }))).rows[0].count,
    };

    const result = await runRevenueWarRoom(
      pricingData,
      competitorRes.rows,
      reservationRes.rows,
      req.user?.id
    );

    res.json({ success: true, data: result, generated_at: new Date().toISOString() });
  } catch (err) {
    console.error('Revenue War Room error:', err);
    res.status(500).json({ error: 'War Room analysis failed: ' + err.message });
  }
});

// GET /api/ai/history — recent AI analyses
router.get('/history', async (req, res) => {
  try {
    // Ensure table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_analyses (
        id SERIAL PRIMARY KEY, tool_name TEXT, result TEXT, model TEXT, user_id INTEGER, created_at TIMESTAMP DEFAULT NOW()
      )
    `).catch(() => {});

    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const result = await pool.query(
      `SELECT id, tool_name, model, user_id, created_at, LEFT(result, 500) as result_preview
       FROM ai_analyses ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );
    res.json({ data: result.rows });
  } catch (err) {
    console.error('AI history error:', err);
    res.status(500).json({ error: 'Failed to fetch AI history.' });
  }
});

// POST /api/ai/group-booking-optimizer
// Analyzes a group/event RFP and recommends accept/reject/counter with displacement cost
router.post('/group-booking-optimizer', async (req, res) => {
  try {
    const { group_size, event_type, requested_dates, requested_rate, food_beverage_spend, ancillary_spend, notes } = req.body;

    // Fetch current room inventory and occupancy for requested period
    const [roomsRes, reservationsRes, pricingRes] = await Promise.all([
      pool.query('SELECT COUNT(*) as total, status, type FROM rooms GROUP BY status, type'),
      pool.query(
        `SELECT COUNT(*) as blocked_count FROM reservations
         WHERE (check_in <= $2 AND check_out >= $1) AND status NOT IN ('cancelled')`,
        [requested_dates?.start || new Date().toISOString(), requested_dates?.end || new Date(Date.now() + 7 * 86400000).toISOString()]
      ).catch(() => ({ rows: [{ blocked_count: 0 }] })),
      pool.query('SELECT * FROM pricing_rules LIMIT 10').catch(() => ({ rows: [] })),
    ]);

    const totalRooms = roomsRes.rows.reduce((s, r) => s + parseInt(r.total), 0);
    const blockedRooms = parseInt(reservationsRes.rows[0]?.blocked_count || 0);
    const availableRooms = totalRooms - blockedRooms;

    const { analyzeGroupBooking, persistAnalysis } = require('../services/openrouter');
    const result = await analyzeGroupBooking({
      group_size: group_size || 50,
      event_type: event_type || 'corporate meeting',
      requested_dates,
      requested_rate: requested_rate || 150,
      food_beverage_spend: food_beverage_spend || 0,
      ancillary_spend: ancillary_spend || 0,
      notes: notes || '',
      total_rooms: totalRooms,
      available_rooms: availableRooms,
      pricing_rules: pricingRes.rows,
    });

    await persistAnalysis('group-booking-optimizer', result, req.user?.id);
    res.json({ success: true, data: result, generated_at: new Date().toISOString() });
  } catch (err) {
    console.error('Group booking optimizer error:', err);
    res.status(500).json({ error: 'Group booking analysis failed: ' + err.message });
  }
});

// POST /api/ai/guest-lifetime-value
// Predicts repeat probability and generates personalized win-back campaigns
router.post('/guest-lifetime-value', async (req, res) => {
  try {
    const { guest_id } = req.body;

    let guestData = null;
    let stayHistory = [];

    if (guest_id) {
      const guestRes = await pool.query('SELECT * FROM guests WHERE id = $1', [guest_id]).catch(() => ({ rows: [] }));
      guestData = guestRes.rows[0] || null;

      const stayRes = await pool.query(
        `SELECT r.check_in, r.check_out, r.total_price, r.room_type, r.status
         FROM reservations r WHERE r.guest_id = $1 ORDER BY r.check_in DESC LIMIT 10`,
        [guest_id]
      ).catch(() => ({ rows: [] }));
      stayHistory = stayRes.rows;
    }

    const { analyzeGuestLifetimeValue, persistAnalysis } = require('../services/openrouter');
    const result = await analyzeGuestLifetimeValue(guestData, stayHistory);

    await persistAnalysis('guest-lifetime-value', result, req.user?.id);
    res.json({ success: true, guest_id, data: result, generated_at: new Date().toISOString() });
  } catch (err) {
    console.error('Guest LTV error:', err);
    res.status(500).json({ error: 'Guest LTV analysis failed: ' + err.message });
  }
});

module.exports = router;
