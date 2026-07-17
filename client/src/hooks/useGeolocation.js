import { useState, useEffect, useRef, useCallback } from "react";

/**
 * useGeolocation
 * - Gets a HIGH-ACCURACY initial position.
 * - Rejects positions with accuracy > ACCURACY_THRESHOLD_M meters.
 * - Subscribes to live location updates via watchPosition when live=true.
 * - Provides accuracy, error state, and a manual refresh function.
 */

// Only accept GPS fixes better than 100 metres
const ACCURACY_THRESHOLD_M = 100;

export function useGeolocation({ live = false } = {}) {
  const [position, setPosition] = useState(null); // { latitude, longitude, accuracy }
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const watchIdRef = useRef(null);
  const bestAccuracyRef = useRef(Infinity);

  const handleSuccess = useCallback((pos) => {
    const { latitude, longitude, accuracy } = pos.coords;

    // If we have a terribly inaccurate new fix (>2000m) but already had a decent one, maybe ignore it.
    // Otherwise, ALWAYS update the position so the user's movement is tracked, 
    // even if the new accuracy (e.g. 20m) is slightly worse than a previous lucky fix (e.g. 10m).
    if (accuracy > 2000 && bestAccuracyRef.current < 1000) {
      console.warn(`[Geo] Ignoring highly inaccurate fix (${Math.round(accuracy)}m)`);
      return;
    }

    if (accuracy < bestAccuracyRef.current) {
      bestAccuracyRef.current = accuracy;
    }

    setPosition({ latitude, longitude, accuracy, timestamp: pos.timestamp });
    setError(null);
    setLoading(false);
    
    if (accuracy > ACCURACY_THRESHOLD_M) {
      console.warn(`[Geo] Accuracy ${Math.round(accuracy)}m exceeds threshold — waiting for better fix`);
    }
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
    bestAccuracyRef.current = Infinity;
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,        // never use a cached position on manual refresh
    });
  }, [handleSuccess, handleError]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      setLoading(false);
      return;
    }

    // First: quick low-accuracy fix so the map can open fast
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Accept any initial fix (we'll refine via watchPosition)
        const { latitude, longitude, accuracy } = pos.coords;
        if (accuracy < bestAccuracyRef.current) {
          bestAccuracyRef.current = accuracy;
          setPosition({ latitude, longitude, accuracy, timestamp: pos.timestamp });
          setLoading(false);
        }
      },
      handleError,
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 10000 }
    );

    // Then immediately kick off a high-accuracy watch
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,        // always get fresh GPS
      }
    );

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
