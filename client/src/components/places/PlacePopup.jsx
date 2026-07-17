// client/src/components/places/PlacePopup.jsx
import React from 'react';
import { Popup } from 'react-leaflet';
import { ExternalLink, Phone, MapPin, Navigation } from 'lucide-react';

export default function PlacePopup({ spot, onNavigate }) {
  const isAffordable = spot.expenseScore > 80;
  const isModerate = spot.expenseScore > 50 && spot.expenseScore <= 80;

  return (
    <Popup className="custom-popup">
      <div style={{ minWidth: '220px', textAlign: 'left', fontFamily: 'Inter, sans-serif' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '800', margin: '0 0 4px 0', color: 'var(--text-main)' }}>
          {spot.name}
        </h3>
        
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.05em', marginBottom: '8px' }}>
          {spot.categories[0]?.split('.')[1] || spot.categories[0]}
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={12} /> {spot.distanceLabel}
          </span>
          <span style={{ fontSize: '12px', fontWeight: '700', color: isAffordable ? 'var(--success)' : isModerate ? 'var(--warning)' : 'var(--danger)' }}>
            {spot.costLabel}
          </span>
        </div>

        {spot.address && (
          <p style={{ fontSize: '11px', color: 'var(--text-dim)', margin: '0 0 8px 0', lineHeight: '1.4' }}>
            {spot.address}
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
          {spot.phone && (
            <a href={`tel:${spot.phone}`} style={{ fontSize: '11px', color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Phone size={12} /> {spot.phone}
            </a>
          )}
          {spot.website && (
            <a href={spot.website} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ExternalLink size={12} /> Visit Website
            </a>
          )}
        </div>

        <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', fontWeight: '800', color: isAffordable ? 'var(--success)' : isModerate ? 'var(--warning)' : 'var(--danger)' }}>
            SCORE: {spot.expenseScore}/100
          </span>
          {onNavigate && (
            <button 
              onClick={() => onNavigate(spot)}
              style={{
                background: 'var(--primary)', color: 'white', border: 'none', padding: '4px 10px',
                borderRadius: '6px', fontSize: '10px', fontWeight: '700', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '4px'
              }}
            >
              <Navigation size={10} /> Route
            </button>
          )}
        </div>
      </div>
    </Popup>
  );
}
