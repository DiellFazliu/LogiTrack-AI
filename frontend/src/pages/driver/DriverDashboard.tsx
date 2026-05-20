import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Truck, MapPin, CheckCircle, Clock, User, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

interface ShipmentStats {
  total: number;
  inProgress: number;
  completed: number;
  pending: number;
}

export const DriverDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<ShipmentStats>({
    total: 0,
    inProgress: 0,
    completed: 0,
    pending: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/driver/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    { title: 'My Shipments', value: stats.total, icon: Truck, color: 'bg-blue-500', path: '/driver/shipments' },
    { title: 'In Progress', value: stats.inProgress, icon: Clock, color: 'bg-yellow-500', path: '/driver/shipments' },
    { title: 'Completed', value: stats.completed, icon: CheckCircle, color: 'bg-green-500', path: '/driver/shipments' },
    { title: 'Pending', value: stats.pending, icon: AlertCircle, color: 'bg-red-500', path: '/driver/shipments' },
  ];

  if (loading) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold text-gray-800">Driver Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user?.name}</p>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
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
              <MapPin className="w-5 h-5" /> Quick Actions
            </h2>
            <div className="space-y-2">
              <Link to="/driver/update-location" className="block p-2 hover:bg-gray-50 rounded">
                📍 Update Current Location
              </Link>
              <Link to="/driver/shipments" className="block p-2 hover:bg-gray-50 rounded">
                📦 View My Shipments
              </Link>
              <Link to="/driver/profile" className="block p-2 hover:bg-gray-50 rounded">
                👤 Update Profile
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5" /> Today's Schedule
            </h2>
            <p className="text-gray-500">No shipments scheduled for today</p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default DriverDashboard;