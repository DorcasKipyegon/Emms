import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';

export default function QRPortal() {
  const { public_id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEquipment();
  }, [public_id]);

  const fetchEquipment = async () => {
    try {
      const res = await api.get(`public/${public_id}/`);
      setEquipment(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Equipment not found or you do not have permission.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-6 rounded-xl flex items-center shadow-sm">
          <svg className="w-6 h-6 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <span className="font-medium text-lg">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-3xl mx-auto py-8">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-100 text-teal-600 mb-4 shadow-sm border border-teal-200">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">{equipment.name}</h1>
        <p className="text-gray-500 text-lg">Serial/ID: {equipment.serial_number}</p>
        <span className="inline-block mt-3 px-4 py-1.5 bg-teal-50 border border-teal-200 text-teal-700 rounded-full text-sm font-semibold uppercase tracking-wider">
          {equipment.category_name || 'Equipment'}
        </span>
      </div>

      <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm text-center">
        <h2 className="text-2xl font-semibold mb-2 text-gray-800">What would you like to do?</h2>
        <p className="text-gray-500 mb-8">Select an action for this equipment.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button 
            onClick={() => navigate(`/employee-dashboard?qr=${public_id}`)}
            className="group flex flex-col items-center p-8 bg-gray-50 rounded-2xl border-2 border-transparent hover:border-teal-500 hover:bg-teal-50 transition-all cursor-pointer text-center"
          >
            <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center text-teal-600 group-hover:bg-teal-500 group-hover:text-white transition-colors mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Report an Issue</h3>
            <p className="text-gray-500 text-sm">Submit a breakdown or maintenance request for this machine.</p>
          </button>

          <button 
            onClick={() => navigate(`/my-shift?qr=${public_id}`)}
            className="group flex flex-col items-center p-8 bg-gray-50 rounded-2xl border-2 border-transparent hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer text-center"
          >
            <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition-colors mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Manage Shift</h3>
            <p className="text-gray-500 text-sm">Check in to start using this machine, or check out to end your shift.</p>
          </button>
        </div>
      </div>
    </div>
  );
}
