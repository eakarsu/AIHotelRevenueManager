const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/rooms
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM rooms ORDER BY room_number ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Get rooms error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/rooms/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM rooms WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get room error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/rooms
router.post('/', async (req, res) => {
  try {
    const { room_number, type, floor, capacity, base_price, status, amenities, description } = req.body;

    if (!room_number || !type) {
      return res.status(400).json({ error: 'Room number and type are required.' });
    }

    const result = await pool.query(
      `INSERT INTO rooms (room_number, type, floor, capacity, base_price, status, amenities, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [room_number, type, floor || 1, capacity || 2, base_price || 100, status || 'available', amenities || '', description || '']
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create room error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/rooms/:id
router.put('/:id', async (req, res) => {
  try {
    const { room_number, type, floor, capacity, base_price, status, amenities, description } = req.body;

    const result = await pool.query(
      `UPDATE rooms SET room_number = COALESCE($1, room_number), type = COALESCE($2, type),
       floor = COALESCE($3, floor), capacity = COALESCE($4, capacity), base_price = COALESCE($5, base_price),
       status = COALESCE($6, status), amenities = COALESCE($7, amenities), description = COALESCE($8, description)
       WHERE id = $9 RETURNING *`,
      [room_number, type, floor, capacity, base_price, status, amenities, description, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update room error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/rooms/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM rooms WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found.' });
    }
    res.json({ message: 'Room deleted successfully.', room: result.rows[0] });
  } catch (err) {
    console.error('Delete room error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
