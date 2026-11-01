import { useState, useEffect, useRef, useCallback } from "react";

/**
 * useGeolocation
 * - Gets a high-accuracy initial position.
 * - Optionally subscribes to live location updates via watchPosition.
 * - Provides accuracy, error state, and a manual refresh function.
 */
export function useGeolocation({ live = false } = {}) {
  const [position, setPosition] = useState(null); // { lat, lon, accuracy }
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const watchIdRef = useRef(null);

  const handleSuccess = useCallback((pos) => {
    setPosition({
      lat: pos.coords.latitude,
      lon: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      timestamp: pos.timestamp,
    });
    setError(null);
    setLoading(false);
  }, []);

  const handleError = useCallback((err) => {
    setError(mapGeoError(err));
    setLoading(false);
  }, []);

  const refresh = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      setLoading(false);
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });
  }, [handleSuccess, handleError]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      setLoading(false);
      return;
    }

    refresh();

    if (live) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        handleSuccess,
        handleError,
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 5000,
        }
      );
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live]);

  return { position, error, loading, refresh };
}

function mapGeoError(err) {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return "Location permission denied. Please allow location access in your browser settings.";
    case err.POSITION_UNAVAILABLE:
      return "Location information is unavailable. Try moving to an area with better GPS signal.";
    case err.TIMEOUT:
      return "Location request timed out. Please try again.";
    default:
      return "An unknown error occurred while detecting your location.";
  }
}
