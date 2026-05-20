import React, { useState } from 'react';
import { MapPin, Navigation, Send } from 'lucide-react';
import toast from 'react-hot-toast';

export const UpdateLocation: React.FC = () => {
  const [location, setLocation] = useState({ lat: '', lng: '' });
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  const getCurrentLocation = () => {
    setGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude.toString(),
            lng: position.coords.longitude.toString(),
          });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.lat || !location.lng) {
      toast.error('Please provide your location');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/driver/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          latitude: parseFloat(location.lat),
          longitude: parseFloat(location.lng),
        })
      });

      if (response.ok) {
        toast.success('Location updated successfully!');
        setLocation({ lat: '', lng: '' });
      } else {
        toast.error('Failed to update location');
      }
    } catch (error) {
      toast.error('Failed to update location');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold text-gray-800">Update Location</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-md">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center mb-6">
            <MapPin className="w-16 h-16 text-blue-500 mx-auto mb-2" />
            <p className="text-gray-600">Share your current location for real-time tracking</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div className="flex gap-3">
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={gettingLocation}
                className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Navigation className="w-4 h-4" />
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
          </form>

          {location.lat && location.lng && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                ✓ Location ready to update: {location.lat}, {location.lng}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default UpdateLocation;