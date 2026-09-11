import React from 'react';

const StatCard = ({ title, amount, subtitle, icon: Icon, color = 'indigo', trend, onClick }) => {
  const colorMap = {
    indigo: 'from-cyan-500/20 to-blue-600/10 text-cyan-300 border-cyan-500/30',
    emerald: 'from-emerald-500/20 to-emerald-600/10 text-emerald-400 border-emerald-500/30',
    rose: 'from-rose-500/20 to-rose-600/10 text-rose-400 border-rose-500/30',
    amber: 'from-amber-500/20 to-amber-600/10 text-amber-400 border-amber-500/30',
    purple: 'from-purple-500/20 to-purple-600/10 text-purple-400 border-purple-500/30',
  };

  return (
    <div 
      onClick={onClick}
      className={`glass-card glass-card-hover p-5 rounded-2xl border border-cyan-900/30 flex flex-col justify-between transition-all duration-300 group ${
        onClick ? 'cursor-pointer hover:-translate-y-1 hover:border-cyan-500/60 shadow-xl' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-cyan-400/80 tracking-wide uppercase">{title}</p>
          <h3 className="text-2xl md:text-3xl font-extrabold text-white mt-1 tracking-tight">{amount}</h3>
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-br ${colorMap[color] || colorMap.indigo} border shadow-md`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {subtitle && (
        <div className="mt-4 flex items-center justify-between text-xs border-t border-slate-800/80 pt-3">
          <span className="text-slate-400">{subtitle}</span>
          {onClick ? (
            <span className="text-[10px] font-extrabold text-cyan-400 group-hover:translate-x-1 transition flex items-center gap-0.5">
              View &rarr;
            </span>
          ) : (
            trend && (
              <span className={`font-bold ${trend.positive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {trend.value}
              </span>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default StatCard;
