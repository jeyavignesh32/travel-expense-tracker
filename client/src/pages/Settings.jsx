import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { Bell, Moon, Sun, Globe, Shield, MapPin, Database, Save, CheckCircle2 } from 'lucide-react';

export const Settings = () => {
  const { theme, toggleTheme } = useTheme();
  const [saved, setSaved] = useState(false);
  
  const [settings, setSettings] = useState(() => {
    const savedData = localStorage.getItem('travel_settings');
    if (savedData) {
      try {
        return JSON.parse(savedData);
      } catch (e) {
        console.error('Failed to parse settings:', e);
      }
    }
    return {
      notifications: true,
      proximityAlerts: true,
      tracking: true,
      mapRadius: 5,
      currency: 'INR',
      language: 'English',
      dataSharing: false
    };
  });

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    localStorage.setItem('travel_settings', JSON.stringify(settings));
    window.dispatchEvent(new Event('settings-updated'));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="animate-entrance" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Preferences & Settings</h1>
        <p style={{ color: 'var(--text-muted)' }}>Customize your TravelSense experience.</p>
      </header>

      {saved && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ 
            padding: '12px 16px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', 
            borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' 
          }}
        >
          <CheckCircle2 size={18} /> Settings saved successfully!
        </motion.div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Appearance */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            {theme === 'light' ? <Sun size={18} /> : <Moon size={18} />} Appearance
          </h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontWeight: '600', margin: '0 0 4px 0' }}>App Theme</p>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Switch between light and dark modes.</p>
            </div>
            <button onClick={toggleTheme} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              {theme === 'light' ? 'Switch to Dark' : 'Switch to Light'}
            </button>
          </div>
        </div>

        {/* Features & Tracking */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <MapPin size={18} color="var(--primary)" /> Tourist Radar & Tracking
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <ToggleOption 
              label="Live Tourist Radar" 
              desc="Continuously track and fetch real tourist spots near you."
              checked={settings.tracking}
              onChange={(e) => handleChange('tracking', e.target.checked)}
            />
            
            <ToggleOption 
              label="Proximity Notifications" 
              desc="Receive push alerts when you get close to a special spot."
              checked={settings.proximityAlerts}
              onChange={(e) => handleChange('proximityAlerts', e.target.checked)}
            />
            
            <div>
               <p style={{ fontWeight: '600', margin: '0 0 8px 0', fontSize: '14px' }}>Radar Radius: {settings.mapRadius} km</p>
               <input 
                 type="range" min="1" max="20" 
                 value={settings.mapRadius} 
                 onChange={(e) => handleChange('mapRadius', Number(e.target.value))}
                 style={{ width: '100%', accentColor: 'var(--primary)' }}
               />
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                 <span>1km</span><span>20km</span>
               </div>
            </div>
          </div>
        </div>

        {/* Global Settings */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <Globe size={18} color="var(--secondary)" /> Localization
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
             <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Currency</label>
                <select className="input-premium" value={settings.currency} onChange={e => handleChange('currency', e.target.value)}>
                   <option value="INR">INR (₹)</option>
                   <option value="USD">USD ($)</option>
                   <option value="EUR">EUR (€)</option>
                   <option value="GBP">GBP (£)</option>
                </select>
             </div>
             <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Language</label>
                <select className="input-premium" value={settings.language} onChange={e => handleChange('language', e.target.value)}>
                   <option value="English">English</option>
                   <option value="Spanish">Spanish</option>
                   <option value="French">French</option>
                   <option value="Hindi">Hindi</option>
                </select>
             </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
           <button onClick={handleSave} className="btn-premium" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Save size={18} /> Save Settings
           </button>
        </div>
      </div>
    </div>
  );
};

const ToggleOption = ({ label, desc, checked, onChange }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <div>
      <p style={{ fontWeight: '600', margin: '0 0 4px 0', fontSize: '14px' }}>{label}</p>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>{desc}</p>
    </div>
    <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ opacity: 0, width: 0, height: 0 }} />
      <span style={{ 
        position: 'absolute', cursor: 'pointer', inset: 0, 
        backgroundColor: checked ? 'var(--primary)' : 'var(--border-strong)', 
        borderRadius: '24px', transition: '0.4s' 
      }}>
        <span style={{
          position: 'absolute', height: '18px', width: '18px', left: checked ? '22px' : '3px', bottom: '3px',
          backgroundColor: 'white', borderRadius: '50%', transition: '0.4s'
        }} />
      </span>
    </label>
  </div>
);
