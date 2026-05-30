// frontend/src/pages/dispatcher/DriverLocationMap.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Truck, RefreshCw, X, User, Phone, Star, Package, Search, Loader, Navigation, Edit3, Save, LocateFixed } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { locationService } from '../../services/location.service';
import { RouteMap } from '../../components/driver/RouteMap';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

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

  const updateShipmentCoordinates = async (shipmentId: string, updates: { pickupLatitude?: number; pickupLongitude?: number; deliveryLatitude?: number; deliveryLongitude?: number }) => {
    try {
      const response = await api.patch(`/shipments/${shipmentId}/coordinates`, updates);
      return response.data;
    } catch (error) {
      console.error('Error updating coordinates:', error);
      throw error;
    }
  };

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
        toast.error('Could not find coordinates automatically', { id: 'geocode' });
        setManualPointType('pickup');
        setManualAddressInput(shipment.pickupAddress);
        setShowManualCoordsModal(true);
      }
    } catch (error: any) {
      console.error('Error updating shipment coordinates:', error);
      toast.error(error.response?.data?.message || 'Failed to update coordinates', { id: 'geocode' });
      setManualPointType('pickup');
      setManualAddressInput(shipment.pickupAddress);
      setShowManualCoordsModal(true);
    } finally {
      setFetchingPickupForShipment(null);
    }
  };

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

  const handleGetCurrentLocationForManual = async () => {
    setIsGettingCurrentLocation(true);
    try {
      const position = await locationService.getCurrentLocation();
      setManualLatitude(position.coords.latitude.toString());
      setManualLongitude(position.coords.longitude.toString());
      
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
      available: 'bg-green-200 text-green-800',
      on_duty: 'bg-blue-200 text-blue-800',
      on_break: 'bg-yellow-200 text-yellow-800',
      off_duty: 'bg-gray-200 text-gray-800',
    };
    return colors[status] || 'bg-gray-200 text-gray-800';
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      pending: 'bg-yellow-200 text-yellow-800',
      picked_up: 'bg-blue-200 text-blue-800',
      in_transit: 'bg-purple-200 text-purple-800',
      delivered: 'bg-green-200 text-green-800',
      failed: 'bg-red-200 text-red-800',
      cancelled: 'bg-gray-200 text-gray-800',
    };
    return badges[status] || 'bg-gray-200 text-gray-800';
  };

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

  const manualMapPoints: MapCoordinate[] = (manualLatitude && manualLongitude) ? [{
    latitude: parseFloat(manualLatitude),
    longitude: parseFloat(manualLongitude)
  }] : [];

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-blue-700 rounded-full" />
                <h1 className="text-2xl font-extrabold text-gray-900">Driver Location Tracker</h1>
              </div>
              <p className="text-sm text-gray-600 pl-3 mt-0.5">View driver locations and assign nearest driver to shipments</p>
            </div>
            <button
              onClick={refreshData}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Shipments List */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-800 to-orange-700 px-4 py-3">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Pending Shipments ({shipments.length})
                </h2>
              </div>
              <div className="divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
                {shipments.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="font-medium">No pending shipments</p>
                  </div>
                ) : (
                  shipments.map((shipment) => {
                    const nearest = findNearestDriver(shipment);
                    const isFetching = fetchingPickupForShipment === shipment.id;
                    return (
                      <div
                        key={shipment.id}
                        className={`p-4 hover:bg-gray-50 cursor-pointer transition ${
                          selectedShipment?.id === shipment.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                        }`}
                        onClick={() => setSelectedShipment(shipment)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-mono text-sm font-bold text-gray-900">{shipment.trackingNumber}</p>
                            <p className="text-xs text-gray-600 mt-1 truncate">{shipment.pickupAddress}</p>
                            {(!shipment.pickupLatitude || shipment.pickupLatitude === 0) && (
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-semibold text-red-600">⚠️ No coordinates</span>
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
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800">
                              {nearest.distance.toFixed(1)} km
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${getStatusBadge(shipment.status)}`}>
                            {shipment.status}
                          </span>
                          {shipment.priority === 'urgent' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-200 text-red-800">Urgent</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Driver Locations List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-green-800 to-green-700 px-4 py-3">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  Active Drivers ({driverLocations.length})
                </h2>
              </div>
              <div className="divide-y divide-gray-200 max-h-[400px] overflow-y-auto">
                {driverLocations.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Truck className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="font-medium">No active drivers with location</p>
                  </div>
                ) : (
                  driverLocations.map((driver) => (
                    <div
                      key={driver.id}
                      className="p-4 hover:bg-gray-50 cursor-pointer transition"
                      onClick={() => setSelectedDriver(driver)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-700" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-sm text-gray-900">{driver.driverName}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${getDriverStatusColor(driver.status)}`}>
                              {driver.status}
                            </span>
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-yellow-700">
                              <Star className="w-3 h-3 fill-yellow-500" />
                              {driver.rating}
                            </span>
                            <span className="text-xs text-gray-600">
                              📦 {driver.totalDeliveries}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          {driver.phone && (
                            <p className="text-xs text-gray-600">📞 {driver.phone}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {driver.lastUpdate ? new Date(driver.lastUpdate).toLocaleTimeString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                      {driver.address && (
                        <p className="text-xs text-gray-600 mt-2 truncate">📍 {driver.address}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Map */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-20">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center flex-wrap gap-2">
                <span className="text-sm font-bold text-gray-700">
                  {selectedShipment ? `Selected Shipment: ${selectedShipment.trackingNumber}` : 'Driver Locations Map'}
                </span>
                <div className="flex gap-2">
                  {selectedShipment && (!selectedShipment.pickupLatitude || selectedShipment.pickupLatitude === 0) && (
                    <button
                      onClick={() => {
                        setManualPointType('pickup');
                        setManualAddressInput(selectedShipment.pickupAddress);
                        setShowManualCoordsModal(true);
                      }}
                      className="px-3 py-1 bg-purple-700 text-white rounded-lg text-sm font-semibold hover:bg-purple-800 flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      Manual Coords
                    </button>
                  )}
                  <button
                    onClick={() => setShowAssignModal(true)}
                    disabled={!selectedShipment}
                    className="px-3 py-1 bg-blue-700 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
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
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                <div className="flex gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                    <span className="font-medium text-gray-700">Driver Location</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                    <span className="font-medium text-gray-700">Pickup Point</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                    <span className="font-medium text-gray-700">Delivery Point</span>
                  </div>
                </div>
                {selectedShipment && selectedShipment.pickupAddress && (
                  <div className="mt-2 text-xs text-gray-700 bg-blue-50 p-2 rounded-lg">
                    <span className="font-bold">Pickup Address:</span> {selectedShipment.pickupAddress}
                    {(!selectedShipment.pickupLatitude || selectedShipment.pickupLatitude === 0) && (
                      <span className="text-red-600 block mt-1 font-semibold">
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
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-purple-800 to-purple-700 px-5 py-3 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-white" />
                <h2 className="text-lg font-bold text-white">Set {manualPointType === 'pickup' ? 'Pickup' : 'Delivery'} Coordinates</h2>
              </div>
              <button onClick={() => setShowManualCoordsModal(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <p className="text-sm text-gray-800">
                Shipment: <span className="font-mono font-bold">{selectedShipment.trackingNumber}</span>
              </p>
              
              {/* Address Search */}
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="block text-sm font-bold text-gray-800 mb-2">Find by Address</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualAddressInput}
                    onChange={(e) => setManualAddressInput(e.target.value)}
                    placeholder="Enter address..."
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && handleManualGeocode()}
                  />
                  <button
                    onClick={handleManualGeocode}
                    disabled={isGeocodingManual}
                    className="px-3 py-2 bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800 disabled:opacity-50 flex items-center gap-1"
                  >
                    {isGeocodingManual ? <Loader className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    Search
                  </button>
                </div>
              </div>
              
              {/* Current Location Button */}
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="block text-sm font-bold text-gray-800 mb-2">Use Current Location</label>
                <button
                  onClick={handleGetCurrentLocationForManual}
                  disabled={isGettingCurrentLocation}
                  className="w-full bg-green-700 text-white py-2 rounded-lg font-semibold hover:bg-green-800 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <LocateFixed className="w-4 h-4" />
                  {isGettingCurrentLocation ? 'Getting location...' : 'Get My Current Location'}
                </button>
              </div>
              
              {/* Manual Coordinates Input */}
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="block text-sm font-bold text-gray-800 mb-2">Or Enter Coordinates Manually</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={manualLatitude}
                      onChange={(e) => setManualLatitude(e.target.value)}
                      placeholder="e.g., 42.6629"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={manualLongitude}
                      onChange={(e) => setManualLongitude(e.target.value)}
                      placeholder="e.g., 21.1655"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-600"
                    />
                  </div>
                </div>
              </div>
              
              {/* Mini Map */}
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="block text-sm font-bold text-gray-800 mb-2">Or Click on Map to Select</label>
                <div className="h-64 rounded-lg overflow-hidden border border-gray-300">
                  <RouteMap
                    points={manualMapPoints}
                    routeCoordinates={undefined}
                    onMapClick={handleManualMapClick}
                    selectedPointType={manualPointType}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-2">Click anywhere on the map to set coordinates</p>
              </div>
            </div>
            
            <div className="px-5 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setShowManualCoordsModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-800 font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveManualCoordinates}
                disabled={fetchingPickupForShipment === selectedShipment.id}
                className="px-4 py-2 bg-purple-700 text-white rounded-lg font-bold hover:bg-purple-800 transition flex items-center gap-2"
              >
                {fetchingPickupForShipment === selectedShipment.id ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
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
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-blue-800 to-blue-700 px-5 py-3 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Assign Driver</h2>
              <button onClick={() => setShowAssignModal(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-800 mb-4">
                Shipment: <span className="font-mono font-bold">{selectedShipment.trackingNumber}</span>
              </p>
              
              <label className="block text-sm font-bold text-gray-800 mb-2">Select Driver</label>
              <select
                value={selectedDriver?.driverId || ''}
                onChange={(e) => {
                  const driver = driverLocations.find(d => d.driverId === e.target.value);
                  setSelectedDriver(driver || null);
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:ring-2 focus:ring-blue-600"
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
                  <p className="text-sm text-blue-800 font-semibold">
                    📍 Distance to pickup: {
                      calculateDistance(
                        selectedDriver.latitude, selectedDriver.longitude,
                        selectedShipment.pickupLatitude, selectedShipment.pickupLongitude
                      ).toFixed(1)
                    } km
                  </p>
                </div>
              )}

              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-800 font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignDriver}
                  disabled={assigning || !selectedDriver}
                  className="flex-1 bg-blue-700 text-white py-2 rounded-lg font-bold hover:bg-blue-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
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