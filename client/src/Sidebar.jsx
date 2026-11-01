import { CATEGORIES, CATEGORY_KEYS } from "./categories";

export default function Sidebar({
  position,
  loading,
  error,
  places,
  extendedPlaces,
  extendedSearch,
  setExtendedSearch,
  extendedRadius,
  radius,
  setRadius,
  activeCategories,
  toggleCategory,
  onRefresh,
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>🧭 TravelSense</h1>
        <p className="subtitle">Real nearby places, powered by OpenStreetMap</p>
      </div>

      <div className="status-box">
        {loading && !error && (
          <p className="status loading">📡 Detecting your location…</p>
        )}
        {error && (
          <>
            <p className="status error">⚠️ {error}</p>
            {error.includes("denied") && (
              <div className="help-box">
                <strong>How to enable location:</strong>
                <ol>
                  <li>Click the lock/info icon in the address bar</li>
                  <li>Find "Location" and set it to "Allow"</li>
                  <li>Reload the page</li>
                  <li>Click "Refresh Location & Places" below</li>
                </ol>
              </div>
            )}
          </>
        )}
        {position && !error && (
          <p className="status ok">
            📍 Lat {position.lat.toFixed(5)}, Lon {position.lon.toFixed(5)}
            <br />
            <span className="accuracy">
              Accuracy: ±{Math.round(position.accuracy)} m
            </span>
          </p>
        )}
        <button className="refresh-btn" onClick={onRefresh}>
          🔄 Refresh Location & Places
        </button>
      </div>

      <div className="radius-box">
        <label htmlFor="radius">Search Radius: {radius} m</label>
        <input
          id="radius"
          type="range"
          min="500"
          max="10000"
          step="500"
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
        />
        <div className="radius-presets">
          {[2000, 5000, 10000].map((r) => (
            <button
              key={r}
              className={radius === r ? "active" : ""}
              onClick={() => setRadius(r)}
            >
              {r / 1000} km
            </button>
          ))}
        </div>

        <label className="extended-toggle">
          <input
            type="checkbox"
            checked={extendedSearch}
            onChange={(e) => setExtendedSearch(e.target.checked)}
          />
          Also explore beyond radius (up to {(extendedRadius / 1000).toFixed(1)} km)
        </label>
      </div>

      <div className="category-filters">
        <h3>Categories</h3>
        <div className="category-grid">
          {CATEGORY_KEYS.map((key) => (
            <button
              key={key}
              className={`category-chip ${
                activeCategories.includes(key) ? "active" : ""
              }`}
              style={{
                borderColor: CATEGORIES[key].color,
                background: activeCategories.includes(key)
                  ? CATEGORIES[key].color
                  : "transparent",
                color: activeCategories.includes(key) ? "#fff" : CATEGORIES[key].color,
              }}
              onClick={() => toggleCategory(key)}
            >
              {CATEGORIES[key].icon} {CATEGORIES[key].label}
            </button>
          ))}
        </div>
      </div>

      <div className="places-list">
        <h3>
          Nearby Places{" "}
          {places.length > 0 && <span className="count">({places.length})</span>}
        </h3>
        {places.length === 0 && !loading && (
          <p className="empty-state">
            No verified OpenStreetMap places found in this radius. Try increasing
            the radius or selecting more categories.
          </p>
        )}
        <ul>
          {places.map((place) => (
            <li key={place.id}>
              <span className="place-icon">{CATEGORIES[place.category]?.icon}</span>
              <div className="place-info">
                <strong>{place.name}</strong>
                <span className="place-meta">
                  {CATEGORIES[place.category]?.label}
                  {place.subtype && ` · ${place.subtype}`}
                  {place.distance != null && ` · ${place.distance} m`}
                </span>
                {place.address && <span className="place-address">{place.address}</span>}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {extendedSearch && (
        <div className="places-list extended-list">
          <h3>
            Beyond {(radius / 1000).toFixed(1)} km{" "}
            {extendedPlaces.length > 0 && (
              <span className="count">({extendedPlaces.length})</span>
            )}
          </h3>
          {extendedPlaces.length === 0 && !loading && (
            <p className="empty-state">
              No additional verified places found out to {(extendedRadius / 1000).toFixed(1)} km.
            </p>
          )}
          <ul>
            {extendedPlaces.map((place) => (
              <li key={place.id} className="extended-item">
                <span className="place-icon">{CATEGORIES[place.category]?.icon}</span>
                <div className="place-info">
                  <strong>{place.name}</strong>
                  <span className="place-meta">
                    {CATEGORIES[place.category]?.label}
                    {place.subtype && ` · ${place.subtype}`}
                    {place.distance != null && ` · ${place.distance} m`}
                  </span>
                  {place.address && <span className="place-address">{place.address}</span>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <footer>
        Data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors via Overpass API
      </footer>
    </aside>
  );
}
