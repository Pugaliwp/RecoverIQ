import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, CreditCard, ShieldAlert } from 'lucide-react';
import { getTransaction } from '../services/api';
import { StateWrapper } from '../components/StateWrapper';
import { cn } from '../components/RiskBadge';

const formatINR = (value) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

export function TransactionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [txn, setTxn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTransaction(id);
      setTxn(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  return (
    <StateWrapper loading={loading} error={error} onRetry={fetchData}>
    {txn && (
    <div className="p-8 space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <button 
        onClick={() => navigate('/transactions')}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-100 transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Transactions
      </button>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">{txn.transaction_id}</h2>
          <p className="text-slate-400">Customer: {txn.customer_id}</p>
        </div>
        <div>
          <span className="px-3 py-1.5 text-sm font-medium rounded-full border bg-slate-800 border-slate-700 text-slate-200">
            {txn.payment_status}
          </span>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
         <div>
            <h3 className="text-sm text-slate-400 mb-1">Amount</h3>
            <p className="text-2xl font-bold text-slate-100">{formatINR(txn.amount)}</p>
         </div>
         <div>
            <h3 className="text-sm text-slate-400 mb-1">Timestamp</h3>
            <p className="text-lg font-medium text-slate-200">{new Date(txn.timestamp).toLocaleString()}</p>
         </div>
         <div>
            <h3 className="text-sm text-slate-400 mb-1">Payment Method</h3>
            <p className="text-lg font-medium text-slate-200">{txn.payment_method}</p>
         </div>
         <div>
            <h3 className="text-sm text-slate-400 mb-1">Failure Reason</h3>
            <p className="text-lg font-medium text-rose-400">{txn.failure_reason || 'None'}</p>
         </div>
      </div>
    </div>
    )}
    </StateWrapper>
  );
}
