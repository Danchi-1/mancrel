import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, BookOpen, AlertCircle, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { apiClient } from '@/lib/apiClient';

export default function KnowledgeBase() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('FAQ'); // FAQ, Policy, Procedure
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const data = await apiClient.get('/knowledge');
      setItems(data);
    } catch (err) {
      setError('Failed to load knowledge base items.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setTitle(item.title);
      setContent(item.content);
      setType(item.type);
    } else {
      setEditingItem(null);
      setTitle('');
      setContent('');
      setType('FAQ');
    }
    setError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSaving(true);
    setError('');
    
    try {
      if (editingItem) {
        await apiClient.patch(`/knowledge/${editingItem.id}`, { title, content, type });
      } else {
        await apiClient.post('/knowledge', { title, content, type });
      }
      await fetchItems();
      handleCloseModal();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save item. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this item? The AI will no longer use it.')) return;
    try {
      await apiClient.delete(`/knowledge/${id}`);
      setItems(items.filter(item => item.id !== id));
    } catch (err) {
      setError('Failed to delete item.');
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#4F46E5] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#4F46E5]" />
            Knowledge Base
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            Train your AI with FAQs, policies, and business information.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-[#4F46E5] text-white rounded-lg hover:bg-indigo-600 transition-colors shadow-sm text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Knowledge
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed rounded-xl">
          <BookOpen className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-neutral-900 font-medium mb-1">No Knowledge Items</h3>
          <p className="text-neutral-500 text-sm mb-4">Add your first policy or FAQ to train the AI.</p>
          <button
            onClick={() => handleOpenModal()}
            className="text-[#4F46E5] font-medium text-sm hover:underline"
          >
            Create Item
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <div key={item.id} className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow group flex flex-col h-[280px]">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="inline-block px-2 py-1 bg-indigo-50 text-[#4F46E5] text-xs font-semibold rounded mb-2">
                    {item.type}
                  </span>
                  <h3 className="font-semibold text-neutral-900 leading-tight">{item.title}</h3>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenModal(item)} className="p-1.5 text-neutral-400 hover:text-[#4F46E5] rounded hover:bg-indigo-50 transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-1.5 text-neutral-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="text-sm text-neutral-600 prose prose-sm max-w-none overflow-y-auto pr-2 custom-scrollbar flex-1 bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.content}</ReactMarkdown>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-neutral-50">
              <h3 className="font-semibold text-neutral-900">
                {editingItem ? 'Edit Knowledge Item' : 'Add Knowledge Item'}
              </h3>
              <button onClick={handleCloseModal} className="text-neutral-400 hover:text-neutral-600">
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Return Policy"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:outline-none bg-white"
                  >
                    <option value="FAQ">FAQ</option>
                    <option value="Policy">Policy</option>
                    <option value="Procedure">Procedure</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1 flex justify-between">
                  <span>Content (Markdown Supported)</span>
                  <span className="text-xs text-neutral-400">The AI will read this to answer questions.</span>
                </label>
                <textarea
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows="8"
                  placeholder="e.g., We offer a 30-day return policy for all unused items..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:outline-none font-mono text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-[#4F46E5] text-white rounded-lg hover:bg-indigo-600 transition-colors flex items-center gap-2 font-medium text-sm disabled:opacity-70"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingItem ? 'Save Changes' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
