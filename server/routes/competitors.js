const express = require('express');
const router = express.Router();
const pool = require('../db');
const { analyzeCompetitors } = require('../services/openrouter');

// GET /api/competitors
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM competitors ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Get competitors error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/competitors/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM competitors WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Competitor not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get competitor error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/competitors
router.post('/', async (req, res) => {
  try {
    const { name, location, star_rating, avg_rate, our_rate, rate_difference, occupancy_estimate, strengths, weaknesses, last_checked, source, notes } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Competitor name is required.' });
    }

    const result = await pool.query(
      `INSERT INTO competitors (name, location, star_rating, avg_rate, our_rate, rate_difference, occupancy_estimate, strengths, weaknesses, last_checked, source, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [name, location || '', star_rating || 3, avg_rate || 0, our_rate || 0, rate_difference || 0, occupancy_estimate || 0, strengths || '', weaknesses || '', last_checked || new Date().toISOString().split('T')[0], source || '', notes || '']
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create competitor error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/competitors/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, location, star_rating, avg_rate, our_rate, rate_difference, occupancy_estimate, strengths, weaknesses, last_checked, source, notes } = req.body;

    const result = await pool.query(
      `UPDATE competitors SET name = COALESCE($1, name), location = COALESCE($2, location),
       star_rating = COALESCE($3, star_rating), avg_rate = COALESCE($4, avg_rate),
       our_rate = COALESCE($5, our_rate), rate_difference = COALESCE($6, rate_difference),
       occupancy_estimate = COALESCE($7, occupancy_estimate), strengths = COALESCE($8, strengths),
       weaknesses = COALESCE($9, weaknesses), last_checked = COALESCE($10, last_checked),
       source = COALESCE($11, source), notes = COALESCE($12, notes)
       WHERE id = $13 RETURNING *`,
      [name, location, star_rating, avg_rate, our_rate, rate_difference, occupancy_estimate, strengths, weaknesses, last_checked, source, notes, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Competitor not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update competitor error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/competitors/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM competitors WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Competitor not found.' });
    }
    res.json({ message: 'Competitor deleted successfully.', competitor: result.rows[0] });
  } catch (err) {
    console.error('Delete competitor error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/competitors/ai-analyze
router.post('/ai-analyze', async (req, res) => {
  try {
    const competitorData = req.body;

    if (!competitorData || Object.keys(competitorData).length === 0) {
      const result = await pool.query('SELECT * FROM competitors ORDER BY name ASC');
      const analysis = await analyzeCompetitors(result.rows);
      return res.json(analysis);
    }

    const analysis = await analyzeCompetitors(competitorData);
    res.json(analysis);
  } catch (err) {
    console.error('AI competitor analysis error:', err);
    res.status(500).json({ error: 'AI analysis failed.' });
  }
});

module.exports = router;
