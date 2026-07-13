import { useState, useEffect } from 'react';
import api from '../api';

export default function AddTaskModal({ onClose, onSuccess, technicians }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [equipmentId, setEquipmentId] = useState('');
  const [technicianId, setTechnicianId] = useState('');
  const [source, setSource] = useState('REACTIVE');
  
  const [equipmentList, setEquipmentList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const response = await api.get('equipment/');
        setEquipmentList(response.data);
      } catch (err) {
        console.error("Failed to fetch equipment", err);
        setError("Failed to load equipment list.");
      }
    };
    fetchEquipment();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !equipmentId) {
      setError("Title, description, and equipment are required.");
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      title,
      description,
      equipment: equipmentId,
      technician: technicianId || null,
      source
    };

    try {
      await api.post('repair-tasks/', payload);
      onSuccess();
    } catch (err) {
      console.error("Failed to create task", err);
      setError(err.response?.data?.detail || "Failed to create task. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[1.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="font-bold text-gray-900 text-lg">Add New Task</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-grow">
          {error && (
            <div className="mb-4 bg-rose-50 text-rose-600 p-3 rounded-xl text-sm font-medium border border-rose-200">
              {error}
            </div>
          )}

          <form id="add-task-form" onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Title <span className="text-rose-500">*</span></label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 text-sm"
                placeholder="e.g. Conveyor Belt Jam"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Description <span className="text-rose-500">*</span></label>
              <textarea 
                rows="3"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 text-sm resize-none"
                placeholder="Detailed notes on the issue..."
                required
              ></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Equipment <span className="text-rose-500">*</span></label>
                <select 
                  value={equipmentId}
                  onChange={(e) => setEquipmentId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 text-sm"
                  required
                >
                  <option value="" disabled>Select Equipment...</option>
                  {equipmentList.map(eq => (
                    <option key={eq.id} value={eq.id}>{eq.name} ({eq.serial_number})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Assign Technician</label>
                <select 
                  value={technicianId}
                  onChange={(e) => setTechnicianId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 text-sm"
                >
                  <option value="">Unassigned</option>
                  {technicians.map(tech => (
                    <option key={tech.id} value={tech.id}>{tech.first_name} {tech.last_name || tech.username}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Source</label>
              <select 
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 text-sm"
              >
                <option value="REACTIVE">Reactive (Breakdown)</option>
                <option value="PREVENTIVE">Preventive Maintenance</option>
              </select>
            </div>

          </form>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="add-task-form"
            disabled={loading}
            className="px-6 py-2 text-sm font-bold text-white bg-teal-400 hover:bg-teal-500 rounded-xl shadow-md shadow-teal-500/20 transition-all disabled:opacity-70 flex items-center"
          >
            {loading ? 'Creating...' : 'Create Task'}
          </button>
        </div>

      </div>
    </div>
  );
}
