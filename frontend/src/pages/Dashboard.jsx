import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, ComposedChart
} from 'recharts';
import { 
  TrendingUp, ShieldAlert, Activity, ArrowUpRight, ArrowDownRight,
  IndianRupee, CreditCard, AlertCircle, PlayCircle, Funnel, Zap
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { StateWrapper } from '../components/StateWrapper';
import { getDashboardSummary, getAnalyticsRecovery, getAnalyticsCauses, getPortfolioAnalytics, getAnalyticsRecoveryPerformance } from '../services/api';

const COLORS = ['#6366f1', '#14b8a6', '#f43f5e', '#f59e0b', '#8b5cf6'];

const formatINR = (value) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

export function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [riskTrendData, setRiskTrendData] = useState([]);
  const [topCausesData, setTopCausesData] = useState([]);
  const [portfolioData, setPortfolioData] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  
  const funnelData = metrics ? [
    { name: 'Revenue at Risk', value: metrics.funnel_total_risk ?? metrics.revenue_at_risk },
    { name: 'Eligible for Recovery', value: metrics.funnel_eligible ?? metrics.revenue_at_risk },
    { name: 'Intervention Executed', value: metrics.funnel_intervention ?? metrics.revenue_in_intervention },
    { name: 'Recovered', value: metrics.funnel_recovered ?? metrics.revenue_recovered },
  ] : [];

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [summaryData, trendData, causesData, portfolioDataRaw, perfData] = await Promise.all([
        getDashboardSummary(),
        getAnalyticsRecovery(),
        getAnalyticsCauses(),
        getPortfolioAnalytics(),
        getAnalyticsRecoveryPerformance()
      ]);
      
      setMetrics(summaryData);
      setRiskTrendData(trendData.trend_data || []);
      setTopCausesData(causesData.top_causes || []);
      setPortfolioData(portfolioDataRaw);
      setPerformanceData(perfData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <StateWrapper loading={loading} error={error} onRetry={fetchData}>
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Recovery Overview</h2>
          <p className="text-slate-400 mt-1">Real-time revenue recovery and risk tracking.</p>
        </div>
        <div className="flex items-center gap-3 bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 rounded-lg">
          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></div>
          <span className="text-sm font-medium text-indigo-400">Live Monitoring</span>
        </div>
      </div>

      {/* Prominent Revenue Recovered Metric */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp className="w-24 h-24 text-indigo-400" />
          </div>
          <div className="relative z-10">
            <p className="text-indigo-300 font-medium text-lg mb-2">Revenue Recovered</p>
            <h3 className="text-5xl font-bold text-white mb-4">
              {metrics && formatINR(metrics.revenue_recovered)}
            </h3>
            <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
              <span>No historical comparison</span>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6 flex flex-col justify-center">
          <p className="text-slate-400 font-medium text-lg mb-2">Recovery Rate</p>
          <div className="flex items-end gap-4 mb-4">
            <h3 className="text-5xl font-bold text-emerald-400">
              {metrics && metrics.recovery_rate !== null && metrics.recovery_rate !== undefined ? `${metrics.recovery_rate}%` : '—'}
            </h3>
            <p className="text-slate-500 text-sm mb-2">
              {metrics && metrics.recovery_rate !== null && metrics.recovery_rate !== undefined ? 'of Expected Recovery' : 'No active expected recovery'}
            </p>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2">
            <div 
              className="bg-emerald-500 h-2 rounded-full transition-all duration-1000" 
              style={{ width: `${metrics && metrics.recovery_rate !== null ? metrics.recovery_rate : 0}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Processed"
          value={metrics ? formatINR(metrics.total_revenue_processed) : ''}
          icon={<IndianRupee className="w-5 h-5 text-slate-400" />}
          trend="No historical comparison"
          trendUp={true}
        />
        <StatCard
          title="Revenue at Risk"
          value={metrics ? formatINR(metrics.revenue_at_risk) : ''}
          icon={<AlertCircle className="w-5 h-5 text-rose-400" />}
          trend="No historical comparison"
          trendUp={false}
        />
        <StatCard
          title="Expected Recovery"
          value={metrics ? formatINR(metrics.recoverable_revenue) : ''}
          icon={<Activity className="w-5 h-5 text-indigo-400" />}
          trend="No historical comparison"
          trendUp={true}
        />
        <StatCard
          title="Failed Payments"
          value={metrics ? metrics.failed_payments.toString() : ''}
          icon={<CreditCard className="w-5 h-5 text-slate-400" />}
          trend="No historical comparison"
          trendUp={true}
        />
      </div>

      {/* AI PERFORMANCE (SYNTHETIC DEMO DATA) */}
      {performanceData && (
        <div className="bg-gradient-to-br from-indigo-950/40 to-surface border border-indigo-500/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-400" /> AI Performance
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                {performanceData.total_predictions === 1 
                  ? "Based on 1 synthetic outcome" 
                  : performanceData.total_predictions > 1 
                    ? `Based on ${performanceData.total_predictions} synthetic outcomes`
                    : "No synthetic outcomes recorded yet"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {performanceData.recovered > 0 && (
                <div className="flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded text-xs text-indigo-300 font-medium">
                  <Zap className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Latest Synthetic Batch: {performanceData.recovered} recovered / {formatINR(metrics?.revenue_recovered || 0)}</span>
                </div>
              )}
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold px-3 py-1 rounded uppercase tracking-wide">
                SYNTHETIC DEMO
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
               <p className="text-slate-400 text-xs uppercase mb-1">Total Predictions</p>
               <h4 className="text-2xl font-bold text-slate-100">{performanceData.total_predictions}</h4>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
               <p className="text-slate-400 text-xs uppercase mb-1">Synthetic Recoveries</p>
               <h4 className="text-2xl font-bold text-emerald-400">{performanceData.recovered}</h4>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
               <p className="text-slate-400 text-xs uppercase mb-1">Opportunity Recovery Rate</p>
               <h4 className="text-2xl font-bold text-indigo-400">{performanceData.total_predictions > 0 ? `${(performanceData.actual_recovery_rate * 100).toFixed(1)}%` : '—'}</h4>
               <p className="text-[10px] text-slate-500 mt-0.5">({performanceData.recovered} / {performanceData.total_predictions} opps)</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
               <p className="text-slate-400 text-xs uppercase mb-1">Prediction Accuracy</p>
               <h4 className="text-2xl font-bold text-indigo-400">{performanceData.total_predictions > 0 ? `${(performanceData.prediction_accuracy * 100).toFixed(1)}%` : '—'}</h4>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
               <p className="text-slate-400 text-xs uppercase mb-1">Brier Score</p>
               <h4 className="text-2xl font-bold text-slate-100">{performanceData.total_predictions > 0 ? performanceData.brier_score.toFixed(3) : '—'}</h4>
            </div>
          </div>
          
          <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6">
             <div className="flex items-center justify-between mb-4">
               <h4 className="text-sm font-semibold text-slate-300">Predicted vs Observed Recovery Rate (Calibration Buckets)</h4>
               {performanceData.total_predictions > 0 && performanceData.total_predictions < 5 && (
                 <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded font-medium">
                   Limited sample size (n={performanceData.total_predictions})
                 </span>
               )}
             </div>
             <div className="h-[250px]">
               {performanceData.total_predictions > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                   <ComposedChart data={performanceData.calibration_buckets} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                     <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                     <XAxis dataKey="bucket" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                     <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} domain={[0, 1]} />
                     <Tooltip 
                       contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
                       itemStyle={{ color: '#e2e8f0' }}
                       formatter={(value, name) => [
                         name === 'Observed Rate' ? (value !== null ? `${(value * 100).toFixed(1)}%` : 'N/A') : value,
                         name
                       ]}
                     />
                     <Bar dataKey="observed_recovery_rate" name="Observed Rate" fill="#14b8a6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                     <Line type="monotone" dataKey="average_predicted_probability" name="Average Predicted Prob" stroke="#6366f1" strokeWidth={2} dot={{ r: 4, fill: '#6366f1' }} />
                   </ComposedChart>
                 </ResponsiveContainer>
               ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 bg-slate-800/30 rounded-lg border border-dashed border-slate-700">
                  <Activity className="w-8 h-8 text-slate-500 mb-2 opacity-50" />
                  <p className="text-slate-400 font-medium">No synthetic outcomes yet</p>
                </div>
               )}
             </div>
          </div>
        </div>
      )}

      {/* PORTFOLIO AI INTELLIGENCE */}
      {portfolioData && (
        <div className="bg-gradient-to-br from-indigo-950/40 to-surface border border-indigo-500/20 rounded-xl overflow-hidden shadow-lg shadow-indigo-900/10">
          <div className="p-6 border-b border-indigo-500/20 bg-indigo-500/5">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" /> AI Portfolio Intelligence
            </h3>
            <p className="text-sm text-slate-400 mt-1">Live forecasting of active revenue risk utilizing real-time ML analysis.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-indigo-500/10 border-b border-indigo-500/10">
            <div className="p-6">
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">Active Amount At Risk</p>
              <p className="text-2xl font-bold text-slate-100">{formatINR(portfolioData.total_amount_at_risk)}</p>
            </div>
            <div className="p-6">
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">Expected Recovery</p>
              <p className="text-2xl font-bold text-emerald-400">{formatINR(portfolioData.expected_recovery)}</p>
            </div>
            <div className="p-6">
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">Expected Rate</p>
              <p className="text-2xl font-bold text-emerald-400">
                {portfolioData.opportunity_count === 0 
                  ? '—'
                  : portfolioData.expected_recovery_rate !== null && portfolioData.expected_recovery_rate !== undefined
                  ? `${(portfolioData.expected_recovery_rate * 100).toFixed(1)}%`
                  : '—'}
              </p>
              {portfolioData.opportunity_count === 0 && (
                <p className="text-[11px] text-slate-500 mt-1">No active opportunities</p>
              )}
            </div>
            <div className="p-6">
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">Active Opportunities</p>
              <p className="text-2xl font-bold text-slate-100">{portfolioData.opportunity_count}</p>
            </div>
          </div>
          
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/50 border-b border-indigo-500/10">
                  <th className="px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Rank</th>
                  <th className="px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Opportunity</th>
                  <th className="px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider text-right">Amount at Risk</th>
                  <th className="px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider text-right">AI Prob</th>
                  <th className="px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider text-right">Expected</th>
                  <th className="px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider text-right">Priority Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-500/10">
                {portfolioData.opportunities.map((opp, index) => (
                  <tr key={opp.opportunity_id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold border border-indigo-500/30">
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm text-slate-300">{opp.opportunity_id}</span>
                      <p className="text-xs text-slate-500">{opp.transaction_id}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-300">
                      {formatINR(opp.amount_at_risk)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm font-bold text-emerald-400">
                        {(opp.recovery_probability * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-emerald-400">
                      {formatINR(opp.expected_recovery)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs font-medium bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700">
                        {opp.recommended_action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-mono text-indigo-300">
                      {formatINR(opp.priority_score)} priority
                    </td>
                  </tr>
                ))}
                {portfolioData.opportunities.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-sm text-slate-500">
                      No active opportunities in the portfolio.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recovery Performance Chart */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-100">Recovery Performance (Today)</h3>
            <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded">
              Synthetic Demo Performance
            </span>
          </div>
          <div className="h-[300px]">
            {metrics && (metrics.revenue_recovered > 0 || riskTrendData.length > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={riskTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
                    itemStyle={{ color: '#e2e8f0' }}
                    formatter={(value) => formatINR(value)}
                  />
                  <Area yAxisId="left" type="monotone" dataKey="amountAtRisk" name="Amount at Risk" fill="#f43f5e20" stroke="#f43f5e" />
                  <Bar yAxisId="left" dataKey="recovered" name="Recovered" fill="#14b8a6" radius={[4, 4, 0, 0]} barSize={30} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 bg-slate-800/30 rounded-lg border border-dashed border-slate-700">
                  <Activity className="w-10 h-10 text-slate-500 mb-3 opacity-50" />
                  <p className="text-slate-300 font-medium">No recovery outcomes yet</p>
                  <p className="text-slate-500 text-sm mt-1 max-w-[250px]">Complete a synthetic recovery workflow to populate today's recovery performance.</p>
                </div>
            )}
          </div>
        </div>

        {/* Recovery Funnel */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-100">Recovery Funnel</h3>
            <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded">
              Synthetic Batch Funnel
            </span>
          </div>
          <div className="h-[300px]">
            {metrics && (metrics.revenue_recovered > 0 || (metrics.funnel_intervention && metrics.funnel_intervention > 0)) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={true} vertical={false} />
                  <XAxis type="number" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value/1000}k`} />
                  <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} width={130} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
                    itemStyle={{ color: '#e2e8f0' }}
                    formatter={(value) => formatINR(value)}
                  />
                  <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]}>
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 bg-slate-800/30 rounded-lg border border-dashed border-slate-700">
                  <Funnel className="w-10 h-10 text-slate-500 mb-3 opacity-50" />
                  <p className="text-slate-300 font-medium">No completed recovery outcomes yet</p>
                  <p className="text-slate-500 text-sm mt-2">Active revenue risk: <span className="font-bold text-slate-300">{metrics ? formatINR(metrics.revenue_at_risk) : ''}</span></p>
                </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Causes */}
        <div className="bg-surface border border-border rounded-xl p-6 lg:col-span-1">
          <h3 className="text-lg font-semibold text-slate-100 mb-6">Top Revenue Loss Causes</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={topCausesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {topCausesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-4">
            {topCausesData.map((cause, index) => {
              const total = topCausesData.reduce((sum, c) => sum + c.value, 0);
              const percent = total > 0 ? ((cause.value / total) * 100).toFixed(1) : 0;
              return (
                <div key={cause.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <span className="text-slate-300">{cause.name}</span>
                  </div>
                  <span className="font-medium text-slate-100">{percent}%</span>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Active Workflows summary */}
        <div className="bg-surface border border-border rounded-xl p-6 lg:col-span-2">
           <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-100">Quick Stats</h3>
           </div>
           <div className="grid grid-cols-2 gap-4 h-full pb-10">
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-5 flex flex-col justify-center items-center text-center">
                 <PlayCircle className="w-8 h-8 text-indigo-400 mb-3" />
                 <h4 className="text-3xl font-bold text-slate-100 mb-1">{metrics && metrics.active_recovery_workflows}</h4>
                 <p className="text-slate-400 text-sm">Active Recovery Workflows</p>
              </div>
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-5 flex flex-col justify-center items-center text-center">
                 <Funnel className="w-8 h-8 text-rose-400 mb-3" />
                 <h4 className="text-3xl font-bold text-slate-100 mb-1">{metrics && metrics.checkout_abandonments}</h4>
                 <p className="text-slate-400 text-sm">Checkout Abandonments</p>
              </div>
           </div>
        </div>
      </div>
    </div>
    </StateWrapper>
  );
}
