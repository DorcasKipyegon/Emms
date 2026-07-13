import { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import api from '../api';

export default function InventoryList() {
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    current_stock: 0,
    reorder_level: 5,
    unit_cost: 0.00
  });
  const [formError, setFormError] = useState('');

  const fetchParts = async () => {
    try {
      const response = await api.get('spare-parts/');
      setParts(response.data);
    } catch (err) {
      setError('Failed to load inventory data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParts();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    setFormData({ name: '', description: '', current_stock: 0, reorder_level: 5, unit_cost: 0.00 });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.post('spare-parts/', formData);
      setIsModalOpen(false);
      // Reset form
      setFormData({ name: '', description: '', current_stock: 0, reorder_level: 5, unit_cost: 0.00 });
      // Refresh list
      fetchParts();
    } catch (err) {
      setFormError('Failed to add part. Ensure SKU is unique.');
      console.error(err);
    }
  };

  const columns = [
    { header: 'Part Name', accessor: 'name' },
    { header: 'SKU', accessor: 'sku' },
    { 
      header: 'Current Stock', 
      accessor: 'current_stock',
      render: (row) => (
        <span className={`font-semibold ${row.current_stock <= row.reorder_level ? 'text-rose-500' : 'text-emerald-400'}`}>
          {row.current_stock}
        </span>
      )
    },
    { header: 'Reorder Level', accessor: 'reorder_level' },
    { 
      header: 'Unit Cost', 
      accessor: 'unit_cost',
      render: (row) => `Ksh ${row.unit_cost}`
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Inventory Management</h2>
          <p className="text-gray-500 mt-1">Track spare parts, stock levels, and costs.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-teal-400 hover:bg-teal-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm shadow-teal-900/20"
        >
          + Add Part
        </button>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/50 text-rose-500 p-4 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="w-full h-64 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <DataTable columns={columns} data={parts} />
      )}

      {/* Add Part Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white border border-gray-200 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Add Spare Part</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && <p className="text-sm text-rose-600 bg-rose-50 p-2 rounded">{formError}</p>}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Part Name</label>
                <input required type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-1 focus:ring-teal-500 focus:outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock</label>
                  <input required type="number" min="0" name="current_stock" value={formData.current_stock} onChange={handleInputChange} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-1 focus:ring-teal-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
                  <input required type="number" min="0" name="reorder_level" value={formData.reorder_level} onChange={handleInputChange} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-1 focus:ring-teal-500 focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost (Ksh)</label>
                <input required type="number" step="0.01" min="0" name="unit_cost" value={formData.unit_cost} onChange={handleInputChange} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-1 focus:ring-teal-500 focus:outline-none" />
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Cancel</button>
                <button type="submit" className="bg-teal-400 hover:bg-teal-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">Save Part</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
