// server/routes/expenses.js
const express = require('express');
const { pool, isHealthy } = require('../db/config');
const router = express.Router();

// Mock Data for "Dev Mock Mode"
const MOCK_EXPENSES = [
  { id: 1, trip_id: 1, payer_id: 1, amount: 450.00, currency: 'INR', category: 'Food', description: 'Gozan Shack Lunch', expense_date: '2026-04-22', payer_name: 'Test User' },
  { id: 2, trip_id: 1, payer_id: 2, amount: 1200.00, currency: 'INR', category: 'Transport', description: 'Taxi to Panaji', expense_date: '2026-04-22', payer_name: 'Rahul S.' },
  { id: 3, trip_id: 1, payer_id: 1, amount: 8500.00, currency: 'INR', category: 'Hotel', description: 'Beachfront Resort Deposit', expense_date: '2026-04-21', payer_name: 'Test User' },
  { id: 4, trip_id: 1, payer_id: 3, amount: 350.00, currency: 'INR', category: 'Other', description: 'Souvenirs', expense_date: '2026-04-21', payer_name: 'Sneha K.' },
];

// Get all expenses for a trip
router.get('/trip/:tripId', async (req, res) => {
  const { tripId } = req.params;
  
  if (!isHealthy()) {
    console.log('🔌 Dev Mock Mode: Serving sample expenses (No DB connection)');
    return res.json(MOCK_EXPENSES);
  }

  try {
    const [rows] = await pool.query(
      'SELECT e.*, u.name as payer_name FROM expenses e LEFT JOIN users u ON e.payer_id = u.id WHERE e.trip_id = ? ORDER BY e.expense_date DESC',
      [tripId]
    );
    res.json(rows);
  } catch (err) {
    console.error('❌ GET Expenses Error:', err.message);
    res.json(MOCK_EXPENSES); // Fallback to mocks even on query error in dev
  }
});

// Add a new expense
router.post('/', async (req, res) => {
  const { trip_id, payer_id, amount, currency, category, description, expense_date } = req.body;
  
  if (!isHealthy()) {
    console.log('🔌 Dev Mock Mode: Simulating expense addition (No DB connection)');
    return res.status(201).json({ id: Date.now(), message: 'Mock Expense added successfully' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO expenses (trip_id, payer_id, amount, currency, category, description, expense_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [trip_id, payer_id || 1, amount, currency || 'INR', category, description, expense_date]
    );
    res.status(201).json({ id: result.insertId, message: 'Expense added successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add expense', details: err.message });
  }
});

module.exports = router;
