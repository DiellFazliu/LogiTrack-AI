// frontend/src/pages/dispatcher/AssignDriver.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Truck, User, CheckCircle, Loader, AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface Driver {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  status: string;
  totalDeliveries?: number;
  rating?: number;

  // backend may return extra fields; keep these optional
  licenseNumber?: string;
}



interface Shipment {
  id: string;
  trackingNumber: string;
  pickupAddress: string;
  deliveryAddress: string;
  status: string;

  // Optional driver details (may not exist depending on backend serialization)
  driver?: {
    id?: string;
    name?: string;
    phone?: string;
    email?: string;
  };
}

export const AssignDriver: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const shipmentId = searchParams.get('shipment');
  
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingDrivers, setLoadingDrivers] = useState(true);

  useEffect(() => {
    if (shipmentId) {
      fetchShipment();
    }
    fetchDrivers();
  }, [shipmentId]);

  const fetchShipment = async () => {
    try {
      const response = await api.get(`/shipments/${shipmentId}`);
      setShipment(response.data);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch shipment');
    }
  };

  const fetchDrivers = async () => {
    setLoadingDrivers(true);
    try {
      console.log('Fetching available drivers...');
      const response = await api.get('/drivers/available');
      console.log('Drivers response:', response.data);
      
      const driversList = Array.isArray(response.data) ? response.data : [];
      setDrivers(driversList);
      
      if (driversList.length === 0) {
        toast.error('No available drivers found. Please add drivers first.');
      }
    } catch (error: any) {
      console.error('Error fetching drivers:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch drivers');
    } finally {
      setLoadingDrivers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriver) {
      toast.error('Please select a driver');
      return;
    }

    setLoading(true);
    try {
      await api.patch(`/shipments/${shipmentId}/assign-driver/${selectedDriver}`);
      
      toast.success('Driver assigned successfully! Shipment is now In Transit');
      navigate('/dispatcher/shipments');
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.response?.data?.message || 'Failed to assign driver');
    } finally {
      setLoading(false);
    }
  };

  if (!shipmentId) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">No shipment selected</h2>
          <button 
            onClick={() => navigate('/dispatcher/shipments')}
            className="mt-4 text-blue-500 hover:text-blue-600"
          >
            Back to Shipments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Assign Driver</h1>
              <p className="text-gray-500 mt-1">Select a driver to assign to this shipment</p>
            </div>
            <button
              onClick={fetchDrivers}
              disabled={loadingDrivers}
              className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loadingDrivers ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-white rounded-lg shadow p-6">
          {/* Shipment Details */}
          {shipment && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h2 className="font-semibold mb-2 flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-500" />
                Shipment Details
              </h2>
              <p className="text-sm">
                <span className="font-medium">Tracking:</span> {shipment.trackingNumber}
              </p>
              <p className="text-sm mt-1">
                <span className="font-medium">Pickup:</span> {shipment.pickupAddress}
              </p>
              <p className="text-sm mt-1">
                <span className="font-medium">Delivery:</span> {shipment.deliveryAddress}
              </p>
              <p className="text-sm mt-1">
                <span className="font-medium">Current Status:</span>
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  shipment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  shipment.status === 'in_transit' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {shipment.status?.replace('_', ' ')}
                </span>
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Select Driver</label>
              {loadingDrivers ? (
                <div className="flex justify-center py-8">
                  <Loader className="w-8 h-8 animate-spin text-blue-500" />
                  <span className="ml-2 text-gray-500">Loading drivers...</span>
                </div>
              ) : drivers.length === 0 ? (
                <div className="text-center py-6 bg-yellow-50 rounded-lg border border-yellow-200">
                  <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
                  <p className="text-yellow-700 font-medium">No available drivers found</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Please add drivers first or check their availability status
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/company/drivers')}
                    className="mt-3 text-blue-500 text-sm hover:underline"
                  >
                    + Add Driver
                  </button>
                </div>
              ) : (
                <>
                  <select
                    value={selectedDriver}
                    onChange={(e) => setSelectedDriver(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Choose a driver...</option>
                    {drivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {(driver.name?.trim() ? driver.name : 'Not provided')} - {driver.status} ({driver.totalDeliveries || 0} deliveries) ⭐ {driver.rating || 0}
                      </option>
                    ))}

                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Showing {drivers.length} available driver(s)
                  </p>
                </>
              )}
            </div>

            {selectedDriver && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">Driver Details</span>
                </div>
                {drivers.filter(d => d.id === selectedDriver).map(driver => (
                  <div key={driver.id} className="space-y-1 text-sm">
                    <p><span className="text-gray-500">Name:</span> {driver.name?.trim() ? driver.name : 'Not provided'}</p>
                    <p><span className="text-gray-500">Email:</span> {driver.email?.trim() ? driver.email : 'Not provided'}</p>
                    <p><span className="text-gray-500">Phone:</span> {driver.phone?.trim() ? driver.phone : 'N/A'}</p>

                    <p><span className="text-gray-500">Status:</span> {driver.status}</p>
                    <p><span className="text-gray-500">Total Deliveries:</span> {driver.totalDeliveries || 0}</p>
                    <p><span className="text-gray-500">Rating:</span> ⭐ {driver.rating || 0}/5</p>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm text-green-700 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                After assigning a driver, the shipment status will change to <strong>In Transit</strong>
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/dispatcher/shipments')}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !selectedDriver || drivers.length === 0}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <Truck className="w-4 h-4" />
                    Assign Driver
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AssignDriver;