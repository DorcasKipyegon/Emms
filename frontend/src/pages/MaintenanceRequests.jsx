import { useState, useEffect } from 'react';
import api from '../api';
import AddTaskModal from '../components/AddTaskModal';

export default function MaintenanceRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING'); // PENDING, APPROVED, REJECTED
  
  const [technicians, setTechnicians] = useState([]);
  const [approvingRequest, setApprovingRequest] = useState(null);
  
  const [rejectingRequest, setRejectingRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchRequests();
    fetchTechnicians();
  }, [filter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get(`maintenance-requests/?status=${filter}`);
      setRequests(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const res = await api.get('users/?role=TECHNICIAN');
      setTechnicians(res.data);
    } catch (err) {
      console.error('Error fetching technicians', err);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`maintenance-requests/${rejectingRequest.id}/`, {
        status: 'REJECTED',
        rejection_reason: rejectionReason
      });
      setRejectingRequest(null);
      setRejectionReason('');
      fetchRequests();
    } catch (err) {
      console.error(err);
      alert('Failed to reject request');
    }
  };

  const handleApproveSuccess = async () => {
    try {
      // The task was created. Now mark request as approved.
      await api.patch(`maintenance-requests/${approvingRequest.id}/`, {
        status: 'APPROVED'
      });
      setApprovingRequest(null);
      fetchRequests();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0a1c2e]">Maintenance Requests</h1>
          <p className="text-gray-500 mt-1">Review and triage requests generated from failed inspections.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100 px-6 py-4 flex gap-6">
          {['PENDING', 'APPROVED', 'REJECTED'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`font-bold pb-4 -mb-4 px-2 border-b-2 transition-colors ${
                filter === status 
                  ? 'border-[#13e39d] text-[#0a1c2e]' 
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading requests...</div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
              </div>
              <p className="text-gray-500">No {filter.toLowerCase()} requests found.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {requests.map(req => (
                <div key={req.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <span className="bg-teal-50 text-teal-700 text-xs font-bold px-2 py-1 rounded-md">
                      {req.equipment_name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(req.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-gray-900 mb-2">{req.title}</h3>
                  <p className="text-sm text-gray-600 mb-4 whitespace-pre-wrap line-clamp-4">{req.description}</p>
                  
                  <div className="text-xs text-gray-500 mb-4">
                    Reported by: <span className="font-semibold text-gray-700">{req.reported_by_name || 'System'}</span>
                  </div>

                  {filter === 'PENDING' && (
                    <div className="flex gap-2 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => setApprovingRequest(req)}
                        className="flex-1 bg-[#13e39d] hover:bg-[#10c88a] text-[#0a1c2e] text-sm font-bold py-2 rounded-lg transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setRejectingRequest(req)}
                        className="flex-1 bg-white hover:bg-gray-50 text-rose-500 border border-gray-200 text-sm font-bold py-2 rounded-lg transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                  {filter === 'REJECTED' && req.rejection_reason && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-xs font-bold text-rose-700 mb-1">Rejection Reason:</p>
                      <p className="text-sm text-gray-600 italic">{req.rejection_reason}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {approvingRequest && (
        <AddTaskModal
          technicians={technicians}
          initialData={{
            title: approvingRequest.title,
            description: approvingRequest.description,
            equipment: approvingRequest.equipment,
            priority: approvingRequest.suggested_priority,
            source: 'REACTIVE'
          }}
          onClose={() => setApprovingRequest(null)}
          onSuccess={handleApproveSuccess}
        />
      )}

      {rejectingRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="bg-rose-50 px-6 py-4 border-b border-rose-100 flex justify-between items-center">
              <h3 className="font-bold text-rose-900 text-lg">Reject Request</h3>
              <button onClick={() => setRejectingRequest(null)} className="text-rose-400 hover:text-rose-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleReject} className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to reject this request? It will not be converted into a repair task.
              </p>
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">Rejection Reason (Optional)</label>
                <textarea
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm"
                  rows="3"
                  placeholder="Explain why this request is being rejected..."
                ></textarea>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setRejectingRequest(null)}
                  className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-lg shadow-sm shadow-rose-500/20"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
