import { useCallback, useEffect, useRef, useState } from 'react';

const GEO_ERRORS = {
  1: 'Location permission denied. Enable location access in browser settings.',
  2: 'GPS position unavailable. Try moving outdoors or enabling device location.',
  3: 'Location request timed out. Please try again.',
};

/**
 * Continuous customer location via navigator.geolocation.watchPosition
 */
export function useLiveGeolocation() {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('stopped'); // stopped | active | error
  const watchIdRef = useRef(null);

  const stop = useCallback(() => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setStatus((s) => (s === 'active' ? 'stopped' : s));
  }, []);

  const start = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      setStatus('error');
      return;
    }

    setError(null);
    setStatus('active');

    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          timestamp: pos.timestamp,
        });
        setError(null);
        setStatus('active');
      },
      (err) => {
        setError(GEO_ERRORS[err.code] || err.message || 'Unable to access location.');
        setStatus('error');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 20000,
      }
    );
  }, []);

  /** One-shot location (for initial map center before tracking) */
  const locateOnce = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return Promise.reject(new Error('unsupported'));
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const next = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            heading: pos.coords.heading,
            speed: pos.coords.speed,
            timestamp: pos.timestamp,
          };
          setPosition(next);
          setError(null);
          resolve(next);
        },
        (err) => {
          const msg = GEO_ERRORS[err.code] || err.message;
          setError(msg);
          reject(new Error(msg));
        },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 10000 }
      );
    });
  }, []);

  useEffect(() => () => stop(), [stop]);

  return {
    position,
    error,
    status,
    isTracking: status === 'active',
    start,
    stop,
    locateOnce,
  };
}
