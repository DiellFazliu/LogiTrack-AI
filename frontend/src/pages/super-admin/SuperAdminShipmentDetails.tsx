import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, MapPin, Calendar, User, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export const SuperAdminShipmentDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [shipment, setShipment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchShipment();
  }, [id]);

  const fetchShipment = async () => {
    try {
      const response = await api.get(`/shipments/${id}`);
      setShipment(response.data);
    } catch (error: any) {
      toast.error('Failed to load shipment details');
      navigate('/super-admin/shipments');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!shipment) return <div className="p-8 text-center">Shipment not found</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <button onClick={() => navigate('/super-admin/shipments')} className="flex items-center gap-2 text-blue-600 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Shipments
      </button>
      <div className="bg-white rounded-lg shadow p-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Shipment Details</h1>
        <div className="space-y-3">
          <p><strong>Tracking Number:</strong> {shipment.trackingNumber}</p>
          <p><strong>Status:</strong> {shipment.status}</p>
          <p><strong>Pickup:</strong> {shipment.pickupAddress}</p>
          <p><strong>Delivery:</strong> {shipment.deliveryAddress}</p>
          <p><strong>Created:</strong> {new Date(shipment.createdAt).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};