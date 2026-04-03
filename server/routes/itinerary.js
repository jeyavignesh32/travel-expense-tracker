// server/routes/itinerary.js
const express = require('express');
const pool = require('../db/config');
const router = express.Router();

// Static place suggestions database (migrated from Flutter PlaceDatabase)
const PLACE_DATABASE = {
  'Goa': [
    { name: 'Baga Beach', type: 'Beach', lat: 15.5554, lng: 73.7514, image_url: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800', rating: 4.6, time: '3 hrs', description: 'Popular beach with water sports and nightlife' },
    { name: 'Fort Aguada', type: 'Historic', lat: 15.4929, lng: 73.7736, image_url: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800', rating: 4.5, time: '2 hrs', description: 'Well-preserved 17th century Portuguese fort' },
    { name: 'Palolem Beach', type: 'Beach', lat: 15.0100, lng: 74.0233, image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', rating: 4.7, time: '4 hrs', description: 'Crescent shaped beach perfect for swimming' },
    { name: 'Dudhsagar Falls', type: 'Nature', lat: 15.3144, lng: 74.3143, image_url: 'https://images.unsplash.com/photo-1432405972618-c6b0cfba8b13?w=800', rating: 4.8, time: '5 hrs', description: 'Stunning four-tiered waterfall on the Mandovi River' },
    { name: 'Basilica of Bom Jesus', type: 'Temple', lat: 15.5009, lng: 73.9116, image_url: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?w=800', rating: 4.4, time: '1.5 hrs', description: 'UNESCO World Heritage baroque architecture' },
  ],
  'Kodaikanal': [
    { name: 'Kodaikanal Lake', type: 'Nature', lat: 10.2283, lng: 77.4893, image_url: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800', rating: 4.5, time: '2 hrs', description: 'Star-shaped manmade lake surrounded by hills' },
    { name: 'Coaker Walk', type: 'Nature', lat: 10.2308, lng: 77.4938, image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', rating: 4.7, time: '1 hr', description: 'Scenic walking path with panoramic valley views' },
    { name: 'Bryant Park', type: 'Nature', lat: 10.2311, lng: 77.4887, image_url: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800', rating: 4.3, time: '1.5 hrs', description: 'Beautiful botanical garden with rare species' },
    { name: 'Pillar Rocks', type: 'Nature', lat: 10.2170, lng: 77.4690, image_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800', rating: 4.4, time: '1 hr', description: 'Three giant rock pillars reaching 400 feet' },
  ],
  'Ooty': [
    { name: 'Botanical Gardens', type: 'Nature', lat: 11.4152, lng: 76.7106, image_url: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800', rating: 4.5, time: '2 hrs', description: '55 acres of lush greenery and rare plants' },
    { name: 'Ooty Lake', type: 'Nature', lat: 11.4070, lng: 76.6930, image_url: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800', rating: 4.3, time: '2 hrs', description: 'Scenic lake with boating facilities' },
    { name: 'Doddabetta Peak', type: 'Adventure', lat: 11.4017, lng: 76.7358, image_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800', rating: 4.6, time: '3 hrs', description: 'Highest peak in the Nilgiri mountains at 8,650 ft' },
    { name: 'Tea Museum', type: 'Culture', lat: 11.3960, lng: 76.7230, image_url: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=800', rating: 4.2, time: '1 hr', description: 'History and process of Nilgiri tea production' },
  ],
  'Manali': [
    { name: 'Solang Valley', type: 'Adventure', lat: 32.3150, lng: 77.1572, image_url: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800', rating: 4.7, time: '4 hrs', description: 'Adventure sports hub with paragliding and skiing' },
    { name: 'Hadimba Temple', type: 'Temple', lat: 32.2433, lng: 77.1895, image_url: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?w=800', rating: 4.5, time: '1.5 hrs', description: 'Ancient cave temple surrounded by cedar forest' },
    { name: 'Rohtang Pass', type: 'Adventure', lat: 32.3722, lng: 77.2478, image_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800', rating: 4.8, time: '6 hrs', description: 'High mountain pass at 13,050 ft with snow views' },
  ],
  'Jaipur': [
    { name: 'Hawa Mahal', type: 'Historic', lat: 26.9239, lng: 75.8267, image_url: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=800', rating: 4.6, time: '1.5 hrs', description: 'Iconic Palace of Winds with 953 windows' },
    { name: 'Amber Fort', type: 'Historic', lat: 26.9855, lng: 75.8513, image_url: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800', rating: 4.8, time: '3 hrs', description: 'Majestic hilltop fort with stunning architecture' },
    { name: 'City Palace', type: 'Historic', lat: 26.9258, lng: 75.8237, image_url: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800', rating: 4.5, time: '2 hrs', description: 'Royal residence blending Mughal and Rajasthani styles' },
  ],
  'Chennai': [
    { name: 'Marina Beach', type: 'Beach', lat: 13.0500, lng: 80.2824, image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', rating: 4.3, time: '2 hrs', description: 'Second longest urban beach in the world' },
    { name: 'Kapaleeshwarar Temple', type: 'Temple', lat: 13.0339, lng: 80.2680, image_url: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?w=800', rating: 4.5, time: '1.5 hrs', description: 'Ancient Dravidian temple dedicated to Lord Shiva' },
    { name: 'Fort St. George', type: 'Historic', lat: 13.0798, lng: 80.2876, image_url: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800', rating: 4.2, time: '2 hrs', description: 'First English fortress in India, built in 1644' },
  ],
};

// Get place suggestions for a destination
router.get('/suggest/:destination', (req, res) => {
  const dest = req.params.destination;
  // Try exact match first, then partial match
  let places = PLACE_DATABASE[dest];
  if (!places) {
    const key = Object.keys(PLACE_DATABASE).find(k => dest.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(dest.toLowerCase()));
    places = key ? PLACE_DATABASE[key] : [
      { name: 'Local Market', type: 'Culture', lat: 0, lng: 0, image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800', rating: 4.2, time: '2 hrs', description: 'Explore local culture and cuisine' },
      { name: 'City Center', type: 'City', lat: 0, lng: 0, image_url: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800', rating: 4.0, time: '3 hrs', description: 'Explore the heart of the city' },
    ];
  }
  res.json(places);
});

// Get itinerary for a trip
router.get('/trip/:tripId', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM itinerary_items WHERE trip_id = ? ORDER BY created_at', [req.params.tripId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add item to itinerary
router.post('/', async (req, res) => {
  const { trip_id, name, type, lat, lng, image_url, status } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO itinerary_items (trip_id, name, type, lat, lng, image_url, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [trip_id, name, type || 'Place', lat, lng, image_url, status || 'selected']
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update itinerary item status
router.patch('/:id', async (req, res) => {
  try {
    await pool.query('UPDATE itinerary_items SET status = ? WHERE id = ?', [req.body.status, req.params.id]);
    res.json({ message: 'Updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
