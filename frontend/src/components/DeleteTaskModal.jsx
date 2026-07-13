import { useState } from 'react';
import api from '../api';

export default function DeleteTaskModal({ task, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      await api.delete(`repair-tasks/${task.id}/`);
      onSuccess();
    } catch (err) {
      console.error("Failed to delete task", err);
      setError("Failed to delete task. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm border-4 border-teal-500 p-8 flex flex-col items-center text-center">
        
        <h3 className="font-semibold text-gray-800 text-xl mb-4 w-full text-left">
          Delete Confirmation
        </h3>

        <p className="text-gray-500 text-base mb-8 w-full text-left">
          Are you sure you want to delete <span className="font-bold text-gray-900">"{task.title}"</span>?
        </p>

        {error && (
          <div className="mb-6 w-full bg-rose-50 text-rose-600 p-3 rounded-lg text-sm border border-rose-200 text-left">
            {error}
          </div>
        )}

        <div className="flex justify-center gap-4 w-full">
          <button 
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-medium text-gray-600 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="px-6 py-2.5 text-sm font-medium text-white bg-rose-500 rounded-full hover:bg-rose-600 shadow-sm transition-colors disabled:opacity-70"
          >
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
