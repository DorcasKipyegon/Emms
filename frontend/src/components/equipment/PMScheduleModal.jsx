import React, { useState, useEffect } from 'react';
import api from '../../api';

export default function PMScheduleModal({ isOpen, onClose, equipment }) {
  const [schedules, setSchedules] = useState([]);
  const [inspectionTemplates, setInspectionTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [newSchedule, setNewSchedule] = useState({
    title: '', description: '', trigger_type: 'TIME', 
    frequency_days: '', frequency_hours: '', inspection_template: ''
  });

  const fetchSchedules = async () => {
    if (!equipment) return;
    try {
      const res = await api.get(`schedules/?equipment=${equipment.id}`);
      setSchedules(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await api.get('inspection-templates/');
      setInspectionTemplates(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isOpen && equipment) {
      fetchSchedules();
      fetchTemplates();
    }
  }, [isOpen, equipment]);

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...newSchedule,
        equipment: equipment.id,
        inspection_template: newSchedule.inspection_template || null,
        frequency_days: newSchedule.trigger_type === 'TIME' ? newSchedule.frequency_days : null,
        frequency_hours: newSchedule.trigger_type === 'USAGE' ? newSchedule.frequency_hours : null,
      };
      await api.post('schedules/', payload);
      setNewSchedule({ title: '', description: '', trigger_type: 'TIME', frequency_days: '', frequency_hours: '', inspection_template: '' });
      fetchSchedules();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create schedule');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !equipment) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-bold text-slate-900">PM Schedules - {equipment.name}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-full p-1 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-6">
          {error && <p className="text-sm text-rose-600 bg-rose-50 p-2 rounded">{error}</p>}
          
          <div>
            <h4 className="font-bold text-slate-800 mb-3">Existing Schedules</h4>
            {schedules.length === 0 ? (
              <p className="text-sm text-slate-500 italic bg-slate-50 p-3 rounded-lg border border-dashed border-slate-200">No schedules set.</p>
            ) : (
              <ul className="space-y-3">
                {schedules.map(sch => (
                  <li key={sch.id} className="p-3 border border-slate-200 rounded-lg bg-white shadow-sm flex flex-col gap-1">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-indigo-700">{sch.title}</span>
                      <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-600 rounded-full">{sch.trigger_type}</span>
                    </div>
                    <span className="text-sm text-slate-600">{sch.description}</span>
                    {sch.trigger_type === 'TIME' && <span className="text-xs text-slate-500">Every {sch.frequency_days} days</span>}
                    {sch.trigger_type === 'USAGE' && <span className="text-xs text-slate-500">Every {sch.frequency_hours} hours</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h4 className="font-bold text-slate-800 mb-3">Create New Schedule</h4>
            <form onSubmit={handleCreateSchedule} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Title</label>
                  <input required type="text" value={newSchedule.title} onChange={e => setNewSchedule({...newSchedule, title: e.target.value})} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Trigger Type</label>
                  <select value={newSchedule.trigger_type} onChange={e => setNewSchedule({...newSchedule, trigger_type: e.target.value})} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none">
                    <option value="TIME">Time-based (Days)</option>
                    <option value="USAGE">Usage-based (Hours)</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                <textarea required value={newSchedule.description} onChange={e => setNewSchedule({...newSchedule, description: e.target.value})} rows="2" className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"></textarea>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {newSchedule.trigger_type === 'TIME' ? (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Frequency (Days)</label>
                    <input required type="number" min="1" value={newSchedule.frequency_days} onChange={e => setNewSchedule({...newSchedule, frequency_days: e.target.value})} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none" />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Frequency (Hours)</label>
                    <input required type="number" min="1" step="0.1" value={newSchedule.frequency_hours} onChange={e => setNewSchedule({...newSchedule, frequency_hours: e.target.value})} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none" />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Inspection Template (Optional)</label>
                  <select value={newSchedule.inspection_template} onChange={e => setNewSchedule({...newSchedule, inspection_template: e.target.value})} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none">
                    <option value="">-- No Checklist --</option>
                    {inspectionTemplates.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={loading} className="bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm">
                  {loading ? 'Saving...' : 'Create Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
