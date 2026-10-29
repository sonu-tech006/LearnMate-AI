import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api.ts';
import { useToast } from '../../context/ToastContext.tsx';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Coffee,
  Brain,
  Flame,
} from 'lucide-react';

export const FocusTimerView: React.FC = () => {
  const { showToast } = useToast();

  const [mode, setMode] = useState<'study' | 'shortBreak' | 'longBreak'>('study');
  const [taskTitle, setTaskTitle] = useState('Deep Work Revision');
  const [subject, setSubject] = useState('Computer Science');

  const durations = {
    study: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
  };

  const [timeLeft, setTimeLeft] = useState(durations.study);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessionsToday, setCompletedSessionsToday] = useState(0);
  const [isLogging, setIsLogging] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setTimeLeft(durations[mode]);
    setIsRunning(false);
  }, [mode]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode]);

  const handleSessionComplete = async () => {
    if (mode === 'study') {
      setIsLogging(true);
      try {
        const studyMinutes = Math.round(durations.study / 60);
        await api.createStudySession({
          taskTitle: taskTitle.trim() || 'Pomodoro Focus Session',
          subject,
          durationMinutes: studyMinutes,
          scheduledAt: new Date().toISOString(),
        });

        setCompletedSessionsToday((prev) => prev + 1);
        showToast(`🎉 Focus session complete! Logged ${studyMinutes} minutes to your study streak.`, 'success');
        setMode('shortBreak');
      } catch (err: unknown) {
        console.warn('Logging session error:', err);
      } finally {
        setIsLogging(false);
      }
    } else {
      showToast('Break over! Ready for the next deep work session?', 'info');
      setMode('study');
    }
  };

  const handleManualFinish = async () => {
    const elapsedSeconds = durations[mode] - timeLeft;
    const elapsedMinutes = Math.max(1, Math.round(elapsedSeconds / 60));

    if (mode === 'study' && elapsedMinutes >= 1) {
      setIsLogging(true);
      try {
        await api.createStudySession({
          taskTitle: `${taskTitle.trim() || 'Focus Session'} (${elapsedMinutes}m)`,
          subject,
          durationMinutes: elapsedMinutes,
          scheduledAt: new Date().toISOString(),
        });

        setCompletedSessionsToday((prev) => prev + 1);
        showToast(`Logged ${elapsedMinutes} minutes to your learning streak!`, 'success');
        setTimeLeft(durations[mode]);
        setIsRunning(false);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to record session';
        showToast(msg, 'error');
      } finally {
        setIsLogging(false);
      }
    } else {
      setTimeLeft(durations[mode]);
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(durations[mode]);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progressPercent = Math.round(((durations[mode] - timeLeft) / durations[mode]) * 100);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs uppercase tracking-wider">
          <Timer className="w-4 h-4" />
          <span>Pomodoro Study Technique</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Focus Mode & Study Timer
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Eliminate distractions. Completed focus periods are saved directly to your MongoDB learning streak.
        </p>
      </div>

      {/* Mode Switcher */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-2xl bg-slate-100 dark:bg-slate-900 p-1.5 border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setMode('study')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              mode === 'study'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Focus (25m)</span>
          </button>

          <button
            onClick={() => setMode('shortBreak')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              mode === 'shortBreak'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>Short Break (5m)</span>
          </button>

          <button
            onClick={() => setMode('longBreak')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              mode === 'longBreak'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>Long Break (15m)</span>
          </button>
        </div>
      </div>

      {/* Timer Display Card */}
      <div className="relative overflow-hidden p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 shadow-xl text-center space-y-6">
        {/* Big Digital Clock */}
        <div className="relative z-10 space-y-2">
          <div className="text-6xl sm:text-8xl font-black tracking-tight text-slate-900 dark:text-white font-mono select-none">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            {mode === 'study' ? 'Deep Focus Session' : 'Rest & Rejuvenation'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-md mx-auto bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            style={{ width: `${progressPercent}%` }}
            className="h-full bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full transition-all duration-500"
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-extrabold text-sm text-white shadow-xl active:scale-95 transition ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5 fill-white" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-white ml-0.5" />
                <span>Start Focus</span>
              </>
            )}
          </button>

          <button
            onClick={handleReset}
            className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Reset Timer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {mode === 'study' && timeLeft < durations.study && (
            <button
              onClick={handleManualFinish}
              disabled={isLogging}
              className="px-4 py-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 transition"
              title="Save completed time to MongoDB"
            >
              <CheckCircle2 className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Session details */}
        {mode === 'study' && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 max-w-md mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                Current Subject
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-hidden"
              >
                <option value="Computer Science">Computer Science</option>
                <option value="Biology">Biology</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Physics">Physics</option>
                <option value="History">History</option>
                <option value="Psychology">Psychology</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                Focus Objective
              </label>
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="e.g. Master Backpropagation"
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-hidden"
              />
            </div>
          </div>
        )}
      </div>

      {/* Today's Focus Stats */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Completed Pomodoros Today:
          </span>
          <span className="font-bold text-slate-900 dark:text-white">
            {completedSessionsToday}
          </span>
        </div>
        <span className="text-[11px] text-slate-400">
          Syncs automatically with your study analytics
        </span>
      </div>
    </div>
  );
};
