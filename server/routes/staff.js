const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/staff
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM staff ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Get staff error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/staff/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM staff WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Staff member not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get staff member error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/staff
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, role, department, shift, status, hire_date, salary, performance_score, notes } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({ error: 'Name, email, and role are required.' });
    }

    const result = await pool.query(
      `INSERT INTO staff (name, email, phone, role, department, shift, status, hire_date, salary, performance_score, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [name, email, phone || '', role, department || '', shift || 'Morning', status || 'Active', hire_date || new Date().toISOString().split('T')[0], salary || 0, performance_score || 0, notes || '']
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create staff error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/staff/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, email, phone, role, department, shift, status, hire_date, salary, performance_score, notes } = req.body;

    const result = await pool.query(
      `UPDATE staff SET name = COALESCE($1, name), email = COALESCE($2, email),
       phone = COALESCE($3, phone), role = COALESCE($4, role), department = COALESCE($5, department),
       shift = COALESCE($6, shift), status = COALESCE($7, status), hire_date = COALESCE($8, hire_date),
       salary = COALESCE($9, salary), performance_score = COALESCE($10, performance_score),
       notes = COALESCE($11, notes)
       WHERE id = $12 RETURNING *`,
      [name, email, phone, role, department, shift, status, hire_date, salary, performance_score, notes, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Staff member not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update staff error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/staff/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM staff WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Staff member not found.' });
    }
    res.json({ message: 'Staff member deleted successfully.', staff: result.rows[0] });
  } catch (err) {
    console.error('Delete staff error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
