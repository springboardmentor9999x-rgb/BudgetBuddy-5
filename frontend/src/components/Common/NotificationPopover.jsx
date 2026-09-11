import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, CheckCheck, Trash2, X, AlertTriangle, Target, Info, Sparkles } from 'lucide-react';

const NotificationPopover = ({ onClose }) => {
  const { notifications, markNotificationRead, clearAllNotifications } = useAuth();

  const getIcon = (type) => {
    switch (type) {
      case 'budget_alert':
      case 'overspending':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'goal_milestone':
        return <Target className="w-4 h-4 text-emerald-400" />;
      case 'system':
        return <Sparkles className="w-4 h-4 text-indigo-400" />;
      default:
        return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 glass-panel rounded-2xl border border-slate-700/80 shadow-2xl z-50 overflow-hidden">
      {/* Popover Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-indigo-400" />
          <h4 className="font-semibold text-sm text-slate-100">Notifications</h4>
        </div>
        <div className="flex items-center gap-2">
          {notifications.length > 0 && (
            <button
              onClick={clearAllNotifications}
              className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 transition"
              title="Clear all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No notifications right now.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => markNotificationRead(n.id)}
              className={`p-3.5 flex items-start gap-3 hover:bg-slate-800/40 transition cursor-pointer ${
                !n.is_read ? 'bg-indigo-950/20' : ''
              }`}
            >
              <div className="mt-0.5 p-2 rounded-xl bg-slate-800/80 border border-slate-700/50">
                {getIcon(n.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-semibold text-slate-200 truncate">{n.title}</h5>
                  {!n.is_read && (
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{n.message}</p>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  {new Date(n.created_at).toLocaleDateString()} {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationPopover;
