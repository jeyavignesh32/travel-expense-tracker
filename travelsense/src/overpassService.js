const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter"
];

const buildQuery = (lat, lon, radius) => `
[out:json][timeout:25];
(
  node(around:${radius},${lat},${lon})["amenity"~"atm|bank|hospital|pharmacy|restaurant|school|college"];
  node(around:${radius},${lat},${lon})["shop"];
  node(around:${radius},${lat},${lon})["tourism"~"hotel|guest_house"];
);
out center;
`;

const extractSubtype = (tags) => {
  if (tags.shop) return tags.shop.charAt(0).toUpperCase() + tags.shop.slice(1).replace('_', ' ');
  if (tags.amenity === 'restaurant' && tags.cuisine) return tags.cuisine.charAt(0).toUpperCase() + tags.cuisine.slice(1).replace('_', ' ') + ' Restaurant';
  if (tags.amenity === 'atm') {
    if (tags.operator) return tags.operator + ' ATM';
    if (tags.brand) return tags.brand + ' ATM';
    return 'ATM';
  }
  if (tags.amenity === 'bank') {
    if (tags.brand) return tags.brand + ' Bank';
    if (tags.operator) return tags.operator + ' Bank';
    return 'Bank';
  }
  return null;
};

const normalizePlaces = (elements) => {
  return elements
    .filter(p => p.lat && p.lon && p.tags)
    .map(p => {
      const type = p.tags.amenity || p.tags.shop ? 'shop' : (p.tags.tourism || 'unknown');
      const subtype = extractSubtype(p.tags);
      return {
        id: p.id,
        name: p.tags.name || subtype || type,
        type: p.tags.amenity || p.tags.shop ? 'shop' : p.tags.tourism || 'unknown',
        actualType: p.tags.amenity || (p.tags.shop ? 'shop' : p.tags.tourism),
        subtype,
        lat: p.lat,
        lon: p.lon,
        tags: p.tags
      };
    });
};

export const fetchPlaces = async (lat, lon, radius, onRadiusReduced) => {
  let currentRadius = radius;
  let attempt = 0;

  while (currentRadius >= 1000) {
    const endpoint = ENDPOINTS[attempt % ENDPOINTS.length];
    const query = buildQuery(lat, lon, currentRadius);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

      const res = await fetch(endpoint, {
        method: "POST",
        body: query,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP Error: ${res.status}`);
      }

      const data = await res.json();
      const normalized = normalizePlaces(data.elements || []);
      
      return {
        places: normalized,
        radiusUsed: currentRadius
      };

    } catch (err) {
      console.warn(`Overpass fetch failed on ${endpoint} with radius ${currentRadius}: ${err.message}`);
      
      attempt++;
      currentRadius = Math.max(1000, Math.floor(currentRadius * 0.6));
      
      if (currentRadius < 1000 && attempt >= ENDPOINTS.length) {
        console.error("All Overpass endpoints and radius reductions failed.");
        return { places: [], radiusUsed: radius };
      }
      
      if (onRadiusReduced) {
        onRadiusReduced(currentRadius);
      }
    }
  }
  
  return { places: [], radiusUsed: radius };
};
