// src/components/forms/UserForm.tsx (versioni i optimizuar)
import { useState, useEffect, useCallback } from 'react';
import { X, User, Mail, Lock, Phone, Briefcase, Save, UserPlus } from 'lucide-react';
import { useCreateUser, useUpdateUser } from '../../hooks/useUsers';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user?: any;
}

export const UserFormModal = ({ isOpen, onClose, onSuccess, user }: UserFormModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'customer',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const isEditMode = !!user;

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '',
        role: user.role || 'customer',
        phone: user.phone || '',
      });
    } else if (!isEditMode && isOpen) {
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'customer',
        phone: '',
      });
    }
  }, [user, isOpen, isEditMode]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditMode && user) {
        await updateUser.mutateAsync({
          id: user.id,
          data: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
          },
        });
        toast.success('Përdoruesi u përditësua me sukses');
      } else {
        await createUser.mutateAsync({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          phone: formData.phone,
        });
        toast.success('Përdoruesi u krijua me sukses');
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
          {/* Background pa blur – performancë më e mirë */}
          <div className="fixed inset-0 bg-black/60" onClick={onClose} />
          
          <div className="flex min-h-full items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden will-change-transform"
            >
              {/* Header me gradient */}
              <div className="bg-gradient-to-r from-blue-800 to-blue-700 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    {isEditMode ? <Save className="w-4 h-4 text-white" /> : <UserPlus className="w-4 h-4 text-white" />}
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    {isEditMode ? 'Edito Përdoruesin' : 'Shto Përdorues të Ri'}
                  </h2>
                </div>
                <button 
                  onClick={onClose} 
                  className="text-white/80 hover:text-white transition p-1 rounded-full hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Emri i plotë */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">
                    Emri i plotë <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">
                    Email <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      placeholder="user@company.com"
                    />
                  </div>
                </div>

                {/* Roli */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">
                    Roli <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <select
                      name="role"
                      required
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent appearance-none"
                    >
                      <option value="customer">Klient</option>
                      <option value="driver">Shofer</option>
                      <option value="dispatcher">Dispecer</option>
                      <option value="company_admin">Admin i Kompanisë</option>
                    </select>
                  </div>
                </div>

                {/* Fjalëkalimi (vetëm për krijim) */}
                {!isEditMode && (
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">
                      Fjalëkalimi <span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="password"
                        name="password"
                        required
                        minLength={6}
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        placeholder="••••••••"
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Minimumi 6 karaktere</p>
                  </div>
                )}

                {/* Telefoni */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">
                    Telefoni (opsional)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      placeholder="+383 45 123 456"
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
                    className="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 rounded-lg shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Duke ruajtur...
                      </>
                    ) : (
                      <>
                        {isEditMode ? <Save className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                        {isEditMode ? 'Ruaj ndryshimet' : 'Krijo përdorues'}
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