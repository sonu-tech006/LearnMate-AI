import React, { useState } from 'react';
import { api } from '../../services/api.ts';
import { useToast } from '../../context/ToastContext.tsx';
import { AISearchResult, Note } from '../../types.ts';
import {
  Search,
  Sparkles,
  X,
  BookOpen,
  ArrowRight,
  Brain,
  Tag,
  CheckCircle2,
} from 'lucide-react';

interface AISearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectNote: (noteId: string) => void;
}

export const AISearchModal: React.FC<AISearchModalProps> = ({
  isOpen,
  onClose,
  onSelectNote,
}) => {
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [aiResult, setAiResult] = useState<AISearchResult | null>(null);
  const [matchingNotes, setMatchingNotes] = useState<Note[]>([]);

  if (!isOpen) return null;

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setAiResult(null);

    try {
      const [aiRes, notesRes] = await Promise.all([
        api.searchAI(query.trim()),
        api.getNotes({ q: query.trim(), limit: 4 }),
      ]);

      setAiResult(aiRes.searchResult);
      setMatchingNotes(notesRes.notes);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'AI search synthesis failed';
      showToast(msg, 'error');
    } finally {
      setIsSearching(false);
    }
  };

  const sampleQueries = [
    'How does ATP Synthase generate energy?',
    'Explain the chain rule in Backpropagation',
    'What are the key differences between SN1 and SN2?',
    'What is the Carnot Cycle efficiency limit?',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6 animate-in fade-in pt-16 sm:pt-4">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>AI Knowledge & Concept Search</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Bar */}
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes, terms, or ask Gemini any study question..."
            className="w-full rounded-2xl border-2 border-indigo-100 dark:border-indigo-950 bg-slate-50 dark:bg-slate-800/80 pl-12 pr-28 py-3.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-900 shadow-xs"
          />
          <button
            type="submit"
            disabled={isSearching || !query.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition disabled:opacity-40"
          >
            {isSearching ? 'Searching...' : 'Ask AI'}
          </button>
        </form>

        {/* Starter suggestion chips */}
        {!aiResult && !isSearching && (
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Suggested Conceptual Queries:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {sampleQueries.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(q);
                    // trigger search
                    setIsSearching(true);
                    api.searchAI(q).then((res) => {
                      setAiResult(res.searchResult);
                      api.getNotes({ q, limit: 4 }).then((n) => setMatchingNotes(n.notes));
                    }).finally(() => setIsSearching(false));
                  }}
                  className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-600 transition"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Searching Loader */}
        {isSearching && (
          <div className="p-8 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Gemini 3.8 Flash is analyzing your notes repository and academic concepts...
            </p>
          </div>
        )}

        {/* AI Answer & Matching Notes Display */}
        {aiResult && (
          <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
            {/* Direct AI Answer Capsule */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/60 dark:to-violet-950/40 border border-indigo-200/80 dark:border-indigo-900/60 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                <Brain className="w-4 h-4" />
                <span>AI Synthesized Answer</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                {aiResult.directAnswer}
              </p>

              {/* Matched Concepts */}
              {aiResult.matchedConcepts?.length > 0 && (
                <div className="pt-2 flex flex-wrap gap-1.5">
                  {aiResult.matchedConcepts.map((concept, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/70 px-2.5 py-0.5 rounded-full"
                    >
                      #{concept}
                    </span>
                  ))}
                </div>
              )}

              {/* Suggested Action */}
              {aiResult.suggestedAction && (
                <div className="pt-2 text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span><strong>Next Step:</strong> {aiResult.suggestedAction}</span>
                </div>
              )}
            </div>

            {/* Relevant Notes from Repository */}
            {matchingNotes.length > 0 && (
              <div className="space-y-2 pt-1">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Related Notes in Your Repository:
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {matchingNotes.map((note) => (
                    <div
                      key={note._id}
                      onClick={() => {
                        onSelectNote(note._id);
                        onClose();
                      }}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 bg-white dark:bg-slate-800/80 cursor-pointer flex items-center justify-between gap-3 group transition"
                    >
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                          {note.subject}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {note.title}
                        </h4>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
