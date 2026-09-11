import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { X, Wallet, Building2 } from 'lucide-react';

const INCOME_CATEGORIES = ['Pocket Money', 'Scholarship', 'Freelance', 'Part-Time Job', 'Other'];

const IncomeModal = ({ isOpen, onClose, onSuccess, initialData = null }) => {
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'Pocket Money',
    date: new Date().toISOString().split('T')[0],
    description: '',
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
        console.error('Failed to load bank accounts for income modal', err);
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
        category: initialData.category || 'Pocket Money',
        date: initialData.date ? initialData.date.split('T')[0] : new Date().toISOString().split('T')[0],
        description: initialData.description || '',
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
        description: formData.description,
        bank_account_id: formData.bank_account_id ? parseInt(formData.bank_account_id) : null
      };

      if (initialData?.id) {
        await api.put(`/incomes/${initialData.id}`, payload);
        onSuccess(`Income '${payload.title}' updated successfully!`);
      } else {
        await api.post('/incomes/', payload);
        onSuccess(`Income '${payload.title}' of $${payload.amount.toFixed(2)} added successfully!`);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save income record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-md glass-panel rounded-2xl border border-slate-700/80 shadow-2xl p-6 relative">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2 text-emerald-400">
            <Wallet className="w-5 h-5" />
            <h3 className="text-lg font-bold text-slate-100">
              {initialData ? 'Edit Income Record' : 'Add Income Source'}
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
            <label className="block text-xs font-semibold text-slate-300 mb-1">Income Source / Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Monthly Allowance, Academic Grant"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
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
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                {INCOME_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-cyan-300 mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-cyan-400" />
              Deposit Into Bank Account (Optional)
            </label>
            <select
              value={formData.bank_account_id}
              onChange={(e) => setFormData({ ...formData, bank_account_id: e.target.value })}
              className="w-full bg-slate-900 border border-cyan-900/60 rounded-xl px-3 py-2 text-sm text-cyan-100 focus:outline-none focus:border-cyan-500"
            >
              <option value="">-- No Bank Account Linked (Manual Income) --</option>
              {bankAccounts.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.bank_name} - {b.account_name} (•••• {b.account_number_last4}) [Balance: ${b.current_balance.toFixed(2)}]
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Received Date</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Description <span className="text-rose-400 font-bold">* (Required)</span>
            </label>
            <textarea
              rows="2"
              required
              placeholder="Add income description & source details..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
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
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : initialData ? 'Update Income' : 'Save Income'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IncomeModal;
