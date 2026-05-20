// frontend/src/services/route.service.ts
import api from './api';
import type { Coordinate, RouteResponse} from '../types/route.types';

class RouteService {
  async optimizeRoute(points: Coordinate[]): Promise<RouteResponse> {
    const response = await api.post('/routes/optimize', { points });
    return response.data;
  }

  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(2)} km`;
  }

  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.round(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    if (minutes > 0) {
      return `${minutes}min ${secs}s`;
    }
    return `${secs}s`;
  }
}

export default new RouteService();