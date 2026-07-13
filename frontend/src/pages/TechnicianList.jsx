import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import InviteTechnicianModal from '../components/InviteTechnicianModal';
import EditTechnicianModal from '../components/EditTechnicianModal';
import DeleteTechnicianModal from '../components/DeleteTechnicianModal';

export default function TechnicianList() {
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingTech, setEditingTech] = useState(null);
  const [deletingTech, setDeletingTech] = useState(null);
  const { user } = useAuth();

  const fetchTechnicians = async () => {
    try {
      const response = await api.get('users/');
      const techs = response.data.filter(u => u.role === 'TECHNICIAN');
      setTechnicians(techs);
    } catch (err) {
      setError('Failed to load technicians.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'MANAGER' || user?.role === 'ADMIN') {
      fetchTechnicians();
    }
  }, [user]);

  if (user?.role !== 'MANAGER' && user?.role !== 'ADMIN') {
    return (
      <div className="flex justify-center items-center h-64 text-gray-500">
        You do not have permission to view this page.
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-gray-200 pb-5">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Technicians</h2>
          <p className="text-gray-500 mt-1">
            Manage your maintenance team and invite new technicians.
          </p>
        </div>
        <button 
          onClick={() => setShowInviteModal(true)}
          className="bg-teal-400 hover:bg-teal-500 text-white font-bold py-2 px-5 rounded-xl shadow-sm hover:shadow transition-all flex items-center text-sm flex-shrink-0"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
          Invite Technician
        </button>
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
      ) : technicians.length === 0 ? (
        <div className="w-full h-64 flex flex-col items-center justify-center border border-gray-200 rounded-xl bg-white shadow-sm">
          <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
          <p className="text-gray-500 font-medium text-lg">No technicians found.</p>
          <p className="text-gray-400 text-sm mt-1">Click the invite button above to add someone to the team.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Contact Details
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Joined Date
                  </th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {technicians.map((tech) => (
                  <tr key={tech.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold text-sm">
                          {tech.first_name ? tech.first_name[0].toUpperCase() : tech.username[0].toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-bold text-gray-900">
                            {tech.first_name} {tech.last_name}
                          </div>
                          <div className="text-sm text-gray-500">@{tech.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                        {tech.email}
                      </div>
                      <div className="text-sm text-gray-500 mt-1 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                        {tech.phone_number || 'No phone'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {tech.is_active ? (
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-100 text-emerald-800">
                          Active
                        </span>
                      ) : (
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800">
                          Invited / Pending Setup
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(tech.date_joined).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => setEditingTech(tech)}
                        className="text-teal-600 hover:text-teal-900 mr-4 font-semibold"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => setDeletingTech(tech)}
                        className="text-rose-600 hover:text-rose-900 font-semibold"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showInviteModal && (
        <InviteTechnicianModal
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => {
            setShowInviteModal(false);
            fetchTechnicians();
          }}
        />
      )}

      {editingTech && (
        <EditTechnicianModal
          technician={editingTech}
          onClose={() => setEditingTech(null)}
          onSuccess={() => {
            setEditingTech(null);
            fetchTechnicians();
          }}
        />
      )}

      {deletingTech && (
        <DeleteTechnicianModal
          technician={deletingTech}
          onClose={() => setDeletingTech(null)}
          onSuccess={() => {
            setDeletingTech(null);
            fetchTechnicians();
          }}
        />
      )}
    </div>
  );
}
