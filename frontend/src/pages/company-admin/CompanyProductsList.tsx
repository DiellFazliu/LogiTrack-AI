// frontend/src/pages/company/CompanyProductsList.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Package, Tag, Weight, Box, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  weight_kg: number;
  volume_m3: number;
  hazardous: boolean;
  fragile: boolean;
  is_active: boolean;
  created_at: string;
}

export const CompanyProductsList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      const data = Array.isArray(response.data) ? response.data : [];
      setProducts(data);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(data.map((p: Product) => p.category).filter(Boolean))];
      setCategories(uniqueCategories);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete product');
    }
  };

  const filteredProducts = products.filter(p => 
    !categoryFilter || p.category === categoryFilter
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Products</h1>
              <p className="text-gray-500 mt-1">Manage your product catalog</p>
            </div>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600"
            >
              <Plus className="w-4 h-4" /> Add Product
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="mb-6">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        )}

        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No products found</h3>
            <p className="text-gray-500">Click "Add Product" to create your first product.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-3 rounded-full">
                      <Package className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{product.name}</h3>
                      <div className="flex items-center gap-2 text-sm">
                        <Tag className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-500">{product.sku}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="text-blue-600 hover:text-blue-800">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => deleteProduct(product.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {product.category && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Category:</span>
                      <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">{product.category}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500 flex items-center gap-1">
                      <Weight className="w-3 h-3" /> Weight:
                    </span>
                    <span>{product.weight_kg || 0} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 flex items-center gap-1">
                      <Box className="w-3 h-3" /> Volume:
                    </span>
                    <span>{product.volume_m3 || 0} m³</span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {product.hazardous && (
                      <span className="flex items-center gap-1 text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                        <AlertTriangle className="w-3 h-3" /> Hazardous
                      </span>
                    )}
                    {product.fragile && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                        Fragile
                      </span>
                    )}
                  </div>
                  {product.description && (
                    <div className="mt-2 pt-2 border-t">
                      <p className="text-sm text-gray-600">{product.description}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-xl font-bold mb-4">Add New Product</h2>
            <p className="text-gray-500 mb-4">Product creation form would go here</p>
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyProductsList;