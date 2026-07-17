import React, { useState, useEffect, useCallback } from 'react';
import { useGeolocation } from './useGeolocation';
import { fetchPlaces } from './overpassService';
import { CATEGORIES } from './categories';
import Sidebar from './Sidebar';
import MapView from './MapView';
import './App.css';

function App() {
  const { location, error: locError, loading: locLoading } = useGeolocation();
  const [radius, setRadius] = useState(2000);
  const [isExtended, setIsExtended] = useState(false);
  const [extendAmount, setExtendAmount] = useState(3000);
  const [activeCategories, setActiveCategories] = useState(CATEGORIES.map(c => c.id));
  
  const [places, setPlaces] = useState([]);
  const [radiusUsed, setRadiusUsed] = useState(null);
  const [isFetching, setIsFetching] = useState(false);

  const toggleCategory = (id) => {
    setActiveCategories(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const loadPlaces = useCallback(async () => {
    if (!location) return;
    setIsFetching(true);
    setRadiusUsed(null);

    const totalRadius = isExtended ? Math.min(50000, radius + extendAmount) : radius;
    
    // Convert active category IDs to actual values to filter later
    const activeValues = CATEGORIES.filter(c => activeCategories.includes(c.id)).map(c => c.value);

    const result = await fetchPlaces(location.lat, location.lon, totalRadius, (reducedRadius) => {
      setRadiusUsed(reducedRadius);
    });

    // Filter by active categories
    const filtered = result.places.filter(p => {
      if (p.actualType === 'shop') return activeValues.includes('*'); // Map shop=*
      return activeValues.includes(p.actualType);
    });

    setPlaces(filtered);
    if (result.radiusUsed < totalRadius) {
      setRadiusUsed(result.radiusUsed);
    }
    setIsFetching(false);
  }, [location, radius, isExtended, extendAmount, activeCategories]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPlaces();
    }, 800); // Debounce
    return () => clearTimeout(timer);
  }, [loadPlaces]);

  return (
    <div className="app-container">
      <Sidebar 
        location={location} locError={locError} locLoading={locLoading} onRefreshLoc={loadPlaces}
        radius={radius} setRadius={setRadius}
        isExtended={isExtended} setIsExtended={setIsExtended}
        extendAmount={extendAmount} setExtendAmount={setExtendAmount}
        activeCategories={activeCategories} toggleCategory={toggleCategory}
        places={places} radiusUsed={radiusUsed}
      />
      <div className="map-container">
        {isFetching && <div className="fetching-overlay">Fetching real-world data...</div>}
        <MapView 
          location={location} 
          places={places} 
          radius={radius} 
          extendedRadius={Math.min(50000, radius + extendAmount)} 
          isExtendedEnabled={isExtended} 
        />
      </div>
    </div>
  );
}

export default App;
