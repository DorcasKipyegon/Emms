import { useState, useEffect } from 'react';
import axios from 'axios';

export default function InspectionTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState([{ uid: Date.now(), text: '', is_required: true, order: 0 }]);

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://127.0.0.1:8000/api/inspection-templates/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTemplates(res.data);
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const openModal = (template = null) => {
    if (template) {
      setEditingTemplate(template);
      setName(template.name);
      setDescription(template.description || '');
      // Attach a unique UI id for mapping
      setItems(template.items.map((i, index) => ({ ...i, uid: i.id || Date.now() + index })));
    } else {
      setEditingTemplate(null);
      setName('');
      setDescription('');
      setItems([{ uid: Date.now(), text: '', is_required: true, order: 0 }]);
    }
    setIsModalOpen(true);
  };

  const handleAddItem = () => {
    setItems([...items, { uid: Date.now(), text: '', is_required: true, order: items.length }]);
  };

  const handleRemoveItem = (uid) => {
    setItems(items.filter(i => i.uid !== uid));
  };

  const handleItemChange = (uid, field, value) => {
    setItems(items.map(i => i.uid === uid ? { ...i, [field]: value } : i));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access_token');
      const payload = {
        name,
        description,
        items: items.map((i, index) => ({
          id: i.id, // Include id if it exists for updates
          text: i.text,
          is_required: i.is_required,
          order: index
        }))
      };

      if (editingTemplate) {
        await axios.put(`http://127.0.0.1:8000/api/inspection-templates/${editingTemplate.id}/`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post('http://127.0.0.1:8000/api/inspection-templates/', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      setIsModalOpen(false);
      fetchTemplates();
    } catch (err) {
      console.error(err);
      alert('Failed to save template');
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure you want to delete this template?")) return;
    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`http://127.0.0.1:8000/api/inspection-templates/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTemplates();
    } catch (err) {
      console.error(err);
      alert('Failed to delete template');
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inspection Templates</h1>
          <p className="text-gray-500 mt-1">Manage reusable checklists for preventive maintenance.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-[#13e39d] text-[#0a1c2e] px-4 py-2 rounded-xl font-bold hover:bg-[#0dc185] transition-colors"
        >
          + New Template
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center mt-20">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map(template => (
            <div key={template.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-gray-900">{template.name}</h3>
                <button onClick={() => handleDelete(template.id)} className="text-red-400 hover:text-red-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              
              <p className="text-gray-500 text-sm mb-4 line-clamp-2 flex-grow">{template.description || 'No description provided.'}</p>
              
              <div className="text-sm font-medium text-[#0a1c2e] mb-4 bg-[#13e39d]/20 inline-flex px-3 py-1 rounded-lg w-max">
                {template.items?.length || 0} Checklist Items
              </div>
              
              <button 
                onClick={() => openModal(template)}
                className="w-full py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800 font-semibold rounded-lg transition-colors"
              >
                Edit Template
              </button>
            </div>
          ))}
          {templates.length === 0 && (
             <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
               <p className="text-gray-500 mb-4">No inspection templates found.</p>
               <button onClick={() => openModal()} className="text-teal-600 font-semibold hover:underline">Create your first template</button>
             </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">{editingTemplate ? 'Edit Template' : 'Create Template'}</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="templateForm" onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Template Name</label>
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="e.g. Weekly Forklift Safety Check"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Description (Optional)</label>
                  <textarea 
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    rows="2"
                  ></textarea>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-semibold text-gray-700">Checklist Items</label>
                    <button type="button" onClick={handleAddItem} className="text-sm text-teal-600 font-semibold hover:text-teal-700 flex items-center bg-teal-50 px-2 py-1 rounded-md">
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                      Add Item
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <div key={item.uid} className="flex gap-3 items-start">
                        <div className="pt-2 text-gray-400 font-medium w-6 text-center">{index + 1}.</div>
                        <input 
                          type="text"
                          required
                          value={item.text}
                          onChange={e => handleItemChange(item.uid, 'text', e.target.value)}
                          placeholder="Check item description..."
                          className="flex-grow border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                        <button 
                          type="button" 
                          onClick={() => handleRemoveItem(item.uid)}
                          className="pt-2 text-red-400 hover:text-red-600"
                          title="Remove item"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                      </div>
                    ))}
                    {items.length === 0 && (
                      <div className="text-sm text-gray-500 italic">No items added yet.</div>
                    )}
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button 
                type="submit"
                form="templateForm"
                className="px-4 py-2 bg-[#13e39d] text-[#0a1c2e] font-bold hover:bg-[#0dc185] rounded-lg"
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
