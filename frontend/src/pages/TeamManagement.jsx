import { useState, useEffect } from 'react';
import api from '../api';

export default function TeamManagement() {
  const [teams, setTeams] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form State
  const [teamName, setTeamName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [teamsRes, usersRes] = await Promise.all([
        api.get('teams/'),
        api.get('users/')
      ]);
      setTeams(teamsRes.data);
      setTechnicians(usersRes.data.filter(u => u.role === 'TECHNICIAN'));
    } catch (err) {
      console.error('Failed to load team data', err);
      setError('Failed to load teams.');
    } finally {
      setLoading(false);
    }
  };

  const handleMemberToggle = (techId) => {
    setSelectedMembers(prev => 
      prev.includes(techId) ? prev.filter(id => id !== techId) : [...prev, techId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!teamName) return;

    setIsSubmitting(true);
    try {
      const payload = { name: teamName, members: selectedMembers };
      if (editingTeam) {
        await api.patch(`teams/${editingTeam.id}/`, payload);
      } else {
        await api.post('teams/', payload);
      }
      setTeamName('');
      setSelectedMembers([]);
      setEditingTeam(null);
      fetchData();
    } catch (err) {
      console.error('Failed to save team', err);
      alert('Failed to save team. Name must be unique.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (team) => {
    setEditingTeam(team);
    setTeamName(team.name);
    setSelectedMembers(team.members || []);
  };

  const handleDelete = async (teamId) => {
    if (!window.confirm("Are you sure you want to delete this team?")) return;
    try {
      await api.delete(`teams/${teamId}/`);
      fetchData();
    } catch (err) {
      console.error('Failed to delete team', err);
      alert('Failed to delete team.');
    }
  };

  const cancelEdit = () => {
    setEditingTeam(null);
    setTeamName('');
    setSelectedMembers([]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Maintenance Teams</h2>
          <p className="text-gray-500 mt-1">Group technicians into teams for bulk task assignment.</p>
        </div>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Form Side */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 sticky top-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">{editingTeam ? 'Edit Team' : 'Create New Team'}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
                  <input 
                    required 
                    type="text" 
                    value={teamName} 
                    onChange={(e) => setTeamName(e.target.value)} 
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                    placeholder="e.g. Electrical Squad"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Team Members</label>
                  <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                    {technicians.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-2">No technicians available.</p>
                    ) : (
                      technicians.map(tech => (
                        <label key={tech.id} className="flex items-center p-2 hover:bg-white rounded cursor-pointer transition-colors border border-transparent hover:border-gray-200 shadow-sm hover:shadow">
                          <input 
                            type="checkbox" 
                            checked={selectedMembers.includes(tech.id)}
                            onChange={() => handleMemberToggle(tech.id)}
                            className="w-4 h-4 text-teal-500 rounded border-gray-300 focus:ring-teal-500"
                          />
                          <span className="ml-3 text-sm font-medium text-gray-900 flex-1">
                            {tech.first_name} {tech.last_name || tech.username}
                          </span>
                          {!tech.is_active && (
                            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full ml-2">Invited</span>
                          )}
                        </label>
                      ))
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Select the technicians that belong to this team.</p>
                </div>

                <div className="pt-4 flex gap-3">
                  {editingTeam && (
                    <button 
                      type="button" 
                      onClick={cancelEdit}
                      className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  <button 
                    type="submit" 
                    disabled={isSubmitting || !teamName}
                    className="flex-1 bg-teal-500 hover:bg-teal-600 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : (editingTeam ? 'Update Team' : 'Create Team')}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* List Side */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="font-bold text-gray-900">Existing Teams</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {teams.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    No teams created yet.
                  </div>
                ) : (
                  teams.map(team => (
                    <div key={team.id} className="p-6 flex flex-col sm:flex-row gap-4 justify-between hover:bg-gray-50 transition-colors">
                      <div>
                        <h4 className="font-bold text-lg text-gray-900 flex items-center">
                          <svg className="w-5 h-5 mr-2 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                          {team.name}
                        </h4>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {team.members_data && team.members_data.length > 0 ? (
                            team.members_data.map(member => (
                              <span key={member.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800 border border-teal-200">
                                {member.first_name} {member.last_name || member.username}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-gray-400 italic">No members assigned</span>
                          )}
                        </div>
                      </div>
                      <div className="flex sm:flex-col items-center gap-2 justify-start sm:justify-center">
                        <button 
                          onClick={() => handleEdit(team)}
                          className="px-3 py-1.5 text-sm font-medium text-teal-600 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors w-full text-center border border-teal-100"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(team.id)}
                          className="px-3 py-1.5 text-sm font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors w-full text-center border border-rose-100"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
