// frontend/src/pages/driver/RouteOptimizerPage.tsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { RouteMap } from '../../components/driver/RouteMap';
import { RouteInstructions } from '../../components/driver/RouteInstructions';
import routeService from '../../services/route.service';
import type { Coordinate, RouteResponse } from '../../types/route.types';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { locationService } from '../../services/location.service';
import { ArrowLeft, CheckCircle, Truck, Search, Navigation, LocateFixed, MapPin, Save } from 'lucide-react';
import SimpleErrorBoundary from '../../components/common/SimpleErrorBoundary';

export const RouteOptimizerPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const queryParams = new URLSearchParams(location.search);
  
  const shipmentData = {
    shipmentId: queryParams.get('shipmentId') || '',
    trackingNumber: queryParams.get('trackingNumber') || '',
    waybillNumber: queryParams.get('waybillNumber') || '',
    pickupAddress: queryParams.get('pickupAddress') || '',
    deliveryAddress: queryParams.get('deliveryAddress') || '',
    pickupLat: parseFloat(queryParams.get('pickupLat') || '0'),
    pickupLng: parseFloat(queryParams.get('pickupLng') || '0'),
    deliveryLat: parseFloat(queryParams.get('deliveryLat') || '0'),
    deliveryLng: parseFloat(queryParams.get('deliveryLng') || '0'),
  };

  const [points, setPoints] = useState<Coordinate[]>([]);
  const [pointLabels, setPointLabels] = useState<string[]>([]);
  const [routeData, setRouteData] = useState<RouteResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRouteStarted, setIsRouteStarted] = useState(false);
  const [addressInput, setAddressInput] = useState('');
  const [selectedType, setSelectedType] = useState<'pickup' | 'delivery' | 'warehouse'>('pickup');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isGettingCurrentLocation, setIsGettingCurrentLocation] = useState(false);
  const [showSavedLocationSection, setShowSavedLocationSection] = useState(true);

  // Initialize points from shipment data
  useEffect(() => {
    const initialPoints: Coordinate[] = [];
    const labels: string[] = [];
    
    if (shipmentData.pickupLat && shipmentData.pickupLat !== 0) {
      initialPoints.push({ latitude: shipmentData.pickupLat, longitude: shipmentData.pickupLng });
      labels.push('pickup');
    }
    
    if (shipmentData.deliveryLat && shipmentData.deliveryLat !== 0) {
      initialPoints.push({ latitude: shipmentData.deliveryLat, longitude: shipmentData.deliveryLng });
      labels.push('delivery');
    }
    
    setPoints(initialPoints);
    setPointLabels(labels);
    
    // Auto-fetch saved location
    loadSavedLocation();
  }, [shipmentData.shipmentId]);

  const loadSavedLocation = async () => {
    setIsGettingCurrentLocation(true);
    try {
      const savedLocation = await locationService.getLastSavedLocation();
      if (savedLocation && savedLocation.latitude && savedLocation.longitude) {
        const currentPoint = { 
          latitude: Number(savedLocation.latitude), 
          longitude: Number(savedLocation.longitude) 
        };
        setPoints(prev => [currentPoint, ...prev]);
        setPointLabels(prev => ['warehouse', ...prev]);
        toast.success('Using your saved location as starting point');
      }
    } catch (error) {
      console.error('Failed to get saved location:', error);
    } finally {
      setIsGettingCurrentLocation(false);
    }
  };

  const addCurrentLocation = async () => {
    setIsGettingCurrentLocation(true);
    try {
      const position = await locationService.getCurrentLocation();
      const newPoint = { 
        latitude: position.coords.latitude, 
        longitude: position.coords.longitude 
      };
      // Replace first point if it's a saved location, otherwise add
      if (points.length > 0 && pointLabels[0] === 'warehouse') {
        setPoints([newPoint, ...points.slice(1)]);
        setPointLabels(['warehouse', ...pointLabels.slice(1)]);
      } else {
        setPoints([newPoint, ...points]);
        setPointLabels(['warehouse', ...pointLabels]);
      }
      setRouteData(null);
      toast.success('Current location added as starting point');
      setShowSavedLocationSection(false);
    } catch (error: any) {
      console.error('Error getting current location:', error);
      if (error.code === 1) {
        toast.error('Location access denied. Please enable location services in browser settings.');
      } else {
        toast.error('Could not get your current location');
      }
    } finally {
      setIsGettingCurrentLocation(false);
    }
  };

  const handleSearchAddress = async () => {
    if (!addressInput.trim()) {
      toast.error('Please enter an address');
      return;
    }
    
    setIsGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addressInput)}&format=json&limit=1`
      );
      const data = await response.json();
      if (data && data[0]) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setPoints([...points, { latitude: lat, longitude: lon }]);
        setPointLabels([...pointLabels, selectedType]);
        setRouteData(null);
        setAddressInput('');
        toast.success(`${selectedType} point added`);
      } else {
        toast.error('Address not found');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      toast.error('Failed to locate address');
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (isRouteStarted) {
      toast.error('Cannot add points after route started');
      return;
    }
    
    setPoints([...points, { latitude: lat, longitude: lng }]);
    setPointLabels([...pointLabels, selectedType]);
    setRouteData(null);
    toast.success(`${selectedType} point added`);
  };

  const handleOptimizeRoute = async (customPoints?: Coordinate[]) => {
    const pointsToUse = customPoints || points;
    if (pointsToUse.length < 2) {
      toast.error('Please add at least 2 points (starting point + pickup/delivery)');
      return;
    }

    setIsLoading(true);
    try {
      const data = await routeService.optimizeRoute(pointsToUse);
      setRouteData(data);
      toast.success('Route optimized!');
    } catch (error: any) {
      console.error('Optimize error:', error);
      toast.error(error.response?.data?.message || 'Failed to optimize route');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartRoute = () => {
    if (!routeData) {
      toast.error('Please optimize route first');
      return;
    }
    setIsRouteStarted(true);
    toast.success('Route started! Follow navigation.');
  };

  const handleCompleteDelivery = async () => {
    if (!shipmentData?.shipmentId) {
      toast.error('No shipment associated');
      return;
    }

    setIsLoading(true);
    try {
      await api.patch(`/shipments/${shipmentData.shipmentId}/status`, {
        status: 'delivered',
        notes: 'Delivery completed via route optimizer'
      });
      
      toast.success('Delivery completed!');
      
      navigate(`/driver/shipments/${shipmentData.shipmentId}`, {
        state: { openSignatureModal: true }
      });
    } catch (error: any) {
      console.error('Error completing delivery:', error);
      toast.error(error.response?.data?.message || 'Failed to complete delivery');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveLastPoint = () => {
    if (isRouteStarted) {
      toast.error('Cannot remove points after route started');
      return;
    }
    setPoints(points.slice(0, -1));
    setPointLabels(pointLabels.slice(0, -1));
    setRouteData(null);
  };

  const handleClearPoints = () => {
    if (isRouteStarted) {
      toast.error('Cannot clear points after route started');
      return;
    }
    setPoints([]);
    setPointLabels([]);
    setRouteData(null);
  };

  const emptyHandler = () => {};

  const getPointIcon = (label: string) => {
    switch (label) {
      case 'warehouse': return '📍';
      case 'pickup': return '🟢';
      case 'delivery': return '🔴';
      default: return '📍';
    }
  };

  const getPointColor = (label: string) => {
    switch (label) {
      case 'warehouse': return 'text-blue-600';
      case 'pickup': return 'text-green-600';
      case 'delivery': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (!shipmentData.shipmentId) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 text-center max-w-md">
          <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Shipment Data</h2>
          <p className="text-gray-600 mb-4">
            Please go back to the shipment details and click "Start Delivery Procedure" again.
          </p>
          <button
            onClick={() => navigate('/driver')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/driver')} className="text-gray-600 hover:text-gray-800">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-blue-600">Route Optimizer</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{user?.name}</span>
            {shipmentData?.trackingNumber && (
              <span className="text-sm bg-blue-100 text-blue-600 px-2 py-1 rounded">
                {shipmentData.trackingNumber}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel */}
          <div className="lg:col-span-1 space-y-4">
            {/* Shipment Info */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-500" />
                Shipment Details
              </h3>
              <p className="text-sm"><span className="font-medium">Tracking:</span> {shipmentData.trackingNumber}</p>
              {shipmentData.waybillNumber && (
                <p className="text-sm"><span className="font-medium">Waybill:</span> {shipmentData.waybillNumber}</p>
              )}
              <p className="text-sm mt-1"><span className="font-medium">Pickup:</span> {shipmentData.pickupAddress}</p>
              <p className="text-sm"><span className="font-medium">Delivery:</span> {shipmentData.deliveryAddress}</p>
            </div>

            {/* Use Saved Location Button */}
            {!isRouteStarted && showSavedLocationSection && (
              <div className="bg-white rounded-lg shadow p-4 border border-blue-200">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Save className="w-4 h-4 text-green-500" />
                  Saved Location
                </h3>
                <button
                  onClick={loadSavedLocation}
                  className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 flex items-center justify-center gap-2 mb-2"
                >
                  <MapPin className="w-4 h-4" />
                  Use Saved Location from Profile
                </button>
                <p className="text-xs text-gray-500 text-center">
                  Use the location you saved in your profile
                </p>
              </div>
            )}

            {/* Current Location Button */}
            {!isRouteStarted && (
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <LocateFixed className="w-4 h-4 text-blue-500" />
                  Starting Point
                </h3>
                <button
                  onClick={addCurrentLocation}
                  disabled={isGettingCurrentLocation}
                  className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2 mb-2"
                >
                  <Navigation className="w-4 h-4" />
                  {isGettingCurrentLocation ? 'Getting location...' : 'Use My Current Location (GPS)'}
                </button>
                <p className="text-xs text-gray-500 text-center">
                  Get your real-time GPS location
                </p>
              </div>
            )}

            {/* Add by Address */}
            {!isRouteStarted && (
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Add Point by Address
                </h3>
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setSelectedType('pickup')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-sm transition ${
                      selectedType === 'pickup' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    🟢 Pickup
                  </button>
                  <button
                    onClick={() => setSelectedType('delivery')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-sm transition ${
                      selectedType === 'delivery' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    🔴 Delivery
                  </button>
                  <button
                    onClick={() => setSelectedType('warehouse')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-sm transition ${
                      selectedType === 'warehouse' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    📍 Waypoint
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={addressInput}
                    onChange={(e) => setAddressInput(e.target.value)}
                    placeholder="Enter address..."
                    className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearchAddress()}
                  />
                  <button
                    onClick={handleSearchAddress}
                    disabled={isGeocoding}
                    className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                  >
                    {isGeocoding ? '...' : 'Add'}
                  </button>
                </div>
              </div>
            )}

            {/* Add by Map Click */}
            {!isRouteStarted && (
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold mb-3">Add Point by Map Click</h3>
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={() => setSelectedType('pickup')}
                    className={`flex-1 py-2 px-3 rounded-lg transition ${
                      selectedType === 'pickup' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    🟢 Pickup
                  </button>
                  <button
                    onClick={() => setSelectedType('delivery')}
                    className={`flex-1 py-2 px-3 rounded-lg transition ${
                      selectedType === 'delivery' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    🔴 Delivery
                  </button>
                  <button
                    onClick={() => setSelectedType('warehouse')}
                    className={`flex-1 py-2 px-3 rounded-lg transition ${
                      selectedType === 'warehouse' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    📍 Waypoint
                  </button>
                </div>
                <p className="text-xs text-gray-500">Click directly on the map to add points</p>
              </div>
            )}

            {/* Points List */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold mb-3">Route Points ({points.length})</h3>
              {points.length === 0 ? (
                <p className="text-gray-500 text-sm">No points added</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {points.map((point, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <span className={getPointColor(pointLabels[index])}>
                          {getPointIcon(pointLabels[index])}
                        </span>
                        <span className="text-sm">
                          {Number(point.latitude).toFixed(4)}, {Number(point.longitude).toFixed(4)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 capitalize">{pointLabels[index] || 'waypoint'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {!isRouteStarted ? (
                <>
                  <button
                    onClick={() => handleOptimizeRoute()}
                    disabled={points.length < 2 || isLoading}
                    className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
                  >
                    {isLoading ? 'Optimizing...' : '🗺️ Optimize'}
                  </button>
                  <button
                    onClick={handleRemoveLastPoint}
                    disabled={points.length === 0}
                    className="px-3 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50"
                  >
                    ↶ Undo
                  </button>
                  <button
                    onClick={handleClearPoints}
                    disabled={points.length === 0}
                    className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                  >
                    ✕ Clear
                  </button>
                </>
              ) : (
                <button
                  onClick={handleCompleteDelivery}
                  disabled={isLoading}
                  className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 flex items-center justify-center gap-2 text-lg font-semibold"
                >
                  <CheckCircle className="w-5 h-5" />
                  {isLoading ? 'Completing...' : '✓ Complete Delivery'}
                </button>
              )}
            </div>

            {routeData && !isRouteStarted && (
              <button
                onClick={handleStartRoute}
                className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600"
              >
                🚀 Start Route
              </button>
            )}
          </div>

          {/* Map */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-3 border-b bg-gray-50 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">
                  {isRouteStarted ? 'Route in Progress' : `Click map to add ${selectedType}`}
                </span>
                {isRouteStarted && (
                  <span className="text-sm bg-green-100 text-green-600 px-2 py-1 rounded">
                    <Navigation className="w-3 h-3 inline mr-1" />
                    Navigation Active
                  </span>
                )}
              </div>
              <SimpleErrorBoundary>
                <RouteMap
                  points={points}
                  routeCoordinates={routeData?.features[0]?.geometry.coordinates}
                  onMapClick={!isRouteStarted ? handleMapClick : emptyHandler}
                  selectedPointType={selectedType}
                />
              </SimpleErrorBoundary>
            </div>
          </div>
        </div>

        {/* Route Instructions */}
        <div className="mt-6">
          <RouteInstructions routeData={routeData} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
};

export default RouteOptimizerPage;