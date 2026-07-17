import React, { useState } from 'react';
import { Leaf, Trash2, Bus, Plane, Car, Droplet, Coffee, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const EcoTracker = () => {
  const [wasteItems, setWasteItems] = useState([
    { id: 1, text: 'Refused single-use plastic', checked: false, icon: <Coffee size={16} /> },
    { id: 2, text: 'Used refillable water bottle', checked: false, icon: <Droplet size={16} /> },
    { id: 3, text: 'Recycled local waste', checked: false, icon: <Trash2 size={16} /> },
  ]);

  const [transport, setTransport] = useState({
    mode: 'car',
    distance: 150
  });

  const toggleWasteItem = (id) => {
    setWasteItems(wasteItems.map(w => w.id === id ? { ...w, checked: !w.checked } : w));
  };

  // Very basic industry estimates: kg CO2 per km
  const emissionFactors = {
    car: 0.192,
    bus: 0.105,
    plane: 0.254,
    train: 0.041
  };

  const calculateFootprint = () => {
    return (transport.distance * emissionFactors[transport.mode]).toFixed(1);
  };

  return (
    <div className="animate-entrance" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '38px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Leaf color="var(--success)" /> Eco <span className="gradient-text">Tracker</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>Monitor your carbon footprint and waste reduction.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Carbon Calculator */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <Car size={20} color="var(--primary)" /> Carbon Footprint Estimator
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Transport Mode</label>
              <select className="input-premium" value={transport.mode} onChange={(e) => setTransport({ ...transport, mode: e.target.value })}>
                <option value="car">Car / Taxi</option>
                <option value="bus">Bus</option>
                <option value="train">Train</option>
                <option value="plane">Flight</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Distance (km)</label>
              <input type="number" className="input-premium" value={transport.distance} onChange={(e) => setTransport({ ...transport, distance: Number(e.target.value) })} />
            </div>
          </div>

          <div style={{ padding: '20px', background: 'var(--primary-glow)', borderRadius: '16px', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--primary)', marginBottom: '8px' }}>Estimated Emissions</p>
            <h2 style={{ fontSize: '36px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
              {calculateFootprint()} <span style={{ fontSize: '16px', color: 'var(--text-muted)' }}>kg CO₂</span>
            </h2>
          </div>
        </div>

        {/* Waste Log */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <Trash2 size={20} color="var(--success)" /> Waste Reduction Log
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {wasteItems.map(item => (
              <motion.div 
                key={item.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => toggleWasteItem(item.id)}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', 
                  background: item.checked ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-surface)', 
                  border: `1px solid ${item.checked ? 'var(--success)' : 'var(--border-light)'}`,
                  borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <div style={{ color: item.checked ? 'var(--success)' : 'var(--text-dim)' }}>
                  {item.checked ? <CheckCircle size={20} /> : <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid var(--border-light)' }} />}
                </div>
                <div style={{ color: item.checked ? 'var(--success)' : 'var(--text-muted)' }}>
                  {item.icon}
                </div>
                <span style={{ fontWeight: '600', color: item.checked ? 'var(--success)' : 'var(--text-main)', textDecoration: item.checked ? 'line-through' : 'none' }}>
                  {item.text}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
