import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { AnalyticsOverview } from '../../types.ts';
import {
  BarChart3,
  TrendingUp,
  Flame,
  Clock,
  HelpCircle,
  BookOpen,
  Award,
  CheckCircle,
  Calendar,
} from 'lucide-react';

export const ProgressView: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    api
      .getAnalyticsOverview()
      .then((res) => setAnalytics(res.analytics))
      .catch((err) => console.warn('Progress load notice:', err))
      .finally(() => setIsLoading(false));
  }, [isAuthenticated]);

  if (isLoading || !analytics) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-1/3" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
        <div className="h-72 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
      </div>
    );
  }

  const streak = analytics.streakDays || 1;
  const totalMins = analytics.totalStudyMinutes || 0;
  const totalHours = (totalMins / 60).toFixed(1);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
          <BarChart3 className="w-4 h-4" />
          <span>Real-time Learning Analytics</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Progress & Mastery
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Quantified metrics derived from your stored study sessions, notes, and quiz submissions.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Streak */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Current Streak</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400 flex items-center justify-center">
              <Flame className="w-4 h-4 fill-amber-500" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {streak} <span className="text-sm font-medium text-slate-400">Days</span>
          </p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
            Consistent habit formed
          </p>
        </div>

        {/* Study Time */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Total Study Time</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {totalHours} <span className="text-sm font-medium text-slate-400">Hours</span>
          </p>
          <p className="text-[11px] text-slate-400 font-medium mt-1">
            {totalMins} logged minutes
          </p>
        </div>

        {/* Quiz Avg */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Average Quiz Score</span>
            <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {analytics.averageQuizScore}%
          </p>
          <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mt-1">
            {analytics.totalQuizzesTaken} completed tests
          </p>
        </div>

        {/* Notes Synthesized */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Repository Notes</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {analytics.totalNotes}
          </p>
          <p className="text-[11px] text-slate-400 font-medium mt-1">
            Active concepts cataloged
          </p>
        </div>
      </div>

      {/* 7-Day Study Time Activity Chart */}
      <div className="p-5 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <span>Study Time by Day (Past 7 Days)</span>
            </h2>
            <p className="text-xs text-slate-400">
              Interactive daily breakdown of completed study sessions
            </p>
          </div>
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-3 py-1 rounded-full">
            Daily Goal: 45 min
          </span>
        </div>

        <div className="pt-6 pb-2">
          <div className="flex items-end justify-between gap-3 h-52 border-b border-slate-100 dark:border-slate-800 pb-2">
            {analytics.weeklyActivity.map((act, i) => {
              const maxMins = Math.max(60, ...analytics.weeklyActivity.map((a) => a.minutes));
              const heightPercent = Math.max(8, Math.round((act.minutes / maxMins) * 100));
              const isToday = i === analytics.weeklyActivity.length - 1;

              return (
                <div key={act.date} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="text-[10px] text-slate-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    {act.minutes}m ({act.tasksCompleted} tasks)
                  </div>
                  <div className="w-full max-w-[48px] bg-slate-100 dark:bg-slate-800 rounded-t-2xl h-full flex items-end overflow-hidden">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t-2xl transition-all duration-500 ${
                        isToday
                          ? 'bg-gradient-to-t from-indigo-600 to-violet-500 shadow-md shadow-indigo-500/20'
                          : act.minutes > 0
                          ? 'bg-indigo-400/80 dark:bg-indigo-500/60'
                          : 'bg-transparent'
                      }`}
                    />
                  </div>
                  <div className="text-center">
                    <span
                      className={`text-xs block ${
                        isToday
                          ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                          : 'text-slate-500 dark:text-slate-400 font-medium'
                      }`}
                    >
                      {act.day}
                    </span>
                    <span className="text-[9px] text-slate-400">{act.date.slice(5)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Subject-Wise Performance Breakdown */}
      <div className="p-5 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Subject-Wise Performance & Retention
          </h2>
          <p className="text-xs text-slate-400">
            Performance calculated by combining study minutes, quizzes, and note coverage
          </p>
        </div>

        {analytics.subjectPerformance.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No subject data recorded yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {analytics.subjectPerformance.map((sub) => (
              <div
                key={sub.subject}
                className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {sub.subject}
                  </h3>
                  <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-md">
                    {sub.averageQuizScore > 0 ? `${sub.averageQuizScore}% Avg` : 'Quiz Pending'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Study Time:</span>
                    <span className="font-semibold">{sub.studyMinutes} mins</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Notes Stored:</span>
                    <span className="font-semibold">{sub.notesCount} notes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Quizzes Taken:</span>
                    <span className="font-semibold">{sub.quizzesTaken} attempts</span>
                  </div>
                </div>

                {/* Visual Progress bar */}
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mt-2">
                  <div
                    style={{ width: `${Math.max(10, Math.min(100, sub.averageQuizScore || 25))}%` }}
                    className="h-full bg-indigo-600 rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
