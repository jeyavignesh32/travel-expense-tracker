import React from 'react';
import { CATEGORIES } from './categories';

export default function Sidebar({
  location, locError, locLoading, onRefreshLoc,
  radius, setRadius,
  isExtended, setIsExtended,
  extendAmount, setExtendAmount,
  activeCategories, toggleCategory,
  places, radiusUsed
}) {
  
  const handleRadiusChange = (e) => setRadius(Number(e.target.value));
  
  const inRadiusPlaces = places.filter(p => p.distance <= radius);
  const extendedPlaces = places.filter(p => p.distance > radius);

  const renderPlaceList = (list) => (
    <ul className="place-list">
      {list.map(p => (
        <li key={p.id}>
          <div className="place-header">
            <strong>{p.name}</strong>
            <span className="distance">{p.distance < 1000 ? p.distance + 'm' : (p.distance/1000).toFixed(1) + 'km'}</span>
          </div>
          {p.subtype && <div className="subtype">{p.subtype}</div>}
        </li>
      ))}
      {list.length === 0 && <li className="empty-list">No places found.</li>}
    </ul>
  );

  return (
    <div className="sidebar">
      <h2>🌍 TravelSense</h2>
      
      <div className="section location-status">
        {locLoading && <p>Locating you...</p>}
        {locError && (
          <div className="error-box">
            <p><strong>Location Error:</strong> {locError}</p>
            {locError.includes('denied') && <p className="help-text">Please click the lock icon in your browser URL bar and allow location access.</p>}
          </div>
        )}
        {location && !locLoading && !locError && (
          <div className="loc-success">
            <span>✅ Location acquired</span>
            <button onClick={onRefreshLoc} className="refresh-btn">Refresh</button>
          </div>
        )}
      </div>

      <div className="section filters">
        <h3>Categories</h3>
        <div className="chips">
          {CATEGORIES.map(c => (
            <button 
              key={c.id} 
              className={`chip ${activeCategories.includes(c.id) ? 'active' : ''}`}
              style={{ borderColor: c.color, backgroundColor: activeCategories.includes(c.id) ? c.color : 'transparent', color: activeCategories.includes(c.id) ? '#fff' : c.color }}
              onClick={() => toggleCategory(c.id)}
            >
              {c.icon} {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="section search-settings">
        <h3>Search Radius</h3>
        <input type="range" min="500" max="10000" step="500" value={radius} onChange={handleRadiusChange} className="slider" />
        <div className="radius-presets">
          <button onClick={() => setRadius(2000)}>2km</button>
          <button onClick={() => setRadius(5000)}>5km</button>
          <button onClick={() => setRadius(10000)}>10km</button>
        </div>
        <p className="current-radius">Current: {radius < 1000 ? radius + 'm' : radius/1000 + 'km'}</p>

        {radiusUsed && radiusUsed < radius && (
          <div className="shrink-notice">
            ⚠️ Server was busy. Radius automatically reduced to {radiusUsed < 1000 ? radiusUsed + 'm' : radiusUsed/1000 + 'km'}.
          </div>
        )}

        <div className="extended-search">
          <label>
            <input type="checkbox" checked={isExtended} onChange={(e) => setIsExtended(e.target.checked)} />
            Explore beyond radius
          </label>
          {isExtended && (
            <select value={extendAmount} onChange={(e) => setExtendAmount(Number(e.target.value))}>
              <option value="3000">+ 3 km</option>
              <option value="5000">+ 5 km</option>
              <option value="10000">+ 10 km</option>
              <option value="20000">+ 20 km</option>
              <option value="40000">+ 40 km</option>
            </select>
          )}
        </div>
      </div>

      <div className="section results">
        <h3>Nearby ({inRadiusPlaces.length})</h3>
        {renderPlaceList(inRadiusPlaces)}

        {isExtended && (
          <>
            <h3>Beyond Radius ({extendedPlaces.length})</h3>
            {renderPlaceList(extendedPlaces)}
          </>
        )}
      </div>
    </div>
  );
}
