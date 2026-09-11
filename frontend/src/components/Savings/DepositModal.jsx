import React, { useState } from 'react';
import api from '../../services/api';
import { X, PlusCircle } from 'lucide-react';

const DepositModal = ({ isOpen, onClose, onSuccess, goal }) => {
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !goal) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post(`/savings/${goal.id}/deposit`, { amount: parseFloat(amount) });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to deposit contribution');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-sm glass-panel rounded-2xl border border-slate-700/80 shadow-2xl p-6 relative">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2 text-emerald-400">
            <PlusCircle className="w-5 h-5" />
            <h3 className="text-base font-bold text-slate-100">Deposit Savings Contribution</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400 mb-4">
          Add money to <strong className="text-slate-200">{goal.title}</strong> target.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Contribution Amount ($)</label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="e.g. 50.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Deposit Description <span className="text-rose-400 font-bold">* (Required)</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Monthly deposit, bonus savings"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
            >
              {loading ? 'Depositing...' : 'Confirm Deposit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DepositModal;
