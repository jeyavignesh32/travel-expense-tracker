# TravelSense — Nearby Places Explorer

A location-based discovery app that detects your current location and shows
**real, verified OpenStreetMap places** nearby — ATMs, hospitals, restaurants,
pharmacies, schools, colleges, hotels, guest houses, and shops — with no
manual search and no fake/AI-generated data.

## Tech Stack

- React 18 + Vite
- Leaflet / React-Leaflet (map) + react-leaflet-cluster (marker clustering)
- Browser Geolocation API (high-accuracy, live updates)
- OpenStreetMap + Overpass API (real POI data)

## Getting Started

```bash
npm install
npm run dev
```

Open the printed local URL in your browser. **Allow location access** when
prompted — the app needs GPS permission to detect your position.

> Note: Geolocation requires HTTPS or `localhost`. It will not work over
> plain HTTP on a remote host.

## How It Works

1. **Location detection** — `useGeolocation` hook requests high-accuracy GPS
   coordinates and (optionally) keeps watching for live updates.
2. **Query building** — selected categories are translated into real OSM tag
   filters (e.g. `amenity=hospital`, `shop`, `tourism=hotel`).
3. **Overpass query** — a single query asks for all selected categories
   within the chosen radius around your coordinates. Multiple Overpass
   mirrors are tried in sequence for reliability.
4. **Validation / anti-fake filtering** — every result must have a valid
   latitude & longitude within real-world bounds, at least one real OSM tag,
   and a tag matching one of the requested categories. Anything else is
   dropped. **Nothing is invented, guessed, or sampled.**
5. **Normalization** — name, address (from `addr:*` tags), and category are
   extracted; distance from you is computed via the Haversine formula.
6. **Display** — results render as clustered markers on the map and as a
   sorted (nearest-first) list in the sidebar.

## Features Implemented

- High-accuracy real-time GPS detection with live tracking
- Interactive Leaflet map centered on your location, with accuracy circle
- Automatic nearby place discovery (no search box)
- Radius control: 500 m – 10 km, with quick presets (2 / 5 / 10 km)
- Category filters (ATM, Bank, Hospital, Pharmacy, Restaurant, School,
  College, Hotel, Guest House, Shop)
- Strict validation — only real OSM results shown
- Marker clustering for dense areas
- Distance display, sorted nearest-first
- Manual refresh button
- Responsive layout (mobile-friendly stacked view)

## Future Enhancements (Roadmap)

- Route navigation to a selected place
- Offline caching of recent Overpass responses
- Hybrid data sources (combine with another POI provider for areas with
  sparse OSM coverage)
- "Open now" filtering using `opening_hours` tags
- Saved/favorite places
- Search-as-you-pan (fetch new data when the map is moved, not just on GPS
  update)

## Project Structure

```
src/
  App.jsx             - main app state & layout
  App.css             - styling
  MapView.jsx         - Leaflet map, markers, clustering
  Sidebar.jsx         - filters, radius control, places list
  categories.js       - category -> OSM tag mapping
  overpassService.js  - Overpass API query + strict validation
  useGeolocation.js   - GPS hook (high accuracy, live updates)
```

## Troubleshooting

- **"Location permission denied"** — enable location access for the site in
  your browser's site settings, then click "Refresh Location & Places".
- **No places found** — try increasing the radius or enabling more
  categories. Some areas have limited OpenStreetMap coverage.
- **Overpass errors / timeouts** — the public Overpass API can be rate
  limited. The app automatically retries with alternate mirrors.
