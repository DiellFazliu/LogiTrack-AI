export interface Coordinate {
  longitude: number;
  latitude: number;
}

export interface RouteStep {
  distance: number;
  duration: number;
  instruction: string;
  name: string;
  way_points: number[];
}

export interface RouteSegment {
  distance: number;
  duration: number;
  steps: RouteStep[];
}

export interface RouteFeature {
  type: string;
  properties: {
    segments: RouteSegment[];
    summary: {
      distance: number;
      duration: number;
    };
  };
  geometry: {
    type: string;
    coordinates: [number, number][];
  };
}

export interface RouteResponse {
  type: string;
  features: RouteFeature[];
  metadata: {
    attribution: string;
    timestamp: number;
  };
}

export interface Point {
  id: string;
  coordinates: Coordinate;
  type: 'pickup' | 'delivery' | 'warehouse';
  address: string;
}