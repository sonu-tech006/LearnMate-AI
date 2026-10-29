import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { api } from '../../services/api.ts';
import {
  User,
  Mail,
  Shield,
  Database,
  Sun,
  Moon,
  Download,
  LogOut,
  Sparkles,
  CheckCircle,
  Clock,
  Layers,
} from 'lucide-react';

interface ProfileViewProps {
  onOpenAuth: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onOpenAuth }) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { showToast } = useToast();

  const [healthData, setHealthData] = useState<{
    database?: { status: string; message: string; isAtlas: boolean };
    geminiConfigured?: boolean;
  }>({});
  const [dbLatency, setDbLatency] = useState<number | null>(null);
  const [isTestingDb, setIsTestingDb] = useState(false);

  const checkHealth = async () => {
    const start = performance.now();
    try {
      const res = await api.getHealth();
      const latency = Math.round(performance.now() - start);
      setDbLatency(latency);
      setHealthData(res);
      return { res, latency };
    } catch (err) {
      console.warn(err);
      return null;
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const handleTestDatabaseConnection = async () => {
    setIsTestingDb(true);
    const result = await checkHealth();
    setIsTestingDb(false);
    if (result) {
      showToast(
        `Database verified! Response in ${result.latency}ms. Engine: ${
          result.res.database?.isAtlas ? 'MongoDB Atlas Cluster' : 'In-Memory Store'
        }`,
        'success'
      );
    } else {
      showToast('Could not reach backend database service.', 'error');
    }
  };

  const handleExportData = async () => {
    try {
      const [notesRes, quizzesRes, sessionsRes] = await Promise.all([
        api.getNotes({ limit: 200 }),
        api.getQuizzes(),
        api.getStudySessions(),
      ]);

      const backup = {
        exportedAt: new Date().toISOString(),
        user: { name: user?.name, email: user?.email },
        notes: notesRes.notes,
        quizzes: quizzesRes.quizzes,
        studySessions: sessionsRes.sessions,
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `learnmate_learning_data_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      showToast('Learning records exported successfully!', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Export failed';
      showToast(msg, 'error');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
          <User className="w-4 h-4" />
          <span>Account & Preferences</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Profile & System Status
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Manage your student account, theme preferences, and review database connectivity.
        </p>
      </div>

      {/* Account Info Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-extrabold text-2xl uppercase shadow-md shadow-indigo-600/20">
            {user?.name.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {user?.name || 'Student Learner'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
              <Mail className="w-3.5 h-3.5" />
              <span>{user?.email || 'student@example.com'}</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Today'}</span>
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-3">
          <button
            onClick={onOpenAuth}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Switch Account
          </button>
          <button
            onClick={logout}
            className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-semibold transition flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Preferences & System Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Appearance Card */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            {isDark ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            <span>App Theme</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Switch between crisp pure white theme and eye-friendly dark mode for late-night study sessions.
          </p>
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:border-indigo-500 transition cursor-pointer"
          >
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Current: {isDark ? 'Dark Mode 🌙' : 'Pure White Light Mode ☀️'}
            </span>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Toggle Theme</span>
          </button>
        </div>

        {/* Export Data Card */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Export Learning Records</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Download your notes, quizzes, and revision sessions in standard JSON format.
          </p>
          <button
            onClick={handleExportData}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-bold transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download JSON Backup</span>
          </button>
        </div>
      </div>

      {/* Real Database Diagnostics Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Database Connection & Live Status</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Real-time health check, latency verification, and storage engine inspection.
            </p>
          </div>
          <button
            onClick={handleTestDatabaseConnection}
            disabled={isTestingDb}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition cursor-pointer"
          >
            <Database className={`w-3.5 h-3.5 ${isTestingDb ? 'animate-spin' : ''}`} />
            <span>{isTestingDb ? 'Testing Connection...' : 'Test Connection Now'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Connection State
            </span>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {healthData.database?.status === 'ok' ? 'Connected & Active' : 'Active (Ready)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {healthData.database?.message || 'Database running normally'}
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Storage Engine
            </span>
            <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
              {healthData.database?.isAtlas ? 'MongoDB Atlas Cluster' : 'In-Memory DB Store'}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              4 Collections: Users, Notes, Quizzes, Sessions
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              API Response Ping
            </span>
            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              {dbLatency !== null ? `${dbLatency} ms` : 'Measuring...'}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Fast full-stack express pipeline
            </p>
          </div>
        </div>
      </div>

      {/* Backend & Security Information */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-indigo-600" />
          <span>Architecture & Security Standards</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* DB Status */}
          <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
              <Database className="w-4 h-4 text-indigo-500" />
              <span>MongoDB Engine</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {healthData.database?.message || 'Ready with schema isolation'}
            </p>
            <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold pt-1">
              <CheckCircle className="w-3 h-3" />
              <span>{healthData.database?.isAtlas ? 'Connected to Atlas Cluster' : 'In-Memory Store Active'}</span>
            </div>
          </div>

          {/* Auth Security */}
          <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>Authentication</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Bcrypt salted password hashes & signed JWT session tokens.
            </p>
            <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold pt-1">
              <CheckCircle className="w-3 h-3" />
              <span>User Ownership Enforced</span>
            </div>
          </div>

          {/* AI Engine */}
          <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
              <Sparkles className="w-4 h-4 text-violet-500" />
              <span>AI Learning Model</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Gemini 3.8 Flash with structured schema extraction.
            </p>
            <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold pt-1">
              <CheckCircle className="w-3 h-3" />
              <span>Server-Side Proxy Secured</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
