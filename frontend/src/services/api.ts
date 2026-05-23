import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - trajton gabimet globale
api.interceptors.response.use(
  (response) => {
    // Return response direkt për sukses
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Nëse gabimi është 401 (Unauthorized) dhe nuk është provuar refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Provon të rifreskoj token-in
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post('http://localhost:5000/auth/refresh', {
            refreshToken,
          });
          
          const { token } = response.data;
          localStorage.setItem('token', token);
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          originalRequest.headers.Authorization = `Bearer ${token}`;
          
          // Riperdoret request-i origjinal
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh token ka dështuar - logout user
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        // Nëse nuk jemi tashmë në login page, ridrejto
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
          toast.error('Session expired. Please login again.');
        }
      }
    }
    
    // Për gabime të tjera, shfaq mesazh (por jo për 401 që kemi trajtuar)
    if (error.response?.status !== 401 && error.response?.data?.message) {
      toast.error(error.response.data.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;