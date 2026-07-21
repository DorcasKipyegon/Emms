import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';

export default function WorkerDashboard() {
  const { user } = useAuth();
  const [equipmentList, setEquipmentList] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [equipmentId, setEquipmentId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [eqRes, reqRes] = await Promise.all([
        api.get('equipment/'),
        api.get('maintenance-requests/')
      ]);
      setEquipmentList(eqRes.data);
      setMyRequests(reqRes.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!equipmentId || !title || !description) return;
    
    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const formData = new FormData();
      formData.append('equipment', equipmentId);
      formData.append('title', title);
      formData.append('description', description);
      if (photo) {
        formData.append('photo', photo);
      }

      await api.post('maintenance-requests/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccessMsg("Breakdown reported successfully!");
      setEquipmentId('');
      setTitle('');
      setDescription('');
      setPhoto(null);
      // Reset file input visually
      document.getElementById('photo-upload').value = '';
      fetchData();
    } catch (err) {
      console.error(err);
      setError("Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-gray-200 pb-5">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Report a Breakdown</h2>
          <p className="text-gray-500 mt-1">Submit an issue with equipment to the maintenance team.</p>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-lg flex items-center">
          <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          {error}
        </div>
      )}

      {successMsg && (
        <div className="bg-teal-50 border border-teal-200 text-teal-800 p-4 rounded-lg flex items-center">
          <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Equipment *</label>
                <select 
                  required
                  value={equipmentId}
                  onChange={(e) => setEquipmentId(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="">Select equipment...</option>
                  {equipmentList.map(eq => (
                    <option key={eq.id} value={eq.id}>{eq.name} ({eq.serial_number})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input 
                  required
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Brief description of the issue"
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Details *</label>
                <textarea 
                  required
                  rows="4"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What went wrong? Where is it located?"
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Photo (Optional)</label>
                <input 
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhoto(e.target.files[0])}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 transition-all cursor-pointer border border-gray-200 rounded-lg p-2"
                />
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-4 rounded-xl shadow transition-colors disabled:opacity-50 mt-2"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </form>
          </div>
        </div>

        {/* My Reports */}
        <div className="lg:col-span-2">
          <h3 className="text-xl font-bold text-gray-900 mb-4">My Reports</h3>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {myRequests.length === 0 ? (
              <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center">
                <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <p>You haven't submitted any reports yet.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {myRequests.map(req => (
                  <li key={req.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-bold text-lg text-gray-900">{req.title}</h4>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                            ${req.status === 'PENDING' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                              req.status === 'APPROVED' ? 'bg-teal-100 text-teal-800 border border-teal-200' :
                              'bg-rose-100 text-rose-800 border border-rose-200'
                            }
                          `}>
                            {req.status}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-700 mb-2">{req.equipment_name}</p>
                        <p className="text-sm text-gray-600 line-clamp-2">{req.description}</p>
                        
                        {req.photo && (
                          <div className="mt-3">
                            <a href={req.photo} target="_blank" rel="noreferrer" className="text-teal-600 hover:text-teal-700 text-sm font-medium flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                              View Attached Photo
                            </a>
                          </div>
                        )}
                        
                        {req.status === 'REJECTED' && req.rejection_reason && (
                          <div className="mt-3 bg-rose-50 border border-rose-100 rounded p-3 text-sm text-rose-800">
                            <strong>Reason for rejection:</strong> {req.rejection_reason}
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 whitespace-nowrap">
                        {new Date(req.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
