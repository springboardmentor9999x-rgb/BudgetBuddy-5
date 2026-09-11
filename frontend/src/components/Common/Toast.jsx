import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X, Sparkles } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration, onClose]);

  if (!message) return null;

  const isSuccess = type === 'success';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm bg-[#0D1630]/95 border border-cyan-500/50 p-6 rounded-3xl shadow-2xl shadow-cyan-500/20 text-center relative flex flex-col items-center space-y-3 transform transition-all duration-300 scale-100">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Center Animated Icon Badge */}
        <div className={`p-4 rounded-2xl ${isSuccess ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'} shadow-lg`}>
          {isSuccess ? <CheckCircle2 className="w-8 h-8 animate-bounce-short" /> : <AlertCircle className="w-8 h-8" />}
        </div>

        {/* Center Title & Message */}
        <div>
          <div className="flex items-center justify-center gap-1.5 text-cyan-400 text-xs font-extrabold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isSuccess ? 'Transaction Successful' : 'System Notification'}</span>
          </div>
          <h3 className="text-base font-bold text-white leading-snug px-2">{message}</h3>
        </div>

        {/* OK Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs shadow-md shadow-cyan-500/20 transition mt-2"
        >
          Got it!
        </button>
      </div>
    </div>
  );
};

export default Toast;
