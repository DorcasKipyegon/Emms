import React from 'react';
import { Link } from 'react-router-dom';

export default function ViewTaskModal({ task, onClose }) {
  if (!task) return null;

  const parseAISteps = (stepsStr) => {
    if (!stepsStr) return [];
    try {
      let parsed = stepsStr;
      if (typeof parsed === 'string' && parsed.startsWith('[')) {
        parsed = parsed.replace(/'/g, '"');
        parsed = JSON.parse(parsed);
      }
      if (Array.isArray(parsed)) return parsed;
      return stepsStr.split('\n').filter(s => s.trim());
    } catch (e) {
      return stepsStr.split('\n').filter(s => s.trim());
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'CANCELLED': return 'bg-rose-100 text-rose-800';
      default: return 'bg-amber-100 text-amber-800';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[1.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="font-bold text-gray-900 text-lg">Task Details</h3>
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
        <div className="p-6 overflow-y-auto flex-grow space-y-6">
          
          <div>
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-xl font-bold text-gray-900">{task.title}</h2>
              <span className={`px-2.5 py-1 text-xs font-bold rounded-md whitespace-nowrap ml-3 ${getStatusColor(task.status)}`}>
                {task.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-gray-600 text-sm whitespace-pre-wrap">{task.description}</p>
            
            {task.ai_troubleshooting_steps && (() => {
              const steps = parseAISteps(task.ai_troubleshooting_steps);
              return (
                <details className="mt-4 group bg-[#f0f9ff] border border-[#bce3ff] rounded-lg overflow-hidden [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex items-center justify-between p-3 cursor-pointer select-none">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <h4 className="font-bold text-blue-900 text-xs uppercase tracking-wider">AI Suggestions ({steps.length})</h4>
                    </div>
                    <svg className="w-4 h-4 text-blue-500 transition-transform duration-200 group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-3 pb-3 border-t border-[#bce3ff]/50 pt-2 bg-white/50">
                    <ul className="list-disc pl-5 text-sm text-blue-800 space-y-1.5">
                      {steps.map((step, idx) => (
                        <li key={idx} className="leading-relaxed">{step}</li>
                      ))}
                    </ul>
                  </div>
                </details>
              );
            })()}
          </div>

          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1">Equipment</p>
              <p className="text-sm font-semibold text-gray-900">{task.equipment_name || `ID #${task.equipment}`}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1">Technician</p>
              <p className="text-sm font-semibold text-gray-900">{task.technician_name || 'Unassigned'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1">Source</p>
              <p className="text-sm font-semibold text-gray-900">{task.source}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1">Created At</p>
              <p className="text-sm font-semibold text-gray-900">{new Date(task.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          {task.completion_notes && (
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-2">
                {task.status === 'CANCELLED' ? 'Cancellation Reason' : 'Completion Notes'}
              </h4>
              <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{task.completion_notes}</p>
              </div>
            </div>
          )}

        </div>

        {task.source_request_info && (
          <div className="px-6 pb-4">
            <h4 className="text-sm font-bold text-gray-900 mb-2">Origin</h4>
            <div className="bg-[#0a1c2e] p-4 rounded-xl border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex-grow">
                <p className="text-sm text-gray-300 font-medium mb-1">
                  This task was created from a {task.source_request_info.is_from_inspection ? 'failed inspection' : 'Worker Report'} submitted by <span className="text-white font-bold">{task.source_request_info.reported_by_name}</span> on {new Date(task.source_request_info.created_at).toLocaleDateString()}:
                </p>
                <p className="text-xs text-gray-400 italic bg-gray-900/50 p-2 rounded line-clamp-2">
                  "{task.source_request_info.description}"
                </p>
              </div>
              <Link 
                to="/requests"
                className="whitespace-nowrap px-4 py-2 text-xs font-bold text-[#0a1c2e] bg-[#13e39d] hover:bg-[#10c88a] rounded-lg shadow-sm transition-colors"
                onClick={onClose}
              >
                View original report
              </Link>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
          <button 
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-sm font-bold text-white bg-gray-800 hover:bg-gray-900 rounded-xl shadow-md transition-all"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
