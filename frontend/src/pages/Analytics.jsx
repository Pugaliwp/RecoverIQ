import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, ComposedChart, Legend
} from 'recharts';
import { 
  TrendingUp, Activity, BarChart3, PieChart as PieChartIcon
} from 'lucide-react';
import { StateWrapper } from '../components/StateWrapper';
import { getAnalyticsRecovery, getAnalyticsCauses, getDashboardSummary } from '../services/api';

const formatINR = (value) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value || 0);
};

export function Analytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [riskTrendData, setRiskTrendData] = useState([]);
  const [topCausesData, setTopCausesData] = useState([]);
  const [summaryMetrics, setSummaryMetrics] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [trendData, causesData, summary] = await Promise.all([
        getAnalyticsRecovery(),
        getAnalyticsCauses(),
        getDashboardSummary()
      ]);
      setRiskTrendData(trendData.trend_data || []);
      setTopCausesData(causesData.top_causes || []);
      setSummaryMetrics(summary);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const funnelData = summaryMetrics ? [
    { name: 'Revenue at Risk', value: summaryMetrics.funnel_total_risk ?? summaryMetrics.revenue_at_risk ?? 0 },
    { name: 'Eligible for Recovery', value: summaryMetrics.funnel_eligible ?? summaryMetrics.revenue_at_risk ?? 0 },
    { name: 'Intervention Executed', value: summaryMetrics.funnel_intervention ?? summaryMetrics.revenue_in_intervention ?? 0 },
    { name: 'Recovered', value: summaryMetrics.funnel_recovered ?? summaryMetrics.revenue_recovered ?? 0 },
  ] : [];

  const hasOutcomes = summaryMetrics && (summaryMetrics.revenue_recovered > 0 || summaryMetrics.revenue_in_intervention > 0);
  const hasTrend = riskTrendData && riskTrendData.length > 0 && riskTrendData.some(d => d.recovered > 0 || d.amountAtRisk > 0);

  return (
    <StateWrapper loading={loading} error={error} onRetry={fetchData}>
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-400" />
            Recovery Analytics
          </h2>
          <p className="text-slate-400 mt-1">Deep dive into revenue recovery performance and AI intervention metrics.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recovery Trend Analysis */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              Expected vs Actual Recovery
            </h3>
            <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded uppercase tracking-wide">
              Synthetic Demo
            </span>
          </div>
          <div className="h-[350px]">
            {hasTrend ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={riskTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
                    itemStyle={{ color: '#e2e8f0' }}
                    formatter={(value) => formatINR(value)}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="amountAtRisk" name="Expected Recovery" stroke="#f43f5e" strokeWidth={2} dot={{ r: 4, fill: '#f43f5e' }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="recovered" name="Actual Recovered" stroke="#10b981" strokeWidth={2} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 bg-slate-800/30 rounded-lg border border-dashed border-slate-700">
                <TrendingUp className="w-10 h-10 text-slate-500 mb-3 opacity-50" />
                <p className="text-slate-300 font-medium text-base">No recovery outcomes yet</p>
                <p className="text-slate-500 text-sm mt-1 max-w-[280px]">Execute recovery workflows to populate performance trend metrics.</p>
              </div>
            )}
          </div>
        </div>

        {/* Funnel Dropoff */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" />
              Conversion Funnel Analysis
            </h3>
            <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded uppercase tracking-wide">
              Synthetic Demo
            </span>
          </div>
          <div className="h-[350px]">
            {hasOutcomes ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={funnelData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
                    itemStyle={{ color: '#e2e8f0' }}
                    formatter={(value) => formatINR(value)}
                  />
                  <Area type="monotone" dataKey="value" name="Volume" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 bg-slate-800/30 rounded-lg border border-dashed border-slate-700">
                <Activity className="w-10 h-10 text-slate-500 mb-3 opacity-50" />
                <p className="text-slate-300 font-medium text-base">No recovery outcomes yet</p>
                <p className="text-slate-500 text-sm mt-1 max-w-[280px]">Active revenue risk: <span className="font-bold text-slate-300">{summaryMetrics ? formatINR(summaryMetrics.revenue_at_risk) : '₹0'}</span></p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </StateWrapper>
  );
}
