import React, { useState, useEffect } from 'react';
import { Search, Filter, Users, Mail, UserCheck } from 'lucide-react';
import { getCustomers } from '../services/api';
import { StateWrapper } from '../components/StateWrapper';

export function Customers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCustomers();
      setCustomers(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredCustomers = customers.filter((cust) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (cust.customer_id || '').toLowerCase().includes(term) ||
      (cust.name || '').toLowerCase().includes(term) ||
      (cust.email || '').toLowerCase().includes(term)
    );
  });

  return (
    <StateWrapper loading={loading} error={error} onRetry={fetchData}>
      <div className="p-8 space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <Users className="w-6 h-6 text-indigo-400" />
              Customers
            </h2>
            <p className="text-slate-400 mt-1">Customer directory and associated transaction profile records.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search Name, Email, ID..."
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
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Customer ID</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCustomers.map((cust) => (
                  <tr key={cust.id || cust.customer_id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-xs text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded">
                        {cust.customer_id}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-semibold text-xs border border-slate-700">
                          {(cust.name || 'C').charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-slate-200">{cust.name || 'Customer'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-sm text-slate-300">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        <span>{cust.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                      {cust.created_at ? new Date(cust.created_at).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
                {filteredCustomers.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-sm text-slate-500">
                      <Users className="w-10 h-10 text-slate-600 mx-auto mb-3 opacity-50" />
                      <p className="text-slate-300 font-medium text-base">No customer records found</p>
                      <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">
                        Customer records will automatically populate as new payment transactions are created in RecoverIQ.
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
