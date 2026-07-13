import React, { useEffect, useRef, useState, useMemo } from 'react';
import Globe from 'react-globe.gl';

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

const TravelGlobe = ({ trips = [] }) => {
  const globeRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef();

  // Build city points with size based on population
  const cityPoints = useMemo(() => 
    WORLD_CITIES.map(c => ({
      lat: c.lat,
      lng: c.lng,
      name: c.name,
      size: Math.max(0.01, Math.min(0.06, c.pop / 200)),
      color: 'rgba(255, 200, 50, 0.6)',
      isCity: true
    })), []
  );

  // User trip markers (highlighted)
  const userMarkers = useMemo(() => 
    trips.filter(t => t.lat && t.lon).map(t => ({
      id: t.id,
      name: t.destination,
      lat: t.lat,
      lng: t.lon,
      size: 0.12,
      color: '#3b82f6',
      isCity: false
    })), [trips]
  );

  // All points combined
  const allPoints = useMemo(() => [...cityPoints, ...userMarkers], [cityPoints, userMarkers]);

  // Arcs between user's trips
  const tripArcs = useMemo(() => {
    if (userMarkers.length < 2) return [];
    return userMarkers.slice(0, -1).map((m, i) => ({
      startLat: m.lat,
      startLng: m.lng,
      endLat: userMarkers[i + 1].lat,
      endLng: userMarkers[i + 1].lng,
      color: ['rgba(59, 130, 246, 0.6)', 'rgba(147, 51, 234, 0.6)']
    }));
  }, [userMarkers]);

  // City labels (only show bigger cities)
  const labelData = useMemo(() => 
    WORLD_CITIES.filter(c => c.pop >= 3.0).map(c => ({
      lat: c.lat,
      lng: c.lng,
      name: c.name,
      pop: c.pop
    })), []
  );

  // Auto-rotate and focus
  useEffect(() => {
    if (globeRef.current && dimensions.width > 0) {
      const controls = globeRef.current.controls();
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.4;
      controls.enableZoom = true;
      controls.minDistance = 120;
      controls.maxDistance = 500;

      if (userMarkers.length > 0) {
        globeRef.current.pointOfView({ 
          lat: userMarkers[0].lat, 
          lng: userMarkers[0].lng, 
          altitude: 1.8 
        }, 3000);
      } else {
        // Start with a nice view of India
        globeRef.current.pointOfView({ lat: 20, lng: 78, altitude: 2.2 }, 2000);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dimensions.width]);

  // Responsive sizing
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div ref={containerRef} style={{ 
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
        🌍 Earth View
      </div>

      {/* City count */}
      <div style={{ 
        position: 'absolute', top: '16px', right: '16px', zIndex: 10, 
        backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', 
        padding: '6px 14px', borderRadius: '9999px', 
        border: '1px solid rgba(255,255,255,0.1)', 
        color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: 500,
        fontFamily: "'Inter', 'Segoe UI', sans-serif"
      }}>
        {WORLD_CITIES.length} cities • {userMarkers.length} trips
      </div>

      {/* Controls hint */}
      <div style={{ 
        position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)', zIndex: 10, 
        backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', 
        padding: '6px 16px', borderRadius: '9999px', 
        border: '1px solid rgba(255,255,255,0.08)', 
        color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 400,
        fontFamily: "'Inter', 'Segoe UI', sans-serif"
      }}>
        🖱️ Drag to rotate • Scroll to zoom
      </div>
      
      {dimensions.width > 0 && (
        <Globe
          ref={globeRef}
          width={dimensions.width}
          height={dimensions.height}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
          showAtmosphere={true}
          atmosphereColor="#3b82f6"
          atmosphereAltitude={0.18}
          backgroundColor="rgba(0,0,0,0)"

          {/* City dots */}
          pointsData={allPoints}
          pointAltitude="size"
          pointColor="color"
          pointRadius={d => d.isCity ? 0.25 : 0.6}
          pointsMerge={false}

          {/* City name labels on globe surface */}
          labelsData={labelData}
          labelLat={d => d.lat}
          labelLng={d => d.lng}
          labelText={d => d.name}
          labelSize={d => Math.max(0.3, d.pop / 15)}
          labelDotRadius={0}
          labelColor={() => 'rgba(255, 255, 255, 0.55)'}
          labelResolution={2}
          labelAltitude={0.005}

          {/* Arcs between trips */}
          arcsData={tripArcs}
          arcColor="color"
          arcDashLength={0.4}
          arcDashGap={0.2}
          arcDashAnimateTime={2000}
          arcStroke={0.5}

          {/* Trip labels (HTML overlay) */}
          htmlElementsData={userMarkers}
          htmlElement={d => {
            const el = document.createElement('div');
            el.innerHTML = `
              <div style="display: flex; flex-direction: column; align-items: center; pointer-events: none; transform: translateY(-30px);">
                <div style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.85), rgba(147, 51, 234, 0.85)); backdrop-filter: blur(6px); color: white; font-size: 12px; font-weight: 700; padding: 5px 14px; border-radius: 9999px; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4); border: 1px solid rgba(255, 255, 255, 0.25); margin-bottom: 4px; white-space: nowrap; font-family: 'Inter', 'Segoe UI', sans-serif; letter-spacing: 0.3px;">
                  ✈️ ${d.name}
                </div>
                <div style="width: 2px; height: 28px; background: linear-gradient(to bottom, rgba(59, 130, 246, 0.8), transparent);"></div>
                <div style="width: 6px; height: 6px; border-radius: 50%; background: #3b82f6; box-shadow: 0 0 8px #3b82f6;"></div>
              </div>
            `;
            return el;
          }}
        />
      )}
    </div>
  );
};

export default TravelGlobe;
