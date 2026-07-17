// client/src/services/overpassService.js
// ALL place data is fetched through the backend proxy (/api/nearby/spots).
// The proxy calls OpenStreetMap Overpass API server-side — no CORS issues.
// NO fake data. NO guesses. NO AI content.

const PROXY_URL = '/api/nearby/spots';

/**
 * Fetch nearby places via the backend proxy.
 * The proxy handles Overpass mirror fallback, caching, and CORS.
 */
export async function fetchNearbyPlaces(lat, lon, radius, _categoryKeys) {
  const r = Math.round(radius) || 5000;
  const url = `${PROXY_URL}?lat=${lat}&lon=${lon}&radius=${r}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Proxy responded with status ${res.status}`);
  }

  const data = await res.json();
  const elements = data.places || [];

  return { results: elements, radiusUsed: r };
}

/**
 * Calculate distance in meters between two coordinates (Haversine formula).
 */
export function distanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
