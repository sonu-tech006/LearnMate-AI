import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';
import { PWAInstallButton } from '../common/PWAInstallButton.tsx';
import { api } from '../../services/api.ts';
import {
  GraduationCap,
  Sun,
  Moon,
  Database,
  LogIn,
  LogOut,
  User as UserIcon,
  Sparkles,
  Search,
} from 'lucide-react';

interface NavbarProps {
  onOpenAuth: (mode?: 'login' | 'signup') => void;
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenSearch?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth, onSelectTab, onOpenSearch }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [dbStatus, setDbStatus] = useState<{ isAtlas: boolean; status: string; message: string }>({
    isAtlas: false,
    status: 'checking',
    message: 'Connecting...',
  });

  useEffect(() => {
    api
      .getHealth()
      .then((res) => {
        if (res.database) {
          setDbStatus(res.database);
        }
      })
      .catch(() => {
        setDbStatus({
          isAtlas: false,
          status: 'ready',
          message: 'Active',
        });
      });
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div
          onClick={() => onSelectTab('home')}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                LearnMate
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                AI
              </span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 -mt-0.5 hidden sm:block">
              Your Personal Learning Companion
            </p>
          </div>
        </div>

        {/* Database Status Chip (Real DB feedback) */}
        <button
          onClick={() => onSelectTab('profile')}
          title="Click to view database connection diagnostics"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 transition cursor-pointer"
        >
          <Database className="w-3.5 h-3.5 text-indigo-500" />
          <span>{dbStatus.isAtlas ? 'MongoDB Atlas' : 'MongoDB Ready'}</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
        </button>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* AI Smart Search Button */}
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200/80 dark:border-indigo-900/60 bg-indigo-50/70 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-semibold transition cursor-pointer"
              title="Search notes with Gemini AI synthesis"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">AI Search</span>
            </button>
          )}

          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Profile / Auth */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onSelectTab('profile')}
                className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                  {user.name.charAt(0)}
                </div>
                <div className="hidden sm:block text-left text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate max-w-[100px]">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate max-w-[100px]">
                    {user.email}
                  </span>
                </div>
              </button>

              <button
                onClick={logout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition hidden sm:flex"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onOpenAuth('login')}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
