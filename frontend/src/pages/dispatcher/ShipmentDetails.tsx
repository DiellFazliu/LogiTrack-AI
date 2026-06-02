// frontend/src/pages/dispatcher/ShipmentDetails.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Package, MapPin, Calendar, User, Truck, 
  Clock, CheckCircle, AlertCircle, Edit, 
  Truck as TruckIcon, ArrowLeft, RefreshCw, Phone, Mail 
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

interface Shipment {
  id: string;
  trackingNumber: string;           
  tracking_number?: string;         
  status: string;
  pickupAddress: string;
  deliveryAddress: string;
  weightKg: number;
  volumeM3: number;
  priority: string;
  isExpress: boolean;
  notes: string;
  estimatedDelivery: string | null;
  actualDelivery: string | null;
  createdAt: string;
  pickedUpAt: string | null;
  updatedAt: string;
  
  customerName: string | null;
  customerEmail?: string | null;
  driverName: string | null;
  driverLicenseNumber?: string | null;
  driverPhone?: string | null;
  vehiclePlate: string | null;
  vehicleType?: string | null;
  vehicleBrand?: string | null;
  vehicleModel?: string | null;
  
  driver?: { id: string; name: string; phone: string; email: string; user?: { name: string } };
  vehicle?: { id: string; licensePlate: string; type: string; brand: string; model: string };
  customer?: { id: string; name: string; email: string; phone: string };
}

interface StatusHistory {
  id: string;
  status: string;
  location: string;
  notes: string;
  created_at: string;
}

