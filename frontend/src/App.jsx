import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import EquipmentList from './pages/EquipmentList';
import InventoryList from './pages/InventoryList';
import TaskList from './pages/TaskList';
import Profile from './pages/Profile';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import SetupAccount from './pages/SetupAccount';
import TechnicianEquipmentList from './pages/TechnicianEquipmentList';
import TechnicianEquipmentDetail from './pages/TechnicianEquipmentDetail';
import TechnicianList from './pages/TechnicianList';
import TeamManagement from './pages/TeamManagement';
import InspectionTemplates from './pages/InspectionTemplates';
import MaintenanceRequests from './pages/MaintenanceRequests';
import WorkerDashboard from './pages/WorkerDashboard';
import WorkerList from './pages/WorkerList';

// A wrapper to protect routes and redirect if not logged in
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen w-screen bg-gray-950 flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!user) return <Navigate to="/login" />;
  return <Layout>{children}</Layout>;
};

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/setup-account" element={<SetupAccount />} />
      
      {/* Dynamic Homepage based on Role */}
      <Route path="/" element={
        <ProtectedRoute>
          {user?.role === 'TECHNICIAN' ? <Navigate to="/tasks" /> : 
           user?.role === 'WORKER' ? <Navigate to="/worker-dashboard" /> : 
           <Dashboard />}
        </ProtectedRoute>
      } />
      
      {/* Worker routes */}
      <Route path="/worker-dashboard" element={<ProtectedRoute><WorkerDashboard /></ProtectedRoute>} />
      
      <Route path="/equipment" element={<ProtectedRoute><EquipmentList /></ProtectedRoute>} />
      <Route path="/inventory" element={<ProtectedRoute><InventoryList /></ProtectedRoute>} />
      <Route path="/tasks" element={<ProtectedRoute><TaskList /></ProtectedRoute>} />
      <Route path="/checklists" element={<ProtectedRoute><InspectionTemplates /></ProtectedRoute>} />
      <Route path="/requests" element={<ProtectedRoute><MaintenanceRequests /></ProtectedRoute>} />
      <Route path="/technicians" element={<ProtectedRoute><TechnicianList /></ProtectedRoute>} />
      <Route path="/workers" element={<ProtectedRoute><WorkerList /></ProtectedRoute>} />
      <Route path="/teams" element={<ProtectedRoute><TeamManagement /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      
      {/* Technician specific routes */}
      <Route path="/my-equipment" element={<ProtectedRoute><TechnicianEquipmentList /></ProtectedRoute>} />
      <Route path="/my-equipment/:id" element={<ProtectedRoute><TechnicianEquipmentDetail /></ProtectedRoute>} />
      
      <Route path="/settings" element={<ProtectedRoute><div className="flex h-full items-center justify-center text-gray-400">Settings coming soon...</div></ProtectedRoute>} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  )
}

export default App;
