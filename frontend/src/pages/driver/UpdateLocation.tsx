// frontend/src/pages/driver/UpdateLocation.tsx
import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Send, Play, Pause, History, X, LocateFixed, Search, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { RouteMap } from '../../components/driver/RouteMap';

interface LocationHistory {
  id: string;
  latitude: number;
  longitude: number;
  address?: string;
  created_at: string;
}

interface MapCoordinate {
  latitude: number;
  longitude: number;
}

export const UpdateLocation: React.FC = () => {
  const [location, setLocation] = useState({ lat: '', lng: '' });
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [history, setHistory] = useState<LocationHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [trackingInterval, setTrackingInterval] = useState<ReturnType<typeof setInterval> | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  // State për mini-map
  const [manualAddressInput, setManualAddressInput] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [mapPoints, setMapPoints] = useState<MapCoordinate[]>([]);

  // Reverse geocoding - konverton koordinatat në adresë
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      if (data && data.display_name) {
        return data.display_name;
      }
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  // Geocode address to coordinates
  const geocodeAddress = async (address: string): Promise<{ lat: number; lon: number } | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&addressdetails=1`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon)
        };
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  // Update location to backend
  const updateLocationToBackend = async (lat: number, lng: number, addr?: string) => {
    try {
      const response = await api.post('/drivers/location', {
        latitude: lat,
        longitude: lng,
        address: addr || address,
      });
      
      if (response.data) {
        setLastUpdate(new Date());
        setHistory(prev => [{
          id: Date.now().toString(),
          latitude: lat,
          longitude: lng,
          address: addr,
          created_at: new Date().toISOString(),
        }, ...prev].slice(0, 20));
      }
      return true;
    } catch (error) {
      console.error('Failed to update location:', error);
      return false;
    }
  };

  const getCurrentLocation = () => {
    setGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setLocation({
            lat: lat.toString(),
            lng: lng.toString(),
          });
          setMapPoints([{ latitude: lat, longitude: lng }]);
          
          const addr = await reverseGeocode(lat, lng);
          setAddress(addr);
          
          setGettingLocation(false);
          toast.success('Location detected!');
        },
        (error) => {
          toast.error('Failed to get location: ' + error.message);
          setGettingLocation(false);
        }
      );
    } else {
      toast.error('Geolocation is not supported by this browser');
      setGettingLocation(false);
    }
  };

  // Handle map click to set location
  const handleMapClick = async (lat: number, lng: number) => {
    setLocation({
      lat: lat.toString(),
      lng: lng.toString(),
    });
    setMapPoints([{ latitude: lat, longitude: lng }]);
    
    const addr = await reverseGeocode(lat, lng);
    setAddress(addr);
    
    toast.success('Location selected from map!');
  };

  // Handle address search
  const handleSearchAddress = async () => {
    if (!manualAddressInput.trim()) {
      toast.error('Please enter an address');
      return;
    }
    
    setIsGeocoding(true);
    try {
      const coords = await geocodeAddress(manualAddressInput);
      if (coords) {
        setLocation({
          lat: coords.lat.toString(),
          lng: coords.lon.toString(),
        });
        setMapPoints([{ latitude: coords.lat, longitude: coords.lon }]);
        
        const addr = await reverseGeocode(coords.lat, coords.lon);
        setAddress(addr);
        
        toast.success('Location found! You can now update.');
      } else {
        toast.error('Address not found. Try a more specific address.');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      toast.error('Failed to locate address');
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.lat || !location.lng) {
      toast.error('Please provide your location');
      return;
    }

    setLoading(true);
    try {
      const lat = parseFloat(location.lat);
      const lng = parseFloat(location.lng);
      
      const success = await updateLocationToBackend(lat, lng);
      
      if (success) {
        toast.success('Location updated successfully!');
      } else {
        toast.error('Failed to update location');
      }
    } catch (error) {
      toast.error('Failed to update location');
    } finally {
      setLoading(false);
    }
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported');
      return;
    }

    setIsTracking(true);
    toast.success('Location tracking started - updates every 30 seconds');
    
    navigator.geolocation.getCurrentPosition(async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      setLocation({ lat: lat.toString(), lng: lng.toString() });
      setMapPoints([{ latitude: lat, longitude: lng }]);
      const addr = await reverseGeocode(lat, lng);
      setAddress(addr);
      await updateLocationToBackend(lat, lng, addr);
    });

    const interval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLocation({ lat: lat.toString(), lng: lng.toString() });
        setMapPoints([{ latitude: lat, longitude: lng }]);
        const addr = await reverseGeocode(lat, lng);
        setAddress(addr);
        await updateLocationToBackend(lat, lng, addr);
        toast.success('Location auto-updated', { icon: '📍', duration: 2000 });
      }, (error) => {
        console.error('Tracking error:', error);
      });
    }, 30000);
    
    setTrackingInterval(interval);
  };

  const stopTracking = () => {
    if (trackingInterval) {
      clearInterval(trackingInterval);
      setTrackingInterval(null);
    }
    setIsTracking(false);
    toast.success('Location tracking stopped');
  };

  const fetchHistory = async () => {
    try {
      const response = await api.get('/drivers/location/history');
      let historyData = [];
      if (response.data?.items && Array.isArray(response.data.items)) {
        historyData = response.data.items;
      } else if (Array.isArray(response.data)) {
        historyData = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        historyData = response.data.data;
      }
      setHistory(historyData);
      setShowHistory(true);
    } catch (error) {
      console.error('Failed to fetch location history:', error);
      toast.error('Failed to fetch location history');
      setHistory([]);
    }
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (trackingInterval) {
        clearInterval(trackingInterval);
      }
    };
  }, [trackingInterval]);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold text-gray-800">Update Location</h1>
          <p className="text-gray-500 mt-1">Share your real-time location for better tracking</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center mb-6">
              <MapPin className="w-16 h-16 text-blue-500 mx-auto mb-2" />
              <p className="text-gray-600">Share your current location for real-time tracking</p>
            </div>

            {/* Tracking Status Bar */}
            <div className={`mb-6 p-3 rounded-lg flex items-center justify-between ${isTracking ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className="text-sm font-medium">{isTracking ? 'Live Tracking Active' : 'Tracking Inactive'}</span>
              </div>
              {lastUpdate && (
                <span className="text-xs text-gray-500">
                  Last update: {lastUpdate.toLocaleTimeString()}
                </span>
              )}
            </div>

            {/* Address Search */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium mb-2">Find Location by Address</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualAddressInput}
                  onChange={(e) => setManualAddressInput(e.target.value)}
                  placeholder="Enter address..."
                  className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchAddress()}
                />
                <button
                  onClick={handleSearchAddress}
                  disabled={isGeocoding}
                  className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-1"
                >
                  {isGeocoding ? <Loader className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Search
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={location.lat}
                    onChange={(e) => setLocation({ ...location, lat: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 42.6629"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={location.lng}
                    onChange={(e) => setLocation({ ...location, lng: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 21.1655"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Address (auto-detected)</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Address will appear here"
                  readOnly
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={gettingLocation}
                  className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <LocateFixed className="w-4 h-4" />
                  {gettingLocation ? 'Detecting...' : 'Use Current Location'}
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {loading ? 'Updating...' : 'Update Location'}
                </button>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                {!isTracking ? (
                  <button
                    type="button"
                    onClick={startTracking}
                    className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Start Auto-Tracking (30s)
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopTracking}
                    className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 flex items-center justify-center gap-2"
                  >
                    <Pause className="w-4 h-4" />
                    Stop Auto-Tracking
                  </button>
                )}
                
                <button
                  type="button"
                  onClick={fetchHistory}
                  className="flex-1 bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600 flex items-center justify-center gap-2"
                >
                  <History className="w-4 h-4" />
                  View History
                </button>
              </div>
            </form>

            {location.lat && location.lng && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  ✓ Location ready to update: {location.lat}, {location.lng}
                </p>
                {address && (
                  <p className="text-xs text-green-600 mt-1">📍 {address}</p>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Mini Map */}
          {!showHistory && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-3 border-b bg-gray-50">
                <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  Click on map to select location
                </h2>
              </div>
              <div className="h-96">
                <RouteMap
                  points={mapPoints}
                  routeCoordinates={undefined}
                  onMapClick={handleMapClick}
                  selectedPointType="warehouse"
                />
              </div>
              <div className="p-3 border-t bg-gray-50 text-xs text-gray-500 text-center">
                <p>Click anywhere on the map to set your location</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* History Modal - z-index i lartë për t'u shfaqur sipër gjithçkaje */}
      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-semibold">Location History</h2>
              <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-4 max-h-[calc(80vh-70px)]">
              {history.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No location history yet</p>
              ) : (
                <div className="space-y-3">
                  {history.map((item) => (
                    <div key={item.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-mono text-sm font-medium">
                            {typeof item.latitude === 'number' ? item.latitude.toFixed(6) : Number(item.latitude).toFixed(6)}, 
                            {typeof item.longitude === 'number' ? item.longitude.toFixed(6) : Number(item.longitude).toFixed(6)}
                          </p>
                          {item.address && (
                            <p className="text-xs text-gray-500 mt-1">{item.address}</p>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">
                          {item.created_at ? new Date(item.created_at).toLocaleString() : 'Date not available'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpdateLocation;