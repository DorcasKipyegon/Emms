import React, { useState, useEffect } from 'react';
import api from '../../api';

export default function EditEquipmentModal({ isOpen, onClose, equipment, categories, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '', serial_number: '', category: '', location: '', status: 'OPERATIONAL'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (equipment) {
      setFormData({
        name: equipment.name || '',
        serial_number: equipment.serial_number || '',
        category: equipment.category || '',
        location: equipment.location || '',
        status: equipment.status || 'OPERATIONAL'
      });
    }
  }, [equipment]);

  if (!isOpen || !equipment) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.put(`equipment/${equipment.id}/`, formData);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update equipment');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-bold text-slate-900">Edit Equipment</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-full p-1 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <p className="text-sm text-rose-600 bg-rose-50 p-2 rounded">{error}</p>}
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Equipment Name</label>
            <input required type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none" />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Serial Number</label>
            <input required type="text" name="serial_number" value={formData.serial_number} onChange={handleInputChange} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none" />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
            <select required name="category" value={formData.category} onChange={handleInputChange} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none">
              <option value="">Select a category...</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Location</label>
            <input required type="text" name="location" value={formData.location} onChange={handleInputChange} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none" />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Status</label>
            <select name="status" value={formData.status} onChange={handleInputChange} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none">
              <option value="OPERATIONAL">Operational</option>
              <option value="MAINTENANCE">In Maintenance</option>
              <option value="DOWN">Down</option>
            </select>
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm">
              {loading ? 'Saving...' : 'Save Equipment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
