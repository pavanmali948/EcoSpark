import { useCallback, useRef, useState } from 'react';
import { haversineKm } from '../utils/geo';

const THROTTLE_MS = 4000;

/**
 * Driving route + ETA via OSRM (no API key). Falls back to straight-line distance.
 */
export function useOsrmRoute() {
  const [routeInfo, setRouteInfo] = useState(null);
  const [routeLatLngs, setRouteLatLngs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const lastFetchRef = useRef(0);

  const updateRoute = useCallback(async (customer, pump, { force = false } = {}) => {
    if (
      !customer ||
      pump?.latitude == null ||
      pump?.longitude == null ||
      Number.isNaN(Number(pump.latitude)) ||
      Number.isNaN(Number(pump.longitude))
    ) {
      return;
    }

    const now = Date.now();
    if (!force && now - lastFetchRef.current < THROTTLE_MS) return;
    lastFetchRef.current = now;

    const lat1 = customer.latitude;
    const lng1 = customer.longitude;
    const lat2 = pump.latitude;
    const lng2 = pump.longitude;

    setLoading(true);
    setError(null);

    const straightKm = haversineKm(lat1, lng1, lat2, lng2);

    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.code === 'Ok' && data.routes?.[0]) {
        const route = data.routes[0];
        const durationSec = Math.round(route.duration);
        const distanceKm = route.distance / 1000;
        const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);

        setRouteLatLngs(coords);
        setRouteInfo({
          distanceText: `${distanceKm.toFixed(1)} km`,
          distanceKm,
          durationSec,
          straightKm,
          eta: new Date(Date.now() + durationSec * 1000),
          fallback: false,
        });
      } else {
        throw new Error('Route not found');
      }
    } catch (err) {
      console.warn('OSRM route failed, using straight line', err);
      setRouteLatLngs([
        [lat1, lng1],
        [lat2, lng2],
      ]);
      const estSec = Math.round((straightKm / 40) * 3600);
      setRouteInfo({
        distanceText: `${straightKm.toFixed(1)} km (approx)`,
        distanceKm: straightKm,
        durationSec: estSec,
        straightKm,
        eta: new Date(Date.now() + estSec * 1000),
        fallback: true,
      });
      setError(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearRoute = useCallback(() => {
    setRouteInfo(null);
    setRouteLatLngs([]);
    setError(null);
  }, []);

  return { routeInfo, routeLatLngs, loading, error, updateRoute, clearRoute };
}
