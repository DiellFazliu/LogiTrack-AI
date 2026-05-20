import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Users, Package, TrendingUp, Shield, Settings, FileText, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

interface DashboardStats {
  totalOrganizations: number;
  totalUsers: number;
  totalShipments: number;
  activeSubscriptions: number;
}

export const SuperAdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrganizations: 0,
    totalUsers: 0,
    totalShipments: 0,
    activeSubscriptions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/super-admin/stats', {
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
    { title: 'Organizations', value: stats.totalOrganizations, icon: Building2, color: 'bg-blue-500', path: '/organizations' },
    { title: 'Total Users', value: stats.totalUsers, icon: Users, color: 'bg-green-500', path: '/users' },
    { title: 'Shipments', value: stats.totalShipments, icon: Package, color: 'bg-purple-500', path: '/shipments' },
    { title: 'Active Subs', value: stats.activeSubscriptions, icon: TrendingUp, color: 'bg-yellow-500', path: '/subscriptions' },
  ];

  if (loading) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold text-gray-800">Super Admin Dashboard</h1>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
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

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" /> System Management
            </h2>
            <div className="space-y-2">
              <Link to="/create-super-admin" className="block p-2 hover:bg-gray-50 rounded">
                + Create New Super Admin
              </Link>
              <Link to="/settings" className="block p-2 hover:bg-gray-50 rounded">
                ⚙️ System Settings
              </Link>
              <Link to="/audit-logs" className="block p-2 hover:bg-gray-50 rounded">
                📋 View Audit Logs
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5" /> Recent Activity
            </h2>
            <div className="space-y-3">
              <p className="text-gray-500 text-sm">No recent activity</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SuperAdminDashboard;