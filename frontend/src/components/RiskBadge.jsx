import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const riskStyles = {
  Low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  High: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Critical: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

const statusStyles = {
  Approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Review: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Step-up Verification': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Blocked: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

export function RiskBadge({ level, className }) {
  return (
    <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium border', riskStyles[level], className)}>
      {level}
    </span>
  );
}

export function StatusBadge({ status, className }) {
  return (
    <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium border', statusStyles[status], className)}>
      {status}
    </span>
  );
}
