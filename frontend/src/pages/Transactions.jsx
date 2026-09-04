import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { getTransactions } from '../services/api';
import { StateWrapper } from '../components/StateWrapper';
import { cn } from '../components/RiskBadge';

const formatINR = (value) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

export function Transactions() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTransactions();
      setTransactions(data);
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
      case 'SUCCESS': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'FAILED': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'ABANDONED': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'SUBSCRIPTION_FAILED': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <StateWrapper loading={loading} error={error} onRetry={fetchData}>
    <div className="p-8 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">All Transactions</h2>
          <p className="text-slate-400 mt-1">Raw view of processed payment transactions.</p>
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
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Transaction ID</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Method</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Failure Reason</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transactions.map((txn) => (
                <tr 
                  key={txn.transaction_id} 
                  className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                  onClick={() => navigate(`/transactions/${txn.transaction_id}`)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-mono text-sm text-indigo-400">{txn.transaction_id}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-slate-300">{txn.customer_id}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-slate-200">{formatINR(txn.amount)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-slate-300">{txn.payment_method}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn("px-2.5 py-1 text-xs font-medium rounded-full border", getStatusColor(txn.payment_status))}>
                      {txn.payment_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-slate-300">{txn.failure_reason || '-'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button 
                      className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/transactions/${txn.transaction_id}`);
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
      </div>
    </div>
    </StateWrapper>
  );
}
