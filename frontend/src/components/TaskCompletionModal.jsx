import { useState, useEffect } from 'react';
import api from '../api';

export default function TaskCompletionModal({ task, onClose, onSuccess }) {
  const [runtimeHours, setRuntimeHours] = useState('');
  const [downtimeStart, setDowntimeStart] = useState('');
  const [downtimeEnd, setDowntimeEnd] = useState('');
  
  const [availableParts, setAvailableParts] = useState([]);
  const [partsUsed, setPartsUsed] = useState([]);
  const [notes, setNotes] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchParts = async () => {
      try {
        const response = await api.get('spare-parts/');
        setAvailableParts(response.data);
      } catch (err) {
        console.error("Failed to fetch spare parts", err);
      }
    };
    fetchParts();
  }, []);

  const calculatedDowntime = () => {
    if (downtimeStart && downtimeEnd) {
      const start = new Date(downtimeStart);
      const end = new Date(downtimeEnd);
      const diff = (end - start) / (1000 * 60 * 60); // hours
      if (diff >= 0) return diff.toFixed(2);
    }
    return null;
  };

  const handleAddPart = () => {
    if (availableParts.length > 0) {
      setPartsUsed([...partsUsed, { spare_part_id: availableParts[0].id, quantity: 1 }]);
    }
  };

  const handlePartChange = (index, field, value) => {
    const newParts = [...partsUsed];
    newParts[index][field] = value;
    setPartsUsed(newParts);
  };

  const handleRemovePart = (index) => {
    const newParts = partsUsed.filter((_, i) => i !== index);
    setPartsUsed(newParts);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Prepare payload
    const payload = {
      runtime_hours: runtimeHours || undefined,
      downtime_start: downtimeStart ? new Date(downtimeStart).toISOString() : undefined,
      downtime_end: downtimeEnd ? new Date(downtimeEnd).toISOString() : undefined,
      parts_used: partsUsed,
      notes: notes
    };

    try {
      await api.post(`repair-tasks/${task.id}/complete_task/`, payload);
      onSuccess();
    } catch (err) {
      console.error("Failed to complete task", err);
      setError(err.response?.data?.error || "Failed to complete task. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[1.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="font-bold text-gray-900 text-lg">Complete Task</h3>
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

          <div className="mb-6 p-4 bg-teal-50 border border-teal-100 rounded-xl">
            <h4 className="font-bold text-teal-900 mb-1">{task.title}</h4>
            <p className="text-sm text-teal-700">Equipment: {task.equipment_name || `ID #${task.equipment}`}</p>
          </div>

          <form id="completion-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Runtime */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Update Runtime Reading (optional)</label>
              <p className="text-xs text-gray-500 mb-2">Leave unchanged if not applicable.</p>
              <div className="flex items-center">
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  value={runtimeHours}
                  onChange={(e) => setRuntimeHours(e.target.value)}
                  className="flex-grow px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 text-sm"
                  placeholder="e.g. 1500.00"
                />
                <span className="ml-3 text-sm font-medium text-gray-500">hrs</span>
              </div>
            </div>

            {/* Downtime */}
            <div className="border-t border-gray-100 pt-6">
              <label className="block text-sm font-bold text-gray-700 mb-3">Downtime Duration (optional)</label>
              <div className="grid grid-cols-2 gap-4 mb-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Started</label>
                  <input 
                    type="datetime-local" 
                    value={downtimeStart}
                    onChange={(e) => setDowntimeStart(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Ended</label>
                  <input 
                    type="datetime-local" 
                    value={downtimeEnd}
                    onChange={(e) => setDowntimeEnd(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 text-sm"
                  />
                </div>
              </div>
              {calculatedDowntime() !== null && (
                <p className="text-sm font-medium text-teal-600 bg-teal-50 px-3 py-1.5 rounded-md inline-block">
                  → Calculated: {calculatedDowntime()} hrs
                </p>
              )}
            </div>

            {/* Parts Used */}
            <div className="border-t border-gray-100 pt-6">
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-bold text-gray-700">Parts Used</label>
                <button 
                  type="button" 
                  onClick={handleAddPart}
                  disabled={availableParts.length === 0}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center ${
                    availableParts.length === 0 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'text-teal-600 bg-teal-50 hover:bg-teal-100'
                  }`}
                  title={availableParts.length === 0 ? "No parts available in inventory. Please add parts to your system first." : "Add a part to this task"}
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                  Add Part
                </button>
              </div>
              
              {partsUsed.length === 0 ? (
                <p className="text-sm text-gray-400 italic bg-gray-50 p-4 rounded-xl text-center border border-dashed border-gray-200">No parts used for this task.</p>
              ) : (
                <div className="space-y-3">
                  {partsUsed.map((part, index) => (
                    <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200">
                      <select 
                        value={part.spare_part_id}
                        onChange={(e) => handlePartChange(index, 'spare_part_id', e.target.value)}
                        className="flex-grow min-w-0 bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                      >
                        {availableParts.map(ap => (
                          <option key={ap.id} value={ap.id}>{ap.name} (Stock: {ap.current_stock})</option>
                        ))}
                      </select>
                      
                      <div className="flex items-center gap-1 w-24 flex-shrink-0">
                        <span className="text-xs text-gray-500">Qty:</span>
                        <input 
                          type="number"
                          min="1"
                          value={part.quantity}
                          onChange={(e) => handlePartChange(index, 'quantity', e.target.value)}
                          className="w-full bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                        />
                      </div>
                      
                      <button 
                        type="button"
                        onClick={() => handleRemovePart(index)}
                        className="p-1.5 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors flex-shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Completion Notes */}
            <div className="border-t border-gray-100 pt-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">Completion Notes</label>
              <textarea 
                rows="3"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 text-sm resize-none"
                placeholder="Details about what was fixed, parts replaced, etc..."
              ></textarea>
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
            form="completion-form"
            disabled={loading}
            className="px-6 py-2 text-sm font-bold text-white bg-teal-400 hover:bg-teal-500 rounded-xl shadow-md shadow-teal-500/20 transition-all disabled:opacity-70 flex items-center"
          >
            {loading ? 'Saving...' : 'Mark Completed'}
          </button>
        </div>

      </div>
    </div>
  );
}
