// client/src/services/mapCategories.js
// Category definitions: each maps to real OpenStreetMap (Overpass) tags.
// These are the ONLY tags queried — no synthetic/fake data is ever generated.

export const CATEGORIES = {
  atm: {
    label: "ATM",
    color: "#2563eb",
    icon: "🏧",
    query: '["amenity"="atm"]',
  },
  bank: {
    label: "Bank",
    color: "#1d4ed8",
    icon: "🏦",
    query: '["amenity"="bank"]',
  },
  hospital: {
    label: "Hospital",
    color: "#dc2626",
    icon: "🏥",
    query: '["amenity"="hospital"]',
  },
  pharmacy: {
    label: "Pharmacy",
    color: "#16a34a",
    icon: "💊",
    query: '["amenity"="pharmacy"]',
  },
  restaurant: {
    label: "Restaurant",
    color: "#ea580c",
    icon: "🍽️",
    query: '["amenity"="restaurant"]',
  },
  school: {
    label: "School",
    color: "#7c3aed",
    icon: "🏫",
    query: '["amenity"="school"]',
  },
  college: {
    label: "College",
    color: "#6d28d9",
    icon: "🎓",
    query: '["amenity"="college"]',
  },
  hotel: {
    label: "Hotel",
    color: "#0891b2",
    icon: "🏨",
    query: '["tourism"="hotel"]',
  },
  guest_house: {
    label: "Guest House",
    color: "#0e7490",
    icon: "🛏️",
    query: '["tourism"="guest_house"]',
  },
  shop: {
    label: "Shop",
    color: "#ca8a04",
    icon: "🛍️",
    query: '["shop"]',
  },
};

export const CATEGORY_KEYS = Object.keys(CATEGORIES);
