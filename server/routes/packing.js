// server/routes/packing.js
const express = require('express');
const { pool, isHealthy } = require('../db/config');
const router = express.Router();

// Mock Data for "Dev Mock Mode" fallback
let MOCK_PACKING = [
  { id: 1, trip_id: 1, name: 'Passport & Visas', category: 'Documents', packed: true },
  { id: 2, trip_id: 1, name: 'Power Bank', category: 'Electronics', packed: true },
  { id: 3, trip_id: 1, name: 'Beach Towel', category: 'Clothing', packed: false },
  { id: 4, trip_id: 1, name: 'First Aid Kit', category: 'Meds', packed: false },
  { id: 5, trip_id: 1, name: 'Sunscreen', category: 'Toiletries', packed: false },
];

// Get packing items for a trip
router.get('/trip/:tripId', async (req, res) => {
  const { tripId } = req.params;

  if (!isHealthy()) {
    console.log('🔌 Dev Mock Mode: Serving sample packing checklist (No DB connection)');
    return res.json(MOCK_PACKING);
  }

  try {
    const [rows] = await pool.query(
      'SELECT * FROM packing_items WHERE trip_id = ? ORDER BY created_at ASC',
      [tripId]
    );
    res.json(rows);
  } catch (err) {
    console.error('❌ GET Packing Error:', err.message);
    res.json(MOCK_PACKING);
  }
});

// Add a packing item
router.post('/', async (req, res) => {
  const { trip_id, name, category } = req.body;

  if (!isHealthy()) {
    console.log('🔌 Dev Mock Mode: Simulating packing item addition (No DB connection)');
    const newItem = { id: Date.now(), trip_id, name, category, packed: false };
    MOCK_PACKING.push(newItem);
    return res.status(201).json(newItem);
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO packing_items (trip_id, name, category, packed) VALUES (?, ?, ?, false)',
      [trip_id, name, category]
    );
    res.status(201).json({ id: result.insertId, trip_id, name, category, packed: false });
  } catch (err) {
    console.error('❌ POST Packing Error:', err.message);
    res.status(500).json({ error: 'Failed to add packing item', details: err.message });
  }
});

// Toggle a packing item status
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { packed } = req.body;

  if (!isHealthy()) {
    console.log('🔌 Dev Mock Mode: Simulating packing item update (No DB connection)');
    MOCK_PACKING = MOCK_PACKING.map(item => item.id == id ? { ...item, packed } : item);
    return res.json({ message: 'Mock update success' });
  }

  try {
    await pool.query(
      'UPDATE packing_items SET packed = ? WHERE id = ?',
      [packed ? 1 : 0, id]
    );
    res.json({ message: 'Packing item status updated successfully' });
  } catch (err) {
    console.error('❌ PUT Packing Error:', err.message);
    res.status(500).json({ error: 'Failed to update packing item', details: err.message });
  }
});

// Delete a packing item
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  if (!isHealthy()) {
    console.log('🔌 Dev Mock Mode: Simulating packing item deletion (No DB connection)');
    MOCK_PACKING = MOCK_PACKING.filter(item => item.id != id);
    return res.json({ message: 'Mock delete success' });
  }

  try {
    await pool.query(
      'DELETE FROM packing_items WHERE id = ?',
      [id]
    );
    res.json({ message: 'Packing item deleted successfully' });
  } catch (err) {
    console.error('❌ DELETE Packing Error:', err.message);
    res.status(500).json({ error: 'Failed to delete packing item', details: err.message });
  }
});

module.exports = router;
