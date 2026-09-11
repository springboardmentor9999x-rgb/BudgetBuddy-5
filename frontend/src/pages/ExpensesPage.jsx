import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout/Layout';
import api from '../services/api';
import ExpenseModal from '../components/Expenses/ExpenseModal';
import { Plus, Search, Trash2, Edit3, Receipt, CreditCard, AlertTriangle, X } from 'lucide-react';
import CategoryBadge from '../components/Common/CategoryBadge';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const CATEGORIES = ['All', 'Food', 'Travel', 'Shopping', 'Education', 'Entertainment', 'Miscellaneous'];

const ExpensesPage = () => {
  const { fetchNotifications } = useAuth();
  const { showToast } = useToast();

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  
  // Delete Confirmation Modal State
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      let url = '/expenses/';
      const params = new URLSearchParams();
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (monthFilter) params.append('month', monthFilter);
      if (searchQuery) params.append('search', searchQuery);

      if (params.toString()) url += `?${params.toString()}`;

      const res = await api.get(url);
      setExpenses(res.data);
    } catch (err) {
      console.error('Failed to load expenses', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [selectedCategory, monthFilter, searchQuery]);

  const confirmDeleteExpense = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      await api.delete(`/expenses/${deleteTargetId}`);
      showToast('Expense removed successfully', 'success');
      fetchExpenses();
      fetchNotifications();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to delete expense', 'error');
    } finally {
      setDeleting(false);
      setDeleteTargetId(null);
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setIsModalOpen(true);
  };

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <Layout onRefreshData={fetchExpenses}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-rose-400 mb-1">
              <Receipt className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Transaction Management</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white">Expenses Tracker</h2>
            <p className="text-xs text-slate-400 mt-1">Manage and track your daily spending habits accurately.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right mr-2 hidden sm:block">
              <p className="text-[11px] text-slate-400 font-semibold uppercase">Total Filtered</p>
              <p className="text-xl font-extrabold text-rose-400">${totalSpent.toFixed(2)}</p>
            </div>
            <button
              onClick={() => {
                setEditingExpense(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition"
            >
              <Plus className="w-4 h-4" />
              Add Expense
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 md:pb-0">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                    selectedCategory === cat
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/30 font-extrabold'
                      : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-cyan-900/40'
                  }`}
                >
                  {cat !== 'All' && <CategoryBadge category={cat} showIconOnly={true} />}
                  <span>{cat}</span>
                </button>
              ))}
            </div>

            {/* Month Filter */}
            <input
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Expense List Table */}
        <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-4">Title & Details</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Payment Method</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-slate-500">Loading expenses...</td>
                  </tr>
                ) : expenses.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-slate-500">
                      No expense records matching filters. Click "+ Add Expense" to record one!
                    </td>
                  </tr>
                ) : (
                  expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-900/40 transition">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-200 text-sm">{exp.title}</p>
                        {exp.bank_account && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-800/40 mt-1">
                            💳 {exp.bank_account.bank_name} (•••• {exp.bank_account.account_number_last4})
                          </span>
                        )}
                        {exp.notes && <p className="text-[11px] text-slate-400 mt-0.5">{exp.notes}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <CategoryBadge category={exp.category} />
                      </td>
                      <td className="px-6 py-4 text-slate-400 flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                        {exp.payment_method}
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {new Date(exp.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right font-extrabold text-rose-400 text-sm">
                        -${exp.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(exp)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTargetId(exp.id)}
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
        <ExpenseModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingExpense(null);
          }}
          onSuccess={(msg) => {
            fetchExpenses();
            fetchNotifications();
            if (msg) showToast(msg, 'success');
          }}
          initialData={editingExpense}
        />
      )}

      {/* In-Site Dark Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-[#0E1726] p-6 rounded-3xl border border-rose-500/40 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-rose-500/20 pb-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
                <span>Delete Expense Entry</span>
              </div>
              <button onClick={() => setDeleteTargetId(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete this expense record? This action cannot be undone and will update your net budget.
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
                onClick={confirmDeleteExpense}
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

export default ExpensesPage;
