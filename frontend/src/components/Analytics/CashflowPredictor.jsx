import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingDown, 
  Calendar, 
  Flame,
  HelpCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend,
  ReferenceLine 
} from 'recharts';

const CashflowPredictor = ({ month }) => {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrediction();
  }, [month]);

  const fetchPrediction = async () => {
    setLoading(true);
    try {
      const url = month ? `/analytics/prediction?month=${month}` : '/analytics/prediction';
      const res = await api.get(url);
      setPrediction(res.data);
    } catch (err) {
      console.error('Failed to load cashflow prediction', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-panel p-6 rounded-3xl border border-cyan-900/40 text-center text-cyan-400/70 text-xs py-12">
        Calculating cashflow velocity & month-end forecast...
      </div>
    );
  }

  if (!prediction) return null;

  const {
    daily_burn_rate,
    days_elapsed,
    days_in_month,
    days_remaining,
    current_spent,
    current_income,
    projected_month_end_expense,
    projected_month_end_balance,
    status,
    run_out_date,
    forecast_points
  } = prediction;

  const getStatusBanner = () => {
    if (status === 'danger') {
      return (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-3 text-rose-400">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 animate-bounce" />
            <div>
              <p className="font-bold text-xs">Deficit Alert: Cash Run-out Projected</p>
              <p className="text-[11px] text-rose-300/80 mt-0.5">
                At your current spending rate of <strong>${daily_burn_rate}/day</strong>, your monthly income will run out around <strong>{run_out_date || 'before month-end'}</strong>.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-extrabold uppercase">
            Deficit: -${Math.abs(projected_month_end_balance).toFixed(2)}
          </span>
        </div>
      );
    }

    if (status === 'warning') {
      return (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-amber-400">
          <div className="flex items-center gap-3">
            <Flame className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-bold text-xs">Low Surplus Warning</p>
              <p className="text-[11px] text-amber-300/80 mt-0.5">
                You are spending <strong>${daily_burn_rate}/day</strong>. Projected surplus at month-end is only <strong>${projected_month_end_balance.toFixed(2)}</strong>.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-extrabold uppercase">
            Low Surplus
          </span>
        </div>
      );
    }

    return (
      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 text-emerald-400">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-bold text-xs">Healthy Cashflow Velocity</p>
            <p className="text-[11px] text-emerald-300/80 mt-0.5">
              At <strong>${daily_burn_rate}/day</strong>, you are projected to end the month with a comfortable surplus of <strong>${projected_month_end_balance.toFixed(2)}</strong>.
            </p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase">
          Surplus: +${projected_month_end_balance.toFixed(2)}
        </span>
      </div>
    );
  };

  return (
    <div className="glass-panel p-6 rounded-3xl border border-cyan-900/40 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyan-900/30 pb-4">
        <div className="flex items-center gap-2.5 text-cyan-400">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-white">Month-End Cashflow Predictor</h3>
            <p className="text-xs text-slate-400">Predictive spending velocity & month-end surplus/deficit forecast</p>
          </div>
        </div>
        <span className="text-xs text-cyan-300 font-bold bg-[#070D1F] border border-cyan-900/40 px-3 py-1.5 rounded-xl self-start sm:self-auto">
          Day {days_elapsed} of {days_in_month} ({days_remaining} days left)
        </span>
      </div>

      {/* Dynamic Status Banner */}
      {getStatusBanner()}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#070D1F] border border-cyan-900/40">
          <p className="text-[11px] font-bold text-cyan-400/80 uppercase">Daily Burn Rate</p>
          <p className="text-xl font-extrabold text-cyan-400 mt-1">${(daily_burn_rate || 0).toFixed(2)} <span className="text-[10px] font-normal text-slate-500">/day</span></p>
        </div>

        <div className="p-4 rounded-2xl bg-[#070D1F] border border-cyan-900/40">
          <p className="text-[11px] font-bold text-cyan-400/80 uppercase">Current Total Spent</p>
          <p className="text-xl font-extrabold text-rose-400 mt-1">${(current_spent || 0).toFixed(2)}</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#070D1F] border border-cyan-900/40">
          <p className="text-[11px] font-bold text-cyan-400/80 uppercase">Projected Total Expense</p>
          <p className="text-xl font-extrabold text-blue-400 mt-1">${(projected_month_end_expense || 0).toFixed(2)}</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#070D1F] border border-cyan-900/40">
          <p className="text-[11px] font-bold text-cyan-400/80 uppercase">Projected End Balance</p>
          <p className={`text-xl font-extrabold mt-1 ${(projected_month_end_balance || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            ${(projected_month_end_balance || 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Forecast Line Chart */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Cumulative Forecast Trajectory</h4>
          <span className="text-[11px] text-slate-400">Actual vs. Projected Velocity</span>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={forecast_points} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <XAxis dataKey="date_str" stroke="#64748B" fontSize={10} tickLine={false} interval={3} />
              <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#070D1F', borderColor: '#1E293B', borderRadius: '12px', fontSize: '12px' }}
                formatter={(value, name) => [value !== null ? `$${value.toFixed(2)}` : 'N/A', name]}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              {current_income > 0 && (
                <ReferenceLine y={current_income} stroke="#10B981" strokeDasharray="4 4" label={{ value: `Income Limit ($${current_income})`, fill: '#10B981', fontSize: 10, position: 'top' }} />
              )}
              <Line
                type="monotone"
                dataKey="actual_spent"
                stroke="#06B6D4"
                strokeWidth={3}
                dot={{ r: 3, fill: '#06B6D4' }}
                name="Actual Spent ($)"
              />
              <Line
                type="monotone"
                dataKey="projected_spent"
                stroke="#3B82F6"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Projected Trajectory ($)"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default CashflowPredictor;
