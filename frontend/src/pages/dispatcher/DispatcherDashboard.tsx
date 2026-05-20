import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Truck, MapPin, Clock, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface DashboardStats {
  totalShipments: number;
  inTransit: number;
  delivered: number;
  pending: number;
  availableDrivers: number;
  availableVehicles: number;
}

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
      // Përdor endpoint-et ekzistuese
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
    { title: 'Total Shipments', value: stats.totalShipments, icon: Package, color: 'bg-blue-500', path: '/dispatcher/shipments' },
    { title: 'In Transit', value: stats.inTransit, icon: Truck, color: 'bg-purple-500', path: '/dispatcher/shipments?status=in_transit' },
    { title: 'Delivered', value: stats.delivered, icon: CheckCircle, color: 'bg-green-500', path: '/dispatcher/shipments?status=delivered' },
    { title: 'Pending', value: stats.pending, icon: Clock, color: 'bg-yellow-500', path: '/dispatcher/shipments?status=pending' },
    { title: 'Available Drivers', value: stats.availableDrivers, icon: MapPin, color: 'bg-indigo-500', path: '/dispatcher/drivers' },
    { title: 'Available Vehicles', value: stats.availableVehicles, icon: Truck, color: 'bg-teal-500', path: '/dispatcher/vehicles' },
  ];

  if (loading) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold text-gray-800">Dispatcher Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user?.name}</p>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {cards.map((card) => (
            <Link key={card.title} to={card.path}>
              <div className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-xs">{card.title}</p>
                    <p className="text-xl font-bold mt-1">{card.value}</p>
                  </div>
                  <div className={`${card.color} p-2 rounded-full`}>
                    <card.icon className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5" /> Quick Actions
            </h2>
            <div className="space-y-2">
              <Link to="/dispatcher/create-shipment" className="block p-2 hover:bg-gray-50 rounded">
                📦 Create New Shipment
              </Link>
              <Link to="/dispatcher/shipments" className="block p-2 hover:bg-gray-50 rounded">
                📋 View All Shipments
              </Link>
              <Link to="/dispatcher/drivers" className="block p-2 hover:bg-gray-50 rounded">
                👨‍✈️ Manage Drivers
              </Link>
              <Link to="/dispatcher/vehicles" className="block p-2 hover:bg-gray-50 rounded">
                🚚 Manage Vehicles
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> Tips
            </h2>
            <div className="space-y-2 text-gray-600">
              <p>✓ Use the AI route optimizer for better efficiency</p>
              <p>✓ Always assign available drivers first</p>
              <p>✓ Track shipments in real-time</p>
              <p>✓ Update shipment status as they progress</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default DispatcherDashboard;