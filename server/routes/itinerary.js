// server/routes/itinerary.js
const express = require('express');
const { pool, isHealthy } = require('../db/config');
const router = express.Router();

// Mock Data for "Dev Mock Mode"
const MOCK_ITINERARY = [
  { id: 1, day: 1, time: '09:00 AM', name: 'Arrival & Check-in', type: 'Transport', location: 'Goa Airport', status: 'completed' },
  { id: 2, day: 1, time: '01:00 PM', name: 'Lunch at Beach Shack', type: 'Food', location: 'Baga Beach', status: 'completed' },
  { id: 3, day: 1, time: '04:00 PM', name: 'Sunset Yoga', type: 'Activity', location: 'Anjuna Cliff', status: 'upcoming' },
];

const PLACE_DATABASE = {
  'Goa': [
    { name: 'Baga Beach', type: 'Beach', lat: 15.5554, lng: 73.7514, image_url: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800', rating: 4.6, time: '3 hrs', description: 'Popular beach with water sports and nightlife' },
    { name: 'Palolem Beach', type: 'Beach', lat: 15.0100, lng: 74.0233, image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', rating: 4.7, time: '4 hrs', description: 'Crescent shaped beach perfect for swimming' },
  ],
};

// Get place suggestions
router.get('/suggest/:destination', (req, res) => {
  const dest = req.params.destination;
  let places = PLACE_DATABASE[dest] || PLACE_DATABASE['Goa'];
  res.json(places);
});

// Get itinerary for a trip
router.get('/trip/:tripId', async (req, res) => {
  if (!isHealthy()) {
    console.log('🔌 Dev Mock Mode: Serving sample itinerary (No DB connection)');
    return res.json(MOCK_ITINERARY);
  }

  try {
    const [rows] = await pool.query(
      'SELECT * FROM itinerary_items WHERE trip_id = ? ORDER BY day_number ASC, time_slot ASC', 
      [req.params.tripId]
    );
    
    // Map database columns to frontend keys
    const mapped = rows.map(item => ({
      id: item.id,
      trip_id: item.trip_id,
      day: item.day_number,
      time: item.time_slot,
      name: item.name,
      type: item.type,
      location: item.name, // Fallback to name as location
      status: item.status === 'visited' ? 'completed' : 'upcoming'
    }));
    
    res.json(mapped);
  } catch (err) {
    console.error('❌ GET Itinerary Error:', err.message);
    res.json(MOCK_ITINERARY);
  }
});

// Add item to itinerary
router.post('/', async (req, res) => {
  if (!isHealthy()) {
    console.log('🔌 Dev Mock Mode: Simulating itinerary addition (No DB connection)');
    return res.status(201).json({ id: Date.now() });
  }

  const { trip_id, name, type, day_number, time_slot, lat, lng, image_url, status } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO itinerary_items (trip_id, name, type, day_number, time_slot, lat, lng, image_url, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [trip_id, name, type || 'Place', day_number || 1, time_slot || '12:00 PM', lat, lng, image_url, status || 'selected']
    );
    res.status(201).json({ 
      id: result.insertId, 
      trip_id, 
      name, 
      type, 
      day: day_number, 
      time: time_slot,
      location: name,
      status: 'upcoming' 
    });
  } catch (err) {
    console.error('❌ POST Itinerary Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
