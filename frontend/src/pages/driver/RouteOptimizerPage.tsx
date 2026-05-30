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
import { ArrowLeft, CheckCircle, Truck, Search, Navigation, LocateFixed, MapPin, Save, AlertTriangle } from 'lucide-react';
import SimpleErrorBoundary from '../../components/common/SimpleErrorBoundary';
import { ReportProblemModal } from '../../components/driver/ReportProblemModal';
import { motion } from 'framer-motion';

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
  const [optimizationId, setOptimizationId] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);

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
    
    loadSavedLocation();
  }, [shipmentData.shipmentId]);

  const calculateDistance = (routePoints: Coordinate[]): number => {
    if (routePoints.length < 2) return 0;
    let total = 0;
    for (let i = 1; i < routePoints.length; i++) {
      const lat1 = Number(routePoints[i-1].latitude);
      const lon1 = Number(routePoints[i-1].longitude);
      const lat2 = Number(routePoints[i].latitude);
      const lon2 = Number(routePoints[i].longitude);
      
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      total += R * c;
    }
    return total;
  };

  const saveOriginalRoute = async (routePoints: Coordinate[]) => {
    try {
      const totalDistance = calculateDistance(routePoints);
      const response = await api.post('/ai/optimizations', {
        shipmentId: shipmentData.shipmentId,
        originalRoute: {
          points: routePoints,
          pointLabels: pointLabels,
          totalDistance: totalDistance
        },
        originalDistanceKm: totalDistance
      });
      setOptimizationId(response.data.id);
      toast.success('Original route saved!');
    } catch (error: any) {
      console.error('Error saving original route:', error);
      toast.error(error.response?.data?.message || 'Failed to save route');
    }
  };

  const saveOptimizedRoute = async (optimizedData: RouteResponse, originalPoints: Coordinate[]) => {
    if (!optimizationId) return;
    
    try {
      const optimizedCoordinates = optimizedData?.features?.[0]?.geometry?.coordinates || [];
      const convertedPoints = optimizedCoordinates.map((coord: number[]) => ({
        latitude: coord[1],
        longitude: coord[0]
      }));
      
      const originalDistance = calculateDistance(originalPoints);
      const optimizedDistance = calculateDistance(convertedPoints);
      const savedDistance = originalDistance - optimizedDistance;
      
      const updateData = {
        optimizedRoute: {
          points: convertedPoints,
          totalDistance: Number(optimizedDistance.toFixed(2)),
        },
        savedDistanceKm: Number(savedDistance.toFixed(2)),
        confidenceScore: originalDistance > 0 
          ? Number((Math.min(0.95, Math.max(0, (savedDistance / originalDistance) + 0.5))).toFixed(2))
          : 0.5
      };
      
      await api.patch(`/ai/optimizations/${optimizationId}`, updateData);
    } catch (error) {
      console.error('Failed to save optimized route:', error);
    }
  };

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
      if (error.code === 1) {
        toast.error('Location access denied. Please enable location services.');
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

  const handleOptimizeRoute = async () => {
    if (points.length < 2) {
      toast.error('Please add at least 2 points');
      return;
    }

    const originalPointsCopy = [...points];
    const originalDistance = calculateDistance(originalPointsCopy);

    setIsLoading(true);
    try {
      if (!optimizationId) {
        const response = await api.post('/ai/optimizations', {
          shipmentId: shipmentData.shipmentId,
          originalRoute: {
            points: originalPointsCopy,
            pointLabels: pointLabels,
            totalDistance: originalDistance
          },
          originalDistanceKm: originalDistance
        });
        setOptimizationId(response.data.id);
      }

      const optimizedResult = await routeService.optimizeRoute(originalPointsCopy);
      setRouteData(optimizedResult);
      
      const optimizedPoints = optimizedResult?.features?.[0]?.geometry?.coordinates || [];
      const convertedOptimizedPoints = optimizedPoints.map((coord: number[]) => ({
        latitude: coord[1],
        longitude: coord[0]
      }));
      
      const optimizedDistance = calculateDistance(convertedOptimizedPoints);
      const savedDistance = originalDistance - optimizedDistance;
      
      let confidenceScore = 0.5;
      if (originalDistance > 0 && savedDistance > 0) {
        const savingsPercent = savedDistance / originalDistance;
        confidenceScore = Math.min(0.95, 0.5 + savingsPercent);
        confidenceScore = Math.max(0.1, confidenceScore);
      }
      
      if (optimizationId) {
        await api.patch(`/ai/optimizations/${optimizationId}`, {
          optimizedRoute: {
            points: convertedOptimizedPoints,
            totalDistance: Number(optimizedDistance.toFixed(2))
          },
          savedDistanceKm: Number(savedDistance.toFixed(2)),
          confidenceScore: Number(confidenceScore.toFixed(2))
        });
      }
      
      toast.success(`Route optimized! Saved ${savedDistance.toFixed(2)} km`);
    } catch (error: any) {
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center max-w-md">
          <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">No Shipment Data</h2>
          <p className="text-gray-600 mb-4">
            Please go back to the shipment details and click "Start Delivery Procedure" again.
          </p>
          <button
            onClick={() => navigate('/driver')}
            className="px-4 py-2 bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800 transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/driver')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-700 hover:bg-gray-200 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Back</span>
              </button>
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-blue-700 rounded-full" />
                <h1 className="text-2xl font-extrabold text-gray-900">Route Optimizer</h1>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 mt-2">
              <p className="text-sm text-gray-600 pl-3">Optimize your delivery route</p>
              {shipmentData?.trackingNumber && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                  <Truck className="w-3 h-3 mr-1" />
                  {shipmentData.trackingNumber}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel */}
            <div className="space-y-5">
              {/* Shipment Info */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-700" />
                  Shipment Details
                </h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-semibold text-gray-700">Tracking:</span> <span className="text-gray-800">{shipmentData.trackingNumber}</span></p>
                  {shipmentData.waybillNumber && (
                    <p><span className="font-semibold text-gray-700">Waybill:</span> <span className="text-gray-800">{shipmentData.waybillNumber}</span></p>
                  )}
                  <p className="flex items-start gap-1"><span className="font-semibold text-gray-700 shrink-0">Pickup:</span> <span className="text-gray-800 break-words">{shipmentData.pickupAddress}</span></p>
                  <p className="flex items-start gap-1"><span className="font-semibold text-gray-700 shrink-0">Delivery:</span> <span className="text-gray-800 break-words">{shipmentData.deliveryAddress}</span></p>
                </div>
              </div>

              {/* Saved Location */}
              {!isRouteStarted && showSavedLocationSection && (
                <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-5">
                  <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Save className="w-4 h-4 text-green-700" />
                    Saved Location
                  </h3>
                  <button
                    onClick={loadSavedLocation}
                    className="w-full bg-green-700 text-white py-2 rounded-lg font-semibold hover:bg-green-800 transition flex items-center justify-center gap-2"
                  >
                    <MapPin className="w-4 h-4" />
                    Use Saved Location from Profile
                  </button>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Use the location you saved in your profile
                  </p>
                </div>
              )}

              {/* Current Location */}
              {!isRouteStarted && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                  <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <LocateFixed className="w-4 h-4 text-blue-700" />
                    Starting Point
                  </h3>
                  <button
                    onClick={addCurrentLocation}
                    disabled={isGettingCurrentLocation}
                    className="w-full bg-blue-700 text-white py-2 rounded-lg font-semibold hover:bg-blue-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Navigation className="w-4 h-4" />
                    {isGettingCurrentLocation ? 'Getting location...' : 'Use My Current Location (GPS)'}
                  </button>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Get your real-time GPS location
                  </p>
                </div>
              )}

              {/* Add by Address */}
              {!isRouteStarted && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                  <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Search className="w-4 h-4 text-blue-700" />
                    Add Point by Address
                  </h3>
                  <div className="flex gap-2 mb-3">
                    {(['pickup', 'delivery', 'warehouse'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setSelectedType(type)}
                        className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition ${
                          selectedType === type
                            ? type === 'pickup' ? 'bg-green-700 text-white' : type === 'delivery' ? 'bg-red-700 text-white' : 'bg-blue-700 text-white'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {type === 'pickup' ? '🟢 Pickup' : type === 'delivery' ? '🔴 Delivery' : '📍 Waypoint'}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={addressInput}
                      onChange={(e) => setAddressInput(e.target.value)}
                      placeholder="Enter address..."
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      onKeyPress={(e) => e.key === 'Enter' && handleSearchAddress()}
                    />
                    <button
                      onClick={handleSearchAddress}
                      disabled={isGeocoding}
                      className="px-3 py-2 bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800 disabled:opacity-50"
                    >
                      {isGeocoding ? '...' : 'Add'}
                    </button>
                  </div>
                </div>
              )}

              {/* Add by Map Click */}
              {!isRouteStarted && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                  <h3 className="text-sm font-bold text-gray-800 mb-2">Add Point by Map Click</h3>
                  <div className="flex gap-2 mb-2">
                    {(['pickup', 'delivery', 'warehouse'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setSelectedType(type)}
                        className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition ${
                          selectedType === type
                            ? type === 'pickup' ? 'bg-green-700 text-white' : type === 'delivery' ? 'bg-red-700 text-white' : 'bg-blue-700 text-white'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {type === 'pickup' ? '🟢' : type === 'delivery' ? '🔴' : '📍'} {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">Click directly on the map to add points</p>
                </div>
              )}

              {/* Points List */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 className="text-sm font-bold text-gray-800 mb-3">Route Points ({points.length})</h3>
                {points.length === 0 ? (
                  <p className="text-gray-500 text-sm">No points added</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {points.map((point, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className={getPointColor(pointLabels[index])}>
                            {getPointIcon(pointLabels[index])}
                          </span>
                          <span className="text-sm text-gray-800 font-mono">
                            {Number(point.latitude).toFixed(4)}, {Number(point.longitude).toFixed(4)}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 capitalize">{pointLabels[index] || 'waypoint'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                  {!isRouteStarted ? (
                    <>
                      <button
                        onClick={handleOptimizeRoute}
                        disabled={points.length < 2 || isLoading}
                        className="flex-1 bg-blue-700 text-white py-2 rounded-lg font-semibold hover:bg-blue-800 disabled:opacity-50 transition"
                      >
                        {isLoading ? 'Optimizing...' : '🗺️ Optimize Route'}
                      </button>
                      <button
                        onClick={handleRemoveLastPoint}
                        disabled={points.length === 0}
                        className="px-3 py-2 bg-yellow-700 text-white rounded-lg font-semibold hover:bg-yellow-800 disabled:opacity-50 transition"
                      >
                        ↶ Undo
                      </button>
                      <button
                        onClick={handleClearPoints}
                        disabled={points.length === 0}
                        className="px-3 py-2 bg-red-700 text-white rounded-lg font-semibold hover:bg-red-800 disabled:opacity-50 transition"
                      >
                        ✕ Clear
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleCompleteDelivery}
                      disabled={isLoading}
                      className="w-full bg-green-700 text-white py-3 rounded-lg font-bold hover:bg-green-800 transition flex items-center justify-center gap-2 text-base"
                    >
                      <CheckCircle className="w-5 h-5" />
                      {isLoading ? 'Completing...' : '✓ Complete Delivery'}
                    </button>
                  )}
                </div>

                {/* Report Problem Button */}
                {isRouteStarted && (
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="w-full bg-red-700 text-white py-2 rounded-lg font-semibold hover:bg-red-800 transition flex items-center justify-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Report Problem
                  </button>
                )}
              </div>

              {routeData && !isRouteStarted && (
                <button
                  onClick={handleStartRoute}
                  className="w-full bg-green-700 text-white py-2 rounded-lg font-semibold hover:bg-green-800 transition"
                >
                  🚀 Start Route
                </button>
              )}
            </div>

            {/* Map */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-700">
                    {isRouteStarted ? 'Route in Progress' : `Click map to add ${selectedType}`}
                  </span>
                  {isRouteStarted && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      <Navigation className="w-3 h-3" />
                      Navigation Active
                    </span>
                  )}
                </div>
                {!showReportModal && (
                  <SimpleErrorBoundary>
                    <RouteMap
                      points={points}
                      routeCoordinates={routeData?.features[0]?.geometry.coordinates}
                      onMapClick={!isRouteStarted ? handleMapClick : emptyHandler}
                      selectedPointType={selectedType}
                    />
                  </SimpleErrorBoundary>
                )}
              </div>
            </div>
          </div>

          {/* Route Instructions */}
          <div className="mt-6">
            <RouteInstructions routeData={routeData} isLoading={isLoading} />
          </div>
        </div>
      </div>

      {/* Report Problem Modal */}
      {showReportModal && (
        <ReportProblemModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          shipmentId={shipmentData.shipmentId}
          trackingNumber={shipmentData.trackingNumber}
          currentLocation={points.length > 0 ? { lat: points[0].latitude, lng: points[0].longitude } : undefined}
        />
      )}
    </>
  );
};

export default RouteOptimizerPage;