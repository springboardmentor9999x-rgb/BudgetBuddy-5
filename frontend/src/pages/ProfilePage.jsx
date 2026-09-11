import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout/Layout';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { User, Settings, Save, Bell, Shield, Wallet, Trash2, AlertTriangle, X, Star, Sparkles, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProfilePage = () => {
  const { user, setUser, logout, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [formData, setFormData] = useState({
    phone: '',
    bio: '',
    monthly_income_target: 1000,
    preferred_currency: 'USD',
    email_notifications_enabled: true,
    overspending_alert_threshold: 80
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [requestingPremium, setRequestingPremium] = useState(false);
  const [premiumRequested, setPremiumRequested] = useState(false);

  // Delete Account Confirmation Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get('/profiles/me');
      if (res && res.data) {
        setProfile(res.data);
        setFormData({
          phone: res.data.phone || '',
          bio: res.data.bio || '',
          monthly_income_target: res.data.monthly_income_target || 1000,
          preferred_currency: res.data.preferred_currency || 'USD',
          email_notifications_enabled: res.data.email_notifications_enabled ?? true,
          overspending_alert_threshold: res.data.overspending_alert_threshold || 80
        });
      }
    } catch (err) {
      console.error('Failed to load profile', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (user?.full_name) {
      setFullName(user.full_name);
    }
  }, [user]);

  const handleRequestPremium = async () => {
    setRequestingPremium(true);
    setMessage('');
    try {
      const res = await api.post('/users/request-premium');
      setPremiumRequested(true);
      if (user) setUser({ ...user, has_pending_premium_request: true });
      showToast('Upgrade request submitted! In-app & Email notifications sent to admin.', 'success');
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to submit premium request.', 'error');
    } finally {
      setRequestingPremium(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      if (fullName && fullName !== user?.full_name) {
        const uRes = await api.put('/users/me', { full_name: fullName });
        if (uRes.data) setUser(uRes.data);
      }
      const pRes = await api.put('/profiles/me', formData);
      if (pRes.data) setProfile(pRes.data);
      showToast('Profile and preferences updated successfully!', 'success');
    } catch (err) {
      showToast('Failed to update profile settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await api.delete('/auth/me');
      logout();
      navigate('/register');
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to delete account. Please try again.', 'error');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const isPending = user?.has_pending_premium_request || premiumRequested;

  if (loading || authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-500"></div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="p-8 text-center glass-panel rounded-3xl max-w-md mx-auto my-12 border border-slate-800 space-y-4">
          <p className="text-slate-300 font-bold">Please log in to view your profile settings.</p>
          <button onClick={() => navigate('/login')} className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-cyan-500/20">
            Go to Login
          </button>
        </div>
      </Layout>
    );
  }

  const userInitial = (user?.full_name || user?.email || 'U').charAt(0).toUpperCase();

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-3 glass-panel p-6 rounded-3xl border border-[#1E293B]">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-extrabold text-slate-950 text-lg shadow-lg shadow-cyan-500/20">
            {userInitial}
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-white">{user?.full_name || user?.email}</h2>
            <p className="text-xs text-slate-400">{user?.email} • <span className="uppercase text-cyan-400 font-extrabold">{user?.role || 'STUDENT'}</span> Account</p>
          </div>
        </div>

        {/* Premium Upgrade Request Banner for Student Users */}
        {user?.role === 'student' && (
          <div className="glass-panel p-6 rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-cyan-500/10 relative overflow-hidden space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
                  <Star className="w-6 h-6 animate-pulse text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                    Upgrade to BudgetBuddy Premium
                    <span className="text-[10px] bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold px-2 py-0.5 rounded-full uppercase">
                      {isPending ? 'Pending Admin Review' : 'Admin Approval Required'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Unlock 12-month trend charts, AI cashflow predictions, custom date range filters, and PDF/Excel visual chart exports.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={requestingPremium || isPending}
                onClick={handleRequestPremium}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition shrink-0 disabled:opacity-60"
              >
                <Sparkles className="w-4 h-4" />
                {isPending ? 'Request Pending Admin Approval ✓' : requestingPremium ? 'Submitting...' : 'Request Premium Upgrade'}
              </button>
            </div>

            {isPending && (
              <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-200 text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-amber-400 shrink-0" />
                Upgrade request pending administrator review. You will receive an in-app & email notification once approved!
              </div>
            )}
          </div>
        )}

        {message && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            {message}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* User Information */}
          <div className="glass-panel p-6 rounded-3xl border border-cyan-900/30 space-y-4">
            <div className="flex items-center gap-2 text-cyan-400 border-b border-cyan-900/30 pb-3">
              <User className="w-4 h-4" />
              <h3 className="font-bold text-white text-sm">Personal Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-[#070D1F] border border-cyan-900/40 rounded-xl px-3.5 py-2 text-sm text-cyan-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-[#070D1F] border border-cyan-900/40 rounded-xl px-3.5 py-2 text-sm text-cyan-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Bio / Financial Notes</label>
              <textarea
                rows="2"
                placeholder="Student bio..."
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full bg-[#070D1F] border border-cyan-900/40 rounded-xl px-3.5 py-2 text-sm text-cyan-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Financial Preferences */}
          <div className="glass-panel p-6 rounded-3xl border border-cyan-900/30 space-y-4">
            <div className="flex items-center gap-2 text-emerald-400 border-b border-cyan-900/30 pb-3">
              <Wallet className="w-4 h-4" />
              <h3 className="font-bold text-white text-sm">Financial Setup & Targets</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Monthly Income Target ($)</label>
                <input
                  type="number"
                  step="50"
                  value={formData.monthly_income_target}
                  onChange={(e) => setFormData({ ...formData, monthly_income_target: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#070D1F] border border-cyan-900/40 rounded-xl px-3.5 py-2 text-sm text-cyan-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Preferred Currency</label>
                <select
                  value={formData.preferred_currency}
                  onChange={(e) => setFormData({ ...formData, preferred_currency: e.target.value })}
                  className="w-full bg-[#070D1F] border border-cyan-900/40 rounded-xl px-3.5 py-2 text-sm text-cyan-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notifications & Thresholds */}
          <div className="glass-panel p-6 rounded-3xl border border-cyan-900/30 space-y-4">
            <div className="flex items-center gap-2 text-purple-400 border-b border-cyan-900/30 pb-3">
              <Bell className="w-4 h-4" />
              <h3 className="font-bold text-white text-sm">Notification Thresholds</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Overspending Warning Threshold (%)</label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={formData.overspending_alert_threshold}
                  onChange={(e) => setFormData({ ...formData, overspending_alert_threshold: parseFloat(e.target.value) || 80 })}
                  className="w-full bg-[#070D1F] border border-cyan-900/40 rounded-xl px-3.5 py-2 text-sm text-cyan-100 focus:outline-none focus:border-purple-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">Receive warning alert when budget utilization reaches this %.</p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="email_notif"
                  checked={formData.email_notifications_enabled}
                  onChange={(e) => setFormData({ ...formData, email_notifications_enabled: e.target.checked })}
                  className="w-4 h-4 rounded text-cyan-500 bg-[#070D1F] border-cyan-900/40 focus:ring-cyan-500"
                />
                <label htmlFor="email_notif" className="text-xs font-semibold text-slate-200">
                  Enable Email & System Budget Alerts
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs shadow-md shadow-cyan-500/20 flex items-center gap-2 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving Changes...' : 'Save Settings'}
            </button>
          </div>
        </form>

        {/* Danger Zone: Delete Account */}
        <div className="glass-panel p-6 rounded-3xl border border-rose-500/30 bg-rose-500/5 space-y-4">
          <div className="flex items-center gap-2 text-rose-400 border-b border-rose-500/20 pb-3">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <h3 className="font-bold text-rose-400 text-sm uppercase tracking-wider">Danger Zone</h3>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-white">Delete Account</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Permanently remove your account and purge all your personal expenses, budgets, savings goals, and data from BudgetBuddy.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setDeleteConfirmationText('');
                setShowDeleteModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center gap-2 transition shrink-0"
            >
              <Trash2 className="w-4 h-4" />
              Delete Account
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="w-full max-w-md bg-[#0D1630] p-6 rounded-3xl border border-rose-500/40 shadow-2xl relative">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
                  <AlertTriangle className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white">Delete Your Account?</h3>
                  <p className="text-xs text-rose-400">This action is permanent and cannot be undone.</p>
                </div>
              </div>

              <div className="space-y-3 my-4">
                <p className="text-xs text-slate-300 leading-relaxed">
                  All your tracked expenses, income records, monthly budget allocations, savings goals, and profile information will be <strong>permanently erased</strong>.
                </p>

                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <p className="text-xs font-bold text-rose-300 mb-1">To confirm deletion, type your email below:</p>
                  <p className="text-xs font-mono font-bold text-white select-all">{user?.email}</p>
                </div>

                <input
                  type="text"
                  placeholder="Type your email address here..."
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  className="w-full bg-[#070D1F] border border-rose-500/30 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-rose-500 transition"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting || deleteConfirmationText !== user?.email}
                  onClick={handleDeleteAccount}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-md shadow-rose-600/30 transition disabled:opacity-40 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {deleting ? 'Deleting Account...' : 'Permanently Delete My Account'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProfilePage;
