// client/src/pages/LiveMap.jsx
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import { 
  Map as MapIcon, Navigation, Users, AlertCircle, 
  ShieldAlert, Radio, Signal, Info, Send, X, MoreHorizontal
} from 'lucide-react';

// Fix for default marker icons
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
  const [alerts, setAlerts] = useState([
    { id: '1', type: 'info', message: 'Group is moving towards Palolem Beach', time: '5m ago' }
  ]);
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
    });

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const loc = {
          userId: user?.id || 1,
          userName: user?.name || 'Test User',
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

  const triggerSOS = () => {
    setAlerts([{ id: Date.now(), type: 'sos', message: 'SOS Triggered by You!', time: 'now' }, ...alerts]);
  };

  const center = myLocation ? [myLocation.latitude, myLocation.longitude] : [15.2993, 74.1240]; // Center on Goa

  return (
    <div className="animate-entrance" style={{ height: 'calc(100vh - 180px)', display: 'flex', flexDirection: 'column' }}>
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '38px', fontWeight: '800' }}>Live Group <span className="gradient-text">Radar</span></h1>
          <p style={{ color: 'var(--text-muted)' }}>Real-time location pulse of your adventure squad.</p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button onClick={triggerSOS} className="btn-premium" style={{ background: 'var(--danger)', boxShadow: '0 8px 20px rgba(239, 68, 68, 0.3)' }}>
            <ShieldAlert size={20} />
            TRIGGER SOS
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: '24px', flex: 1 }}>
        {/* Map Container */}
        <div className="glass-card" style={{ position: 'relative', overflow: 'hidden', border: '1px solid var(--border-strong)' }}>
          <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%', zIndex: 1 }}>
            <TileLayer 
               url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
               attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' 
            />
            
            {myLocation && (
              <>
                <Marker position={[myLocation.latitude, myLocation.longitude]}>
                  <Popup><strong>You</strong><br/>Broadcasting live</Popup>
                </Marker>
                <Circle 
                  center={[myLocation.latitude, myLocation.longitude]} 
                  radius={500} 
                  pathOptions={{ color: 'var(--primary)', fillColor: 'var(--primary)', fillOpacity: 0.1, weight: 1 }} 
                />
                <RecenterMap position={[myLocation.latitude, myLocation.longitude]} />
              </>
            )}

            {Object.values(members).map(member => (
              <Marker key={member.userId} position={[member.latitude, member.longitude]}>
                <Popup><strong>{member.userName}</strong><br/>Last seen: {new Date(member.lastSeen).toLocaleTimeString()}</Popup>
              </Marker>
            ))}
          </MapContainer>
          
          {/* Map Overlay Controls */}
          <div style={{ position: 'absolute', bottom: '24px', left: '24px', zIndex: 10, display: 'flex', gap: '10px' }}>
             <button className="glass-card" style={{ padding: '12px', borderRadius: '12px', cursor: 'pointer' }}><Navigation size={18} /></button>
             <button className="glass-card" style={{ padding: '12px', borderRadius: '12px', cursor: 'pointer' }}><Signal size={18} color="var(--success)" /></button>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minHeight: 0 }}>
          {/* Alerts Card */}
          <div className="glass-card" style={{ padding: '24px', background: 'var(--bg-glass-heavy)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
               <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={18} color="var(--danger)" /> Recent Alerts
               </h3>
               <button className="btn-text" style={{ border: 'none', background: 'transparent', color: 'var(--primary)', fontSize: '12px', fontWeight: '700' }}>DISMISS ALL</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
               {alerts.map(a => (
                 <motion.div 
                   key={a.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                   style={{ 
                     padding: '12px 16px', borderRadius: '12px', 
                     background: a.type === 'sos' ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-surface)',
                     border: '1px solid', borderColor: a.type === 'sos' ? 'var(--danger)' : 'var(--border-light)'
                   }}
                 >
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <p style={{ fontSize: '14px', fontWeight: '600', margin: 0, color: a.type === 'sos' ? 'var(--danger)' : 'var(--text-main)' }}>{a.message}</p>
                      <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{a.time}</span>
                   </div>
                 </motion.div>
               ))}
            </div>
          </div>

          {/* Members Card */}
          <div className="glass-card" style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} color="var(--primary)" /> Adventure Squad
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800', color: 'var(--primary)' }}>{user?.name?.charAt(0) || 'Y'}</div>
                  <div style={{ flex: 1 }}>
                     <p style={{ fontSize: '14px', fontWeight: '600', margin: 0 }}>{user?.name || 'You'} (Lead)</p>
                     <p style={{ fontSize: '11px', color: 'var(--success)', margin: 0 }}>Active • Broadcasting</p>
                  </div>
                  <MoreHorizontal size={16} color="var(--text-dim)" />
               </div>
               
               {Object.values(members).length === 0 ? (
                 <p style={{ fontSize: '13px', color: 'var(--text-dim)', textAlign: 'center', marginTop: '20px' }}>Waiting for squad members to join...</p>
               ) : Object.values(members).map(m => (
                 <div key={m.userId} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800' }}>{m.userName.charAt(0)}</div>
                    <div style={{ flex: 1 }}>
                       <p style={{ fontSize: '14px', fontWeight: '600', margin: 0 }}>{m.userName}</p>
                       <p style={{ fontSize: '11px', color: 'var(--text-dim)', margin: 0 }}>Live • Last seen {new Date(m.lastSeen).toLocaleTimeString()}</p>
                    </div>
                    <Signal size={16} color="var(--success)" />
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
