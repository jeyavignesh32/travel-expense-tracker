// client/src/components/map/MapControls.jsx
import React from 'react';
import { Layers, MapPin, Navigation } from 'lucide-react';

export default function MapControls({ mapLayer, setMapLayer, mapSettings, setMapSettings, onRecenter, navigationInfo }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
      <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Radius: {mapSettings.radius} km</label>
      <input
        type="range"
        min="1"
        max="20"
        value={mapSettings.radius}
        onChange={e => setMapSettings(prev => ({ ...prev, radius: Number(e.target.value) }))}
        style={{ width: '100px' }}
      />
      
      {/* Layer Toggle */}
      <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-surface)', borderRadius: '8px', padding: '3px', border: '1px solid var(--border-light)' }}>
        <button
          onClick={() => setMapLayer('street')}
          style={{
            padding: '4px 10px', fontSize: '11px', fontWeight: '700', borderRadius: '6px', border: 'none', cursor: 'pointer',
            background: mapLayer === 'street' ? 'var(--primary)' : 'transparent',
            color: mapLayer === 'street' ? 'white' : 'var(--text-muted)'
          }}
        >🗺️ Street</button>
        <button
          onClick={() => setMapLayer('satellite')}
          style={{
            padding: '4px 10px', fontSize: '11px', fontWeight: '700', borderRadius: '6px', border: 'none', cursor: 'pointer',
            background: mapLayer === 'satellite' ? 'var(--secondary)' : 'transparent',
            color: mapLayer === 'satellite' ? 'white' : 'var(--text-muted)'
          }}
        >🛰️ Satellite</button>
        <button
          onClick={() => setMapLayer('terrain')}
          style={{
            padding: '4px 10px', fontSize: '11px', fontWeight: '700', borderRadius: '6px', border: 'none', cursor: 'pointer',
            background: mapLayer === 'terrain' ? 'var(--success)' : 'transparent',
            color: mapLayer === 'terrain' ? 'white' : 'var(--text-muted)'
          }}
        >⛰️ Terrain</button>
      </div>

      <button 
        onClick={onRecenter}
        style={{
          padding: '6px 12px', fontSize: '11px', fontWeight: '700', borderRadius: '8px', border: '1px solid var(--border-light)',
          background: 'var(--bg-surface)', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
        }}
      >
        <MapPin size={12} /> Recenter
      </button>

      {navigationInfo && (
        <div style={{
          padding: '6px 12px', borderRadius: '20px', background: 'var(--primary-glow)', color: 'var(--primary)',
          fontSize: '11px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px'
        }}>
          <Navigation size={12} /> 
          Route: {navigationInfo.distance / 1000}km • {Math.round(navigationInfo.time / 60)} mins
        </div>
      )}
    </div>
  );
}
