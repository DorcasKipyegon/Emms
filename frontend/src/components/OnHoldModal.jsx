import { useState } from 'react';
import api from '../api';

export default function OnHoldModal({ task, onClose, onSuccess }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const MAX_CHARS = 255;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("A reason is required to put the task on hold.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.patch(`repair-tasks/${task.id}/`, {
        status: 'ON_HOLD',
        on_hold_reason: reason.trim()
      });
      onSuccess();
    } catch (err) {
      console.error("Failed to put task on hold", err);
      setError("Failed to update status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        
        <div className="px-6 py-4 border-b border-teal-100 bg-teal-50/50 flex justify-between items-center">
          <div className="flex items-center text-teal-600">
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="font-bold text-lg">Put Task On Hold</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            You are pausing work on <strong>{task.title}</strong>. Please provide a brief reason.
          </p>

          {error && (
            <div className="mb-4 bg-rose-50 text-rose-600 p-3 rounded-lg text-sm border border-rose-200">
              {error}
            </div>
          )}

          <form id="on-hold-task-form" onSubmit={handleSubmit}>
            <div className="flex justify-between items-end mb-1">
              <label className="block text-sm font-bold text-gray-700">Reason <span className="text-rose-500">*</span></label>
              <span className={`text-xs font-medium ${reason.length >= MAX_CHARS ? 'text-rose-500' : 'text-gray-500'}`}>
                {reason.length}/{MAX_CHARS}
              </span>
            </div>
            <textarea 
              rows="3"
              value={reason}
              maxLength={MAX_CHARS}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 text-sm resize-none"
              placeholder="e.g. Waiting for a replacement AC filter to arrive..."
              required
            ></textarea>
          </form>
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
            type="submit"
            form="on-hold-task-form"
            disabled={loading || !reason.trim()}
            className="px-4 py-2 text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl shadow-sm transition-colors disabled:opacity-70"
          >
            {loading ? 'Saving...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
