import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { useToast } from '../../context/ToastContext.tsx';
import { Note } from '../../types.ts';
import {
  Layers,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Shuffle,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  subject: string;
  noteTitle: string;
}

export const FlashcardsView: React.FC = () => {
  const { showToast } = useToast();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCount, setKnownCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  // Extract flashcards from user's notes and AI summaries
  const loadFlashcards = async () => {
    setIsLoading(true);
    try {
      const res = await api.getNotes({ limit: 50 });
      const generatedCards: Flashcard[] = [];

      res.notes.forEach((note) => {
        // Definitions from AI summary make perfect flashcards
        if (note.aiSummary?.definitions && note.aiSummary.definitions.length > 0) {
          note.aiSummary.definitions.forEach((d, i) => {
            generatedCards.push({
              id: `${note._id}_def_${i}`,
              front: `What is ${d.term}?`,
              back: d.definition,
              subject: note.subject,
              noteTitle: note.title,
            });
          });
        }

        // Key concepts
        if (note.aiSummary?.keyConcepts && note.aiSummary.keyConcepts.length > 0) {
          generatedCards.push({
            id: `${note._id}_concept`,
            front: `Key Concept in ${note.title}:`,
            back: note.aiSummary.keyConcepts.join('\n• '),
            subject: note.subject,
            noteTitle: note.title,
          });
        }

        // High yield revision points
        if (note.aiSummary?.revisionPoints && note.aiSummary.revisionPoints.length > 0) {
          generatedCards.push({
            id: `${note._id}_revision`,
            front: `Active Recall Question for ${note.title}:`,
            back: note.aiSummary.revisionPoints.slice(0, 3).join('\n• '),
            subject: note.subject,
            noteTitle: note.title,
          });
        }
      });

      setCards(generatedCards);
    } catch (err: unknown) {
      console.warn('Load flashcards notice:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFlashcards();
  }, []);

  const filteredCards = selectedSubject === 'All'
    ? cards
    : cards.filter((c) => c.subject.toLowerCase() === selectedSubject.toLowerCase());

  const currentCard = filteredCards[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    if (currentIndex < filteredCards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      showToast('Deck completed! Great active recall session.', 'success');
      setCurrentIndex(0);
    }
  };

  const handlePrevious = () => {
    setIsFlipped(false);
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleMarkMastered = () => {
    setKnownCount((prev) => prev + 1);
    handleNext();
  };

  const handleMarkReview = () => {
    setReviewCount((prev) => prev + 1);
    handleNext();
  };

  const handleShuffle = () => {
    setIsFlipped(false);
    setCards((prev) => [...prev].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    showToast('Cards shuffled!', 'info');
  };

  const subjects = ['All', 'Computer Science', 'Biology', 'Chemistry', 'Mathematics', 'Physics', 'History', 'Psychology'];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
            <Layers className="w-4 h-4" />
            <span>Active Recall Practice</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Flashcards & Spaced Recall
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Test yourself with definitions and key concepts synthesized from your saved study notes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShuffle}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-indigo-500 transition"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Shuffle</span>
          </button>
        </div>
      </div>

      {/* Subject Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {subjects.map((sub) => (
          <button
            key={sub}
            onClick={() => {
              setSelectedSubject(sub);
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedSubject === sub
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-400'
            }`}
          >
            {sub}
          </button>
        ))}
      </div>

      {/* Main Flashcard Container */}
      {isLoading ? (
        <div className="h-80 bg-slate-100 dark:bg-slate-900 rounded-3xl animate-pulse" />
      ) : filteredCards.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
          <Layers className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No Flashcards in {selectedSubject}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Summarize a study note with AI to automatically generate active recall flashcards.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Progress Bar & Counter */}
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Card {currentIndex + 1} of {filteredCards.length}
            </span>
            <div className="flex items-center gap-3 font-semibold">
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {knownCount} Mastered
              </span>
              <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {reviewCount} Need Review
              </span>
            </div>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              style={{ width: `${Math.round(((currentIndex + 1) / filteredCards.length) * 100)}%` }}
              className="h-full bg-indigo-600 rounded-full transition-all duration-300"
            />
          </div>

          {/* Interactive Card */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="cursor-pointer select-none min-h-[300px] sm:min-h-[340px] rounded-3xl p-6 sm:p-10 bg-white dark:bg-slate-900 border-2 border-indigo-100 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 shadow-xl shadow-indigo-950/5 flex flex-col justify-between transition-all duration-300 hover:scale-[1.01]"
          >
            {/* Card Header */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-lg">
                {currentCard.subject}
              </span>
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                <RotateCw className="w-3.5 h-3.5" />
                {isFlipped ? 'Answer View' : 'Tap to Flip'}
              </span>
            </div>

            {/* Card Content */}
            <div className="py-6 text-center space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                {isFlipped ? 'Definition & Explanation' : 'Prompt / Question'}
              </span>
              <div className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-relaxed whitespace-pre-line max-w-xl mx-auto">
                {isFlipped ? currentCard.back : currentCard.front}
              </div>
            </div>

            {/* Card Footer */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-4 border-t border-slate-100 dark:border-slate-800">
              <span className="truncate max-w-[200px]">From: {currentCard.noteTitle}</span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                {isFlipped ? 'Tap to see prompt' : 'Tap to reveal answer'}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <button
                onClick={handleNext}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                <span>Skip</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Confidence Ratings */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleMarkReview}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-3 rounded-2xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 text-xs font-bold transition active:scale-95"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
                <span>Need Review</span>
              </button>

              <button
                onClick={handleMarkMastered}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition active:scale-95"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>Mastered</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
