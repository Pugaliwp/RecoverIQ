import React, { useState, useEffect } from 'react';
import { Search, Filter, PlayCircle, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { getRecoveryActions } from '../services/api';
import { StateWrapper } from '../components/StateWrapper';
import { cn } from '../components/RiskBadge';

const formatINR = (value) => {
  if (!value) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

export function RecoveryActions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getRecoveryActions();
      setActions(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 w-fit"><CheckCircle2 className="w-3.5 h-3.5" /> Approved</span>;
      case 'PENDING_APPROVAL':
        return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5 w-fit"><Clock className="w-3.5 h-3.5" /> Pending Approval</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1.5 w-fit"><XCircle className="w-3.5 h-3.5" /> Rejected</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1.5 w-fit"><CheckCircle2 className="w-3.5 h-3.5" /> Completed</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-800 text-slate-400 border border-slate-700 w-fit">{status || 'Unknown'}</span>;
    }
  };

  const filteredActions = actions.filter((action) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (action.opportunity_id || '').toLowerCase().includes(term) ||
      (action.action_type || '').toLowerCase().includes(term) ||
      (action.action_status || '').toLowerCase().includes(term) ||
      (action.result || '').toLowerCase().includes(term)
    );
  });

  return (
    <StateWrapper loading={loading} error={error} onRetry={fetchData}>
      <div className="p-8 space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <PlayCircle className="w-6 h-6 text-indigo-400" />
              Recovery Actions
            </h2>
            <p className="text-slate-400 mt-1">Active and historical AI recovery intervention requests and outcomes.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search Action ID, Opportunity..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-surface border border-border text-sm rounded-lg pl-10 pr-4 py-2 text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 w-64 transition-all"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg text-sm font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-800 transition-colors">
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/50 border-b border-border">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Action ID</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Opp ID</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Action Type</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Result</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Executed At</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Amount Recovered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredActions.map((action) => (
                  <tr key={action.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-xs text-slate-300">ACT_{action.id}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-xs text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded">
                        {action.opportunity_id}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-slate-200">
                        {action.action_type ? action.action_type.replace(/_/g, ' ') : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(action.action_status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-300">
                        {action.result || 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                      {action.executed_at ? new Date(action.executed_at).toLocaleString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <span className={action.amount_recovered > 0 ? "text-emerald-400" : "text-slate-500"}>
                        {formatINR(action.amount_recovered)}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredActions.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-sm text-slate-500">
                      <PlayCircle className="w-10 h-10 text-slate-600 mx-auto mb-3 opacity-50" />
                      <p className="text-slate-300 font-medium text-base">No recovery actions recorded yet</p>
                      <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">
                        Initiate or approve a recovery recommendation on an active opportunity to record interventions.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </StateWrapper>
  );
}
