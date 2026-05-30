// frontend/src/pages/dispatcher/CreateShipment.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, AlertCircle, Truck, User, Package, Plus, X, Calculator, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// ---- Interfaces unchanged ----
interface Product {
  id: string;
  name: string;
  sku: string;
  weight_kg: number;
  volume_m3: number;
  category: string;
}

interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  rating: number;
}

interface Vehicle {
  id: string;
  license_plate: string;
  type: string;
  brand: string;
  model: string;
  capacity_kg: number;
  capacity_m3: number;
  status: string;
}

interface Warehouse {
  id: string;
  name: string;
  address: string;
}

interface SelectedProduct {
  productId: string;
  product: Product;
  quantity: number;
}

// Helper component for section header
const SectionHeader = ({ icon: Icon, title, color = 'blue' }: { icon: any; title: string; color?: string }) => (
  <div className="flex items-center gap-2 pb-3 mb-4 border-b border-gray-200">
    <div className={`w-1 h-5 bg-${color}-600 rounded-full`} />
    <Icon className={`w-5 h-5 text-${color}-700`} />
    <h2 className="text-base font-bold text-gray-800">{title}</h2>
  </div>
);

export const CreateShipment: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  
  // Data from APIs
  const [products, setProducts] = useState<Product[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  
  // Selected items
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [productQuantity, setProductQuantity] = useState(1);
  
  // Form data
  const [formData, setFormData] = useState({
    pickup_address: '',
    pickup_warehouse_id: '',
    delivery_address: '',
    weight_kg: 0,
    volume_m3: 0,
    priority: 'normal',
    is_express: false,
    notes: '',
    driver_id: '',
    vehicle_id: '',
    estimated_delivery: '',
  });

  // Customer info
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [isNewCustomer, setIsNewCustomer] = useState(false);

  // ----- All original useEffect and functions remain exactly the same -----
  useEffect(() => {
    fetchProducts();
    fetchDrivers();
    fetchVehicles();
    fetchWarehouses();
  }, []);

  useEffect(() => {
    const totalWeight = selectedProducts.reduce((sum, item) => 
      sum + (item.product.weight_kg * item.quantity), 0);
    const totalVolume = selectedProducts.reduce((sum, item) => 
      sum + (item.product.volume_m3 * item.quantity), 0);
    
    setFormData(prev => ({
      ...prev,
      weight_kg: totalWeight,
      volume_m3: totalVolume,
    }));
  }, [selectedProducts]);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const fetchDrivers = async () => {
    try {
      const response = await api.get('/drivers/available');
      setDrivers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch drivers:', error);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await api.get('/vehicles/available');
      setVehicles(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch vehicles:', error);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await api.get('/warehouses');
      setWarehouses(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch warehouses:', error);
    }
  };

  const addProduct = () => {
    if (!selectedProductId) {
      toast.error('Please select a product');
      return;
    }
    
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;
    
    const existing = selectedProducts.find(p => p.productId === selectedProductId);
    if (existing) {
      setSelectedProducts(prev => prev.map(p => 
        p.productId === selectedProductId 
          ? { ...p, quantity: p.quantity + productQuantity }
          : p
      ));
    } else {
      setSelectedProducts(prev => [...prev, {
        productId: selectedProductId,
        product: product,
        quantity: productQuantity
      }]);
    }
    
    setSelectedProductId('');
    setProductQuantity(1);
    toast.success('Product added');
  };

  const removeProduct = (productId: string) => {
    setSelectedProducts(prev => prev.filter(p => p.productId !== productId));
    toast.success('Product removed');
  };

  const updateProductQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeProduct(productId);
    } else {
      setSelectedProducts(prev => prev.map(p => 
        p.productId === productId ? { ...p, quantity } : p
      ));
    }
  };

  const generateTrackingNumber = () => {
    const prefix = 'TRK';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  };

  const calculateEstimatedDelivery = () => {
    setCalculating(true);
    setTimeout(() => {
      const today = new Date();
      const daysToAdd = formData.is_express ? 1 : (formData.priority === 'urgent' ? 1 : formData.priority === 'high' ? 2 : 3);
      const estimatedDate = new Date(today.setDate(today.getDate() + daysToAdd));
      setFormData(prev => ({
        ...prev,
        estimated_delivery: estimatedDate.toISOString().split('T')[0]
      }));
      toast.success('Estimated delivery date calculated');
      setCalculating(false);
    }, 1000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.pickup_address && !formData.pickup_warehouse_id) {
      toast.error('Please provide pickup address or select a warehouse');
      return;
    }
    
    if (!formData.delivery_address) {
      toast.error('Please provide delivery address');
      return;
    }
    
    if (isNewCustomer && (!customerName || !customerEmail)) {
      toast.error('Please enter customer name and email for new customer');
      return;
    }
    
    setLoading(true);
    
    try {
      const trackingNumber = generateTrackingNumber();

      const pickupAddress = (formData.pickup_address || (formData.pickup_warehouse_id
        ? warehouses.find(w => w.id === formData.pickup_warehouse_id)?.address
        : ''))?.toString() || '';

      const shipmentData: any = {
        trackingNumber,
        organizationId: user?.organizationId || undefined,
        pickupAddress: pickupAddress.toString(),
        deliveryAddress: formData.delivery_address.toString(),
        weightKg: formData.weight_kg || undefined,
        volumeM3: formData.volume_m3 || undefined,
        priority: formData.priority,
        isExpress: formData.is_express,
        notes: formData.notes || undefined,
        driverId: formData.driver_id || undefined,
        vehicleId: formData.vehicle_id || undefined,
        estimatedDelivery: formData.estimated_delivery || undefined,
      };

      if (isNewCustomer && customerName && customerEmail) {
        shipmentData.customerName = customerName;
        shipmentData.customerEmail = customerEmail;
        console.log('📤 Creating new customer:', { customerName, customerEmail });
      }

      console.log('📦 Sending shipment data:', shipmentData);

      const response = await api.post('/shipments', shipmentData);
      
      if (response.data) {
        toast.success('Shipment created successfully!');
        
        if (formData.driver_id) {
          toast.success('Driver has been notified');
        }
        
        navigate('/dispatcher/shipments');
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.response?.data?.message || 'Failed to create shipment');
    } finally {
      setLoading(false);
    }
  };

  const getDriverStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      available: 'text-green-600',
      on_duty: 'text-blue-600',
      on_break: 'text-yellow-600',
      off_duty: 'text-gray-600',
    };
    return colors[status] || 'text-gray-600';
  };

  const getVehicleStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      available: 'text-green-600',
      in_use: 'text-blue-600',
      maintenance: 'text-yellow-600',
    };
    return colors[status] || 'text-gray-600';
  };
  // ----- End of original logic -----

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-6 py-6">
        {/* Header with back button */}
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
              <h1 className="text-2xl font-extrabold text-gray-900">Create New Shipment</h1>
            </div>
          </div>
          <p className="text-sm text-gray-600 pl-3 mt-1">Fill in the details to create a delivery shipment</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Pickup Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <SectionHeader icon={MapPin} title="Pickup Information" color="green" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Pickup from Warehouse</label>
                <select
                  value={formData.pickup_warehouse_id}
                  onChange={(e) => {
                    setFormData({...formData, pickup_warehouse_id: e.target.value, pickup_address: ''});
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                >
                  <option value="">-- Select Warehouse --</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name} - {warehouse.address.substring(0, 50)}...
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">OR Manual Pickup Address</label>
                <textarea
                  rows={2}
                  value={formData.pickup_address}
                  onChange={(e) => {
                    setFormData({...formData, pickup_address: e.target.value, pickup_warehouse_id: ''});
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="Full pickup address..."
                  disabled={!!formData.pickup_warehouse_id}
                />
              </div>
            </div>
          </div>

          {/* Delivery Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <SectionHeader icon={MapPin} title="Delivery Information" color="red" />
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Delivery Address *</label>
              <textarea
                required
                rows={2}
                value={formData.delivery_address}
                onChange={(e) => setFormData({...formData, delivery_address: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                placeholder="Full delivery address..."
              />
            </div>
          </div>

          {/* Products Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <SectionHeader icon={Package} title="Products" color="blue" />
            <div className="flex flex-wrap gap-2 mb-4">
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:ring-2 focus:ring-blue-600"
              >
                <option value="">Select a product...</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} (SKU: {product.sku}) - {product.weight_kg}kg / {product.volume_m3}m³
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                value={productQuantity}
                onChange={(e) => setProductQuantity(parseInt(e.target.value) || 1)}
                className="w-20 border border-gray-300 rounded-lg px-2 py-2 text-center focus:ring-2 focus:ring-blue-600"
              />
              <button
                type="button"
                onClick={addProduct}
                className="bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-800 transition flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
            {selectedProducts.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-bold text-gray-600">Product</th>
                      <th className="px-3 py-2 text-left text-xs font-bold text-gray-600">SKU</th>
                      <th className="px-3 py-2 text-center text-xs font-bold text-gray-600">Qty</th>
                      <th className="px-3 py-2 text-right text-xs font-bold text-gray-600">Weight</th>
                      <th className="px-3 py-2 text-right text-xs font-bold text-gray-600">Volume</th>
                      <th className="px-3 py-2 text-center text-xs font-bold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedProducts.map((item) => (
                      <tr key={item.productId}>
                        <td className="px-3 py-2 text-sm text-gray-800">{item.product.name}</td>
                        <td className="px-3 py-2 text-sm text-gray-500">{item.product.sku}</td>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateProductQuantity(item.productId, parseInt(e.target.value) || 1)}
                            className="w-16 border border-gray-300 rounded px-1 py-1 text-center focus:ring-2 focus:ring-blue-600"
                          />
                        </td>
                        <td className="px-3 py-2 text-right text-sm text-gray-800">{(item.product.weight_kg * item.quantity).toFixed(2)} kg</td>
                        <td className="px-3 py-2 text-right text-sm text-gray-800">{(item.product.volume_m3 * item.quantity).toFixed(2)} m³</td>
                        <td className="px-3 py-2 text-center">
                          <button type="button" onClick={() => removeProduct(item.productId)} className="text-red-600 hover:text-red-800">
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={3} className="px-3 py-2 text-right font-bold text-gray-800">Total:</td>
                      <td className="px-3 py-2 text-right font-bold text-gray-800">{formData.weight_kg.toFixed(2)} kg</td>
                      <td className="px-3 py-2 text-right font-bold text-gray-800">{formData.volume_m3.toFixed(2)} m³</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Shipment Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <SectionHeader icon={Calculator} title="Shipment Details" color="purple" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-600"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Estimated Delivery Date</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={formData.estimated_delivery}
                    onChange={(e) => setFormData({...formData, estimated_delivery: e.target.value})}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-600"
                  />
                  <button
                    type="button"
                    onClick={calculateEstimatedDelivery}
                    disabled={calculating}
                    className="px-3 py-2 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-800 disabled:opacity-50"
                  >
                    {calculating ? '...' : 'Auto'}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <input
                type="checkbox"
                id="express"
                checked={formData.is_express}
                onChange={(e) => setFormData({...formData, is_express: e.target.checked})}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor="express" className="text-sm font-semibold text-gray-700">Express Delivery (Faster shipping)</label>
            </div>
            <div className="mt-3">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Notes / Special Instructions</label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-600"
                placeholder="Special instructions for driver..."
              />
            </div>
          </div>

          {/* Assignment Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <SectionHeader icon={User} title="Assignment (Optional)" color="indigo" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Assign Driver</label>
                <select
                  value={formData.driver_id}
                  onChange={(e) => setFormData({...formData, driver_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">-- Select Driver (Optional) --</option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name} - {driver.status} (⭐ {driver.rating})
                    </option>
                  ))}
                </select>
                {formData.driver_id && drivers.find(d => d.id === formData.driver_id) && (
                  <div className="mt-1 text-sm text-gray-600">{drivers.find(d => d.id === formData.driver_id)?.phone}</div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Assign Vehicle</label>
                <select
                  value={formData.vehicle_id}
                  onChange={(e) => setFormData({...formData, vehicle_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">-- Select Vehicle (Optional) --</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.license_plate} - {vehicle.brand} {vehicle.model} ({vehicle.capacity_kg}kg cap.)
                    </option>
                  ))}
                </select>
                {formData.vehicle_id && vehicles.find(v => v.id === formData.vehicle_id) && (
                  <div className="mt-1 text-sm text-gray-600">Capacity: {vehicles.find(v => v.id === formData.vehicle_id)?.capacity_kg}kg</div>
                )}
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <SectionHeader icon={User} title="Customer Information" color="green" />
            <div className="flex items-center gap-4 mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={isNewCustomer}
                  onChange={() => { setIsNewCustomer(true); setCustomerName(''); setCustomerEmail(''); }}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-gray-800">New Customer</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={!isNewCustomer}
                  onChange={() => { setIsNewCustomer(false); setCustomerName(''); setCustomerEmail(''); }}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-gray-800">Existing Customer</span>
              </label>
            </div>
            {isNewCustomer ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-600"
                    placeholder="Full name"
                    required={isNewCustomer}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Customer Email *</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-600"
                    placeholder="email@example.com"
                    required={isNewCustomer}
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Search Customer</label>
                <input
                  type="text"
                  placeholder="Search by email or name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-600"
                />
              </div>
            )}
          </div>

          {/* Summary & Submit */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="bg-blue-50 rounded-xl p-3 mb-5 border border-blue-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-bold">Summary:</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
                    <div>Total Weight:</div>
                    <div className="font-bold">{formData.weight_kg.toFixed(2)} kg</div>
                    <div>Total Volume:</div>
                    <div className="font-bold">{formData.volume_m3.toFixed(2)} m³</div>
                    <div>Priority:</div>
                    <div className="font-bold capitalize">{formData.priority}</div>
                    {formData.driver_id && (
                      <>
                        <div>Driver:</div>
                        <div className="font-bold">Assigned</div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/dispatcher/shipments')}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-800 font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-700 text-white rounded-lg font-bold hover:bg-blue-800 transition disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Creating...
                  </>
                ) : (
                  'Create Shipment'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};