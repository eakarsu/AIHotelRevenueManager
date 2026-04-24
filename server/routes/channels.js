const express = require('express');
const router = express.Router();
const pool = require('../db');
const { optimizeChannelDistribution } = require('../services/openrouter');

// GET /api/channels
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM channels ORDER BY priority ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Get channels error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/channels/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM channels WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Channel not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get channel error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/channels
router.post('/', async (req, res) => {
  try {
    const { name, commission_rate, is_active, priority, allocation_percent, avg_booking_value, performance_score, contract_end, notes } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Channel name is required.' });
    }

    const result = await pool.query(
      `INSERT INTO channels (name, commission_rate, is_active, priority, allocation_percent, avg_booking_value, performance_score, contract_end, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [name, commission_rate || 0, is_active !== false, priority || 1, allocation_percent || 0, avg_booking_value || 0, performance_score || 0, contract_end || null, notes || '']
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create channel error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/channels/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, commission_rate, is_active, priority, allocation_percent, avg_booking_value, performance_score, contract_end, notes } = req.body;

    const result = await pool.query(
      `UPDATE channels SET name = COALESCE($1, name), commission_rate = COALESCE($2, commission_rate),
       is_active = COALESCE($3, is_active), priority = COALESCE($4, priority), allocation_percent = COALESCE($5, allocation_percent),
       avg_booking_value = COALESCE($6, avg_booking_value), performance_score = COALESCE($7, performance_score),
       contract_end = COALESCE($8, contract_end), notes = COALESCE($9, notes)
       WHERE id = $10 RETURNING *`,
      [name, commission_rate, is_active, priority, allocation_percent, avg_booking_value, performance_score, contract_end, notes, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Channel not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update channel error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/channels/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM channels WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Channel not found.' });
    }
    res.json({ message: 'Channel deleted successfully.', channel: result.rows[0] });
  } catch (err) {
    console.error('Delete channel error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/channels/ai-optimize
router.post('/ai-optimize', async (req, res) => {
  try {
    const channelData = req.body;

    if (!channelData || Object.keys(channelData).length === 0) {
      return res.status(400).json({ error: 'Channel data is required for AI optimization.' });
    }

    const optimization = await optimizeChannelDistribution(channelData);
    res.json({ success: true, optimization });
  } catch (err) {
    console.error('AI channel optimization error:', err);
    res.status(500).json({ error: 'AI optimization failed. ' + err.message });
  }
});

module.exports = router;
