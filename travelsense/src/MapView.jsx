import React from 'react';
import { MapContainer, TileLayer, LayersControl, Marker, Popup, Circle, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { getCategoryStyles } from './categories';
import 'leaflet/dist/leaflet.css';

// Fix default icon issues in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const createEmojiIcon = (category, isExtended) => {
  const style = getCategoryStyles(category);
  const opacity = isExtended ? 0.6 : 1;
  const borderStyle = isExtended ? '2px dashed' : '2px solid';
  
  return L.divIcon({
    className: 'custom-emoji-icon',
    html: `<div style="
      background-color: white; 
      border: ${borderStyle} ${style.color}; 
      border-radius: 50%; 
      width: 30px; 
      height: 30px; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      font-size: 16px;
      opacity: ${opacity};
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    ">${style.icon}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

const RecenterMap = ({ center }) => {
  const map = useMap();
  React.useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
};

export default function MapView({ location, places, radius, extendedRadius, isExtendedEnabled }) {
  const defaultCenter = [51.505, -0.09]; // Fallback London center
  const center = location ? [location.lat, location.lon] : defaultCenter;

  return (
    <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="Streets (OSM)">
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        </LayersControl.BaseLayer>
        
        <LayersControl.BaseLayer name="Satellite">
          <TileLayer
            attribution='&copy; Esri'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        </LayersControl.BaseLayer>

        <LayersControl.BaseLayer name="Satellite + Labels">
          <TileLayer
            attribution='&copy; Esri & OpenStreetMap'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        </LayersControl.BaseLayer>

        <LayersControl.BaseLayer name="Terrain">
          <TileLayer
            attribution='&copy; OpenTopoMap'
            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
          />
        </LayersControl.BaseLayer>

        <LayersControl.BaseLayer name="Dark">
          <TileLayer
            attribution='&copy; CARTO'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
        </LayersControl.BaseLayer>

        <LayersControl.BaseLayer name="Light">
          <TileLayer
            attribution='&copy; CARTO'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
        </LayersControl.BaseLayer>
      </LayersControl>

      <RecenterMap center={location ? [location.lat, location.lon] : null} />

      {location && (
        <>
          <Marker position={[location.lat, location.lon]}>
            <Popup>You are here</Popup>
          </Marker>
          <Circle 
            center={[location.lat, location.lon]} 
            radius={location.accuracy || 50} 
            pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.2, stroke: false }} 
          />
          <Circle 
            center={[location.lat, location.lon]} 
            radius={radius} 
            pathOptions={{ color: '#10b981', dashArray: '5, 10', fillOpacity: 0.05 }} 
          />
          {isExtendedEnabled && extendedRadius > radius && (
            <Circle 
              center={[location.lat, location.lon]} 
              radius={extendedRadius} 
              pathOptions={{ color: '#8b5cf6', dashArray: '5, 10', fillOpacity: 0.02 }} 
            />
          )}
        </>
      )}

      <MarkerClusterGroup chunkedLoading>
        {places.map(place => {
          const isExtended = isExtendedEnabled && place.distance > radius;
          return (
            <Marker 
              key={place.id} 
              position={[place.lat, place.lon]}
              icon={createEmojiIcon(place.actualType, isExtended)}
            >
              <Popup>
                <strong>{place.name}</strong><br/>
                {place.subtype && <span style={{color: '#666'}}>{place.subtype}<br/></span>}
                <em>{place.distance}m away</em>
              </Popup>
            </Marker>
          );
        })}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
