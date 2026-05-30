// src/components/forms/DriverForm.tsx (versioni i optimizuar)
import { useState, useEffect, useCallback } from 'react';
import { X, User, Mail, Lock, Phone, Truck, Calendar, Home, IdCard, Save, UserPlus } from 'lucide-react';
import { useCreateUser } from '../../hooks/useUsers';
import { useCreateDriver, useUpdateDriver } from '../../hooks/useDrivers';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface DriverFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  driver?: any;
}

export const DriverFormModal = ({ isOpen, onClose, onSuccess, driver }: DriverFormModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    licenseNumber: '',
    address: '',
    hireDate: '',
  });
  const [loading, setLoading] = useState(false);
  const isEditMode = !!driver;

  const createUser = useCreateUser();
  const createDriver = useCreateDriver();
  const updateDriver = useUpdateDriver();

  useEffect(() => {
    if (driver && isOpen) {
      setFormData({
        name: driver.user?.name || '',
        email: driver.user?.email || '',
        password: '',
        phone: driver.phone || '',
        licenseNumber: driver.licenseNumber || '',
        address: driver.address || '',
        hireDate: driver.hireDate?.split('T')[0] || '',
      });
    } else if (!isEditMode && isOpen) {
      setFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        licenseNumber: '',
        address: '',
        hireDate: '',
      });
    }
  }, [driver, isOpen, isEditMode]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditMode && driver) {
        await updateDriver.mutateAsync({
          id: driver.id,
          data: {
            phone: formData.phone,
            licenseNumber: formData.licenseNumber || undefined,
            address: formData.address || undefined,
            hireDate: formData.hireDate || undefined,
          },
        });
        toast.success('Shoferi u përditësua me sukses');
      } else {
        const userResponse = await createUser.mutateAsync({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: 'driver',
          phone: formData.phone,
        });
        const userId = userResponse.user?.id;
        if (!userId) throw new Error('User ID not found');

        await createDriver.mutateAsync({
          userId,
          licenseNumber: formData.licenseNumber || undefined,
          phone: formData.phone,
          address: formData.address || undefined,
          hireDate: formData.hireDate || undefined,
        });
        toast.success('Shoferi u krijua me sukses');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Operacioni dështoi');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Background i thjeshtë pa blur */}
          <div className="fixed inset-0 bg-black/60" onClick={onClose} />
          
          <div className="flex min-h-full items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden will-change-transform"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-800 to-blue-700 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    {isEditMode ? <Save className="w-4 h-4 text-white" /> : <Truck className="w-4 h-4 text-white" />}
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    {isEditMode ? 'Edito Shoferin' : 'Shto Shofer të Ri'}
                  </h2>
                </div>
                <button onClick={onClose} className="text-white/80 hover:text-white transition p-1 rounded-full hover:bg-white/10">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {!isEditMode && (
                  <>
                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-1">Emri i plotë *</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          type="text"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleChange}
                          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                          placeholder="John Doe"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-1">Email *</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          type="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                          placeholder="driver@company.com"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-1">Fjalëkalimi *</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          type="password"
                          name="password"
                          required
                          minLength={6}
                          value={formData.password}
                          onChange={handleChange}
                          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                          placeholder="••••••••"
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Minimumi 6 karaktere</p>
                    </div>
                  </>
                )}

                {/* Numri i licencës */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">Numri i licencës</label>
                  <div className="relative">
                    <IdCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleChange}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      placeholder="DRV-0001 (automatik nëse bosh)"
                    />
                  </div>
                </div>

                {/* Telefoni */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">Telefoni *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      placeholder="+383 45 123 456"
                    />
                  </div>
                </div>

                {/* Adresa */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">Adresa (opsionale)</label>
                  <div className="relative">
                    <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      placeholder="Rruga ABC, Prishtinë"
                    />
                  </div>
                </div>

                {/* Data e punësimit */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">Data e punësimit</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="date"
                      name="hireDate"
                      value={formData.hireDate}
                      onChange={handleChange}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Butonat */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-800 font-medium hover:bg-gray-50 transition"
                  >
                    Anulo
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 rounded-lg shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Duke ruajtur...
                      </>
                    ) : (
                      <>
                        {isEditMode ? <Save className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
                        {isEditMode ? 'Ruaj ndryshimet' : 'Krijo shofer'}
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