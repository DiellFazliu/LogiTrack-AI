import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Truck, User, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  total_deliveries: number;
}

interface Shipment {
  id: string;
  tracking_number: string;
  pickup_address: string;
  delivery_address: string;
}

export const AssignDriver: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const shipmentId = searchParams.get('shipment');
  
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (shipmentId) {
      fetchShipment();
    }
    fetchDrivers();
  }, [shipmentId]);

  const fetchShipment = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/dispatcher/shipments/${shipmentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setShipment(data);
      }
    } catch (error) {
      toast.error('Failed to fetch shipment');
    }
  };

  const fetchDrivers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/dispatcher/drivers/available', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDrivers(data);
      }
    } catch (error) {
      toast.error('Failed to fetch drivers');
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
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/dispatcher/shipments/${shipmentId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ driverId: selectedDriver })
      });

      if (response.ok) {
        toast.success('Driver assigned successfully!');
        navigate('/dispatcher/shipments');
      } else {
        toast.error('Failed to assign driver');
      }
    } catch (error) {
      toast.error('Failed to assign driver');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold text-gray-800">Assign Driver</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-white rounded-lg shadow p-6">
          {shipment && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h2 className="font-semibold mb-2">Shipment Details</h2>
              <p className="text-sm">Tracking: {shipment.tracking_number}</p>
              <p className="text-sm">Pickup: {shipment.pickup_address}</p>
              <p className="text-sm">Delivery: {shipment.delivery_address}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Select Driver</label>
              <select
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Choose a driver...</option>
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name} - {driver.status} ({driver.total_deliveries} deliveries)
                  </option>
                ))}
              </select>
            </div>

            {selectedDriver && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">Driver Details</span>
                </div>
                {drivers.filter(d => d.id === selectedDriver).map(driver => (
                  <div key={driver.id} className="space-y-1 text-sm">
                    <p>Email: {driver.email}</p>
                    <p>Phone: {driver.phone}</p>
                    <p>Status: {driver.status}</p>
                  </div>
                ))}
              </div>
            )}

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
                <Truck className="w-4 h-4" />
                {loading ? 'Assigning...' : 'Assign Driver'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
export default AssignDriver;