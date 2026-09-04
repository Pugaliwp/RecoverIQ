import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  AlertTriangle, 
  Activity, 
  PlayCircle,
  Users,
  BarChart3, 
  Settings, 
  History,
  TrendingUp,
  Zap
} from 'lucide-react';
import { cn } from './RiskBadge';
import { checkHealth } from '../services/api';

const navItems = [
  { name: 'Overview', path: '/', icon: LayoutDashboard },
  { name: 'Transactions', path: '/transactions', icon: Activity },
  { name: 'Recovery Opportunities', path: '/opportunities', icon: AlertTriangle },
  { name: 'Recovery Actions', path: '/actions', icon: PlayCircle },
  { name: 'Batch Simulation', path: '/batch-simulation', icon: Zap },
  { name: 'Customers', path: '/customers', icon: Users },
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Audit Trail', path: '/audit', icon: History },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export function Sidebar() {
  const [isHealthy, setIsHealthy] = React.useState(true);

  React.useEffect(() => {
    const check = async () => {
      try {
        await checkHealth();
        setIsHealthy(true);
      } catch (err) {
        setIsHealthy(false);
      }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col w-64 bg-surface border-r border-border min-h-screen fixed left-0 top-0 bottom-0 z-10">
      <div className="flex items-center gap-3 px-6 h-16 border-b border-border">
        <div className="bg-primary/20 p-2 rounded-lg text-primary">
          <TrendingUp className="w-6 h-6" />
        </div>
        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
          RecoverIQ
        </span>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              isActive 
                ? "bg-primary/10 text-primary" 
                : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>
      
      <div className="p-4 border-t border-border mt-auto">
        <div className="bg-slate-800 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-2">System Status</p>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", isHealthy ? "bg-emerald-400" : "bg-rose-400")}></span>
              <span className={cn("relative inline-flex rounded-full h-2.5 w-2.5", isHealthy ? "bg-emerald-500" : "bg-rose-500")}></span>
            </span>
            <span className={cn("text-sm font-medium", isHealthy ? "text-emerald-400" : "text-rose-400")}>
              {isHealthy ? "All systems operational" : "Backend unavailable"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
