// server/routes/expenses.js
const express = require('express');
const pool = require('../db/config');
const router = express.Router();

// Get all expenses for a trip
router.get('/trip/:tripId', async (req, res) => {
  const { tripId } = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT e.*, u.name as payer_name FROM expenses e LEFT JOIN users u ON e.payer_id = u.id WHERE e.trip_id = ? ORDER BY e.expense_date DESC',
      [tripId]
    );
    res.json(rows);
  } catch (err) {
    console.error('❌ GET Expenses Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch expenses', details: err.message });
  }
});

// Get expenses with location data (for map markers)
router.get('/trip/:tripId/geo', async (req, res) => {
  const { tripId } = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT id, amount, category, description, lat, lng, expense_date FROM expenses WHERE trip_id = ? AND lat IS NOT NULL AND lng IS NOT NULL',
      [tripId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch geo expenses', details: err.message });
  }
});

// Add a new expense
router.post('/', async (req, res) => {
  const { trip_id, payer_id, amount, currency, category, description, expense_date, lat, lng } = req.body;
  try {
    if (!trip_id || !amount || !category) {
      return res.status(400).json({ error: 'Missing required fields (trip_id, amount, category)' });
    }

    const [result] = await pool.query(
      'INSERT INTO expenses (trip_id, payer_id, amount, currency, category, description, expense_date, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [trip_id, payer_id || 1, amount, currency || 'INR', category, description, expense_date, lat || null, lng || null]
    );
    res.status(201).json({ id: result.insertId, message: 'Expense added successfully' });
  } catch (err) {
    console.error('❌ POST Expense Error:', err.message);
    res.status(500).json({ error: 'Failed to add expense', details: err.message });
  }
});

// Delete an expense
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM expenses WHERE id = ?', [id]);
    res.json({ message: 'Expense deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete expense', details: err.message });
  }
});

module.exports = router;
