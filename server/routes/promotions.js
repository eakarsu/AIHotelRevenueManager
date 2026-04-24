const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/promotions
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM promotions ORDER BY valid_from DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Get promotions error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/promotions/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM promotions WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Promotion not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get promotion error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/promotions
router.post('/', async (req, res) => {
  try {
    const { name, type, description, discount_percent, min_nights, max_nights, valid_from, valid_until, applicable_room_types, promo_code, is_active, times_used, revenue_generated } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required.' });
    }

    const result = await pool.query(
      `INSERT INTO promotions (name, type, description, discount_percent, min_nights, max_nights, valid_from, valid_until, applicable_room_types, promo_code, is_active, times_used, revenue_generated)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [name, type, description || '', discount_percent || 0, min_nights || 1, max_nights || 30, valid_from || new Date().toISOString().split('T')[0], valid_until || null, applicable_room_types || 'All', promo_code || '', is_active !== undefined ? is_active : true, times_used || 0, revenue_generated || 0]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create promotion error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/promotions/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, type, description, discount_percent, min_nights, max_nights, valid_from, valid_until, applicable_room_types, promo_code, is_active, times_used, revenue_generated } = req.body;

    const result = await pool.query(
      `UPDATE promotions SET name = COALESCE($1, name), type = COALESCE($2, type),
       description = COALESCE($3, description), discount_percent = COALESCE($4, discount_percent),
       min_nights = COALESCE($5, min_nights), max_nights = COALESCE($6, max_nights),
       valid_from = COALESCE($7, valid_from), valid_until = COALESCE($8, valid_until),
       applicable_room_types = COALESCE($9, applicable_room_types), promo_code = COALESCE($10, promo_code),
       is_active = COALESCE($11, is_active), times_used = COALESCE($12, times_used),
       revenue_generated = COALESCE($13, revenue_generated)
       WHERE id = $14 RETURNING *`,
      [name, type, description, discount_percent, min_nights, max_nights, valid_from, valid_until, applicable_room_types, promo_code, is_active, times_used, revenue_generated, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Promotion not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update promotion error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/promotions/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM promotions WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Promotion not found.' });
    }
    res.json({ message: 'Promotion deleted successfully.', promotion: result.rows[0] });
  } catch (err) {
    console.error('Delete promotion error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
