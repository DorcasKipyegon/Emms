import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import EquipmentDetail from './pages/EquipmentDetail';
import TechnicianList from './pages/TechnicianList';
import TeamManagement from './pages/TeamManagement';
import InspectionTemplates from './pages/InspectionTemplates';
import MaintenanceRequests from './pages/MaintenanceRequests';
import EmployeeDashboard from './pages/EmployeeDashboard';
import EmployeeList from './pages/EmployeeList';
import MyShift from './pages/MyShift';
import QRPortal from './pages/QRPortal';
import Register from './pages/Register';

// A wrapper to protect routes and redirect if not logged in
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="h-screen w-screen bg-gray-950 flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return <Layout>{children}</Layout>;
};

const SimpleProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="h-screen w-screen bg-gray-950 flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
};

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/setup-account" element={<SetupAccount />} />
      
      {/* Dynamic Homepage based on Role */}
      <Route path="/" element={
        <ProtectedRoute>
          {user?.role === 'TECHNICIAN' ? <Navigate to="/tasks" /> : 
           (user?.role === 'EMPLOYEE' || user?.role === 'EMPLOYEE') ? <Navigate to="/employee-dashboard" /> : 
           <Dashboard />}
        </ProtectedRoute>
      } />
      
      {/* Employee routes */}
      <Route path="/employee-dashboard" element={<ProtectedRoute><EmployeeDashboard /></ProtectedRoute>} />
      
      <Route path="/equipment" element={<ProtectedRoute><EquipmentList /></ProtectedRoute>} />
      <Route path="/equipment/:id" element={<ProtectedRoute><EquipmentDetail /></ProtectedRoute>} />
      <Route path="/inventory" element={<ProtectedRoute><InventoryList /></ProtectedRoute>} />
      <Route path="/tasks" element={<ProtectedRoute><TaskList /></ProtectedRoute>} />
      <Route path="/checklists" element={<ProtectedRoute><InspectionTemplates /></ProtectedRoute>} />
      <Route path="/requests" element={<ProtectedRoute><MaintenanceRequests /></ProtectedRoute>} />
      <Route path="/my-shift" element={<ProtectedRoute><MyShift /></ProtectedRoute>} />
      <Route path="/technicians" element={<ProtectedRoute><TechnicianList /></ProtectedRoute>} />
      <Route path="/employees" element={<ProtectedRoute><EmployeeList /></ProtectedRoute>} />
      <Route path="/teams" element={<ProtectedRoute><TeamManagement /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      
      {/* Technician specific routes */}
      <Route path="/my-equipment" element={<ProtectedRoute><TechnicianEquipmentList /></ProtectedRoute>} />
      <Route path="/my-equipment/:id" element={<ProtectedRoute><EquipmentDetail /></ProtectedRoute>} />
      
      {/* Public QR Portal */}
      <Route path="/q/:public_id" element={<ProtectedRoute><QRPortal /></ProtectedRoute>} />
      
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
