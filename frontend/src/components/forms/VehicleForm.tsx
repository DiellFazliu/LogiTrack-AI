// src/components/forms/VehicleForm.tsx
import React, { useState, useEffect } from 'react';
import { X, Truck, Car, Fuel, Gauge, Calendar, Hash, Palette, Package, Box, Wrench, IdCard, Save, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/api';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
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
      const status = error?.response?.status;
      const message = error?.response?.data?.message;
      if (status === 409) {
        toast.error(message || 'Vehicle already exists for this license plate.');
      } else {
        toast.error(message || 'Operation failed');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/60" onClick={onClose} />
          <div className="flex min-h-full items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden will-change-transform"
            >
              {/* Header me gradient */}
              <div className="bg-gradient-to-r from-blue-800 to-blue-700 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    {isEdit ? <Save className="w-4 h-4 text-white" /> : <Truck className="w-4 h-4 text-white" />}
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    {isEdit ? 'Edito Automjetin' : 'Shto Automjet të Ri'}
                  </h2>
                </div>
                <button onClick={onClose} className="text-white/80 hover:text-white transition p-1 rounded-full hover:bg-white/10">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-80px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* License Plate */}
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">Targa *</label>
                    <div className="relative">
                      <IdCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        name="license_plate"
                        value={formData.license_plate}
                        onChange={handleChange}
                        placeholder="01-123-KS"
                        pattern="[A-Z0-9]{2}-[A-Z0-9]{3}-[A-Z]{2}"
                        title="Formati i saktë: 01-123-KS (dy numra, vizë, tre numra/shkronja, vizë, dy shkronja)"
                        required
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Shembull: <strong>01-123-KS</strong></p>
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">Tipi *</label>
                    <div className="relative">
                      <Car className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        required
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white"
                      >
                        <option value="truck">Kamion</option>
                        <option value="van">Furgon</option>
                        <option value="motorcycle">Motorr</option>
                        <option value="car">Makina</option>
                        <option value="trailer">Rimorkio</option>
                      </select>
                    </div>
                  </div>

                  {/* Brand */}
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">Marka *</label>
                    <div className="relative">
                      <Truck className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        name="brand"
                        value={formData.brand}
                        onChange={handleChange}
                        required
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Model */}
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">Modeli *</label>
                    <div className="relative">
                      <Box className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        name="model"
                        value={formData.model}
                        onChange={handleChange}
                        required
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Year */}
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">Viti *</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="number"
                        name="year"
                        value={formData.year}
                        onChange={handleChange}
                        required
                        min="1900"
                        max={new Date().getFullYear() + 1}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Color */}
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">Ngjyra</label>
                    <div className="relative">
                      <Palette className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        name="color"
                        value={formData.color}
                        onChange={handleChange}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Capacity kg */}
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">Kapaciteti (kg)</label>
                    <div className="relative">
                      <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="number"
                        name="capacity_kg"
                        value={formData.capacity_kg}
                        onChange={handleChange}
                        min="0"
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Capacity m³ */}
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">Kapaciteti (m³)</label>
                    <div className="relative">
                      <Box className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="number"
                        step="0.1"
                        name="capacity_m3"
                        value={formData.capacity_m3}
                        onChange={handleChange}
                        min="0"
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Fuel Type */}
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">Lloji i karburantit</label>
                    <div className="relative">
                      <Fuel className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <select
                        name="fuel_type"
                        value={formData.fuel_type}
                        onChange={handleChange}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white"
                      >
                        <option value="diesel">Diesel</option>
                        <option value="petrol">Benzinë</option>
                        <option value="electric">Elektrik</option>
                        <option value="hybrid">Hibrid</option>
                        <option value="lpg">LPG</option>
                      </select>
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">Statusi</label>
                    <div className="relative">
                      <Wrench className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white"
                      >
                        <option value="available">I lirë</option>
                        <option value="in_use">Në përdorim</option>
                        <option value="maintenance">Mirëmbajtje</option>
                        <option value="repair">Riparim</option>
                        <option value="out_of_service">Jashtë shërbimit</option>
                      </select>
                    </div>
                  </div>

                  {/* Mileage km */}
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">Kilometrazhi (km)</label>
                    <div className="relative">
                      <Gauge className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="number"
                        name="mileage_km"
                        value={formData.mileage_km}
                        onChange={handleChange}
                        min="0"
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Last Maintenance */}
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">Mirëmbajtja e fundit</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="date"
                        name="last_maintenance"
                        value={formData.last_maintenance}
                        onChange={handleChange}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Next Maintenance */}
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">Mirëmbajtja e ardhshme</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="date"
                        name="next_maintenance"
                        value={formData.next_maintenance}
                        onChange={handleChange}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Insurance Expiry */}
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">Skadenca e sigurimit</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="date"
                        name="insurance_expiry"
                        value={formData.insurance_expiry}
                        onChange={handleChange}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Registration Expiry */}
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">Skadenca e regjistrimit</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="date"
                        name="registration_expiry"
                        value={formData.registration_expiry}
                        onChange={handleChange}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-800 font-medium hover:bg-gray-50 transition"
                  >
                    Anulo
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg shadow transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Duke ruajtur...
                      </>
                    ) : (
                      <>
                        {isEdit ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        {isEdit ? 'Ruaj ndryshimet' : 'Krijo automjet'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};