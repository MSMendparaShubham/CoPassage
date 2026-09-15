import { useState, useEffect, useRef, useCallback } from 'react';

export interface LocationCoordinates {
  lat: number;
  lng: number;
  accuracy?: number;
}

// Default to Mumbai center if permission is not yet granted
export const DEFAULT_COORDINATES: LocationCoordinates = {
  lat: 19.0760,
  lng: 72.8777,
};

export function useGeolocation() {
  const [coordinates, setCoordinates] = useState<LocationCoordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setHasPermission(false);
      return;
    }

    setIsTracking(true);
    setError(null);

    // Initial position fetch
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setHasPermission(true);
        setError(null);
      },
      (err) => {
        console.warn('Geolocation initial error:', err.message);
        setError(err.message);
        setHasPermission(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );

    // Continuous watch
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setCoordinates({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setHasPermission(true);
        setError(null);
      },
      (err) => {
        console.warn('Geolocation watch error:', err.message);
        setError(err.message);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  }, []);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  }, []);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    coordinates: coordinates || DEFAULT_COORDINATES,
    rawCoordinates: coordinates,
    hasPermission,
    error,
    isTracking,
    startTracking,
    stopTracking,
  };
}
