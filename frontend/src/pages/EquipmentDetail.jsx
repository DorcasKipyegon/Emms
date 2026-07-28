import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';

// Modals
import EditEquipmentModal from '../components/equipment/EditEquipmentModal';
import QRModal from '../components/equipment/QRModal';
import PMScheduleModal from '../components/equipment/PMScheduleModal';
import DocumentVaultModal from '../components/equipment/DocumentVaultModal';

export default function EquipmentDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const isManager = user?.role === 'MANAGER' || user?.role === 'ADMIN';

  const [equipment, setEquipment] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [requests, setRequests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  const [showDowntimeModal, setShowDowntimeModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [historyFilter, setHistoryFilter] = useState('all');

  // Manager Modals State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isPmModalOpen, setIsPmModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      const promises = [
        api.get(`equipment/${id}/`),
        api.get(`repair-tasks/?equipment=${id}`)
      ];
      if (isManager) {
        promises.push(api.get(`maintenance-requests/?equipment=${id}`));
        promises.push(api.get('categories/'));
      }
      
      const results = await Promise.all(promises);
      setEquipment(results[0].data);
      setTasks(results[1].data);
      if (isManager) {
        setRequests(results[2].data);
        setCategories(results[3].data);
      }
    } catch (err) {
      console.error("Failed to fetch equipment details", err);
      setError("Failed to load equipment details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, isManager]);

  if (loading) return (
    <div className="flex h-[50vh] items-center justify-center">
      <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  if (error) return <div className="text-rose-500 bg-rose-50 p-4 rounded-xl max-w-4xl mx-auto">{error}</div>;
  if (!equipment) return null;

  // Detailed parts used
  const allParts = tasks.flatMap(task => 
    (task.parts_used || []).map(part => ({
      ...part,
      task_id: task.id,
      task_title: task.title,
      technician: task.technician_name,
      date: task.end_time || task.created_at
    }))
  ).sort((a, b) => new Date(b.date) - new Date(a.date));

  const getCategoryIcon = (category) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('conveyor') || cat.includes('machinery')) {
      return <svg className="w-8 h-8 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>;
    }
    if (cat.includes('generator') || cat.includes('electrical')) {
      return <svg className="w-8 h-8 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
    }
    if (cat.includes('desktop') || cat.includes('computer')) {
      return <svg className="w-8 h-8 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
    }
    if (cat.includes('printer')) {
      return <svg className="w-8 h-8 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>;
    }
    if (cat.includes('vehicle') || cat.includes('truck')) {
      return <svg className="w-8 h-8 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>;
    }
    return <svg className="w-8 h-8 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
  };

  const filteredTasks = tasks.filter(task => {
    if (historyFilter === 'open' && (task.status !== 'PENDING' && task.status !== 'IN_PROGRESS')) return false;
    if (historyFilter === 'repairs' && (task.is_inspection || task.source !== 'REACTIVE')) return false;
    if (historyFilter === 'pm' && task.source !== 'PREVENTIVE') return false;
    if (historyFilter === 'inspections' && !task.is_inspection) return false;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        task.title?.toLowerCase().includes(term) ||
        `wo-${task.id}`.includes(term) ||
        task.status?.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const exportHistory = () => {
    const headers = ['WO ID', 'Title', 'Status', 'Date', 'Technician', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...filteredTasks.map(t => [
        `WO-${t.id}`,
        `"${t.title.replace(/"/g, '""')}"`,
        t.status,
        t.end_time ? new Date(t.end_time).toLocaleDateString() : (t.created_at ? new Date(t.created_at).toLocaleDateString() : ''),
        `"${(t.technician_name || '').replace(/"/g, '""')}"`,
        `"${(t.completion_notes || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `equipment_${equipment.serial_number}_history.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openWorkOrders = tasks.filter(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS').length;
  
  // Calculate Uptime if downtime is > 0, otherwise default to 100%
  const runtime = parseFloat(equipment.current_runtime_hours) || 0;
  const downtime = parseFloat(equipment.total_downtime_hours) || 0;
  const totalTime = runtime + downtime;
  const uptimePerc = totalTime > 0 ? ((runtime / totalTime) * 100).toFixed(1) : "100.0";

  const downtimeTasks = tasks.filter(t => t.actual_duration_hours && parseFloat(t.actual_duration_hours) > 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto pb-12">
      
      {/* Breadcrumbs */}
      <nav className="text-sm font-medium text-slate-500 mb-2 flex items-center gap-2">
        <Link to="/my-equipment" className="hover:text-teal-600 transition-colors">My Equipment</Link>
        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
        <span className="text-slate-900 font-bold">{equipment.name}</span>
      </nav>

      {/* Top Hero Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mt-2 p-6 md:p-8 relative">
        <div className="flex gap-5 items-center">
          <div className="w-16 h-16 bg-teal-50 rounded-xl flex items-center justify-center border border-teal-100 flex-shrink-0">
             {getCategoryIcon(equipment.category_name)}
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2 pr-12">{equipment.name}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-500">
              {equipment.category_name && (
                <>
                  <span className="text-slate-700 font-bold">{equipment.category_name}</span>
                  <span className="text-slate-300">•</span>
                </>
              )}
              <span className="text-slate-700">{equipment.serial_number}</span>
              
              <span className="text-slate-300">•</span>
              
              <span className={`flex items-center gap-1.5 font-bold ${
                equipment.status === 'OPERATIONAL' ? 'text-emerald-600' : 
                equipment.status === 'MAINTENANCE' ? 'text-amber-600' : 
                'text-rose-600'
              }`}>
                {equipment.status === 'MAINTENANCE' && <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>}
                {equipment.status === 'OPERATIONAL' && <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>}
                {equipment.status === 'DOWN' && <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>}
                {equipment.status.replace('_', ' ')}
              </span>

              {equipment.location && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {equipment.location}
                  </span>
                </>
              )}
            </div>
            
            {isManager && (
              <div className="mt-6 flex flex-wrap gap-3">
                <button onClick={() => setIsEditModalOpen(true)} className="px-4 py-2 bg-slate-800 text-white text-sm font-bold rounded-lg hover:bg-slate-900 transition-colors shadow-sm flex items-center">
                  <svg className="w-4 h-4 mr-2 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  Edit Equipment
                </button>
                <button onClick={() => setIsQrModalOpen(true)} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 transition-colors shadow-sm flex items-center">
                  <svg className="w-4 h-4 mr-2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                  QR Code
                </button>
                <button onClick={() => setIsPmModalOpen(true)} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 transition-colors shadow-sm flex items-center">
                  <svg className="w-4 h-4 mr-2 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  PM Schedule
                </button>
                <button onClick={() => setIsDocModalOpen(true)} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 transition-colors shadow-sm flex items-center">
                  <svg className="w-4 h-4 mr-2 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  Upload Document
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="group bg-white p-5 rounded-2xl shadow-sm hover:shadow-md border border-slate-200 flex flex-col justify-center transition-all hover:-translate-y-1 relative cursor-default">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold tracking-wider mb-2">
            <svg className="w-5 h-5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            UPTIME
          </div>
          <div className="text-3xl font-black text-slate-900">{uptimePerc}%</div>
          {/* Tooltip */}
          <div className="absolute top-[-40px] left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs py-1 px-3 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            Percentage of time machine is operational
          </div>
        </div>
        
        <div className="group bg-white p-5 rounded-2xl shadow-sm hover:shadow-md border border-slate-200 flex flex-col justify-center transition-all hover:-translate-y-1 relative cursor-default">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold tracking-wider mb-2">
            <svg className="w-5 h-5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            RUNTIME
          </div>
          <div className="text-3xl font-black text-slate-900">{equipment.current_runtime_hours} <span className="text-lg text-slate-400 font-medium">hrs</span></div>
          <div className="absolute top-[-40px] left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs py-1 px-3 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            Total hours this machine has operated
          </div>
        </div>
        
        <div 
          onClick={() => { setActiveTab('history'); setHistoryFilter('open'); setSearchTerm(''); }}
          className="group bg-white p-5 rounded-2xl shadow-sm hover:shadow-md border border-slate-200 flex flex-col justify-center transition-all hover:-translate-y-1 relative cursor-pointer hover:border-teal-300"
        >
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold tracking-wider mb-2">
            <svg className="w-5 h-5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            OPEN WORK ORDERS
          </div>
          <div className="text-3xl font-black text-slate-900">{openWorkOrders}</div>
          <div className="absolute top-[-40px] left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs py-1 px-3 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            Click to view pending tasks
          </div>
        </div>
        
        <div 
          onClick={() => setShowDowntimeModal(true)}
          className="group bg-white p-5 rounded-2xl shadow-sm hover:shadow-md border border-slate-200 flex flex-col justify-center transition-all hover:-translate-y-1 relative cursor-pointer hover:border-teal-300"
        >
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold tracking-wider mb-2">
            <svg className="w-5 h-5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
            TOTAL DOWNTIME
          </div>
          <div className="text-3xl font-black text-slate-900">{equipment.total_downtime_hours} <span className="text-lg text-slate-400 font-medium">hrs</span></div>
          <div className="absolute top-[-40px] left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs py-1 px-3 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            Click to view downtime history
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
        <div className="border-b border-slate-100 p-4 overflow-x-auto">
          <nav className="flex space-x-6 min-w-max">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'history', label: `Maintenance history`, count: tasks.length },
              { id: 'parts', label: 'Parts' },
              { id: 'documents', label: 'Documents', count: equipment.documents?.length || 0 },
              ...(isManager ? [{ id: 'requests', label: 'Requests', count: requests.length }] : [])
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-5 py-2.5 text-sm font-bold rounded-full transition-all ${
                  activeTab === tab.id 
                    ? 'bg-teal-500 text-white shadow-md' 
                    : 'bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`ml-2 px-2.5 py-0.5 text-xs font-black rounded-full ${
                    activeTab === tab.id ? 'bg-white text-teal-600' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6 md:p-8 bg-slate-50/50 rounded-b-2xl min-h-[400px]">
          
          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Specifications Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-sm font-black text-slate-400 tracking-widest uppercase mb-6">Specifications</h3>
                <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Manufacturer</p>
                    <p className="text-slate-900 font-medium">{equipment.manufacturer || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Model</p>
                    <p className="text-slate-900 font-medium">{equipment.model_number || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Serial Number</p>
                    <p className="text-slate-900 font-bold">{equipment.serial_number}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Category</p>
                    <p className="text-slate-900 font-medium">{equipment.category_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Purchase Date</p>
                    <p className="text-slate-900 font-medium">{equipment.purchase_date ? new Date(equipment.purchase_date).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Warranty Expiry</p>
                    <p className="text-slate-900 font-medium">{equipment.warranty_expiry ? new Date(equipment.warranty_expiry).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  {isManager && (
                    <>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Active User</p>
                        {equipment.active_session_user ? (
                          <span className="flex items-center font-medium text-emerald-600">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
                            {equipment.active_session_user}
                          </span>
                        ) : (
                          <p className="text-slate-500 font-medium">None</p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Next PM Date</p>
                        <p className="text-slate-900 font-medium text-indigo-600">
                          {/* If backend adds next_pm_date we show it here, for now stub */}
                          {equipment.next_pm_date ? new Date(equipment.next_pm_date).toLocaleDateString() : 'Schedule not set'}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Recent Activity Mini-Timeline */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-sm font-black text-slate-400 tracking-widest uppercase mb-6">Recent Activity</h3>
                {tasks.length === 0 ? (
                  <p className="text-sm text-slate-500 italic">No recent activity.</p>
                ) : (
                  <div className="space-y-6">
                    {tasks.slice(0, 4).map((task, i) => (
                      <div key={task.id} className="flex gap-4 relative">
                        {i !== Math.min(tasks.length, 4) - 1 && (
                          <div className="absolute top-8 left-4 bottom-[-1.5rem] w-px bg-slate-100"></div>
                        )}
                        <div className="flex-shrink-0 mt-1 z-10">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 bg-white ${
                            task.status === 'COMPLETED' ? 'border-emerald-400 text-emerald-500' :
                            task.status === 'IN_PROGRESS' ? 'border-amber-400 text-amber-500' :
                            'border-slate-300 text-slate-400'
                          }`}>
                            {task.status === 'COMPLETED' ? (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                            ) : task.status === 'IN_PROGRESS' ? (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                            )}
                          </div>
                        </div>
                        <div className="pb-2">
                          <p className="text-sm font-bold text-slate-900">{task.title}</p>
                          <p className="text-xs font-medium text-slate-500 mt-0.5">
                            {task.status === 'COMPLETED' && task.end_time ? `Completed on ${new Date(task.end_time).toLocaleDateString()}` : 
                             task.status === 'IN_PROGRESS' ? 'Currently in progress' : 
                             'Pending assignment or start'}
                          </p>
                        </div>
                      </div>
                    ))}
                    {tasks.length > 4 && (
                      <button onClick={() => setActiveTab('history')} className="text-sm font-bold text-teal-600 hover:text-teal-700 transition-colors w-full text-left pt-4 border-t border-slate-100">
                        View full history &rarr;
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: MAINTENANCE HISTORY */}
          {activeTab === 'history' && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden max-w-4xl">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Maintenance timeline</h3>
                  <p className="text-sm text-slate-500 mt-1">All repairs, inspections and services logged against this machine.</p>
                </div>
                <button 
                  onClick={exportHistory}
                  className="px-4 py-2 bg-white border border-slate-200 text-sm font-bold text-slate-700 rounded-lg hover:bg-slate-50 shadow-sm transition-colors"
                >
                  Export CSV
                </button>
              </div>

              {/* Filters and Search */}
              <div className="p-4 border-b border-slate-100 bg-white flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex flex-wrap gap-2">
                  {['all', 'open', 'repairs', 'pm', 'inspections'].map(filter => (
                    <button
                      key={filter}
                      onClick={() => setHistoryFilter(filter)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-full capitalize transition-colors border ${
                        historyFilter === filter 
                          ? 'bg-slate-800 text-white border-slate-800' 
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {filter === 'pm' ? 'Prev. Maintenance' : filter}
                    </button>
                  ))}
                </div>
                <div className="relative w-full md:w-64">
                  <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  <input 
                    type="text" 
                    placeholder="Search WO ID or title..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
                  />
                </div>
              </div>
              
              <div className="p-0">
                {filteredTasks.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 italic">No maintenance history found matching your filters.</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredTasks.map((task) => (
                      <div key={task.id} className="p-6 flex flex-col sm:flex-row gap-6 hover:bg-slate-50/50 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-xs font-black text-slate-400 tracking-wider">WO-{task.id}</span>
                            <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider border ${
                              task.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                              task.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                              'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                              {task.status.replace('_', ' ')}
                            </span>
                            {task.is_inspection && (
                               <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">INSPECTION</span>
                            )}
                            {task.source === 'PREVENTIVE' && (
                               <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-50 text-blue-600 border border-blue-200">PM</span>
                            )}
                          </div>
                          <h4 className="text-lg font-bold text-slate-900 mb-2">{task.title}</h4>
                          <p className="text-sm text-slate-600 mb-4">{task.description}</p>
                          
                          {task.completion_notes && (
                            <div className="bg-slate-100/50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 border-l-4 border-l-teal-400">
                              <span className="font-bold block mb-1 text-slate-900">Completion Notes:</span>
                              {task.completion_notes}
                            </div>
                          )}
                        </div>
                        <div className="sm:w-32 flex-shrink-0 sm:text-right pt-1">
                           <p className="text-sm font-bold text-slate-700">
                             {task.end_time ? new Date(task.end_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 
                              task.created_at ? new Date(task.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                           </p>
                           <p className="text-xs font-medium text-slate-500 mt-1">
                             {task.actual_duration_hours ? `${task.actual_duration_hours} hrs · ` : ''} 
                             {task.technician_name ? task.technician_name : 'Unassigned'}
                           </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: PARTS */}
          {activeTab === 'parts' && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm max-w-5xl overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-sm font-black text-slate-400 tracking-widest uppercase mb-1">Parts Usage Log</h3>
                <p className="text-sm text-slate-500">A detailed list of all spare parts used in maintenance tasks on this equipment.</p>
              </div>
              
              {allParts.length === 0 ? (
                <div className="text-center py-12 text-slate-500 italic bg-white">
                  No parts have been logged for this machine yet.
                </div>
              ) : (
                <div className="overflow-x-auto bg-white">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <th className="px-6 py-4">Part Name</th>
                        <th className="px-6 py-4">Qty</th>
                        <th className="px-6 py-4">Cost</th>
                        <th className="px-6 py-4">Used In Task</th>
                        <th className="px-6 py-4">Technician</th>
                        <th className="px-6 py-4">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allParts.map((part, index) => (
                        <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-900">{part.spare_part_name}</td>
                          <td className="px-6 py-4 text-slate-700 font-medium">{part.quantity_used}</td>
                          <td className="px-6 py-4 text-slate-700 font-medium">
                            {part.cost_at_usage ? `$${parseFloat(part.cost_at_usage).toFixed(2)}` : '-'}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-black text-slate-400 tracking-wider block mb-0.5">WO-{part.task_id}</span>
                            <span className="text-sm text-slate-700 font-medium">{part.task_title}</span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">{part.technician || 'Unassigned'}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {part.date ? new Date(part.date).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB: DOCUMENTS */}
          {activeTab === 'documents' && (
            <div className="bg-transparent max-w-5xl">
              {(!equipment.documents || equipment.documents.length === 0) ? (
                <div className="bg-white text-center py-16 text-slate-500 italic border-2 border-dashed border-slate-200 rounded-2xl shadow-sm">
                  No documents available for this equipment.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {equipment.documents.map(doc => (
                    <div key={doc.id} className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group">
                      <div className="flex items-center gap-4 overflow-hidden">
                        <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0 text-amber-500 border border-amber-100">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 truncate">{doc.title}</h4>
                          <p className="text-xs font-medium text-slate-500 mt-1">
                            Updated {new Date(doc.uploaded_at || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric'})}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a 
                          href={doc.file} 
                          target="_blank" 
                          rel="noreferrer"
                          className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors flex-shrink-0"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: REQUESTS (Manager Only) */}
          {activeTab === 'requests' && isManager && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden max-w-4xl">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-slate-900 text-lg">Maintenance Requests</h3>
                <p className="text-sm text-slate-500 mt-1">Requests submitted by workers or generated automatically via inspections.</p>
              </div>
              
              <div className="p-0">
                {requests.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 italic">No maintenance requests submitted for this equipment.</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {requests.map(req => (
                      <div key={req.id} className="p-6 hover:bg-slate-50/50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-black text-slate-400 tracking-wider">REQ-{req.id}</span>
                            <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider border ${
                              req.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                              req.status === 'REJECTED' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                              'bg-amber-50 text-amber-600 border-amber-200'
                            }`}>
                              {req.status}
                            </span>
                            {req.source_inspection_id && (
                              <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">FROM INSPECTION</span>
                            )}
                          </div>
                          <span className="text-xs font-bold text-slate-500">
                            {new Date(req.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="text-lg font-bold text-slate-900 mb-1">{req.title}</h4>
                        <p className="text-sm text-slate-600 mb-3">{req.description}</p>
                        
                        <div className="flex items-center justify-between mt-4 text-sm">
                          <div className="flex items-center text-slate-500 font-medium">
                            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            Reported by: {req.reported_by_name || 'System'}
                          </div>
                          
                          {req.priority && (
                            <span className={`font-bold ${
                              req.priority === 'HIGH' ? 'text-rose-600' :
                              req.priority === 'MEDIUM' ? 'text-amber-600' : 'text-emerald-600'
                            }`}>
                              {req.priority} Priority
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Downtime Modal */}
      {showDowntimeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <svg className="w-6 h-6 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
                Downtime History
              </h2>
              <button onClick={() => setShowDowntimeModal(false)} className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-full hover:bg-slate-100">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto bg-slate-50">
              {downtimeTasks.length === 0 ? (
                 <p className="text-slate-500 text-center italic py-8">No recorded downtime events for this equipment.</p>
              ) : (
                <div className="space-y-4">
                  {downtimeTasks.map(task => (
                    <div key={task.id} className="flex justify-between items-center p-4 border border-slate-200 rounded-xl bg-white shadow-sm">
                      <div>
                        <p className="font-bold text-slate-900 text-sm">WO-{task.id}: {task.title}</p>
                        <p className="text-xs text-slate-500 mt-1">Logged on {task.end_time ? new Date(task.end_time).toLocaleDateString() : 'N/A'}</p>
                      </div>
                      <div className="font-black text-rose-600 bg-rose-50 px-3 py-1 rounded-lg border border-rose-100 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {task.actual_duration_hours} hrs
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Render Extracted Manager Modals */}
      {isManager && (
        <>
          <EditEquipmentModal 
            isOpen={isEditModalOpen} 
            onClose={() => setIsEditModalOpen(false)} 
            equipment={equipment} 
            categories={categories}
            onSuccess={fetchData} 
          />
          <QRModal 
            isOpen={isQrModalOpen} 
            onClose={() => setIsQrModalOpen(false)} 
            equipment={equipment} 
          />
          <PMScheduleModal 
            isOpen={isPmModalOpen} 
            onClose={() => setIsPmModalOpen(false)} 
            equipment={equipment} 
          />
          <DocumentVaultModal 
            isOpen={isDocModalOpen} 
            onClose={() => setIsDocModalOpen(false)} 
            equipment={equipment}
            onSuccess={fetchData} 
          />
        </>
      )}

    </div>
  );
}
