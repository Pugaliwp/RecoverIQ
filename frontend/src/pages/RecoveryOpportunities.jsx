import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ChevronLeft, ChevronRight, Eye, PlayCircle } from 'lucide-react';
import { getOpportunities } from '../services/api';
import { StateWrapper } from '../components/StateWrapper';
import { cn } from '../components/RiskBadge';

const formatINR = (value) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

export function RecoveryOpportunities() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [recoveryOpportunities, setRecoveryOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getOpportunities();
      setRecoveryOpportunities(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Eligible': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Pending': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'In Progress': return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
      case 'Failed': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getProbabilityColor = (prob) => {
    if (prob >= 80) return 'text-emerald-400';
    if (prob >= 60) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <StateWrapper loading={loading} error={error} onRetry={fetchData}>
    <div className="p-8 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Recovery Opportunities</h2>
          <p className="text-slate-400 mt-1">AI-identified revenue at risk with actionable recovery paths.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search ID, Customer..." 
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
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Opportunity ID</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Amount at Risk</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Root Cause</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Recovery Prob.</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Action</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recoveryOpportunities.map((opp) => (
                <tr 
                  key={opp.opportunity_id} 
                  className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                  onClick={() => navigate(`/opportunities/${opp.opportunity_id}`)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-mono text-sm text-indigo-400">{opp.opportunity_id}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-slate-300">{opp.transaction_id}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-slate-200">{formatINR(opp.amount_at_risk)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-slate-300">{opp.root_cause}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {(() => {
                      const rawProb = opp.recovery_probability ?? 0;
                      const probPct = rawProb > 1 ? rawProb : (rawProb * 100);
                      return (
                        <span className={cn("text-sm font-bold", getProbabilityColor(probPct))}>
                          {probPct.toFixed(1)}%
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <PlayCircle className="w-4 h-4 text-indigo-400" />
                      <span className="text-sm text-slate-300">{opp.recommended_action?.replace(/_/g, ' ')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn("px-2.5 py-1 text-xs font-medium rounded-full border", getStatusColor(opp.status))}>
                      {opp.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button 
                      className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/opportunities/${opp.opportunity_id}`);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-slate-800/30">
          <span className="text-sm text-slate-400">
            Showing <span className="font-medium text-slate-200">1</span> to <span className="font-medium text-slate-200">{recoveryOpportunities.length}</span> of <span className="font-medium text-slate-200">{recoveryOpportunities.length}</span> opportunities
          </span>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg border border-border text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-lg border border-border text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
    </StateWrapper>
  );
}
