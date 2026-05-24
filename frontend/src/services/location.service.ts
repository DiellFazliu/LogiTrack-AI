// frontend/src/services/location.service.ts
import api from './api';

export interface Location {
  id: string;
  latitude: number;
  longitude: number;
  address?: string;
  createdAt: string;
}

export const locationService = {
  // Merr lokacionin aktual të driver-it
// frontend/src/services/location.service.ts
async getCurrentLocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(resolve, async (error) => {
      // Fallback: Përdor IP-based location
      if (error.code === 2 || error.code === 3) {
        try {
          const response = await fetch('https://ipapi.co/json/');
          const data = await response.json();
          const fakePosition = {
            coords: {
              latitude: data.latitude,
              longitude: data.longitude,
              accuracy: 1000
            }
          } as GeolocationPosition;
          resolve(fakePosition);
        } catch {
          reject(error);
        }
      } else {
        reject(error);
      }
    }, { enableHighAccuracy: false, timeout: 10000 });
  });
},

  // Merr lokacionin e fundit të ruajtur në backend
  async getLastSavedLocation(): Promise<Location | null> {
    try {
      const response = await api.get('/drivers/location/last');
      // Nëse kthen { message: 'No location updates yet' }, kthe null
      if (response.data && response.data.message) {
        return null;
      }
      return response.data;
    } catch (error) {
      console.error('Failed to get last location:', error);
      return null;
    }
  },

  // Ruaj lokacionin aktual
  async saveLocation(latitude: number, longitude: number, address?: string): Promise<Location> {
    const response = await api.post('/drivers/location', { latitude, longitude, address });
    return response.data;
  },

  // Merr historikun e lokacioneve
  async getLocationHistory(limit: number = 50): Promise<Location[]> {
    const response = await api.get('/drivers/location/history', { params: { limit } });
    return response.data.items || response.data;
  },
};