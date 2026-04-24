const express = require('express');
const router = express.Router();
const pool = require('../db');
const { generateUpsellRecommendations } = require('../services/openrouter');

// GET /api/upsells
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM upsell_rules ORDER BY revenue_potential DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Get upsell rules error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/upsells/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM upsell_rules WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Upsell rule not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get upsell rule error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/upsells
router.post('/', async (req, res) => {
  try {
    const { name, category, target_segment, trigger_event, offer_description, discount_percent, revenue_potential, success_rate, is_active } = req.body;

    if (!name || !category) {
      return res.status(400).json({ error: 'Name and category are required.' });
    }

    const result = await pool.query(
      `INSERT INTO upsell_rules (name, category, target_segment, trigger_event, offer_description, discount_percent, revenue_potential, success_rate, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [name, category, target_segment || 'all', trigger_event || 'check-in', offer_description || '', discount_percent || 0, revenue_potential || 0, success_rate || 0, is_active !== false]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create upsell rule error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/upsells/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, category, target_segment, trigger_event, offer_description, discount_percent, revenue_potential, success_rate, is_active } = req.body;

    const result = await pool.query(
      `UPDATE upsell_rules SET name = COALESCE($1, name), category = COALESCE($2, category),
       target_segment = COALESCE($3, target_segment), trigger_event = COALESCE($4, trigger_event),
       offer_description = COALESCE($5, offer_description), discount_percent = COALESCE($6, discount_percent),
       revenue_potential = COALESCE($7, revenue_potential), success_rate = COALESCE($8, success_rate),
       is_active = COALESCE($9, is_active)
       WHERE id = $10 RETURNING *`,
      [name, category, target_segment, trigger_event, offer_description, discount_percent, revenue_potential, success_rate, is_active, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Upsell rule not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update upsell rule error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/upsells/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM upsell_rules WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Upsell rule not found.' });
    }
    res.json({ message: 'Upsell rule deleted successfully.', rule: result.rows[0] });
  } catch (err) {
    console.error('Delete upsell rule error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/upsells/ai-recommend
router.post('/ai-recommend', async (req, res) => {
  try {
    const { guestData, roomData } = req.body;

    if (!guestData || !roomData) {
      return res.status(400).json({ error: 'Guest data and room data are required for AI recommendations.' });
    }

    const recommendations = await generateUpsellRecommendations(guestData, roomData);
    res.json({ success: true, recommendations });
  } catch (err) {
    console.error('AI upsell recommendation error:', err);
    res.status(500).json({ error: 'AI recommendation failed. ' + err.message });
  }
});

module.exports = router;
