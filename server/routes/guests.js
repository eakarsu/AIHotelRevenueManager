const express = require('express');
const router = express.Router();
const pool = require('../db');
const { personalizeGuestExperience } = require('../services/openrouter');

// GET /api/guests
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM guests ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Get guests error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/guests/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM guests WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Guest not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get guest error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/guests
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, nationality, vip_level, total_stays, preferences, notes } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required.' });
    }

    const result = await pool.query(
      `INSERT INTO guests (name, email, phone, nationality, vip_level, total_stays, preferences, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [name, email, phone || '', nationality || '', vip_level || 'standard', total_stays || 0, JSON.stringify(preferences || {}), notes || '']
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create guest error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/guests/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, email, phone, nationality, vip_level, total_stays, preferences, notes } = req.body;

    const prefValue = preferences ? JSON.stringify(preferences) : null;

    const result = await pool.query(
      `UPDATE guests SET name = COALESCE($1, name), email = COALESCE($2, email),
       phone = COALESCE($3, phone), nationality = COALESCE($4, nationality), vip_level = COALESCE($5, vip_level),
       total_stays = COALESCE($6, total_stays), preferences = COALESCE($7::jsonb, preferences), notes = COALESCE($8, notes)
       WHERE id = $9 RETURNING *`,
      [name, email, phone, nationality, vip_level, total_stays, prefValue, notes, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Guest not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update guest error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/guests/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM guests WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Guest not found.' });
    }
    res.json({ message: 'Guest deleted successfully.', guest: result.rows[0] });
  } catch (err) {
    console.error('Delete guest error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/guests/:id/ai-personalize
router.post('/:id/ai-personalize', async (req, res) => {
  try {
    const guest = await pool.query('SELECT * FROM guests WHERE id = $1', [req.params.id]);
    if (guest.rows.length === 0) {
      return res.status(404).json({ error: 'Guest not found.' });
    }

    const personalization = await personalizeGuestExperience(guest.rows[0]);
    res.json({ success: true, guest: guest.rows[0], personalization });
  } catch (err) {
    console.error('AI personalization error:', err);
    res.status(500).json({ error: 'AI personalization failed. ' + err.message });
  }
});

module.exports = router;
