import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface Vehicle {
  id?: string;
  license_plate: string;
  type: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  capacity_kg: number;
  capacity_m3: number;
  fuel_type: string;
  status: string;
  mileage_km: number;
  last_maintenance: string;
  next_maintenance: string;
  insurance_expiry: string;
  registration_expiry: string;
}

interface VehicleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  vehicle?: Vehicle;
}

const emptyVehicle: Vehicle = {
  license_plate: '',
  type: 'van',
  brand: '',
  model: '',
  year: new Date().getFullYear(),
  color: '',
  capacity_kg: 0,
  capacity_m3: 0,
  fuel_type: 'diesel',
  status: 'available',
  mileage_km: 0,
  last_maintenance: '',
  next_maintenance: '',
  insurance_expiry: '',
  registration_expiry: '',
};

export const VehicleFormModal: React.FC<VehicleFormModalProps> = ({ isOpen, onClose, onSuccess, vehicle }) => {
  const [formData, setFormData] = useState<Vehicle>(emptyVehicle);
  const [loading, setLoading] = useState(false);
  const isEdit = !!vehicle?.id;

  useEffect(() => {
    if (vehicle) {
      setFormData(vehicle);
    } else {
      setFormData(emptyVehicle);
    }
  }, [vehicle, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateLicensePlate = (plate: string): boolean => {
    // Formati: 01-123-KS ose 12-ABC-DE (dy numra, vizë, tre karaktere alfanumerike, vizë, dy shkronja)
    const plateRegex = /^[A-Z0-9]{2}-[A-Z0-9]{3}-[A-Z]{2}$/i;
    return plateRegex.test(plate);
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  try {
    // Helper to convert empty/NaN to undefined
    const toNumberOrUndef = (val: any): number | undefined => {
      if (val === undefined || val === null || val === '') return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    };

    const payload = {
      licensePlate: formData.license_plate,
      type: formData.type,
      brand: formData.brand,
      model: formData.model,
      year: formData.year,
      color: formData.color,
      capacityKg: toNumberOrUndef(formData.capacity_kg),
      capacityM3: toNumberOrUndef(formData.capacity_m3),
      fuelType: formData.fuel_type,
      status: formData.status,
      mileageKm: toNumberOrUndef(formData.mileage_km),
      lastMaintenance: formData.last_maintenance || undefined,
      nextMaintenance: formData.next_maintenance || undefined,
      insuranceExpiry: formData.insurance_expiry || undefined,
      registrationExpiry: formData.registration_expiry || undefined,
    };

    if (isEdit) {
      await api.put(`/vehicles/${vehicle!.id}`, payload);
      toast.success('Vehicle updated successfully');
    } else {
      await api.post('/vehicles', payload);
      toast.success('Vehicle created successfully');
    }
    onSuccess();
    onClose();
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Operation failed');
  } finally {
    setLoading(false);
  }
    };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">{isEdit ? 'Edit Vehicle' : 'Add New Vehicle'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* License Plate - me validim dhe placeholder */}
            <div>
              <label className="block text-sm font-medium text-gray-700">License Plate *</label>
              <input
                type="text"
                name="license_plate"
                value={formData.license_plate}
                onChange={handleChange}
                placeholder="01-123-KS"
                pattern="[A-Z0-9]{2}-[A-Z0-9]{3}-[A-Z]{2}"
                title="Formati i saktë: 01-123-KS (dy numra, vizë, tre numra/shkronja, vizë, dy shkronja)"
                required
                className="mt-1 block w-full border rounded-md px-3 py-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                Shembull: <strong>01-123-KS</strong> (dy numra, vizë, tre numra/shkronja, vizë, dy shkronja)
              </p>
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Type *</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className="mt-1 block w-full border rounded-md px-3 py-2"
              >
                <option value="truck">Truck</option>
                <option value="van">Van</option>
                <option value="motorcycle">Motorcycle</option>
                <option value="car">Car</option>
                <option value="trailer">Trailer</option>
              </select>
            </div>

            {/* Brand */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Brand *</label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                required
                className="mt-1 block w-full border rounded-md px-3 py-2"
              />
            </div>

            {/* Model */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Model *</label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleChange}
                required
                className="mt-1 block w-full border rounded-md px-3 py-2"
              />
            </div>

            {/* Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Year *</label>
              <input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleChange}
                required
                min="1900"
                max={new Date().getFullYear() + 1}
                className="mt-1 block w-full border rounded-md px-3 py-2"
              />
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Color</label>
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleChange}
                className="mt-1 block w-full border rounded-md px-3 py-2"
              />
            </div>

            {/* Capacity kg */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Capacity (kg)</label>
              <input
                type="number"
                name="capacity_kg"
                value={formData.capacity_kg}
                onChange={handleChange}
                min="0"
                className="mt-1 block w-full border rounded-md px-3 py-2"
              />
            </div>

            {/* Capacity m³ */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Capacity (m³)</label>
              <input
                type="number"
                step="0.1"
                name="capacity_m3"
                value={formData.capacity_m3}
                onChange={handleChange}
                min="0"
                className="mt-1 block w-full border rounded-md px-3 py-2"
              />
            </div>

            {/* Fuel Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Fuel Type</label>
              <select
                name="fuel_type"
                value={formData.fuel_type}
                onChange={handleChange}
                className="mt-1 block w-full border rounded-md px-3 py-2"
              >
                <option value="diesel">Diesel</option>
                <option value="petrol">Petrol</option>
                <option value="electric">Electric</option>
                <option value="hybrid">Hybrid</option>
                <option value="lpg">LPG</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="mt-1 block w-full border rounded-md px-3 py-2"
              >
                <option value="available">Available</option>
                <option value="in_use">In Use</option>
                <option value="maintenance">Maintenance</option>
                <option value="repair">Repair</option>
                <option value="out_of_service">Out of Service</option>
              </select>
            </div>

            {/* Mileage km */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Mileage (km)</label>
              <input
                type="number"
                name="mileage_km"
                value={formData.mileage_km}
                onChange={handleChange}
                min="0"
                className="mt-1 block w-full border rounded-md px-3 py-2"
              />
            </div>

            {/* Last Maintenance */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Maintenance</label>
              <input
                type="date"
                name="last_maintenance"
                value={formData.last_maintenance}
                onChange={handleChange}
                className="mt-1 block w-full border rounded-md px-3 py-2"
              />
            </div>

            {/* Next Maintenance */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Next Maintenance</label>
              <input
                type="date"
                name="next_maintenance"
                value={formData.next_maintenance}
                onChange={handleChange}
                className="mt-1 block w-full border rounded-md px-3 py-2"
              />
            </div>

            {/* Insurance Expiry */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Insurance Expiry</label>
              <input
                type="date"
                name="insurance_expiry"
                value={formData.insurance_expiry}
                onChange={handleChange}
                className="mt-1 block w-full border rounded-md px-3 py-2"
              />
            </div>

            {/* Registration Expiry */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Registration Expiry</label>
              <input
                type="date"
                name="registration_expiry"
                value={formData.registration_expiry}
                onChange={handleChange}
                className="mt-1 block w-full border rounded-md px-3 py-2"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : (isEdit ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};