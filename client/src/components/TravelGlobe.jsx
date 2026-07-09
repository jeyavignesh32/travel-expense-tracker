import React, { useEffect, useRef, useState } from 'react';
import Globe from 'react-globe.gl';
import * as THREE from 'three';

const TravelGlobe = ({ trips = [] }) => {
  const globeRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef();

  // Create markers from trips
  const markers = trips.filter(t => t.lat && t.lon).map(t => ({
    id: t.id,
    name: t.destination,
    lat: t.lat,
    lng: t.lon,
    size: 0.1,
    color: '#3b82f6'
  }));

  // Auto-rotate and focus
  useEffect(() => {
    if (globeRef.current && dimensions.width > 0) {
      const controls = globeRef.current.controls();
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.6;
      
      if (markers.length > 0) {
        // Zoom in closer to the first marker for realism
        globeRef.current.pointOfView({ 
          lat: markers[0].lat, 
          lng: markers[0].lng, 
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
          pointsData={markers}
          pointAltitude="size"
          pointColor="color"
          pointRadius={0.5}
          pointsMerge={false}
          htmlElementsData={markers}
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
