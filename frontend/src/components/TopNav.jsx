import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, User, LogOut, Settings, ChevronDown, Monitor, Moon, Sun } from 'lucide-react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const routeNames = {
  '/': 'Overview Dashboard',
  '/transactions': 'Transactions',
  '/opportunities': 'Recovery Opportunities',
  '/actions': 'Recovery Actions',
  '/customers': 'Customers',
  '/analytics': 'Analytics',
  '/audit': 'Audit Trail',
  '/settings': 'Settings',
};

export function TopNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  let pageTitle = routeNames[location.pathname] || 'Dashboard';
  if (location.pathname.startsWith('/opportunities/')) {
    pageTitle = 'Opportunity Details';
  }

  // Handle clicking outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';
  };

  return (
    <header className="h-16 border-b border-border bg-background flex items-center justify-between px-8 sticky top-0 z-10">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">{pageTitle}</h1>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search opportunities, customers..." 
            className="bg-surface border border-border text-sm rounded-full pl-10 pr-4 py-2 text-slate-200 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 w-64 transition-all"
          />
        </div>
        
        <button className="relative p-2 text-slate-400 hover:text-slate-100 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-2 w-2 h-2 bg-indigo-500 rounded-full border-2 border-background"></span>
        </button>
        
        <div className="relative border-l border-border pl-6" ref={dropdownRef}>
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 hover:bg-slate-800/50 p-1.5 pr-2 rounded-lg transition-colors focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-semibold text-sm">
              {getInitials(user?.name)}
            </div>
            <div className="hidden md:block text-left text-sm">
              <p className="font-medium text-slate-200 leading-tight">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-500">{user?.role || 'Role'}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 hidden md:block" />
          </button>
          
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-surface border border-border rounded-xl shadow-lg shadow-black/20 overflow-hidden py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-border/50 mb-1">
                <p className="text-sm font-medium text-slate-100">{user?.name}</p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              </div>
              
              <Link 
                to="/settings" 
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:text-slate-100 hover:bg-slate-800/50 transition-colors"
                onClick={() => setDropdownOpen(false)}
              >
                <Settings className="w-4 h-4" />
                Profile & Settings
              </Link>
              
              <div className="px-4 py-2 mt-1">
                <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Appearance</p>
                <div className="flex bg-slate-900/50 rounded-lg p-1 border border-slate-700/50">
                  <button onClick={() => setTheme('light')} className={`flex-1 flex justify-center py-1.5 rounded-md transition-colors ${theme === 'light' ? 'bg-slate-700 text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`} title="Light Mode">
                    <Sun className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setTheme('dark')} className={`flex-1 flex justify-center py-1.5 rounded-md transition-colors ${theme === 'dark' ? 'bg-slate-700 text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`} title="Dark Mode">
                    <Moon className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setTheme('system')} className={`flex-1 flex justify-center py-1.5 rounded-md transition-colors ${theme === 'system' ? 'bg-slate-700 text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`} title="System Theme">
                    <Monitor className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              
              <div className="border-t border-border/50 mt-1 pt-1">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
