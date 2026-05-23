// frontend/src/components/driver/RouteMap.tsx
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Coordinate } from '../../types/route.types';

// Fix për ikonat e Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface RouteMapProps {
  points: Coordinate[];
  routeCoordinates?: [number, number][];
  onMapClick: (lat: number, lng: number) => void;
  selectedPointType: 'pickup' | 'delivery' | 'warehouse';
}

// Komponent për të përshtatur hartën
function FitBounds({ points, routeCoordinates }: { points: Coordinate[]; routeCoordinates?: [number, number][] }) {
  const map = useMap();
  
  useEffect(() => {
    const allPoints: [number, number][] = [];
    
    points.forEach(p => allPoints.push([p.latitude, p.longitude]));
    
    if (routeCoordinates && routeCoordinates.length > 0) {
      routeCoordinates.forEach(coord => allPoints.push([coord[1], coord[0]]));
    }
    
    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [points, routeCoordinates, map]);
  
  return null;
}

export const RouteMap: React.FC<RouteMapProps> = ({
  points,
  routeCoordinates,
  onMapClick,
  selectedPointType,
}) => {
  const getMarkerColor = (type: string) => {
    switch (type) {
      case 'pickup': return '🟢';
      case 'delivery': return '🔴';
      case 'warehouse': return '🔵';
      default: return '📍';
    }
  };

  return (
    <MapContainer
      center={[52.52, 13.405]}
      zoom={13}
      style={{ height: '500px', width: '100%', borderRadius: '8px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Kliko në hartë për të shtuar pikë */}
      <MapContainerEvents onMapClick={onMapClick} selectedPointType={selectedPointType} />
      
      {/* Pikat e zgjedhura */}
      {points.map((point, index) => (
        <Marker
          key={index}
          position={[point.latitude, point.longitude]}
          eventHandlers={{
            click: () => {
              // Optional: remove point on click
            }
          }}
        />
      ))}
      
      {/* Rruga e optimizuar */}
      {routeCoordinates && routeCoordinates.length > 0 && (
        <Polyline
          positions={routeCoordinates.map(coord => [coord[1], coord[0]])}
          color="#3b82f6"
          weight={4}
          opacity={0.8}
        />
      )}
      
      <FitBounds points={points} routeCoordinates={routeCoordinates} />
    </MapContainer>
  );
};

// Komponent për eventet e klikimit
function MapContainerEvents({ onMapClick, selectedPointType }: any) {
  const map = useMap();
  
  useEffect(() => {
    const handleClick = (e: L.LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    };
    
    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [map, onMapClick]);
  
  return null;
}