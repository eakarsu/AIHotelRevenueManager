const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/billing
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM invoices ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Get invoices error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/billing/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM invoices WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get invoice error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/billing
router.post('/', async (req, res) => {
  try {
    const { reservation_id, guest_name, guest_email, room_number, check_in, check_out, nights, room_charges, tax_rate, tax_amount, additional_charges, discounts, total_amount, payment_method, payment_status, notes } = req.body;

    if (!guest_name || !room_number || !total_amount) {
      return res.status(400).json({ error: 'Guest name, room number, and total amount are required.' });
    }

    const invoice_number = 'INV-' + Date.now().toString(36).toUpperCase();

    const result = await pool.query(
      `INSERT INTO invoices (invoice_number, reservation_id, guest_name, guest_email, room_number, check_in, check_out, nights, room_charges, tax_rate, tax_amount, additional_charges, discounts, total_amount, payment_method, payment_status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING *`,
      [invoice_number, reservation_id || null, guest_name, guest_email || '', room_number, check_in || null, check_out || null, nights || 1, room_charges || 0, tax_rate || 10, tax_amount || 0, additional_charges || 0, discounts || 0, total_amount, payment_method || 'Credit Card', payment_status || 'Pending', notes || '']
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create invoice error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/billing/:id
router.put('/:id', async (req, res) => {
  try {
    const { guest_name, guest_email, room_number, check_in, check_out, nights, room_charges, tax_rate, tax_amount, additional_charges, discounts, total_amount, payment_method, payment_status, notes } = req.body;

    const result = await pool.query(
      `UPDATE invoices SET guest_name = COALESCE($1, guest_name), guest_email = COALESCE($2, guest_email),
       room_number = COALESCE($3, room_number), check_in = COALESCE($4, check_in),
       check_out = COALESCE($5, check_out), nights = COALESCE($6, nights),
       room_charges = COALESCE($7, room_charges), tax_rate = COALESCE($8, tax_rate),
       tax_amount = COALESCE($9, tax_amount), additional_charges = COALESCE($10, additional_charges),
       discounts = COALESCE($11, discounts), total_amount = COALESCE($12, total_amount),
       payment_method = COALESCE($13, payment_method), payment_status = COALESCE($14, payment_status),
       notes = COALESCE($15, notes)
       WHERE id = $16 RETURNING *`,
      [guest_name, guest_email, room_number, check_in, check_out, nights, room_charges, tax_rate, tax_amount, additional_charges, discounts, total_amount, payment_method, payment_status, notes, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update invoice error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/billing/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM invoices WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found.' });
    }
    res.json({ message: 'Invoice deleted successfully.', invoice: result.rows[0] });
  } catch (err) {
    console.error('Delete invoice error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
