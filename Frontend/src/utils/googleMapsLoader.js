let loadPromise = null;

/**
 * Loads Google Maps JavaScript API once (Directions + Distance Matrix are in core maps).
 * API key must be set in VITE_GOOGLE_MAPS_API_KEY and restricted in Google Cloud Console.
 */
export function loadGoogleMaps() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (typeof window !== 'undefined' && window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }

  if (!apiKey) {
    return Promise.reject(
      new Error(
        'Google Maps API key is missing. Add VITE_GOOGLE_MAPS_API_KEY to your .env file.'
      )
    );
  }

  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-google-maps]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.google.maps));
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Maps')));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places,geometry&v=weekly`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMaps = 'true';
    script.onload = () => {
      if (window.google?.maps) resolve(window.google.maps);
      else reject(new Error('Google Maps loaded but maps object is unavailable'));
    };
    script.onerror = () => {
      loadPromise = null;
      reject(new Error('Failed to load Google Maps script. Check API key and network.'));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

export function isGoogleMapsConfigured() {
  return Boolean(import.meta.env.VITE_GOOGLE_MAPS_API_KEY);
}
