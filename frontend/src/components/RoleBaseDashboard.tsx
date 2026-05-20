import React from 'react';
import { useAuth } from '../context/AuthContext';
import { SuperAdminDashboard } from '../pages/super_admin/SuperAdminDashboard';
import { CompanyDashboard } from '../pages/company-admin/CompanyDashboard';
import { DispatcherDashboard } from '../pages/dispatcher/DispatcherDashboard';
import { DriverDashboard } from '../pages/driver/DriverDashboard';
import { CustomerDashboard } from '../pages/costumer/CostumerDashboard';

export const RoleBasedDashboard: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Debug: shiko rolin në console
  console.log('🎯 RoleBasedDashboard - User role:', user.role);

  switch (user.role) {
    case 'super_admin':
      console.log('✅ Showing Super Admin Dashboard');
      return <SuperAdminDashboard />;
    case 'company_admin':
      console.log('✅ Showing Company Admin Dashboard');
      return <CompanyDashboard />;
    case 'dispatcher':
      console.log('✅ Showing Dispatcher Dashboard');
      return <DispatcherDashboard />;
    case 'driver':
      console.log('✅ Showing Driver Dashboard');
      return <DriverDashboard />;
    case 'customer':
      console.log('✅ Showing Customer Dashboard');
      return <CustomerDashboard />;
    default:
      console.warn('⚠️ Unknown role:', user.role);
      return <CustomerDashboard />;
  }
};
export default RoleBasedDashboard;