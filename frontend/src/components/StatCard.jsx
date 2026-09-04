import React from 'react';
import { cn } from './RiskBadge';

export function StatCard({ title, value, icon, trend, trendUp, className }) {
  return (
    <div className={cn("bg-surface border border-border rounded-xl p-5 shadow-sm", className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-400">{title}</p>
        {icon}
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-2 flex-wrap">
        <h3 className="text-2xl font-semibold text-slate-50">{value}</h3>
        {trend && (
          <span className={cn(
            "text-xs font-medium px-1.5 py-0.5 rounded",
            trend === "No historical comparison"
              ? "text-slate-500 bg-slate-800/50 border border-slate-700/50"
              : trendUp ? "text-emerald-400" : "text-rose-400"
          )}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
