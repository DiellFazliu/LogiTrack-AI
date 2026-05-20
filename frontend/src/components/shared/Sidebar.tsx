import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, Truck, Users, MapPin, FileText, Settings, History, Route } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role;

  const getMenuItems = () => {
    if (role === 'customer') {
      return [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/shipments/create', icon: Package, label: 'Create Shipment' },
        { path: '/track', icon: MapPin, label: 'Track Shipment' },
        { path: '/shipments/history', icon: History, label: 'History' },
      ];
    }
    if (role === 'driver') {
      return [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/driver/shipments', icon: Package, label: 'My Shipments' },
        { path: '/driver/update-location', icon: MapPin, label: 'Update Location' },
        { path: '/driver/route-optimizer', icon: Route, label: 'Route Optimizer' },  // ✅ Shto këtë!
      ];
    }
    if (role === 'dispatcher') {
      return [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/dispatcher/shipments', icon: Package, label: 'Shipments' },
        { path: '/dispatcher/assign-driver', icon: Truck, label: 'Assign Driver' },
      ];
    }
    if (role === 'company_admin') {
      return [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/company/users', icon: Users, label: 'Users' },
        { path: '/company/drivers', icon: Truck, label: 'Drivers' },
        { path: '/company/vehicles', icon: Truck, label: 'Vehicles' },
        { path: '/company/warehouses', icon: MapPin, label: 'Warehouses' },
        { path: '/company/reports', icon: FileText, label: 'Reports' },
        { path: '/company/settings', icon: Settings, label: 'Settings' },
      ];
    }
    return [];
  };

  const menuItems = getMenuItems();
  
  if (menuItems.length === 0) return null;

  return (
    <aside className="w-64 bg-white shadow-md min-h-screen">
      <nav className="mt-8">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition ${
                isActive ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' : ''
              }`
            }
          >
            <item.icon className="w-5 h-5 mr-3" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;