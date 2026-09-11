import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout/Layout';
import api from '../services/api';
import IncomeModal from '../components/Income/IncomeModal';
import { Wallet, Plus, Trash2, Edit3, ArrowUpRight, Sparkles, AlertTriangle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const CATEGORIES = ['All', 'Pocket Money', 'Scholarship', 'Freelance', 'Part-Time Job', 'Other'];

const IncomePage = () => {
  const { fetchNotifications } = useAuth();
  const { showToast } = useToast();

  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [monthFilter, setMonthFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);

  // Delete Confirmation Modal State
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchIncomes = async () => {
    setLoading(true);
    try {
      let url = '/incomes/';
      const params = new URLSearchParams();
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (monthFilter) params.append('month', monthFilter);

      if (params.toString()) url += `?${params.toString()}`;

      const res = await api.get(url);
      setIncomes(res.data);
    } catch (err) {
      console.error('Failed to load income records', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomes();
  }, [selectedCategory, monthFilter]);

  const confirmDeleteIncome = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      await api.delete(`/incomes/${deleteTargetId}`);
      showToast('Income entry removed successfully', 'success');
      fetchIncomes();
      fetchNotifications();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to delete income', 'error');
    } finally {
      setDeleting(false);
      setDeleteTargetId(null);
    }
  };

  const handleEdit = (income) => {
    setEditingIncome(income);
    setIsModalOpen(true);
  };

  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);

  return (
    <Layout onRefreshData={fetchIncomes}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 mb-1">
              <Wallet className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Income Management</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white">Income Sources & Allowances</h2>
            <p className="text-xs text-slate-400 mt-1">Track pocket money, scholarships, freelance gigs, and part-time jobs.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right mr-2 hidden sm:block">
              <p className="text-[11px] text-slate-400 font-semibold uppercase">Total Income</p>
              <p className="text-xl font-extrabold text-emerald-400">${totalIncome.toFixed(2)}</p>
            </div>
            <button
              onClick={() => {
                setEditingIncome(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/30 transition"
            >
              <Plus className="w-4 h-4" />
              Add Income
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 md:pb-0">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <input
            type="month"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Income Table */}
        <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-4">Title & Details</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Received Date</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-slate-500">Loading income records...</td>
                  </tr>
                ) : incomes.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-slate-500">
                      No income records recorded. Click "+ Add Income" to record your pocket money or earnings!
                    </td>
                  </tr>
                ) : (
                  incomes.map((inc) => (
                    <tr key={inc.id} className="hover:bg-slate-900/40 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-200 text-sm">{inc.title}</p>
                            {inc.bank_account && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-800/40 mt-1">
                                💳 Deposited to {inc.bank_account.bank_name} (•••• {inc.bank_account.account_number_last4})
                              </span>
                            )}
                            {inc.description && <p className="text-[11px] text-slate-400 mt-0.5">{inc.description}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full bg-slate-800 text-emerald-300 border border-slate-700/60 text-[11px] font-medium">
                          {inc.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {new Date(inc.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right font-extrabold text-emerald-400 text-sm">
                        +${inc.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(inc)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTargetId(inc.id)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <IncomeModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingIncome(null);
          }}
          onSuccess={(msg) => {
            fetchIncomes();
            fetchNotifications();
            if (msg) showToast(msg, 'success');
          }}
          initialData={editingIncome}
        />
      )}

      {/* In-Site Dark Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-[#0E1726] p-6 rounded-3xl border border-rose-500/40 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-rose-500/20 pb-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
                <span>Delete Income Entry</span>
              </div>
              <button onClick={() => setDeleteTargetId(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete this income entry? This action cannot be undone and will adjust your total balance.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                disabled={deleting}
                onClick={confirmDeleteIncome}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-md shadow-rose-600/30 transition disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default IncomePage;
