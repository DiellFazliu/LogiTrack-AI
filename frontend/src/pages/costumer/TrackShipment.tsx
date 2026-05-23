// src/pages/customer/TrackShipment.tsx
import React, { useState } from 'react';
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
  Printer,
  RotateCcw,
  FileText,
  Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { waybillsService } from '../../services/waybills.service';

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

interface WaybillData {
  id: string;
  waybillNumber: string;
  pdfUrl: string | null;
  isSigned: boolean;
}

export const TrackShipment: React.FC = () => {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [waybill, setWaybill] = useState<WaybillData | null>(null);
  const [loading, setLoading] = useState(false);
  const [printingWaybill, setPrintingWaybill] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber.trim()) {
      toast.error('Please enter a tracking number');
      return;
    }

    setLoading(true);
    try {
      // 1. Merr të dhënat e dërgesës
      const shipmentResponse = await api.get(`/shipments/track/${trackingNumber}`);
      setShipment(shipmentResponse.data);

      // 2. Merr waybill për këtë dërgesë (nëse ekziston)
      try {
        const waybillResponse = await waybillsService.getByShipment(shipmentResponse.data.id);
        setWaybill(waybillResponse);
      } catch (waybillError: any) {
        // Waybill nuk ekziston akoma - nuk është problem
        console.log('No waybill found for this shipment');
        setWaybill(null);
      }

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

  const handleGenerateWaybill = async () => {
    if (!shipment) return;

    setPrintingWaybill(true);
    try {
      // Gjenero waybill të ri
      const newWaybill = await waybillsService.generate(shipment.id);
      setWaybill(newWaybill);
      
      // Shkarko PDF-në
      if (newWaybill.id) {
        const pdfBlob = await waybillsService.downloadPdf(newWaybill.id);
        const url = window.URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `waybill_${newWaybill.waybillNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Waybill generated and downloaded!');
      }
    } catch (error: any) {
      console.error('Error generating waybill:', error);
      toast.error(error.response?.data?.message || 'Failed to generate waybill');
    } finally {
      setPrintingWaybill(false);
    }
  };

  const handlePrintWaybill = async () => {
    if (!waybill) {
      // Nëse nuk ka waybill, gjenero një të ri
      await handleGenerateWaybill();
      return;
    }

    setPrintingWaybill(true);
    try {
      // Shëno waybill si të printuar
      await waybillsService.markAsPrinted(waybill.id);
      
      // Shkarko PDF-në ekzistuese
      const pdfBlob = await waybillsService.downloadPdf(waybill.id);
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `waybill_${waybill.waybillNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Waybill downloaded!');
    } catch (error: any) {
      console.error('Error printing waybill:', error);
      toast.error(error.response?.data?.message || 'Failed to print waybill');
    } finally {
      setPrintingWaybill(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'in_transit':
      case 'picked_up':
        return <Truck className="h-8 w-8 text-blue-500" />;
      case 'pending':
        return <Clock className="h-8 w-8 text-yellow-500" />;
      default:
        return <AlertCircle className="h-8 w-8 text-red-500" />;
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
      delivered: 'bg-green-100 text-green-800',
      in_transit: 'bg-blue-100 text-blue-800',
      picked_up: 'bg-purple-100 text-purple-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-800">Track Your Shipment</h1>
          <p className="text-gray-500 mt-1">Enter your tracking number to get real-time updates</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Search Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <form onSubmit={handleSearch}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tracking Number
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
                placeholder="Enter tracking number (e.g., TRK36296555RNY8)"
                className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                <Search className="w-5 h-5" /> 
                {loading ? 'Searching...' : 'Track'}
              </button>
            </div>
          </form>
        </div>

        {/* Shipment Details */}
        {shipment && (
          <>
            {/* Status Header */}
            <div className="bg-white rounded-lg shadow mb-6 p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Shipment Details</h2>
                  <p className="text-gray-500 mt-1">Tracking: {shipment.trackingNumber}</p>
                  {waybill && (
                    <p className="text-sm text-gray-500 mt-1">
                      Waybill: {waybill.waybillNumber}
                      {waybill.isSigned && (
                        <span className="ml-2 text-green-600 text-xs">✓ Signed</span>
                      )}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {getStatusIcon(shipment.status)}
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(shipment.status)}`}>
                    {getStatusText(shipment.status)}
                  </span>
                </div>
              </div>
            </div>

            {/* Progress Timeline */}
            <div className="bg-white rounded-lg shadow mb-6 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Shipment Progress</h3>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                <div className="space-y-6">
                  <div className="relative pl-10">
                    <div className="absolute left-0 top-1 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Order Created</p>
                      <p className="text-sm text-gray-500">{new Date(shipment.createdAt).toLocaleString()}</p>
                      <p className="text-sm text-gray-600 mt-1">Pickup: {shipment.pickupAddress}</p>
                    </div>
                  </div>
                  
                  {(shipment.status === 'picked_up' || shipment.status === 'in_transit') && (
                    <div className="relative pl-10">
                      <div className="absolute left-0 top-1 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <Truck className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">In Transit</p>
                        <p className="text-sm text-gray-500">
                          {shipment.status === 'picked_up' ? 'Picked Up by courier' : 'On the way to destination'}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {shipment.status === 'delivered' && (
                    <div className="relative pl-10">
                      <div className="absolute left-0 top-1 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">Delivered</p>
                        <p className="text-sm text-gray-500">
                          {shipment.actual_delivery 
                            ? new Date(shipment.actual_delivery).toLocaleString()
                            : 'Delivery completed'}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">Delivery: {shipment.deliveryAddress}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Route Information */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-500" />
                  Route Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Pickup Address</p>
                    <p className="font-medium text-gray-800">{shipment.pickupAddress}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Delivery Address</p>
                    <p className="font-medium text-gray-800">{shipment.deliveryAddress}</p>
                  </div>
                  {shipment.estimated_delivery && (
                    <div>
                      <p className="text-sm text-gray-500">Estimated Delivery</p>
                      <p className="font-medium text-gray-800">
                        {new Date(shipment.estimated_delivery).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Carrier Information */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-500" />
                  Carrier Information
                </h3>
                <div className="space-y-4">
                  {shipment.driver?.name ? (
                    <>
                      <div>
                        <p className="text-sm text-gray-500">Driver</p>
                        <p className="font-medium text-gray-800">{shipment.driver.name}</p>
                        {shipment.driver.phone && (
                          <p className="text-sm text-gray-600">📞 {shipment.driver.phone}</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-500">Driver not assigned yet</p>
                  )}
                  {shipment.vehicle?.license_plate && (
                    <div>
                      <p className="text-sm text-gray-500">Vehicle</p>
                      <p className="font-medium text-gray-800">
                        {shipment.vehicle.license_plate} 
                        {shipment.vehicle.type && ` (${shipment.vehicle.type})`}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Cargo Details */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-500" />
                  Cargo Details
                </h3>
                <div className="space-y-4">
                  {shipment.weight_kg && (
                    <div>
                      <p className="text-sm text-gray-500">Weight</p>
                      <p className="font-medium text-gray-800">{shipment.weight_kg} kg</p>
                    </div>
                  )}
                  {shipment.volume_m3 && (
                    <div>
                      <p className="text-sm text-gray-500">Volume</p>
                      <p className="font-medium text-gray-800">{shipment.volume_m3} m³</p>
                    </div>
                  )}
                  {shipment.notes && (
                    <div>
                      <p className="text-sm text-gray-500">Notes</p>
                      <p className="font-medium text-gray-800">{shipment.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  Timeline
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Order Created</p>
                    <p className="font-medium text-gray-800">{new Date(shipment.createdAt).toLocaleString()}</p>
                  </div>
                  {shipment.estimated_delivery && (
                    <div>
                      <p className="text-sm text-gray-500">Estimated Delivery</p>
                      <p className="font-medium text-gray-800">{new Date(shipment.estimated_delivery).toLocaleString()}</p>
                    </div>
                  )}
                  {shipment.actual_delivery && (
                    <div>
                      <p className="text-sm text-gray-500">Actual Delivery</p>
                      <p className="font-medium text-gray-800">{new Date(shipment.actual_delivery).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Waybill Actions */}
            <div className="bg-white rounded-lg shadow mt-6 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                Waybill / Delivery Document
              </h3>
              <div className="flex flex-wrap gap-4">
                {waybill ? (
                  <>
                    <button
                      onClick={handlePrintWaybill}
                      disabled={printingWaybill}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
                    >
                      {printingWaybill ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          Download Waybill (PDF)
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => window.open(waybill.pdfUrl || '#', '_blank')}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition flex items-center gap-2"
                    >
                      <Printer className="w-4 h-4" />
                      Preview Waybill
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleGenerateWaybill}
                    disabled={printingWaybill}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-50"
                  >
                    {printingWaybill ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        <FileText className="w-4 h-4" />
                        Generate Waybill
                      </>
                    )}
                  </button>
                )}
                
                <button
                  onClick={() => {
                    setTrackingNumber('');
                    setShipment(null);
                    setWaybill(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Track Another
                </button>
              </div>
              {waybill && !waybill.isSigned && (
                <p className="text-sm text-yellow-600 mt-3 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  Waybill not signed yet. Driver will sign upon delivery.
                </p>
              )}
              {waybill && waybill.isSigned && (
                <p className="text-sm text-green-600 mt-3 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  Waybill signed and completed.
                </p>
              )}
            </div>
          </>
        )}

        {/* Empty State */}
        {!shipment && !loading && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Truck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No Shipment Loaded</h3>
            <p className="text-gray-500">
              Enter a tracking number above to see your shipment details
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackShipment;