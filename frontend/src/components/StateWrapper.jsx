import React from 'react';
import { RefreshCcw, AlertTriangle, Loader2 } from 'lucide-react';

export function StateWrapper({ loading, error, onRetry, children }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-indigo-400">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p className="text-slate-400 font-medium">Loading data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center max-w-md mx-auto">
        <div className="bg-rose-500/10 p-4 rounded-full mb-4">
          <AlertTriangle className="w-8 h-8 text-rose-500" />
        </div>
        <h3 className="text-xl font-bold text-slate-100 mb-2">Backend unavailable</h3>
        <p className="text-slate-400 mb-6">{error}</p>
        
        {onRetry && (
          <button 
            onClick={onRetry}
            className="flex items-center gap-2 px-6 py-2.5 bg-surface border border-border hover:bg-slate-800 text-slate-200 font-medium rounded-lg transition-colors"
          >
            <RefreshCcw className="w-4 h-4" />
            Retry Connection
          </button>
        )}
      </div>
    );
  }

  return children;
}
