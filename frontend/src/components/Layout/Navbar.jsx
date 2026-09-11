import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import NotificationPopover from '../Common/NotificationPopover';
import { Bell, Plus, Search, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

const Navbar = ({ onOpenExpenseModal, onOpenIncomeModal }) => {
  const { user, notifications } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <header className="h-16 border-b border-cyan-900/30 bg-[#0B132B]/80 backdrop-blur-md sticky top-0 z-10 px-6 flex items-center justify-between shadow-lg">
      {/* Search / Title area */}
      <div className="flex items-center gap-4">
        <div className="relative w-64 md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cyan-500/70" />
          <input
            type="text"
            placeholder="Search transactions, budgets..."
            className="w-full bg-[#070D1F] border border-cyan-900/40 rounded-xl pl-9 pr-4 py-1.5 text-xs text-cyan-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition"
          />
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-3">
        {/* Quick Action Buttons */}
        <button
          onClick={onOpenIncomeModal}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Income
        </button>
        <button
          onClick={onOpenExpenseModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-extrabold rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-md shadow-cyan-500/20 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Expense
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-cyan-900/40 transition"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <NotificationPopover onClose={() => setShowNotifications(false)} />
          )}
        </div>

        {/* Profile Quick Link */}
        <Link
          to="/profile"
          className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800/60 transition text-slate-300"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-slate-950 text-xs shadow-md shadow-cyan-500/20">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
        </Link>
      </div>
    </header>
  );
};

export default Navbar;
