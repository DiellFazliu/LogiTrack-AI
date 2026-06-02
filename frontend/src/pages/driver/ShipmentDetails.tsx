// frontend/src/pages/driver/ShipmentDetails.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Package, MapPin, Calendar, User, Truck, 
  Clock, CheckCircle, AlertCircle, 
  ArrowLeft, RefreshCw, Phone,
  Navigation, PhoneCall, FileText, 
  PenTool, Printer, X, PlayCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { waybillsService, type WaybillResponse } from '../../services/waybills.service';
import { Link } from 'react-router-dom';

interface Shipment {
  id: string;
  trackingNumber: string;
  status: string;
  pickupAddress: string;
  deliveryAddress: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  weightKg: number;
  volumeM3: number;
  priority: string;
  is_express: boolean;
  notes: string;
  estimatedDelivery: string;
  actualDelivery: string;
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
  const location = useLocation();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [history, setHistory] = useState<StatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  
  // Waybill state
  const [waybill, setWaybill] = useState<WaybillResponse | null>(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showWaybillModal, setShowWaybillModal] = useState(false);
  const [signature, setSignature] = useState<string>('');
  const [signatureNotes, setSignatureNotes] = useState('');
  const [signing, setSigning] = useState(false);
  const [loadingWaybill, setLoadingWaybill] = useState(false);
  const [isGeneratingWaybill, setIsGeneratingWaybill] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetchShipment();
    fetchHistory();
    autoGenerateAndFetchWaybill();
  }, [id]);

  const autoGenerateAndFetchWaybill = async () => {
    console.log('=== autoGenerateAndFetchWaybill START ===');
    setLoadingWaybill(true);
    try {
      const waybillData = await waybillsService.getByShipment(id!);
      console.log('getByShipment result:', waybillData);
      
      if (waybillData) {
        setWaybill(waybillData);
        console.log('Waybill found');
        setLoadingWaybill(false);
        return;
      }
      
      console.log('No waybill found, generating...');
      setIsGeneratingWaybill(true);
      const newWaybill = await waybillsService.generate(id!);
      console.log('Generate result:', newWaybill);
      setWaybill(newWaybill);
      toast.success('Waybill generated successfully');
    } catch (error: any) {
      console.error('Error in autoGenerateAndFetchWaybill:', error);
      console.error('Error response:', error.response);
      toast.error(error.response?.data?.message || 'Failed to generate waybill');
    } finally {
      setIsGeneratingWaybill(false);
      setLoadingWaybill(false);
    }
    console.log('=== autoGenerateAndFetchWaybill END ===');
  };

  useEffect(() => {
    if (location.state?.openSignatureModal && waybill && !waybill.isSigned) {
      setShowSignatureModal(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, waybill]);

  const fetchShipment = async () => {
    try {
      const response = await api.get(`/shipments/${id}`);
      setShipment(response.data);
      setNewStatus(response.data.status);
    } catch (error: any) {
      console.error('Error fetching shipment:', error);
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

  const handleViewWaybill = () => {
    setShowWaybillModal(true);
  };

  const handleStartDeliveryProcedure = () => {
    if (!shipment) {
      toast.error('No shipment data');
      return;
    }
    
    if (!waybill) {
      toast.error('Waybill not ready yet');
      return;
    }
    
    const params = new URLSearchParams({
      shipmentId: shipment.id,
      trackingNumber: shipment.trackingNumber,
      waybillNumber: waybill.waybillNumber,
      pickupAddress: shipment.pickupAddress || '',
      deliveryAddress: shipment.deliveryAddress || '',
      pickupLat: shipment.pickupLatitude?.toString() || '',
      pickupLng: shipment.pickupLongitude?.toString() || '',
      deliveryLat: shipment.deliveryLatitude?.toString() || '',
      deliveryLng: shipment.deliveryLongitude?.toString() || '',
    });
    
    navigate(`/driver/route-optimizer?${params.toString()}`);
  };

  const handleSignWaybill = async () => {
    if (!signature) {
      toast.error('Please provide signature');
      return;
    }

    setSigning(true);
    try {
      const signedWaybill = await waybillsService.sign(waybill!.id, signature, signatureNotes);
      setWaybill(signedWaybill);
      setShowSignatureModal(false);
      setSignature('');
      setSignatureNotes('');
      toast.success('Waybill signed successfully!');
      
      if (shipment && shipment.status !== 'delivered') {
        await api.patch(`/shipments/${id}/status`, {
          status: 'delivered',
          notes: 'Delivery completed with signature'
        });
        fetchShipment();
        fetchHistory();
      }
    } catch (error: any) {
      console.error('Error signing waybill:', error);
      toast.error(error.response?.data?.message || 'Failed to sign waybill');
    } finally {
      setSigning(false);
    }
  };

  const initCanvas = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = canvas.offsetWidth;
    canvas.height = 200;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
    ctx.fillStyle = '#f9fafb';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = () => {
    if (!canvasRef.current) return;
    const signatureData = canvasRef.current.toDataURL();
    setSignature(signatureData);
    handleSignWaybill();
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.beginPath();
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    ctx.moveTo(x, y);
    
    const drawHandler = (drawEvent: MouseEvent | TouchEvent) => {
      let drawX, drawY;
      if ('touches' in drawEvent) {
        drawX = drawEvent.touches[0].clientX - rect.left;
        drawY = drawEvent.touches[0].clientY - rect.top;
      } else {
        drawX = drawEvent.clientX - rect.left;
        drawY = drawEvent.clientY - rect.top;
      }
      ctx.lineTo(drawX, drawY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(drawX, drawY);
    };
    
    const stopDrawing = () => {
      canvas.removeEventListener('mousemove', drawHandler as any);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('touchmove', drawHandler as any);
      canvas.removeEventListener('touchend', stopDrawing);
    };
    
    canvas.addEventListener('mousemove', drawHandler as any);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('touchmove', drawHandler as any);
    canvas.addEventListener('touchend', stopDrawing);
  };

  const updateStatus = async () => {
    if (!newStatus || newStatus === shipment?.status) return;
    
    setUpdating(true);
    try {
      await api.patch(`/shipments/${id}/status`, {
        status: newStatus,
        notes: statusNote
      });
      
      toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
      fetchShipment();
      fetchHistory();
      setStatusNote('');
      
      if (newStatus === 'delivered') {
        setTimeout(() => {
          navigate('/driver/shipments');
        }, 2000);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const markAsDelivered = () => {
    if (waybill && !waybill.isSigned) {
      setShowSignatureModal(true);
    } else {
      setNewStatus('delivered');
      const updateDirect = async () => {
        setUpdating(true);
        try {
          await api.patch(`/shipments/${id}/status`, {
            status: 'delivered',
            notes: statusNote || 'Delivery completed'
          });
          
          toast.success('Shipment marked as Delivered!');
          fetchShipment();
          fetchHistory();
          setStatusNote('');
          
          setTimeout(() => {
            navigate('/driver/shipments');
          }, 2000);
        } catch (error: any) {
          toast.error(error.response?.data?.message || 'Failed to update status');
        } finally {
          setUpdating(false);
        }
      };
      updateDirect();
    }
  };

  const openMaps = () => {
    if (!shipment) return;
    const encodedAddress = encodeURIComponent(shipment.deliveryAddress);
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

  const isWaybillReady = waybill && !isGeneratingWaybill;
  const showStartButton = isWaybillReady && !waybill.isSigned && shipment.status !== 'delivered';

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow sticky top-0 z-10 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/driver/shipments')}
                className="text-gray-600 hover:text-gray-900 p-1 rounded-full hover:bg-gray-100 transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Shipment Details</h1>
                <p className="text-xs text-gray-500 font-mono">{shipment.trackingNumber}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${getStatusColor(shipment.status)}`}>
                {shipment.status?.replace('_', ' ')}
              </span>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${getPriorityColor(shipment.priority)}`}>
                {shipment.priority}
              </span>
              {shipment.is_express && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-orange-200 text-orange-800">
                  Express
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Waybill Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-800 to-blue-700 px-5 py-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Waybill / Delivery Document
                </h3>
              </div>
              <div className="p-5">
                {loadingWaybill || isGeneratingWaybill ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-sm text-gray-600">Preparing waybill...</span>
                  </div>
                ) : waybill ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Waybill Number</p>
                        <p className="font-mono font-bold text-gray-900">{waybill.waybillNumber}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Status</p>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${waybill.isSigned ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}`}>
                          {waybill.isSigned ? '✓ Signed' : 'Pending Signature'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={handleViewWaybill}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
                      >
                        <Printer className="w-4 h-4" />
                        View & Print
                      </button>
                    </div>

                    {showStartButton && (
                      <button
                        onClick={handleStartDeliveryProcedure}
                        className="w-full mt-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition flex items-center justify-center gap-2"
                      >
                        <PlayCircle className="w-4 h-4" />
                        Start Delivery Procedure
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500">Preparing waybill...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Addresses */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-green-700" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pickup Address</p>
                    <p className="text-sm text-gray-800 mt-0.5">{shipment.pickupAddress}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-red-700" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Delivery Address</p>
                    <p className="text-sm text-gray-800 mt-0.5">{shipment.deliveryAddress}</p>
                    <button
                      onClick={openMaps}
                      className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-800"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      Get Directions
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            {shipment.customer && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Customer Information
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-gray-900">{shipment.customer.name}</p>
                      <p className="text-sm text-gray-600">{shipment.customer.email}</p>
                    </div>
                    <div className="flex gap-2">
                      {shipment.customer.phone && (
                        <button
                          onClick={callCustomer}
                          className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
                          title="Call customer"
                        >
                          <PhoneCall className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  {shipment.customer.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{shipment.customer.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Status History */}
            {history.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 className="text-sm font-bold text-gray-800 mb-3">Status History</h3>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {history.map((item) => (
                    <div key={item.id} className="flex gap-3 text-sm">
                      <div className="w-28 text-gray-500 flex-shrink-0 text-xs">
                        {new Date(item.created_at).toLocaleString()}
                      </div>
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

          {/* Sidebar - Right Side */}
          <div className="space-y-6">
            {/* Update Status Section */}
            {canUpdateStatus() && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" /> Update Delivery Status
                </h3>
                
                {shipment.status === 'in_transit' && (
                  <div className="mb-4">
                    <button
                      onClick={markAsDelivered}
                      disabled={updating}
                      className="w-full bg-green-700 text-white py-2.5 rounded-lg font-bold hover:bg-green-800 transition flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {updating ? 'Updating...' : '✓ Mark as Delivered'}
                    </button>
                  </div>
                )}
                
                <div className="space-y-3">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-2 bg-white text-gray-500">Or update manually</span>
                    </div>
                  </div>
                  
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600"
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600"
                  />
                  <button
                    onClick={updateStatus}
                    disabled={updating || newStatus === shipment.status}
                    className="w-full bg-blue-700 text-white py-2 rounded-lg font-semibold hover:bg-blue-800 transition disabled:opacity-50"
                  >
                    {updating ? 'Updating...' : 'Update Status'}
                  </button>
                </div>
              </div>
            )}

            {/* Shipment Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-sm font-bold text-gray-800 mb-3">Shipment Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tracking Number:</span>
                  <span className="font-mono font-bold text-gray-900">{shipment.trackingNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Weight:</span>
                  <span className="font-semibold text-gray-800">{shipment.weightKg || 0} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Volume:</span>
                  <span className="font-semibold text-gray-800">{shipment.volumeM3 || 0} m³</span>
                </div>
                {shipment.vehicle && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Assigned Vehicle:</span>
                    <span className="font-semibold text-gray-800">{shipment.vehicle.license_plate}</span>
                  </div>
                )}
                {shipment.estimatedDelivery && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 flex items-center gap-1">Est. Delivery:</span>
                    <span className="font-semibold text-gray-800">{new Date(shipment.estimatedDelivery).toLocaleDateString()}</span>
                  </div>
                )}
                {shipment.actualDelivery && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 flex items-center gap-1">Actual Delivery:</span>
                    <span className="font-semibold text-green-700">{new Date(shipment.actualDelivery).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Timeline */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Delivery Progress
              </h3>
              <div className="relative">
                <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-300"></div>
                <div className="space-y-5">
                  <div className="flex gap-3">
                    <div className="relative z-10 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">Order Created</p>
                      <p className="text-xs text-gray-600">{new Date(shipment.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isStatusCompleted('picked_up') ? 'bg-blue-600' : 'bg-gray-300'
                    }`}>
                      {isStatusCompleted('picked_up') && <CheckCircle className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <p className="font-bold text-sm">Picked Up</p>
                      {shipment.picked_up_at ? (
                        <p className="text-xs text-gray-600">{new Date(shipment.picked_up_at).toLocaleString()}</p>
                      ) : isStatusCompleted('picked_up') ? (
                        <p className="text-xs text-green-700">Completed</p>
                      ) : (
                        <p className="text-xs text-gray-500">Pending</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isStatusCompleted('in_transit') ? 'bg-purple-600' : 'bg-gray-300'
                    }`}>
                      {isStatusCompleted('in_transit') && <Truck className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <p className="font-bold text-sm">In Transit</p>
                      {isStatusCompleted('in_transit') && !shipment.actualDelivery ? (
                        <p className="text-xs text-purple-700">In progress</p>
                      ) : isStatusCompleted('in_transit') ? (
                        <p className="text-xs text-green-700">Completed</p>
                      ) : (
                        <p className="text-xs text-gray-500">Pending</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      shipment.status === 'delivered' ? 'bg-green-600' : 'bg-gray-300'
                    }`}>
                      {shipment.status === 'delivered' && <CheckCircle className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <p className="font-bold text-sm">Delivered</p>
                      {shipment.actualDelivery ? (
                        <p className="text-xs text-gray-600">{new Date(shipment.actualDelivery).toLocaleString()}</p>
                      ) : shipment.status === 'delivered' ? (
                        <p className="text-xs text-green-700">Completed</p>
                      ) : (
                        <p className="text-xs text-gray-500">Pending</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {shipment.notes && (
              <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-yellow-800 text-sm">Special Instructions</p>
                    <p className="text-sm text-yellow-700 mt-1">{shipment.notes}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Failed/Cancelled Alert */}
            {(shipment.status === 'failed' || shipment.status === 'cancelled') && (
              <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-700" />
                  <span className="font-bold text-red-800">
                    {shipment.status === 'failed' ? 'Delivery Failed' : 'Shipment Cancelled'}
                  </span>
                </div>
                <p className="text-sm text-red-700 mt-2">
                  Please contact your dispatcher for more information.
                </p>
              </div>
            )}
          </div>
        </div>
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
                <p className="text-md mt-2 font-semibold">Waybill: {waybill.waybillNumber}</p>
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
                  className="px-4 py-2 bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800 transition flex items-center gap-2"
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

      {/* Signature Modal */}
      {showSignatureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-purple-800 to-purple-700 px-5 py-3 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Sign Waybill</h2>
              <button
                onClick={() => setShowSignatureModal(false)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  Signature (Draw below)
                </label>
                <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onTouchStart={startDrawing}
                    style={{ width: '100%', height: '200px', background: '#f9fafb', cursor: 'crosshair' }}
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <button
                    onClick={() => {
                      if (canvasRef.current) {
                        const ctx = canvasRef.current.getContext('2d');
                        ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                        initCanvas();
                      }
                    }}
                    className="text-sm font-medium text-red-600 hover:text-red-700"
                  >
                    Clear Signature
                  </button>
                  <button
                    onClick={() => initCanvas()}
                    className="text-sm font-medium text-gray-600 hover:text-gray-700"
                  >
                    Reset
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={signatureNotes}
                  onChange={(e) => setSignatureNotes(e.target.value)}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="Add any delivery notes..."
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  onClick={saveSignature}
                  disabled={signing}
                  className="flex-1 bg-green-700 text-white py-2 rounded-lg font-bold hover:bg-green-800 transition disabled:opacity-50"
                >
                  {signing ? 'Signing...' : 'Confirm Signature'}
                </button>
                <button
                  onClick={() => setShowSignatureModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverShipmentDetails;