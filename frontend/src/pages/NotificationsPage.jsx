import React, { useState } from 'react';
import Layout from '../components/Layout/Layout';
import { useAuth } from '../context/AuthContext';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  AlertTriangle, 
  Target, 
  Sparkles, 
  Info,
  Filter,
  CheckCircle2
} from 'lucide-react';

const NotificationsPage = () => {
  const { notifications, markNotificationRead, clearAllNotifications, fetchNotifications } = useAuth();
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'budget', 'savings'

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read;
    if (filter === 'budget') return n.type === 'budget_alert' || n.type === 'overspending';
    if (filter === 'savings') return n.type === 'goal_milestone';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getIcon = (type) => {
    switch (type) {
      case 'budget_alert':
      case 'overspending':
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case 'goal_milestone':
        return <Target className="w-5 h-5 text-emerald-400" />;
      case 'system':
        return <Sparkles className="w-5 h-5 text-cyan-400" />;
      default:
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getBadgeStyle = (type) => {
    switch (type) {
      case 'budget_alert':
      case 'overspending':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'goal_milestone':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'system':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      default:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    }
  };

  const handleMarkAllRead = async () => {
    for (const n of notifications.filter(item => !item.is_read)) {
      await markNotificationRead(n.id);
    }
    fetchNotifications();
  };

  return (
    <Layout onRefreshData={fetchNotifications}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-cyan-900/40">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 mb-1">
              <Bell className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">System Notifications Hub</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white">Notification Center</h2>
            <p className="text-xs text-slate-400 mt-1">
              View all system alerts, budget thresholds, savings milestone achievements, and security notifications.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <CheckCheck className="w-4 h-4" /> Mark All Read ({unreadCount})
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={clearAllNotifications}
                className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-4 h-4" /> Clear All
              </button>
            )}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: 'all', label: `All Alerts (${notifications.length})` },
            { id: 'unread', label: `Unread (${unreadCount})` },
            { id: 'budget', label: 'Budget Alerts' },
            { id: 'savings', label: 'Savings Milestones' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                filter === item.id
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-cyan-900/40'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Notifications List Card */}
        <div className="glass-panel rounded-3xl border border-cyan-900/40 overflow-hidden">
          {filteredNotifications.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-cyan-400/60 mx-auto" />
              <h4 className="text-base font-bold text-white">No Notifications Found</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                You're all caught up! System notifications for budget warnings, savings goals, and transactions will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markNotificationRead(n.id)}
                  className={`p-5 flex items-start gap-4 hover:bg-slate-900/50 transition cursor-pointer ${
                    !n.is_read ? 'bg-cyan-950/20 border-l-4 border-l-cyan-400' : ''
                  }`}
                >
                  <div className={`p-3 rounded-2xl border ${getBadgeStyle(n.type)} shadow-md`}>
                    {getIcon(n.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-bold text-white truncate">{n.title}</h4>
                      <span className="text-[11px] text-slate-400 whitespace-nowrap">
                        {new Date(n.created_at).toLocaleDateString()} at {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-xs text-cyan-100/90 mt-1 leading-relaxed">{n.message}</p>

                    <div className="flex items-center justify-between mt-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getBadgeStyle(n.type)}`}>
                        {n.type?.replace('_', ' ')}
                      </span>

                      {!n.is_read && (
                        <span className="text-[11px] font-bold text-cyan-400 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" /> Unread
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default NotificationsPage;
