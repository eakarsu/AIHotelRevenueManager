const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/reservations
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const countResult = await pool.query('SELECT COUNT(*) FROM reservations');
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query('SELECT * FROM reservations ORDER BY check_in ASC LIMIT $1 OFFSET $2', [limit, offset]);
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error('Get reservations error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/reservations/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM reservations WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reservation not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get reservation error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/reservations
router.post('/', async (req, res) => {
  try {
    const { guest_name, guest_email, room_number, room_type, check_in, check_out, nights, total_price, channel, status, special_requests } = req.body;

    if (!guest_name || !room_number || !check_in || !check_out) {
      return res.status(400).json({ error: 'Guest name, room number, check-in, and check-out dates are required.' });
    }

    const result = await pool.query(
      `INSERT INTO reservations (guest_name, guest_email, room_number, room_type, check_in, check_out, nights, total_price, channel, status, special_requests)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [guest_name, guest_email || '', room_number, room_type || 'Standard', check_in, check_out, nights || 1, total_price || 0, channel || 'Direct', status || 'confirmed', special_requests || '']
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create reservation error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/reservations/:id
router.put('/:id', async (req, res) => {
  try {
    const { guest_name, guest_email, room_number, room_type, check_in, check_out, nights, total_price, channel, status, special_requests } = req.body;

    const result = await pool.query(
      `UPDATE reservations SET guest_name = COALESCE($1, guest_name), guest_email = COALESCE($2, guest_email),
       room_number = COALESCE($3, room_number), room_type = COALESCE($4, room_type),
       check_in = COALESCE($5, check_in), check_out = COALESCE($6, check_out),
       nights = COALESCE($7, nights), total_price = COALESCE($8, total_price),
       channel = COALESCE($9, channel), status = COALESCE($10, status),
       special_requests = COALESCE($11, special_requests)
       WHERE id = $12 RETURNING *`,
      [guest_name, guest_email, room_number, room_type, check_in, check_out, nights, total_price, channel, status, special_requests, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reservation not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update reservation error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/reservations/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM reservations WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reservation not found.' });
    }
    res.json({ message: 'Reservation deleted successfully.', reservation: result.rows[0] });
  } catch (err) {
    console.error('Delete reservation error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
