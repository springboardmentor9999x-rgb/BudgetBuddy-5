import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout/Layout';
import api from '../services/api';
import GoalModal from '../components/Savings/GoalModal';
import DepositModal from '../components/Savings/DepositModal';
import { Target, Plus, Trash2, Edit3, PlusCircle, CheckCircle2, Sparkles, Award, AlertTriangle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const SavingsPage = () => {
  const { fetchNotifications } = useAuth();
  const { showToast } = useToast();

  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [activeDepositGoal, setActiveDepositGoal] = useState(null);

  // Delete Confirmation Modal State
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const res = await api.get('/savings/');
      setGoals(res.data);
    } catch (err) {
      console.error('Failed to load savings goals', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const confirmDeleteGoal = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      await api.delete(`/savings/${deleteTargetId}`);
      showToast('Savings goal removed successfully', 'success');
      fetchGoals();
      fetchNotifications();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to delete goal', 'error');
    } finally {
      setDeleting(false);
      setDeleteTargetId(null);
    }
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setIsGoalModalOpen(true);
  };

  const handleOpenDeposit = (goal) => {
    setActiveDepositGoal(goal);
    setIsDepositModalOpen(true);
  };

  const totalSaved = goals.reduce((sum, g) => sum + g.current_amount, 0);
  const totalTarget = goals.reduce((sum, g) => sum + g.target_amount, 0);

  return (
    <Layout onRefreshData={fetchGoals}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-purple-400 mb-1">
              <Target className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Goal Management</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white">Savings Goals & Milestones</h2>
            <p className="text-xs text-slate-400 mt-1">Set target savings for new laptops, travel trips, or emergency funds.</p>
          </div>

          <button
            onClick={() => {
              setEditingGoal(null);
              setIsGoalModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/30 transition self-start sm:self-center"
          >
            <Plus className="w-4 h-4" />
            Create Goal
          </button>
        </div>

        {/* Overall Savings Banner */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Total Saved Across Goals</p>
            <h3 className="text-2xl font-extrabold text-purple-400 mt-1">${totalSaved.toFixed(2)}</h3>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Combined Target</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">${totalTarget.toFixed(2)}</h3>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Overall Goal Completion</p>
            <h3 className="text-2xl font-extrabold text-emerald-400 mt-1">
              {totalTarget > 0 ? ((totalSaved / totalTarget) * 100).toFixed(1) : 0}%
            </h3>
          </div>
        </div>

        {/* Goals Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-12 text-center text-slate-500">Loading savings goals...</div>
          ) : goals.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500 glass-panel rounded-3xl">
              No savings goals created yet. Click "+ Create Goal" to set your first target!
            </div>
          ) : (
            goals.map((g) => (
              <div key={g.id} className="glass-card glass-card-hover p-6 rounded-3xl border border-slate-800 flex flex-col justify-between space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{g.category}</span>
                    <h3 className="text-lg font-bold text-slate-100 mt-0.5">{g.title}</h3>
                  </div>
                  {g.is_completed ? (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" /> Completed
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[11px] font-bold">
                      In Progress
                    </span>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-2xl font-extrabold text-white">${g.current_amount.toFixed(2)}</span>
                    <span className="text-xs font-semibold text-slate-400">target: ${g.target_amount.toFixed(2)}</span>
                  </div>

                  <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${g.progress_percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 pt-1.5">
                    <span>{g.target_date ? `Deadline: ${new Date(g.target_date).toLocaleDateString()}` : 'No deadline'}</span>
                    <span className="font-bold text-purple-300">{g.progress_percentage}%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  {!g.is_completed && (
                    <button
                      onClick={() => handleOpenDeposit(g)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold border border-emerald-500/30 flex items-center gap-1.5 transition"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> Deposit
                    </button>
                  )}
                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      onClick={() => handleEdit(g)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTargetId(g.id)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {isGoalModalOpen && (
        <GoalModal
          isOpen={isGoalModalOpen}
          onClose={() => {
            setIsGoalModalOpen(false);
            setEditingGoal(null);
          }}
          onSuccess={(msg) => {
            fetchGoals();
            fetchNotifications();
            if (msg) showToast(msg, 'success');
          }}
          initialData={editingGoal}
        />
      )}

      {isDepositModalOpen && (
        <DepositModal
          isOpen={isDepositModalOpen}
          onClose={() => {
            setIsDepositModalOpen(false);
            setActiveDepositGoal(null);
          }}
          onSuccess={(msg) => {
            fetchGoals();
            fetchNotifications();
            if (msg) showToast(msg, 'success');
          }}
          goal={activeDepositGoal}
        />
      )}

      {/* In-Site Dark Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-[#0E1726] p-6 rounded-3xl border border-rose-500/40 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-rose-500/20 pb-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
                <span>Delete Savings Goal</span>
              </div>
              <button onClick={() => setDeleteTargetId(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete this savings goal? All logged deposits for this goal will be released back into your general savings pool.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                disabled={deleting}
                onClick={confirmDeleteGoal}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-md shadow-rose-600/30 transition disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Goal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default SavingsPage;
