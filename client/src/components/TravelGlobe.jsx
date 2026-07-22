import React, { useEffect, useRef, useState, useMemo } from 'react';
import Map, { Marker } from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// Animated pulsing marker component
const PulseMarker = ({ name, color = '#3b82f6' }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
    <div style={{
      background: `linear-gradient(135deg, ${color}, ${color}dd)`,
      backdropFilter: 'blur(8px)',
      color: 'white', fontSize: '12px', fontWeight: 700,
      padding: '5px 14px', borderRadius: '9999px',
      boxShadow: `0 4px 20px ${color}88`,
      border: '1px solid rgba(255,255,255,0.35)',
      marginBottom: '6px', whiteSpace: 'nowrap',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      letterSpacing: '0.4px',
      animation: 'markerFloat 3s ease-in-out infinite',
    }}>
      ✈️ {name}
    </div>
    <div style={{ width: '2px', height: '30px', background: `linear-gradient(to bottom, ${color}, transparent)` }}></div>
    <div style={{ position: 'relative', width: '14px', height: '14px' }}>
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: color, border: '2px solid white',
        boxShadow: `0 0 15px ${color}`,
      }}></div>
      <div style={{
        position: 'absolute', inset: '-8px', borderRadius: '50%',
        border: `2px solid ${color}`,
        animation: 'pulse-ring 2s ease-out infinite',
        opacity: 0.6,
      }}></div>
    </div>
  </div>
);

