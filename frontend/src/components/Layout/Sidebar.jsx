import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Receipt, 
  Wallet, 
  PiggyBank, 
  Target, 
  Building2,
  BarChart3, 
  FileText, 
  User, 
  ShieldAlert, 
  LogOut,
  Sparkles,
  Bell
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout, notifications = [] } = useAuth();
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const navigation = [
    { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { name: 'Expenses', to: '/expenses', icon: Receipt },
    { name: 'Income', to: '/income', icon: Wallet },
    { name: 'Budgets', to: '/budgets', icon: PiggyBank },
    { name: 'Savings Goals', to: '/savings', icon: Target },
    { name: 'Notifications', to: '/notifications', icon: Bell },
    { name: 'Bank Accounts & Cards', to: '/banks', icon: Building2 },
    { name: 'Reports & Export', to: '/reports', icon: FileText },
    { name: 'Profile & Settings', to: '/profile', icon: User },
  ];

  if (user?.role === 'admin') {
    navigation.push({ name: 'Admin Panel', to: '/admin', icon: ShieldAlert });
  }

  return (
    <aside className="w-64 bg-[#0B132B]/95 border-r border-cyan-900/30 flex flex-col justify-between min-h-screen sticky top-0 backdrop-blur-xl z-20 shadow-xl">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-cyan-900/30">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-xl bg-gradient-to-r from-white via-cyan-100 to-cyan-300 bg-clip-text text-transparent">
              BudgetBuddy
            </h1>
          </div>
        </div>

        {/* User Role Badge Info */}
        <div className="px-4 py-3 mx-4 my-4 rounded-xl bg-slate-900/60 border border-cyan-900/40 flex items-center justify-between">
          <div className="truncate">
            <p className="text-xs font-bold text-slate-200 truncate">{user?.full_name}</p>
            <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
          </div>
          <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded-full border ${
            user?.role === 'admin' 
              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
              : user?.role === 'premium'
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
          }`}>
            {user?.role}
          </span>
        </div>

        {/* Nav Links */}
        <nav className="px-3 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isNotifications = item.to === '/notifications';
            return (
              <NavLink
                key={item.name}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-md shadow-cyan-500/10 font-bold'
                      : 'text-slate-400 hover:text-cyan-200 hover:bg-slate-800/50'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </div>

                {isNotifications && unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white shadow-sm animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Logout Button */}
      <div className="p-4 border-t border-cyan-900/30">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 border border-transparent transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
