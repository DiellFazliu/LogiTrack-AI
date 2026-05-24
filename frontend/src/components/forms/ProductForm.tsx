// src/components/forms/ProductForm.tsx
import { useState, useEffect, useCallback } from 'react';
import { X, Package, Tag, Weight, Box, AlertTriangle, FileText, Save, Plus, Check } from 'lucide-react';
import { useCreateProduct, useUpdateProduct } from '../../hooks/useProducts';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product?: any; // Product object for edit mode
}

export const ProductFormModal = ({ isOpen, onClose, onSuccess, product }: ProductFormModalProps) => {
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    category: '',
    weight_kg: 0,
    volume_m3: 0,
    hazardous: false,
    fragile: false,
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const isEditMode = !!product;

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  useEffect(() => {
    if (product && isOpen) {
      setFormData({
        sku: product.sku || '',
        name: product.name || '',
        description: product.description || '',
        category: product.category || '',
        weight_kg: product.weight_kg || 0,
        volume_m3: product.volume_m3 || 0,
        hazardous: product.hazardous || false,
        fragile: product.fragile || false,
        is_active: product.is_active !== undefined ? product.is_active : true,
      });
    } else if (!isEditMode && isOpen) {
      // Reset form when creating new
      setFormData({
        sku: '',
        name: '',
        description: '',
        category: '',
        weight_kg: 0,
        volume_m3: 0,
        hazardous: false,
        fragile: false,
        is_active: true,
      });
    }
  }, [product, isOpen, isEditMode]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }, []);

  const handleNumberChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? 0 : parseFloat(value),
    }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditMode && product) {
        await updateProduct.mutateAsync({
          id: product.id,
          data: {
            sku: formData.sku,
            name: formData.name,
            description: formData.description || undefined,
            category: formData.category || undefined,
            weight_kg: formData.weight_kg || undefined,
            volume_m3: formData.volume_m3 || undefined,
            hazardous: formData.hazardous,
            fragile: formData.fragile,
            is_active: formData.is_active,
          },
        });
        toast.success('Produkti u përditësua me sukses');
      } else {
        await createProduct.mutateAsync({
          sku: formData.sku,
          name: formData.name,
          description: formData.description || undefined,
          category: formData.category || undefined,
          weight_kg: formData.weight_kg || undefined,
          volume_m3: formData.volume_m3 || undefined,
          hazardous: formData.hazardous,
          fragile: formData.fragile,
        });
        toast.success('Produkti u krijua me sukses');
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
                    {isEditMode ? <Save className="w-4 h-4 text-white" /> : <Package className="w-4 h-4 text-white" />}
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    {isEditMode ? 'Edito Produktin' : 'Shto Produkt të Ri'}
                  </h2>
                </div>
                <button onClick={onClose} className="text-white/80 hover:text-white transition p-1 rounded-full hover:bg-white/10">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* SKU */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">
                    SKU <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      name="sku"
                      required
                      value={formData.sku}
                      onChange={handleChange}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      placeholder="P.sh. PRD-001"
                    />
                  </div>
                </div>

                {/* Emri */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">
                    Emri <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      placeholder="Emri i produktit"
                    />
                  </div>
                </div>

                {/* Kategoria */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">Kategoria</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      placeholder="P.sh. Elektronikë, Ushqim"
                    />
                  </div>
                </div>

                {/* Përshkrimi */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">Përshkrimi</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      placeholder="Përshkrim i detajuar..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Pesha */}
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">Pesha (kg)</label>
                    <div className="relative">
                      <Weight className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="number"
                        step="0.01"
                        name="weight_kg"
                        value={formData.weight_kg}
                        onChange={handleNumberChange}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Vëllimi */}
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">Vëllimi (m³)</label>
                    <div className="relative">
                      <Box className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="number"
                        step="0.01"
                        name="volume_m3"
                        value={formData.volume_m3}
                        onChange={handleNumberChange}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="hazardous"
                      checked={formData.hazardous}
                      onChange={handleChange}
                      className="w-4 h-4 text-red-600 focus:ring-red-500"
                    />
                    <span className="text-sm font-medium text-gray-800 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      Produkt i rrezikshëm
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="fragile"
                      checked={formData.fragile}
                      onChange={handleChange}
                      className="w-4 h-4 text-yellow-600 focus:ring-yellow-500"
                    />
                    <span className="text-sm font-medium text-gray-800 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      I thyeshëm
                    </span>
                  </label>
                </div>

                {/* Statusi (vetëm për edit) */}
                {isEditMode && (
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">Statusi</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="is_active"
                          value="true"
                          checked={formData.is_active === true}
                          onChange={() => setFormData(prev => ({ ...prev, is_active: true }))}
                          className="w-4 h-4 text-green-600"
                        />
                        <span className="text-sm text-gray-700">Aktiv</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="is_active"
                          value="false"
                          checked={formData.is_active === false}
                          onChange={() => setFormData(prev => ({ ...prev, is_active: false }))}
                          className="w-4 h-4 text-red-600"
                        />
                        <span className="text-sm text-gray-700">Joaktiv</span>
                      </label>
                    </div>
                  </div>
                )}

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
                        {isEditMode ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        {isEditMode ? 'Ruaj ndryshimet' : 'Krijo produkt'}
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