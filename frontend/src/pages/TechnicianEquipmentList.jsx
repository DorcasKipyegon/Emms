import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function TechnicianEquipmentList() {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMyEquipment = async () => {
      try {
        const response = await api.get('equipment/my_equipment/');
        setEquipment(response.data);
      } catch (err) {
        console.error("Failed to fetch equipment", err);
        setError("Failed to load your equipment.");
      } finally {
        setLoading(false);
      }
    };
    fetchMyEquipment();
  }, []);

  if (loading) return <div className="text-gray-500 flex justify-center py-10">Loading your equipment...</div>;
  if (error) return <div className="text-rose-500 bg-rose-50 p-4 rounded-xl">{error}</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">My Equipment</h2>
        <p className="text-gray-500 mt-1">
          Machines you have worked on or are currently assigned to.
        </p>
      </div>

      {equipment.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-gray-500">You haven't been assigned to any equipment yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {equipment.map(eq => (
            <Link 
              key={eq.id} 
              to={`/my-equipment/${eq.id}`}
              className="block bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow hover:border-teal-200"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-gray-900 text-lg">{eq.name}</h3>
                <span className={`px-2 py-1 text-xs font-bold rounded-md ${
                  eq.status === 'OPERATIONAL' ? 'bg-emerald-100 text-emerald-700' : 
                  eq.status === 'MAINTENANCE' ? 'bg-amber-100 text-amber-700' : 
                  'bg-rose-100 text-rose-700'
                }`}>
                  {eq.status}
                </span>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <p><span className="font-medium text-gray-900">SN:</span> {eq.serial_number}</p>
                <p><span className="font-medium text-gray-900">Category:</span> {eq.category_name || 'N/A'}</p>
              </div>
              <div className="mt-4 text-sm font-bold text-teal-600 flex items-center">
                View Details
                <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
