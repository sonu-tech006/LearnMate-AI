import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { useToast } from '../../context/ToastContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { Quiz } from '../../types.ts';
import {
  HelpCircle,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Trophy,
  Clock,
  BookOpen,
} from 'lucide-react';

interface QuizzesViewProps {
  onOpenGenerateQuiz: () => void;
}

export const QuizzesView: React.FC<QuizzesViewProps> = ({ onOpenGenerateQuiz }) => {
  const { showToast } = useToast();
  const { isAuthenticated } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active quiz session
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    score: number;
    total: number;
    percentage: number;
  } | null>(null);

  const fetchQuizzes = async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.getQuizzes();
      setQuizzes(res.quizzes);
    } catch (err: unknown) {
      console.warn('Fetch quizzes notice:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchQuizzes();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const handleStartQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setUserAnswers({});
    setIsSubmitted(false);
    setSubmissionResult(null);
  };

  const handleSelectOption = (qIdx: number, optIdx: number) => {
    if (isSubmitted) return;
    setUserAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
  };

  const handleSubmitActiveQuiz = async () => {
    if (!activeQuiz) return;
    if (Object.keys(userAnswers).length < activeQuiz.questions.length) {
      if (
        !confirm(
          `You have ${activeQuiz.questions.length - Object.keys(userAnswers).length} unanswered question(s). Submit now?`
        )
      ) {
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await api.submitQuiz(activeQuiz._id, userAnswers);
      setSubmissionResult({
        score: res.score,
        total: res.totalQuestions,
        percentage: res.percentage,
      });
      setIsSubmitted(true);
      showToast(`Quiz completed! You scored ${res.percentage}%.`, 'success');
      fetchQuizzes();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit quiz';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
            <HelpCircle className="w-4 h-4" />
            <span>Interactive Assessment</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Quiz Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Test your knowledge with adaptive AI-generated assessments and instant answer explanations.
          </p>
        </div>

        <button
          onClick={onOpenGenerateQuiz}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 active:scale-95 transition shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>Generate New Quiz</span>
        </button>
      </div>

      {/* Main Container: Either taking quiz or list */}
      {activeQuiz ? (
        <div className="p-5 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6 animate-in fade-in">
          {/* Active Quiz Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-md">
                {activeQuiz.subject}
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                {activeQuiz.title}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              {isSubmitted && submissionResult && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">
                  <Trophy className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-extrabold text-emerald-900 dark:text-emerald-200">
                    {submissionResult.score} / {submissionResult.total} ({submissionResult.percentage}%)
                  </span>
                </div>
              )}
              <button
                onClick={() => setActiveQuiz(null)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Back to Quizzes
              </button>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-6">
            {activeQuiz.questions.map((q, qIdx) => {
              const selectedOpt = userAnswers[qIdx];
              return (
                <div
                  key={qIdx}
                  className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3"
                >
                  <div className="flex items-start gap-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {qIdx + 1}
                    </span>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">
                      {q.question}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = selectedOpt === optIdx;
                      const isCorrect = q.correctAnswerIndex === optIdx;

                      let btnStyle =
                        'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:border-indigo-400';

                      if (isSubmitted) {
                        if (isCorrect) {
                          btnStyle =
                            'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-100 font-semibold';
                        } else if (isSelected && !isCorrect) {
                          btnStyle =
                            'border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-100';
                        } else {
                          btnStyle =
                            'border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 text-slate-400 opacity-60';
                        }
                      } else if (isSelected) {
                        btnStyle =
                          'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-100 font-semibold ring-2 ring-indigo-500/20';
                      }

                      return (
                        <button
                          key={optIdx}
                          disabled={isSubmitted}
                          onClick={() => handleSelectOption(qIdx, optIdx)}
                          className={`flex items-start gap-2.5 p-3 rounded-xl border text-left text-xs transition active:scale-[0.99] ${btnStyle}`}
                        >
                          <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="flex-1 leading-relaxed">{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation after submission */}
                  {isSubmitted && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 border-l-4 border-indigo-600">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 block text-[11px] uppercase tracking-wider mb-0.5">
                        Pedagogical Explanation:
                      </span>
                      <p className="leading-relaxed">{q.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer Submit / Retake Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            {!isSubmitted ? (
              <button
                onClick={handleSubmitActiveQuiz}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition"
              >
                {isSubmitting ? 'Grading Answers...' : 'Submit Answers for Grading'}
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setIsSubmitted(false);
                    setUserAnswers({});
                    setSubmissionResult(null);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retake Quiz</span>
                </button>
                <button
                  onClick={() => setActiveQuiz(null)}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition"
                >
                  Finished Review
                </button>
              </div>
            )}
            <span className="text-xs text-slate-400">
              {Object.keys(userAnswers).length} / {activeQuiz.questions.length} answered
            </span>
          </div>
        </div>
      ) : (
        /* Quizzes Directory List */
        <div className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-44 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
              ))}
            </div>
          ) : quizzes.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 space-y-3">
              <HelpCircle className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                No quizzes yet
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Generate your first quiz from any topic or note using the AI Quiz Generator.
              </p>
              <button
                onClick={onOpenGenerateQuiz}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Quiz</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {quizzes.map((quiz) => {
                const scorePercent =
                  quiz.score !== null && quiz.score !== undefined
                    ? Math.round((quiz.score / quiz.totalQuestions) * 100)
                    : null;
                const isCompleted = quiz.completedAt !== null && quiz.completedAt !== undefined;

                return (
                  <div
                    key={quiz._id}
                    onClick={() => handleStartQuiz(quiz)}
                    className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950 px-2.5 py-0.5 rounded-md">
                          {quiz.subject}
                        </span>
                        {scorePercent !== null ? (
                          <span
                            className={`text-xs font-extrabold px-2 py-0.5 rounded-lg ${
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
                          <span className="text-[10px] font-semibold text-slate-400">
                            Unattempted
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition line-clamp-1">
                        {quiz.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {quiz.totalQuestions} questions with detailed answer explanations
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                      <span>{new Date(quiz.createdAt).toLocaleDateString()}</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        <span>{isCompleted ? 'Review / Retake' : 'Start Quiz'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
