import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SuperAdminDashboard } from './super-admin/SuperAdminDashboard';
import { CompanyDashboard } from './company-admin/CompanyDashboard';
import { DispatcherDashboard } from './dispatcher/DispatcherDashboard';
import { DriverDashboard } from './driver/DriverDashboard';
import { CustomerDashboard } from './customer/CustomerDashboard';

export const DashboardPage: React.FC = () => {
  const { user, loading: isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const renderDashboard = () => {
    switch (user.role) {
      case 'super_admin':
        return <SuperAdminDashboard />;
      case 'company_admin':
        return <CompanyDashboard />;
      case 'dispatcher':
       return <DispatcherDashboard />;
      case 'driver':
        return <DriverDashboard />;
      case 'customer':
        return <CustomerDashboard />;
      default:
        return <Navigate to="/login" replace />;
    }
  };

  return renderDashboard();
};
export default DashboardPage;