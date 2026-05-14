/*
 * routes/laborOps.js — Apply pass 5
 *
 * Mechanical (no-LLM) labor + housekeeping helper called out in audit's
 * "Custom feature suggestion #6 — Staff scheduling + labor optimization" and
 * "missing non-AI features → housekeeping/maintenance scheduling" for
 * AIHotelRevenueManager (batch_04 §26).
 *
 * Deterministic — derives recommended housekeeping headcount from upcoming
 * occupied/dirty rooms and configurable rooms-per-housekeeper ratios.
 */

const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/labor-ops/housekeeping-recommendation?date=YYYY-MM-DD
router.get('/housekeeping-recommendation', async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const ratio = Math.max(8, Math.min(20, parseInt(req.query.rooms_per_attendant, 10) || 14));

    const rooms = await pool.query('SELECT id, status, type FROM rooms');

    const total = rooms.rows.length;
    const dirty = rooms.rows.filter((r) => /dirty|inspect|stayover|checkout/i.test(String(r.status || ''))).length;
    const clean = rooms.rows.filter((r) => /clean|ready|vacant/i.test(String(r.status || ''))).length;

    // Per-type bucket — different room types take different time
    const typeBuckets = {};
    for (const r of rooms.rows) {
      const t = String(r.type || 'standard').toLowerCase();
      if (!typeBuckets[t]) typeBuckets[t] = 0;
      typeBuckets[t] += 1;
    }

    const recommended_attendants = Math.ceil(dirty / ratio);
    const recommended_supervisors = Math.max(1, Math.ceil(recommended_attendants / 6));

    res.json({
      date,
      total_rooms: total,
      rooms_dirty_or_pending: dirty,
      rooms_clean: clean,
      rooms_per_attendant_ratio: ratio,
      recommended_attendants,
      recommended_supervisors,
      type_distribution: typeBuckets,
      note: 'Deterministic recommendation. Actual staffing depends on union/contract rules and arrival pattern.',
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
