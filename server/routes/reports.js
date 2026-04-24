const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/reports/revenue - Revenue report with date filters
router.get('/revenue', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    let query = `SELECT date, revenue, occupancy_rate, adr, revpar, total_bookings, cancellations, channel, room_type FROM analytics`;
    const params = [];

    if (start_date && end_date) {
      query += ` WHERE date >= $1 AND date <= $2`;
      params.push(start_date, end_date);
    } else if (start_date) {
      query += ` WHERE date >= $1`;
      params.push(start_date);
    } else if (end_date) {
      query += ` WHERE date <= $1`;
      params.push(end_date);
    }

    query += ' ORDER BY date DESC';
    const result = await pool.query(query, params);

    const totalRevenue = result.rows.reduce((sum, r) => sum + Number(r.revenue || 0), 0);
    const avgOccupancy = result.rows.length > 0
      ? result.rows.reduce((sum, r) => sum + Number(r.occupancy_rate || 0), 0) / result.rows.length
      : 0;
    const avgAdr = result.rows.length > 0
      ? result.rows.reduce((sum, r) => sum + Number(r.adr || 0), 0) / result.rows.length
      : 0;
    const totalBookings = result.rows.reduce((sum, r) => sum + Number(r.total_bookings || 0), 0);
    const totalCancellations = result.rows.reduce((sum, r) => sum + Number(r.cancellations || 0), 0);

    res.json({
      summary: { totalRevenue, avgOccupancy, avgAdr, totalBookings, totalCancellations, records: result.rows.length },
      data: result.rows,
    });
  } catch (err) {
    console.error('Revenue report error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/reports/reservations - Reservations report
router.get('/reservations', async (req, res) => {
  try {
    const { start_date, end_date, status } = req.query;
    let query = 'SELECT * FROM reservations WHERE 1=1';
    const params = [];

    if (start_date) {
      params.push(start_date);
      query += ` AND check_in >= $${params.length}`;
    }
    if (end_date) {
      params.push(end_date);
      query += ` AND check_out <= $${params.length}`;
    }
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    query += ' ORDER BY check_in ASC';
    const result = await pool.query(query, params);

    const totalRevenue = result.rows.reduce((sum, r) => sum + Number(r.total_price || 0), 0);
    const totalNights = result.rows.reduce((sum, r) => sum + Number(r.nights || 0), 0);

    res.json({
      summary: { totalReservations: result.rows.length, totalRevenue, totalNights },
      data: result.rows,
    });
  } catch (err) {
    console.error('Reservations report error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/reports/rooms - Room occupancy report
router.get('/rooms', async (req, res) => {
  try {
    const rooms = await pool.query('SELECT * FROM rooms ORDER BY room_number');
    const reservations = await pool.query('SELECT room_number, COUNT(*) as booking_count, SUM(total_price) as total_revenue FROM reservations GROUP BY room_number');

    const resByRoom = {};
    reservations.rows.forEach(r => { resByRoom[r.room_number] = r; });

    const data = rooms.rows.map(room => ({
      ...room,
      booking_count: Number(resByRoom[room.room_number]?.booking_count || 0),
      total_revenue: Number(resByRoom[room.room_number]?.total_revenue || 0),
    }));

    const statusCounts = {};
    rooms.rows.forEach(r => { statusCounts[r.status] = (statusCounts[r.status] || 0) + 1; });

    res.json({
      summary: { totalRooms: rooms.rows.length, statusCounts },
      data,
    });
  } catch (err) {
    console.error('Rooms report error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/reports/billing - Billing/payment report
router.get('/billing', async (req, res) => {
  try {
    const { start_date, end_date, payment_status } = req.query;
    let query = 'SELECT * FROM invoices WHERE 1=1';
    const params = [];

    if (start_date) {
      params.push(start_date);
      query += ` AND created_at >= $${params.length}`;
    }
    if (end_date) {
      params.push(end_date);
      query += ` AND created_at <= $${params.length}`;
    }
    if (payment_status) {
      params.push(payment_status);
      query += ` AND payment_status = $${params.length}`;
    }

    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);

    const totalBilled = result.rows.reduce((sum, r) => sum + Number(r.total_amount || 0), 0);
    const paidAmount = result.rows.filter(r => r.payment_status === 'Paid').reduce((sum, r) => sum + Number(r.total_amount || 0), 0);
    const pendingAmount = result.rows.filter(r => r.payment_status === 'Pending').reduce((sum, r) => sum + Number(r.total_amount || 0), 0);

    res.json({
      summary: { totalInvoices: result.rows.length, totalBilled, paidAmount, pendingAmount },
      data: result.rows,
    });
  } catch (err) {
    console.error('Billing report error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/reports/export/:type - CSV export
router.get('/export/:type', async (req, res) => {
  try {
    const { type } = req.params;
    let result;
    let filename;

    switch (type) {
      case 'reservations':
        result = await pool.query('SELECT guest_name, guest_email, room_number, room_type, check_in, check_out, nights, total_price, channel, status, special_requests FROM reservations ORDER BY check_in DESC');
        filename = 'reservations_export.csv';
        break;
      case 'rooms':
        result = await pool.query('SELECT room_number, type, floor, capacity, base_price, status, amenities, description FROM rooms ORDER BY room_number');
        filename = 'rooms_export.csv';
        break;
      case 'revenue':
        result = await pool.query('SELECT date, revenue, occupancy_rate, adr, revpar, total_bookings, cancellations, channel, room_type FROM analytics ORDER BY date DESC');
        filename = 'revenue_export.csv';
        break;
      case 'billing':
        result = await pool.query('SELECT invoice_number, guest_name, guest_email, room_number, check_in, check_out, nights, room_charges, tax_amount, additional_charges, discounts, total_amount, payment_method, payment_status, created_at FROM invoices ORDER BY created_at DESC');
        filename = 'billing_export.csv';
        break;
      case 'guests':
        result = await pool.query('SELECT name, email, phone, nationality, vip_level, total_stays FROM guests ORDER BY name');
        filename = 'guests_export.csv';
        break;
      case 'staff':
        result = await pool.query('SELECT name, email, phone, role, department, shift, status, hire_date, salary, performance_score FROM staff ORDER BY name');
        filename = 'staff_export.csv';
        break;
      default:
        return res.status(400).json({ error: 'Invalid export type.' });
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No data to export.' });
    }

    const headers = Object.keys(result.rows[0]);
    const csvRows = [headers.join(',')];

    result.rows.forEach(row => {
      const values = headers.map(h => {
        const val = row[h] === null || row[h] === undefined ? '' : String(row[h]);
        return val.includes(',') || val.includes('"') || val.includes('\n')
          ? `"${val.replace(/"/g, '""')}"`
          : val;
      });
      csvRows.push(values.join(','));
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvRows.join('\n'));
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
