// frontend/src/pages/driver/ShipmentDetails.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Package, MapPin, Calendar, User, Truck, 
  Clock, CheckCircle, AlertCircle, 
  Truck as TruckIcon, ArrowLeft, RefreshCw, Phone, Mail,
  Navigation, PhoneCall, MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface Shipment {
  id: string;
  tracking_number: string;
  status: string;
  pickup_address: string;
  delivery_address: string;
  weight_kg: number;
  volume_m3: number;
  priority: string;
  is_express: boolean;
  notes: string;
  estimated_delivery: string;
  actual_delivery: string;
  created_at: string;
  picked_up_at?: string | null;
  delivered_at?: string | null;
  cancelled_at?: string | null;
  customer?: { id: string; name: string; email: string; phone: string };
  vehicle?: { id: string; license_plate: string; type: string; brand: string; model: string };
}

interface StatusHistory {
  id: string;
  status: string;
  location: string;
  notes: string;
  created_at: string;
}

export const DriverShipmentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [history, setHistory] = useState<StatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [showDirections, setShowDirections] = useState(false);

  useEffect(() => {
    fetchShipment();
    fetchHistory();
  }, [id]);

  const fetchShipment = async () => {
    try {
      const response = await api.get(`/shipments/${id}`);
      setShipment(response.data);
      setNewStatus(response.data.status);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch shipment');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await api.get(`/shipments/${id}/history`);
      setHistory(response.data);
    } catch (error) {
      console.error('Failed to fetch history:', error);
      setHistory([]);
    }
  };

  const updateStatus = async () => {
    if (!newStatus || newStatus === shipment?.status) return;
    
    setUpdating(true);
    try {
      await api.patch(`/shipments/${id}/status`, {
        status: newStatus,
        notes: statusNote
      });
      toast.success('Status updated successfully');
      fetchShipment();
      fetchHistory();
      setStatusNote('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const openMaps = () => {
    if (!shipment) return;
    
    // Open Google Maps with delivery address
    const encodedAddress = encodeURIComponent(shipment.delivery_address);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`, '_blank');
  };

  const callCustomer = () => {
    if (shipment?.customer?.phone) {
      window.location.href = `tel:${shipment.customer.phone}`;
    } else {
      toast.error('Customer phone number not available');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      picked_up: 'bg-blue-100 text-blue-800',
      in_transit: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-100 text-gray-800',
      normal: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const isStatusCompleted = (statusToCheck: string): boolean => {
    const statusOrder = ['pending', 'picked_up', 'in_transit', 'delivered'];
    const currentIndex = statusOrder.indexOf(shipment?.status || 'pending');
    const checkIndex = statusOrder.indexOf(statusToCheck);
    return currentIndex >= checkIndex;
  };

  const canUpdateStatus = () => {
    if (!shipment) return false;
    return shipment.status !== 'delivered' && shipment.status !== 'cancelled' && shipment.status !== 'failed';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Shipment not found</h2>
          <button 
            onClick={() => navigate('/driver/shipments')}
            className="mt-4 text-blue-500 hover:text-blue-600"
          >
            Back to My Shipments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/driver/shipments')}
                className="text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Shipment Details</h1>
                <p className="text-sm text-gray-500 font-mono mt-1">{shipment.tracking_number}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(shipment.status)}`}>
                {shipment.status?.replace('_', ' ')}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm ${getPriorityColor(shipment.priority)}`}>
                {shipment.priority}
              </span>
              {shipment.is_express && (
                <span className="px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-800">
                  Express
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Addresses */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-500 mb-1">Pickup Address</div>
                    <div className="text-gray-800">{shipment.pickup_address}</div>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                  <div className="pl-4">
                    <Truck className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-500 mb-1">Delivery Address</div>
                    <div className="text-gray-800">{shipment.delivery_address}</div>
                    <button
                      onClick={openMaps}
                      className="mt-2 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                    >
                      <Navigation className="w-4 h-4" />
                      Get Directions
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            {shipment.customer && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-gray-500" />
                  Customer Information
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{shipment.customer.name}</p>
                      <p className="text-sm text-gray-500">{shipment.customer.email}</p>
                    </div>
                    <div className="flex gap-2">
                      {shipment.customer.phone && (
                        <>
                          <button
                            onClick={callCustomer}
                            className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition"
                            title="Call customer"
                          >
                            <PhoneCall className="w-5 h-5" />
                          </button>
                          <button
                            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                            title="Send SMS"
                          >
                            <MessageSquare className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {shipment.customer.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Phone className="w-4 h-4" />
                      <span>{shipment.customer.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Status History */}
            {history.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold mb-4">Status History</h3>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {history.map((item) => (
                    <div key={item.id} className="flex gap-3 text-sm">
                      <div className="w-32 text-gray-500 flex-shrink-0">
                        {new Date(item.created_at).toLocaleString()}
                      </div>
                      <div>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(item.status)}`}>
                          {item.status?.replace('_', ' ')}
                        </span>
                        {item.location && <span className="ml-2 text-gray-500">- {item.location}</span>}
                        {item.notes && <p className="text-gray-500 mt-1">{item.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Right Side */}
          <div className="space-y-6">
            {/* Update Status */}
            {canUpdateStatus() && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" /> Update Delivery Status
                </h3>
                <div className="space-y-3">
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="picked_up">Picked Up</option>
                    <option value="in_transit">In Transit</option>
                    <option value="delivered">Delivered</option>
                    <option value="failed">Failed</option>
                  </select>
                  <textarea
                    placeholder="Add notes about delivery (optional)"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    rows={2}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={updateStatus}
                    disabled={updating || newStatus === shipment.status}
                    className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition"
                  >
                    {updating ? 'Updating...' : 'Update Status'}
                  </button>
                </div>
              </div>
            )}

            {/* Shipment Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold mb-4">Shipment Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Tracking Number:</span>
                  <span className="font-mono">{shipment.tracking_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Weight:</span>
                  <span>{shipment.weight_kg || 0} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Volume:</span>
                  <span>{shipment.volume_m3 || 0} m³</span>
                </div>
                {shipment.vehicle && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Assigned Vehicle:</span>
                    <span>{shipment.vehicle.license_plate}</span>
                  </div>
                )}
                {shipment.estimated_delivery && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Est. Delivery:
                    </span>
                    <span>{new Date(shipment.estimated_delivery).toLocaleDateString()}</span>
                  </div>
                )}
                {shipment.actual_delivery && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-green-500" /> Actual Delivery:
                    </span>
                    <span>{new Date(shipment.actual_delivery).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Timeline */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Delivery Progress
              </h3>
              <div className="relative">
                <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                <div className="space-y-5">
                  {/* Order Created */}
                  <div className="flex gap-3">
                    <div className="relative z-10 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Order Created</p>
                      <p className="text-xs text-gray-500">{new Date(shipment.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  
                  {/* Picked Up */}
                  <div className="flex gap-3">
                    <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isStatusCompleted('picked_up') ? 'bg-blue-500' : 'bg-gray-300'
                    }`}>
                      {isStatusCompleted('picked_up') && <CheckCircle className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">Picked Up</p>
                      {shipment.picked_up_at ? (
                        <p className="text-xs text-gray-500">{new Date(shipment.picked_up_at).toLocaleString()}</p>
                      ) : isStatusCompleted('picked_up') ? (
                        <p className="text-xs text-green-600">Completed</p>
                      ) : (
                        <p className="text-xs text-gray-400">Pending</p>
                      )}
                    </div>
                  </div>
                  
                  {/* In Transit */}
                  <div className="flex gap-3">
                    <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isStatusCompleted('in_transit') ? 'bg-purple-500' : 'bg-gray-300'
                    }`}>
                      {isStatusCompleted('in_transit') && <Truck className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">In Transit</p>
                      {isStatusCompleted('in_transit') && !shipment.actual_delivery ? (
                        <p className="text-xs text-purple-600">In progress</p>
                      ) : isStatusCompleted('in_transit') ? (
                        <p className="text-xs text-green-600">Completed</p>
                      ) : (
                        <p className="text-xs text-gray-400">Pending</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Delivered */}
                  <div className="flex gap-3">
                    <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      shipment.status === 'delivered' ? 'bg-green-500' : 'bg-gray-300'
                    }`}>
                      {shipment.status === 'delivered' && <CheckCircle className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">Delivered</p>
                      {shipment.actual_delivery ? (
                        <p className="text-xs text-gray-500">{new Date(shipment.actual_delivery).toLocaleString()}</p>
                      ) : shipment.status === 'delivered' ? (
                        <p className="text-xs text-green-600">Completed</p>
                      ) : (
                        <p className="text-xs text-gray-400">Pending</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {shipment.notes && (
              <div className="bg-yellow-50 rounded-lg shadow p-4 border border-yellow-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-700 text-sm">Special Instructions</p>
                    <p className="text-sm text-yellow-600 mt-1">{shipment.notes}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Alert for failed/cancelled */}
            {(shipment.status === 'failed' || shipment.status === 'cancelled') && (
              <div className="bg-red-50 rounded-lg shadow p-4 border border-red-200">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="font-medium text-red-700">
                    {shipment.status === 'failed' ? 'Delivery Failed' : 'Shipment Cancelled'}
                  </span>
                </div>
                <p className="text-sm text-red-600 mt-2">
                  Please contact your dispatcher for more information.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverShipmentDetails;