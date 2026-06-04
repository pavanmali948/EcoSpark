import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import api from '../../utils/api';
import { loadGoogleMaps, isGoogleMapsConfigured } from '../../utils/googleMapsLoader';
import { useLiveGeolocation } from '../../hooks/useLiveGeolocation';
import { usePumpRoute } from '../../hooks/usePumpRoute';
import { useOsrmRoute } from '../../hooks/useOsrmRoute';
import GooglePumpMap, { recenterMap } from '../../components/maps/GooglePumpMap';
import LeafletPumpMap, { recenterLeafletMap } from '../../components/maps/LeafletPumpMap';
import LiveTrackingPanel from '../../components/maps/LiveTrackingPanel';
import { usePrefersDarkMap } from '../../utils/mapStyles';

const ROUTE_REFRESH_MS = 5000;

export default function PumpTrack() {
  const { pumpId } = useParams();
  const navigate = useNavigate();
  const darkMode = usePrefersDarkMap();
  const useGoogleMaps = isGoogleMapsConfigured();

  const [pump, setPump] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [pageLoading, setPageLoading] = useState(true);
  const [mapsApi, setMapsApi] = useState(null);
  const [mapsLoadError, setMapsLoadError] = useState(null);
  const mapInstanceRef = useRef(null);

  const geo = useLiveGeolocation();
  const googleRoute = usePumpRoute(useGoogleMaps ? mapsApi : null);
  const osrmRoute = useOsrmRoute();

  const routeInfo = useGoogleMaps ? googleRoute.routeInfo : osrmRoute.routeInfo;
  const routeLoading = useGoogleMaps ? googleRoute.loading : osrmRoute.loading;
  const routeError = useGoogleMaps ? googleRoute.error : osrmRoute.error;
  const updateRoute = useGoogleMaps ? googleRoute.updateRoute : osrmRoute.updateRoute;
  const routePath = useGoogleMaps ? googleRoute.routePath : null;
  const routeLatLngs = useGoogleMaps ? [] : osrmRoute.routeLatLngs;

  const pumpCoords = useMemo(() => {
    if (!pump?.latitude && pump?.latitude !== 0) return null;
    if (!pump?.longitude && pump?.longitude !== 0) return null;
    const lat = Number(pump.latitude);
    const lng = Number(pump.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
    return { latitude: lat, longitude: lng };
  }, [pump]);

  useEffect(() => {
    const fetchPump = async () => {
      setPageLoading(true);
      setLoadError('');
      try {
        const res = await api.get('/pumps');
        if (!res.data?.success) {
          setLoadError(res.data?.message || 'Failed to load pump');
          return;
        }
        const found = (res.data.data || []).find((p) => p.id === pumpId);
        if (!found) {
          setLoadError('Pump not found');
          return;
        }
        setPump(found);
      } catch (err) {
        setLoadError(err.response?.data?.message || err.message || 'Failed to load pump');
      } finally {
        setPageLoading(false);
      }
    };
    fetchPump();
  }, [pumpId]);

  useEffect(() => {
    if (!useGoogleMaps) return;
    loadGoogleMaps()
      .then(setMapsApi)
      .catch((err) => setMapsLoadError(err.message));
  }, [useGoogleMaps]);

  const refreshRoute = useCallback(
    (force = false) => {
      if (!geo.position || !pumpCoords) return;
      updateRoute(geo.position, pumpCoords, { force });
    },
    [geo.position, pumpCoords, updateRoute]
  );

  useEffect(() => {
    if (geo.position && pumpCoords) {
      refreshRoute(true);
    }
  }, [geo.position?.latitude, geo.position?.longitude, pumpCoords, refreshRoute]);

  useEffect(() => {
    if (!geo.isTracking || !geo.position || !pumpCoords) return undefined;
    const interval = setInterval(() => refreshRoute(false), ROUTE_REFRESH_MS);
    return () => clearInterval(interval);
  }, [geo.isTracking, geo.position, pumpCoords, refreshRoute]);

  const handleStartTracking = async () => {
    try {
      if (!geo.position) await geo.locateOnce();
      geo.start();
    } catch {
      // error set in hook
    }
  };

  const handleMapReady = (map) => {
    mapInstanceRef.current = map;
  };

  const handleRecenter = () => {
    if (useGoogleMaps) recenterMap(mapInstanceRef.current);
    else recenterLeafletMap(mapInstanceRef.current);
  };

  const mapCenter = pumpCoords
    ? { lat: pumpCoords.latitude, lng: pumpCoords.longitude }
    : geo.position
      ? { lat: geo.position.latitude, lng: geo.position.longitude }
      : { lat: 28.6139, lng: 77.209 };

  const showGoogleMap = useGoogleMaps && mapsApi;
  const showLeafletMap = !useGoogleMaps || (useGoogleMaps && mapsLoadError && !mapsApi);

  if (pageLoading) {
    return (
      <div className="min-h-full flex items-center justify-center bg-blue-50 dark:bg-gray-950 p-6">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (loadError || !pump) {
    return (
      <div className="min-h-full bg-blue-50 dark:bg-gray-950 p-6">
        <button
          type="button"
          onClick={() => navigate('/user/bookslot')}
          className="flex items-center gap-2 text-blue-600 mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to pumps
        </button>
        <p className="text-red-600">{loadError || 'Pump unavailable'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        <button
          type="button"
          onClick={() => navigate('/user/bookslot')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to pump list
        </button>

        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">
          Live navigation to pump
        </h1>

        {mapsLoadError && useGoogleMaps && (
          <p className="text-sm text-amber-700 bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3">
            Google Maps failed to load ({mapsLoadError}). Showing OpenStreetMap instead.
          </p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-2">
            {showGoogleMap ? (
              <GooglePumpMap
                mapsApi={mapsApi}
                center={mapCenter}
                customerPosition={geo.position}
                pumpPosition={pumpCoords}
                directionsResult={routePath}
                onMapReady={handleMapReady}
                darkMode={darkMode}
                className="h-[50vh] min-h-[320px] w-full rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700"
              />
            ) : showLeafletMap ? (
              <LeafletPumpMap
                customerPosition={geo.position}
                pumpPosition={pumpCoords}
                routeLatLngs={routeLatLngs}
                onMapReady={handleMapReady}
                className="h-[50vh] min-h-[320px] w-full rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700"
              />
            ) : (
              <div className="h-[50vh] min-h-[320px] rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 px-1">
              {useGoogleMaps
                ? 'Using Google Maps. Route refreshes every 5s while tracking is active.'
                : 'Using OpenStreetMap (no Google API key required). Add VITE_GOOGLE_MAPS_API_KEY in Frontend/.env.development for Google Maps.'}
            </p>
          </div>

          <LiveTrackingPanel
            pump={pump}
            position={geo.position}
            routeInfo={routeInfo}
            routeLoading={routeLoading}
            geoError={geo.error}
            routeError={routeError}
            trackingStatus={geo.status}
            onStartTracking={handleStartTracking}
            onStopTracking={geo.stop}
            onRecenter={handleRecenter}
            onViewSlots={() => navigate(`/user/slots/${pump.id}`)}
            mapProvider={useGoogleMaps && mapsApi ? 'google' : 'openstreetmap'}
          />
        </div>
      </div>
    </div>
  );
}
