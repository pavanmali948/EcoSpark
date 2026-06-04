import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Search, MapPin, Fuel, Navigation, Locate, Loader2, Radio } from "lucide-react";
import themeClasses from "../../utils/themeClasses";
import api from "../../utils/api";
import { haversineKm, formatKm } from "../../utils/geo";
import PumpsOverviewMap from "../../components/maps/PumpsOverviewMap";
import LeafletPumpsOverview from "../../components/maps/LeafletPumpsOverview";
import { isGoogleMapsConfigured } from "../../utils/googleMapsLoader";
import { usePrefersDarkMap } from "../../utils/mapStyles";

const theme = themeClasses.blue;

function FindPumpPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [pumps, setPumps] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [maxDistance, setMaxDistance] = useState(25); // Default 25 km
  const [locationError, setLocationError] = useState("");
  const [sortMode, setSortMode] = useState('recommended'); // recommended | closest | rating
  const [minRating, setMinRating] = useState(0); // 0 - 5
  const [selectedPump, setSelectedPump] = useState(null);
  const darkMode = usePrefersDarkMap();

  useEffect(() => {
    const fetchPumps = async () => {
      try {
        const res = await api.get("/pumps");
        if (res.data.success) {
          setPumps(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch pumps", err);
      }
    };
    fetchPumps();
  }, []);

  // Get user's current location
  const getUserLocation = () => {
    setIsLocating(true);
    setLocationError("");

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setIsLocating(false);
      },
      (error) => {
        setLocationError("Unable to retrieve your location");
        setIsLocating(false);
        console.error("Geolocation error:", error);
      }
    );
  };

  // Filter and sort pumps based on search query and distance
  const filteredPumps = pumps
    .filter(pump => {
      // Text search filter
      return (
        pump.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pump.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    })
    .map(pump => {
      // Calculate distance for all pumps if location is available
      if (userLocation && pump.latitude && pump.longitude) {
        const distance = haversineKm(
          userLocation.latitude,
          userLocation.longitude,
          pump.latitude,
          pump.longitude
        );
        return { ...pump, calculatedDistance: distance.toFixed(1) };
      }
      return pump;
    })
    .filter((pump) => {
      const ratingNum = parseFloat(pump.rating) || 0;
      if (ratingNum < minRating) return false;

      // Distance filter - only apply if GPS location is active
      if (userLocation && pump.calculatedDistance) {
        return parseFloat(pump.calculatedDistance) <= maxDistance;
      }
      // Show all pumps if no GPS location
      return true;
    })
    .sort((a, b) => {
      const ratingA = parseFloat(a.rating) || 0;
      const ratingB = parseFloat(b.rating) || 0;
      const distA = a.calculatedDistance ? parseFloat(a.calculatedDistance) : null;
      const distB = b.calculatedDistance ? parseFloat(b.calculatedDistance) : null;

      if (sortMode === 'closest') {
        if (distA != null && distB != null) return distA - distB;
        return 0;
      }

      if (sortMode === 'rating') {
        return ratingB - ratingA;
      }

      // recommended: higher rating + proximity (when available)
      const scoreA = ratingA * 10 + (distA != null ? (maxDistance - distA) : 0);
      const scoreB = ratingB * 10 + (distB != null ? (maxDistance - distB) : 0);
      return scoreB - scoreA;
    });

  const selectedPumpDetails = useMemo(() => {
    if (!selectedPump) return null;
    const match = filteredPumps.find((p) => p.id === selectedPump.id) || selectedPump;
    return match;
  }, [selectedPump, filteredPumps]);

  return (
    <div className="min-h-full bg-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Find CNG Pump</h1>
          <p className="text-gray-600">Search for nearby CNG stations</p>
        </div>

        {/* Search and Location Bar */}
        <Card className="rounded-2xl shadow-lg border-0 mb-6">
          <CardContent className="pt-6 space-y-4">
            {/* Search Bar with GPS Button */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* Search Input */}
              <div className="md:col-span-8 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search by pump name or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-xl h-12"
                />
              </div>

              {/* GPS Location Button */}
              <div className="md:col-span-4">
                <Button
                  onClick={getUserLocation}
                  disabled={isLocating}
                  className={`w-full h-12 rounded-xl bg-gradient-to-r ${theme.gradient} hover:opacity-90 disabled:opacity-50`}
                >
                  {isLocating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Locating...
                    </>
                  ) : (
                    <>
                      <Locate className="w-5 h-5 mr-2" />
                      Use My Location
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Distance Filter */}
            {userLocation && (
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-blue-600" />
                    Search Radius: {maxDistance} km
                  </label>
                  <span className="text-xs text-gray-500">0 - 25 km</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="25"
                  value={maxDistance}
                  onChange={(e) => setMaxDistance(parseInt(e.target.value))}
                  className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            )}

            {/* Location Status Messages */}
            {userLocation && (
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded-lg">
                <MapPin className="w-4 h-4" />
                <span>Location detected • Showing nearest stations</span>
              </div>
            )}

            {locationError && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded-lg">
                <MapPin className="w-4 h-4" />
                <span>{locationError}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Google Maps overview */}
        <Card className="rounded-2xl shadow-lg border-0 mb-6 overflow-hidden">
          <CardContent className="p-4 space-y-3">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Map overview</h2>
            {isGoogleMapsConfigured() ? (
              <PumpsOverviewMap
                pumps={filteredPumps}
                selectedPumpId={selectedPumpDetails?.id}
                userPosition={userLocation}
                onSelectPump={setSelectedPump}
                darkMode={darkMode}
              />
            ) : (
              <LeafletPumpsOverview
                pumps={filteredPumps}
                selectedPumpId={selectedPumpDetails?.id}
                userPosition={userLocation}
                onSelectPump={setSelectedPump}
              />
            )}
          </CardContent>
        </Card>

        {selectedPumpDetails && (
          <Card className="rounded-2xl shadow-lg border-2 border-blue-200 mb-6 dark:border-blue-800">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                {selectedPumpDetails.name}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-1 mb-4">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="break-words">{selectedPumpDetails.location}</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm mb-4">
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950/40 p-3">
                  <p className="text-gray-500 dark:text-gray-400">Distance</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {selectedPumpDetails.calculatedDistance
                      ? `${selectedPumpDetails.calculatedDistance} km`
                      : userLocation
                        ? formatKm(
                            haversineKm(
                              userLocation.latitude,
                              userLocation.longitude,
                              selectedPumpDetails.latitude,
                              selectedPumpDetails.longitude
                            )
                          )
                        : 'Enable GPS'}
                  </p>
                </div>
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950/40 p-3">
                  <p className="text-gray-500 dark:text-gray-400">Coordinates</p>
                  <p className="font-mono text-xs text-gray-800 dark:text-gray-200 break-all">
                    {selectedPumpDetails.latitude?.toFixed(5)}, {selectedPumpDetails.longitude?.toFixed(5)}
                  </p>
                </div>
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950/40 p-3">
                  <p className="text-gray-500 dark:text-gray-400">Rating</p>
                  <p className="font-semibold text-yellow-600">★ {selectedPumpDetails.rating}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={() => navigate(`/user/track/${selectedPumpDetails.id}`)}
                  className={`rounded-xl bg-gradient-to-r ${theme.gradient} hover:opacity-90`}
                >
                  <Radio className="w-4 h-4 mr-2" />
                  Track live location
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/user/slots/${selectedPumpDetails.id}`)}
                  className="rounded-xl"
                >
                  View slots
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pump List */}
        <div className="space-y-4">
          <h2 className="text-xl mb-4 font-semibold">Available Pumps ({filteredPumps.length})</h2>

          {/* Sorting & filtering */}
          <Card className="rounded-2xl shadow-none border border-blue-100 bg-blue-50 mb-2">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-blue-600" />
                    Sort by
                  </label>
                  <select
                    value={sortMode}
                    onChange={(e) => setSortMode(e.target.value)}
                    className="w-full h-11 rounded-xl border border-gray-200 bg-white text-sm px-3"
                  >
                    <option value="recommended">Recommended</option>
                    <option value="closest">Closest</option>
                    <option value="rating">Highest Rated</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Fuel className="w-4 h-4 text-yellow-500" />
                    Min rating: {minRating.toFixed(1)}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.1"
                    value={minRating}
                    onChange={(e) => setMinRating(parseFloat(e.target.value))}
                    className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Quick Filters</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setMinRating(4.0)}
                      className="px-3 py-2 rounded-full text-sm border border-gray-200 bg-white hover:bg-gray-50"
                    >
                      4.0+ Stars
                    </button>
                    <button
                      type="button"
                      onClick={() => setMinRating(4.5)}
                      className="px-3 py-2 rounded-full text-sm border border-gray-200 bg-white hover:bg-gray-50"
                    >
                      4.5+ Stars
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMinRating(0);
                        setSortMode('recommended');
                      }}
                      className="px-3 py-2 rounded-full text-sm border border-gray-200 bg-white hover:bg-gray-50"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {filteredPumps.map((pump) => (
            <Card
              key={pump.id}
              className={`rounded-2xl shadow-lg border-0 hover:shadow-xl transition-shadow cursor-pointer ${
                selectedPumpDetails?.id === pump.id ? 'ring-2 ring-blue-400' : ''
              }`}
              onClick={() => setSelectedPump(pump)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${theme.bg}`}>
                      <Fuel className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg">{pump.name}</h3>
                      </div>
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <MapPin className="w-4 h-4 mr-1" />
                        {pump.location}
                      </div>
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center text-gray-600">
                          <Navigation className="w-4 h-4 mr-1" />
                          {pump.calculatedDistance ? `${pump.calculatedDistance} km` : pump.distance}
                        </div>
                        <div className="text-yellow-500">
                          ★ {pump.rating}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/user/track/${pump.id}`);
                      }}
                      variant="outline"
                      className="rounded-xl"
                    >
                      Track
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/user/slots/${pump.id}`);
                      }}
                      className={`rounded-xl bg-gradient-to-r ${theme.gradient} hover:opacity-90`}
                    >
                      View Slots
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default FindPumpPage
