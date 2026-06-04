import { useCallback, useRef, useState } from 'react';
import { haversineKm } from '../utils/geo';

const ROUTE_THROTTLE_MS = 4000;

/**
 * Google Directions + Distance Matrix for customer → pump routing.
 */
export function usePumpRoute(mapsApi) {
  const [routeInfo, setRouteInfo] = useState(null);
  const [routePath, setRoutePath] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const lastFetchRef = useRef(0);
  const directionsRendererRef = useRef(null);
  const directionsServiceRef = useRef(null);
  const distanceMatrixRef = useRef(null);

  const ensureServices = useCallback(() => {
    if (!mapsApi) return false;
    if (!directionsServiceRef.current) {
      directionsServiceRef.current = new mapsApi.DirectionsService();
    }
    if (!distanceMatrixRef.current) {
      distanceMatrixRef.current = new mapsApi.DistanceMatrixService();
    }
    return true;
  }, [mapsApi]);

  const updateRoute = useCallback(
    async (customer, pump, { force = false } = {}) => {
      if (
        !customer ||
        pump?.latitude == null ||
        pump?.longitude == null ||
        Number.isNaN(Number(pump.latitude)) ||
        Number.isNaN(Number(pump.longitude))
      ) {
        return;
      }
      if (!ensureServices()) return;

      const now = Date.now();
      if (!force && now - lastFetchRef.current < ROUTE_THROTTLE_MS) return;
      lastFetchRef.current = now;

      setLoading(true);
      setError(null);

      const origin = { lat: customer.latitude, lng: customer.longitude };
      const destination = { lat: pump.latitude, lng: pump.longitude };

      const straightKm = haversineKm(
        customer.latitude,
        customer.longitude,
        pump.latitude,
        pump.longitude
      );

      try {
        const [directionsResult, matrixResult] = await Promise.all([
          new Promise((resolve, reject) => {
            directionsServiceRef.current.route(
              {
                origin,
                destination,
                travelMode: mapsApi.TravelMode.DRIVING,
                drivingOptions: {
                  departureTime: new Date(),
                  trafficModel: mapsApi.TrafficModel.BEST_GUESS,
                },
              },
              (result, status) => {
                if (status === mapsApi.DirectionsStatus.OK) resolve(result);
                else reject(new Error(`Directions failed: ${status}`));
              }
            );
          }),
          new Promise((resolve, reject) => {
            distanceMatrixRef.current.getDistanceMatrix(
              {
                origins: [origin],
                destinations: [destination],
                travelMode: mapsApi.TravelMode.DRIVING,
                drivingOptions: {
                  departureTime: new Date(),
                  trafficModel: mapsApi.TrafficModel.BEST_GUESS,
                },
              },
              (response, status) => {
                if (status === mapsApi.DistanceMatrixStatus.OK) resolve(response);
                else reject(new Error(`Distance Matrix failed: ${status}`));
              }
            );
          }),
        ]);

        const leg = directionsResult.routes?.[0]?.legs?.[0];
        const matrixEl = matrixResult.rows?.[0]?.elements?.[0];

        const distanceText = leg?.distance?.text || matrixEl?.distance?.text;
        const durationSec =
          leg?.duration_in_traffic?.value ??
          leg?.duration?.value ??
          matrixEl?.duration_in_traffic?.value ??
          matrixEl?.duration?.value;
        const distanceMeters = leg?.distance?.value ?? matrixEl?.distance?.value;

        setRoutePath(directionsResult);
        setRouteInfo({
          distanceText,
          distanceKm: distanceMeters != null ? distanceMeters / 1000 : straightKm,
          durationSec,
          straightKm,
          eta: durationSec != null ? new Date(Date.now() + durationSec * 1000) : null,
        });
      } catch (err) {
        console.warn('Route update failed', err);
        setError(err.message || 'Failed to calculate route');
        setRouteInfo({
          distanceText: `${straightKm.toFixed(1)} km (approx)`,
          distanceKm: straightKm,
          durationSec: null,
          straightKm,
          eta: null,
          fallback: true,
        });
        setRoutePath(null);
      } finally {
        setLoading(false);
      }
    },
    [ensureServices, mapsApi]
  );

  const attachDirectionsToMap = useCallback(
    (map) => {
      if (!mapsApi || !map) return null;
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(map);
        return directionsRendererRef.current;
      }
      directionsRendererRef.current = new mapsApi.DirectionsRenderer({
        map,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#2563eb',
          strokeWeight: 5,
          strokeOpacity: 0.85,
        },
      });
      return directionsRendererRef.current;
    },
    [mapsApi]
  );

  const applyRouteToRenderer = useCallback(
    (directionsResult) => {
      if (directionsRendererRef.current && directionsResult) {
        directionsRendererRef.current.setDirections(directionsResult);
      }
    },
    []
  );

  const clearRoute = useCallback(() => {
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setDirections({ routes: [] });
    }
    setRoutePath(null);
    setRouteInfo(null);
    setError(null);
  }, []);

  return {
    routeInfo,
    routePath,
    loading,
    error,
    updateRoute,
    attachDirectionsToMap,
    applyRouteToRenderer,
    clearRoute,
  };
}
