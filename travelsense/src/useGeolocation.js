import { useState, useEffect } from 'react';

export function useGeolocation() {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }

    const success = (position) => {
      setLocation({
        lat: position.coords.latitude,
        lon: position.coords.longitude,
        accuracy: position.coords.accuracy,
      });
      setError(null);
      setLoading(false);
    };

    const handleError = (err) => {
      let errorMessage = 'An unknown error occurred.';
      switch (err.code) {
        case err.PERMISSION_DENIED:
          errorMessage = 'Location permission denied. Please allow location access in your browser.';
          break;
        case err.POSITION_UNAVAILABLE:
          errorMessage = 'Location information is unavailable.';
          break;
        case err.TIMEOUT:
          errorMessage = 'The request to get user location timed out.';
          break;
        default:
          errorMessage = err.message || 'An unknown error occurred.';
          break;
      }
      setError(errorMessage);
      setLoading(false);
    };

    const watchId = navigator.geolocation.watchPosition(success, handleError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return { location, error, loading };
}
