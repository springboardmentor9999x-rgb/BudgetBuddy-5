import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout/Layout';
import api from '../services/api';
import { 
  ShieldAlert, 
  Users, 
  Receipt, 
  Activity, 
  CheckCircle, 
  XCircle,
  UserCheck,
  Sparkles
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const AdminDashboard = () => {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, logsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/users/'),
        api.get('/admin/logs')
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data);
      setLogs(logsRes.data);
    } catch (err) {
      console.error('Failed to load admin data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/admin/users/${userId}/role?role=${newRole}`);
      showToast(`User role updated to ${newRole}`, 'success');
      fetchAdminData();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to change user role', 'error');
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    try {
      await api.put(`/admin/users/${userId}/status?is_active=${!currentStatus}`);
      showToast(`User account status ${!currentStatus ? 'activated' : 'deactivated'}`, 'success');
      fetchAdminData();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to toggle user status', 'error');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-rose-500/20 bg-rose-950/10">
          <div>
            <div className="flex items-center gap-2 text-rose-400 mb-1">
              <ShieldAlert className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Administrator Controls</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white">System Admin Panel</h2>
            <p className="text-xs text-slate-400 mt-1">Platform overview, user management, and system activity logs.</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel p-5 rounded-3xl border border-slate-800">
            <p className="text-xs font-semibold text-slate-400 uppercase">Total Users</p>
            <h3 className="text-3xl font-extrabold text-white mt-1">{stats?.user_statistics?.total_users || 0}</h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Students: {stats?.user_statistics?.students} • Premium: {stats?.user_statistics?.premium_users}
            </p>
          </div>

          <div className="glass-panel p-5 rounded-3xl border border-slate-800">
            <p className="text-xs font-semibold text-slate-400 uppercase">Platform Income Volume</p>
            <h3 className="text-3xl font-extrabold text-emerald-400 mt-1">
              ${stats?.financial_overview?.total_platform_income?.toLocaleString() || '0.00'}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Total recorded incomes</p>
          </div>

          <div className="glass-panel p-5 rounded-3xl border border-slate-800">
            <p className="text-xs font-semibold text-slate-400 uppercase">Platform Expense Volume</p>
            <h3 className="text-3xl font-extrabold text-rose-400 mt-1">
              ${stats?.financial_overview?.total_platform_expense?.toLocaleString() || '0.00'}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Total recorded expenses</p>
          </div>

          <div className="glass-panel p-5 rounded-3xl border border-slate-800">
            <p className="text-xs font-semibold text-slate-400 uppercase">Transactions Count</p>
            <h3 className="text-3xl font-extrabold text-indigo-400 mt-1">
              {stats?.financial_overview?.total_transactions || 0}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Active Goals: {stats?.financial_overview?.active_goals}</p>
          </div>
        </div>

        {/* User Management Table */}
        <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <h3 className="font-bold text-slate-100 text-sm">User Directory & Permissions</h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-900/40 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-200">{u.full_name}</p>
                        {u.has_pending_premium_request && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-extrabold flex items-center gap-1 animate-pulse">
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            Upgrade Requested
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">{u.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      {u.id === currentUser?.id || u.role === 'admin' ? (
                        <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/20 text-xs font-bold flex items-center gap-1.5 w-fit">
                          <span>Admin</span>
                          <span className="text-[10px] text-slate-400 font-normal">🔒</span>
                        </span>
                      ) : (
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
                        >
                          <option value="student">Student 🎓</option>
                          <option value="premium">Premium ⭐</option>
                        </select>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {u.is_active ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                          Active
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {u.role === 'student' && u.has_pending_premium_request && (
                          <button
                            onClick={() => handleRoleChange(u.id, 'premium')}
                            className="px-3 py-1 rounded-lg text-[11px] font-extrabold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md shadow-amber-500/20 flex items-center gap-1 transition"
                            title="Approve Premium Request & Email User"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            Approve Premium
                          </button>
                        )}
                        <button
                          onClick={() => handleStatusToggle(u.id, u.is_active)}
                          className={`px-3 py-1 rounded-lg text-[11px] font-bold border transition ${
                            u.is_active
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                          }`}
                        >
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Activity Logs Table */}
        <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400" />
            <h3 className="font-bold text-slate-100 text-sm">System Audit Logs</h3>
          </div>
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3">Timestamp</th>
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Action</th>
                  <th className="px-6 py-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/40 transition">
                    <td className="px-6 py-3 text-slate-400 font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-3 text-indigo-300 font-semibold">{log.user_email}</td>
                    <td className="px-6 py-3 font-bold text-slate-200">{log.action}</td>
                    <td className="px-6 py-3 text-slate-400">{log.details || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
