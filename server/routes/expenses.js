// server/routes/expenses.js
const express = require('express');
const { pool, isHealthy } = require('../db/config');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const fs = require('fs');
const router = express.Router();

const upload = multer({ dest: 'uploads/' });

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
    const parsedRows = rows.map(r => {
      if (typeof r.split_with === 'string') {
        try {
          r.split_with = JSON.parse(r.split_with);
        } catch (e) {
          r.split_with = [];
        }
      }
      return r;
    });
    res.json(parsedRows);
  } catch (err) {
    console.error('❌ GET Expenses Error:', err.message);
    res.json(MOCK_EXPENSES); // Fallback to mocks even on query error in dev
  }
});

// Add a new expense
router.post('/', async (req, res) => {
  const { trip_id, payer_id, amount, currency, category, description, expense_date, split_with } = req.body;
  
  if (!isHealthy()) {
    console.log('🔌 Dev Mock Mode: Simulating expense addition (No DB connection)');
    return res.status(201).json({ id: Date.now(), message: 'Mock Expense added successfully' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO expenses (trip_id, payer_id, amount, currency, category, description, expense_date, split_with) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [trip_id, payer_id || 1, amount, currency || 'INR', category, description, expense_date, split_with ? JSON.stringify(split_with) : null]
    );
    res.status(201).json({ id: result.insertId, message: 'Expense added successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add expense', details: err.message });
  }
});

// OCR Receipt Scanning Route
router.post('/ocr', upload.single('receipt'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  try {
    const { data: { text } } = await Tesseract.recognize(req.file.path, 'eng');
    // Clean up the uploaded file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Failed to clean up upload:', err);
    });
    res.json({ extractedText: text });
  } catch (err) {
    console.error('❌ OCR Error:', err.message);
    res.status(500).json({ error: 'Failed to process image' });
  }
});

// Multi-currency Support Route
router.get('/convert', (req, res) => {
  const { amount, from, to } = req.query;
  
  if (!amount || !from || !to) {
    return res.status(400).json({ error: 'Missing required query parameters: amount, from, to' });
  }

  // Mock exchange rates to INR
  const mockRatesToINR = {
    USD: 83.0,
    EUR: 90.0,
    GBP: 105.0,
    AUD: 55.0,
    INR: 1.0
  };

  const fromCurrency = from.toUpperCase();
  const toCurrency = to.toUpperCase();
  
  const fromRate = mockRatesToINR[fromCurrency];
  const toRate = mockRatesToINR[toCurrency];

  if (!fromRate || !toRate) {
    return res.status(400).json({ error: 'Unsupported currency. Try USD, EUR, GBP, AUD, or INR.' });
  }

  const numAmount = parseFloat(amount);
  if (isNaN(numAmount)) {
    return res.status(400).json({ error: 'Invalid amount provided.' });
  }

  // Convert to INR first, then to target currency
  const amountInINR = numAmount * fromRate;
  const convertedAmount = amountInINR / toRate;

  res.json({
    originalAmount: numAmount,
    convertedAmount: parseFloat(convertedAmount.toFixed(2)),
    from: fromCurrency,
    to: toCurrency,
    exchangeRate: parseFloat((fromRate / toRate).toFixed(4))
  });
});

module.exports = router;
