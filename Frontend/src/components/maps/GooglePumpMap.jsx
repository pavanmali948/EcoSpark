import { useEffect, useRef, useState } from 'react';
import { DARK_MAP_STYLE } from '../../utils/mapStyles';

/**
 * Google Map with customer + pump markers and optional directions overlay.
 */
export default function GooglePumpMap({
  mapsApi,
  center,
  customerPosition,
  pumpPosition,
  directionsResult,
  onMapReady,
  className = 'h-[420px] w-full rounded-2xl',
  darkMode = false,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const customerMarkerRef = useRef(null);
  const pumpMarkerRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const [mapError, setMapError] = useState(null);

  useEffect(() => {
    if (!mapsApi || !containerRef.current || mapRef.current) return;

    try {
      const initialCenter = center || { lat: 28.6139, lng: 77.209 };
      mapRef.current = new mapsApi.Map(containerRef.current, {
        center: initialCenter,
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        styles: darkMode ? DARK_MAP_STYLE : undefined,
      });

      directionsRendererRef.current = new mapsApi.DirectionsRenderer({
        map: mapRef.current,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#2563eb',
          strokeWeight: 5,
          strokeOpacity: 0.9,
        },
      });

      pumpMarkerRef.current = new mapsApi.Marker({
        map: mapRef.current,
        title: 'CNG Pump',
        label: { text: 'P', color: '#fff', fontWeight: 'bold' },
        icon: {
          path: mapsApi.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#16a34a',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });

      customerMarkerRef.current = new mapsApi.Marker({
        map: mapRef.current,
        title: 'You',
        label: { text: '●', color: '#fff' },
        icon: {
          path: mapsApi.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#2563eb',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        optimized: false,
      });

      onMapReady?.(mapRef.current);
    } catch (err) {
      setMapError(err.message || 'Failed to initialize map');
    }
  }, [mapsApi, center, darkMode, onMapReady]);

  useEffect(() => {
    if (!mapRef.current || !mapsApi) return;
    mapRef.current.setOptions({ styles: darkMode ? DARK_MAP_STYLE : [] });
  }, [darkMode, mapsApi]);

  useEffect(() => {
    if (!pumpMarkerRef.current || !pumpPosition) return;
    const pos = { lat: pumpPosition.latitude, lng: pumpPosition.longitude };
    pumpMarkerRef.current.setPosition(pos);
    pumpMarkerRef.current.setVisible(true);
  }, [pumpPosition]);

  useEffect(() => {
    if (!customerMarkerRef.current) return;
    if (!customerPosition) {
      customerMarkerRef.current.setVisible(false);
      return;
    }
    const pos = { lat: customerPosition.latitude, lng: customerPosition.longitude };
    customerMarkerRef.current.setPosition(pos);
    customerMarkerRef.current.setVisible(true);
  }, [customerPosition]);

  useEffect(() => {
    if (!directionsRendererRef.current) return;
    if (directionsResult) {
      directionsRendererRef.current.setDirections(directionsResult);
    } else {
      directionsRendererRef.current.setDirections({ routes: [] });
    }
  }, [directionsResult]);

  useEffect(() => {
    if (!mapRef.current || !mapsApi) return;
    const bounds = new mapsApi.LatLngBounds();
    let hasPoint = false;

    if (customerPosition) {
      bounds.extend({ lat: customerPosition.latitude, lng: customerPosition.longitude });
      hasPoint = true;
    }
    if (pumpPosition) {
      bounds.extend({ lat: pumpPosition.latitude, lng: pumpPosition.longitude });
      hasPoint = true;
    }

    if (hasPoint) {
      mapRef.current.fitBounds(bounds, { top: 60, right: 40, bottom: 40, left: 40 });
      const listener = mapsApi.event.addListenerOnce(mapRef.current, 'bounds_changed', () => {
        const z = mapRef.current.getZoom();
        if (z > 16) mapRef.current.setZoom(16);
      });
      return () => mapsApi.event.removeListener(listener);
    }
  }, [customerPosition, pumpPosition, directionsResult, mapsApi]);

  const recenter = () => {
    if (!mapRef.current || !mapsApi) return;
    const bounds = new mapsApi.LatLngBounds();
    if (customerPosition) {
      bounds.extend({ lat: customerPosition.latitude, lng: customerPosition.longitude });
    }
    if (pumpPosition) {
      bounds.extend({ lat: pumpPosition.latitude, lng: pumpPosition.longitude });
    }
    if (!bounds.isEmpty()) {
      mapRef.current.fitBounds(bounds, { top: 60, right: 40, bottom: 40, left: 40 });
    } else if (center) {
      mapRef.current.panTo(center);
      mapRef.current.setZoom(13);
    }
  };

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.__recenter = recenter;
    }
  });

  if (mapError) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 text-red-600 text-sm p-4`}>
        {mapError}
      </div>
    );
  }

  return <div ref={containerRef} className={className} role="application" aria-label="Pump location map" />;
}

export function recenterMap(mapInstance) {
  mapInstance?.__recenter?.();
}
