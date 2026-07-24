import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const QRPortal = () => {
  const { public_id } = useParams();
  const { user, token } = useAuth();
  
  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  
  const [issueTitle, setIssueTitle] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [submittingIssue, setSubmittingIssue] = useState(false);
  const [issueSuccess, setIssueSuccess] = useState(false);

  useEffect(() => {
    fetchEquipment();
  }, [public_id]);

  const fetchEquipment = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/api/equipment/public/${public_id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEquipment(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Equipment not found or you do not have permission.');
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (equipment) {
      const getSession = async () => {
        try {
          const res = await axios.get(`http://localhost:8000/api/sessions/?user=${user.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const active = res.data.find(s => s.equipment === equipment.id && s.end_time === null);
          if (active) setActiveSession(active);
        } catch (e) {
          console.error(e);
        }
      }
      getSession();
    }
  }, [equipment, token, user.id]);

  const handleCheckIn = async () => {
    try {
      const res = await axios.post(`http://localhost:8000/api/sessions/check_in/`, {
        equipment_id: equipment.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActiveSession(res.data);
    } catch (err) {
      alert("Failed to check in");
    }
  };

  const handleCheckOut = async () => {
    try {
      await axios.post(`http://localhost:8000/api/sessions/check_out/`, {
        equipment_id: equipment.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActiveSession(null);
    } catch (err) {
      alert("Failed to check out");
    }
  };

  const handleSubmitIssue = async (e) => {
    e.preventDefault();
    setSubmittingIssue(true);
    try {
      await axios.post(`http://localhost:8000/api/requests/`, {
        public_id: public_id,
        title: issueTitle,
        description: issueDescription
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIssueSuccess(true);
      setIssueTitle('');
      setIssueDescription('');
    } catch (err) {
      alert("Failed to submit issue");
    } finally {
      setSubmittingIssue(false);
    }
  };

  if (loading) return <div className="h-screen w-screen bg-gray-950 flex items-center justify-center text-white"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;
  if (error) return <div className="h-screen w-screen bg-gray-950 flex items-center justify-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 font-sans">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-100 mb-2">{equipment.name}</h1>
          <p className="text-gray-400">ID: {equipment.serial_number}</p>
          <span className="inline-block mt-2 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">
            {equipment.category_name || 'Equipment'}
          </span>
        </div>

        {/* Shift Tracking Box */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 shadow-xl mb-6 text-center">
          <h2 className="text-xl font-semibold mb-4">Shift Status</h2>
          {activeSession ? (
            <div>
              <p className="text-green-400 font-medium mb-4 flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                You are currently checked in
              </p>
              <button 
                onClick={handleCheckOut}
                className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
              >
                Check Out (End Shift)
              </button>
            </div>
          ) : (
            <div>
              <p className="text-gray-400 mb-4">You are not checked in to this machine.</p>
              <button 
                onClick={handleCheckIn}
                className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-500/20"
              >
                Check In (Start Shift)
              </button>
            </div>
          )}
        </div>

        {/* Report Issue Box */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 shadow-xl">
          <h2 className="text-xl font-semibold mb-4">Report an Issue</h2>
          
          {issueSuccess ? (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
              <p className="text-green-400 font-medium">Issue reported successfully!</p>
              <button onClick={() => setIssueSuccess(false)} className="mt-3 text-sm text-gray-400 hover:text-white underline">Report another</button>
            </div>
          ) : (
            <form onSubmit={handleSubmitIssue} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Issue Summary</label>
                <input 
                  type="text"
                  required
                  value={issueTitle}
                  onChange={e => setIssueTitle(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="e.g. Keyboard stopped working"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Details</label>
                <textarea 
                  required
                  value={issueDescription}
                  onChange={e => setIssueDescription(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors min-h-[100px]"
                  placeholder="Please describe what happened..."
                />
              </div>
              <button 
                disabled={submittingIssue}
                type="submit"
                className="w-full py-3 bg-white text-black hover:bg-gray-200 disabled:opacity-50 rounded-xl font-medium transition-colors"
              >
                {submittingIssue ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          )}
        </div>
        
        <div className="text-center mt-8">
           <a href="/" className="text-gray-500 text-sm hover:text-white underline">Back to Dashboard</a>
        </div>
      </div>
    </div>
  );
};

export default QRPortal;
