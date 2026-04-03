// server/routes/trips.js
const express = require('express');
const pool = require('../db/config');
const router = express.Router();

// Get all trips for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT t.*, tm.role FROM trips t 
       JOIN trip_members tm ON t.id = tm.trip_id 
       WHERE tm.user_id = ? ORDER BY t.created_at DESC`,
      [req.params.userId]
    );
    res.json(rows);
  } catch (err) {
    console.error('❌ GET Trips Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get single trip with budget info
router.get('/:tripId', async (req, res) => {
  try {
    const [trips] = await pool.query('SELECT * FROM trips WHERE id = ?', [req.params.tripId]);
    if (trips.length === 0) return res.status(404).json({ error: 'Trip not found' });

    const [expenses] = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as total_spent FROM expenses WHERE trip_id = ?',
      [req.params.tripId]
    );

    const trip = trips[0];
    trip.total_spent = parseFloat(expenses[0].total_spent);
    trip.remaining = parseFloat(trip.budget_total) - trip.total_spent;
    res.json(trip);
  } catch (err) {
    console.error('❌ GET Trip Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Create a new trip
router.post('/', async (req, res) => {
  const { name, destination, start_date, end_date, budget_total, trip_type, base_fuel_price, vehicle_mileage, creator_id } = req.body;
  try {
    const [result] = await pool.query(
      `INSERT INTO trips (name, destination, start_date, end_date, budget_total, trip_type, base_fuel_price, vehicle_mileage, creator_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, destination, start_date, end_date, budget_total || 0, trip_type || 'General', base_fuel_price || 100, vehicle_mileage || 15, creator_id || 1]
    );
    // Add creator as admin member
    await pool.query('INSERT INTO trip_members (trip_id, user_id, role) VALUES (?, ?, "admin")', [result.insertId, creator_id || 1]);
    res.status(201).json({ id: result.insertId, message: 'Trip created' });
  } catch (err) {
    console.error('❌ POST Trip Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