export const ShipmentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [history, setHistory] = useState<StatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');

  const role = user?.role;
  const isDispatcher = role === 'dispatcher' || role === 'company_admin';
  const isDriver = role === 'driver';

  const getBackPath = () => {
    if (location.pathname.includes('/company-admin')) {
      return '/company-admin/shipments';
    }
    if (isDispatcher) return '/dispatcher/shipments';
    if (isDriver) return '/driver/shipments';
    return '/';
  };

  useEffect(() => {
    fetchShipment();
    fetchHistory();
  }, [id]);

  const fetchShipment = async () => {
    try {
      const response = await api.get(`/shipments/${id}`);
      const data = response.data;
      setShipment(data);
      setNewStatus(data.status);
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

  const assignDriver = () => {
    const basePath = location.pathname.includes('/company-admin') ? '/company-admin' : '/dispatcher';
    navigate(`${basePath}/assign-driver?shipment=${id}`);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-200 text-yellow-800',
      picked_up: 'bg-blue-200 text-blue-800',
      in_transit: 'bg-purple-200 text-purple-800',
      delivered: 'bg-green-200 text-green-800',
      failed: 'bg-red-200 text-red-800',
      cancelled: 'bg-gray-200 text-gray-800',
    };
    return colors[status] || 'bg-gray-200 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-200 text-gray-800',
      normal: 'bg-blue-200 text-blue-800',
      high: 'bg-orange-200 text-orange-800',
      urgent: 'bg-red-200 text-red-800',
    };
    return colors[priority] || 'bg-gray-200 text-gray-800';
  };

  const isStatusCompleted = (statusToCheck: string): boolean => {
    const statusOrder = ['pending', 'picked_up', 'in_transit', 'delivered'];
    const currentIndex = statusOrder.indexOf(shipment?.status || 'pending');
    const checkIndex = statusOrder.indexOf(statusToCheck);
    return currentIndex >= checkIndex;
  };

  const getDriverName = (): string => {
    if (shipment?.driverName) return shipment.driverName;
    if (shipment?.driver?.name) return shipment.driver.name;
    if (shipment?.driver?.user?.name) return shipment.driver.user.name;
    return 'Not assigned';
  };

  const getDriverPhone = (): string => {
    if (shipment?.driverPhone) return shipment.driverPhone;
    if (shipment?.driver?.phone) return shipment.driver.phone;
    return '';
  };

  const getDriverEmail = (): string => {
    if (shipment?.driver?.email) return shipment.driver.email;
    return '';
  };

  const getVehiclePlate = (): string => {
    if (shipment?.vehiclePlate) return shipment.vehiclePlate;
    if (shipment?.vehicle?.licensePlate) return shipment.vehicle.licensePlate;
    return 'Not assigned';
  };

  const getVehicleDesc = (): string => {
    if (shipment?.vehicleBrand && shipment?.vehicleModel) {
      return `${shipment.vehicleBrand} ${shipment.vehicleModel}`;
    }
    if (shipment?.vehicle?.brand && shipment?.vehicle?.model) {
      return `${shipment.vehicle.brand} ${shipment.vehicle.model}`;
    }
    return '';
  };

  const getVehicleType = (): string => {
    if (shipment?.vehicleType) return shipment.vehicleType;
    if (shipment?.vehicle?.type) return shipment.vehicle.type;
    return '';
  };

  if (loading) return <LoadingSpinner fullScreen />;

  if (!shipment) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center max-w-md">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800">Shipment not found</h2>
          <button onClick={() => navigate(getBackPath())} className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
            Back to Shipments
          </button>
        </div>
      </div>
    );
  }

  const trackingNumber = shipment.trackingNumber || shipment.tracking_number || 'N/A';
  const pickupAddress = shipment.pickupAddress || (shipment as any).pickup_address;
  const deliveryAddress = shipment.deliveryAddress || (shipment as any).delivery_address;
  const weight = shipment.weightKg !== undefined ? shipment.weightKg : (shipment as any).weight_kg || 0;
  const volume = shipment.volumeM3 !== undefined ? shipment.volumeM3 : (shipment as any).volume_m3 || 0;
  const createdAt = shipment.createdAt || (shipment as any).created_at;
  const estimatedDelivery = shipment.estimatedDelivery || (shipment as any).estimated_delivery;
  const actualDelivery = shipment.actualDelivery || (shipment as any).actual_delivery;
  const pickedUpAt = shipment.pickedUpAt || (shipment as any).picked_up_at;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(getBackPath())}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-700 hover:bg-gray-200 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back</span>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-blue-700 rounded-full" />
              <h1 className="text-2xl font-extrabold text-gray-900">Shipment Details</h1>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(shipment.status)}`}>
              {shipment.status?.replace('_', ' ')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tracking Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-800 to-blue-700 px-5 py-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-white" />
                    <span className="text-xl font-mono text-white font-bold">{trackingNumber}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${getPriorityColor(shipment.priority)}`}>
                      {shipment.priority}
                    </span>
                    {shipment.isExpress && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-orange-200 text-orange-800">
                        Express
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-green-700" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">Pickup Address</p>
                    <p className="text-sm text-gray-800">{pickupAddress || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-red-700" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">Delivery Address</p>
                    <p className="text-sm text-gray-800">{deliveryAddress || 'N/A'}</p>
                  </div>
                </div>
                <div className="text-right text-xs text-gray-500">
                  Created: {createdAt ? new Date(createdAt).toLocaleString() : 'N/A'}
                </div>
              </div>
            </div>

            {/* Assignment Info - Only for Dispatcher */}
            {isDispatcher && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-700" />
                  Assignment
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Driver</p>
                    {getDriverName() !== 'Not assigned' ? (
                      <div>
                        <p className="font-bold text-gray-900">{getDriverName()}</p>
                        {getDriverPhone() && (
                          <p className="text-sm text-gray-700 flex items-center gap-1 mt-1">
                            <Phone className="w-3.5 h-3.5 text-gray-500" /> {getDriverPhone()}
                          </p>
                        )}
                        {getDriverEmail() && (
                          <p className="text-sm text-gray-700 flex items-center gap-1 mt-1">
                            <Mail className="w-3.5 h-3.5 text-gray-500" /> {getDriverEmail()}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="text-yellow-700">
                        No driver assigned
                        <button onClick={assignDriver} className="ml-2 text-blue-700 text-sm font-semibold hover:underline">
                          Assign Now
                        </button>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Vehicle</p>
                    {getVehiclePlate() !== 'Not assigned' ? (
                      <div>
                        <p className="font-bold text-gray-900">{getVehiclePlate()}</p>
                        {getVehicleDesc() && <p className="text-sm text-gray-700">{getVehicleDesc()}</p>}
                        {getVehicleType() && <p className="text-xs text-gray-500">{getVehicleType()}</p>}
                      </div>
                    ) : (
                      <span className="text-gray-600">Not assigned</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Driver Info - For Driver View */}
            {isDriver && getDriverName() !== 'Not assigned' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-700" />
                  Your Assignment
                </h3>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-700" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{getDriverName()}</p>
                    <p className="text-sm text-gray-600">You are assigned to this delivery</p>
                    {getDriverPhone() && (
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <Phone className="w-3.5 h-3.5 text-gray-500" /> {getDriverPhone()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Status History */}
            {history.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 className="text-sm font-bold text-gray-800 mb-4">Status History</h3>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {history.map((item) => (
                    <div key={item.id} className="flex gap-3 text-sm border-b border-gray-100 pb-3">
                      <div className="w-28 text-gray-500 text-xs">{new Date(item.created_at).toLocaleString()}</div>
                      <div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${getStatusColor(item.status)}`}>
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

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Update Status */}
            {(isDispatcher || isDriver) && shipment.status !== 'delivered' && shipment.status !== 'cancelled' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-blue-700" /> Update Status
                </h3>
                <div className="space-y-3">
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="pending">Pending</option>
                    <option value="picked_up">Picked Up</option>
                    <option value="in_transit">In Transit</option>
                    <option value="delivered">Delivered</option>
                    {isDispatcher && (
                      <>
                        <option value="failed">Failed</option>
                        <option value="cancelled">Cancelled</option>
                      </>
                    )}
                  </select>
                  <textarea
                    placeholder="Notes (optional)"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-600"
                  />
                  <button
                    onClick={updateStatus}
                    disabled={updating || newStatus === shipment.status}
                    className="w-full bg-blue-700 text-white py-2 rounded-lg font-bold hover:bg-blue-800 transition disabled:opacity-50"
                  >
                    {updating ? 'Updating...' : 'Update Status'}
                  </button>
                </div>
              </div>
            )}

            {/* Shipment Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-sm font-bold text-gray-800 mb-4">Shipment Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Weight:</span>
                  <span className="font-semibold text-gray-800">{weight} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Volume:</span>
                  <span className="font-semibold text-gray-800">{volume} m³</span>
                </div>
                {estimatedDelivery && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 flex items-center gap-1">Est. Delivery:</span>
                    <span className="font-semibold text-gray-800">{new Date(estimatedDelivery).toLocaleDateString()}</span>
                  </div>
                )}
                {actualDelivery && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 flex items-center gap-1">Actual Delivery:</span>
                    <span className="font-semibold text-green-700">{new Date(actualDelivery).toLocaleString()}</span>
                  </div>
                )}
                {shipment.notes && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-gray-600 font-semibold">Notes:</p>
                    <p className="mt-1 text-gray-800">{shipment.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Timeline */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-700" /> Delivery Timeline
              </h3>
              <div className="relative">
                <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-300"></div>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="relative z-10 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">Order Created</p>
                      <p className="text-xs text-gray-600">{createdAt ? new Date(createdAt).toLocaleString() : 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center ${
                      isStatusCompleted('picked_up') ? 'bg-blue-600' : 'bg-gray-300'
                    }`}>
                      {isStatusCompleted('picked_up') && <Clock className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <p className="font-bold text-sm">Picked Up</p>
                      {pickedUpAt ? (
                        <p className="text-xs text-gray-600">{new Date(pickedUpAt).toLocaleString()}</p>
                      ) : isStatusCompleted('picked_up') ? (
                        <p className="text-xs text-green-700 font-semibold">Completed</p>
                      ) : (
                        <p className="text-xs text-gray-500">Pending</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center ${
                      isStatusCompleted('in_transit') ? 'bg-purple-600' : 'bg-gray-300'
                    }`}>
                      {isStatusCompleted('in_transit') && <Truck className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <p className="font-bold text-sm">In Transit</p>
                      {isStatusCompleted('in_transit') && !actualDelivery ? (
                        <p className="text-xs text-purple-700 font-semibold">In progress</p>
                      ) : isStatusCompleted('in_transit') ? (
                        <p className="text-xs text-green-700 font-semibold">Completed</p>
                      ) : (
                        <p className="text-xs text-gray-500">Pending</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center ${
                      shipment.status === 'delivered' ? 'bg-green-600' : 'bg-gray-300'
                    }`}>
                      {shipment.status === 'delivered' && <CheckCircle className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <p className="font-bold text-sm">Delivered</p>
                      {actualDelivery ? (
                        <p className="text-xs text-gray-600">{new Date(actualDelivery).toLocaleString()}</p>
                      ) : shipment.status === 'delivered' ? (
                        <p className="text-xs text-green-700 font-semibold">Completed</p>
                      ) : (
                        <p className="text-xs text-gray-500">Pending</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Alert for cancelled/failed */}
            {(shipment.status === 'failed' || shipment.status === 'cancelled') && (
              <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-700" />
                  <span className="font-bold text-red-800">
                    {shipment.status === 'failed' ? 'Delivery Failed' : 'Shipment Cancelled'}
                  </span>
                </div>
                {shipment.notes && (
                  <p className="text-sm text-red-700 mt-2">{shipment.notes}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShipmentDetails;