// client/src/pages/LiveMap.jsx
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import { 
  Map as MapIcon, Navigation, Users, AlertCircle, 
  ShieldAlert, Radio, Signal, Info, Send 
} from 'lucide-react';

// Fix for default marker icons in Leaflet + React
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const SOCKET_URL = 'http://localhost:5000';

// Component to dynamically recenter the map when our position changes
const RecenterMap = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, map.getZoom());
  }, [position, map]);
  return null;
};

export const LiveMap = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [myLocation, setMyLocation] = useState(null);
  const socketRef = useRef();

  useEffect(() => {
    socketRef.current = io(SOCKET_URL);
    socketRef.current.emit('join-trip', 1);

    socketRef.current.on('location-pulse', (data) => {
      setMembers(prev => ({
        ...prev,
        [data.userId]: { ...data, lastSeen: new Date() }
      }));
      checkSafety(data);
    });

    socketRef.current.on('sos-received', (data) => {
      setAlerts(prev => [{ ...data, id: Date.now(), type: 'sos' }, ...prev]);
    });

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const loc = {
          userId: user.id,
          userName: user.name,
          tripId: 1,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        };
        setMyLocation(loc);
        socketRef.current.emit('update-location', loc);
      },
      (err) => console.error(err),
      { enableHighAccuracy: true }
    );

    return () => {
      socketRef.current.disconnect();
      navigator.geolocation.clearWatch(watchId);
    };
  }, [user]);

  const checkSafety = (memberLoc) => {
    if (!myLocation) return;
    const dist = calculateDistance(
      myLocation.latitude, myLocation.longitude,
      memberLoc.latitude, memberLoc.longitude
    );
    if (dist > 500) {
      const alertId = `missed-${memberLoc.userId}`;
      if (!alerts.some(a => a.id === alertId)) {
        setAlerts(prev => [{
          id: alertId,
          type: 'missed_front',
          message: `${memberLoc.userName || 'Member'} is lagging behind (${Math.round(dist)}m)`,
          timestamp: new Date()
        }, ...prev]);
      }
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const phi1 = lat1 * Math.PI/180, phi2 = lat2 * Math.PI/180;
    const dPhi = (lat2-lat1) * Math.PI/180, dLambda = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(dPhi/2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda/2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  const triggerSOS = () => {
    if (myLocation) {
      socketRef.current.emit('sos-alert', { ...myLocation, userName: user.name });
    }
  };

  const center = myLocation ? [myLocation.latitude, myLocation.longitude] : [20.5937, 78.9629]; // Default India center

  return (
    <div className="animate-fade-in" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '32px', marginBottom: '4px' }}>Live Group Map</h1>
          <p style={{ color: 'var(--text-muted)' }}>Real-time location monitoring using Leaflet (No API Key Required).</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={triggerSOS} className="btn-primary" style={{ background: 'var(--danger)' }}>
            <ShieldAlert size={20} /> TRIGGER SOS
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px', flex: 1, minHeight: 0 }}>
        {/* Real Leaflet Map */}
        <div className="glass-card" style={{ position: 'relative', overflow: 'hidden' }}>
          <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
            
            {myLocation && (
              <>
                <Marker position={[myLocation.latitude, myLocation.longitude]}>
                  <Popup><strong>You</strong><br/>Broadcasting live</Popup>
                </Marker>
                <Circle center={[myLocation.latitude, myLocation.longitude]} radius={500} pathOptions={{ color: 'var(--primary)', fillColor: 'var(--primary)', fillOpacity: 0.1 }} />
                <RecenterMap position={[myLocation.latitude, myLocation.longitude]} />
              </>
            )}

            {Object.values(members).map(member => (
              <Marker key={member.userId} position={[member.latitude, member.longitude]}>
                <Popup><strong>{member.userName}</strong><br/>Last seen: {new Date(member.lastSeen).toLocaleTimeString()}</Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Sidebar: Alerts & Members */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto' }}>
          <div className="glass-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} color="var(--danger)" /> Alerts
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {alerts.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No concerns.</p> : 
                alerts.map(a => (
                  <div key={a.id} style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '8px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 'bold' }}>{a.message}</p>
                  </div>
                ))
              }
            </div>
          </div>

          <div className="glass-card" style={{ padding: '20px', flex: 1 }}>
            <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Members</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px' }}>{user.name} (You)</span>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }} />
              </div>
              {Object.values(members).map(m => (
                <div key={m.userId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px' }}>{m.userName}</span>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
