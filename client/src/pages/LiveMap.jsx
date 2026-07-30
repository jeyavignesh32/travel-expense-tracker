// client/src/pages/LiveMap.jsx
import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { geoapifyService } from '../services/geoapifyService';
import { useNearbyPlaces } from '../hooks/useNearbyPlaces';
import { useGeolocation } from '../hooks/useGeolocation';

import MapCanvas from '../components/map/MapCanvas';
import MapControls from '../components/map/MapControls';
import PlacesSidebar from '../components/sidebar/PlacesSidebar';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const LiveMap = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState({});
  const { position: myLocation, error: geoError, refresh: refreshLocation } = useGeolocation({ live: true });
  
  const [mapLayer, setMapLayer] = useState('street'); // 'street' | 'satellite' | 'terrain'
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [routeCoords, setRouteCoords] = useState(null);
  const [navigationInfo, setNavigationInfo] = useState(null);

  const [mapSettings, setMapSettings] = useState(() => {
    const savedData = localStorage.getItem('travel_settings');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        return { radius: parsed.mapRadius || 5 };
      } catch { /* ignore parsing errors */ }
    }
    return { radius: 5 };
  });

  const [recenterTrigger, setRecenterTrigger] = useState(0);
  const hasCentered = useRef(false);
  const socketRef = useRef();

  const [queryCoords, setQueryCoords] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);
  const [mapZoom, setMapZoom] = useState(14);
  const debounceTimerRef = useRef(null);

  const handleMapChange = (lat, lon, zoom) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setMapCenter({ lat, lon });
      setMapZoom(zoom);
    }, 400);
  };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (myLocation) {
      if (!queryCoords) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setQueryCoords({ lat: myLocation.latitude, lon: myLocation.longitude });
      } else {
        // Calculate geodesic distance in meters (Haversine formula)
        const R = 6371000; // Earth's radius in meters
        const lat1 = (queryCoords.lat * Math.PI) / 180;
        const lat2 = (myLocation.latitude * Math.PI) / 180;
        const dLat = ((myLocation.latitude - queryCoords.lat) * Math.PI) / 180;
        const dLon = ((myLocation.longitude - queryCoords.lon) * Math.PI) / 180;

        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1) * Math.cos(lat2) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        // Only update search query coordinate if the user has moved > 10 meters
        if (distance > 10) {
          setQueryCoords({ lat: myLocation.latitude, lon: myLocation.longitude });
        }
      }
    }
  }, [myLocation, queryCoords]);

  const activeLat = mapCenter?.lat || queryCoords?.lat;
  const activeLon = mapCenter?.lon || queryCoords?.lon;

  const getRadiusForZoom = (zoom) => {
    if (zoom >= 20) return 0.1;   // 100m
    if (zoom === 19) return 0.15;  // 150m
    if (zoom === 18) return 0.25;  // 250m
    if (zoom === 17) return 0.5;   // 500m
    if (zoom === 16) return 0.8;   // 800m
    if (zoom === 15) return 1.5;   // 1.5km
    if (zoom === 14) return 3.0;   // 3km
    return 5.0;                   // 5km
  };

  const currentRadius = Math.min(mapSettings.radius, getRadiusForZoom(mapZoom));

  // Fetch places using React Query hook
  const { places, isLoading } = useNearbyPlaces(
    activeLat, 
    activeLon, 
    [], // empty array fetches all categories
    currentRadius * 1000
  );

  // Initialize geolocation and socket
  useEffect(() => {
    if (myLocation && !hasCentered.current) {
      hasCentered.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRecenterTrigger(prev => prev + 1);
    }
  }, [myLocation]);

  useEffect(() => {
    const socket = io(SOCKET_URL, { auth: { token: localStorage.getItem('token') } });
    socketRef.current = socket;

    socket.emit('join-trip', { tripId: '1' });
    socket.on('member-location-updated', (data) => {
      if (data.userId !== user?.id) {
        setMembers(prev => ({ ...prev, [data.userId]: data }));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  useEffect(() => {
    if (myLocation && socketRef.current) {
      socketRef.current.emit('update-location', { 
        tripId: '1', 
        latitude: myLocation.latitude, 
        longitude: myLocation.longitude, 
        accuracy: myLocation.accuracy 
      });
    }
  }, [myLocation]);

  const handleRecenter = () => {
    if (myLocation) setRecenterTrigger(prev => prev + 1);
  };

  const handleManualRefresh = () => {
    refreshLocation();
    setRecenterTrigger(prev => prev + 1);
  };

  const handleNavigate = async (spot) => {
    if (!myLocation) return;
    try {
      const data = await geoapifyService.getRoute(
        myLocation.latitude, myLocation.longitude,
        spot.lat, spot.lon
      );
      if (data.features && data.features.length > 0) {
        const route = data.features[0];
        const coordinates = route.geometry.coordinates[0].map(coord => [coord[1], coord[0]]); // Swap to LatLon for Leaflet
        setRouteCoords(coordinates);
        setNavigationInfo({
          distance: route.properties.distance,
          time: route.properties.time
        });
        setSelectedSpot(spot);
      }
    } catch (err) {
      console.error('Routing failed', err);
    }
  };

  const handleSpotClick = (spot) => {
    setSelectedSpot(spot);
    if (!spot) {
      setRouteCoords(null);
      setNavigationInfo(null);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 4px 0' }}>Live Map & Guide</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            Real-time local guide • {places.length} spots nearby
          </p>
        </div>
        <MapControls 
          mapLayer={mapLayer}
          setMapLayer={setMapLayer}
          mapSettings={mapSettings}
          setMapSettings={setMapSettings}
          onRecenter={handleRecenter}
          navigationInfo={navigationInfo}
          currentRadius={currentRadius}
        />
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: '20px', flex: 1, minHeight: 0 }}>
        {/* Map Container */}
        <div className="glass-card" style={{ position: 'relative', overflow: 'hidden', border: '1px solid var(--border-strong)' }}>
          {myLocation && (
            <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000, background: 'rgba(0,0,0,0.8)', color: 'white', padding: '10px', borderRadius: '8px', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '6px', border: '1px solid var(--border-light)', backdropFilter: 'blur(4px)' }}>
              <strong style={{ color: 'var(--primary)', marginBottom: '2px' }}>GPS Debug Panel</strong>
              <div>Lat: {myLocation.latitude.toFixed(5)}</div>
              <div>Lon: {myLocation.longitude.toFixed(5)}</div>
              <div>Accuracy: {Math.round(myLocation.accuracy)} meters</div>
              <button onClick={handleManualRefresh} style={{ marginTop: '6px', padding: '6px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                Refresh Location
              </button>
              {geoError && <div style={{ color: '#f87171', marginTop: '4px', fontSize: '10px' }}>{geoError}</div>}
            </div>
          )}
          <MapCanvas 
            center={myLocation ? [myLocation.latitude, myLocation.longitude] : [28.6139, 77.2090]}
            myLocation={myLocation}
            places={places}
            mapLayer={mapLayer}
            mapSettings={mapSettings}
            recenterTrigger={recenterTrigger}
            routeCoords={routeCoords}
            members={members}
            onSpotClick={handleSpotClick}
            selectedSpot={selectedSpot}
            onMapChange={handleMapChange}
          />
        </div>

        {/* RIGHT SIDEBAR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minHeight: 0, overflow: 'hidden' }}>
          <PlacesSidebar 
            places={places}
            isLoading={isLoading}
            onSpotClick={handleSpotClick}
            selectedSpot={selectedSpot}
            onNavigate={handleNavigate}
          />
        </div>
      </div>
    </motion.div>
  );
};
