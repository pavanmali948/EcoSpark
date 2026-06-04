import {
  MapPin,
  Navigation,
  Clock,
  Crosshair,
  Play,
  Square,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { formatCoords, formatDuration, formatKm } from '../../utils/geo';

export default function LiveTrackingPanel({
  pump,
  position,
  routeInfo,
  routeLoading,
  geoError,
  routeError,
  trackingStatus,
  onStartTracking,
  onStopTracking,
  onRecenter,
  onViewSlots,
  mapProvider = 'openstreetmap',
}) {
  const isActive = trackingStatus === 'active';
  const isError = trackingStatus === 'error';
  const usingOsm = mapProvider === 'openstreetmap';

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-lg overflow-hidden dark:border-gray-700 dark:bg-gray-900">
      <div className="bg-gradient-to-r from-blue-600 to-green-600 px-5 py-4 text-white">
        <h2 className="text-lg font-bold">{pump?.name || 'Pump'}</h2>
        <p className="text-sm text-white/90 flex items-start gap-1 mt-1">
          <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="break-words">{pump?.location || '—'}</span>
        </p>
      </div>

      <div className="p-5 space-y-4">
        {usingOsm && (
          <div className="flex gap-2 text-blue-800 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              Map: <strong>OpenStreetMap</strong> (works without a key). Optional: add{' '}
              <code className="text-xs">VITE_GOOGLE_MAPS_API_KEY</code> to{' '}
              <code className="text-xs">Frontend/.env.development</code> and restart{' '}
              <code className="text-xs">npm run dev</code> for Google Maps.
            </span>
          </div>
        )}

        {(geoError || routeError) && (
          <div className="flex gap-2 text-red-700 bg-red-50 border border-red-100 rounded-lg p-3 text-sm dark:bg-red-950/30 dark:border-red-900 dark:text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{geoError || routeError}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 text-sm">
          <Stat label="Latitude" value={position ? position.latitude.toFixed(6) : '—'} />
          <Stat label="Longitude" value={position ? position.longitude.toFixed(6) : '—'} />
          <Stat
            label="Distance"
            value={
              routeLoading ? (
                <span className="inline-flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Updating…
                </span>
              ) : (
                routeInfo?.distanceText || formatKm(routeInfo?.distanceKm)
              )
            }
            icon={Navigation}
          />
          <Stat
            label="Travel time"
            value={routeInfo?.durationSec != null ? formatDuration(routeInfo.durationSec) : '—'}
            icon={Clock}
          />
        </div>

        <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Tracking status</span>
            <span
              className={`font-semibold px-2 py-0.5 rounded-full text-xs ${
                isActive
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : isError
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {isActive ? 'Active' : isError ? 'Error' : 'Stopped'}
            </span>
          </div>
          {routeInfo?.eta && (
            <p className="mt-2 text-gray-700 dark:text-gray-300">
              Est. arrival:{' '}
              <strong>
                {routeInfo.eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </strong>
            </p>
          )}
          {position && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 font-mono break-all">
              {formatCoords(position.latitude, position.longitude)}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {!isActive ? (
            <Button
              type="button"
              onClick={onStartTracking}
              className="flex-1 min-w-[140px] bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Play className="w-4 h-4 mr-2" />
              Start tracking
            </Button>
          ) : (
            <Button
              type="button"
              onClick={onStopTracking}
              variant="outline"
              className="flex-1 min-w-[140px] border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300"
            >
              <Square className="w-4 h-4 mr-2" />
              Stop tracking
            </Button>
          )}
          <Button type="button" variant="outline" onClick={onRecenter} className="flex-1 min-w-[120px]">
            <Crosshair className="w-4 h-4 mr-2" />
            Recenter
          </Button>
        </div>

        {onViewSlots && (
          <Button
            type="button"
            onClick={onViewSlots}
            className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:opacity-90 text-white"
          >
            Book slot at this pump
          </Button>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, icon: Icon }) {
  return (
    <div className="rounded-lg border border-gray-100 dark:border-gray-700 p-3 bg-white dark:bg-gray-900">
      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </p>
      <p className="font-semibold text-gray-900 dark:text-gray-100 mt-1">{value}</p>
    </div>
  );
}