const MARKER_COLORS = ['#f43f5e', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#ec4899', '#6366f1'];

const TravelGlobe = ({ trips = [] }) => {
  const mapRef = useRef();
  const [hovered, setHovered] = useState(null);

  // Create markers from trips
  const userMarkers = useMemo(() => 
    trips.filter(t => t.lat && t.lon).map((t, i) => ({
      id: t.id,
      name: t.destination,
      lat: t.lat,
      lng: t.lon,
      color: MARKER_COLORS[i % MARKER_COLORS.length]
    })), [trips]
  );

  // Google Maps Hybrid (Satellite + Labels) Style for MapLibre
  const mapStyle = {
    version: 8,
    sources: {
      'google-hybrid': {
        type: 'raster',
        tiles: [
          'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
        ],
        tileSize: 256,
        attribution: '&copy; Google'
      }
    },
    layers: [
      {
        id: 'satellite-hybrid',
        type: 'raster',
        source: 'google-hybrid',
        minzoom: 0,
        maxzoom: 22
      }
    ]
  };

  useEffect(() => {
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      
      // Auto rotate functionality — smoother
      let animationId;
      let lastTime = 0;
      
      const rotate = (time) => {
        if (!map.isZooming() && !map.isDragging() && map.getZoom() < 3) {
          const delta = time - lastTime;
          if (lastTime !== 0 && delta < 100) {
            const center = map.getCenter();
            center.lng += 0.03 * (delta / 16); // slightly slower & smoother
            map.setCenter(center);
          }
          lastTime = time;
        } else {
          lastTime = 0;
        }
        animationId = requestAnimationFrame(rotate);
      };
      
      map.on('load', () => {
        // Enable globe projection if supported
        if (map.setProjection) {
          map.setProjection({ type: 'globe' });
        }
        animationId = requestAnimationFrame(rotate);
      });

      return () => cancelAnimationFrame(animationId);
    }
  }, []);

  const [viewState, setViewState] = useState({
    longitude: userMarkers.length > 0 ? userMarkers[0].lng : 78.9629,
    latitude: userMarkers.length > 0 ? userMarkers[0].lat : 20.5937,
    zoom: userMarkers.length > 0 ? 3 : 1.5,
    pitch: 0,
    bearing: 0
  });

  return (
    <div style={{
      width: '100%', minHeight: '450px', height: '100%',
      borderRadius: '20px', overflow: 'hidden',
      background: 'radial-gradient(ellipse at center, #0a1628 0%, #000 100%)',
      position: 'relative',
      boxShadow: '0 25px 60px -12px rgba(0,0,0,0.5), 0 0 40px rgba(59,130,246,0.1)',
      border: '1px solid rgba(59, 130, 246, 0.2)',
    }}>

      {/* Animated CSS keyframes */}
      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes markerFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(59,130,246,0.15); }
          50% { box-shadow: 0 0 40px rgba(59,130,246,0.3); }
        }
        @keyframes badge-shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>

      {/* Starfield background */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none', overflow: 'hidden' }}>
        {Array.from({ length: 60 }).map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: `${1 + Math.random() * 2}px`,
            height: `${1 + Math.random() * 2}px`,
            borderRadius: '50%',
            background: 'white',
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animation: `twinkle ${2 + Math.random() * 4}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 3}s`,
            opacity: 0.4 + Math.random() * 0.6,
          }} />
        ))}
      </div>

      {/* Atmospheric glow ring */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 60%, transparent 40%, rgba(59,130,246,0.06) 60%, rgba(59,130,246,0.12) 80%, transparent 100%)',
        animation: 'glow-pulse 5s ease-in-out infinite',
      }} />

      {/* Badge — top left */}
      <div style={{
        position: 'absolute', top: '16px', left: '16px', zIndex: 10,
        background: 'linear-gradient(135deg, rgba(0,0,0,0.75), rgba(15,23,42,0.8))',
        backdropFilter: 'blur(16px)',
        padding: '8px 18px', borderRadius: '9999px',
        border: '1px solid rgba(59,130,246,0.35)',
        color: 'rgba(255,255,255,0.95)', fontSize: '13px', fontWeight: 600,
        display: 'flex', alignItems: 'center', gap: '8px',
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
      }}>
        <span style={{
          width: '8px', height: '8px', borderRadius: '50%',
          backgroundColor: '#60a5fa', boxShadow: '0 0 8px #60a5fa, 0 0 16px #60a5fa44',
        }}></span>
        🌍 Live Satellite Globe
      </div>

      {/* Trip count badge — top right */}
      {userMarkers.length > 0 && (
        <div style={{
          position: 'absolute', top: '16px', right: '16px', zIndex: 10,
          background: 'linear-gradient(135deg, rgba(139,92,246,0.85), rgba(236,72,153,0.85))',
          backdropFilter: 'blur(12px)',
          padding: '8px 16px', borderRadius: '9999px',
          border: '1px solid rgba(255,255,255,0.2)',
          color: 'white', fontSize: '13px', fontWeight: 700,
          fontFamily: "'Inter', 'Segoe UI', sans-serif",
          boxShadow: '0 4px 20px rgba(139,92,246,0.4)',
        }}>
          📍 {userMarkers.length} Destination{userMarkers.length > 1 ? 's' : ''} Pinned
        </div>
      )}

      {/* Hovered marker tooltip */}
      {hovered && (
        <div style={{
          position: 'absolute', bottom: '56px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 15, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
          padding: '10px 20px', borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.15)',
          color: 'white', fontSize: '14px', fontWeight: 600,
          fontFamily: "'Inter', 'Segoe UI', sans-serif",
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          transition: 'all 0.3s ease',
        }}>
          📍 {hovered.name} &nbsp;•&nbsp; {hovered.lat.toFixed(2)}°N, {hovered.lng.toFixed(2)}°E
        </div>
      )}

      {/* Instruction badge — bottom */}
      <div style={{
        position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)',
        zIndex: 10, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)',
        padding: '6px 18px', borderRadius: '9999px',
        border: '1px solid rgba(255,255,255,0.1)',
        color: 'rgba(255,255,255,0.7)', fontSize: '11px', fontWeight: 500,
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
      }}>
        🖱️ Drag to explore • Scroll to zoom to street level • Hover markers for info
      </div>

      {/* Map */}
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapLib={maplibregl}
        mapStyle={mapStyle}
        style={{ width: '100%', height: '100%', position: 'relative', zIndex: 3 }}
        renderWorldCopies={true}
        maxPitch={85}
      >
        {userMarkers.map(m => (
          <Marker key={m.id} longitude={m.lng} latitude={m.lat} anchor="bottom">
            <div
              onMouseEnter={() => setHovered(m)}
              onMouseLeave={() => setHovered(null)}
            >
              <PulseMarker name={m.name} color={m.color} />
            </div>
          </Marker>
        ))}
      </Map>
    </div>
  );
};

export default TravelGlobe;
