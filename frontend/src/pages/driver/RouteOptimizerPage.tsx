// frontend/src/pages/driver/RouteOptimizerPage.tsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { RouteMap } from '../../components/driver/RouteMap';
import { RouteInstructions } from '../../components/driver/RouteInstructions';
import routeService from '../../services/route.service';
import type { Coordinate, RouteResponse, Point } from '../../types/route.types';
import toast from 'react-hot-toast';

export const RouteOptimizerPage: React.FC = () => {
  const { user } = useAuth();
  const [points, setPoints] = useState<Coordinate[]>([]);
  const [routeData, setRouteData] = useState<RouteResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<'pickup' | 'delivery' | 'warehouse'>('pickup');
  const [pointLabels, setPointLabels] = useState<string[]>([]);

  const handleMapClick = (lat: number, lng: number) => {
    const newPoint: Coordinate = { latitude: lat, longitude: lng };
    setPoints([...points, newPoint]);
    setPointLabels([...pointLabels, selectedType]);
    
    // Reset route when points change
    setRouteData(null);
    
    toast.success(`${selectedType} point added at ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
  };

  const handleOptimizeRoute = async () => {
    if (points.length < 2) {
      toast.error('Please add at least 2 points (start and destination)');
      return;
    }

    setIsLoading(true);
    try {
      const data = await routeService.optimizeRoute(points);
      setRouteData(data);
      toast.success('Route optimized successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to optimize route');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearPoints = () => {
    setPoints([]);
    setPointLabels([]);
    setRouteData(null);
    toast.success('All points cleared');
  };

  const handleRemoveLastPoint = () => {
    setPoints(points.slice(0, -1));
    setPointLabels(pointLabels.slice(0, -1));
    setRouteData(null);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-600">Route Optimizer</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Welcome, {user?.name}</span>
            <span className="text-sm bg-green-100 text-green-600 px-2 py-1 rounded">Driver</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Controls */}
          <div className="lg:col-span-1 space-y-4">
            {/* Point Type Selector */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold mb-3">Add Points</h3>
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setSelectedType('pickup')}
                  className={`flex-1 py-2 px-3 rounded-lg transition ${
                    selectedType === 'pickup'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  🟢 Pickup
                </button>
                <button
                  onClick={() => setSelectedType('delivery')}
                  className={`flex-1 py-2 px-3 rounded-lg transition ${
                    selectedType === 'delivery'
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  🔴 Delivery
                </button>
                <button
                  onClick={() => setSelectedType('warehouse')}
                  className={`flex-1 py-2 px-3 rounded-lg transition ${
                    selectedType === 'warehouse'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  🔵 Warehouse
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Click on the map to add points. Add at least 2 points to optimize route.
              </p>
            </div>

            {/* Points List */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold mb-3">Selected Points ({points.length})</h3>
              {points.length === 0 ? (
                <p className="text-gray-500 text-sm">No points added yet</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {points.map((point, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <span className={`text-lg ${
                          pointLabels[index] === 'pickup' ? 'text-green-600' :
                          pointLabels[index] === 'delivery' ? 'text-red-600' : 'text-blue-600'
                        }`}>
                          {pointLabels[index] === 'pickup' ? '🟢' : pointLabels[index] === 'delivery' ? '🔴' : '🔵'}
                        </span>
                        <span className="text-sm">
                          {point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 capitalize">{pointLabels[index]}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleOptimizeRoute}
                disabled={points.length < 2 || isLoading}
                className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Optimizing...' : '🗺️ Optimize Route'}
              </button>
              <button
                onClick={handleRemoveLastPoint}
                disabled={points.length === 0}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition disabled:opacity-50"
              >
                ↶ Undo
              </button>
              <button
                onClick={handleClearPoints}
                disabled={points.length === 0}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50"
              >
                ✕ Clear
              </button>
            </div>
          </div>

          {/* Center Panel - Map */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-3 border-b bg-gray-50">
                <span className="text-sm font-medium text-gray-600">
                  Click on map to add {selectedType} point
                </span>
              </div>
              <RouteMap
                points={points}
                routeCoordinates={routeData?.features[0]?.geometry.coordinates}
                onMapClick={handleMapClick}
                selectedPointType={selectedType}
              />
            </div>
          </div>
        </div>

        {/* Bottom Panel - Route Instructions */}
        <div className="mt-6">
          <RouteInstructions routeData={routeData} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
};