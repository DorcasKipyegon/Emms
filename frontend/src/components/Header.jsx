import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

export default function Header({ toggleSidebar }) {
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // Search State
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ equipment: [], tasks: [], technicians: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef(null);

  const navigate = useNavigate();

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearch(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults({ equipment: [], tasks: [], technicians: [] });
      setIsSearching(false);
      return;
    }

    setShowSearch(true);
    setIsSearching(true);
    
    const timeoutId = setTimeout(async () => {
      try {
        const res = await api.get(`search/?q=${encodeURIComponent(query)}`);
        setResults(res.data);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleResultClick = (path) => {
    setShowSearch(false);
    setQuery('');
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="p-2 -ml-2 rounded-lg hover:bg-gray-100 text-gray-500 focus:outline-none transition-colors">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        <div className="relative hidden md:block" ref={searchRef}>
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            {isSearching ? (
              <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </div>
          <input 
            type="text" 
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value.trim().length >= 2) setShowSearch(true);
            }}
            onFocus={() => {
              if (query.trim().length >= 2) setShowSearch(true);
            }}
            placeholder="Search equipment, tasks, or technicians..." 
            className="block w-full md:w-80 lg:w-96 py-2 pl-10 pr-4 text-sm text-gray-900 border border-gray-200 rounded-full bg-gray-50 focus:ring-teal-500 focus:border-teal-500 focus:bg-white transition-colors focus:outline-none"
          />
          
          {/* Search Results Dropdown */}
          {showSearch && (
            <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 max-h-96 overflow-y-auto">
              {!isSearching && results.equipment.length === 0 && results.tasks.length === 0 && results.technicians.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">No results found for "{query}"</div>
              ) : (
                <div className="py-2">
                  {results.equipment.length > 0 && (
                    <div className="mb-2">
                      <div className="px-4 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50">Equipment</div>
                      {results.equipment.map(eq => (
                        <button key={`eq-${eq.id}`} onClick={() => handleResultClick(`/equipment/${eq.id}`)} className="w-full text-left px-4 py-2 hover:bg-teal-50 transition-colors flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{eq.name}</p>
                            <p className="text-xs text-gray-500">{eq.serial_number}</p>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100">{eq.status}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {results.tasks.length > 0 && (
                    <div className="mb-2">
                      <div className="px-4 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50">Tasks</div>
                      {results.tasks.map(task => (
                        <button key={`task-${task.id}`} onClick={() => handleResultClick('/tasks')} className="w-full text-left px-4 py-2 hover:bg-teal-50 transition-colors flex items-center justify-between">
                          <div className="truncate pr-4">
                            <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                            <p className="text-xs text-gray-500 truncate">{task.equipment_name || 'No equipment'}</p>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 shrink-0">{task.status}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {results.technicians.length > 0 && (
                    <div>
                      <div className="px-4 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50">People</div>
                      {results.technicians.map(tech => (
                        <button key={`tech-${tech.id}`} onClick={() => handleResultClick(tech.role === 'TECHNICIAN' ? '/technicians' : '/employees')} className="w-full text-left px-4 py-2 hover:bg-teal-50 transition-colors flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">{tech.name}</p>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100">{tech.role}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center space-x-4 relative" ref={dropdownRef}>
        {user ? (
          <>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-3 focus:outline-none hover:bg-gray-50 rounded-full py-1 pr-1 pl-3 transition-colors"
            >
              <div className="text-sm text-right hidden sm:block">
                <p className="font-medium text-gray-900">{user.first_name} {user.last_name || user.username}</p>
                <p className="text-xs text-teal-600 font-semibold tracking-wider">{user.role}</p>
              </div>
              <div className="h-9 w-9 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold ring-2 ring-white shadow-sm uppercase">
                {user.username.substring(0, 2)}
              </div>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute top-12 right-0 w-64 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden transform origin-top-right transition-all animate-in fade-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                  <p className="text-sm font-bold text-gray-900">{user.first_name} {user.last_name || user.username}</p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{user.email || 'No email set'}</p>
                  <p className="text-[10px] uppercase font-bold text-teal-600 tracking-wider mt-2">{user.role}</p>
                </div>
                
                <div className="p-2">
                  <Link 
                    to="/profile" 
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-teal-50 hover:text-teal-700 transition-colors"
                  >
                    <svg className="mr-3 h-5 w-5 text-gray-400 group-hover:text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile
                  </Link>
                  <Link 
                    to="/settings" 
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-teal-50 hover:text-teal-700 transition-colors"
                  >
                    <svg className="mr-3 h-5 w-5 text-gray-400 group-hover:text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </Link>
                </div>
                
                <div className="p-2 border-t border-gray-100">
                  <button 
                    onClick={handleLogout}
                    className="flex w-full items-center px-3 py-2 text-sm font-medium text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  >
                    <svg className="mr-3 h-5 w-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
        )}
      </div>
    </header>
  );
}
