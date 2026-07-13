import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';

export default function TechnicianEquipmentDetail() {
  const { id } = useParams();
  const [equipment, setEquipment] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eqRes, tasksRes] = await Promise.all([
          api.get(`equipment/${id}/`),
          api.get(`repair-tasks/?equipment=${id}`)
        ]);
        setEquipment(eqRes.data);
        setTasks(tasksRes.data);
      } catch (err) {
        console.error("Failed to fetch equipment details", err);
        setError("Failed to load equipment details.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="text-gray-500 flex justify-center py-10">Loading details...</div>;
  if (error) return <div className="text-rose-500 bg-rose-50 p-4 rounded-xl">{error}</div>;
  if (!equipment) return null;

  // Aggregate parts used
  const partsSummary = {};
  tasks.forEach(task => {
    task.parts_used?.forEach(part => {
      const name = part.spare_part_name;
      partsSummary[name] = (partsSummary[name] || 0) + part.quantity_used;
    });
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/my-equipment" className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Equipment Details</h2>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Info Header Box */}
        <div className="p-6 bg-slate-900 text-white flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-teal-400">{equipment.name}</h1>
              <span className={`px-2 py-1 text-xs font-bold rounded-md ${
                equipment.status === 'OPERATIONAL' ? 'bg-emerald-500/20 text-emerald-400' : 
                equipment.status === 'MAINTENANCE' ? 'bg-amber-500/20 text-amber-400' : 
                'bg-rose-500/20 text-rose-400'
              }`}>
                {equipment.status}
              </span>
            </div>
            <p className="text-slate-300">SN: {equipment.serial_number} <span className="mx-2">|</span> Category: {equipment.category_name || 'None'}</p>
          </div>
        </div>

        <div className="p-6 space-y-8">
          
          {/* Runtime Box */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
            <h3 className="font-bold text-slate-800 text-lg mb-3">Runtime Tracking</h3>
            <div className="flex flex-col md:flex-row md:items-end gap-6">
              <div>
                <p className="text-sm text-slate-500 mb-1">Current Runtime</p>
                <p className="text-2xl font-black text-slate-700">{equipment.current_runtime_hours} <span className="text-base font-normal text-slate-500">hrs</span></p>
              </div>
            </div>
          </div>

          {/* Manuals & Documents */}
          <div>
            <h3 className="font-bold text-slate-800 text-lg mb-3 flex items-center border-b pb-2">
              <svg className="w-5 h-5 mr-2 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              Manuals & Documents
            </h3>
            {(!equipment.documents || equipment.documents.length === 0) ? (
              <p className="text-sm text-slate-500 italic">No documents available.</p>
            ) : (
              <ul className="space-y-2">
                {equipment.documents.map(doc => (
                  <li key={doc.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-sm font-medium text-slate-700">{doc.title}</span>
                    <a 
                      href={doc.file} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-xs font-bold text-teal-600 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-md transition-colors"
                    >
                      View
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Maintenance History */}
          <div>
            <h3 className="font-bold text-slate-800 text-lg mb-3 flex items-center border-b pb-2">
              <svg className="w-5 h-5 mr-2 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              Maintenance History
            </h3>
            {tasks.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No task history recorded.</p>
            ) : (
              <ul className="space-y-3">
                {tasks.map(task => (
                  <li key={task.id} className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-slate-800 text-sm">{task.title}</span>
                      <span className="text-xs font-bold text-slate-500">{task.status}</span>
                    </div>
                    {task.completion_notes && (
                      <p className="text-sm text-slate-600 mb-1">"{task.completion_notes}"</p>
                    )}
                    <p className="text-xs text-slate-400 font-medium">
                      {task.end_time ? new Date(task.end_time).toLocaleDateString() : 'N/A'}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Parts Used */}
          <div>
            <h3 className="font-bold text-slate-800 text-lg mb-3 flex items-center border-b pb-2">
              <svg className="w-5 h-5 mr-2 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Parts Used on This Machine
            </h3>
            {Object.keys(partsSummary).length === 0 ? (
              <p className="text-sm text-slate-500 italic">No parts have been used historically.</p>
            ) : (
              <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 pl-2">
                {Object.entries(partsSummary).map(([name, qty]) => (
                  <li key={name}>
                    {name} <span className="font-bold text-slate-800">x{qty}</span>
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
