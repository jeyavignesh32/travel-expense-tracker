// client/src/components/sidebar/PlacesSidebar.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, MapPin, Loader2, Navigation } from 'lucide-react';

const CATEGORY_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'catering.restaurant', label: '🍔 Dining' },
  { id: 'accommodation.hotel', label: '🏨 Hotels' },
  { id: 'tourism.attraction', label: '🏛️ Attractions' },
  { id: 'healthcare.hospital', label: '🏥 Hospitals' },
  { id: 'commercial.atm', label: '🏧 ATMs' },
  { id: 'service.vehicle.fuel', label: '⛽ Fuel' }
];

export default function PlacesSidebar({ places, isLoading, onSpotClick, selectedSpot, onNavigate }) {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showList, setShowList] = useState(true);

  const filteredPlaces = places.filter(place => {
    if (activeFilter !== 'all' && !place.categories.includes(activeFilter)) return false;
    if (search && !place.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="glass-card" style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 12px 0' }}>
          <MapPin size={16} color="var(--primary)" /> Smart Guide
          <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '10px', background: 'var(--primary-glow)', color: 'var(--primary)' }}>
            {filteredPlaces.length}
          </span>
        </h3>
        
        <input 
          type="text" 
          placeholder="Search nearby places..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-premium" 
          style={{ marginBottom: '12px', width: '100%' }}
        />

        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }} className="hide-scrollbar">
          {CATEGORY_FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              style={{
                padding: '4px 12px', fontSize: '11px', fontWeight: '700', borderRadius: '20px', border: '1px solid',
                cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
                background: activeFilter === f.id ? 'var(--primary-glow)' : 'transparent',
                borderColor: activeFilter === f.id ? 'var(--primary)' : 'var(--border-light)',
                color: activeFilter === f.id ? 'var(--primary)' : 'var(--text-muted)'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
          <button onClick={() => setShowList(prev => !prev)} style={{
            marginBottom: '12px',
            padding: '6px 12px',
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            {showList ? <EyeOff size={16} /> : <Eye size={16} />}
            {showList ? 'Hide' : 'Show'} List
          </button>
      </div>
      
      {showList && (
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)' }}>
            <Loader2 size={32} className="animate-spin" style={{ marginBottom: '12px', opacity: 0.4 }} />
            <p style={{ fontSize: '13px' }}>Scanning your surroundings...</p>
          </div>
        )}

        {!isLoading && filteredPlaces.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)' }}>
            <MapPin size={32} style={{ marginBottom: '12px', opacity: 0.3 }} />
            <p style={{ fontSize: '13px' }}>No places found matching criteria.</p>
          </div>
        )}

        <AnimatePresence>
          {filteredPlaces.map((spot, i) => {
            const isAffordable = spot.expenseScore > 80;
            const isModerate = spot.expenseScore > 50 && spot.expenseScore <= 80;
            const isSelected = selectedSpot?.id === spot.id;

            return (
              <motion.div
                key={spot.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                onClick={() => onSpotClick(isSelected ? null : spot)}
                style={{ 
                  padding: '14px', borderRadius: '14px', cursor: 'pointer',
                  background: isSelected ? 'var(--primary-glow)' : 'var(--bg-surface)',
                  border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-light)'}`,
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ fontSize: '13px', margin: '0 0 4px 0', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {spot.name}
                    </h4>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '11px', marginBottom: '6px' }}>
                      <span style={{ fontWeight: '700', color: 'var(--primary)' }}>
                        📏 {spot.distanceLabel}
                      </span>
                      <span style={{ fontWeight: '700', color: isAffordable ? 'var(--success)' : isModerate ? 'var(--warning)' : 'var(--danger)' }}>
                        💰 {spot.costLabel}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.04em' }}>
                        {spot.categories[0]?.split('.')[1] || 'Place'}
                      </span>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '10px', fontWeight: '800', color: isAffordable ? 'var(--success)' : isModerate ? 'var(--warning)' : 'var(--danger)' }}>
                          Score: {spot.expenseScore}/100
                        </span>
                        {isSelected && onNavigate && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); onNavigate(spot); }}
                            style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
                          >
                            <Navigation size={10} /> Route
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    )}
</div>
  );
}
