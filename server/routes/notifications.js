const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/notifications
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM notifications ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/notifications/unread-count
router.get('/unread-count', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM notifications WHERE is_read = false');
    res.json({ count: Number(result.rows[0].count) });
  } catch (err) {
    console.error('Unread count error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/notifications
router.post('/', async (req, res) => {
  try {
    const { title, message, type, priority, category } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required.' });
    }

    const result = await pool.query(
      `INSERT INTO notifications (title, message, type, priority, category)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [title, message, type || 'info', priority || 'medium', category || 'general']
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create notification error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/notifications/:id/read - Mark as read
router.put('/:id/read', async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/notifications/read-all - Mark all as read
router.put('/read-all', async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = true WHERE is_read = false');
    res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    console.error('Mark all read error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/notifications/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM notifications WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found.' });
    }
    res.json({ message: 'Notification deleted.', notification: result.rows[0] });
  } catch (err) {
    console.error('Delete notification error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/notifications/generate - Auto-generate alerts based on current data
router.post('/generate', async (req, res) => {
  try {
    const alerts = [];

    // Check low occupancy rooms
    const rooms = await pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = \'available\') as available FROM rooms');
    const total = Number(rooms.rows[0].total);
    const available = Number(rooms.rows[0].available);
    if (total > 0) {
      const occupancyRate = ((total - available) / total * 100).toFixed(1);
      if (occupancyRate < 50) {
        alerts.push({ title: 'Low Occupancy Alert', message: `Current occupancy is only ${occupancyRate}%. Consider running promotions or adjusting prices.`, type: 'warning', priority: 'high', category: 'occupancy' });
      }
    }

    // Check pending reservations
    const pending = await pool.query("SELECT COUNT(*) FROM reservations WHERE status = 'Pending'");
    const pendingCount = Number(pending.rows[0].count);
    if (pendingCount > 0) {
      alerts.push({ title: 'Pending Reservations', message: `${pendingCount} reservation(s) are pending confirmation.`, type: 'warning', priority: 'medium', category: 'reservations' });
    }

    // Check today's check-ins
    const today = new Date().toISOString().split('T')[0];
    const checkIns = await pool.query('SELECT COUNT(*) FROM reservations WHERE check_in::date = $1', [today]);
    const checkInCount = Number(checkIns.rows[0].count);
    if (checkInCount > 0) {
      alerts.push({ title: 'Today\'s Check-ins', message: `${checkInCount} guest(s) arriving today.`, type: 'info', priority: 'medium', category: 'reservations' });
    }

    // Check today's check-outs
    const checkOuts = await pool.query('SELECT COUNT(*) FROM reservations WHERE check_out::date = $1', [today]);
    const checkOutCount = Number(checkOuts.rows[0].count);
    if (checkOutCount > 0) {
      alerts.push({ title: 'Today\'s Check-outs', message: `${checkOutCount} guest(s) checking out today.`, type: 'info', priority: 'medium', category: 'reservations' });
    }

    // Check overdue maintenance
    const overdueMaint = await pool.query("SELECT COUNT(*) FROM maintenance_requests WHERE status != 'Completed' AND priority = 'High'");
    const overdueCount = Number(overdueMaint.rows[0].count);
    if (overdueCount > 0) {
      alerts.push({ title: 'High Priority Maintenance', message: `${overdueCount} high-priority maintenance request(s) still open.`, type: 'danger', priority: 'high', category: 'maintenance' });
    }

    // Check expiring promotions
    const expiring = await pool.query("SELECT COUNT(*) FROM promotions WHERE valid_until::date <= (CURRENT_DATE + INTERVAL '3 days') AND valid_until::date >= CURRENT_DATE AND is_active = true");
    const expiringCount = Number(expiring.rows[0].count);
    if (expiringCount > 0) {
      alerts.push({ title: 'Expiring Promotions', message: `${expiringCount} promotion(s) expiring within 3 days.`, type: 'warning', priority: 'medium', category: 'promotions' });
    }

    // Check unpaid invoices
    const unpaid = await pool.query("SELECT COUNT(*), COALESCE(SUM(total_amount), 0) as total FROM invoices WHERE payment_status = 'Pending'");
    const unpaidCount = Number(unpaid.rows[0].count);
    const unpaidTotal = Number(unpaid.rows[0].total);
    if (unpaidCount > 0) {
      alerts.push({ title: 'Unpaid Invoices', message: `${unpaidCount} unpaid invoice(s) totaling $${unpaidTotal.toFixed(2)}.`, type: 'warning', priority: 'high', category: 'billing' });
    }

    // Insert generated alerts
    for (const alert of alerts) {
      await pool.query(
        'INSERT INTO notifications (title, message, type, priority, category) VALUES ($1, $2, $3, $4, $5)',
        [alert.title, alert.message, alert.type, alert.priority, alert.category]
      );
    }

    res.json({ message: `Generated ${alerts.length} alert(s).`, alerts });
  } catch (err) {
    console.error('Generate alerts error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
