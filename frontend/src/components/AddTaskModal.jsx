import { useState, useEffect } from 'react';
import api from '../api';

export default function AddTaskModal({ onClose, onSuccess, technicians, initialData = {} }) {
  const [title, setTitle] = useState(initialData.title || '');
  const [description, setDescription] = useState(initialData.description || '');
  const [equipmentId, setEquipmentId] = useState(initialData.equipment || '');
  const [technicianId, setTechnicianId] = useState('');
  const [source, setSource] = useState('REACTIVE');
  const [priority, setPriority] = useState(initialData.priority || 'MEDIUM');
  
  const [teamId, setTeamId] = useState('');
  const [assignType, setAssignType] = useState('INDIVIDUAL');
  const [teams, setTeams] = useState([]);
  
  const [equipmentList, setEquipmentList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDependencies = async () => {
      try {
        const [eqRes, teamsRes] = await Promise.all([
          api.get('equipment/'),
          api.get('teams/')
        ]);
        setEquipmentList(eqRes.data);
        setTeams(teamsRes.data);
      } catch (err) {
        console.error("Failed to fetch dependencies", err);
        setError("Failed to load required data.");
      }
    };
    fetchDependencies();
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
      technician: assignType === 'INDIVIDUAL' ? (technicianId || null) : null,
      team: assignType === 'TEAM' ? (teamId || null) : null,
      source,
      source_request: initialData.sourceRequest?.id || null,
      priority
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

          {initialData.sourceRequest && (
            <div className="mb-6 border-l-4 p-4 rounded-r-xl bg-[#0a1c2e] border-[#13e39d]">
              <div className="flex items-start">
                <svg className="w-5 h-5 mt-0.5 mr-3 flex-shrink-0 text-[#13e39d]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {initialData.sourceRequest.source_inspection ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  )}
                </svg>
                <div>
                  <h4 className="text-white font-bold text-sm">
                    {initialData.sourceRequest.source_inspection ? 'Created from failed inspection item' : 'Created from Worker Report'}
                  </h4>
                  <p className="text-gray-300 text-xs mt-1">
                    Submitted by <span className="text-white font-medium">{initialData.sourceRequest.reported_by_name || 'System'}</span> on {initialData.sourceRequest.created_at ? new Date(initialData.sourceRequest.created_at).toLocaleDateString() : new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
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
                <label className="block text-sm font-bold text-gray-700 mb-1">Assign To</label>
                <div className="flex gap-2">
                  <select 
                    value={assignType}
                    onChange={(e) => {
                      setAssignType(e.target.value);
                      setTechnicianId('');
                      setTeamId('');
                    }}
                    className="w-1/3 px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 text-sm"
                  >
                    <option value="INDIVIDUAL">Individual</option>
                    <option value="TEAM">Team</option>
                  </select>
                  
                  {assignType === 'INDIVIDUAL' ? (
                    <select 
                      value={technicianId}
                      onChange={(e) => setTechnicianId(e.target.value)}
                      className="w-2/3 px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 text-sm"
                    >
                      <option value="">Unassigned</option>
                      {technicians.map(tech => (
                        <option key={tech.id} value={tech.id}>{tech.first_name} {tech.last_name || tech.username}</option>
                      ))}
                    </select>
                  ) : (
                    <select 
                      value={teamId}
                      onChange={(e) => setTeamId(e.target.value)}
                      className="w-2/3 px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 text-sm"
                    >
                      <option value="">Unassigned</option>
                      {teams.map(team => (
                        <option key={team.id} value={team.id}>{team.name}</option>
                      ))}
                    </select>
                  )}
                </div>
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

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Priority</label>
              <select 
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 text-sm"
              >
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
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
