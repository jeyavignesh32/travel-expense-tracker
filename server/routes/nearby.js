const express = require('express');
const router = express.Router();
const https = require('https');

// Simple in-memory cache: key → { data, expiresAt }
const cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCacheKey(lat, lon, radius) {
  const rLat = parseFloat(lat).toFixed(3);
  const rLon = parseFloat(lon).toFixed(3);
  return `${rLat}:${rLon}:${radius}`;
}

/**
 * Fetch from Nominatim search API (no CORS issues, no rate limiting like Overpass)
 */
function nominatimSearch(lat, lon, radiusM, category) {
  return new Promise((resolve) => {
    const r = parseFloat(radiusM) / 111320; // convert metres to degrees (approx)
    const minLon = parseFloat(lon) - r;
    const maxLon = parseFloat(lon) + r;
    const minLat = parseFloat(lat) - r;
    const maxLat = parseFloat(lat) + r;

    const params = new URLSearchParams({
      q: category,
      format: 'jsonv2',
      limit: '50',
      bounded: '1',
      viewbox: `${minLon},${maxLat},${maxLon},${minLat}`,
      addressdetails: '1',
    });

    const options = {
      hostname: 'nominatim.openstreetmap.org',
      path: `/search?${params.toString()}`,
      method: 'GET',
      headers: {
        'User-Agent': 'TravelExpenseApp/1.0 (travel-expense-tracker)',
        'Accept-Language': 'en',
      },
    };

    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        try {
          const data = JSON.parse(raw);
          resolve(Array.isArray(data) ? data : []);
        } catch (e) {
          console.warn(`[Nominatim] Parse error for ${category}:`, e.message);
          resolve([]);
        }
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      console.warn(`[Nominatim] Timeout for category: ${category}`);
      resolve([]);
    });
    req.on('error', (e) => {
      console.warn(`[Nominatim] Error for ${category}:`, e.message);
      resolve([]);
    });
    req.end();
  });
}

// Categories to query from Nominatim
const PLACE_CATEGORIES = [
  { q: 'restaurant', type: 'restaurant' },
  { q: 'hospital', type: 'hospital' },
  { q: 'ATM', type: 'atm' },
  { q: 'bank', type: 'bank' },
  { q: 'pharmacy', type: 'pharmacy' },
  { q: 'hotel', type: 'hotel' },
  { q: 'cafe', type: 'cafe' },
  { q: 'supermarket', type: 'shop' },
  { q: 'petrol station', type: 'fuel' },
  { q: 'tourist attraction', type: 'attraction' },
];

function distanceM(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// GET /api/nearby/spots?lat=&lon=&radius=
router.get('/spots', async (req, res) => {
  const { lat, lon, radius } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: 'lat and lon required' });

  const r = Math.min(parseInt(radius) || 5000, 10000);
  const cacheKey = getCacheKey(lat, lon, r);

  // Serve from cache if fresh
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    console.log(`[Nearby] Cache HIT: ${cacheKey}`);
    res.setHeader('X-Cache', 'HIT');
    return res.json(cached.data);
  }

  console.log(`[Nearby] Fetching places near ${lat},${lon} r=${r}m`);

  try {
    // Fetch top 3 categories in parallel for speed, rest sequentially
    const [restaurants, hospitals, atms, banks, pharmacies, hotels, cafes, shops, fuel, attractions] = await Promise.all(
      PLACE_CATEGORIES.map(cat => nominatimSearch(lat, lon, r, cat.q))
    );

    const rawBatches = [
      { items: restaurants, type: 'restaurant' },
      { items: hospitals, type: 'hospital' },
      { items: atms, type: 'atm' },
      { items: banks, type: 'bank' },
      { items: pharmacies, type: 'pharmacy' },
      { items: hotels, type: 'hotel' },
      { items: cafes, type: 'cafe' },
      { items: shops, type: 'shop' },
      { items: fuel, type: 'fuel' },
      { items: attractions, type: 'attraction' },
    ];

    const seen = new Set();
    const places = [];

    for (const batch of rawBatches) {
      for (const item of batch.items) {
        if (!item.lat || !item.lon) continue;
        if (seen.has(item.osm_id)) continue;
        seen.add(item.osm_id);

        const dist = distanceM(parseFloat(lat), parseFloat(lon), parseFloat(item.lat), parseFloat(item.lon));
        if (dist > r) continue; // strictly within radius

        places.push({
          id: item.osm_id,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          type: batch.type,
          category: batch.type,
          name: item.name || item.display_name?.split(',')[0] || batch.type,
          tags: {
            name: item.name || item.display_name?.split(',')[0] || batch.type,
            amenity: item.type,
            'addr:city': item.address?.city || item.address?.town,
            'addr:road': item.address?.road,
          },
          categories: [batch.type],
          distance: Math.round(dist),
          distanceLabel: dist < 1000 ? `${Math.round(dist)}m` : `${(dist/1000).toFixed(1)}km`,
        });
      }
    }

    // Sort by distance
    places.sort((a, b) => a.distance - b.distance);

    const result = { places, total: places.length };
    cache.set(cacheKey, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });

    console.log(`[Nearby] Found ${places.length} places`);
    res.setHeader('X-Cache', 'MISS');
    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.json(result);
  } catch (err) {
    console.error('[Nearby] Error:', err.message);
    return res.status(503).json({ error: 'Nearby places temporarily unavailable', details: err.message });
  }
});

router.get('/weather', async (req, res) => {
  const { location } = req.query;
  const loc = location || 'India';
  try {
    const response = await fetch(`https://wttr.in/${encodeURIComponent(loc)}?format=j1`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Weather proxy error:', err.message);
    res.status(500).json({ error: 'Failed to fetch weather' });
  }
});

module.exports = router;
