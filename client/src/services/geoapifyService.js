// client/src/services/geoapifyService.js
// RAW MAP DATA VIEWER — uses OpenStreetMap Overpass only.
// All Geoapify place-search has been removed.
// Routing still uses Geoapify since Overpass doesn't support it.

import { fetchPlaces, normalizePlaces } from './overpass';

export const geoapifyService = {

  /**
   * Fetch real nearby places from OpenStreetMap Overpass API.
   * Returns strict JSON: { source, location, places }
   */
  getNearbyPlaces: async (lat, lon) => {
    try {
      const raw = await fetchPlaces(lat, lon);
      const places = normalizePlaces(raw);

      const result = {
        source: "openstreetmap",
        location: { lat, lon },
        places
      };

      console.log('[Search System Final Output]', result);
      return result;
    } catch (err) {
      console.error('Overpass fetch failed:', err);
      return {
        source: "openstreetmap",
        location: { lat, lon },
        places: []
      };
    }
  },

  /**
   * Routing — kept on Geoapify since Overpass doesn't do routing.
   */
  getRoute: async (startLat, startLon, endLat, endLon) => {
    const API_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY;
    const url = `https://api.geoapify.com/v1/routing?waypoints=${startLat},${startLon}|${endLat},${endLon}&mode=drive&apiKey=${API_KEY}`;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Routing Error ${response.status}`);
      return await response.json();
    } catch (err) {
      console.error('Failed to fetch route:', err);
      throw err;
    }
  }
};
