import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import SearchableSelect from '../components/SearchableSelect';

export default function MyShift() {
  const { user } = useAuth();
  const location = useLocation();
  const [equipmentList, setEquipmentList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [equipmentId, setEquipmentId] = useState('');
  const [activeSession, setActiveSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const res = await api.get('equipment/');
      setEquipmentList(res.data);
      
      const queryParams = new URLSearchParams(location.search);
      const qrId = queryParams.get('qr');
      let defaultEqId = '';
      if (qrId) {
        const eq = res.data.find(e => e.public_id === qrId);
        if (eq) {
          defaultEqId = eq.id;
          setEquipmentId(eq.id);
        }
        // Clear the qr parameter from the URL so it doesn't stick around on refresh
        window.history.replaceState({}, document.title, location.pathname);
      }
      
      // If we have an equipment ID (either from QR or we'll select one later),
      // we don't necessarily fetch session until one is selected.
      // But we CAN fetch all sessions for the user to see if they are ALREADY checked in somewhere.
      fetchUserSessions(res.data, defaultEqId);
      
    } catch (err) {
      console.error(err);
      setError("Failed to load equipment data.");
      setLoading(false);
    }
  };

  const fetchUserSessions = async (eqList, defaultEqId) => {
    try {
      const res = await api.get(`sessions/?user=${user.id}`);
      // Find ANY active session
      const active = res.data.find(s => s.end_time === null);
      if (active) {
        setActiveSession(active);
        setEquipmentId(active.equipment); // Automatically select the one they are checked into
      } else if (defaultEqId) {
        setEquipmentId(defaultEqId);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!equipmentId) return;
    setSessionLoading(true);
    setError(null);
    try {
      const res = await api.post(`sessions/check_in/`, {
        equipment_id: equipmentId
      });
      setActiveSession(res.data);
      await fetchEquipment(); // Refresh equipment list to update active_session_user
    } catch (err) {
      setError("Failed to check in.");
      console.error(err);
    } finally {
      setSessionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!activeSession) return;
    setSessionLoading(true);
    setError(null);
    try {
      await api.post(`sessions/check_out/`, {
        equipment_id: activeSession.equipment
      });
      setActiveSession(null);
      await fetchEquipment(); // Refresh equipment list to update active_session_user
    } catch (err) {
      setError("Failed to check out.");
      console.error(err);
    } finally {
      setSessionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const selectedEquipment = equipmentList.find(eq => eq.id == equipmentId);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-2xl mx-auto">
      <div className="border-b border-gray-200 pb-5">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">My Shift</h2>
        <p className="text-gray-500 mt-1">Check in and out of equipment to log your active shifts.</p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-lg flex items-center">
          <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Equipment</label>
          <SearchableSelect 
            value={equipmentId}
            onChange={setEquipmentId}
            disabled={activeSession !== null} // Cannot change equipment while checked in
            options={equipmentList.map(eq => ({ value: eq.id, label: `${eq.name} (${eq.serial_number})` }))}
            placeholder="-- Choose Equipment --"
          />
          {activeSession && <p className="text-xs text-gray-500 mt-2">You must check out before selecting a different machine.</p>}
        </div>

        {selectedEquipment && (
          <div className="mt-6 p-6 rounded-xl border border-gray-100 bg-gray-50 text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Shift Status</h3>
            
            {activeSession && activeSession.equipment == equipmentId ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-teal-600 font-medium bg-teal-50 p-3 rounded-lg border border-teal-100">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse"></span>
                  Currently Checked In to {selectedEquipment.name}
                </div>
                <button 
                  onClick={handleCheckOut}
                  disabled={sessionLoading}
                  className="w-full py-3 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-gray-800 rounded-xl font-medium transition-colors shadow-sm border border-gray-300"
                >
                  {sessionLoading ? 'Processing...' : 'Check Out (End Shift)'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedEquipment.active_session_user ? (
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg text-left">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-yellow-500 mt-0.5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <h4 className="text-sm font-bold">Machine in Use</h4>
                        <p className="text-sm mt-1">
                          <span className="font-semibold">{selectedEquipment.active_session_user}</span> is currently checked into this machine. Are you taking over?
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 bg-gray-100 p-3 rounded-lg border border-gray-200">
                    You are not currently checked into {selectedEquipment.name}.
                  </p>
                )}
                
                <button 
                  onClick={handleCheckIn}
                  disabled={sessionLoading}
                  className={`w-full py-3 disabled:opacity-50 text-white rounded-xl font-medium transition-colors shadow-sm ${
                    selectedEquipment.active_session_user 
                      ? 'bg-yellow-500 hover:bg-yellow-600' 
                      : 'bg-teal-500 hover:bg-teal-600'
                  }`}
                >
                  {sessionLoading 
                    ? 'Processing...' 
                    : (selectedEquipment.active_session_user ? 'Take Over Shift' : 'Check In (Start Shift)')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
