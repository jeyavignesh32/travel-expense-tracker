import React, { useState, useRef, useMemo, useEffect } from 'react';
import Map, { Source, Layer, Marker } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// ── 100+ Major World Cities ──────────────────────────────────────────────
const WORLD_CITIES = [
  // North America
  { name: 'New York', lat: 40.7128, lng: -74.0060, pop: 8.3 },
  { name: 'Los Angeles', lat: 34.0522, lng: -118.2437, pop: 3.9 },
  { name: 'Chicago', lat: 41.8781, lng: -87.6298, pop: 2.7 },
  { name: 'Toronto', lat: 43.6532, lng: -79.3832, pop: 2.9 },
  { name: 'Mexico City', lat: 19.4326, lng: -99.1332, pop: 9.2 },
  { name: 'Houston', lat: 29.7604, lng: -95.3698, pop: 2.3 },
  { name: 'Miami', lat: 25.7617, lng: -80.1918, pop: 0.5 },
  { name: 'San Francisco', lat: 37.7749, lng: -122.4194, pop: 0.9 },
  { name: 'Vancouver', lat: 49.2827, lng: -123.1207, pop: 0.7 },
  { name: 'Montreal', lat: 45.5017, lng: -73.5673, pop: 1.8 },
  { name: 'Washington DC', lat: 38.9072, lng: -77.0369, pop: 0.7 },
  { name: 'Atlanta', lat: 33.749, lng: -84.388, pop: 0.5 },
  { name: 'Seattle', lat: 47.6062, lng: -122.3321, pop: 0.7 },
  { name: 'Havana', lat: 23.1136, lng: -82.3666, pop: 2.1 },
  { name: 'Panama City', lat: 8.9824, lng: -79.5199, pop: 0.9 },

  // South America
  { name: 'São Paulo', lat: -23.5505, lng: -46.6333, pop: 12.3 },
  { name: 'Rio de Janeiro', lat: -22.9068, lng: -43.1729, pop: 6.7 },
  { name: 'Buenos Aires', lat: -34.6037, lng: -58.3816, pop: 3.1 },
  { name: 'Lima', lat: -12.0464, lng: -77.0428, pop: 10.0 },
  { name: 'Bogotá', lat: 4.7110, lng: -74.0721, pop: 7.4 },
  { name: 'Santiago', lat: -33.4489, lng: -70.6693, pop: 5.6 },
  { name: 'Caracas', lat: 10.4806, lng: -66.9036, pop: 2.9 },
  { name: 'Quito', lat: -0.1807, lng: -78.4678, pop: 1.8 },

  // Europe
  { name: 'London', lat: 51.5074, lng: -0.1278, pop: 9.0 },
  { name: 'Paris', lat: 48.8566, lng: 2.3522, pop: 2.2 },
  { name: 'Berlin', lat: 52.5200, lng: 13.4050, pop: 3.6 },
  { name: 'Madrid', lat: 40.4168, lng: -3.7038, pop: 3.2 },
  { name: 'Rome', lat: 41.9028, lng: 12.4964, pop: 2.9 },
  { name: 'Amsterdam', lat: 52.3676, lng: 4.9041, pop: 0.9 },
  { name: 'Moscow', lat: 55.7558, lng: 37.6173, pop: 12.5 },
  { name: 'Istanbul', lat: 41.0082, lng: 28.9784, pop: 15.5 },
  { name: 'Barcelona', lat: 41.3851, lng: 2.1734, pop: 1.6 },
  { name: 'Vienna', lat: 48.2082, lng: 16.3738, pop: 1.9 },
  { name: 'Prague', lat: 50.0755, lng: 14.4378, pop: 1.3 },
  { name: 'Lisbon', lat: 38.7223, lng: -9.1393, pop: 0.5 },
  { name: 'Athens', lat: 37.9838, lng: 23.7275, pop: 3.2 },
  { name: 'Stockholm', lat: 59.3293, lng: 18.0686, pop: 1.0 },
  { name: 'Oslo', lat: 59.9139, lng: 10.7522, pop: 0.7 },
  { name: 'Warsaw', lat: 52.2297, lng: 21.0122, pop: 1.8 },
  { name: 'Zurich', lat: 47.3769, lng: 8.5417, pop: 0.4 },
  { name: 'Dublin', lat: 53.3498, lng: -6.2603, pop: 0.5 },
  { name: 'Helsinki', lat: 60.1699, lng: 24.9384, pop: 0.7 },
  { name: 'Budapest', lat: 47.4979, lng: 19.0402, pop: 1.8 },
  { name: 'Bucharest', lat: 44.4268, lng: 26.1025, pop: 1.8 },
  { name: 'Copenhagen', lat: 55.6761, lng: 12.5683, pop: 0.8 },

  // Asia
  { name: 'Tokyo', lat: 35.6762, lng: 139.6503, pop: 13.9 },
  { name: 'Delhi', lat: 28.7041, lng: 77.1025, pop: 19.0 },
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777, pop: 20.7 },
  { name: 'Shanghai', lat: 31.2304, lng: 121.4737, pop: 24.8 },
  { name: 'Beijing', lat: 39.9042, lng: 116.4074, pop: 21.5 },
  { name: 'Bangkok', lat: 13.7563, lng: 100.5018, pop: 10.5 },
  { name: 'Singapore', lat: 1.3521, lng: 103.8198, pop: 5.7 },
  { name: 'Dubai', lat: 25.2048, lng: 55.2708, pop: 3.3 },
  { name: 'Hong Kong', lat: 22.3193, lng: 114.1694, pop: 7.5 },
  { name: 'Seoul', lat: 37.5665, lng: 126.9780, pop: 9.7 },
  { name: 'Taipei', lat: 25.0330, lng: 121.5654, pop: 2.6 },
  { name: 'Kuala Lumpur', lat: 3.1390, lng: 101.6869, pop: 1.8 },
  { name: 'Jakarta', lat: -6.2088, lng: 106.8456, pop: 10.6 },
  { name: 'Manila', lat: 14.5995, lng: 120.9842, pop: 1.8 },
  { name: 'Hanoi', lat: 21.0285, lng: 105.8542, pop: 8.1 },
  { name: 'Ho Chi Minh City', lat: 10.8231, lng: 106.6297, pop: 9.0 },
  { name: 'Osaka', lat: 34.6937, lng: 135.5023, pop: 2.7 },
  { name: 'Kolkata', lat: 22.5726, lng: 88.3639, pop: 14.9 },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707, pop: 10.5 },
  { name: 'Bangalore', lat: 12.9716, lng: 77.5946, pop: 12.3 },
  { name: 'Hyderabad', lat: 17.3850, lng: 78.4867, pop: 10.0 },
  { name: 'Karachi', lat: 24.8607, lng: 67.0011, pop: 16.1 },
  { name: 'Lahore', lat: 31.5204, lng: 74.3587, pop: 11.1 },
  { name: 'Dhaka', lat: 23.8103, lng: 90.4125, pop: 21.0 },
  { name: 'Riyadh', lat: 24.7136, lng: 46.6753, pop: 7.7 },
  { name: 'Tehran', lat: 35.6892, lng: 51.3890, pop: 9.0 },
  { name: 'Baghdad', lat: 33.3152, lng: 44.3661, pop: 7.5 },
  { name: 'Doha', lat: 25.2854, lng: 51.5310, pop: 1.2 },
  { name: 'Abu Dhabi', lat: 24.4539, lng: 54.3773, pop: 1.5 },
  { name: 'Kathmandu', lat: 27.7172, lng: 85.3240, pop: 1.4 },
  { name: 'Colombo', lat: 6.9271, lng: 79.8612, pop: 0.8 },

  // Africa
  { name: 'Cairo', lat: 30.0444, lng: 31.2357, pop: 9.5 },
  { name: 'Lagos', lat: 6.5244, lng: 3.3792, pop: 14.9 },
  { name: 'Cape Town', lat: -33.9249, lng: 18.4241, pop: 4.6 },
  { name: 'Nairobi', lat: -1.2921, lng: 36.8219, pop: 4.7 },
  { name: 'Johannesburg', lat: -26.2041, lng: 28.0473, pop: 5.7 },
  { name: 'Casablanca', lat: 33.5731, lng: -7.5898, pop: 3.7 },
  { name: 'Addis Ababa', lat: 8.9806, lng: 38.7578, pop: 3.4 },
  { name: 'Dar es Salaam', lat: -6.7924, lng: 39.2083, pop: 4.4 },
  { name: 'Accra', lat: 5.6037, lng: -0.1870, pop: 2.5 },
  { name: 'Algiers', lat: 36.7538, lng: 3.0588, pop: 3.4 },
  { name: 'Marrakech', lat: 31.6295, lng: -7.9811, pop: 0.9 },
  { name: 'Tunis', lat: 36.8065, lng: 10.1815, pop: 0.7 },

  // Oceania
  { name: 'Sydney', lat: -33.8688, lng: 151.2093, pop: 5.3 },
  { name: 'Melbourne', lat: -37.8136, lng: 144.9631, pop: 5.1 },
  { name: 'Auckland', lat: -36.8485, lng: 174.7633, pop: 1.7 },
  { name: 'Perth', lat: -31.9505, lng: 115.8605, pop: 2.1 },
  { name: 'Brisbane', lat: -27.4698, lng: 153.0251, pop: 2.6 },

  // More India
  { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714, pop: 8.0 },
  { name: 'Pune', lat: 18.5204, lng: 73.8567, pop: 7.4 },
  { name: 'Jaipur', lat: 26.9124, lng: 75.7873, pop: 3.1 },
  { name: 'Lucknow', lat: 26.8467, lng: 80.9462, pop: 3.9 },
  { name: 'Kochi', lat: 9.9312, lng: 76.2673, pop: 2.1 },
  { name: 'Goa', lat: 15.2993, lng: 74.1240, pop: 0.6 },
  { name: 'Varanasi', lat: 25.3176, lng: 82.9739, pop: 1.2 },
  { name: 'Coimbatore', lat: 11.0168, lng: 76.9558, pop: 1.1 },
  { name: 'Madurai', lat: 9.9252, lng: 78.1198, pop: 1.0 },
  { name: 'Visakhapatnam', lat: 17.6868, lng: 83.2185, pop: 2.0 },
];

