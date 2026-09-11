import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import StatCard from '../components/Common/StatCard';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import CashflowPredictor from '../components/Analytics/CashflowPredictor';
import { 
  Wallet, 
  Receipt, 
  PiggyBank, 
  Target, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Sparkles,
  Plus,
  Calendar,
  Filter,
  ShieldCheck,
  Zap,
  Crown,
  Lock,
  BarChart3,
  Activity
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend,
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [trends, setTrends] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Date Range & Horizon Controls
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [trendHorizon, setTrendHorizon] = useState(6);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const horizon = (user?.role === 'student' && trendHorizon > 6) ? 6 : trendHorizon;
      const [sumRes, catRes, trendRes, expRes, budRes, goalRes] = await Promise.all([
        api.get(`/analytics/summary?month=${selectedMonth}`),
        api.get(`/analytics/categories?month=${selectedMonth}`),
        api.get(`/analytics/trends?month=${selectedMonth}&months_count=${horizon}`),
        api.get('/expenses/?limit=5'),
        api.get('/budgets/'),
        api.get('/savings/')
      ]);

      setSummary(sumRes.data || {});
      setCategories(Array.isArray(catRes.data) ? catRes.data : []);
      setTrends(Array.isArray(trendRes.data) ? trendRes.data : []);
      setRecentExpenses(Array.isArray(expRes.data) ? expRes.data.slice(0, 5) : []);
      setBudgets(Array.isArray(budRes.data) ? budRes.data : []);
      setGoals(Array.isArray(goalRes.data) ? goalRes.data.slice(0, 3) : []);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedMonth, trendHorizon]);

  if (loading && !summary) {
    return (
      <Layout onRefreshData={fetchDashboardData}>
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-cyan-400 gap-3">
          <div className="w-9 h-9 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-300">Loading your financial dashboard...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout onRefreshData={fetchDashboardData}>
      <div className="space-y-6">

        {/* 1. Header with Role Badge */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800">
          <div className="flex items-center gap-2 text-indigo-400 mb-1">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Financial Overview Dashboard</span>
            <span className={`px-2 py-0.5 text-[10px] uppercase font-extrabold rounded-full border ml-2 ${
              user?.role === 'admin' 
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' 
                : user?.role === 'premium'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
            }`}>
              {user?.role} Mode
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white">
            Welcome back, {(user?.full_name || 'User').split(' ')[0]}! 👋
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Financial health, monthly spending distribution, and budget tracking.
          </p>
        </div>

        {/* 2. Role Segregated Banners */}
        {/* Premium Banner */}
        {user?.role === 'premium' && (
          <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/50 border border-amber-500/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-amber-300">⭐ BudgetBuddy Premium Active</h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Full access unlocked: AI Predictive Velocity, 12-Month Historical Analytics, & Visual PDF Charts.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Admin Banner */}
        {user?.role === 'admin' && (
          <div className="p-5 rounded-3xl bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-rose-300">🛡️ Administrator Command Mode</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Manage user roles, review pending premium upgrade requests, and audit system activities.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/admin')}
              className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-xs transition self-start sm:self-auto"
            >
              Open Admin Panel ⚙️
            </button>
          </div>
        )}

        {/* 3. Top Metrics Cards Grid (Merged Analytics + Operational Stats) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Monthly Income"
            amount={`$${summary?.total_income?.toLocaleString() || '0.00'}`}
            subtitle={`Selected month (${selectedMonth})`}
            icon={Wallet}
            color="emerald"
            onClick={() => navigate('/income')}
          />
          <StatCard
            title="Total Monthly Expense"
            amount={`$${summary?.total_expense?.toLocaleString() || '0.00'}`}
            subtitle={`Selected month (${selectedMonth})`}
            icon={Receipt}
            color="rose"
            onClick={() => navigate('/expenses')}
          />
          <StatCard
            title="Net Savings Balance"
            amount={`$${summary?.net_savings?.toLocaleString() || '0.00'}`}
            subtitle={`Savings Rate: ${summary?.savings_rate || 0}%`}
            icon={PiggyBank}
            color="indigo"
            onClick={() => navigate('/budgets')}
          />
          <div className="glass-panel p-5 rounded-3xl border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Financial Health Score</span>
              <Activity className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="mt-2">
              <h3 className="text-3xl font-extrabold text-emerald-400">
                {summary ? (summary.savings_rate >= 20 ? '92 / 100' : '78 / 100') : '--'}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                {summary?.savings_rate >= 20 ? 'Optimal savings rate achieved!' : 'Try reducing non-essential expenses.'}
              </p>
            </div>
          </div>
        </div>

        {/* 4. Predictive AI Cashflow Section (Role Segregated) */}
        {user?.role === 'premium' || user?.role === 'admin' ? (
          <CashflowPredictor month={selectedMonth} />
        ) : (
          <div className="glass-panel p-6 rounded-3xl border border-cyan-900/40 bg-gradient-to-r from-cyan-950/20 via-slate-900 to-indigo-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                  <span>AI Month-End Cashflow & Velocity Forecasting</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] uppercase font-extrabold">
                    🔒 Premium Feature
                  </span>
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Predicts daily burn rate velocity and warns of cash deficit risk before month-end.
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('/profile')}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-xs transition self-start sm:self-auto flex items-center gap-2"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Manage Account in Profile →</span>
            </button>
          </div>
        )}

        {/* 5. Separate Date & Horizon Control Bar (Placed Directly Before Graphs) */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="font-extrabold text-sm text-slate-100 flex items-center gap-2">
              <Filter className="w-4 h-4 text-cyan-400" />
              <span>Financial Analytics & Trend Horizon Filters</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Select target month and historical horizon to filter comparison charts below.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-[#070D1F] p-2.5 rounded-2xl border border-slate-800 self-start sm:self-auto">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-slate-300">Month:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 font-semibold focus:outline-none focus:border-cyan-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-2 border-l border-slate-800 pl-3">
              <Filter className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-slate-300">Horizon:</span>
              <select
                value={user?.role === 'student' && trendHorizon > 6 ? 6 : trendHorizon}
                onChange={(e) => setTrendHorizon(Number(e.target.value))}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value={3}>3 Months</option>
                <option value={6}>6 Months</option>
                {(user?.role === 'admin' || user?.role === 'premium') && (
                  <option value={12}>12 Months (Premium ⭐)</option>
                )}
              </select>
            </div>
          </div>
        </div>

        {/* 6. Merged Analytics Visual Charts Grid (Bar Chart + Donut Pie Chart) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Comparison Bar Chart */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg text-slate-100">Monthly Income vs. Expense Comparison</h3>
                <p className="text-xs text-slate-400">Historical trend ({trends.length} months ending {selectedMonth})</p>
              </div>
              <BarChart3 className="w-5 h-5 text-indigo-400" />
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends}>
                  <XAxis dataKey="month" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                  <Legend />
                  <Bar dataKey="income" fill="#10B981" name="Income ($)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="expense" fill="#EF4444" name="Expense ($)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Spending Donut Chart */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg text-slate-100">Category Spending Distribution</h3>
                <p className="text-xs text-slate-400">Percentage breakdown for {selectedMonth}</p>
              </div>
              <Filter className="w-5 h-5 text-cyan-400" />
            </div>

            <div className="h-72 w-full flex items-center justify-center">
              {categories.length === 0 ? (
                <p className="text-xs text-slate-500">No expenses recorded for {selectedMonth}.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categories}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      innerRadius={50}
                      paddingAngle={4}
                      label={({ category, percentage }) => `${category} (${percentage}%)`}
                    >
                      {categories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* 6. Operational Widgets (Recent Expenses, Budgets, Savings Goals) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Expenses List */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-slate-100">Recent Expenses</h3>
              <button 
                onClick={() => navigate('/expenses')}
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition"
              >
                View All →
              </button>
            </div>

            {recentExpenses.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No recent expenses found.</p>
            ) : (
              <div className="space-y-3">
                {recentExpenses.map((exp) => (
                  <div key={exp.id} className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-xs text-slate-200">{exp.title}</p>
                      <p className="text-[11px] text-slate-400">{exp.category} • {exp.date}</p>
                    </div>
                    <span className="font-extrabold text-sm text-rose-400">
                      -${(exp?.amount || 0).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Category Budgets */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-slate-100">Category Budgets</h3>
              <button 
                onClick={() => navigate('/budgets')}
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition"
              >
                Manage →
              </button>
            </div>

            {budgets.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No monthly budgets created.</p>
            ) : (
              <div className="space-y-3">
                {budgets.slice(0, 4).map((bud) => (
                  <div key={bud.id} className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-slate-200">{bud.category}</span>
                      <span className="text-slate-400">${(bud?.total_spent || 0).toFixed(2)} / ${(bud?.amount_allocated || 0).toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${bud.percent_used >= 100 ? 'bg-rose-500' : bud.percent_used >= 80 ? 'bg-amber-500' : 'bg-cyan-500'}`}
                        style={{ width: `${Math.min(bud.percent_used, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </Layout>
  );
};

export default Dashboard;
