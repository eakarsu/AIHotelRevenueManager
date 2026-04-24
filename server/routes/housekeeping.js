const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/housekeeping
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM housekeeping_tasks ORDER BY scheduled_date ASC, priority ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Get housekeeping tasks error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/housekeeping/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM housekeeping_tasks WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Housekeeping task not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get housekeeping task error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/housekeeping
router.post('/', async (req, res) => {
  try {
    const { room_number, task_type, assigned_to, priority, status, scheduled_date, scheduled_time, estimated_duration, notes } = req.body;

    if (!room_number || !task_type) {
      return res.status(400).json({ error: 'Room number and task type are required.' });
    }

    const result = await pool.query(
      `INSERT INTO housekeeping_tasks (room_number, task_type, assigned_to, priority, status, scheduled_date, scheduled_time, estimated_duration, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [room_number, task_type, assigned_to || '', priority || 'medium', status || 'pending', scheduled_date || new Date().toISOString().split('T')[0], scheduled_time || '09:00', estimated_duration || 30, notes || '']
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create housekeeping task error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/housekeeping/:id
router.put('/:id', async (req, res) => {
  try {
    const { room_number, task_type, assigned_to, priority, status, scheduled_date, scheduled_time, estimated_duration, notes } = req.body;

    const result = await pool.query(
      `UPDATE housekeeping_tasks SET room_number = COALESCE($1, room_number), task_type = COALESCE($2, task_type),
       assigned_to = COALESCE($3, assigned_to), priority = COALESCE($4, priority), status = COALESCE($5, status),
       scheduled_date = COALESCE($6, scheduled_date), scheduled_time = COALESCE($7, scheduled_time),
       estimated_duration = COALESCE($8, estimated_duration), notes = COALESCE($9, notes)
       WHERE id = $10 RETURNING *`,
      [room_number, task_type, assigned_to, priority, status, scheduled_date, scheduled_time, estimated_duration, notes, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Housekeeping task not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update housekeeping task error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/housekeeping/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM housekeeping_tasks WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Housekeeping task not found.' });
    }
    res.json({ message: 'Housekeeping task deleted successfully.', task: result.rows[0] });
  } catch (err) {
    console.error('Delete housekeeping task error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
