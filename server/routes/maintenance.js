const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/maintenance
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM maintenance_requests ORDER BY reported_date DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Get maintenance requests error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/maintenance/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM maintenance_requests WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Maintenance request not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get maintenance request error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/maintenance
router.post('/', async (req, res) => {
  try {
    const { room_number, category, title, description, reported_by, assigned_to, priority, status, estimated_cost, actual_cost, reported_date, completed_date, notes } = req.body;

    if (!room_number || !title || !category) {
      return res.status(400).json({ error: 'Room number, category, and title are required.' });
    }

    const result = await pool.query(
      `INSERT INTO maintenance_requests (room_number, category, title, description, reported_by, assigned_to, priority, status, estimated_cost, actual_cost, reported_date, completed_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [room_number, category, title, description || '', reported_by || '', assigned_to || '', priority || 'Medium', status || 'Open', estimated_cost || 0, actual_cost || 0, reported_date || new Date().toISOString().split('T')[0], completed_date || null, notes || '']
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create maintenance request error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/maintenance/:id
router.put('/:id', async (req, res) => {
  try {
    const { room_number, category, title, description, reported_by, assigned_to, priority, status, estimated_cost, actual_cost, reported_date, completed_date, notes } = req.body;

    const result = await pool.query(
      `UPDATE maintenance_requests SET room_number = COALESCE($1, room_number), category = COALESCE($2, category),
       title = COALESCE($3, title), description = COALESCE($4, description),
       reported_by = COALESCE($5, reported_by), assigned_to = COALESCE($6, assigned_to),
       priority = COALESCE($7, priority), status = COALESCE($8, status),
       estimated_cost = COALESCE($9, estimated_cost), actual_cost = COALESCE($10, actual_cost),
       reported_date = COALESCE($11, reported_date), completed_date = COALESCE($12, completed_date),
       notes = COALESCE($13, notes)
       WHERE id = $14 RETURNING *`,
      [room_number, category, title, description, reported_by, assigned_to, priority, status, estimated_cost, actual_cost, reported_date, completed_date, notes, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Maintenance request not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update maintenance request error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/maintenance/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM maintenance_requests WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Maintenance request not found.' });
    }
    res.json({ message: 'Maintenance request deleted successfully.', maintenance_request: result.rows[0] });
  } catch (err) {
    console.error('Delete maintenance request error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
