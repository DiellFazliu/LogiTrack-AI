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

  // Auto-generate waybill if not exists
  const autoGenerateAndFetchWaybill = async () => {
    setLoadingWaybill(true);
    try {
      // First try to get existing waybill
      const waybillData = await waybillsService.getByShipment(id!);
      setWaybill(waybillData);
    } catch (error: any) {
      // If 404, waybill doesn't exist - generate it automatically
      if (error.response?.status === 404) {
        console.log('No waybill found, auto-generating...');
        setIsGeneratingWaybill(true);
        try {
          const newWaybill = await waybillsService.generate(id!);
          setWaybill(newWaybill);
          toast.success('Waybill generated automatically');
        } catch (genError: any) {
          console.error('Error auto-generating waybill:', genError);
          toast.error('Failed to generate waybill');
        } finally {
          setIsGeneratingWaybill(false);
        }
      } else {
        console.error('Error fetching waybill:', error);
      }
    } finally {
      setLoadingWaybill(false);
    }
  };

  // Check if coming from route optimizer to open signature modal
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

// frontend/src/pages/driver/ShipmentDetails.tsx
// Ndrysho handleStartDeliveryProcedure:

const handleStartDeliveryProcedure = () => {
  if (!shipment) {
    toast.error('No shipment data');
    return;
  }
  
  if (!waybill) {
    toast.error('Waybill not ready yet');
    return;
  }
  
  // Dërgo të dhënat si URL parameters
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

  const isWaybillReady = waybill && !isGeneratingWaybill;
  const showStartButton = isWaybillReady && !waybill.isSigned && shipment.status !== 'delivered';

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
                <p className="text-sm text-gray-500 font-mono mt-1">{shipment.trackingNumber}</p>
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
            {/* Waybill Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                Waybill / Delivery Document
              </h3>
              
              {loadingWaybill || isGeneratingWaybill ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  <span className="ml-2 text-gray-500">Preparing waybill...</span>
                </div>
              ) : waybill ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <p className="text-sm text-gray-500">Waybill Number</p>
                      <p className="font-mono font-medium">{waybill.waybillNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <span className={`px-2 py-1 rounded-full text-xs ${waybill.isSigned ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {waybill.isSigned ? '✓ Signed' : 'Pending Signature'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={handleViewWaybill}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                    >
                      <Printer className="w-4 h-4" />
                      View & Print
                    </button>
                  </div>

                  {/* Main Action Button - Start Delivery Procedure */}
                  {showStartButton && (
                    <button
                      onClick={handleStartDeliveryProcedure}
                      className="w-full mt-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2 text-lg font-semibold"
                    >
                      <PlayCircle className="w-5 h-5" />
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

            {/* Addresses - unchanged */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-500 mb-1">Pickup Address</div>
                    <div className="text-gray-800">{shipment.pickupAddress}</div>
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
                    <div className="text-gray-800">{shipment.deliveryAddress}</div>
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

            {/* Customer Info - unchanged */}
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
                        <button
                          onClick={callCustomer}
                          className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition"
                          title="Call customer"
                        >
                          <PhoneCall className="w-5 h-5" />
                        </button>
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

            {/* Status History - unchanged */}
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

          {/* Sidebar - Right Side - unchanged except removing manual sign button */}
          <div className="space-y-6">
            {/* Update Status Section */}
            {canUpdateStatus() && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" /> Update Delivery Status
                </h3>
                
                {shipment.status === 'in_transit' && (
                  <div className="mb-4">
                    <button
                      onClick={markAsDelivered}
                      disabled={updating}
                      className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition flex items-center justify-center gap-2 text-lg font-semibold"
                    >
                      <CheckCircle className="w-5 h-5" />
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

            {/* Shipment Details - unchanged */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold mb-4">Shipment Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Tracking Number:</span>
                  <span className="font-mono">{shipment.trackingNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Weight:</span>
                  <span>{shipment.weightKg || 0} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Volume:</span>
                  <span>{shipment.volumeM3 || 0} m³</span>
                </div>
                {shipment.vehicle && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Assigned Vehicle:</span>
                    <span>{shipment.vehicle.license_plate}</span>
                  </div>
                )}
                {shipment.estimatedDelivery && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Est. Delivery:
                    </span>
                    <span>{new Date(shipment.estimatedDelivery).toLocaleDateString()}</span>
                  </div>
                )}
                {shipment.actualDelivery && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-green-500" /> Actual Delivery:
                    </span>
                    <span>{new Date(shipment.actualDelivery).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Timeline - unchanged */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Delivery Progress
              </h3>
              <div className="relative">
                <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                <div className="space-y-5">
                  <div className="flex gap-3">
                    <div className="relative z-10 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Order Created</p>
                      <p className="text-xs text-gray-500">{new Date(shipment.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  
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
                  
                  <div className="flex gap-3">
                    <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isStatusCompleted('in_transit') ? 'bg-purple-500' : 'bg-gray-300'
                    }`}>
                      {isStatusCompleted('in_transit') && <Truck className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">In Transit</p>
                      {isStatusCompleted('in_transit') && !shipment.actualDelivery ? (
                        <p className="text-xs text-purple-600">In progress</p>
                      ) : isStatusCompleted('in_transit') ? (
                        <p className="text-xs text-green-600">Completed</p>
                      ) : (
                        <p className="text-xs text-gray-400">Pending</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      shipment.status === 'delivered' ? 'bg-green-500' : 'bg-gray-300'
                    }`}>
                      {shipment.status === 'delivered' && <CheckCircle className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">Delivered</p>
                      {shipment.actualDelivery ? (
                        <p className="text-xs text-gray-500">{new Date(shipment.actualDelivery).toLocaleString()}</p>
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

      {/* Waybill Modal for View & Print */}
      {showWaybillModal && waybill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-semibold">Waybill {waybill.waybillNumber}</h2>
              <button onClick={() => setShowWaybillModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-center">
                <h1 className="text-2xl font-bold">LOGITRACK</h1>
                <p className="text-lg mt-2">Waybill: {waybill.waybillNumber}</p>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">Shipment Information</h3>
                <div className="space-y-2">
                  <div className="flex">
                    <span className="w-32 text-gray-500">Tracking:</span>
                    <span className="font-mono">{waybill.shipment.trackingNumber}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-gray-500">Status:</span>
                    <span>{waybill.shipment.status}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-gray-500">Pickup:</span>
                    <span>{waybill.shipment.pickupAddress}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-gray-500">Delivery:</span>
                    <span>{waybill.shipment.deliveryAddress}</span>
                  </div>
                </div>
              </div>
              
              {waybill.shipment.driverName && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Driver</h3>
                  <p>{waybill.shipment.driverName}</p>
                </div>
              )}
              
              {waybill.shipment.vehiclePlate && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Vehicle</h3>
                  <p>{waybill.shipment.vehiclePlate}</p>
                </div>
              )}
              
              {waybill.signature && (
                <div className="border rounded-lg p-4 text-center">
                  <h3 className="font-semibold mb-3">Signature</h3>
                  <img src={waybill.signature} alt="Signature" className="max-w-full h-auto border rounded mx-auto" style={{ maxHeight: '150px' }} />
                  <p className="text-sm text-gray-500 mt-2">
                    Signed at: {new Date(waybill.signedAt!).toLocaleString()}
                  </p>
                </div>
              )}
              
              <div className="flex justify-center pt-4 gap-3">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print Waybill
                </button>
                <button
                  onClick={() => setShowWaybillModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
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
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-semibold">Sign Waybill</h2>
              <button
                onClick={() => setShowSignatureModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="text-sm text-red-500 hover:text-red-600"
                  >
                    Clear Signature
                  </button>
                  <button
                    onClick={() => initCanvas()}
                    className="text-sm text-gray-500 hover:text-gray-600"
                  >
                    Reset
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={signatureNotes}
                  onChange={(e) => setSignatureNotes(e.target.value)}
                  rows={2}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add any delivery notes..."
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={saveSignature}
                  disabled={signing}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                  {signing ? 'Signing...' : 'Confirm Signature'}
                </button>
                <button
                  onClick={() => setShowSignatureModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition"
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