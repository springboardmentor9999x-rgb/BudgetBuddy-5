import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout/Layout';
import api from '../services/api';
import BudgetModal from '../components/Budgets/BudgetModal';
import { PiggyBank, Plus, Trash2, Edit3, AlertTriangle, CheckCircle2, XCircle, Calendar, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const BudgetsPage = () => {
  const { fetchNotifications } = useAuth();
  const { showToast } = useToast();

  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);

  // Delete Confirmation Modal State
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/budgets/?month=${selectedMonth}`);
      setBudgets(res.data);
    } catch (err) {
      console.error('Failed to load budgets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [selectedMonth]);

  const confirmDeleteBudget = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      await api.delete(`/budgets/${deleteTargetId}`);
      showToast('Budget allocation removed', 'success');
      fetchBudgets();
      fetchNotifications();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to delete budget', 'error');
    } finally {
      setDeleting(false);
      setDeleteTargetId(null);
    }
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setIsModalOpen(true);
  };

  const totalAllocated = budgets.reduce((sum, b) => sum + b.amount_allocated, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.amount_spent, 0);

  const getStatusBadge = (status, pct) => {
    if (status === 'exceeded') {
      return (
        <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[11px] font-bold flex items-center gap-1">
          <XCircle className="w-3.5 h-3.5" /> Exceeded ({pct}%)
        </span>
      );
    }
    if (status === 'warning') {
      return (
        <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-bold flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5" /> Warning ({pct}%)
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold flex items-center gap-1">
        <CheckCircle2 className="w-3.5 h-3.5" /> On Track ({pct}%)
      </span>
    );
  };

  return (
    <Layout onRefreshData={fetchBudgets}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 mb-1">
              <PiggyBank className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Budget Planning System</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white">Monthly Category Budgets</h2>
            <p className="text-xs text-slate-400 mt-1">Allocate monthly spending limits and avoid overspending with real-time alerts.</p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={() => {
                setEditingBudget(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Set Budget
            </button>
          </div>
        </div>

        {/* Overall Month Summary Banner */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Total Allocated</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">${totalAllocated.toFixed(2)}</h3>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Total Spent So Far</p>
            <h3 className="text-2xl font-extrabold text-indigo-400 mt-1">${totalSpent.toFixed(2)}</h3>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Overall Utilization</p>
            <h3 className="text-2xl font-extrabold text-purple-400 mt-1">
              {totalAllocated > 0 ? ((totalSpent / totalAllocated) * 100).toFixed(1) : 0}%
            </h3>
          </div>
        </div>

        {/* Budget Allocation Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-12 text-center text-slate-500">Loading budget allocations...</div>
          ) : budgets.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500 glass-panel rounded-3xl">
              No category budget set for {selectedMonth}. Click "+ Set Budget" to create one!
            </div>
          ) : (
            budgets.map((b) => (
              <div key={b.id} className="glass-card glass-card-hover p-6 rounded-3xl border border-slate-800 flex flex-col justify-between space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">{b.category}</span>
                    <h4 className="text-xl font-extrabold text-white mt-0.5">
                      ${b.amount_spent.toFixed(2)}{' '}
                      <span className="text-xs font-normal text-slate-400">/ ${b.amount_allocated.toFixed(2)}</span>
                    </h4>
                  </div>
                  {getStatusBadge(b.status, b.utilization_percentage)}
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        b.status === 'exceeded'
                          ? 'bg-rose-500'
                          : b.status === 'warning'
                          ? 'bg-amber-500'
                          : 'bg-indigo-500'
                      }`}
                      style={{ width: `${Math.min(b.utilization_percentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                    <span>Remaining: ${Math.max(b.amount_allocated - b.amount_spent, 0).toFixed(2)}</span>
                    <span className="font-bold text-slate-300">{b.utilization_percentage}%</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => handleEdit(b)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => setDeleteTargetId(b.id)}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs flex items-center gap-1 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {isModalOpen && (
        <BudgetModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingBudget(null);
          }}
          onSuccess={(msg) => {
            fetchBudgets();
            fetchNotifications();
            if (msg) showToast(msg, 'success');
          }}
          initialData={editingBudget}
          defaultMonth={selectedMonth}
        />
      )}

      {/* In-Site Dark Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-[#0E1726] p-6 rounded-3xl border border-rose-500/40 shadow-2xl max-w-sm w-full space-y-4">
            <div className="flex items-center justify-between border-b border-rose-500/20 pb-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
                <span>Remove Budget Allocation</span>
              </div>
              <button onClick={() => setDeleteTargetId(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to remove this category budget allocation?
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
                onClick={confirmDeleteBudget}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-md shadow-rose-600/30 transition disabled:opacity-50"
              >
                {deleting ? 'Removing...' : 'Remove Budget'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default BudgetsPage;
