// frontend/src/pages/dispatcher/AssignDriver.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Truck, User, CheckCircle, Loader, AlertCircle, RefreshCw, ArrowLeft, Phone, Mail, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

interface Driver {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  status: string;
  totalDeliveries?: number;
  rating?: number;
  licenseNumber?: string;
}

interface Shipment {
  id: string;
  trackingNumber: string;
  pickupAddress: string;
  deliveryAddress: string;
  status: string;
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800">No shipment selected</h2>
          <p className="text-gray-600 mt-2">Please go back and select a shipment to assign a driver.</p>
          <button 
            onClick={() => navigate('/dispatcher/shipments')}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Shipments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dispatcher/shipments')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-700 hover:bg-gray-200 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back</span>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-blue-700 rounded-full" />
              <h1 className="text-2xl font-extrabold text-gray-900">Assign Driver</h1>
            </div>
          </div>
          <p className="text-sm text-gray-600 pl-3 mt-1">Select a driver to assign to this shipment</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Refresh button top-right inside card */}
          <div className="px-5 py-3 border-b border-gray-200 flex justify-end">
            <button
              onClick={fetchDrivers}
              disabled={loadingDrivers}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loadingDrivers ? 'animate-spin' : ''}`} />
              Refresh Drivers
            </button>
          </div>

          <div className="p-5">
            {/* Shipment Details Card */}
            {shipment && (
              <div className="mb-6 bg-gray-50 rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Truck className="w-5 h-5 text-blue-700" />
                  <h2 className="text-base font-bold text-gray-800">Shipment Details</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="border-l-4 border-blue-600 pl-3">
                    <p className="text-xs font-bold text-gray-500 uppercase">Tracking Number</p>
                    <p className="font-mono font-bold text-gray-900">{shipment.trackingNumber}</p>
                  </div>
                  <div className="border-l-4 border-gray-400 pl-3">
                    <p className="text-xs font-bold text-gray-500 uppercase">Current Status</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      shipment.status === 'pending' ? 'bg-yellow-200 text-yellow-800' :
                      shipment.status === 'in_transit' ? 'bg-purple-200 text-purple-800' :
                      'bg-gray-200 text-gray-800'
                    }`}>
                      {shipment.status?.replace('_', ' ') || 'Unknown'}
                    </span>
                  </div>
                  <div className="sm:col-span-2 border-l-4 border-green-600 pl-3">
                    <p className="text-xs font-bold text-gray-500 uppercase">Pickup Address</p>
                    <p className="text-gray-800">{shipment.pickupAddress}</p>
                  </div>
                  <div className="sm:col-span-2 border-l-4 border-red-600 pl-3">
                    <p className="text-xs font-bold text-gray-500 uppercase">Delivery Address</p>
                    <p className="text-gray-800">{shipment.deliveryAddress}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Driver Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">Select Driver</label>
                {loadingDrivers ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Loading drivers...</span>
                  </div>
                ) : drivers.length === 0 ? (
                  <div className="text-center py-6 bg-yellow-50 rounded-lg border border-yellow-200">
                    <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-2" />
                    <p className="text-yellow-800 font-semibold">No available drivers found</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Please add drivers first or check their availability status
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate('/company/drivers')}
                      className="mt-3 inline-flex items-center gap-1 text-blue-700 text-sm font-medium hover:underline"
                    >
                      + Add Driver
                    </button>
                  </div>
                ) : (
                  <>
                    <select
                      value={selectedDriver}
                      onChange={(e) => setSelectedDriver(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      required
                    >
                      <option value="">Choose a driver...</option>
                      {drivers.map((driver) => (
                        <option key={driver.id} value={driver.id}>
                          {driver.name?.trim() || 'Unnamed'} - {driver.status} ({driver.totalDeliveries || 0} deliveries) ⭐ {driver.rating || 0}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-600 mt-1">
                      Showing {drivers.length} available driver(s)
                    </p>
                  </>
                )}
              </div>

              {/* Driver Details (when selected) */}
              {selectedDriver && (
                <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-5 h-5 text-blue-700" />
                    <h3 className="text-base font-bold text-gray-800">Driver Details</h3>
                  </div>
                  {drivers.filter(d => d.id === selectedDriver).map(driver => (
                    <div key={driver.id} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-gray-700 w-24">Name:</span>
                        <span className="text-gray-800">{driver.name?.trim() || 'Not provided'}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-gray-700 w-24">Email:</span>
                        <span className="text-gray-800 flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-gray-500" />
                          {driver.email?.trim() || 'Not provided'}
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-gray-700 w-24">Phone:</span>
                        <span className="text-gray-800 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-gray-500" />
                          {driver.phone?.trim() || 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-gray-700 w-24">License:</span>
                        <span className="text-gray-800">{driver.licenseNumber || 'N/A'}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-gray-700 w-24">Status:</span>
                        <span className="capitalize font-semibold text-blue-700">{driver.status}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-gray-700 w-24">Deliveries:</span>
                        <span className="text-gray-800">{driver.totalDeliveries || 0}</span>
                      </div>
                      <div className="flex items-start gap-2 sm:col-span-2">
                        <span className="font-bold text-gray-700 w-24">Rating:</span>
                        <span className="text-gray-800 flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          {driver.rating || 0} / 5
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Info Box */}
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-green-800">After assigning a driver</p>
                    <p className="text-sm text-green-700">
                      The shipment status will change to <strong>In Transit</strong> and the driver will be notified.
                    </p>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/dispatcher/shipments')}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-800 font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !selectedDriver || drivers.length === 0}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-blue-700 text-white rounded-lg font-bold hover:bg-blue-800 transition disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
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
    </div>
  );
};

export default AssignDriver;