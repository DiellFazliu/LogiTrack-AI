// frontend/src/pages/customer/CreateShipment.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, AlertCircle, Navigation, Loader, Building2, Check, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface Suggestion {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
}

interface Organization {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  is_active: boolean;
}

export const CreateShipment: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [searchingPickup, setSearchingPickup] = useState(false);
  const [searchingDelivery, setSearchingDelivery] = useState(false);
  const [pickupSuggestions, setPickupSuggestions] = useState<Suggestion[]>([]);
  const [deliverySuggestions, setDeliverySuggestions] = useState<Suggestion[]>([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDeliverySuggestions, setShowDeliverySuggestions] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const [searchOrg, setSearchOrg] = useState('');
  const [hasExistingOrg, setHasExistingOrg] = useState(false);
  
  const pickupRef = useRef<HTMLDivElement>(null);
  const deliveryRef = useRef<HTMLDivElement>(null);
  const orgRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    pickup_address: '',
    pickup_latitude: '',
    pickup_longitude: '',
    delivery_address: '',
    delivery_latitude: '',
    delivery_longitude: '',
    weight_kg: '',
    volume_m3: '',
    priority: 'normal',
    is_express: false,
    notes: '',
  });
  // ✅ DEKLARO FUNKSIONIN PARA useEffect
  const fetchOrganizations = async () => {
    setLoadingOrgs(true);
    try {
      const response = await api.get('/organizations/available');
      const orgs = response.data || [];
      setOrganizations(orgs);
      
      if (user?.organizationId) {
        const userOrg = orgs.find((org: Organization) => org.id === user.organizationId);
        if (userOrg) {
          setSelectedOrganization(userOrg);
          setHasExistingOrg(true);
          toast.success(`Shipping with: ${userOrg.name}`);
        }
      }
    } catch (error: any) {
      console.error('Error fetching organizations:', error);
      setOrganizations([]);
    } finally {
      setLoadingOrgs(false);
    }
  };

  // ✅ TANI useEffect mund ta përdorë fetchOrganizations
  useEffect(() => {
    fetchOrganizations();
  }, []);


  const selectOrganization = (org: Organization) => {
    setSelectedOrganization(org);
    setShowOrgDropdown(false);
    setSearchOrg('');
    toast.success(`Selected company: ${org.name}`);
    
    // Nëse është hera e parë që zgjedh një kompani, përditëso user-in
    if (!user?.organizationId && updateUser) {
      updateUser({ organizationId: org.id, organizationName: org.name });
    }
  };

  // Generate tracking number
  const generateTrackingNumber = () => {
    const prefix = 'TRK';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  };

  // Search address using OpenStreetMap Nominatim
  const searchAddress = async (query: string, type: 'pickup' | 'delivery') => {
    if (!query || query.length < 3) {
      if (type === 'pickup') {
        setPickupSuggestions([]);
        setShowPickupSuggestions(false);
      } else {
        setDeliverySuggestions([]);
        setShowDeliverySuggestions(false);
      }
      return;
    }

    if (type === 'pickup') {
      setSearchingPickup(true);
    } else {
      setSearchingDelivery(true);
    }

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

      if (type === 'pickup') {
        setPickupSuggestions(suggestions);
        setShowPickupSuggestions(true);
        setSearchingPickup(false);
      } else {
        setDeliverySuggestions(suggestions);
        setShowDeliverySuggestions(true);
        setSearchingDelivery(false);
      }
    } catch (error) {
      console.error('Error searching address:', error);
      if (type === 'pickup') {
        setSearchingPickup(false);
      } else {
        setSearchingDelivery(false);
      }
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.pickup_address && formData.pickup_address.length > 2) {
        searchAddress(formData.pickup_address, 'pickup');
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.pickup_address]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.delivery_address && formData.delivery_address.length > 2) {
        searchAddress(formData.delivery_address, 'delivery');
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.delivery_address]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickupRef.current && !pickupRef.current.contains(event.target as Node)) {
        setShowPickupSuggestions(false);
      }
      if (deliveryRef.current && !deliveryRef.current.contains(event.target as Node)) {
        setShowDeliverySuggestions(false);
      }
      if (orgRef.current && !orgRef.current.contains(event.target as Node)) {
        setShowOrgDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectPickupLocation = (suggestion: Suggestion) => {
    setFormData({
      ...formData,
      pickup_address: suggestion.display_name,
      pickup_latitude: suggestion.lat,
      pickup_longitude: suggestion.lon,
    });
    setShowPickupSuggestions(false);
    toast.success('Pickup location selected');
  };

  const selectDeliveryLocation = (suggestion: Suggestion) => {
    setFormData({
      ...formData,
      delivery_address: suggestion.display_name,
      delivery_latitude: suggestion.lat,
      delivery_longitude: suggestion.lon,
    });
    setShowDeliverySuggestions(false);
    toast.success('Delivery location selected');
  };

  const getCurrentLocation = (type: 'pickup' | 'delivery') => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
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
          const address = data.display_name;
          
          if (type === 'pickup') {
            setFormData({
              ...formData,
              pickup_address: address,
              pickup_latitude: latitude.toString(),
              pickup_longitude: longitude.toString(),
            });
          } else {
            setFormData({
              ...formData,
              delivery_address: address,
              delivery_latitude: latitude.toString(),
              delivery_longitude: longitude.toString(),
            });
          }
          
          toast.success(`${type === 'pickup' ? 'Pickup' : 'Delivery'} location set`, { id: 'location' });
        } catch (error) {
          console.error('Error reverse geocoding:', error);
          toast.error('Could not get address from coordinates', { id: 'location' });
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Unable to get your location.';
        if (error.code === 1) errorMessage = 'Please allow location access.';
        if (error.code === 2) errorMessage = 'Location unavailable.';
        if (error.code === 3) errorMessage = 'Location request timed out.';
        toast.error(errorMessage, { id: 'location' });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

// frontend/src/pages/customer/CreateShipment.tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Përdor organizationId nga selectedOrganization ose user
  const orgId = selectedOrganization?.id || user?.organizationId;
  
  if (!orgId) {
    toast.error('Please select a company first');
    return;
  }
  
  if (!formData.pickup_address) {
    toast.error('Please enter pickup address');
    return;
  }
  
  if (!formData.delivery_address) {
    toast.error('Please enter delivery address');
    return;
  }
  
  setLoading(true);
  
  try {
    const trackingNumber = generateTrackingNumber();
    
    const shipmentData = {
      trackingNumber,
      pickupAddress: formData.pickup_address,
      pickupLatitude: formData.pickup_latitude ? parseFloat(formData.pickup_latitude) : undefined,
      pickupLongitude: formData.pickup_longitude ? parseFloat(formData.pickup_longitude) : undefined,
      deliveryAddress: formData.delivery_address,
      deliveryLatitude: formData.delivery_latitude ? parseFloat(formData.delivery_latitude) : undefined,
      deliveryLongitude: formData.delivery_longitude ? parseFloat(formData.delivery_longitude) : undefined,
      weightKg: parseFloat(formData.weight_kg) || undefined,
      volumeM3: parseFloat(formData.volume_m3) || undefined,
      priority: formData.priority,
      isExpress: formData.is_express,
      notes: formData.notes,
      organizationId: orgId,  // ✅ Dërgo organizationId në body
    };
    
    console.log('Sending shipment data:', shipmentData);
    
    const response = await api.post('/shipments', shipmentData);
    
    if (response.data) {
      toast.success(`Shipment created! Tracking: ${trackingNumber}`);
      navigate('/customer/history');
    }
  } catch (error: any) {
    console.error('Error:', error.response?.data || error.message);
    const message = error.response?.data?.message || 'Failed to create shipment';
    toast.error(message);
  } finally {
    setLoading(false);
  }
};

  // Filter organizations based on search
  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchOrg.toLowerCase()) ||
    org.email.toLowerCase().includes(searchOrg.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold text-gray-800">Create New Shipment</h1>
          <p className="text-gray-500 mt-1">Fill in the details to create a delivery shipment</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Organization Selection - Show only if customer doesn't have an organization yet */}
          {!hasExistingOrg && !user?.organizationId && (
            <div ref={orgRef} className="relative">
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-purple-600" /> Select Company *
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowOrgDropdown(!showOrgDropdown)}
                  className="w-full border rounded-lg px-3 py-2 text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <span className={selectedOrganization ? 'text-gray-800' : 'text-gray-400'}>
                    {selectedOrganization ? selectedOrganization.name : 'Select a company...'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
                
                {showOrgDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <div className="p-2 border-b">
                      <input
                        type="text"
                        placeholder="Search companies..."
                        value={searchOrg}
                        onChange={(e) => setSearchOrg(e.target.value)}
                        className="w-full border rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    {loadingOrgs ? (
                      <div className="p-4 text-center text-gray-500">
                        <Loader className="w-5 h-5 animate-spin mx-auto" />
                        Loading...
                      </div>
                    ) : filteredOrganizations.length === 0 ? (
                      <div className="p-4 text-center">
                        <p className="text-gray-500 text-sm">No companies available</p>
                        <p className="text-xs text-gray-400 mt-1">Please contact support</p>
                      </div>
                    ) : (
                      filteredOrganizations.map((org) => (
                        <button
                          key={org.id}
                          type="button"
                          onClick={() => selectOrganization(org)}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center justify-between"
                        >
                          <div>
                            <p className="font-medium text-sm">{org.name}</p>
                            <p className="text-xs text-gray-500">{org.email}</p>
                          </div>
                          {selectedOrganization?.id === org.id && (
                            <Check className="w-4 h-4 text-green-500" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Select the company you want to ship with
              </p>
            </div>
          )}

          {/* Show selected organization info */}
          {(selectedOrganization || user?.organizationId) && (
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700">
                  Shipping with: <strong>{selectedOrganization?.name || 'Your Company'}</strong>
                </span>
              </div>
            </div>
          )}

          {/* Pickup Address */}
          <div ref={pickupRef} className="relative">
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-green-600" /> Pickup Address *
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  required
                  value={formData.pickup_address}
                  onChange={(e) => setFormData({...formData, pickup_address: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Start typing pickup address..."
                />
                {searchingPickup && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader className="w-4 h-4 text-gray-400 animate-spin" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => getCurrentLocation('pickup')}
                className="px-3 py-2 bg-gray-100 border rounded-lg hover:bg-gray-200 transition flex items-center gap-1"
              >
                <Navigation className="w-4 h-4" /> Current
              </button>
            </div>
            
            {showPickupSuggestions && pickupSuggestions.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {pickupSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.place_id}
                    type="button"
                    onClick={() => selectPickupLocation(suggestion)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-start gap-2 border-b last:border-b-0"
                  >
                    <MapPin className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{suggestion.display_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Delivery Address */}
          <div ref={deliveryRef} className="relative">
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-600" /> Delivery Address *
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  required
                  value={formData.delivery_address}
                  onChange={(e) => setFormData({...formData, delivery_address: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Start typing delivery address..."
                />
                {searchingDelivery && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader className="w-4 h-4 text-gray-400 animate-spin" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => getCurrentLocation('delivery')}
                className="px-3 py-2 bg-gray-100 border rounded-lg hover:bg-gray-200 transition flex items-center gap-1"
              >
                <Navigation className="w-4 h-4" /> Current
              </button>
            </div>
            
            {showDeliverySuggestions && deliverySuggestions.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {deliverySuggestions.map((suggestion) => (
                  <button
                    key={suggestion.place_id}
                    type="button"
                    onClick={() => selectDeliveryLocation(suggestion)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-start gap-2 border-b last:border-b-0"
                  >
                    <MapPin className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{suggestion.display_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Rest of the form */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Weight (kg)</label>
              <input
                type="number"
                step="0.01"
                value={formData.weight_kg}
                onChange={(e) => setFormData({...formData, weight_kg: e.target.value})}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Volume (m³)</label>
              <input
                type="number"
                step="0.01"
                value={formData.volume_m3}
                onChange={(e) => setFormData({...formData, volume_m3: e.target.value})}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="express"
              checked={formData.is_express}
              onChange={(e) => setFormData({...formData, is_express: e.target.checked})}
              className="w-4 h-4"
            />
            <label htmlFor="express" className="text-sm font-medium">Express Delivery</label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Notes / Special Instructions</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Special instructions..."
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium">Note:</p>
                <p>Your shipment will be processed by the selected company. You can track its status in real-time.</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/customer/history')}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (!hasExistingOrg && !user?.organizationId && !selectedOrganization)}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Shipment'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateShipment;