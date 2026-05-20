import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, MapPin, Clock, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

interface Shipment {
  id: string;
  tracking_number: string;
  pickup_address: string;
  delivery_address: string;
  status: string;
  priority: string;
  estimated_delivery: string;
}

export const MyShipments: React.FC = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/driver/shipments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setShipments(data);
      } else {
        toast.error('Failed to fetch shipments');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to fetch shipments');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      picked_up: 'bg-blue-100 text-blue-800',
      in_transit: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === 'urgent') return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (priority === 'high') return <AlertCircle className="w-4 h-4 text-orange-500" />;
    return <Package className="w-4 h-4 text-gray-500" />;
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold text-gray-800">My Shipments</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-4">
          {shipments.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No shipments assigned yet</p>
            </div>
          ) : (
            shipments.map((shipment) => (
              <Link key={shipment.id} to={`/driver/shipments/${shipment.id}`}>
                <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {getPriorityIcon(shipment.priority)}
                        <h3 className="text-lg font-semibold">#{shipment.tracking_number}</h3>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(shipment.status)}`}>
                        {shipment.status.replace('_', ' ')}
                      </span>
                    </div>
                    {shipment.estimated_delivery && (
                      <div className="text-right">
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Estimated
                        </div>
                        <div className="text-sm font-medium">
                          {new Date(shipment.estimated_delivery).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-green-600 mt-1" />
                      <div>
                        <div className="text-xs text-gray-500">Pickup</div>
                        <div className="text-sm">{shipment.pickup_address}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-red-600 mt-1" />
                      <div>
                        <div className="text-xs text-gray-500">Delivery</div>
                        <div className="text-sm">{shipment.delivery_address}</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
                      <Eye className="w-4 h-4" /> View Details
                    </button>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
export default MyShipments;