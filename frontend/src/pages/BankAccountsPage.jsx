import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout/Layout';
import api from '../services/api';
import { 
  Building2, 
  CreditCard, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  RefreshCw, 
  Wallet, 
  ShieldCheck, 
  X,
  Sparkles,
  DollarSign,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const BankAccountsPage = () => {
  const { fetchNotifications } = useAuth();
  const { showToast } = useToast();

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    account_name: '',
    bank_name: '',
    account_type: 'checking',
    account_number_last4: '',
    current_balance: '',
    account_limit: '',
    currency: 'USD',
    is_primary: false,
    color_gradient: 'from-blue-600 to-indigo-800'
  });
  const [submitting, setSubmitting] = useState(false);

  const cardGradients = [
    { label: 'Classic Navy', value: 'from-blue-600 to-indigo-800' },
    { label: 'Emerald Luxury', value: 'from-emerald-600 to-teal-800' },
    { label: 'Midnight Purple', value: 'from-purple-600 to-pink-700' },
    { label: 'Obsidian Cyan', value: 'from-slate-900 via-cyan-900 to-slate-900 border-cyan-500/30' },
    { label: 'Solar Amber', value: 'from-amber-600 to-orange-700' },
  ];

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/banks/');
      setAccounts(res.data);
    } catch (err) {
      console.error('Failed to load bank accounts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/banks/', {
        ...formData,
        current_balance: parseFloat(formData.current_balance || 0),
        account_limit: parseFloat(formData.account_limit || 0),
        account_number_last4: formData.account_number_last4 || '1234'
      });
      showToast('Bank account linked successfully', 'success');
      setShowModal(false);
      setFormData({
        account_name: '',
        bank_name: '',
        account_type: 'checking',
        account_number_last4: '',
        current_balance: '',
        account_limit: '',
        currency: 'USD',
        is_primary: false,
        color_gradient: 'from-blue-600 to-indigo-800'
      });
      fetchAccounts();
      fetchNotifications();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to link bank account', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeleteAccount = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      await api.delete(`/banks/${deleteTargetId}`);
      showToast('Bank account unlinked successfully', 'success');
      fetchAccounts();
      fetchNotifications();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to unlink account', 'error');
    } finally {
      setDeleting(false);
      setDeleteTargetId(null);
    }
  };

  const totalNetWorth = accounts.reduce((acc, curr) => acc + curr.current_balance, 0);
  const totalChecking = accounts.filter(a => a.account_type === 'checking').reduce((acc, curr) => acc + curr.current_balance, 0);
  const totalSavings = accounts.filter(a => a.account_type === 'savings').reduce((acc, curr) => acc + curr.current_balance, 0);
  const totalCreditCards = accounts.filter(a => a.account_type === 'credit_card').reduce((acc, curr) => acc + curr.current_balance, 0);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Top Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-cyan-900/40">
          <div>
            <div className="flex items-center gap-2 text-cyan-400">
              <Building2 className="w-5 h-5" />
              <h2 className="text-2xl font-extrabold text-white">Bank Accounts & Cards</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">Manage linked bank accounts, debit cards, credit cards, and digital wallets</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs shadow-md shadow-cyan-500/20 flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            Link Bank Account / Card
          </button>
        </div>

        {/* Net Worth Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-5 rounded-2xl border border-cyan-900/30">
            <p className="text-xs font-bold text-cyan-400/80 uppercase">Total Liquid Net Worth</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">${totalNetWorth.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
            <p className="text-[11px] text-slate-400 mt-2">Combined balance across all accounts</p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-cyan-900/30">
            <p className="text-xs font-bold text-blue-400 uppercase">Checking Accounts</p>
            <h3 className="text-2xl font-extrabold text-blue-300 mt-1">${totalChecking.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
            <p className="text-[11px] text-slate-400 mt-2">Primary liquid spending funds</p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-cyan-900/30">
            <p className="text-xs font-bold text-emerald-400 uppercase">Savings Accounts</p>
            <h3 className="text-2xl font-extrabold text-emerald-300 mt-1">${totalSavings.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
            <p className="text-[11px] text-slate-400 mt-2">High yield & emergency savings</p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-cyan-900/30">
            <p className="text-xs font-bold text-purple-400 uppercase">Credit Cards Due</p>
            <h3 className="text-2xl font-extrabold text-purple-300 mt-1">${totalCreditCards.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
            <p className="text-[11px] text-slate-400 mt-2">Active revolving credit lines</p>
          </div>
        </div>

        {/* 3D Bank Cards Grid */}
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Your Linked Cards & Accounts ({accounts.length})</h3>
          
          {loading ? (
            <div className="glass-panel p-8 text-center text-slate-400 text-xs rounded-2xl">
              Loading linked bank accounts...
            </div>
          ) : accounts.length === 0 ? (
            <div className="glass-panel p-12 text-center rounded-3xl border border-cyan-900/40 space-y-3">
              <Building2 className="w-10 h-10 text-cyan-400 mx-auto opacity-70" />
              <h4 className="text-base font-bold text-white">No Bank Accounts Linked Yet</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">Link your checking, savings, or credit cards to see real-time balances and net worth breakdown.</p>
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs shadow-md mt-2 inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Link Your First Account
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className={`relative p-6 rounded-3xl bg-gradient-to-br ${acc.color_gradient} text-white shadow-xl flex flex-col justify-between h-52 border border-white/10 group transition-all duration-300 hover:-translate-y-1.5`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-white/80">{acc.bank_name}</p>
                      <h4 className="text-lg font-extrabold tracking-tight text-white mt-0.5">{acc.account_name}</h4>
                    </div>
                    {acc.is_primary && (
                      <span className="px-2.5 py-0.5 text-[10px] uppercase font-extrabold rounded-full bg-white/20 text-white backdrop-blur-md border border-white/30">
                        Primary
                      </span>
                    )}
                  </div>

                  {/* Card Chip & Type */}
                  <div className="flex items-center justify-between my-2">
                    <div className="w-10 h-7 rounded-lg bg-amber-400/80 border border-amber-300/60 shadow-inner flex items-center justify-center">
                      <div className="w-6 h-4 border border-amber-800/40 rounded-xs" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-white/90">
                      •••• {acc.account_number_last4}
                    </span>
                  </div>

                  {/* Card Footer Balance & Limit */}
                  <div className="border-t border-white/15 pt-3 space-y-1.5">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-white/70">
                          {acc.account_type === 'credit_card' ? 'Card Balance Used' : 'Current Balance'}
                        </p>
                        <p className="text-xl font-extrabold text-white tracking-tight">
                          ${acc.current_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                      </div>

                      <button
                        onClick={() => setDeleteTargetId(acc.id)}
                        className="p-2 rounded-xl bg-black/20 hover:bg-rose-500/30 text-white/80 hover:text-white transition opacity-0 group-hover:opacity-100"
                        title="Unlink Account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {acc.account_limit > 0 && (
                      <div>
                        <div className="flex justify-between text-[10px] text-white/80 font-bold">
                          <span>Limit: ${acc.account_limit.toLocaleString('en-US', { minimumFractionDigits: 0 })}</span>
                          <span>Avail: ${Math.max(0, acc.account_limit - Math.abs(acc.current_balance)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="w-full h-1.5 bg-black/30 rounded-full overflow-hidden mt-1">
                          <div 
                            className="h-full bg-cyan-400 rounded-full" 
                            style={{ width: `${Math.min(100, (Math.abs(acc.current_balance) / acc.account_limit) * 100)}%` }} 
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal for Linking New Account */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-[#0D1630] p-6 rounded-3xl border border-cyan-900/40 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-cyan-900/40 pb-3">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                  <CreditCard className="w-5 h-5" />
                  <span>Link New Financial Account</span>
                </div>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateAccount} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Account Display Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Primary Salary Checking"
                    value={formData.account_name}
                    onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                    className="w-full bg-[#070D1F] border border-cyan-900/40 rounded-xl px-3.5 py-2 text-sm text-cyan-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Bank Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Chase, Amex..."
                      value={formData.bank_name}
                      onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                      className="w-full bg-[#070D1F] border border-cyan-900/40 rounded-xl px-3.5 py-2 text-sm text-cyan-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Account Type</label>
                    <select
                      value={formData.account_type}
                      onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
                      className="w-full bg-[#070D1F] border border-cyan-900/40 rounded-xl px-3.5 py-2 text-sm text-cyan-100 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="checking">Checking</option>
                      <option value="savings">Savings</option>
                      <option value="credit_card">Credit Card</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Current Balance ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={formData.current_balance}
                      onChange={(e) => setFormData({ ...formData, current_balance: e.target.value })}
                      className="w-full bg-[#070D1F] border border-cyan-900/40 rounded-xl px-3.5 py-2 text-sm text-cyan-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Credit Limit ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Optional"
                      value={formData.account_limit}
                      onChange={(e) => setFormData({ ...formData, account_limit: e.target.value })}
                      className="w-full bg-[#070D1F] border border-cyan-900/40 rounded-xl px-3.5 py-2 text-sm text-cyan-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="is_primary"
                    checked={formData.is_primary}
                    onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
                    className="w-4 h-4 rounded text-cyan-500 bg-[#070D1F] border-cyan-900/40 focus:ring-cyan-500"
                  />
                  <label htmlFor="is_primary" className="text-xs font-semibold text-slate-200">
                    Set as Primary Account for Expenses
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs shadow-md shadow-cyan-500/20 transition disabled:opacity-50"
                  >
                    {submitting ? 'Linking...' : 'Link Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* In-Site Dark Delete Confirmation Modal */}
        {deleteTargetId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm bg-[#0E1726] p-6 rounded-3xl border border-rose-500/40 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-rose-500/20 pb-3">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5 animate-pulse" />
                  <span>Unlink Bank Account</span>
                </div>
                <button onClick={() => setDeleteTargetId(null)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Are you sure you want to unlink this bank account? Linked transaction balances will no longer sync with this card.
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
                  onClick={confirmDeleteAccount}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-md shadow-rose-600/30 transition disabled:opacity-50"
                >
                  {deleting ? 'Unlinking...' : 'Unlink Account'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BankAccountsPage;
