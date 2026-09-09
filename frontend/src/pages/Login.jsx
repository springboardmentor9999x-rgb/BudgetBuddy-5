import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, ArrowRight, ShieldCheck, LogIn, Github, X, User, Plus, Check } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // OAuth Account Selector Modal state
  const [showOAuthModal, setShowOAuthModal] = useState(false);
  const [oauthProvider, setOauthProvider] = useState(null); // 'google' or 'github'
  const [customMode, setCustomMode] = useState(false);
  const [customEmail, setCustomEmail] = useState('');

  const { login, oauthLogin, demoLogin } = useAuth();
  const navigate = useNavigate();

  // Known active accounts on device / system
  const deviceAccounts = [
    { email: 'sbcp0708@gmail.com', name: 'bharadwaj (Student)', role: 'student' },
    { email: 'yashwanthtp1311@gmail.com', name: 'yashwanth (Premium)', role: 'premium' },
    { email: 'student@budgetbuddy.com', name: 'Student Account', role: 'student' },
    { email: 'premium@budgetbuddy.com', name: 'Premium Member', role: 'premium' },
    { email: 'admin@budgetbuddy.com', name: 'System Administrator', role: 'admin' },
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      if (!err.response) {
        setError('Network Error: Unable to reach backend server. Please verify VITE_API_URL in Vercel settings.');
      } else {
        setError(err.response?.data?.detail || 'Invalid email or password');
      }
    } finally {
      setLoading(false);
    }
  };

  const openOAuthModal = (provider) => {
    setOauthProvider(provider);
    setCustomMode(false);
    setCustomEmail('');
    setShowOAuthModal(true);
  };

  const handleSelectAccount = async (accountEmail, accountName) => {
    setLoading(true);
    setError('');
    try {
      await oauthLogin(oauthProvider, accountEmail, accountName, `oauth_${Date.now()}`);
      setShowOAuthModal(false);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || `${oauthProvider.toUpperCase()} login failed`);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customEmail) return;
    const derivedName = customEmail.split('@')[0];
    handleSelectAccount(customEmail, derivedName);
  };

  return (
    <div className="min-h-screen bg-[#0B132B] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-cyan-900/40 shadow-2xl relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 mb-3">
            <Sparkles className="w-6 h-6 text-slate-950" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Welcome Back</h1>
          <p className="text-xs text-cyan-400/80 mt-1">Sign in to your BudgetBuddy finance portal</p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              required
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#070D1F] border border-cyan-900/40 rounded-xl px-4 py-2.5 text-sm text-cyan-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-300">Password</label>
              <Link to="/forgot-password" className="text-[11px] font-semibold text-cyan-400 hover:underline">
                Forgot Password?
              </Link>
            </div>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#070D1F] border border-cyan-900/40 rounded-xl px-4 py-2.5 text-sm text-cyan-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          {/* Quick Demo Fill Buttons */}
          <div className="pt-1">
            <p className="text-[11px] font-semibold text-slate-400 mb-1.5 text-center">Click to Auto-Fill Demo Credentials:</p>
            <div className="flex gap-2 justify-center">
              <button
                type="button"
                onClick={() => { setEmail('student@budgetbuddy.com'); setPassword('password123'); }}
                className="px-3 py-1 rounded-lg bg-cyan-950/80 border border-cyan-700/50 text-cyan-300 text-xs font-bold hover:bg-cyan-900/80 transition"
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => { setEmail('premium@budgetbuddy.com'); setPassword('password123'); }}
                className="px-3 py-1 rounded-lg bg-purple-950/80 border border-purple-700/50 text-purple-300 text-xs font-bold hover:bg-purple-900/80 transition"
              >
                Premium
              </button>
              <button
                type="button"
                onClick={() => { setEmail('admin@budgetbuddy.com'); setPassword('password123'); }}
                className="px-3 py-1 rounded-lg bg-emerald-950/80 border border-emerald-700/50 text-emerald-300 text-xs font-bold hover:bg-emerald-900/80 transition"
              >
                Admin
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-sm shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50 mt-4"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Instant Presentation Demo Mode Button */}
          <div className="mt-3">
            <button
              type="button"
              onClick={() => {
                demoLogin('student');
                navigate('/dashboard');
              }}
              className="w-full py-2.5 rounded-xl bg-[#070D1F] hover:bg-slate-900 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center justify-center gap-2 transition shadow-md"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              ⚡ Instant Presentation Demo Mode (1-Click Bypass)
            </button>
          </div>
        </form>

        {/* OAuth Single Sign On */}
        <div className="mt-6 pt-6 border-t border-cyan-900/30">
          <p className="text-[11px] text-center text-slate-400 font-medium mb-3">Or continue with OAuth2</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => openOAuthModal('google')}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#070D1F] hover:bg-slate-900 border border-cyan-900/40 text-xs font-semibold text-slate-200 transition"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.1 9 5 12 5z"/>
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
                <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9c-.3-.8-.5-1.7-.5-2.7z"/>
                <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.1-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"/>
              </svg>
              Google
            </button>
            <button
              type="button"
              onClick={() => openOAuthModal('github')}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#070D1F] hover:bg-slate-900 border border-cyan-900/40 text-xs font-semibold text-slate-200 transition"
            >
              <Github className="w-4 h-4 text-slate-100" />
              GitHub
            </button>
          </div>
        </div>

        {/* Register Link */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-cyan-400 font-bold hover:underline">
            Register now
          </Link>
        </p>
      </div>

      {/* Google / GitHub Account Picker Modal */}
      {showOAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-[#0D1630] p-6 rounded-3xl border border-cyan-900/60 shadow-2xl relative">
            <button
              onClick={() => setShowOAuthModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-slate-900 border border-cyan-900/50 flex items-center justify-center mb-3">
                {oauthProvider === 'google' ? (
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.1 9 5 12 5z"/>
                    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
                    <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9c-.3-.8-.5-1.7-.5-2.7z"/>
                    <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.1-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"/>
                  </svg>
                ) : (
                  <Github className="w-6 h-6 text-white" />
                )}
              </div>
              <h3 className="text-lg font-extrabold text-white">
                Choose an account
              </h3>
              <p className="text-xs text-cyan-400/80 mt-0.5">to continue to BudgetBuddy</p>
            </div>

            {!customMode ? (
              /* Account List Cards */
              <div className="space-y-2.5 mb-4">
                {deviceAccounts.map((acc) => (
                  <button
                    key={acc.email}
                    onClick={() => handleSelectAccount(acc.email, acc.name)}
                    disabled={loading}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#070D1F] hover:bg-slate-900 border border-cyan-900/40 hover:border-cyan-500/50 transition group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-slate-950 text-xs shadow-md">
                        {acc.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 transition">
                          {acc.name}
                        </p>
                        <p className="text-[11px] text-slate-400">{acc.email}</p>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      {acc.role}
                    </span>
                  </button>
                ))}

                <button
                  onClick={() => setCustomMode(true)}
                  className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-[#070D1F]/50 hover:bg-slate-900 border border-dashed border-cyan-900/50 hover:border-cyan-500/40 text-xs font-semibold text-slate-300 hover:text-cyan-300 transition"
                >
                  <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                    <Plus className="w-4 h-4" />
                  </div>
                  <span>Use another account...</span>
                </button>
              </div>
            ) : (
              /* Custom Email Entry Form */
              <form onSubmit={handleCustomSubmit} className="space-y-4 mb-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Enter Email Address
                  </label>
                  <input
                    type="email"
                    required
                    autoFocus
                    placeholder="user@gmail.com"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className="w-full bg-[#070D1F] border border-cyan-900/40 rounded-xl px-4 py-2.5 text-sm text-cyan-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setCustomMode(false)}
                    className="text-xs text-cyan-400 font-semibold hover:underline"
                  >
                    ← Back to account list
                  </button>

                  <button
                    type="submit"
                    disabled={loading || !customEmail}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs shadow-md shadow-cyan-500/20 transition disabled:opacity-50"
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </button>
                </div>
              </form>
            )}

            <div className="text-center pt-2 border-t border-cyan-900/30">
              <p className="text-[10px] text-slate-500">
                To continue, BudgetBuddy will share your name and email with Google.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
