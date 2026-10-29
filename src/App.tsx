/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ToastProvider } from './context/ToastContext.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/layout/Navbar.tsx';
import { Sidebar } from './components/layout/Sidebar.tsx';
import { BottomNav } from './components/layout/BottomNav.tsx';
import { OfflineIndicator } from './components/common/OfflineIndicator.tsx';
import { AuthModal } from './components/auth/AuthModal.tsx';
import { DashboardView } from './components/dashboard/DashboardView.tsx';
import { LearnWorkspace } from './components/workspace/LearnWorkspace.tsx';
import { NotesView } from './components/notes/NotesView.tsx';
import { QuizzesView } from './components/quizzes/QuizzesView.tsx';
import { ProgressView } from './components/progress/ProgressView.tsx';
import { ProfileView } from './components/profile/ProfileView.tsx';
import { WelcomeLanding } from './components/auth/WelcomeLanding.tsx';
import { FlashcardsView } from './components/flashcards/FlashcardsView.tsx';
import { FocusTimerView } from './components/timer/FocusTimerView.tsx';
import { AISearchModal } from './components/search/AISearchModal.tsx';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  const [currentTab, setCurrentTab] = useState<string>('home');
  const [learnMode, setLearnMode] = useState<'summarize' | 'quiz' | 'tutor' | 'planner'>('summarize');
  const [selectedNoteId, setSelectedNoteId] = useState<string | undefined>(undefined);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);

  const handleOpenAuth = (mode: 'login' | 'signup' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleNavigate = (tab: string, extra?: { mode?: string; noteId?: string }) => {
    setCurrentTab(tab);
    if (tab === 'learn' && extra?.mode) {
      setLearnMode(extra.mode as 'summarize' | 'quiz' | 'tutor' | 'planner');
    }
    if (tab === 'notes' && extra?.noteId) {
      setSelectedNoteId(extra.noteId);
    }
  };

  const handleOpenAIWorkspaceFromNote = (mode: 'summarize' | 'quiz', noteContent: string, subject: string) => {
    setLearnMode(mode);
    setCurrentTab('learn');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#090d16]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wide uppercase">
            Loading LearnMate AI...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
      {/* Offline Status */}
      <OfflineIndicator />

      {/* Top Navigation */}
      <Navbar
        onOpenAuth={handleOpenAuth}
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenSearch={() => setIsSearchModalOpen(true)}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex w-full max-w-7xl mx-auto pb-20 lg:pb-8">
        {/* Desktop Responsive Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          onQuickAction={() => setCurrentTab('notes')}
        />

        {/* View Router */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          {!isAuthenticated ? (
            <WelcomeLanding onOpenAuth={handleOpenAuth} />
          ) : (
            <>
              {currentTab === 'home' && (
                <DashboardView
                  onNavigate={handleNavigate}
                  onOpenCreateNote={() => setCurrentTab('notes')}
                />
              )}

              {currentTab === 'learn' && (
                <LearnWorkspace
                  initialMode={learnMode}
                  onNavigateNotes={() => setCurrentTab('notes')}
                  onNavigateQuizzes={() => setCurrentTab('quizzes')}
                />
              )}

              {currentTab === 'notes' && (
                <NotesView
                  initialNoteId={selectedNoteId}
                  onOpenAIWorkspace={handleOpenAIWorkspaceFromNote}
                />
              )}

              {currentTab === 'cards' && <FlashcardsView />}

              {currentTab === 'timer' && <FocusTimerView />}

              {currentTab === 'quizzes' && (
                <QuizzesView
                  onOpenGenerateQuiz={() => {
                    setLearnMode('quiz');
                    setCurrentTab('learn');
                  }}
                />
              )}

              {currentTab === 'progress' && <ProgressView />}

              {currentTab === 'profile' && (
                <ProfileView onOpenAuth={() => handleOpenAuth('login')} />
              )}
            </>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* AI Smart Search Modal */}
      <AISearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelectNote={(noteId) => {
          setIsSearchModalOpen(false);
          handleNavigate('notes', { noteId });
        }}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
