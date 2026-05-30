import React, { useState, useEffect } from 'react';
import { PackageSearch, Plus, Trash2, Edit2, Archive, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';

export function CatalogueContent({ user }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    available: true,
    description: '',
    sku: '',
    image_url: ''
  });
  
  const [formLoading, setFormLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get('/catalogue/');
      setItems(data);
    } catch (err) {
      console.error("Failed to fetch catalogue items", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleOpenModal = (item = null) => {
    setError('');
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        price: item.price || '',
        available: item.available,
        description: item.description || '',
        sku: item.sku || '',
        image_url: item.image_url || ''
      });
    } else {
      setEditingItem(null);
      setFormData({ name: '', price: '', available: true, description: '', sku: '', image_url: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');
    try {
      if (editingItem) {
        await apiClient.put(`/catalogue/${editingItem.id}`, formData);
      } else {
        await apiClient.post('/catalogue/', formData);
      }
      setIsModalOpen(false);
      fetchItems();
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setFormLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingImage(true);
    setError('');
    
    const formDataObj = new FormData();
    formDataObj.append('file', file);
    
    try {
      // Temporary endpoint URL mapping
      const host = window.location.hostname === 'localhost' 
        ? 'http://localhost:8000/api/v1' 
        : 'https://mancrel.onrender.com/api/v1';
        
      const response = await fetch(`${host}/catalogue/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formDataObj
      });
      
      if (!response.ok) throw new Error("Failed to upload image");
      
      const data = await response.json();
      setFormData({ ...formData, image_url: data.url });
    } catch (err) {
      setError("Image upload failed. Ensure CLOUDINARY_URL is set in your backend environment.");
      console.error(err);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const pseudoEvent = { target: { files: e.dataTransfer.files } };
      handleImageUpload(pseudoEvent);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await apiClient.delete(`/catalogue/${id}`);
      fetchItems();
    } catch (err) {
      console.error(err);
      alert("Failed to delete item");
    }
  };

  const toggleAvailability = async (item) => {
    try {
      await apiClient.put(`/catalogue/${item.id}`, { ...item, available: !item.available });
      fetchItems();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Product Catalogue</h1>
          <p className="text-gray-500 mt-1">Manage the products and services your AI assistant can sell.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-[#4F46E5] hover:bg-[#4338CA] text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Add Product
        </button>
      </div>
      
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
          <div className="text-sm font-medium text-gray-500">
            {items.length} / 20 items used
          </div>
          <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full ${items.length >= 20 ? 'bg-red-500' : 'bg-[#4F46E5]'}`} 
              style={{ width: `${(items.length / 20) * 100}%` }}
            />
          </div>
        </div>
        
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
              <PackageSearch className="w-10 h-10 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No products yet</h3>
            <p className="text-gray-500 max-w-md mb-6">
              Add your products or services here. The AI assistant will automatically use this information to answer customer questions about prices and availability.
            </p>
            <button 
              onClick={() => handleOpenModal()}
              className="bg-white border-2 border-gray-200 hover:border-[#4F46E5] text-gray-700 hover:text-[#4F46E5] px-6 py-2.5 rounded-lg font-medium transition-all"
            >
              Add your first product
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map(item => (
                <div key={item.id} className="border rounded-xl p-5 hover:shadow-md transition-shadow bg-white flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-lg text-gray-900 line-clamp-1" title={item.name}>{item.name}</h3>
                    <div className="flex gap-1 ml-2 shrink-0">
                      <button onClick={() => handleOpenModal(item)} className="p-1.5 text-gray-400 hover:text-[#4F46E5] hover:bg-indigo-50 rounded-md transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {item.image_url && (
                    <div className="w-full h-32 mb-3 bg-gray-100 rounded-lg overflow-hidden border">
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  
                  <div className="text-xl font-bold text-[#4F46E5] mb-3">
                    {item.price || "Contact for price"}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-1">
                    {item.description || "No description provided."}
                  </p>
                  
                  <div className="flex items-center justify-between pt-4 border-t mt-auto">
                    <div className="text-xs font-mono text-gray-400">
                      {item.sku ? `SKU: ${item.sku}` : ''}
                    </div>
                    <button 
                      onClick={() => toggleAvailability(item)}
                      className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                        item.available ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {item.available ? 'In Stock' : 'Out of Stock'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50 shrink-0">
              <h2 className="text-xl font-bold text-gray-900">
                {editingItem ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-100 rounded-lg text-sm">
                  {error}
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Premium Subscription"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4F46E5] outline-none transition-shadow"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
                  
                  {formData.image_url ? (
                    <div className="relative w-full h-48 rounded-xl overflow-hidden border border-gray-200 group">
                      <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          type="button"
                          onClick={() => setFormData({...formData, image_url: ''})}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                          Remove Image
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="border-2 border-dashed border-gray-300 rounded-xl bg-[#0f172a] text-center p-8 transition-colors hover:border-[#4F46E5] group"
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                    >
                      <div className="mx-auto w-12 h-12 rounded-full border border-gray-600 flex items-center justify-center mb-4 group-hover:border-[#4F46E5] transition-colors">
                        {uploadingImage ? (
                          <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                        ) : (
                          <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                          </svg>
                        )}
                      </div>
                      <h4 className="text-white font-bold mb-1">Drag & drop image here</h4>
                      <p className="text-sm text-gray-400 mb-6">JPG, PNG, WEBP supported</p>
                      
                      <label className="cursor-pointer inline-block bg-transparent border border-gray-600 hover:border-gray-400 text-white px-6 py-2 rounded-full text-sm font-medium transition-colors">
                        Browse Files
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                      </label>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                    <input 
                      type="text" 
                      value={formData.price}
                      onChange={e => setFormData({...formData, price: e.target.value})}
                      placeholder="e.g. ₦4,500 or Contact Us"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4F46E5] outline-none transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SKU (Optional)</label>
                    <input 
                      type="text" 
                      value={formData.sku}
                      onChange={e => setFormData({...formData, sku: e.target.value})}
                      placeholder="e.g. PRM-001"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4F46E5] outline-none transition-shadow"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea 
                    rows="3"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    placeholder="Describe the product so the AI can answer questions about it..."
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4F46E5] outline-none transition-shadow resize-none"
                  />
                </div>
                
                <div className="flex items-center gap-3 py-2">
                  <input 
                    type="checkbox" 
                    id="available"
                    checked={formData.available}
                    onChange={e => setFormData({...formData, available: e.target.checked})}
                    className="w-4 h-4 text-[#4F46E5] rounded focus:ring-[#4F46E5]"
                  />
                  <label htmlFor="available" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Item is currently in stock / available
                  </label>
                </div>
              </div>
              
              <div className="mt-8 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={formLoading}
                  className="flex-1 px-4 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                >
                  {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingItem ? 'Save Changes' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
