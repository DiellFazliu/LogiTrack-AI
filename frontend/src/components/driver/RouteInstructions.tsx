// frontend/src/components/driver/RouteInstructions.tsx
import React from 'react';
import type { RouteResponse } from '../../types/route.types';
import routeService from '../../services/route.service';

interface RouteInstructionsProps {
  routeData: RouteResponse | null;
  isLoading: boolean;
}

export const RouteInstructions: React.FC<RouteInstructionsProps> = ({ routeData, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">Optimizing route...</span>
        </div>
      </div>
    );
  }

  if (!routeData) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500 text-center">
          Click on the map to add pickup and delivery points
        </p>
      </div>
    );
  }

  const feature = routeData.features[0];
  const segment = feature.properties.segments[0];
  const summary = feature.properties.summary;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Route Summary</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-6 pb-4 border-b">
        <div className="text-center">
          <p className="text-gray-500 text-sm">Total Distance</p>
          <p className="text-xl font-bold text-blue-600">
            {routeService.formatDistance(summary.distance)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-gray-500 text-sm">Estimated Time</p>
          <p className="text-xl font-bold text-green-600">
            {routeService.formatDuration(summary.duration)}
          </p>
        </div>
      </div>
      
      <h3 className="font-semibold mb-3">Turn-by-Turn Directions</h3>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {segment.steps.map((step, index) => (
          <div key={index} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">
              {index + 1}
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-800">{step.instruction}</p>
              {step.name && step.name !== '-' && (
                <p className="text-xs text-gray-500">on {step.name}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">{routeService.formatDistance(step.distance)}</p>
              <p className="text-xs text-gray-400">{routeService.formatDuration(step.duration)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};