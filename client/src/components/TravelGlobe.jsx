import React, { useEffect, useRef, useState } from 'react';
import Globe from 'react-globe.gl';
import * as THREE from 'three';

const TravelGlobe = ({ trips = [] }) => {
  const globeRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef();

  // Default global cities to make the globe look populated
  const DEFAULT_PLACES = [
    { name: 'Paris', lat: 48.8566, lng: 2.3522 },
    { name: 'New York', lat: 40.7128, lng: -74.0060 },
    { name: 'Tokyo', lat: 35.6762, lng: 139.6503 },
    { name: 'Sydney', lat: -33.8688, lng: 151.2093 },
    { name: 'Dubai', lat: 25.2048, lng: 55.2708 },
    { name: 'Rio de Janeiro', lat: -22.9068, lng: -43.1729 },
    { name: 'Cape Town', lat: -33.9249, lng: 18.4241 },
    { name: 'London', lat: 51.5074, lng: -0.1278 },
    { name: 'Singapore', lat: 1.3521, lng: 103.8198 },
    { name: 'Mumbai', lat: 19.0760, lng: 72.8777 }
  ].map(p => ({ ...p, size: 0.03, color: 'rgba(255, 255, 255, 0.4)' }));

  // Create markers from user trips
  const userMarkers = trips.filter(t => t.lat && t.lon).map(t => ({
    id: t.id,
    name: t.destination,
    lat: t.lat,
    lng: t.lon,
    size: 0.1,
    color: '#3b82f6'
  }));

  const allPoints = [...DEFAULT_PLACES, ...userMarkers];

  // Auto-rotate and focus
  useEffect(() => {
    if (globeRef.current && dimensions.width > 0) {
      const controls = globeRef.current.controls();
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.6;
      
      if (userMarkers.length > 0) {
        // Zoom in closer to the first marker for realism
        globeRef.current.pointOfView({ 
          lat: userMarkers[0].lat, 
          lng: userMarkers[0].lng, 
          altitude: 1.5 
        }, 3000);
      } else {
        globeRef.current.pointOfView({ altitude: 2.0 });
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
    <div ref={containerRef} style={{ width: '100%', minHeight: '400px', height: '100%', borderRadius: '16px', overflow: 'hidden', background: 'radial-gradient(circle at center, #1e293b 0%, #020617 100%)', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid rgba(51, 65, 85, 0.5)' }}>
      <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 10, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', padding: '8px 16px', borderRadius: '9999px', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)', fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#60a5fa' }}></span>
        Google Earth View
      </div>
      
      {dimensions.width > 0 && (
        <Globe
          ref={globeRef}
          width={dimensions.width}
          height={dimensions.height}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          showAtmosphere={true}
          atmosphereColor="#2b65e3"
          atmosphereAltitude={0.12}
          backgroundColor="rgba(0,0,0,0)"
          pointsData={allPoints}
          pointAltitude="size"
          pointColor="color"
          pointRadius={0.4}
          pointsMerge={false}
          htmlElementsData={userMarkers}
          htmlElement={d => {
            const el = document.createElement('div');
            el.innerHTML = `
              <div style="display: flex; flex-direction: column; align-items: center; pointer-events: none; transform: translateY(-24px);">
                <div style="background-color: rgba(0, 0, 0, 0.6); backdrop-filter: blur(4px); color: white; font-size: 13px; font-weight: bold; padding: 6px 14px; border-radius: 9999px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2); border: 1px solid rgba(255, 255, 255, 0.2); margin-bottom: 6px; white-space: nowrap;">
                  📍 ${d.name}
                </div>
                <div style="width: 2px; height: 32px; background: linear-gradient(to bottom, rgba(255,255,255,0.8), transparent);"></div>
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
