const express = require('express');
const router = express.Router();
const pool = require('../db');
const { generateForecast } = require('../services/openrouter');

// GET /api/forecasting
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM forecasts ORDER BY forecast_date DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Get forecasts error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/forecasting/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM forecasts WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Forecast not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get forecast error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/forecasting
router.post('/', async (req, res) => {
  try {
    const { forecast_date, period, predicted_occupancy, predicted_revenue, predicted_adr, confidence_score, factors, actual_occupancy, actual_revenue, variance, notes } = req.body;

    if (!forecast_date || !period) {
      return res.status(400).json({ error: 'Forecast date and period are required.' });
    }

    const result = await pool.query(
      `INSERT INTO forecasts (forecast_date, period, predicted_occupancy, predicted_revenue, predicted_adr, confidence_score, factors, actual_occupancy, actual_revenue, variance, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [forecast_date, period, predicted_occupancy || 0, predicted_revenue || 0, predicted_adr || 0, confidence_score || 0, factors || '', actual_occupancy || null, actual_revenue || null, variance || null, notes || '']
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create forecast error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/forecasting/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM forecasts WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Forecast not found.' });
    }
    res.json({ message: 'Forecast deleted successfully.', forecast: result.rows[0] });
  } catch (err) {
    console.error('Delete forecast error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/forecasting/ai-forecast
router.post('/ai-forecast', async (req, res) => {
  try {
    const historicalData = req.body;

    if (!historicalData || Object.keys(historicalData).length === 0) {
      const analytics = await pool.query('SELECT * FROM analytics ORDER BY date DESC LIMIT 30');
      const reservations = await pool.query('SELECT * FROM reservations ORDER BY check_in DESC LIMIT 30');
      const forecast = await generateForecast({ analytics: analytics.rows, reservations: reservations.rows });
      return res.json(forecast);
    }

    const forecast = await generateForecast(historicalData);
    res.json(forecast);
  } catch (err) {
    console.error('AI forecast error:', err);
    res.status(500).json({ error: 'AI forecasting failed.' });
  }
});

module.exports = router;
