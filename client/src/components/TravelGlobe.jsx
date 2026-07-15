import React, { useEffect, useRef, useState, useMemo } from 'react';
import Map, { Marker } from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const TravelGlobe = ({ trips = [] }) => {
  const mapRef = useRef();

  // Create markers from trips
  const userMarkers = useMemo(() => 
    trips.filter(t => t.lat && t.lon).map(t => ({
      id: t.id,
      name: t.destination,
      lat: t.lat,
      lng: t.lon
    })), [trips]
  );

  // Free Esri Satellite + Labels Style for MapLibre
  const mapStyle = {
    version: 8,
    sources: {
      'esri-satellite': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        ],
        tileSize: 256,
        attribution: '&copy; Esri, Maxar, Earthstar Geographics'
      },
      'esri-labels': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'
        ],
        tileSize: 256
      }
    },
    layers: [
      {
        id: 'satellite',
        type: 'raster',
        source: 'esri-satellite',
        minzoom: 0,
        maxzoom: 22
      },
      {
        id: 'labels',
        type: 'raster',
        source: 'esri-labels',
        minzoom: 0,
        maxzoom: 22
      }
    ]
  };

  useEffect(() => {
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      
      // Auto rotate functionality
      let animationId;
      let lastTime = 0;
      
      const rotate = (time) => {
        if (!map.isZooming() && !map.isDragging() && map.getZoom() < 3) {
          const delta = time - lastTime;
          if (lastTime !== 0 && delta < 100) {
            const center = map.getCenter();
            center.lng += 0.05 * (delta / 16); 
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
    <div style={{ width: '100%', minHeight: '450px', height: '100%', borderRadius: '16px', overflow: 'hidden', background: '#000', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid rgba(51, 65, 85, 0.5)' }}>
      {/* Badge */}
      <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 10, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)', padding: '8px 16px', borderRadius: '9999px', border: '1px solid rgba(59, 130, 246, 0.4)', color: 'rgba(255,255,255,0.9)', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#60a5fa', boxShadow: '0 0 6px #60a5fa' }}></span>
        🌍 High-Res Satellite View
      </div>

      <div style={{ position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)', zIndex: 10, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', padding: '6px 16px', borderRadius: '9999px', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontSize: '11px', fontWeight: 500, fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
        🖱️ Drag to rotate • Scroll to zoom to street level
      </div>

      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapLib={maplibregl}
        mapStyle={mapStyle}
        style={{ width: '100%', height: '100%' }}
        renderWorldCopies={true}
        maxPitch={85}
      >
        {userMarkers.map(m => (
          <Marker key={m.id} longitude={m.lng} latitude={m.lat} anchor="bottom">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.95), rgba(147, 51, 234, 0.95))', backdropFilter: 'blur(6px)', color: 'white', fontSize: '13px', fontWeight: 700, padding: '6px 16px', borderRadius: '9999px', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.5)', border: '1px solid rgba(255, 255, 255, 0.3)', marginBottom: '6px', whiteSpace: 'nowrap', fontFamily: "'Inter', 'Segoe UI', sans-serif", letterSpacing: '0.3px' }}>
                ✈️ {m.name}
              </div>
              <div style={{ width: '2px', height: '36px', background: 'linear-gradient(to bottom, rgba(59, 130, 246, 0.9), transparent)' }}></div>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 12px #3b82f6', border: '2px solid white' }}></div>
            </div>
          </Marker>
        ))}
      </Map>
    </div>
  );
};

export default TravelGlobe;
