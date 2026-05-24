import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface Warehouse {
  id?: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  capacity_sqm?: number;
  manager_name?: string;
  manager_phone?: string;
}

interface WarehouseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  warehouse?: Warehouse;
}

const emptyWarehouse: Warehouse = {
  name: '',
  address: '',
  latitude: undefined,
  longitude: undefined,
  capacity_sqm: undefined,
  manager_name: '',
  manager_phone: '',
};

export const WarehouseFormModal: React.FC<WarehouseFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  warehouse,
}) => {
  const [formData, setFormData] = useState<Warehouse>(emptyWarehouse);
  const [loading, setLoading] = useState(false);
  const isEdit = !!warehouse?.id;

  useEffect(() => {
    if (warehouse) {
      setFormData(warehouse);
    } else {
      setFormData(emptyWarehouse);
    }
  }, [warehouse, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    let parsedValue: any = value;
    if (type === 'number') {
      parsedValue = value === '' ? undefined : parseFloat(value);
    }
    setFormData((prev) => ({ ...prev, [name]: parsedValue }));
  };

  // Phone validation function
  const validatePhone = (phone: string): boolean => {
    // Supports: +383 45 123 456, 045 123 456, +38345123456, 045123456
    const phoneRegex = /^(\+383|0)[\s\-]?[1-9][0-9]{1,2}[\s\-]?[0-9]{3,4}[\s\-]?[0-9]{3,4}$/;
    return phoneRegex.test(phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Phone validation (if field is not empty)
    if (formData.manager_phone && !validatePhone(formData.manager_phone)) {
      toast.error('Please enter a valid phone number (e.g., +383 45 123 456)');
      return;
    }

    setLoading(true);
    try {
      // Prepare payload with camelCase (backend expects camelCase in DTO)
      const payload = {
        name: formData.name,
        address: formData.address,
        latitude: formData.latitude,
        longitude: formData.longitude,
        capacitySqm: formData.capacity_sqm,
        managerName: formData.manager_name,
        managerPhone: formData.manager_phone,
      };

      if (isEdit) {
        await api.put(`/warehouses/${warehouse!.id}`, payload);
        toast.success('Warehouse updated successfully');
      } else {
        await api.post('/warehouses', payload);
        toast.success('Warehouse created successfully');
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
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">{isEdit ? 'Edit Warehouse' : 'Add New Warehouse'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="mt-1 block w-full border rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Address *</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              className="mt-1 block w-full border rounded-md px-3 py-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Latitude</label>
              <input
                type="number"
                step="any"
                name="latitude"
                value={formData.latitude ?? ''}
                onChange={handleChange}
                className="mt-1 block w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Longitude</label>
              <input
                type="number"
                step="any"
                name="longitude"
                value={formData.longitude ?? ''}
                onChange={handleChange}
                className="mt-1 block w-full border rounded-md px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Capacity (m²)</label>
            <input
              type="number"
              name="capacity_sqm"
              value={formData.capacity_sqm ?? ''}
              onChange={handleChange}
              min="0"
              className="mt-1 block w-full border rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Manager Name</label>
            <input
              type="text"
              name="manager_name"
              value={formData.manager_name}
              onChange={handleChange}
              className="mt-1 block w-full border rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Manager Phone</label>
            <input
              type="tel"
              name="manager_phone"
              value={formData.manager_phone ?? ''}
              onChange={handleChange}
              pattern="^(\+383|0)[\s\-]?[1-9][0-9]{1,2}[\s\-]?[0-9]{3,4}[\s\-]?[0-9]{3,4}$"
              title="Formati i saktë: +383 45 123 456 ose 045 123 456"
              className="mt-1 block w-full border rounded-md px-3 py-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              Shembull: <strong>+383 45 123 456</strong> ose <strong>045 123 456</strong>
            </p>
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
              {loading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};