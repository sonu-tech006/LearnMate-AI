import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { api } from '../../services/api.ts';
import { AnalyticsOverview, Note, Quiz, StudySession } from '../../types.ts';
import {
  Sparkles,
  Flame,
  Clock,
  CheckCircle2,
  Circle,
  BookOpen,
  HelpCircle,
  Calendar,
  ArrowRight,
  TrendingUp,
  Plus,
  Compass,
  Layers,
  Timer,
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (tab: string, extra?: { mode?: string; noteId?: string }) => void;
  onOpenCreateNote: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, onOpenCreateNote }) => {
  const { user, isAuthenticated, loginAsDemo } = useAuth();
  const { showToast } = useToast();

  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [recentQuizzes, setRecentQuizzes] = useState<Quiz[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<StudySession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const loadDashboardData = async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const [analyticsRes, notesRes, quizzesRes, sessionsRes] = await Promise.all([
        api.getAnalyticsOverview(),
        api.getNotes({ limit: 3 }),
        api.getQuizzes(),
        api.getStudySessions(),
      ]);

      setAnalytics(analyticsRes.analytics);
      setRecentNotes(notesRes.notes);
      setRecentQuizzes(quizzesRes.quizzes.slice(0, 3));
      // Filter upcoming or today's sessions
      setUpcomingSessions(sessionsRes.sessions.slice(0, 4));
    } catch (err: unknown) {
      console.warn('Dashboard load notice:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const handleToggleTask = async (task: StudySession) => {
    const newStatus = !task.completed;
    try {
      await api.updateStudySession(task._id, { completed: newStatus });
      setUpcomingSessions((prev) =>
        prev.map((s) => (s._id === task._id ? { ...s, completed: newStatus } : s))
      );
      showToast(
        newStatus ? 'Task completed! Keep up the momentum! 🎉' : 'Task marked as pending',
        'success'
      );
      // Refresh analytics
      api.getAnalyticsOverview().then((res) => setAnalytics(res.analytics));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update task';
      showToast(msg, 'error');
    }
  };

  if (isLoading && !analytics) {
    return (
      <div className="space-y-6 animate-pulse p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-2xl w-2/3" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
      </div>
    );
  }

  const streak = analytics?.streakDays || 1;
  const totalMinutes = analytics?.totalStudyMinutes || 0;
  const totalHours = (totalMinutes / 60).toFixed(1);
  const goalPercent = analytics?.todayGoalCompletion || 0;
  const todayMinutes = analytics?.todayMinutes || 0;
  const targetMinutes = analytics?.dailyTargetMinutes || 45;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in">
      {/* Hero Greeting & Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-950/20 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-violet-500/20 blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-indigo-200">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>AI Learning Assistant Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {getGreeting()}, {user?.name.split(' ')[0] || 'Learner'} 👋
          </h1>
          <p className="text-sm text-indigo-100 max-w-xl">
            You're on a <strong className="text-amber-300 font-bold">{streak}-day streak</strong>! Ready to conquer your revision goals today?
          </p>
        </div>

        {/* Today's Goal Progress Capsule */}
        <div className="relative z-10 flex items-center gap-4 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
          <div className="relative w-14 h-14 flex items-center justify-center">
            {/* SVG Progress Circle */}
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-white/20"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-amber-400"
                strokeDasharray={`${goalPercent}, 100`}
                strokeLinecap="round"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-xs font-bold">{goalPercent}%</span>
          </div>
          <div>
            <p className="text-xs text-indigo-200 font-medium">Today's Study Goal</p>
            <p className="text-sm font-bold text-white">
              {todayMinutes}m / {targetMinutes}m completed
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Streak */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Study Streak</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400 flex items-center justify-center">
              <Flame className="w-4 h-4 fill-amber-500" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {streak} <span className="text-sm font-medium text-slate-400">days</span>
          </p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
            Active daily learner
          </p>
        </div>

        {/* Study Time */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Study Time</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {totalHours} <span className="text-sm font-medium text-slate-400">hrs</span>
          </p>
          <p className="text-[11px] text-slate-400 font-medium mt-1">
            {totalMinutes} total minutes logged
          </p>
        </div>

        {/* Notes Saved */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Saved Notes</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {analytics?.totalNotes ?? 0}
          </p>
          <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mt-1">
            With AI summaries & tags
          </p>
        </div>

        {/* Quiz Avg */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Quiz Accuracy</span>
            <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400 flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {analytics?.averageQuizScore ?? 0}%
          </p>
          <p className="text-[11px] text-slate-400 font-medium mt-1">
            Across {analytics?.totalQuizzesTaken ?? 0} quizzes taken
          </p>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Compass className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Quick Learning Actions</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={onOpenCreateNote}
            className="flex flex-col items-start p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md transition text-left group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
              <Plus className="w-4 h-4" />
            </div>
            <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Create Note</span>
            <span className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">Study notes</span>
          </button>

          <button
            onClick={() => onNavigate('learn', { mode: 'quiz' })}
            className="flex flex-col items-start p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md transition text-left group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
              <HelpCircle className="w-4 h-4" />
            </div>
            <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">AI Quiz</span>
            <span className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">Multi-choice</span>
          </button>

          <button
            onClick={() => onNavigate('learn', { mode: 'summarize' })}
            className="flex flex-col items-start p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md transition text-left group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Summarize</span>
            <span className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">Key concepts</span>
          </button>

          <button
            onClick={() => onNavigate('cards')}
            className="flex flex-col items-start p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md transition text-left group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
              <Layers className="w-4 h-4" />
            </div>
            <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Flashcards</span>
            <span className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">Active recall</span>
          </button>

          <button
            onClick={() => onNavigate('timer')}
            className="flex flex-col items-start p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md transition text-left group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
              <Timer className="w-4 h-4" />
            </div>
            <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Focus Timer</span>
            <span className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">25m Pomodoro</span>
          </button>

          <button
            onClick={() => onNavigate('learn', { mode: 'planner' })}
            className="flex flex-col items-start p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md transition text-left group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Plan Revision</span>
            <span className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">Smart schedule</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Weekly Chart & Revision Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Activity Interactive Bar Chart */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <span>Weekly Study Activity</span>
              </h3>
              <p className="text-xs text-slate-400">Minutes studied over the past 7 days</p>
            </div>
            <button
              onClick={() => onNavigate('progress')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>Full Analytics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Bar Chart Visualization */}
          <div className="pt-6 pb-2">
            <div className="flex items-end justify-between gap-2 sm:gap-4 h-48 border-b border-slate-100 dark:border-slate-800 pb-2">
              {analytics?.weeklyActivity?.map((act, i) => {
                const maxMins = Math.max(
                  60,
                  ...analytics.weeklyActivity.map((a) => a.minutes)
                );
                const heightPercent = Math.max(8, Math.round((act.minutes / maxMins) * 100));
                const isToday = i === analytics.weeklyActivity.length - 1;

                return (
                  <div key={act.date} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="text-[10px] text-slate-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                      {act.minutes}m
                    </div>
                    <div className="w-full max-w-[36px] bg-slate-100 dark:bg-slate-800 rounded-t-xl h-full flex items-end overflow-hidden">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-xl transition-all duration-500 ${
                          isToday
                            ? 'bg-gradient-to-t from-indigo-600 to-violet-500 shadow-md shadow-indigo-500/20'
                            : act.minutes > 0
                            ? 'bg-indigo-400/80 dark:bg-indigo-500/60'
                            : 'bg-transparent'
                        }`}
                      />
                    </div>
                    <span
                      className={`text-[11px] font-semibold ${
                        isToday
                          ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {act.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 pt-3">
            <span>Target: 45 min/day</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              Calculated from stored sessions
            </span>
          </div>
        </div>

        {/* Upcoming Revision Tasks */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-violet-600" />
                <span>Revision Tasks</span>
              </h3>
              <button
                onClick={() => onNavigate('learn', { mode: 'planner' })}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                + Plan More
              </button>
            </div>

            {upcomingSessions.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                <p>No revision tasks scheduled.</p>
                <button
                  onClick={() => onNavigate('learn', { mode: 'planner' })}
                  className="mt-2 text-indigo-600 font-semibold"
                >
                  Generate AI Study Plan
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {upcomingSessions.map((session) => (
                  <div
                    key={session._id}
                    onClick={() => handleToggleTask(session)}
                    className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition select-none ${
                      session.completed
                        ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 opacity-60'
                        : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-indigo-400 shadow-2xs'
                    }`}
                  >
                    <button className="mt-0.5 text-indigo-600 dark:text-indigo-400 shrink-0">
                      {session.completed ? (
                        <CheckCircle2 className="w-4 h-4 fill-emerald-500 text-white" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs font-semibold truncate ${
                          session.completed
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {session.taskTitle}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                        <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 font-medium text-slate-600 dark:text-slate-300">
                          {session.subject}
                        </span>
                        <span>{session.durationMinutes} mins</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 text-center">
            Tap any task to mark completed and update your streak!
          </div>
        </div>
      </div>

      {/* Recent Notes & Recent Quizzes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Notes */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>Recent Notes</span>
            </h3>
            <button
              onClick={() => onNavigate('notes')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentNotes.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No notes created yet.
            </div>
          ) : (
            <div className="space-y-3">
              {recentNotes.map((note) => (
                <div
                  key={note._id}
                  onClick={() => onNavigate('notes', { noteId: note._id })}
                  className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition cursor-pointer group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      {note.subject}
                    </span>
                    {note.aiSummary && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 text-[9px] font-bold">
                        <Sparkles className="w-2.5 h-2.5" />
                        AI Summary
                      </span>
                    )}
                  </div>
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition mt-1 truncate">
                    {note.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                    {note.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Quizzes */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-violet-600" />
              <span>Recent Quizzes</span>
            </h3>
            <button
              onClick={() => onNavigate('quizzes')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>Take Quiz</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentQuizzes.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No quizzes completed yet.
            </div>
          ) : (
            <div className="space-y-3">
              {recentQuizzes.map((quiz) => {
                const scorePercent =
                  quiz.score !== null && quiz.score !== undefined
                    ? Math.round((quiz.score / quiz.totalQuestions) * 100)
                    : null;
                return (
                  <div
                    key={quiz._id}
                    onClick={() => onNavigate('quizzes')}
                    className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                        {quiz.subject}
                      </span>
                      <h4 className="font-semibold text-sm text-slate-900 dark:text-white truncate max-w-[220px]">
                        {quiz.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {quiz.totalQuestions} questions
                      </p>
                    </div>

                    <div className="text-right">
                      {scorePercent !== null ? (
                        <span
                          className={`inline-block px-2.5 py-1 rounded-xl text-xs font-bold ${
                            scorePercent >= 80
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : scorePercent >= 60
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {scorePercent}%
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-1 rounded-lg">
                          Start Quiz
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
