import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { ShieldAlert, Activity, ArrowRight, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function Login() {
  const { authenticated, login, demoEmail, demoPassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // If already logged in, redirect to home
  if (authenticated) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate network delay for polish
    await new Promise(resolve => setTimeout(resolve, 800));

    const success = login(email, password);
    if (success) {
      navigate('/', { replace: true });
    } else {
      setError('Invalid email or password');
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    setIsLoading(true);
    
    // Simulate network delay for polish
    await new Promise(resolve => setTimeout(resolve, 800));
    
    login(demoEmail, demoPassword);
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="bg-indigo-500 p-2 rounded-lg shadow-lg shadow-indigo-500/20">
              <ShieldAlert className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-slate-100 tracking-tight">RecoverIQ</h1>
          </div>
          <p className="text-slate-400 font-medium text-lg">AI Revenue Recovery Agent</p>
          
          <div className="mt-4 inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded text-xs text-amber-400 font-bold uppercase tracking-wide">
            <Activity className="w-3.5 h-3.5" />
            Demo Environment
          </div>
        </div>

        <div className="bg-surface border border-border rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">
            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-sm">
                  {error}
                </div>
              )}
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900/50 border border-border rounded-lg px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  placeholder="name@company.com"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900/50 border border-border rounded-lg px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isLoading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-border">
              <div className="text-center mb-4">
                <p className="text-sm text-slate-400">Want to explore the demo?</p>
              </div>
              
              <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 flex flex-col items-center">
                <div className="flex items-center gap-2 text-slate-300 text-sm font-medium mb-3">
                  <Lock className="w-4 h-4 text-slate-500" />
                  <span>Demo Account:</span>
                  <span className="text-indigo-400 font-mono">{demoEmail}</span>
                </div>
                
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  disabled={isLoading}
                  className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-200 font-medium py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  Continue with Demo Account
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
