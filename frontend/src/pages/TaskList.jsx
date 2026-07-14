import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import TaskCompletionModal from '../components/TaskCompletionModal';
import AddTaskModal from '../components/AddTaskModal';
import EditTaskModal from '../components/EditTaskModal';
import CancelTaskModal from '../components/CancelTaskModal';
import ViewTaskModal from '../components/ViewTaskModal';
import DeleteTaskModal from '../components/DeleteTaskModal';
import ArchiveTaskModal from '../components/ArchiveTaskModal';
import OnHoldModal from '../components/OnHoldModal';

export default function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completingTask, setCompletingTask] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [cancelingTask, setCancelingTask] = useState(null);
  const [viewingTask, setViewingTask] = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);
  const [archivingTask, setArchivingTask] = useState(null);
  const [holdingTask, setHoldingTask] = useState(null);
  const [activeTab, setActiveTab] = useState('All');
  const { user } = useAuth();

  const fetchTasks = async () => {
    try {
      const response = await api.get('repair-tasks/?archived=all');
      let fetchedTasks = response.data;
      if (user?.role === 'TECHNICIAN') {
        const userTeamIds = user.maintenance_teams || [];
        fetchedTasks = fetchedTasks.filter(task => 
          task.technician === user.id || userTeamIds.includes(task.team)
        );
      }
      setTasks(fetchedTasks);
    } catch (err) {
      setError('Failed to load tasks.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const response = await api.get('users/');
      const techs = response.data.filter(u => u.role === 'TECHNICIAN');
      setTechnicians(techs);
    } catch (err) {
      console.error('Failed to load technicians', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTasks();
      if (user.role === 'MANAGER' || user.role === 'ADMIN') {
        fetchTechnicians();
      }
    }
  }, [user]);

  const updateStatus = async (taskId, newStatus, extraData = {}) => {
    try {
      const payload = { status: newStatus, ...extraData };
      if (newStatus === 'IN_PROGRESS' && user?.role === 'TECHNICIAN') {
        payload.technician = user.id;
        payload.team = null;
        payload.on_hold_reason = null; // Clear the reason when resuming
      }
      await api.patch(`repair-tasks/${taskId}/`, payload);
      fetchTasks();
    } catch (err) {
      console.error("Failed to update status", err);
      alert("Failed to update status. Check console.");
    }
  };

  const assignTechnician = async (taskId, technicianId) => {
    try {
      await api.patch(`repair-tasks/${taskId}/`, { technician: technicianId || null });
      fetchTasks();
    } catch (err) {
      console.error("Failed to assign technician", err);
      alert("Failed to assign technician. Check console.");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED': return 'bg-white text-emerald-600 border border-emerald-200';
      case 'IN_PROGRESS': return 'bg-white text-blue-600 border border-blue-200';
      case 'ON_HOLD': return 'bg-white text-orange-600 border border-orange-200';
      case 'CANCELLED': return 'bg-white text-rose-600 border border-rose-200';
      default: return 'bg-white text-amber-600 border border-amber-200'; // PENDING
    }
  };

  const isTechnician = user?.role === 'TECHNICIAN';
  const isManager = user?.role === 'MANAGER' || user?.role === 'ADMIN';

  const tabs = isManager ? ['All', 'Pending', 'In Progress', 'On Hold', 'Completed', 'Archived'] : ['All', 'Pending', 'In Progress', 'On Hold', 'Completed'];

  const getFilteredTasks = () => {
    switch (activeTab) {
      case 'Pending': return tasks.filter(t => !t.is_archived && t.status === 'PENDING');
      case 'In Progress': return tasks.filter(t => !t.is_archived && t.status === 'IN_PROGRESS');
      case 'On Hold': return tasks.filter(t => !t.is_archived && t.status === 'ON_HOLD');
      case 'Completed': return tasks.filter(t => !t.is_archived && (t.status === 'COMPLETED' || t.status === 'CANCELLED'));
      case 'Archived': return tasks.filter(t => t.is_archived);
      default: return tasks.filter(t => !t.is_archived);
    }
  };

  const getTabCount = (tab) => {
    switch (tab) {
      case 'Pending': return tasks.filter(t => !t.is_archived && t.status === 'PENDING').length;
      case 'In Progress': return tasks.filter(t => !t.is_archived && t.status === 'IN_PROGRESS').length;
      case 'On Hold': return tasks.filter(t => !t.is_archived && t.status === 'ON_HOLD').length;
      case 'Completed': return tasks.filter(t => !t.is_archived && (t.status === 'COMPLETED' || t.status === 'CANCELLED')).length;
      case 'Archived': return tasks.filter(t => t.is_archived).length;
      default: return tasks.filter(t => !t.is_archived).length;
    }
  };

  const displayedTasks = getFilteredTasks();

  const handleExportCSV = () => {
    if (displayedTasks.length === 0) {
      alert("No tasks to export.");
      return;
    }

    const headers = ["Task ID", "Title", "Status", "Equipment ID", "Equipment Name", "Technician", "Priority", "Created At"];
    const csvRows = [headers.join(',')];

    displayedTasks.forEach(task => {
      const row = [
        task.id,
        `"${task.title.replace(/"/g, '""')}"`,
        task.status,
        task.equipment,
        `"${(task.equipment_name || '').replace(/"/g, '""')}"`,
        `"${(task.technician_name || 'Unassigned').replace(/"/g, '""')}"`,
        task.priority || '',
        task.created_at || ''
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `emms_tasks_${activeTab.toLowerCase().replace(' ', '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">{isTechnician ? "My Tasks" : "Task Board"}</h2>
          <p className="text-gray-500 mt-1">
            {isTechnician ? "Manage and track your assigned maintenance tasks." : "Overview of all facility maintenance tasks."}
          </p>
        </div>
        {isManager && (
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={handleExportCSV}
              className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2 px-4 rounded-xl shadow-sm transition-colors flex items-center text-sm"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              Export CSV
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-teal-400 hover:bg-teal-500 text-white font-bold py-2 px-5 rounded-xl shadow-sm hover:shadow transition-all flex items-center text-sm flex-shrink-0"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
              Add Task
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="-mb-px flex space-x-6 min-w-max" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors
                ${activeTab === tab 
                  ? 'border-teal-500 text-teal-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              {tab}
              <span 
                className={`ml-3 py-0.5 px-2.5 rounded-full text-xs font-semibold ${
                  activeTab === tab ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-900'
                }`}
              >
                {getTabCount(tab)}
              </span>
            </button>
          ))}
        </nav>
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
      ) : displayedTasks.length === 0 ? (
        <div className="w-full h-64 flex flex-col items-center justify-center border border-gray-200 rounded-lg bg-white shadow-sm">
          <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          <p className="text-gray-500 font-medium text-lg">No tasks found</p>
          <p className="text-gray-400 text-sm mt-1">There are no {activeTab !== 'All' ? activeTab.toLowerCase() : ''} tasks currently available.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedTasks.map(task => (
            <div key={task.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:-translate-y-1 transition-transform shadow-sm flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-gray-900 text-lg leading-tight">{task.title}</h3>
                <span className={`px-2 py-1 text-xs font-semibold rounded-md whitespace-nowrap ml-2 ${getStatusColor(task.status)}`}>
                  {task.status.replace('_', ' ')}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-4 line-clamp-3 flex-grow">{task.description}</p>
              
              {task.status === 'ON_HOLD' && task.on_hold_reason && (
                <div className="bg-orange-50 border border-orange-200 text-orange-800 text-xs px-3 py-2 rounded-lg mb-4 flex items-center">
                  <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  <span className="font-medium">Reason:</span> <span className="ml-1 truncate">{task.on_hold_reason}</span>
                </div>
              )}
              
              <div className="text-xs font-medium text-gray-600 bg-gray-50 p-3 rounded-lg mb-4 space-y-2 border border-gray-200">
                <div className="flex items-center justify-between">
                  <p className="flex items-center">
                    <svg className="w-3.5 h-3.5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    Equipment: <span className="text-gray-900 ml-1 font-semibold">{task.equipment_name || `ID #${task.equipment}`}</span>
                  </p>
                </div>
                
                <div className="flex items-center justify-between border-t border-gray-200 pt-2">
                  <p className="flex items-center">
                    <svg className="w-3.5 h-3.5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                    Assignee: 
                    <span className={(task.technician || task.team) ? 'text-gray-900 ml-1 font-semibold' : 'text-amber-600 ml-1 font-semibold'}>
                      {task.technician_name ? task.technician_name : (task.team_name ? `${task.team_name}` : 'Unassigned')}
                    </span>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-4 mt-auto pt-4">
                {/* Technician Actions */}
                {isTechnician && (task.technician === user.id || task.team) && (
                  <>
                    {task.status === 'PENDING' && (
                      <button 
                        onClick={() => updateStatus(task.id, 'IN_PROGRESS')}
                        className="bg-teal-500 hover:bg-teal-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm shadow-teal-500/20"
                      >
                        Start Work
                      </button>
                    )}
                    {task.status === 'IN_PROGRESS' && (
                      <>
                        <button 
                          onClick={() => setHoldingTask(task)}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm shadow-emerald-900/20"
                        >
                          On Hold
                        </button>
                        <button 
                          onClick={() => setCompletingTask(task)}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm shadow-emerald-500/20"
                        >
                          Mark Completed
                        </button>
                      </>
                    )}
                    {task.status === 'ON_HOLD' && (
                      <button 
                        onClick={() => updateStatus(task.id, 'IN_PROGRESS')}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm shadow-emerald-500/20"
                      >
                        Resume Work
                      </button>
                    )}
                  </>
                )}

                {/* Manager Actions */}
                {isManager && (
                  <>
                    {task.status === 'PENDING' && (
                      <>
                        <button onClick={() => setDeletingTask(task)} className="text-rose-500 hover:text-rose-700 hover:underline text-sm font-medium transition-colors">Delete</button>
                        <button onClick={() => setEditingTask(task)} className="bg-teal-500 hover:bg-teal-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm shadow-teal-500/20">Edit Task</button>
                      </>
                    )}
                    {(task.status === 'IN_PROGRESS' || task.status === 'ON_HOLD') && (
                      <>
                        <button onClick={() => setCancelingTask(task)} className="text-rose-500 hover:text-rose-700 hover:underline text-sm font-medium transition-colors">Cancel Task</button>
                        <button onClick={() => setEditingTask(task)} className="bg-teal-500 hover:bg-teal-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm shadow-teal-500/20">Edit Task</button>
                      </>
                    )}
                    {(task.status === 'COMPLETED' || task.status === 'CANCELLED') && (
                      <>
                        <button onClick={() => setArchivingTask(task)} className="text-gray-500 hover:text-gray-700 hover:underline text-sm font-medium transition-colors">Archive</button>
                        <button onClick={() => setViewingTask(task)} className="bg-gray-800 hover:bg-gray-900 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">View Details</button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {completingTask && (
        <TaskCompletionModal 
          task={completingTask} 
          onClose={() => setCompletingTask(null)} 
          onSuccess={() => {
            setCompletingTask(null);
            fetchTasks();
          }} 
        />
      )}
      
      {showAddModal && (
        <AddTaskModal 
          technicians={technicians}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchTasks();
          }}
        />
      )}

      {editingTask && (
        <EditTaskModal 
          task={editingTask}
          technicians={technicians}
          onClose={() => setEditingTask(null)}
          onSuccess={() => {
            setEditingTask(null);
            fetchTasks();
          }}
        />
      )}

      {cancelingTask && (
        <CancelTaskModal 
          task={cancelingTask}
          onClose={() => setCancelingTask(null)}
          onSuccess={() => {
            setCancelingTask(null);
            fetchTasks();
          }}
        />
      )}

      {viewingTask && (
        <ViewTaskModal 
          task={viewingTask}
          onClose={() => setViewingTask(null)}
        />
      )}

      {deletingTask && (
        <DeleteTaskModal 
          task={deletingTask}
          onClose={() => setDeletingTask(null)}
          onSuccess={() => {
            setDeletingTask(null);
            fetchTasks();
          }}
        />
      )}

      {archivingTask && (
        <ArchiveTaskModal 
          task={archivingTask}
          onClose={() => setArchivingTask(null)}
          onSuccess={() => {
            setArchivingTask(null);
            fetchTasks();
          }}
        />
      )}
      
      {holdingTask && (
        <OnHoldModal 
          task={holdingTask}
          onClose={() => setHoldingTask(null)}
          onSuccess={() => {
            setHoldingTask(null);
            fetchTasks();
          }}
        />
      )}
    </div>
  );
}
