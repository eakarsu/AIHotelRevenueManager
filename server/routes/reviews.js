const express = require('express');
const router = express.Router();
const pool = require('../db');
const { analyzeSentiment } = require('../services/openrouter');

// GET /api/reviews
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM reviews ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Get reviews error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/reviews/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM reviews WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get review error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/reviews
router.post('/', async (req, res) => {
  try {
    const { guest_name, room_number, rating, title, comment, sentiment, stay_date, response } = req.body;

    if (!guest_name || !rating || !comment) {
      return res.status(400).json({ error: 'Guest name, rating, and comment are required.' });
    }

    const result = await pool.query(
      `INSERT INTO reviews (guest_name, room_number, rating, title, comment, sentiment, stay_date, response)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [guest_name, room_number || '', rating, title || '', comment, sentiment || 'pending', stay_date || new Date().toISOString().split('T')[0], response || '']
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create review error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/reviews/:id
router.put('/:id', async (req, res) => {
  try {
    const { guest_name, room_number, rating, title, comment, sentiment, stay_date, response } = req.body;

    const result = await pool.query(
      `UPDATE reviews SET guest_name = COALESCE($1, guest_name), room_number = COALESCE($2, room_number),
       rating = COALESCE($3, rating), title = COALESCE($4, title), comment = COALESCE($5, comment),
       sentiment = COALESCE($6, sentiment), stay_date = COALESCE($7, stay_date), response = COALESCE($8, response)
       WHERE id = $9 RETURNING *`,
      [guest_name, room_number, rating, title, comment, sentiment, stay_date, response, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update review error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/reviews/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM reviews WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found.' });
    }
    res.json({ message: 'Review deleted successfully.', review: result.rows[0] });
  } catch (err) {
    console.error('Delete review error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/reviews/:id/ai-sentiment
router.post('/:id/ai-sentiment', async (req, res) => {
  try {
    const review = await pool.query('SELECT * FROM reviews WHERE id = $1', [req.params.id]);
    if (review.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found.' });
    }

    const sentimentAnalysis = await analyzeSentiment(review.rows[0].comment);

    // Update the review sentiment in database
    const overallSentiment = sentimentAnalysis.overall_sentiment || 'neutral';
    await pool.query('UPDATE reviews SET sentiment = $1 WHERE id = $2', [overallSentiment, req.params.id]);

    res.json({ success: true, review: review.rows[0], sentiment_analysis: sentimentAnalysis });
  } catch (err) {
    console.error('AI sentiment analysis error:', err);
    res.status(500).json({ error: 'AI sentiment analysis failed. ' + err.message });
  }
});

module.exports = router;
