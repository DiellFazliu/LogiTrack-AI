// src/context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId: string | null;
  organizationName?: string;
  phone?: string;
  isActive?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  updateUser: (updatedData: Partial<User>) => Promise<void>;
  hasRole: (roles: string[]) => boolean;
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
  isCompanyAdmin: () => boolean;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (storedToken && storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      setToken(storedToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token: newToken, user: userData } = response.data;
      
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setToken(newToken);
      setUser(userData);
      
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      console.log('Login successful. User role:', userData.role);
      toast.success(`Welcome back, ${userData.name}!`);
      
      return userData;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      throw error;
    }
  };

  // ✅ Përdor PATCH /auth/me në vend të /users/me
  const updateUser = async (updatedData: Partial<User>) => {
    if (!user) {
      throw new Error('No user logged in');
    }

    try {
      const response = await api.patch('/auth/me', {
        name: updatedData.name,
        phone: updatedData.phone,
        organizationId: updatedData.organizationId,
      });
      
      const updatedUserFromBackend = response.data;
      
      const newUserData = { ...user, ...updatedUserFromBackend };
      setUser(newUserData);
      localStorage.setItem('user', JSON.stringify(newUserData));
      
      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('Failed to update user:', error);
      const message = error.response?.data?.message || 'Failed to update user';
      toast.error(message);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully');
  };

  const hasRole = (roles: string[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const isAdmin = () => {
    return ['super_admin', 'company_admin'].includes(user?.role || '');
  };

  const isSuperAdmin = () => {
    return user?.role === 'super_admin';
  };

  const isCompanyAdmin = () => {
    return user?.role === 'company_admin';
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      logout,
      updateUser,
      hasRole, 
      isAdmin,
      isSuperAdmin,
      isCompanyAdmin,
      token 
    }}>
      {children}
    </AuthContext.Provider>
  );
};