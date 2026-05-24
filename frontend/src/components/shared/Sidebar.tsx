// frontend/src/components/shared/Sidebar.tsx
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Package, Truck, Users, MapPin, FileText, 
  Settings, History, Route, Warehouse, Box, Building2,
  Target, CheckCircle, UserPlus, DollarSign, CreditCard, 
  Navigation, Eye, User, LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const role = user?.role;

  // Helper to check if a path is active
  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const getMenuItems = () => {
    if (role === 'customer') {
      return [
        { path: '/customer/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/customer/create-shipment', icon: Package, label: 'Create Shipment' },
        { path: '/customer/track', icon: MapPin, label: 'Track Shipment' },
        { path: '/customer/history', icon: History, label: 'History' },
        { path: '/customer/profile', icon: User, label: 'Profile' },
      ];
    }
    
    if (role === 'driver') {
      return [
        { path: '/driver/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/driver/shipments', icon: Package, label: 'My Shipments' },
        { path: '/driver/update-location', icon: MapPin, label: 'Update Location' },
        { path: '/driver/route-optimizer', icon: Route, label: 'Route Optimizer' },
        { path: '/driver/daily-report', icon: FileText, label: 'Daily Report' },

      ];
    }
    
    if (role === 'dispatcher') {
      return [
        { path: '/dispatcher/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/dispatcher/shipments', icon: Package, label: 'Shipments' },
        { path: '/dispatcher/create-shipment', icon: Target, label: 'Create Shipment' },
        { path: '/dispatcher/assign-driver', icon: Truck, label: 'Assign Driver' },
        { path: '/dispatcher/driver-locations', icon: Navigation, label: 'Driver Locations' },
        { path: '/dispatcher/reports', icon: FileText, label: 'Reports' },
      ];
    }
    
    if (role === 'company_admin') {
      return [
        { path: '/company/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/company/shipments', icon: Package, label: 'Shipments' },
        { path: '/company/users', icon: Users, label: 'Users' },
        { path: '/company/drivers', icon: Truck, label: 'Drivers' },
        { path: '/company/vehicles', icon: Truck, label: 'Vehicles' },
        { path: '/company/warehouses', icon: Warehouse, label: 'Warehouses' },
        { path: '/company/products', icon: Box, label: 'Products' },
        { path: '/company/reports', icon: FileText, label: 'Reports' },
        { path: '/company/settings', icon: Settings, label: 'Settings' },
        { path: '/company/profile', icon: User, label: 'Profile' },
      ];
    }
    
    if (role === 'super_admin') {
      return [
        { path: '/super-admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/super-admin/organizations', icon: Building2, label: 'Organizations' },
        { path: '/super-admin/users', icon: Users, label: 'All Users' },
        { path: '/super-admin/plans', icon: CreditCard, label: 'Plans & Pricing' },
        { path: '/super-admin/settings', icon: Settings, label: 'System Settings' },
        { path: '/super-admin/profile', icon: User, label: 'Profile' },
      ];
    }
    
    // Default items for unknown roles
    return [
      { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/profile', icon: User, label: 'Profile' },
    ];
  };

  const menuItems = getMenuItems();
  
  if (menuItems.length === 0) return null;

  return (
    <aside className="w-64 bg-white shadow-lg h-full flex flex-col">
      {/* Logo Section */}
      <div className="p-5 border-b bg-gradient-to-r from-blue-50 to-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">L</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800">LogiTrack</h1>
            <p className="text-xs text-gray-500 capitalize">{role?.replace('_', ' ') || 'Portal'}</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <div className="px-3 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard' || item.path.includes('/profile')}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700 shadow-sm' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <item.icon className={`w-5 h-5 ${isActive(item.path) ? 'text-blue-600' : 'text-gray-400'}`} />
              <span>{item.label}</span>
              {isActive(item.path) && (
                <div className="ml-auto w-1 h-6 bg-blue-600 rounded-full"></div>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Footer Section */}
      <div className="p-4 border-t mt-auto">
        <div className="bg-gray-50 rounded-lg p-3 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-3 h-3 text-green-600" />
            </div>
            <span className="text-xs text-gray-500">System Status</span>
          </div>
          <p className="text-xs text-gray-600">All systems operational</p>
          <p className="text-xs text-gray-400 mt-1">v2.0.0</p>
        </div>
        
        {/* Logout Button */}
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;