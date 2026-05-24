// frontend/src/pages/dispatcher/DriverLocationMap.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Truck, RefreshCw, X, User, Phone, Star, Package, Search, Loader, Navigation, Edit3, Save, LocateFixed } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { locationService } from '../../services/location.service';
import { RouteMap } from '../../components/driver/RouteMap';

interface DriverLocation {
  id: string;
  driverId: string;
  driverName: string;
  latitude: number;
  longitude: number;
  address?: string;
  status: string;
  rating: number;
  totalDeliveries: number;
  phone?: string;
  lastUpdate: string;
}

interface Shipment {
  id: string;
  trackingNumber: string;
  pickupAddress: string;
  deliveryAddress: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  status: string;
  priority: string;
}

// Interface për koordinatat në hartë (pa label)
interface MapCoordinate {
  latitude: number;
  longitude: number;
}

export const DriverLocationMap: React.FC = () => {
  const navigate = useNavigate();
  const [driverLocations, setDriverLocations] = useState<DriverLocation[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<DriverLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [fetchingPickupForShipment, setFetchingPickupForShipment] = useState<string | null>(null);
  
  // State për modal-in e koordinatave manuale
  const [showManualCoordsModal, setShowManualCoordsModal] = useState(false);
  const [manualAddressInput, setManualAddressInput] = useState('');
  const [manualLatitude, setManualLatitude] = useState('');
  const [manualLongitude, setManualLongitude] = useState('');
  const [isGeocodingManual, setIsGeocodingManual] = useState(false);
  const [isGettingCurrentLocation, setIsGettingCurrentLocation] = useState(false);
  const [manualPointType, setManualPointType] = useState<'pickup' | 'delivery'>('pickup');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchDriverLocations(),
        fetchPendingShipments()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDriverLocations = async () => {
    try {
      const driversRes = await api.get('/drivers');
      const drivers = driversRes.data?.items || driversRes.data || [];
      
      console.log('Drivers fetched:', drivers.length);
      
      const locationsWithDrivers = await Promise.all(
        drivers.map(async (driver: any) => {
          try {
            const location = await locationService.getLastSavedLocationByDriverId(driver.id);
            console.log(`Driver ${driver.user?.name} location:`, location);
            return {
              id: driver.id,
              driverId: driver.id,
              driverName: driver.user?.name || 'Unknown Driver',
              latitude: location?.latitude || 0,
              longitude: location?.longitude || 0,
              address: location?.address,
              status: driver.status,
              rating: driver.rating || 0,
              totalDeliveries: driver.totalDeliveries || 0,
              phone: driver.phone,
              lastUpdate: location?.createdAt || new Date().toISOString(),
            };
          } catch (err) {
            console.error(`Error fetching location for driver ${driver.id}:`, err);
            return {
              id: driver.id,
              driverId: driver.id,
              driverName: driver.user?.name || 'Unknown Driver',
              latitude: 0,
              longitude: 0,
              status: driver.status,
              rating: driver.rating || 0,
              totalDeliveries: driver.totalDeliveries || 0,
              phone: driver.phone,
              lastUpdate: new Date().toISOString(),
            };
          }
        })
      );
      
      const validLocations = locationsWithDrivers.filter(l => l.latitude !== 0 && l.longitude !== 0);
      console.log('Valid driver locations:', validLocations.length);
      setDriverLocations(validLocations);
    } catch (error) {
      console.error('Error fetching driver locations:', error);
    }
  };

  const fetchPendingShipments = async () => {
    try {
      const response = await api.get('/shipments', { params: { status: 'pending', limit: 50 } });
      const shipments = response.data?.items || response.data || [];
      console.log('Pending shipments:', shipments.length);
      setShipments(shipments);
    } catch (error) {
      console.error('Error fetching shipments:', error);
    }
  };

  // Geocode address using Nominatim API
  const geocodeAddress = async (address: string): Promise<{ lat: number; lon: number } | null> => {
    try {
      console.log('Geocoding address:', address);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&addressdetails=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon)
        };
        console.log('Geocoding result:', result);
        return result;
      }
      console.log('No results found for address:', address);
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  // Update shipment coordinates via API
  const updateShipmentCoordinates = async (shipmentId: string, updates: { pickupLatitude?: number; pickupLongitude?: number; deliveryLatitude?: number; deliveryLongitude?: number }) => {
    try {
      const response = await api.patch(`/shipments/${shipmentId}/coordinates`, updates);
      return response.data;
    } catch (error) {
      console.error('Error updating coordinates:', error);
      throw error;
    }
  };

  // Fetch and update pickup coordinates automatically
  const fetchAndUpdatePickupCoordinates = async (shipment: Shipment) => {
    if (!shipment.pickupAddress) {
      toast.error('No pickup address found for this shipment');
      return;
    }

    if (shipment.pickupLatitude && shipment.pickupLongitude && 
        shipment.pickupLatitude !== 0 && shipment.pickupLongitude !== 0) {
      toast.success('Coordinates already exist for this shipment');
      return;
    }

    setFetchingPickupForShipment(shipment.id);
    toast.loading('Fetching pickup coordinates...', { id: 'geocode' });

    try {
      const coords = await geocodeAddress(shipment.pickupAddress);
      
      if (coords) {
        await updateShipmentCoordinates(shipment.id, {
          pickupLatitude: coords.lat,
          pickupLongitude: coords.lon
        });
        
        // Update local state
        const updatedShipment = {
          ...shipment,
          pickupLatitude: coords.lat,
          pickupLongitude: coords.lon
        };
        setSelectedShipment(updatedShipment);
        setShipments(prev => prev.map(s => 
          s.id === shipment.id 
            ? { ...s, pickupLatitude: coords.lat, pickupLongitude: coords.lon }
            : s
        ));
        
        toast.success(`Pickup coordinates found! (${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)})`, { id: 'geocode' });
      } else {
        // Nëse geocoding dështon, hap modal-in për input manual
        toast.error('Could not find coordinates automatically', { id: 'geocode' });
        setManualPointType('pickup');
        setManualAddressInput(shipment.pickupAddress);
        setShowManualCoordsModal(true);
      }
    } catch (error: any) {
      console.error('Error updating shipment coordinates:', error);
      toast.error(error.response?.data?.message || 'Failed to update coordinates', { id: 'geocode' });
      // Hap modal-in për input manual
      setManualPointType('pickup');
      setManualAddressInput(shipment.pickupAddress);
      setShowManualCoordsModal(true);
    } finally {
      setFetchingPickupForShipment(null);
    }
  };

  // Manual geocode from address input
  const handleManualGeocode = async () => {
    if (!manualAddressInput.trim()) {
      toast.error('Please enter an address');
      return;
    }
    
    setIsGeocodingManual(true);
    try {
      const coords = await geocodeAddress(manualAddressInput);
      if (coords) {
        setManualLatitude(coords.lat.toString());
        setManualLongitude(coords.lon.toString());
        toast.success('Coordinates found! You can now save or adjust them.');
      } else {
        toast.error('Address not found. Please enter coordinates manually.');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      toast.error('Failed to locate address');
    } finally {
      setIsGeocodingManual(false);
    }
  };

  // Get current location for manual modal
  const handleGetCurrentLocationForManual = async () => {
    setIsGettingCurrentLocation(true);
    try {
      const position = await locationService.getCurrentLocation();
      setManualLatitude(position.coords.latitude.toString());
      setManualLongitude(position.coords.longitude.toString());
      
      // Reverse geocode to get address
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}&format=json`
      );
      const data = await response.json();
      if (data && data.display_name) {
        setManualAddressInput(data.display_name);
      }
      toast.success('Current location set!');
    } catch (error: any) {
      console.error('Error getting location:', error);
      if (error.code === 1) {
        toast.error('Location access denied. Please enable location services.');
      } else {
        toast.error('Could not get your current location');
      }
    } finally {
      setIsGettingCurrentLocation(false);
    }
  };

  // Save manual coordinates
  const handleSaveManualCoordinates = async () => {
    if (!selectedShipment) return;
    
    const lat = parseFloat(manualLatitude);
    const lng = parseFloat(manualLongitude);
    
    if (isNaN(lat) || isNaN(lng)) {
      toast.error('Please enter valid coordinates');
      return;
    }
    
    if (lat < -90 || lat > 90) {
      toast.error('Latitude must be between -90 and 90');
      return;
    }
    
    if (lng < -180 || lng > 180) {
      toast.error('Longitude must be between -180 and 180');
      return;
    }
    
    setFetchingPickupForShipment(selectedShipment.id);
    toast.loading('Saving coordinates...', { id: 'saveCoords' });
    
    try {
      const updates = manualPointType === 'pickup' 
        ? { pickupLatitude: lat, pickupLongitude: lng }
        : { deliveryLatitude: lat, deliveryLongitude: lng };
      
      await updateShipmentCoordinates(selectedShipment.id, updates);
      
      // Update local state
      const updatedShipment = {
        ...selectedShipment,
        ...(manualPointType === 'pickup' 
          ? { pickupLatitude: lat, pickupLongitude: lng }
          : { deliveryLatitude: lat, deliveryLongitude: lng })
      };
      setSelectedShipment(updatedShipment);
      setShipments(prev => prev.map(s => 
        s.id === selectedShipment.id ? updatedShipment : s
      ));
      
      toast.success(`${manualPointType === 'pickup' ? 'Pickup' : 'Delivery'} coordinates saved!`, { id: 'saveCoords' });
      setShowManualCoordsModal(false);
      setManualAddressInput('');
      setManualLatitude('');
      setManualLongitude('');
    } catch (error: any) {
      console.error('Error saving coordinates:', error);
      toast.error(error.response?.data?.message || 'Failed to save coordinates', { id: 'saveCoords' });
    } finally {
      setFetchingPickupForShipment(null);
    }
  };

  // Handle map click in manual modal - kthen koordinatat për mini-map
  const handleManualMapClick = (lat: number, lng: number) => {
    setManualLatitude(lat.toString());
    setManualLongitude(lng.toString());
    toast.success('Location selected from map!');
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchData();
    toast.success('Data refreshed');
    setRefreshing(false);
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    if (!lat1 || !lng1 || !lat2 || !lng2) return Infinity;
    if (lat1 === 0 || lng1 === 0 || lat2 === 0 || lng2 === 0) return Infinity;
    
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const findNearestDriver = (shipment: Shipment) => {
    if (!shipment.pickupLatitude || !shipment.pickupLongitude) return null;
    
    let nearest = null;
    let minDistance = Infinity;
    
    for (const driver of driverLocations) {
      if (driver.latitude === 0 || driver.longitude === 0) continue;
      const distance = calculateDistance(
        driver.latitude, driver.longitude,
        shipment.pickupLatitude, shipment.pickupLongitude
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearest = driver;
      }
    }
    
    return { driver: nearest, distance: minDistance };
  };

  const handleAssignDriver = async () => {
    if (!selectedShipment || !selectedDriver) return;
    
    setAssigning(true);
    try {
      await api.patch(`/shipments/${selectedShipment.id}/assign-driver/${selectedDriver.driverId}`);
      toast.success(`Driver ${selectedDriver.driverName} assigned to shipment ${selectedShipment.trackingNumber}`);
      setShowAssignModal(false);
      setSelectedDriver(null);
      setSelectedShipment(null);
      fetchPendingShipments();
    } catch (error: any) {
      console.error('Error assigning driver:', error);
      toast.error(error.response?.data?.message || 'Failed to assign driver');
    } finally {
      setAssigning(false);
    }
  };

  const getDriverStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      available: 'bg-green-100 text-green-800',
      on_duty: 'bg-blue-100 text-blue-800',
      on_break: 'bg-yellow-100 text-yellow-800',
      off_duty: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      picked_up: 'bg-blue-100 text-blue-800',
      in_transit: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  // Përgatit pikat për hartën kryesore (vetëm latitude, longitude)
  const mainMapPoints: MapCoordinate[] = [
    ...driverLocations
      .filter(d => d.latitude && d.longitude && d.latitude !== 0 && d.longitude !== 0)
      .map(d => ({ latitude: d.latitude, longitude: d.longitude })),
    ...(selectedShipment?.pickupLatitude && selectedShipment?.pickupLongitude && 
        selectedShipment.pickupLatitude !== 0 && selectedShipment.pickupLongitude !== 0 ? 
      [{ latitude: selectedShipment.pickupLatitude, longitude: selectedShipment.pickupLongitude }] : []),
    ...(selectedShipment?.deliveryLatitude && selectedShipment?.deliveryLongitude && 
        selectedShipment.deliveryLatitude !== 0 && selectedShipment.deliveryLongitude !== 0 ? 
      [{ latitude: selectedShipment.deliveryLatitude, longitude: selectedShipment.deliveryLongitude }] : []),
  ];

  // Përgatit pikat për mini-map në modal (vetëm koordinatat e zgjedhura)
  const manualMapPoints: MapCoordinate[] = (manualLatitude && manualLongitude) ? [{
    latitude: parseFloat(manualLatitude),
    longitude: parseFloat(manualLongitude)
  }] : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Driver Location Tracker</h1>
              <p className="text-gray-500 text-sm mt-1">View driver locations and assign nearest driver to shipments</p>
            </div>
            <button
              onClick={refreshData}
              disabled={refreshing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Shipments List */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <h2 className="font-semibold flex items-center gap-2">
                  <Package className="w-5 h-5 text-orange-500" />
                  Pending Shipments ({shipments.length})
                </h2>
              </div>
              <div className="divide-y max-h-[500px] overflow-y-auto">
                {shipments.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No pending shipments</p>
                  </div>
                ) : (
                  shipments.map((shipment) => {
                    const nearest = findNearestDriver(shipment);
                    const isFetching = fetchingPickupForShipment === shipment.id;
                    return (
                      <div
                        key={shipment.id}
                        className={`p-4 hover:bg-gray-50 cursor-pointer transition ${
                          selectedShipment?.id === shipment.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                        }`}
                        onClick={() => setSelectedShipment(shipment)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-mono text-sm font-medium">{shipment.trackingNumber}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {shipment.pickupAddress?.substring(0, 50)}...
                            </p>
                            {(!shipment.pickupLatitude || shipment.pickupLatitude === 0) && (
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-xs text-yellow-500">⚠️ No coordinates</p>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    fetchAndUpdatePickupCoordinates(shipment);
                                  }}
                                  disabled={isFetching}
                                  className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full hover:bg-purple-200 flex items-center gap-1"
                                >
                                  {isFetching ? (
                                    <Loader className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Search className="w-3 h-3" />
                                  )}
                                  {isFetching ? 'Fetching...' : 'Get Coords'}
                                </button>
                              </div>
                            )}
                          </div>
                          {nearest?.driver && nearest.distance !== Infinity && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                              {nearest.distance.toFixed(1)} km
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusBadge(shipment.status)}`}>
                            {shipment.status}
                          </span>
                          {shipment.priority === 'urgent' && (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">Urgent</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Driver Locations List */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <h2 className="font-semibold flex items-center gap-2">
                  <Truck className="w-5 h-5 text-green-500" />
                  Active Drivers ({driverLocations.length})
                </h2>
              </div>
              <div className="divide-y max-h-[400px] overflow-y-auto">
                {driverLocations.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Truck className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No active drivers with location</p>
                  </div>
                ) : (
                  driverLocations.map((driver) => (
                    <div
                      key={driver.id}
                      className="p-4 hover:bg-gray-50 cursor-pointer transition"
                      onClick={() => setSelectedDriver(driver)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{driver.driverName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getDriverStatusColor(driver.status)}`}>
                              {driver.status}
                            </span>
                            <span className="text-xs text-yellow-600 flex items-center gap-1">
                              <Star className="w-3 h-3 fill-yellow-400" />
                              {driver.rating}
                            </span>
                            <span className="text-xs text-gray-500">
                              📦 {driver.totalDeliveries}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          {driver.phone && (
                            <p className="text-xs text-gray-500">📞 {driver.phone}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {driver.lastUpdate ? new Date(driver.lastUpdate).toLocaleTimeString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                      {driver.address && (
                        <p className="text-xs text-gray-500 mt-2 truncate">📍 {driver.address}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Map */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow overflow-hidden sticky top-20">
              <div className="p-3 border-b bg-gray-50 flex justify-between items-center flex-wrap gap-2">
                <span className="text-sm font-medium text-gray-600">
                  {selectedShipment ? 'Selected Shipment: ' + selectedShipment.trackingNumber : 'Driver Locations Map'}
                </span>
                <div className="flex gap-2">
                  {selectedShipment && (!selectedShipment.pickupLatitude || selectedShipment.pickupLatitude === 0) && (
                    <button
                      onClick={() => {
                        setManualPointType('pickup');
                        setManualAddressInput(selectedShipment.pickupAddress);
                        setShowManualCoordsModal(true);
                      }}
                      className="px-3 py-1 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      Manual Coords
                    </button>
                  )}
                  <button
                    onClick={() => setShowAssignModal(true)}
                    disabled={!selectedShipment}
                    className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <Truck className="w-3 h-3" />
                    Assign Driver
                  </button>
                </div>
              </div>
              <div className="aspect-video bg-gray-100">
                <RouteMap
                  points={mainMapPoints}
                  routeCoordinates={undefined}
                  onMapClick={() => {}}
                  selectedPointType="warehouse"
                />
              </div>
              <div className="p-3 border-t bg-gray-50">
                <div className="flex gap-3 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Driver Location</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span>Pickup Point</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>Delivery Point</span>
                  </div>
                </div>
                {selectedShipment && selectedShipment.pickupAddress && (
                  <div className="mt-2 text-xs text-gray-600 bg-gray-100 p-2 rounded">
                    <span className="font-medium">Pickup Address:</span> {selectedShipment.pickupAddress}
                    {(!selectedShipment.pickupLatitude || selectedShipment.pickupLatitude === 0) && (
                      <span className="text-yellow-600 block mt-1">
                        ⚠️ No coordinates. Click "Manual Coords" to set location on map.
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Coordinates Modal */}
      {showManualCoordsModal && selectedShipment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-purple-600" />
                Set {manualPointType === 'pickup' ? 'Pickup' : 'Delivery'} Coordinates
              </h2>
              <button onClick={() => setShowManualCoordsModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <p className="text-sm text-gray-600">
                Shipment: <span className="font-mono">{selectedShipment.trackingNumber}</span>
              </p>
              
              {/* Address Search */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-sm font-medium mb-2">Find by Address</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualAddressInput}
                    onChange={(e) => setManualAddressInput(e.target.value)}
                    placeholder="Enter address..."
                    className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    onKeyPress={(e) => e.key === 'Enter' && handleManualGeocode()}
                  />
                  <button
                    onClick={handleManualGeocode}
                    disabled={isGeocodingManual}
                    className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-1"
                  >
                    {isGeocodingManual ? <Loader className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    Search
                  </button>
                </div>
              </div>
              
              {/* Current Location Button */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-sm font-medium mb-2">Use Current Location</label>
                <button
                  onClick={handleGetCurrentLocationForManual}
                  disabled={isGettingCurrentLocation}
                  className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <LocateFixed className="w-4 h-4" />
                  {isGettingCurrentLocation ? 'Getting location...' : 'Get My Current Location'}
                </button>
              </div>
              
              {/* Manual Coordinates Input */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-sm font-medium mb-2">Or Enter Coordinates Manually</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={manualLatitude}
                      onChange={(e) => setManualLatitude(e.target.value)}
                      placeholder="e.g., 42.6629"
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={manualLongitude}
                      onChange={(e) => setManualLongitude(e.target.value)}
                      placeholder="e.g., 21.1655"
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>
              
              {/* Mini Map for picking coordinates */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-sm font-medium mb-2">Or Click on Map to Select</label>
                <div className="h-64 rounded-lg overflow-hidden border">
                  <RouteMap
                    points={manualMapPoints}
                    routeCoordinates={undefined}
                    onMapClick={handleManualMapClick}
                    selectedPointType={manualPointType}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">Click anywhere on the map to set coordinates</p>
              </div>
            </div>
            
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setShowManualCoordsModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveManualCoordinates}
                disabled={fetchingPickupForShipment === selectedShipment.id}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
              >
                {fetchingPickupForShipment === selectedShipment.id ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Coordinates
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Driver Modal */}
      {showAssignModal && selectedShipment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-semibold">Assign Driver</h2>
              <button onClick={() => setShowAssignModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-4">
                Shipment: <span className="font-mono">{selectedShipment.trackingNumber}</span>
              </p>
              
              <label className="block text-sm font-medium mb-2">Select Driver</label>
              <select
                value={selectedDriver?.driverId || ''}
                onChange={(e) => {
                  const driver = driverLocations.find(d => d.driverId === e.target.value);
                  setSelectedDriver(driver || null);
                }}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a driver...</option>
                {driverLocations.map((driver) => {
                  let distanceText = 'N/A';
                  if (selectedShipment.pickupLatitude && selectedShipment.pickupLongitude && 
                      selectedShipment.pickupLatitude !== 0 && selectedShipment.pickupLongitude !== 0 &&
                      driver.latitude && driver.longitude && driver.latitude !== 0 && driver.longitude !== 0) {
                    const dist = calculateDistance(
                      driver.latitude, driver.longitude,
                      selectedShipment.pickupLatitude, selectedShipment.pickupLongitude
                    );
                    distanceText = dist.toFixed(1) + ' km';
                  }
                  return (
                    <option key={driver.driverId} value={driver.driverId}>
                      {driver.driverName} - {distanceText} away - ⭐ {driver.rating} - 📦 {driver.totalDeliveries}
                    </option>
                  );
                })}
              </select>

              {selectedDriver && selectedShipment.pickupLatitude && selectedShipment.pickupLongitude && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    📍 Distance to pickup: {
                      calculateDistance(
                        selectedDriver.latitude, selectedDriver.longitude,
                        selectedShipment.pickupLatitude, selectedShipment.pickupLongitude
                      ).toFixed(1)
                    } km
                  </p>
                </div>
              )}

              <div className="flex gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignDriver}
                  disabled={assigning || !selectedDriver}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {assigning ? 'Assigning...' : 'Assign Driver'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverLocationMap;