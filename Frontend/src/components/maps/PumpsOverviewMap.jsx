import { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps, isGoogleMapsConfigured } from '../../utils/googleMapsLoader';
import { DARK_MAP_STYLE } from '../../utils/mapStyles';
import { Loader2 } from 'lucide-react';

/**
 * Map showing all pump markers; highlights selected pump.
 */
export default function PumpsOverviewMap({
  pumps = [],
  selectedPumpId,
  userPosition,
  onSelectPump,
  darkMode = false,
  className = 'h-[280px] w-full rounded-2xl',
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const mapsApiRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isGoogleMapsConfigured()) return;
    loadGoogleMaps()
      .then((api) => {
        mapsApiRef.current = api;
        setReady(true);
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!ready || !mapsApiRef.current || !containerRef.current || mapRef.current) return;

    const api = mapsApiRef.current;
    const center = userPosition
      ? { lat: userPosition.latitude, lng: userPosition.longitude }
      : pumps[0]?.latitude
        ? { lat: pumps[0].latitude, lng: pumps[0].longitude }
        : { lat: 28.6139, lng: 77.209 };

    mapRef.current = new api.Map(containerRef.current, {
      center,
      zoom: 11,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      styles: darkMode ? DARK_MAP_STYLE : undefined,
    });
  }, [ready, darkMode, pumps, userPosition]);

  useEffect(() => {
    if (!mapRef.current || !mapsApiRef.current) return;
    const api = mapsApiRef.current;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    pumps.forEach((pump) => {
      if (pump.latitude == null || pump.longitude == null) return;
      const isSelected = pump.id === selectedPumpId;
      const marker = new api.Marker({
        map: mapRef.current,
        position: { lat: pump.latitude, lng: pump.longitude },
        title: pump.name,
        label: isSelected ? { text: '★', color: '#fff' } : undefined,
        icon: {
          path: api.SymbolPath.CIRCLE,
          scale: isSelected ? 14 : 10,
          fillColor: isSelected ? '#2563eb' : '#16a34a',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
        },
      });
      marker.addListener('click', () => onSelectPump?.(pump));
      markersRef.current.push(marker);
    });

    if (userPosition) {
      const userMarker = new api.Marker({
        map: mapRef.current,
        position: { lat: userPosition.latitude, lng: userPosition.longitude },
        title: 'You',
        icon: {
          path: api.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: '#2563eb',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
        },
        zIndex: 999,
      });
      markersRef.current.push(userMarker);
    }

    const bounds = new api.LatLngBounds();
    let has = false;
    if (userPosition) {
      bounds.extend({ lat: userPosition.latitude, lng: userPosition.longitude });
      has = true;
    }
    pumps.forEach((p) => {
      if (p.latitude || p.longitude) {
        bounds.extend({ lat: p.latitude, lng: p.longitude });
        has = true;
      }
    });
    if (has) mapRef.current.fitBounds(bounds, 48);
  }, [pumps, selectedPumpId, userPosition, onSelectPump]);

  if (!isGoogleMapsConfigured()) {
    return (
      <div className={`${className} bg-blue-50 dark:bg-gray-800 flex items-center justify-center text-sm text-gray-600 dark:text-gray-400 p-4 text-center`}>
        Add <code className="text-xs">VITE_GOOGLE_MAPS_API_KEY</code> to show the map overview.
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className} bg-red-50 flex items-center justify-center text-sm text-red-600 p-4`}>
        {error}
      </div>
    );
  }

  if (!ready) {
    return (
      <div className={`${className} bg-gray-100 dark:bg-gray-800 flex items-center justify-center`}>
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return <div ref={containerRef} className={className} aria-label="Nearby pumps map" />;
}
