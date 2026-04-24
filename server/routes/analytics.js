const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/analytics/summary - must be before /:id
router.get('/summary', async (req, res) => {
  try {
    const revenueResult = await pool.query('SELECT COALESCE(SUM(revenue), 0) as total_revenue FROM analytics');
    const occupancyResult = await pool.query('SELECT COALESCE(AVG(occupancy_rate), 0) as avg_occupancy FROM analytics');
    const adrResult = await pool.query('SELECT COALESCE(AVG(adr), 0) as avg_adr FROM analytics');
    const revparResult = await pool.query('SELECT COALESCE(AVG(revpar), 0) as avg_revpar FROM analytics');
    const bookingsResult = await pool.query('SELECT COALESCE(SUM(total_bookings), 0) as total_bookings FROM analytics');
    const cancellationsResult = await pool.query('SELECT COALESCE(SUM(cancellations), 0) as total_cancellations FROM analytics');

    const recentResult = await pool.query('SELECT * FROM analytics ORDER BY date DESC LIMIT 30');

    const trend = recentResult.rows
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(r => ({
        date: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: parseFloat(r.revenue),
        occupancy: parseFloat(r.occupancy_rate),
      }));

    res.json({
      summary: {
        totalRevenue: parseFloat(revenueResult.rows[0].total_revenue),
        occupancyRate: parseFloat(occupancyResult.rows[0].avg_occupancy).toFixed(1),
        adr: parseFloat(adrResult.rows[0].avg_adr).toFixed(0),
        revpar: parseFloat(revparResult.rows[0].avg_revpar).toFixed(0),
        totalBookings: parseInt(bookingsResult.rows[0].total_bookings),
        totalCancellations: parseInt(cancellationsResult.rows[0].total_cancellations),
        trend,
      },
    });
  } catch (err) {
    console.error('Get analytics summary error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/analytics
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM analytics ORDER BY date DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Get analytics error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/analytics/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM analytics WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Analytics record not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get analytics record error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/analytics
router.post('/', async (req, res) => {
  try {
    const { date, revenue, occupancy_rate, adr, revpar, channel, room_type, total_bookings, cancellations, notes } = req.body;

    if (!date) {
      return res.status(400).json({ error: 'Date is required.' });
    }

    const result = await pool.query(
      `INSERT INTO analytics (date, revenue, occupancy_rate, adr, revpar, channel, room_type, total_bookings, cancellations, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [date, revenue || 0, occupancy_rate || 0, adr || 0, revpar || 0, channel || 'all', room_type || 'all', total_bookings || 0, cancellations || 0, notes || '']
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create analytics record error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/analytics/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM analytics WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Analytics record not found.' });
    }
    res.json({ message: 'Analytics record deleted successfully.', record: result.rows[0] });
  } catch (err) {
    console.error('Delete analytics record error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
