// frontend/src/pages/customer/TrackShipment.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Truck, 
  MapPin, 
  Calendar, 
  User, 
  Package, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  RotateCcw,
  FileText,
  Printer,
  Eye,
  X,
  Info,
  Star,
  ArrowLeft
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { waybillsService, type WaybillResponse } from '../../services/waybills.service';
import { ReviewModal } from '../../components/customer/ReviewModal';

interface Shipment {
  id: string;
  trackingNumber: string;
  status: string;
  pickupAddress: string;
  deliveryAddress: string;
  estimated_delivery: string;
  actual_delivery?: string;
  createdAt: string;
  weight_kg?: number;
  volume_m3?: number;
  notes?: string;
  driver?: {
    id: string;
    name: string;
    phone: string;
  };
  vehicle?: {
    license_plate: string;
    type: string;
  };
  customer?: {
    name: string;
    email: string;
  };
}

export const TrackShipment: React.FC = () => {
  const navigate = useNavigate();
  const { trackingNumber: urlTrackingNumber } = useParams<{ trackingNumber?: string }>();
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [waybill, setWaybill] = useState<WaybillResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [showWaybillModal, setShowWaybillModal] = useState(false);
  const [generatingWaybill, setGeneratingWaybill] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [hasReview, setHasReview] = useState(false);

  useEffect(() => {
    if (urlTrackingNumber) {
      setTrackingNumber(urlTrackingNumber.toUpperCase());
      performSearch(urlTrackingNumber);
    }
  }, [urlTrackingNumber]);

  useEffect(() => {
    if (shipment?.id && shipment.status === 'delivered') {
      checkExistingReview();
    }
  }, [shipment]);

  const checkExistingReview = async () => {
    try {
      const response = await api.get(`/reviews/shipment/${shipment?.id}`);
      if (response.data) {
        setHasReview(true);
      }
    } catch (error) {
      setHasReview(false);
    }
  };

  const performSearch = async (trackNum: string) => {
    setLoading(true);
    try {
      const shipmentResponse = await api.get(`/shipments/track/${trackNum}`);
      setShipment(shipmentResponse.data);

      const waybillData = await waybillsService.getByShipment(shipmentResponse.data.id);
      setWaybill(waybillData);

      toast.success('Shipment found!');
    } catch (error: any) {
      console.error('Error:', error);
      if (error.response?.status === 404) {
        toast.error('Shipment not found. Please check the tracking number.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to track shipment');
      }
      setShipment(null);
      setWaybill(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber.trim()) {
      toast.error('Please enter a tracking number');
      return;
    }
    navigate(`/customer/track/${trackingNumber.toUpperCase()}`);
  };

  const handleGenerateWaybill = async () => {
    if (!shipment) return;
    setGeneratingWaybill(true);
    try {
      const newWaybill = await waybillsService.generate(shipment.id);
      setWaybill(newWaybill);
      toast.success('Waybill generated successfully!');
      setShowWaybillModal(true);
    } catch (error: any) {
      console.error('Error generating waybill:', error);
      if (error.response?.status === 403) {
        toast.error('You do not have permission to generate waybills.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to generate waybill');
      }
    } finally {
      setGeneratingWaybill(false);
    }
  };

  const handleViewWaybill = () => {
    if (waybill) setShowWaybillModal(true);
  };

  const handleReviewSubmitted = () => {
    setHasReview(true);
    setShowReviewModal(false);
    toast.success('Thank you for your review!');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="h-8 w-8 text-green-600" />;
      case 'in_transit':
      case 'picked_up': return <Truck className="h-8 w-8 text-blue-600" />;
      case 'pending': return <Clock className="h-8 w-8 text-yellow-600" />;
      default: return <AlertCircle className="h-8 w-8 text-red-600" />;
    }
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      pending: 'Pending',
      picked_up: 'Picked Up',
      in_transit: 'In Transit',
      delivered: 'Delivered',
      failed: 'Failed',
      cancelled: 'Cancelled',
    };
    return texts[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      delivered: 'bg-green-200 text-green-800',
      in_transit: 'bg-blue-200 text-blue-800',
      picked_up: 'bg-purple-200 text-purple-800',
      pending: 'bg-yellow-200 text-yellow-800',
      failed: 'bg-red-200 text-red-800',
      cancelled: 'bg-gray-200 text-gray-800',
    };
    return colors[status] || 'bg-gray-200 text-gray-800';
  };

  const handleTrackAnother = () => {
    setTrackingNumber('');
    setShipment(null);
    setWaybill(null);
    navigate('/customer/track');
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6">
        {/* Header with back button */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/customer/dashboard')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-700 hover:bg-gray-200 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Dashboard</span>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-blue-700 rounded-full" />
              <h1 className="text-2xl font-extrabold text-gray-900">Track Your Shipment</h1>
            </div>
          </div>
          <p className="text-sm text-gray-600 pl-3 mt-1">Enter your tracking number to get real-time updates</p>
        </div>

        {/* Search Form Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1">Tracking Number</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
                  placeholder="Enter tracking number"
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-700 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  {loading ? 'Searching...' : 'Track'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {shipment && (
          <>
            {/* Shipment Header Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
              <div className="bg-gradient-to-r from-blue-800 to-blue-700 px-5 py-4">
                <div className="flex flex-wrap justify-between items-start gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-white">Shipment Details</h2>
                    <p className="text-blue-100 text-sm mt-0.5 font-mono">Tracking: {shipment.trackingNumber}</p>
                    {waybill && (
                      <p className="text-blue-100 text-xs mt-1">
                        Waybill: {waybill.waybillNumber}
                        {waybill.isSigned && <span className="ml-2 text-green-200">✓ Signed</span>}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusIcon(shipment.status)}
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(shipment.status)}`}>
                      {getStatusText(shipment.status)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Timeline Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
              <h3 className="text-base font-bold text-gray-800 mb-4">Shipment Progress</h3>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300"></div>
                <div className="space-y-6">
                  <div className="relative pl-10">
                    <div className="absolute left-0 top-1 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Order Created</p>
                      <p className="text-sm text-gray-600">{new Date(shipment.createdAt).toLocaleString()}</p>
                      <p className="text-sm text-gray-700 mt-1">Pickup: {shipment.pickupAddress}</p>
                    </div>
                  </div>
                  
                  {(shipment.status === 'picked_up' || shipment.status === 'in_transit') && (
                    <div className="relative pl-10">
                      <div className="absolute left-0 top-1 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <Truck className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">In Transit</p>
                        <p className="text-sm text-gray-600">
                          {shipment.status === 'picked_up' ? 'Picked Up by courier' : 'On the way to destination'}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {shipment.status === 'delivered' && (
                    <div className="relative pl-10">
                      <div className="absolute left-0 top-1 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">Delivered</p>
                        <p className="text-sm text-gray-600">
                          {shipment.actual_delivery 
                            ? new Date(shipment.actual_delivery).toLocaleString()
                            : 'Delivery completed'}
                        </p>
                        <p className="text-sm text-gray-700 mt-1">Delivery: {shipment.deliveryAddress}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Route Information */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-700" />
                  Route Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">Pickup Address</p>
                    <p className="text-sm font-medium text-gray-900 break-words">{shipment.pickupAddress}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">Delivery Address</p>
                    <p className="text-sm font-medium text-gray-900 break-words">{shipment.deliveryAddress}</p>
                  </div>
                  {shipment.estimated_delivery && (
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase">Estimated Delivery</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(shipment.estimated_delivery).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Carrier Information */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-700" />
                  Carrier Information
                </h3>
                <div className="space-y-3">
                  {shipment.driver?.name ? (
                    <>
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase">Driver</p>
                        <p className="text-sm font-bold text-gray-900">{shipment.driver.name}</p>
                        {shipment.driver.phone && (
                          <p className="text-sm text-gray-700 mt-1">📞 {shipment.driver.phone}</p>
                        )}
                      </div>
                      {shipment.vehicle?.license_plate && (
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase">Vehicle</p>
                          <p className="text-sm font-medium text-gray-900">
                            {shipment.vehicle.license_plate} 
                            {shipment.vehicle.type && ` (${shipment.vehicle.type})`}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <User className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 font-medium">No driver assigned yet</p>
                      <p className="text-xs text-gray-400 mt-1">A driver will be assigned to your shipment soon</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Cargo Details */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-700" />
                  Cargo Details
                </h3>
                <div className="space-y-3">
                  {shipment.weight_kg ? (
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase">Weight</p>
                      <p className="text-sm font-bold text-gray-900">{shipment.weight_kg} kg</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No weight specified</p>
                  )}
                  {shipment.volume_m3 ? (
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase">Volume</p>
                      <p className="text-sm font-bold text-gray-900">{shipment.volume_m3} m³</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No volume specified</p>
                  )}
                  {shipment.notes && (
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase">Notes</p>
                      <p className="text-sm text-gray-900">{shipment.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-700" />
                  Timeline
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">Order Created</p>
                    <p className="text-sm font-bold text-gray-900">{new Date(shipment.createdAt).toLocaleString()}</p>
                  </div>
                  {shipment.estimated_delivery && (
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase">Estimated Delivery</p>
                      <p className="text-sm font-bold text-gray-900">{new Date(shipment.estimated_delivery).toLocaleString()}</p>
                    </div>
                  )}
                  {shipment.actual_delivery && (
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase">Actual Delivery</p>
                      <p className="text-sm font-bold text-green-700">{new Date(shipment.actual_delivery).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Waybill Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
              <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-700" />
                Waybill / Delivery Document
              </h3>
              
              {!waybill && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-700 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-blue-800">Waybill not yet available</p>
                      <p className="text-xs text-blue-700">The waybill will be generated once a driver is assigned to your shipment.</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex flex-wrap gap-3">
                {waybill ? (
                  <button
                    onClick={handleViewWaybill}
                    className="px-4 py-2 bg-blue-700 text-white rounded-lg font-bold hover:bg-blue-800 transition flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View Waybill
                  </button>
                ) : (
                  <button
                    onClick={handleGenerateWaybill}
                    disabled={generatingWaybill}
                    className="px-4 py-2 bg-green-700 text-white rounded-lg font-bold hover:bg-green-800 transition flex items-center gap-2 disabled:opacity-50"
                  >
                    {generatingWaybill ? <LoadingSpinner size="sm" /> : <FileText className="w-4 h-4" />}
                    {generatingWaybill ? 'Generating...' : 'Generate Waybill'}
                  </button>
                )}
                <button
                  onClick={handleTrackAnother}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Track Another
                </button>
              </div>
              {waybill && !waybill.isSigned && (
                <p className="text-sm text-yellow-700 mt-3 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  Waybill not signed yet. Driver will sign upon delivery.
                </p>
              )}
              {waybill && waybill.isSigned && (
                <p className="text-sm text-green-700 mt-3 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  Waybill signed and completed.
                </p>
              )}
            </div>

            {/* Review Section - Only for delivered shipments */}
            {shipment.status === 'delivered' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Rate Your Delivery Experience
                </h3>
                {hasReview ? (
                  <div className="text-center py-4">
                    <div className="flex justify-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-green-700 font-semibold">Thank you for your feedback!</p>
                    <p className="text-sm text-gray-600 mt-1">Your review helps us improve our service.</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-gray-700 mb-4">
                      How was your delivery experience with {shipment.driver?.name || 'our driver'}?
                    </p>
                    <button
                      onClick={() => setShowReviewModal(true)}
                      className="inline-flex items-center gap-2 px-6 py-2 bg-yellow-500 text-white rounded-lg font-bold hover:bg-yellow-600 transition"
                    >
                      <Star className="w-4 h-4" />
                      Write a Review
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!shipment && !loading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Truck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-700 mb-2">No Shipment Loaded</h3>
            <p className="text-gray-500">Enter a tracking number above to see your shipment details</p>
          </div>
        )}
      </div>

      {/* Waybill Modal */}
      {showWaybillModal && waybill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-800 to-blue-700 px-5 py-3 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Waybill {waybill.waybillNumber}</h2>
              <button onClick={() => setShowWaybillModal(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-center border-b pb-4">
                <h1 className="text-2xl font-extrabold text-gray-900">LOGITRACK</h1>
                <p className="text-md font-semibold mt-2">Waybill: {waybill.waybillNumber}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-bold text-gray-800 mb-3">Shipment Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex">
                    <span className="w-32 font-medium text-gray-600">Tracking:</span>
                    <span className="font-mono text-gray-900">{waybill.shipment.trackingNumber}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 font-medium text-gray-600">Status:</span>
                    <span className="capitalize text-gray-900">{waybill.shipment.status}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 font-medium text-gray-600">Pickup:</span>
                    <span className="text-gray-900">{waybill.shipment.pickupAddress}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 font-medium text-gray-600">Delivery:</span>
                    <span className="text-gray-900">{waybill.shipment.deliveryAddress}</span>
                  </div>
                </div>
              </div>
              {waybill.shipment.driverName && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-bold text-gray-800 mb-2">Driver</h3>
                  <p className="text-gray-900">{waybill.shipment.driverName}</p>
                </div>
              )}
              {waybill.shipment.vehiclePlate && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-bold text-gray-800 mb-2">Vehicle</h3>
                  <p className="text-gray-900">{waybill.shipment.vehiclePlate}</p>
                </div>
              )}
              {waybill.signature && (
                <div className="border rounded-lg p-4 text-center">
                  <h3 className="font-bold text-gray-800 mb-3">Signature</h3>
                  <img src={waybill.signature} alt="Signature" className="max-w-full h-auto border rounded mx-auto" style={{ maxHeight: '150px' }} />
                  <p className="text-xs text-gray-500 mt-2">
                    Signed at: {new Date(waybill.signedAt!).toLocaleString()}
                  </p>
                </div>
              )}
              <div className="flex justify-center gap-3 pt-4">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-700 text-white rounded-lg font-bold hover:bg-blue-800 transition flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print Waybill
                </button>
                <button
                  onClick={() => setShowWaybillModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {shipment && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          shipmentId={shipment.id}
          shipmentTrackingNumber={shipment.trackingNumber}
          driverName={shipment.driver?.name}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}
    </div>
  );
};