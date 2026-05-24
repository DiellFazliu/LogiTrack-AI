// frontend/src/pages/dispatcher/CreateShipment.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, AlertCircle, Truck, User, Package, Plus, X, Calculator } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

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

  // Customer info (for customer shipments)
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [isNewCustomer, setIsNewCustomer] = useState(true);

  useEffect(() => {
    fetchProducts();
    fetchDrivers();
    fetchVehicles();
    fetchWarehouses();
  }, []);

  // Recalculate weight and volume when products change
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
    // Simulate AI calculation
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

  
  // Gjej funksionin handleSubmit dhe shto këtë pjesë:

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

    // ✅ ✅ ✅ SHTONI KËTË PJESË! ✅ ✅ ✅
    if (isNewCustomer && customerName && customerEmail) {
      shipmentData.customerName = customerName;
      shipmentData.customerEmail = customerEmail;
      console.log('Creating new customer:', { customerName, customerEmail });
    }

    console.log('Sending shipment data:', shipmentData);

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

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Create New Shipment</h1>
            <p className="text-gray-500 mt-1">Fill in the details to create a delivery shipment</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Pickup Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-600" /> Pickup Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Pickup from Warehouse</label>
                <select
                  value={formData.pickup_warehouse_id}
                  onChange={(e) => {
                    setFormData({...formData, pickup_warehouse_id: e.target.value, pickup_address: ''});
                  }}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <label className="block text-sm font-medium mb-2">OR Manual Pickup Address</label>
                <textarea
                  rows={2}
                  value={formData.pickup_address}
                  onChange={(e) => {
                    setFormData({...formData, pickup_address: e.target.value, pickup_warehouse_id: ''});
                  }}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Full pickup address..."
                  disabled={!!formData.pickup_warehouse_id}
                />
              </div>
            </div>
          </div>

          {/* Delivery Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-600" /> Delivery Information
            </h2>
            
            <div>
              <label className="block text-sm font-medium mb-2">Delivery Address *</label>
              <textarea
                required
                rows={2}
                value={formData.delivery_address}
                onChange={(e) => setFormData({...formData, delivery_address: e.target.value})}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Full delivery address..."
              />
            </div>
          </div>

          {/* Products Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" /> Products
            </h2>
            
            <div className="flex gap-2 mb-4">
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-24 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <button
                type="button"
                onClick={addProduct}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
            
            {selectedProducts.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">SKU</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Qty</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Weight</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Volume</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedProducts.map((item) => (
                      <tr key={item.productId}>
                        <td className="px-4 py-2 text-sm">{item.product.name}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{item.product.sku}</td>
                        <td className="px-4 py-2 text-center">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateProductQuantity(item.productId, parseInt(e.target.value) || 1)}
                            className="w-16 border rounded px-2 py-1 text-center"
                          />
                        </td>
                        <td className="px-4 py-2 text-right text-sm">{(item.product.weight_kg * item.quantity).toFixed(2)} kg</td>
                        <td className="px-4 py-2 text-right text-sm">{(item.product.volume_m3 * item.quantity).toFixed(2)} m³</td>
                        <td className="px-4 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeProduct(item.productId)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={3} className="px-4 py-2 text-right font-medium">Total:</td>
                      <td className="px-4 py-2 text-right font-medium">{formData.weight_kg.toFixed(2)} kg</td>
                      <td className="px-4 py-2 text-right font-medium">{formData.volume_m3.toFixed(2)} m³</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Shipment Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-purple-600" /> Shipment Details
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Estimated Delivery Date</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={formData.estimated_delivery}
                    onChange={(e) => setFormData({...formData, estimated_delivery: e.target.value})}
                    className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={calculateEstimatedDelivery}
                    disabled={calculating}
                    className="bg-gray-500 text-white px-3 py-2 rounded-lg hover:bg-gray-600 disabled:opacity-50"
                  >
                    {calculating ? '...' : 'Auto'}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-4">
              <input
                type="checkbox"
                id="express"
                checked={formData.is_express}
                onChange={(e) => setFormData({...formData, is_express: e.target.checked})}
                className="w-4 h-4"
              />
              <label htmlFor="express" className="text-sm font-medium">Express Delivery (Faster shipping)</label>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">Notes / Special Instructions</label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Special instructions for driver..."
              />
            </div>
          </div>

          {/* Assignment Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-600" /> Assignment (Optional)
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-1">
                  <Truck className="w-4 h-4" /> Assign Driver
                </label>
                <select
                  value={formData.driver_id}
                  onChange={(e) => setFormData({...formData, driver_id: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select Driver (Optional) --</option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name} - {driver.status} (⭐ {driver.rating})
                    </option>
                  ))}
                </select>
                {formData.driver_id && drivers.find(d => d.id === formData.driver_id) && (
                  <div className="mt-2 text-sm text-gray-500">
                    {drivers.find(d => d.id === formData.driver_id)?.phone}
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-1">
                  <Package className="w-4 h-4" /> Assign Vehicle
                </label>
                <select
                  value={formData.vehicle_id}
                  onChange={(e) => setFormData({...formData, vehicle_id: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select Vehicle (Optional) --</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.license_plate} - {vehicle.brand} {vehicle.model} ({vehicle.capacity_kg}kg cap.)
                    </option>
                  ))}
                </select>
                {formData.vehicle_id && vehicles.find(v => v.id === formData.vehicle_id) && (
                  <div className="mt-2 text-sm text-gray-500">
                    Capacity: {vehicles.find(v => v.id === formData.vehicle_id)?.capacity_kg}kg
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Customer Information (for creating shipments on behalf of customers) */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-green-600" /> Customer Information
            </h2>
            
            <div className="flex items-center gap-4 mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={isNewCustomer}
                  onChange={() => setIsNewCustomer(true)}
                  className="w-4 h-4"
                />
                <span>New Customer</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={!isNewCustomer}
                  onChange={() => setIsNewCustomer(false)}
                  className="w-4 h-4"
                />
                <span>Existing Customer</span>
              </label>
            </div>
            
            {isNewCustomer ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Customer Name</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Customer Email</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="email@example.com"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-2">Search Customer</label>
                <input
                  type="text"
                  placeholder="Search by email or name..."
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          {/* Summary & Submit */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium">Summary:</p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>Total Weight:</div>
                    <div className="font-medium">{formData.weight_kg.toFixed(2)} kg</div>
                    <div>Total Volume:</div>
                    <div className="font-medium">{formData.volume_m3.toFixed(2)} m³</div>
                    <div>Priority:</div>
                    <div className="font-medium capitalize">{formData.priority}</div>
                    {formData.driver_id && (
                      <>
                        <div>Driver:</div>
                        <div className="font-medium">Assigned</div>
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
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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

export default CreateShipment;