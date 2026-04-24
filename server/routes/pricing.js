const express = require('express');
const router = express.Router();
const pool = require('../db');
const { analyzeRoomPricing } = require('../services/openrouter');

// GET /api/pricing
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM pricing_rules ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Get pricing rules error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/pricing/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM pricing_rules WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pricing rule not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get pricing rule error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/pricing
router.post('/', async (req, res) => {
  try {
    const { room_type, base_price, min_price, max_price, season, day_of_week, occupancy_threshold, adjustment_percent, is_active, notes } = req.body;

    if (!room_type || !base_price) {
      return res.status(400).json({ error: 'Room type and base price are required.' });
    }

    const result = await pool.query(
      `INSERT INTO pricing_rules (room_type, base_price, min_price, max_price, season, day_of_week, occupancy_threshold, adjustment_percent, is_active, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [room_type, base_price, min_price || 0, max_price || 9999, season || 'regular', day_of_week || 'all', occupancy_threshold || 0, adjustment_percent || 0, is_active !== false, notes || '']
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create pricing rule error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/pricing/:id
router.put('/:id', async (req, res) => {
  try {
    const { room_type, base_price, min_price, max_price, season, day_of_week, occupancy_threshold, adjustment_percent, is_active, notes } = req.body;

    const result = await pool.query(
      `UPDATE pricing_rules SET room_type = COALESCE($1, room_type), base_price = COALESCE($2, base_price),
       min_price = COALESCE($3, min_price), max_price = COALESCE($4, max_price), season = COALESCE($5, season),
       day_of_week = COALESCE($6, day_of_week), occupancy_threshold = COALESCE($7, occupancy_threshold),
       adjustment_percent = COALESCE($8, adjustment_percent), is_active = COALESCE($9, is_active), notes = COALESCE($10, notes)
       WHERE id = $11 RETURNING *`,
      [room_type, base_price, min_price, max_price, season, day_of_week, occupancy_threshold, adjustment_percent, is_active, notes, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pricing rule not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update pricing rule error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/pricing/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM pricing_rules WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pricing rule not found.' });
    }
    res.json({ message: 'Pricing rule deleted successfully.', rule: result.rows[0] });
  } catch (err) {
    console.error('Delete pricing rule error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/pricing/ai-analyze
router.post('/ai-analyze', async (req, res) => {
  try {
    const roomData = req.body;

    if (!roomData || Object.keys(roomData).length === 0) {
      return res.status(400).json({ error: 'Room data is required for AI analysis.' });
    }

    const analysis = await analyzeRoomPricing(roomData);
    res.json({ success: true, analysis });
  } catch (err) {
    console.error('AI pricing analysis error:', err);
    res.status(500).json({ error: 'AI analysis failed. ' + err.message });
  }
});

module.exports = router;
