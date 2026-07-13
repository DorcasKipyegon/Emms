import { useState } from 'react';
import api from '../api';

export default function ArchiveTaskModal({ task, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleArchive = async () => {
    setLoading(true);
    setError(null);

    try {
      await api.patch(`repair-tasks/${task.id}/`, { is_archived: true });
      onSuccess();
    } catch (err) {
      console.error("Failed to archive task", err);
      setError("Failed to archive task. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        
        <div className="px-6 py-4 bg-teal-500 flex justify-between items-center">
          <div className="flex items-center text-white">
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            <h3 className="font-bold text-lg">Archive Task</h3>
          </div>
          <button onClick={onClose} className="text-teal-100 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-700 mb-4 text-sm leading-relaxed">
            Are you sure you want to archive <strong>{task.title}</strong>?
          </p>

          {error && (
            <div className="mb-4 bg-rose-50 text-rose-600 p-3 rounded-lg text-sm border border-rose-200">
              {error}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={handleArchive}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-white bg-teal-500 hover:bg-teal-600 rounded-xl shadow-sm transition-colors disabled:opacity-70"
          >
            {loading ? 'Archiving...' : 'Yes, Archive Task'}
          </button>
        </div>
      </div>
    </div>
  );
}
