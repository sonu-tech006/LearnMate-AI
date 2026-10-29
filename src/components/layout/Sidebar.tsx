import React from 'react';
import {
  LayoutDashboard,
  Sparkles,
  BookOpen,
  HelpCircle,
  BarChart3,
  User,
  Flame,
  PlusCircle,
  Layers,
  Timer,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  streakCount?: number;
  onQuickAction?: (action: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  streakCount = 1,
  onQuickAction,
}) => {
  const navItems = [
    { id: 'home', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'learn', label: 'AI Workspace', icon: Sparkles, badge: 'AI' },
    { id: 'notes', label: 'My Notes', icon: BookOpen },
    { id: 'cards', label: 'Flashcards', icon: Layers, badge: 'Recall' },
    { id: 'timer', label: 'Focus Timer', icon: Timer },
    { id: 'quizzes', label: 'Quiz Center', icon: HelpCircle },
    { id: 'progress', label: 'Progress & Stats', icon: BarChart3 },
    { id: 'profile', label: 'Profile & Settings', icon: User },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/40 p-4 justify-between h-[calc(100vh-4rem)] sticky top-16 select-none">
      <div className="space-y-6">
        {/* Navigation Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick Study Action */}
        {onQuickAction && (
          <div className="pt-2">
            <button
              onClick={() => onQuickAction('create-note')}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-dashed border-indigo-300 dark:border-indigo-800/80 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Study Note</span>
            </button>
          </div>
        )}
      </div>

      {/* Daily Streak Card */}
      <div className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Flame className="w-5 h-5 fill-white" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                Study Streak
              </p>
              <p className="text-lg font-extrabold text-amber-950 dark:text-white leading-tight">
                {streakCount} {streakCount === 1 ? 'Day' : 'Days'} 🔥
              </p>
            </div>
          </div>
        </div>
        <p className="mt-2 text-[11px] text-amber-800/80 dark:text-amber-400/80">
          Complete a revision task or quiz today to maintain your streak!
        </p>
      </div>
    </aside>
  );
};
