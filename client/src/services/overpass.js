// client/src/services/overpass.js
// RAW MAP DATA VIEWER — fetches ALL real OpenStreetMap places via POST.
// NO fake data. NO guesses. NO AI content.

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

/**
 * Fetch ALL real POIs within 2km via Overpass POST.
 * Queries ALL amenity, shop, and tourism tags — no restrictions.
 */
export const fetchPlaces = async (lat, lon) => {
  const query = `
[out:json];
(
  node(around:2000,${lat},${lon})["amenity"];
  node(around:2000,${lat},${lon})["shop"];
  node(around:2000,${lat},${lon})["tourism"];
);
out center;
`;

  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    body: query
  });

  if (!res.ok) {
    console.error(`Overpass returned HTTP ${res.status}`);
    return [];
  }

  const data = await res.json();
  console.log(`[Overpass] Raw elements received: ${(data.elements || []).length}`);
  return data.elements || [];
};

/**
 * Normalize raw Overpass elements — strict filter only.
 * Keep EVERY place that has lat, lon, and tags.
 * NEVER invent or fill missing data.
 */
export const normalizePlaces = (elements) => {
  const places = elements
    .filter(p => p.lat && p.lon && p.tags)
    .map(p => ({
      id: p.id,
      name: p.tags.name || "Unnamed Place",
      type: p.tags.amenity || p.tags.shop || p.tags.tourism || "unknown",
      lat: p.lat,
      lon: p.lon,
      tags: p.tags
    }));

  console.log(`[Overpass] Normalized places: ${places.length}`);
  return places;
};
