import React, { useState, useEffect } from 'react';
import { Search, Filter, History, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { getAuditTrail } from '../services/api';
import { StateWrapper } from '../components/StateWrapper';
import { cn } from '../components/RiskBadge';

const formatINR = (value) => {
  if (!value) return '-';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

export function AuditTrail() {
  const [searchTerm, setSearchTerm] = useState('');
  const [auditTrailData, setAuditTrailData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAuditTrail();
      setAuditTrailData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getResultIcon = (result) => {
    const res = (result || '').toUpperCase();
    if (res === 'SUCCESS' || res === 'RECOVERED') {
      return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    }
    if (res === 'FAILED' || res === 'NOT_RECOVERED') {
      return <XCircle className="w-4 h-4 text-rose-400" />;
    }
    if (res === 'PENDING') {
      return <Clock className="w-4 h-4 text-amber-400" />;
    }
    return null;
  };

  const filteredLogs = auditTrailData.filter((log) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (log.opportunity_id || log.opportunityId || '').toLowerCase().includes(term) ||
      (log.action || log.actionTaken || '').toLowerCase().includes(term) ||
      (log.reason || log.detectionReason || '').toLowerCase().includes(term) ||
      (log.recommendation || log.aiRecommendation || '').toLowerCase().includes(term) ||
      (log.policy_applied || log.policyApplied || '').toLowerCase().includes(term) ||
      (log.result || '').toLowerCase().includes(term)
    );
  });

  return (
    <StateWrapper loading={loading} error={error} onRetry={fetchData}>
    <div className="p-8 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <History className="w-6 h-6 text-indigo-400" />
            Audit Trail
          </h2>
          <p className="text-slate-400 mt-1">Complete immutable record of all AI decisions and automated actions.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search ID, Action..." 
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
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Opp ID</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Detection / Diagnosis</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">AI Recommendation</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Action Taken</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Policy Applied</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Result</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Recovered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLogs.map((log) => {
                const oppId = log.opportunity_id || log.opportunityId || '-';
                const reason = log.reason || log.detectionReason || log.event_type || '-';
                const recommendation = log.recommendation || log.aiRecommendation || '-';
                const action = log.action || log.actionTaken || '-';
                const policy = log.policy_applied || log.policyApplied || '-';
                const amtRecovered = log.amount_recovered ?? log.amountRecovered ?? 0;

                return (
                  <tr key={log.id} className="hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-300">
                        {log.timestamp ? new Date(log.timestamp).toLocaleDateString() : '-'}
                      </div>
                      <div className="text-xs text-slate-500">
                        {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-xs text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded">{oppId}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-300">{reason}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-300">{recommendation}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-200">{action}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-400 border border-slate-700 bg-slate-800 rounded px-2 py-1">
                        {policy}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getResultIcon(log.result)}
                        <span className="text-sm text-slate-300">{log.result || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={cn(
                        "text-sm font-medium",
                        amtRecovered > 0 ? "text-emerald-400" : "text-slate-500"
                      )}>
                        {formatINR(amtRecovered)}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-sm text-slate-500">
                    <History className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                    <p className="text-slate-400 font-medium">No audit logs found</p>
                    <p className="text-slate-500 text-xs mt-1">Audit log records will automatically appear when recovery actions are executed.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-slate-800/30">
          <span className="text-sm text-slate-400">
            Showing <span className="font-medium text-slate-200">{filteredLogs.length > 0 ? 1 : 0}</span> to <span className="font-medium text-slate-200">{filteredLogs.length}</span> of <span className="font-medium text-slate-200">{filteredLogs.length}</span> records
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
