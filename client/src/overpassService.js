
import { CATEGORIES } from "./categories";

const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

const TIMEOUT = 40000;
const CACHE_TIME = 5 * 60 * 1000;

const cache = new Map();
const pending = new Map();

export function distanceMeters(lat1, lon1, lat2, lon2) {
  const rad = (v) => (v * Math.PI) / 180;
  const R = 6371000;

  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) *
      Math.cos(rad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(
    Math.sqrt(a),
    Math.sqrt(1 - a)
  );
}

function buildQuery(lat, lon, radius, categoryKeys) {
  const filters = categoryKeys
    .map((key) => CATEGORIES[key]?.query)
    .filter(Boolean);

  const clauses = filters
    .map(
      (filter) =>
        `nwr${filter}(around:${radius},${lat},${lon});`
    )
    .join("\n");

  return `
    [out:json][timeout:35];
    (
      ${clauses}
      nwr["name"](around:${radius},${lat},${lon});
    );
    out center tags;
  `;
}

async function request(endpoint, query) {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    TIMEOUT
  );

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      body: new URLSearchParams({ data: query }),
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded;charset=UTF-8",
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.remark) {
      throw new Error(data.remark);
    }

    if (!Array.isArray(data.elements)) {
      throw new Error("Invalid Overpass response");
    }

    return data.elements;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Overpass request timed out");
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchFromMirrors(query) {
  const requests = ENDPOINTS.map(async (endpoint) => {
    const elements = await request(endpoint, query);

    if (!elements.length) {
      throw new Error("Empty response");
    }

    return elements;
  });

  try {
    return await Promise.any(requests);
  } catch {
    throw new Error(
      "All Overpass servers failed or returned no places."
    );
  }
}

function getCategory(tags, selected) {
  for (const key of selected) {
    const filter = CATEGORIES[key]?.query;

    const match = filter?.match(
      /^\["([^"]+)"(?:="([^"]+)")?\]$/
    );

    if (!match) continue;

    const [, tag, value] = match;

    if (
      Object.prototype.hasOwnProperty.call(tags, tag) &&
      (value === undefined || tags[tag] === value)
    ) {
      return key;
    }
  }

  if (tags.amenity === "hospital") return "hospital";
  if (tags.amenity === "pharmacy") return "pharmacy";
  if (tags.amenity === "restaurant") return "restaurant";
  if (tags.amenity === "school") return "school";
  if (tags.amenity === "college") return "college";
  if (tags.amenity === "bank") return "bank";
  if (tags.amenity === "atm") return "atm";
  if (tags.tourism === "hotel") return "hotel";
  if (tags.tourism === "guest_house") return "guest_house";
  if (tags.shop) return "shop";

  return selected[0] || "place";
}

function normalize(elements, selected, origin) {
  const results = new Map();

  for (const element of elements) {
    const lat = element.lat ?? element.center?.lat;
    const lon = element.lon ?? element.center?.lon;

    if (
      typeof lat !== "number" ||
      typeof lon !== "number" ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lon)
    ) {
      continue;
    }

    const tags = element.tags || {};

    const name =
      tags.name ||
      tags.brand ||
      tags.operator ||
      tags["name:en"] ||
      tags["name:ta"];

    if (!name) continue;

    const category = getCategory(tags, selected);
    const categoryInfo = CATEGORIES[category];

    const distance = distanceMeters(
      origin.lat,
      origin.lon,
      lat,
      lon
    );

    results.set(`${element.type}-${element.id}`, {
      id: `${element.type}-${element.id}`,
      lat,
      lon,
      name,
      category,
      subtype:
        tags.amenity ||
        tags.shop ||
        tags.tourism ||
        category,
      tags,
      address: [
        tags["addr:housenumber"],
        tags["addr:street"],
        tags["addr:suburb"],
        tags["addr:city"],
      ].filter(Boolean).join(", "),
      phone: tags.phone || tags["contact:phone"] || "",
      website: tags.website || tags["contact:website"] || "",
      openingHours: tags.opening_hours || "",
      distance,
      distanceMeters: distance,
      icon: categoryInfo?.icon || "📍",
      color: categoryInfo?.color || "#64748b",
      source: "OpenStreetMap",
    });
  }

  return [...results.values()].sort(
    (a, b) => a.distance - b.distance
  );
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function searchWithRetry(query) {
  let lastError;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      console.info(
        `[TravelSense] Search attempt ${attempt}/2`
      );

      return await fetchFromMirrors(query);
    } catch (error) {
      lastError = error;

      console.warn(
        "[TravelSense] Overpass attempt failed:",
        error.message
      );

      if (attempt < 2) {
        await wait(1500);
      }
    }
  }

  throw lastError;
}

export async function fetchNearbyPlaces(
  lat,
  lon,
  radius = 5000,
  categoryKeys = Object.keys(CATEGORIES)
) {
  const latitude = Number(lat);
  const longitude = Number(lon);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  ) {
    throw new Error("Valid GPS coordinates are required.");
  }

  const categories = categoryKeys.filter(
    (key) => CATEGORIES[key]
  );

  if (!categories.length) {
    throw new Error("Select at least one category.");
  }

  const searchRadius = Math.min(
    Math.max(Number(radius) || 5000, 500),
    20000
  );

  const key = [
    latitude.toFixed(4),
    longitude.toFixed(4),
    searchRadius,
    [...categories].sort().join(","),
  ].join("|");

  const cached = cache.get(key);

  if (
    cached &&
    Date.now() - cached.time < CACHE_TIME &&
    cached.places.length > 0
  ) {
    return cached.places;
  }

  if (pending.has(key)) {
    return pending.get(key);
  }

  const job = (async () => {
    try {
      const radii = [
        searchRadius,
        10000,
        20000,
      ];

      for (const currentRadius of [...new Set(radii)]) {
        console.info(
          `[TravelSense] Searching within ${currentRadius} metres`
        );

        const query = buildQuery(
          latitude,
          longitude,
          currentRadius,
          categories
        );

        try {
          const elements = await searchWithRetry(query);

          const places = normalize(
            elements,
            categories,
            {
              lat: latitude,
              lon: longitude,
            }
          );

          if (places.length > 0) {
            cache.set(key, {
              time: Date.now(),
              places,
            });

            console.info(
              `[TravelSense] Found ${places.length} genuine places`
            );

            return places;
          }
        } catch (error) {
          console.warn(
            "[TravelSense] Search radius failed:",
            error.message
          );
        }
      }

      return [];
    } finally {
      pending.delete(key);
    }
  })();

  pending.set(key, job);

  return job;
}
