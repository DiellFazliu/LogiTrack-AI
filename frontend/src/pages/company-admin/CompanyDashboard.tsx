import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Truck, Package, FileText, TrendingUp, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

interface CompanyStats {
  totalUsers: number;
  totalDrivers: number;
  totalVehicles: number;
  totalShipments: number;
  completedShipments: number;
  pendingShipments: number;
}

export const CompanyDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<CompanyStats>({
    totalUsers: 0,
    totalDrivers: 0,
    totalVehicles: 0,
    totalShipments: 0,
    completedShipments: 0,
    pendingShipments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Përdor endpoint-in e organizatës për statistika
      const orgId = user?.organizationId;
      const response = await api.get(`/organizations/${orgId}/stats`);
      const data = response.data;
      
      setStats({
        totalUsers: data.totalUsers || 0,
        totalDrivers: data.totalDrivers || 0,
        totalVehicles: data.totalVehicles || 0,
        totalShipments: data.totalShipments || 0,
        completedShipments: data.completedShipments || 0,
        pendingShipments: data.pendingShipments || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    { title: 'Users', value: stats.totalUsers, icon: Users, color: 'bg-blue-500', path: '/company/users' },
    { title: 'Drivers', value: stats.totalDrivers, icon: Truck, color: 'bg-green-500', path: '/company/drivers' },
    { title: 'Vehicles', value: stats.totalVehicles, icon: MapPin, color: 'bg-purple-500', path: '/company/vehicles' },
    { title: 'Shipments', value: stats.totalShipments, icon: Package, color: 'bg-yellow-500', path: '/company/shipments' },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Company Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back, {user?.name}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card) => (
          <Link key={card.title} to={card.path}>
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">{card.title}</p>
                  <p className="text-2xl font-bold mt-2">{card.value}</p>
                </div>
                <div className={`${card.color} p-3 rounded-full`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" /> Shipment Overview
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Completed Shipments</span>
              <span className="font-bold text-green-600">{stats.completedShipments}</span>
            </div>
            <div className="flex justify-between">
              <span>Pending Shipments</span>
              <span className="font-bold text-yellow-600">{stats.pendingShipments}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" /> Quick Actions
          </h2>
          <div className="space-y-2">
            <Link to="/company/users/create" className="block p-2 hover:bg-gray-50 rounded">
              + Create New User
            </Link>
            <Link to="/company/drivers/create" className="block p-2 hover:bg-gray-50 rounded">
              + Add New Driver
            </Link>
            <Link to="/company/shipments/create" className="block p-2 hover:bg-gray-50 rounded">
              + Create Shipment
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDashboard;