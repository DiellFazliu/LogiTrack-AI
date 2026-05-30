import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Mail, Phone, MapPin, CreditCard, AlertCircle, Loader, Navigation } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface Suggestion {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
}

export const CreateOrganization: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<Suggestion[]>([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const addressRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    plan_type: 'free',
  });

  // Kërko adresa teksa shkruan (pa filtër shteti)
  const searchAddress = async (query: string) => {
    if (!query || query.length < 3) {
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
      return;
    }

    setSearchingAddress(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`
      );
      const data = await response.json();
      const suggestions = data.map((item: any) => ({
        place_id: item.place_id,
        display_name: item.display_name,
        lat: item.lat,
        lon: item.lon,
      }));
      setAddressSuggestions(suggestions);
      setShowAddressSuggestions(true);
    } catch (error) {
      console.error('Error searching address:', error);
    } finally {
      setSearchingAddress(false);
    }
  };

  // Debounce për të shmangur thirrjet e shumta
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.address && formData.address.length > 2) {
        searchAddress(formData.address);
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.address]);

  // Mbyll sugjerimet kur klikohet jashtë
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (addressRef.current && !addressRef.current.contains(event.target as Node)) {
        setShowAddressSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectAddress = (suggestion: Suggestion) => {
    setFormData({ ...formData, address: suggestion.display_name });
    setShowAddressSuggestions(false);
    toast.success('Address selected');
  };

  // Përdor lokacionin aktual
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }

    toast.loading('Getting your location...', { id: 'location' });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await response.json();
          setFormData({ ...formData, address: data.display_name });
          toast.success('Location set', { id: 'location' });
        } catch (error) {
          toast.error('Could not get address', { id: 'location' });
        }
      },
      (error) => {
        let msg = 'Unable to get location';
        if (error.code === 1) msg = 'Please allow location access';
        toast.error(msg, { id: 'location' });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/organizations', formData);
      toast.success('Organization created successfully');
      navigate('/super-admin/organizations');
    } catch (error: any) {
      console.error('Error creating organization:', error);
      toast.error(error.response?.data?.message || 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold text-gray-800">Create New Organization</h1>
          <p className="text-gray-500 mt-1">Add a new company tenant to the platform</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Emri */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name *</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., TechCorp Solutions"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="contact@company.com"
              />
            </div>
          </div>

          {/* Telefoni */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+383 44 123 456"
              />
            </div>
          </div>

          {/* Adresa me autocomplete */}
          <div className="col-span-2" ref={addressRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Start typing address..."
                />
                {searchingAddress && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader className="w-4 h-4 text-gray-400 animate-spin" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={getCurrentLocation}
                className="px-3 py-2 bg-gray-100 border rounded-lg hover:bg-gray-200 transition flex items-center gap-1"
              >
                <Navigation className="w-4 h-4" /> Current
              </button>
            </div>

            {showAddressSuggestions && addressSuggestions.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {addressSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.place_id}
                    type="button"
                    onClick={() => selectAddress(suggestion)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-start gap-2 border-b last:border-b-0"
                  >
                    <MapPin className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{suggestion.display_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Plani */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subscription Plan *</label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={formData.plan_type}
                onChange={(e) => setFormData({ ...formData, plan_type: e.target.value })}
                className="w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="free">Free - 5 users, 100 shipments/month</option>
                <option value="basic">Basic - 20 users, 500 shipments/month</option>
                <option value="pro">Pro - 50 users, 2000 shipments/month</option>
                <option value="enterprise">Enterprise - Unlimited</option>
              </select>
            </div>
          </div>

          {/* Info */}
          <div className="col-span-2 bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">New Organization Defaults:</p>
                <p className="text-sm text-blue-700">
                  Free plan with 5 user slots and 100 shipments per month. The organization will be created with a 30-day trial subscription.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate('/super-admin/organizations')}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Creating...
                </>
              ) : (
                'Create Organization'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};