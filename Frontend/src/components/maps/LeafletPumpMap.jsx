import { useEffect, useRef } from 'react';
import L from 'leaflet';

/**
 * OpenStreetMap via Leaflet — works without Google API key.
 */
export default function LeafletPumpMap({
  customerPosition,
  pumpPosition,
  routeLatLngs = [],
  className = 'h-[420px] w-full rounded-2xl',
  onMapReady,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const customerMarkerRef = useRef(null);
  const pumpMarkerRef = useRef(null);
  const routeLineRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const defaultLat = pumpPosition?.latitude ?? customerPosition?.latitude ?? 28.6139;
    const defaultLng = pumpPosition?.longitude ?? customerPosition?.longitude ?? 77.209;

    mapRef.current = L.map(containerRef.current, {
      center: [defaultLat, defaultLng],
      zoom: 13,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapRef.current);

    pumpMarkerRef.current = L.circleMarker([defaultLat, defaultLng], {
      radius: 12,
      color: '#fff',
      weight: 2,
      fillColor: '#16a34a',
      fillOpacity: 1,
    }).addTo(mapRef.current).bindPopup('CNG Pump');

    customerMarkerRef.current = L.circleMarker([defaultLat, defaultLng], {
      radius: 10,
      color: '#fff',
      weight: 2,
      fillColor: '#2563eb',
      fillOpacity: 1,
    });

    onMapReady?.(mapRef.current);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !pumpPosition) return;
    const lat = pumpPosition.latitude;
    const lng = pumpPosition.longitude;
    if (!pumpMarkerRef.current) {
      pumpMarkerRef.current = L.circleMarker([lat, lng], {
        radius: 12,
        color: '#fff',
        weight: 2,
        fillColor: '#16a34a',
        fillOpacity: 1,
      }).addTo(mapRef.current).bindPopup('CNG Pump');
    } else {
      pumpMarkerRef.current.setLatLng([lat, lng]);
    }
  }, [pumpPosition]);

  useEffect(() => {
    if (!mapRef.current) return;
    if (!customerPosition) {
      customerMarkerRef.current?.remove();
      customerMarkerRef.current = null;
      return;
    }
    const lat = customerPosition.latitude;
    const lng = customerPosition.longitude;
    if (!customerMarkerRef.current) {
      customerMarkerRef.current = L.circleMarker([lat, lng], {
        radius: 10,
        color: '#fff',
        weight: 2,
        fillColor: '#2563eb',
        fillOpacity: 1,
      }).addTo(mapRef.current).bindPopup('You');
    } else {
      customerMarkerRef.current.setLatLng([lat, lng]);
      if (!mapRef.current.hasLayer(customerMarkerRef.current)) {
        customerMarkerRef.current.addTo(mapRef.current);
      }
    }
  }, [customerPosition]);

  useEffect(() => {
    if (!mapRef.current) return;
    if (routeLineRef.current) {
      routeLineRef.current.remove();
      routeLineRef.current = null;
    }
    if (routeLatLngs.length >= 2) {
      routeLineRef.current = L.polyline(routeLatLngs, {
        color: '#2563eb',
        weight: 5,
        opacity: 0.85,
      }).addTo(mapRef.current);
    }
    fitBounds(mapRef.current, customerPosition, pumpPosition);
  }, [routeLatLngs, customerPosition, pumpPosition]);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.__recenter = () => fitBounds(mapRef.current, customerPosition, pumpPosition);
    }
  });

  return (
    <div
      ref={containerRef}
      className={`${className} z-0`}
      role="application"
      aria-label="Pump location map (OpenStreetMap)"
    />
  );
}

function fitBounds(map, customerPosition, pumpPosition) {
  const points = [];
  if (customerPosition) points.push([customerPosition.latitude, customerPosition.longitude]);
  if (pumpPosition) points.push([pumpPosition.latitude, pumpPosition.longitude]);
  if (points.length === 0) return;
  map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 16 });
}

export function recenterLeafletMap(mapInstance) {
  mapInstance?.__recenter?.();
}
