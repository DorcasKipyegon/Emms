import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = user?.role === 'TECHNICIAN' ? [
    { name: 'My Tasks', href: '/tasks' },
    { name: 'My Equipment', href: '/my-equipment' }
  ] : [
    { name: 'Dashboard', href: '/' },
    { name: 'Equipment', href: '/equipment' },
    { name: 'Inventory', href: '/inventory' },
    { name: 'Tasks', href: '/tasks' },
    { name: 'Technicians', href: '/technicians' },
  ];

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full hidden md:flex">
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <h1 className="text-xl font-bold text-teal-400 tracking-wider">EMMS<span className="text-white">.PRO</span></h1>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center px-4 py-2.5 mb-1 text-sm font-medium rounded-full transition-colors duration-200 ${
                isActive
                  ? 'bg-teal-400 text-black shadow-md shadow-teal-900/20 font-bold'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-black hover:font-bold'
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <button 
          onClick={handleLogout}
          className="w-full py-2 px-4 bg-slate-800 hover:bg-rose-500 hover:text-white text-sm font-medium rounded-full transition-colors text-slate-300"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
