import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  GraduationCap,
  Sparkles,
  HelpCircle,
  Brain,
  Calendar,
  ArrowRight,
  CheckCircle2,
  Lock,
  Database,
  Flame,
} from 'lucide-react';

interface WelcomeLandingProps {
  onOpenAuth: (mode?: 'login' | 'signup') => void;
}

export const WelcomeLanding: React.FC<WelcomeLandingProps> = ({ onOpenAuth }) => {
  const { loginAsDemo, isLoading } = useAuth();

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-5xl mx-auto space-y-10 animate-in fade-in">
      {/* Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-950 text-white p-6 sm:p-10 shadow-2xl border border-indigo-800/60">
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold text-indigo-200">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>AI-Powered Learning Suite</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
            LearnMate AI — Your Personal Learning Companion
          </h1>

          <p className="text-sm sm:text-base text-indigo-100/90 leading-relaxed">
            Accelerate your academic mastery with AI note synthesis, interactive adaptive quizzes, spaced repetition planning, and 24/7 personal concept tutoring.
          </p>

          {/* Action Buttons */}
          <div className="pt-3 flex flex-wrap gap-3">
            <button
              onClick={loginAsDemo}
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-extrabold text-sm shadow-lg shadow-indigo-600/30 active:scale-95 transition"
            >
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>Enter as Demo Student (Alex Johnson)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onOpenAuth('signup')}
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm backdrop-blur-md active:scale-95 transition"
            >
              <span>Create Account</span>
            </button>

            <button
              onClick={() => onOpenAuth('login')}
              className="px-4 py-3.5 rounded-2xl text-indigo-200 hover:text-white font-semibold text-sm transition"
            >
              Sign In
            </button>
          </div>

          {/* Badges */}
          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-indigo-200/80">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Zero Configuration
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-indigo-400" />
              Private JWT Isolated Data
            </span>
            <span className="flex items-center gap-1.5">
              <Database className="w-4 h-4 text-violet-400" />
              MongoDB Atlas Ready
            </span>
          </div>
        </div>
      </div>

      {/* Feature Showcase Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Designed for Deep Student Retention
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Feature 1 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              AI Notes Summarizer
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Paste articles or lecture notes to extract executive summaries, key principles, academic definitions, and high-yield revision bullet points. Save results directly to your notes collection.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Interactive AI Quiz Generator
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Generate 3, 5, or 10 question adaptive assessments at Easy, Medium, or Hard difficulty. Get instant graded feedback with detailed pedagogical explanations for every question.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Brain className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              24/7 Conversational AI Tutor
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Ask your dedicated tutor to clarify complex ideas across Computer Science, Biology, History, Mathematics, and Physics using intuitive real-world analogies and step-by-step reasoning.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Smart Spaced Revision Planner
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Input a subject and your target exam date. LearnMate constructs spaced-repetition study milestones with 1-click sync to your MongoDB revision calendar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
