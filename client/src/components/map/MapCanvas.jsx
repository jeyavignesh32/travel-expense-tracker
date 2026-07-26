// client/src/components/map/MapCanvas.jsx
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, Polyline, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { Landmark, Eye, TreePine, Ticket, Utensils, Coffee, GlassWater, Star } from 'lucide-react';
import L from 'leaflet';
import PlacePopup from '../places/PlacePopup';

// Custom icons
const UserIcon = new L.DivIcon({
  html: `<div style="background:linear-gradient(135deg,#2563eb,#9333ea);width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 4px 12px rgba(37,99,235,0.4);font-size:16px;animation:pulse 2s infinite;">📍</div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

const getSpotIconLeaflet = (type) => {
  let color = '#f59e0b';
  let emoji = '⭐';
  if (type === 'restaurant' || type === 'cafe' || type === 'bar') { color = '#ef4444'; emoji = '🍔'; }
  else if (type === 'hotel' || type === 'accommodation') { color = '#8b5cf6'; emoji = '🏨'; }
  else if (type === 'hospital' || type === 'healthcare') { color = '#10b981'; emoji = '🏥'; }
  else if (type === 'atm' || type === 'commercial') { color = '#0ea5e9'; emoji = '🏧'; }
  else if (type === 'fuel' || type === 'vehicle') { color = '#f97316'; emoji = '⛽'; }
  else if (type === 'toilet' || type === 'amenity') { color = '#64748b'; emoji = '🚾'; }

  return new L.DivIcon({
    html: `<div style="background:${color};width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);font-size:14px;">${emoji}</div>`,
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28]
  });
};

const RecenterMap = ({ position, trigger }) => {
  const map = useMap();
  useEffect(() => {
    if (position && trigger > 0) {
      map.setView(position, map.getZoom() || 14);
    }
  }, [position, map, trigger]);
  return null;
};

const MapMoveListener = ({ refetchPlaces }) => {
  useMapEvents({
    moveend: () => {
      // Debounce or just trigger directly. react-query handles deduplication somewhat, but direct call is fine.
      if (refetchPlaces) refetchPlaces();
    }
  });
  return null;
};

export default function MapCanvas({
  center,
  myLocation,
  places,
  mapLayer,
  mapSettings,
  recenterTrigger,
  routeCoords,
  members,
  onSpotClick,
  selectedSpot,
  refetchPlaces
}) {
  return (
    <MapContainer center={center} zoom={14} maxZoom={22} style={{ height: '100%', width: '100%', zIndex: 1 }}>
      <MapMoveListener refetchPlaces={refetchPlaces} />
      {mapLayer === 'street' && (
        <TileLayer
          url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          attribution='&copy; Google Maps'
          maxZoom={22}
          maxNativeZoom={22}
        />
      )}
      {mapLayer === 'satellite' && (
        <TileLayer
          url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
          attribution='&copy; Google Maps'
          maxZoom={22}
          maxNativeZoom={20}
        />
      )}
      {mapLayer === 'terrain' && (
        <TileLayer
          url="https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}"
          attribution='&copy; Google Maps'
          maxZoom={22}
          maxNativeZoom={20}
        />
      )}
      
      {myLocation && (
        <>
          <Marker position={[myLocation.latitude, myLocation.longitude]} icon={UserIcon}>
            <Popup><strong>📍 You are here</strong></Popup>
          </Marker>
          <Circle 
            center={[myLocation.latitude, myLocation.longitude]} 
            radius={mapSettings.radius * 1000} 
            pathOptions={{ color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.06, weight: 1, dashArray: '8 4' }} 
          />
          <RecenterMap position={[myLocation.latitude, myLocation.longitude]} trigger={recenterTrigger} />
        </>
      )}

      {/* Render Route Polyline */}
      {routeCoords && routeCoords.length > 0 && (
        <Polyline positions={routeCoords} pathOptions={{ color: '#0ea5e9', weight: 5, opacity: 0.8 }} />
      )}

      <MarkerClusterGroup chunkedLoading>
        {places.map(spot => {
          const type = spot.categories[0] || 'tourism.attraction';
          const typeCategory = type.split('.')[1] || type;
          return (
            <Marker 
              key={spot.id} 
              position={[spot.lat, spot.lon]} 
              icon={getSpotIconLeaflet(typeCategory)}
              eventHandlers={{ click: () => onSpotClick(spot) }}
            >
              <PlacePopup spot={spot} />
            </Marker>
          );
        })}
      </MarkerClusterGroup>

      {/* Group members if tracking */}
      {members && Object.values(members).map(member => (
        <Marker key={member.userId} position={[member.latitude, member.longitude]}>
          <Popup><strong>{member.userName}</strong><br/>Last seen: {new Date(member.lastSeen).toLocaleTimeString()}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
