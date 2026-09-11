import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import CategoryBadge from '../Common/CategoryBadge';
import { X, Receipt, Building2 } from 'lucide-react';

const CATEGORIES = ['Food', 'Travel', 'Shopping', 'Education', 'Entertainment', 'Miscellaneous'];
const PAYMENT_METHODS = ['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Bank Transfer'];

const ExpenseModal = ({ isOpen, onClose, onSuccess, initialData = null }) => {
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'Food',
    date: new Date().toISOString().split('T')[0],
    payment_method: 'Cash',
    notes: '',
    bank_account_id: ''
  });
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const res = await api.get('/banks/');
        setBankAccounts(res.data);
      } catch (err) {
        console.error('Failed to load bank accounts for modal', err);
      }
    };
    if (isOpen) {
      fetchBanks();
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        amount: initialData.amount || '',
        category: initialData.category || 'Food',
        date: initialData.date ? initialData.date.split('T')[0] : new Date().toISOString().split('T')[0],
        payment_method: initialData.payment_method || 'Cash',
        notes: initialData.notes || '',
        bank_account_id: initialData.bank_account_id || ''
      });
    }
  }, [initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        title: formData.title,
        amount: parseFloat(formData.amount),
        category: formData.category,
        date: new Date(formData.date).toISOString(),
        payment_method: formData.payment_method,
        notes: formData.notes,
        bank_account_id: formData.bank_account_id ? parseInt(formData.bank_account_id) : null
      };

      if (initialData?.id) {
        await api.put(`/expenses/${initialData.id}`, payload);
        onSuccess(`Expense '${payload.title}' updated successfully!`);
      } else {
        await api.post('/expenses/', payload);
        onSuccess(`Expense '${payload.title}' of $${payload.amount.toFixed(2)} added successfully!`);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-md glass-panel rounded-2xl border border-slate-700/80 shadow-2xl p-6 relative">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2 text-rose-400">
            <Receipt className="w-5 h-5" />
            <h3 className="text-lg font-bold text-slate-100">
              {initialData ? 'Edit Expense' : 'Add New Expense'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Expense Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Lunch at Chipotle, Gas refill"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Amount ($)</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">Category</label>
                <CategoryBadge category={formData.category} />
              </div>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-cyan-300 mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-cyan-400" />
              Debit From Bank Account / Card (Optional)
            </label>
            <select
              value={formData.bank_account_id}
              onChange={(e) => setFormData({ ...formData, bank_account_id: e.target.value })}
              className="w-full bg-slate-900 border border-cyan-900/60 rounded-xl px-3 py-2 text-sm text-cyan-100 focus:outline-none focus:border-cyan-500"
            >
              <option value="">-- No Bank Account Linked (Manual Expense) --</option>
              {bankAccounts.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.bank_name} - {b.account_name} (•••• {b.account_number_last4}) {b.account_limit > 0 ? `[Avail: $${Math.max(0, b.account_limit - Math.abs(b.current_balance)).toFixed(2)} / Limit: $${b.account_limit.toFixed(0)}]` : `[Bal: $${b.current_balance.toFixed(2)}]`}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Date</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Method</label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm} value={pm}>{pm}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Description / Notes <span className="text-rose-400 font-bold">* (Required)</span>
            </label>
            <textarea
              rows="2"
              required
              placeholder="Add expense description & details..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="pt-3 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm font-semibold hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : initialData ? 'Update Expense' : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseModal;