const mapStyle = {
  version: 8,
  sources: {
    'esri-satellite': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      ],
      tileSize: 256,
      maxzoom: 18
    }
  },
  layers: [
    {
      id: 'satellite-layer',
      type: 'raster',
      source: 'esri-satellite',
      minzoom: 0,
      maxzoom: 19
    }
  ]
};

const TravelGlobe = ({ trips = [] }) => {
  const mapRef = useRef();
  
  // User trip markers (highlighted)
  const userMarkers = useMemo(() => 
    trips.filter(t => t.lat && t.lon).map(t => ({
      id: t.id,
      name: t.destination,
      lat: t.lat,
      lng: t.lon
    })), [trips]
  );

  // Initial map view state
  const [viewState, setViewState] = useState({
    longitude: userMarkers.length > 0 ? userMarkers[0].lng : 78,
    latitude: userMarkers.length > 0 ? userMarkers[0].lat : 20,
    zoom: userMarkers.length > 0 ? 3 : 1.5,
    pitch: 45
  });

  const onMapLoad = (e) => {
    const map = e.target;
    // Enable globe projection in MapLibre
    map.setProjection({ type: 'globe' });
    
    // Add a simple rotation animation
    let animation;
    function rotateCamera() {
      if (!map.isZooming() && !map.isDragging() && map.getZoom() < 4) {
        const center = map.getCenter();
        center.lng += 0.1;
        map.jumpTo({ center });
      }
      animation = requestAnimationFrame(rotateCamera);
    }
    rotateCamera();

    return () => {
      cancelAnimationFrame(animation);
    };
  };

  return (
    <div style={{ 
      width: '100%', 
      minHeight: '450px', 
      height: '100%', 
      borderRadius: '16px', 
      overflow: 'hidden', 
      background: 'radial-gradient(ellipse at center, #0a1628 0%, #000000 100%)', 
      position: 'relative', 
      boxShadow: '0 0 60px rgba(59, 130, 246, 0.1), 0 25px 50px -12px rgba(0,0,0,0.5)', 
      border: '1px solid rgba(59, 130, 246, 0.15)' 
    }}>
      {/* Badge */}
      <div style={{ 
        position: 'absolute', top: '16px', left: '16px', zIndex: 10, 
        backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', 
        padding: '8px 16px', borderRadius: '9999px', 
        border: '1px solid rgba(59, 130, 246, 0.3)', 
        color: 'rgba(255,255,255,0.9)', fontSize: '13px', fontWeight: 600, 
        display: 'flex', alignItems: 'center', gap: '8px',
        fontFamily: "'Inter', 'Segoe UI', sans-serif"
      }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6', boxShadow: '0 0 6px #3b82f6' }}></span>
        🌍 Realistic Earth View
      </div>

      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle={mapStyle}
        onLoad={onMapLoad}
        dragRotate={true}
        pitchWithRotate={true}
        maxPitch={85}
        terrain={{ source: 'esri-satellite', exaggeration: 1.5 }} // Optional terrain, won't work well without a proper DEM source, but maplibre handles globe naturally
      >
        {/* Popular Cities - Small markers */}
        {WORLD_CITIES.map((city, idx) => (
          <Marker 
            key={\`city-\${idx}\`} 
            longitude={city.lng} 
            latitude={city.lat}
            anchor="center"
          >
            <div style={{
              width: '6px',
              height: '6px',
              backgroundColor: 'rgba(255, 200, 50, 0.8)',
              borderRadius: '50%',
              boxShadow: '0 0 4px rgba(255, 200, 50, 0.5)'
            }}></div>
          </Marker>
        ))}

        {/* User Trips - Large glowing markers */}
        {userMarkers.map((trip) => (
          <Marker 
            key={\`trip-\${trip.id}\`} 
            longitude={trip.lng} 
            latitude={trip.lat}
            anchor="bottom"
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', transform: 'translateY(10px)' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.95), rgba(147, 51, 234, 0.95))',
                backdropFilter: 'blur(6px)',
                color: 'white',
                fontSize: '12px',
                fontWeight: 'bold',
                padding: '6px 16px',
                borderRadius: '9999px',
                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                marginBottom: '4px',
                whiteSpace: 'nowrap'
              }}>
                📍 {trip.name}
              </div>
              <div style={{ width: '2px', height: '30px', background: 'linear-gradient(to bottom, rgba(59, 130, 246, 0.9), transparent)' }}></div>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6', boxShadow: '0 0 10px #3b82f6' }}></div>
            </div>
          </Marker>
        ))}
      </Map>
    </div>
  );
};

export default TravelGlobe;
