// frontend/src/pages/dispatcher/DispatcherDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Truck, MapPin, Clock, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

interface DashboardStats {
  totalShipments: number;
  inTransit: number;
  delivered: number;
  pending: number;
  availableDrivers: number;
  availableVehicles: number;
}

// StatCard component for consistent styling
const StatCard = ({ title, value, icon: Icon, bgColor, path }: any) => (
  <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
    <Link to={path}>
      <div className={`${bgColor} rounded-xl shadow-md p-4 border border-black/10 hover:shadow-lg transition`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">{title}</p>
            <p className="text-2xl font-extrabold text-white mt-1">{value}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center">
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
    </Link>
  </motion.div>
);

export const DispatcherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalShipments: 0,
    inTransit: 0,
    delivered: 0,
    pending: 0,
    availableDrivers: 0,
    availableVehicles: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [shipmentsRes, driversRes, vehiclesRes] = await Promise.all([
        api.get('/shipments'),
        api.get('/drivers/available'),
        api.get('/vehicles/available')
      ]);
      
      const shipments = shipmentsRes.data.items || shipmentsRes.data || [];
      
      setStats({
        totalShipments: shipments.length,
        inTransit: shipments.filter((s: any) => s.status === 'in_transit').length,
        delivered: shipments.filter((s: any) => s.status === 'delivered').length,
        pending: shipments.filter((s: any) => s.status === 'pending').length,
        availableDrivers: driversRes.data.length || 0,
        availableVehicles: vehiclesRes.data.length || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    { title: 'Total Shipments', value: stats.totalShipments, icon: Package, bgColor: 'bg-blue-800', path: '/dispatcher/shipments' },
    { title: 'In Transit', value: stats.inTransit, icon: Truck, bgColor: 'bg-purple-800', path: '/dispatcher/shipments?status=in_transit' },
    { title: 'Delivered', value: stats.delivered, icon: CheckCircle, bgColor: 'bg-green-800', path: '/dispatcher/shipments?status=delivered' },
    { title: 'Pending', value: stats.pending, icon: Clock, bgColor: 'bg-yellow-800', path: '/dispatcher/shipments?status=pending' },
    { title: 'Available Drivers', value: stats.availableDrivers, icon: MapPin, bgColor: 'bg-indigo-800', path: '/dispatcher/drivers' },
    { title: 'Available Vehicles', value: stats.availableVehicles, icon: Truck, bgColor: 'bg-teal-800', path: '/dispatcher/vehicles' },
  ];

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-blue-700 rounded-full" />
                <h1 className="text-2xl font-extrabold text-gray-900">Dispatcher Dashboard</h1>
              </div>
              <p className="text-sm text-gray-600 pl-3 mt-0.5">Welcome back, {user?.name}</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {cards.map((card) => (
            <StatCard key={card.title} {...card} />
          ))}
        </div>

        {/* Quick Actions & Tips */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-700" />
              Quick Actions
            </h2>
            <div className="space-y-2">
              <Link to="/dispatcher/create-shipment" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition group">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200">
                  <Package className="w-4 h-4 text-blue-700" />
                </div>
                <span className="text-gray-800 font-medium">Create New Shipment</span>
              </Link>
              <Link to="/dispatcher/shipments" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition group">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center group-hover:bg-purple-200">
                  <Truck className="w-4 h-4 text-purple-700" />
                </div>
                <span className="text-gray-800 font-medium">View All Shipments</span>
              </Link>
              <Link to="/dispatcher/drivers" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition group">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-200">
                  <MapPin className="w-4 h-4 text-indigo-700" />
                </div>
                <span className="text-gray-800 font-medium">Manage Drivers</span>
              </Link>
              <Link to="/dispatcher/vehicles" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition group">
                <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center group-hover:bg-teal-200">
                  <Truck className="w-4 h-4 text-teal-700" />
                </div>
                <span className="text-gray-800 font-medium">Manage Vehicles</span>
              </Link>
            </div>
          </div>

          {/* Tips - High contrast version */}
          <div className="bg-blue-900 rounded-xl shadow-md p-5 border border-blue-700">
            <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-200" />
              Tips for Efficiency
            </h2>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-white">
                <span className="text-blue-300 font-bold">✓</span>
                <span>Use the AI route optimizer for better efficiency</span>
              </li>
              <li className="flex items-start gap-2 text-white">
                <span className="text-blue-300 font-bold">✓</span>
                <span>Always assign available drivers first</span>
              </li>
              <li className="flex items-start gap-2 text-white">
                <span className="text-blue-300 font-bold">✓</span>
                <span>Track shipments in real-time</span>
              </li>
              <li className="flex items-start gap-2 text-white">
                <span className="text-blue-300 font-bold">✓</span>
                <span>Update shipment status as they progress</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DispatcherDashboard;