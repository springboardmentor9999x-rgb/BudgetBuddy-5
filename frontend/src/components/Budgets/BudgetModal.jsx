import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { X, PiggyBank } from 'lucide-react';

const CATEGORIES = ['Food', 'Travel', 'Shopping', 'Education', 'Entertainment', 'Miscellaneous'];

const BudgetModal = ({ isOpen, onClose, onSuccess, initialData = null, defaultMonth }) => {
  const [formData, setFormData] = useState({
    category: 'Food',
    amount_allocated: '',
    month: defaultMonth || new Date().toISOString().slice(0, 7),
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        category: initialData.category || 'Food',
        amount_allocated: initialData.amount_allocated || '',
        month: initialData.month || defaultMonth || new Date().toISOString().slice(0, 7),
        description: initialData.description || ''
      });
    }
  }, [initialData, defaultMonth]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        category: formData.category,
        amount_allocated: parseFloat(formData.amount_allocated),
        month: formData.month,
        description: formData.description
      };

      if (initialData?.id) {
        await api.put(`/budgets/${initialData.id}`, { amount_allocated: payload.amount_allocated });
      } else {
        await api.post('/budgets/', payload);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to set budget allocation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-md glass-panel rounded-2xl border border-slate-700/80 shadow-2xl p-6 relative">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2 text-indigo-400">
            <PiggyBank className="w-5 h-5" />
            <h3 className="text-lg font-bold text-slate-100">
              {initialData ? 'Update Category Budget' : 'Set Category Budget'}
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
            <label className="block text-xs font-semibold text-slate-300 mb-1">Expense Category</label>
            <select
              disabled={!!initialData}
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Allocated Budget ($)</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="e.g. 250.00"
                value={formData.amount_allocated}
                onChange={(e) => setFormData({ ...formData, amount_allocated: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Target Month</label>
              <input
                type="month"
                required
                disabled={!!initialData}
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Description / Notes <span className="text-rose-400 font-bold">* (Required)</span>
            </label>
            <textarea
              rows="2"
              required
              placeholder="Add budget allocation description & plan details..."
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
              {loading ? 'Saving...' : initialData ? 'Update Allocation' : 'Set Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BudgetModal;
