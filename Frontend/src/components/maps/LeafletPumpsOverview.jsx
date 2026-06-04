import { useEffect, useRef } from 'react';
import L from 'leaflet';

export default function LeafletPumpsOverview({
  pumps = [],
  selectedPumpId,
  userPosition,
  onSelectPump,
  className = 'h-[280px] w-full rounded-2xl',
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersLayerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const center = userPosition
      ? [userPosition.latitude, userPosition.longitude]
      : pumps[0]?.latitude != null
        ? [pumps[0].latitude, pumps[0].longitude]
        : [28.6139, 77.209];

    mapRef.current = L.map(containerRef.current, { center, zoom: 11 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(mapRef.current);

    markersLayerRef.current = L.layerGroup().addTo(mapRef.current);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();

    pumps.forEach((pump) => {
      if (pump.latitude == null || pump.longitude == null) return;
      const isSelected = pump.id === selectedPumpId;
      const marker = L.circleMarker([pump.latitude, pump.longitude], {
        radius: isSelected ? 14 : 10,
        color: '#fff',
        weight: 2,
        fillColor: isSelected ? '#2563eb' : '#16a34a',
        fillOpacity: 1,
      }).bindPopup(pump.name);
      marker.on('click', () => onSelectPump?.(pump));
      markersLayerRef.current.addLayer(marker);
    });

    if (userPosition) {
      const userMarker = L.circleMarker([userPosition.latitude, userPosition.longitude], {
        radius: 9,
        color: '#fff',
        weight: 2,
        fillColor: '#2563eb',
        fillOpacity: 1,
      }).bindPopup('You');
      markersLayerRef.current.addLayer(userMarker);
    }

    const points = [];
    if (userPosition) points.push([userPosition.latitude, userPosition.longitude]);
    pumps.forEach((p) => {
      if (p.latitude != null && p.longitude != null) points.push([p.latitude, p.longitude]);
    });
    if (points.length > 0) {
      mapRef.current.fitBounds(L.latLngBounds(points), { padding: [32, 32] });
    }
  }, [pumps, selectedPumpId, userPosition, onSelectPump]);

  return (
    <div ref={containerRef} className={`${className} z-0`} aria-label="Nearby pumps map (OpenStreetMap)" />
  );
}
