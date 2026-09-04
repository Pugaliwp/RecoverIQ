import React, { useState } from 'react';
import { 
  Zap, Play, Eye, ShieldAlert, CheckCircle2, XCircle, AlertTriangle, 
  ArrowRight, Info, Layers, RefreshCw, BarChart2 
} from 'lucide-react';
import { runBatchSimulation } from '../services/api';
import { cn } from '../components/RiskBadge';

const formatINR = (value) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value || 0);
};

export function BatchSimulation() {
  const [maxOpps, setMaxOpps] = useState(3);
  const [minProb, setMinProb] = useState(0.50);
  const [scenario, setScenario] = useState('mixed');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [batchResult, setBatchResult] = useState(null);

  const handleSimulate = async (isDryRun) => {
    try {
      setLoading(true);
      setError(null);
      const payload = {
        max_opportunities: parseInt(maxOpps, 10),
        min_probability: parseFloat(minProb),
        dry_run: isDryRun,
        scenario: scenario
      };
      const res = await runBatchSimulation(payload);
      setBatchResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStoppingBadge = (reason) => {
    switch (reason) {
      case 'MAX_OPPORTUNITIES_REACHED':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">Max Opportunities Reached</span>;
      case 'NO_ELIGIBLE_OPPORTUNITIES':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">No Eligible Opportunities</span>;
      case 'ALL_POLICIES_BLOCKED':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">All Policies Blocked</span>;
      case 'MIN_PROBABILITY_THRESHOLD_NOT_MET':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">Min Probability Threshold Not Met</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">{reason}</span>;
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      {/* SYNTHETIC DEMO BANNER */}
      <div className="bg-gradient-to-r from-amber-950/50 via-slate-900 to-indigo-950/50 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-amber-950/20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 rounded-lg border border-amber-500/30">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-400 text-sm uppercase tracking-wider">SYNTHETIC DEMO</span>
              <span className="text-slate-500">•</span>
              <span className="text-xs font-semibold text-slate-300">NO REAL PAYMENTS EXECUTED</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Buildathon Demonstration Engine. Bounded simulation using real ML model analysis & policy guards with reproducible synthetic outcome scenarios.
            </p>
          </div>
        </div>
        <span className="text-xs bg-slate-800 text-slate-400 border border-slate-700 px-2.5 py-1 rounded">
          Model v1.0.0
        </span>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Zap className="w-6 h-6 text-indigo-400" />
            Batch Recovery Simulation
          </h2>
          <p className="text-slate-400 mt-1">Run prioritized recovery batches with strict stopping rules and transparent synthetic impact measurement.</p>
        </div>
      </div>

      {/* CONTROLS CARD */}
      <div className="bg-surface border border-border rounded-xl p-6 space-y-6">
        <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" /> Batch Execution Parameters
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Max Opportunities */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Max Opportunities: <span className="text-indigo-400 text-sm font-bold">{maxOpps}</span>
            </label>
            <input 
              type="range" 
              min="1" 
              max="10" 
              value={maxOpps}
              onChange={(e) => setMaxOpps(e.target.value)}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
              <span>1</span>
              <span>5</span>
              <span>10 (Max Limit)</span>
            </div>
          </div>

          {/* Min Probability Threshold */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Min AI Probability: <span className="text-indigo-400 text-sm font-bold">{Math.round(minProb * 100)}%</span>
            </label>
            <input 
              type="range" 
              min="0.0" 
              max="1.0" 
              step="0.05"
              value={minProb}
              onChange={(e) => setMinProb(e.target.value)}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Synthetic Scenario Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Synthetic Scenario
            </label>
            <select
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              className="w-full bg-slate-900 border border-border text-sm rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500/50"
            >
              <option value="mixed">Mixed (1st Recovered, 2nd Not Recovered...)</option>
              <option value="all_success">All Success (100% Synthetic Recovery)</option>
              <option value="all_failure">All Failure (0% Synthetic Recovery)</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">Deterministic scenario ordering for reproducible demos.</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-border">
          <button
            onClick={() => handleSimulate(true)}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" /> : <Eye className="w-4 h-4 text-indigo-400" />}
            Preview Batch (Dry Run)
          </button>

          <button
            onClick={() => handleSimulate(false)}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
            Run Synthetic Recovery
          </button>
        </div>

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* RESULTS DISPLAY */}
      {batchResult && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-400" />
              Batch Execution Results
            </h3>
            {getStoppingBadge(batchResult.stopping_reason)}
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-surface border border-border rounded-xl p-5">
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Processed</p>
              <h4 className="text-2xl font-bold text-slate-100">{batchResult.processed_count}</h4>
              <p className="text-[11px] text-slate-500 mt-1">Limit: {batchResult.requested_limit}</p>
            </div>

            <div className="bg-surface border border-border rounded-xl p-5">
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Policy Blocked</p>
              <h4 className="text-2xl font-bold text-amber-400">{batchResult.policy_blocked_count}</h4>
              <p className="text-[11px] text-slate-500 mt-1">Action NO_ACTION</p>
            </div>

            <div className="bg-surface border border-border rounded-xl p-5">
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Amount at Risk</p>
              <h4 className="text-2xl font-bold text-slate-100">{formatINR(batchResult.amount_at_risk)}</h4>
              <p className="text-[11px] text-slate-500 mt-1">Total exposed</p>
            </div>

            <div className="bg-surface border border-border rounded-xl p-5">
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Synthetic Recovered</p>
              <h4 className="text-2xl font-bold text-emerald-400">{formatINR(batchResult.amount_recovered)}</h4>
              <p className="text-[11px] text-slate-500 mt-1">{batchResult.successful_count} successful</p>
            </div>

            <div className="bg-surface border border-border rounded-xl p-5">
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Synthetic Rate</p>
              <h4 className="text-2xl font-bold text-indigo-400">{(batchResult.recovery_rate * 100).toFixed(1)}%</h4>
              <p className="text-[11px] text-slate-500 mt-1">Expected: {formatINR(batchResult.expected_recovery_before_batch)}</p>
            </div>
          </div>

          {/* Results Table */}
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800/50 border-b border-border">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Rank</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Opportunity ID</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Amount at Risk</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">AI Prob</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Recommended Action</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Priority Score</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Policy Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Synthetic Outcome</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Recovered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {batchResult.results.map((res) => (
                    <tr key={res.opportunity_id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold border border-indigo-500/30">
                          {res.rank}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm text-slate-300">{res.opportunity_id}</span>
                        <p className="text-xs text-slate-500">{res.transaction_id || '-'}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-slate-200">
                        {formatINR(res.amount_at_risk)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-bold text-emerald-400">
                          {(res.recovery_probability * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs font-medium bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700">
                          {res.recommended_action ? res.recommended_action.replace(/_/g, ' ') : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-mono text-xs text-indigo-300">
                        {formatINR(res.priority_score)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {res.policy_allowed ? (
                          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Allowed
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1 w-fit">
                            <XCircle className="w-3.5 h-3.5" /> Blocked
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {res.outcome === 'RECOVERED' && (
                          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            RECOVERED
                          </span>
                        )}
                        {res.outcome === 'NOT_RECOVERED' && (
                          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            NOT RECOVERED
                          </span>
                        )}
                        {!res.outcome && (
                          <span className="text-xs text-slate-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <span className={res.amount_recovered > 0 ? "text-emerald-400 font-bold" : "text-slate-500"}>
                          {formatINR(res.amount_recovered)}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {batchResult.results.length === 0 && (
                    <tr>
                      <td colSpan="9" className="px-6 py-8 text-center text-sm text-slate-500">
                        No opportunities met the criteria for this batch simulation.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center gap-3 text-xs text-slate-400">
            <Info className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <span>
              Simulation only. All recovery outcomes and amounts are synthetic demonstration events and do not represent real payment executions.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
