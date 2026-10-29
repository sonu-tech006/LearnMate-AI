import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { useToast } from '../../context/ToastContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { Note, AISummary, QuizQuestion, RevisionPlanTask } from '../../types.ts';
import {
  Sparkles,
  HelpCircle,
  MessageSquare,
  Calendar,
  Send,
  Save,
  CheckCircle2,
  AlertCircle,
  Copy,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Layers,
  Brain,
  Lightbulb,
} from 'lucide-react';

interface LearnWorkspaceProps {
  initialMode?: 'summarize' | 'quiz' | 'tutor' | 'planner';
  onNavigateNotes?: () => void;
  onNavigateQuizzes?: () => void;
}

export const LearnWorkspace: React.FC<LearnWorkspaceProps> = ({
  initialMode = 'summarize',
  onNavigateNotes,
  onNavigateQuizzes,
}) => {
  const { showToast } = useToast();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'summarize' | 'quiz' | 'tutor' | 'planner'>(
    initialMode
  );

  useEffect(() => {
    if (initialMode) setActiveTab(initialMode);
  }, [initialMode]);

  // Load existing notes to offer "Import from Note" in tools
  const [userNotes, setUserNotes] = useState<Note[]>([]);
  useEffect(() => {
    if (isAuthenticated) {
      api.getNotes({ limit: 50 }).then((res) => setUserNotes(res.notes)).catch(() => {});
    }
  }, [isAuthenticated]);

  // -------------------------------------------------------------
  // TAB 1: AI Notes Summarizer State
  // -------------------------------------------------------------
  const [summarizeText, setSummarizeText] = useState('');
  const [summarizeSubject, setSummarizeSubject] = useState('Computer Science');
  const [summaryResult, setSummaryResult] = useState<AISummary | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isSavingSummary, setIsSavingSummary] = useState(false);

  const handleRunSummarizer = async () => {
    if (summarizeText.trim().length < 20) {
      showToast('Please paste at least 20 characters of study notes to summarize.', 'error');
      return;
    }
    setIsSummarizing(true);
    setSummaryResult(null);
    try {
      const res = await api.summarizeText(summarizeText, summarizeSubject);
      setSummaryResult(res.summary);
      showToast('Summary synthesized successfully!', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Summarization failed';
      showToast(msg, 'error');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSaveSummaryAsNote = async () => {
    if (!summaryResult) return;
    setIsSavingSummary(true);
    try {
      await api.createNote({
        title: `${summarizeSubject} Summary: ${summarizeText.slice(0, 35).trim()}...`,
        subject: summarizeSubject,
        content: summarizeText,
        tags: [summarizeSubject, 'AI-Summary'],
        aiSummary: summaryResult,
      });
      showToast('Summary saved to your private Notes!', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save note';
      showToast(msg, 'error');
    } finally {
      setIsSavingSummary(false);
    }
  };

  // -------------------------------------------------------------
  // TAB 2: AI Quiz Generator State
  // -------------------------------------------------------------
  const [quizTopic, setQuizTopic] = useState('');
  const [quizSubject, setQuizSubject] = useState('Computer Science');
  const [quizDifficulty, setQuizDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [quizQuestionCount, setQuizQuestionCount] = useState<number>(5);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);

  // Active quiz taking state
  const [activeQuizTitle, setActiveQuizTitle] = useState('');
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [isSavingQuiz, setIsSavingQuiz] = useState(false);

  const handleGenerateQuiz = async () => {
    if (!quizTopic.trim()) {
      showToast('Please enter a topic or paste notes to generate a quiz from.', 'error');
      return;
    }
    setIsGeneratingQuiz(true);
    setQuizQuestions([]);
    setUserAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);

    try {
      const res = await api.generateQuizAI(quizTopic, {
        subject: quizSubject,
        difficulty: quizDifficulty,
        numQuestions: quizQuestionCount,
      });

      setActiveQuizTitle(res.quiz.title);
      setQuizQuestions(res.quiz.questions);
      showToast(`Generated ${res.quiz.questions.length} quiz questions!`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Quiz generation failed';
      showToast(msg, 'error');
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleSelectQuizAnswer = (qIdx: number, optionIdx: number) => {
    if (quizSubmitted) return;
    setUserAnswers((prev) => ({ ...prev, [qIdx]: optionIdx }));
  };

  const handleSubmitQuiz = async () => {
    if (Object.keys(userAnswers).length < quizQuestions.length) {
      const unanswered = quizQuestions.length - Object.keys(userAnswers).length;
      if (!confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`)) {
        return;
      }
    }

    let correct = 0;
    quizQuestions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctAnswerIndex) correct++;
    });

    setQuizScore(correct);
    setQuizSubmitted(true);
    setIsSavingQuiz(true);

    try {
      // Save full quiz attempt to database
      const saveRes = await api.saveQuiz({
        title: activeQuizTitle || `${quizSubject} Quiz`,
        subject: quizSubject,
        questions: quizQuestions,
      });

      // Submit score to record grade
      await api.submitQuiz(saveRes.quiz._id, userAnswers);
      showToast(`Quiz completed! You scored ${correct} out of ${quizQuestions.length}.`, 'success');
    } catch (err) {
      console.error('Save quiz error:', err);
    } finally {
      setIsSavingQuiz(false);
    }
  };

  // -------------------------------------------------------------
  // TAB 3: Ask AI Tutor State
  // -------------------------------------------------------------
  const [tutorSubject, setTutorSubject] = useState('Computer Science');
  const [tutorInput, setTutorInput] = useState('');
  const [tutorHistory, setTutorHistory] = useState<
    { role: 'user' | 'model'; text: string; timestamp: Date }[]
  >([
    {
      role: 'model',
      text: "Hello! I'm LearnMate Tutor. What concept or problem can I break down for you today? Ask me anything from calculus and biology to data structures and historical events!",
      timestamp: new Date(),
    },
  ]);
  const [isTutorReplying, setIsTutorReplying] = useState(false);

  const starterPrompts = [
    'Explain Backpropagation using a kitchen recipe analogy',
    'Why does the Electron Transport Chain need Oxygen?',
    'What caused the 1848 revolutions in Europe?',
    'Explain Quicksort pivot selection simply',
  ];

  const handleSendTutorMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || tutorInput).trim();
    if (!textToSend || isTutorReplying) return;

    const userEntry = { role: 'user' as const, text: textToSend, timestamp: new Date() };
    const updatedHistory = [...tutorHistory, userEntry];
    setTutorHistory(updatedHistory);
    setTutorInput('');
    setIsTutorReplying(true);

    try {
      const res = await api.askTutor(
        textToSend,
        updatedHistory.map((h) => ({ role: h.role, text: h.text })),
        tutorSubject
      );

      setTutorHistory((prev) => [
        ...prev,
        { role: 'model', text: res.reply, timestamp: new Date() },
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Tutor reply failed';
      showToast(msg, 'error');
      setTutorHistory((prev) => [
        ...prev,
        {
          role: 'model',
          text: 'I ran into an issue connecting to the AI model. Please try asking again!',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTutorReplying(false);
    }
  };

  // -------------------------------------------------------------
  // TAB 4: Smart Revision Planner State
  // -------------------------------------------------------------
  const [planTopic, setPlanTopic] = useState('');
  const [planSubject, setPlanSubject] = useState('Computer Science');
  const [planTargetDate, setPlanTargetDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [planDailyMinutes, setPlanDailyMinutes] = useState(45);
  const [isPlanning, setIsPlanning] = useState(false);
  const [revisionPlan, setRevisionPlan] = useState<{
    overview: string;
    schedule: RevisionPlanTask[];
  } | null>(null);
  const [isSavingPlan, setIsSavingPlan] = useState(false);

  const handleGeneratePlan = async () => {
    if (!planTopic.trim()) {
      showToast('Please specify a revision topic or exam subject.', 'error');
      return;
    }
    setIsPlanning(true);
    setRevisionPlan(null);
    try {
      const res = await api.planRevision(
        planTopic,
        planTargetDate,
        planDailyMinutes,
        planSubject
      );
      setRevisionPlan(res.plan);
      showToast('Revision roadmap generated!', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Planning failed';
      showToast(msg, 'error');
    } finally {
      setIsPlanning(false);
    }
  };

  const handleSavePlanToStudySessions = async () => {
    if (!revisionPlan) return;
    setIsSavingPlan(true);
    try {
      await api.scheduleBatchTasks(revisionPlan.schedule, planSubject);
      showToast(
        `Added ${revisionPlan.schedule.length} revision tasks to your study schedule!`,
        'success'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to schedule tasks';
      showToast(msg, 'error');
    } finally {
      setIsSavingPlan(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in">
      {/* Workspace Header */}
      <div>
        <div className="flex items-center gap-2 mb-1 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          <span>AI Learning Suite</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          AI Learning Workspace
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Accelerate your retention with note summaries, interactive quizzes, conversational tutoring, and spaced revision plans.
        </p>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar gap-2">
        <button
          onClick={() => setActiveTab('summarize')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
            activeTab === 'summarize'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Notes Summarizer</span>
        </button>

        <button
          onClick={() => setActiveTab('quiz')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
            activeTab === 'quiz'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>AI Quiz Generator</span>
        </button>

        <button
          onClick={() => setActiveTab('tutor')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
            activeTab === 'tutor'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Ask AI Tutor</span>
        </button>

        <button
          onClick={() => setActiveTab('planner')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
            activeTab === 'planner'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Revision Planner</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. NOTES SUMMARIZER */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'summarize' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>Input Study Content</span>
              </h2>

              {/* Import from Note Picker */}
              {userNotes.length > 0 && (
                <select
                  onChange={(e) => {
                    const selected = userNotes.find((n) => n._id === e.target.value);
                    if (selected) {
                      setSummarizeText(selected.content);
                      setSummarizeSubject(selected.subject);
                    }
                  }}
                  defaultValue=""
                  className="text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 text-slate-600 dark:text-slate-300 focus:outline-hidden"
                >
                  <option value="" disabled>Import from My Notes...</option>
                  {userNotes.map((n) => (
                    <option key={n._id} value={n._id}>
                      {n.title}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Subject
              </label>
              <input
                type="text"
                value={summarizeSubject}
                onChange={(e) => setSummarizeSubject(e.target.value)}
                placeholder="e.g. Computer Science, Molecular Biology, Modern History"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Paste Lecture Notes, Article or Book Excerpt
              </label>
              <textarea
                rows={11}
                value={summarizeText}
                onChange={(e) => setSummarizeText(e.target.value)}
                placeholder="Paste or write the concepts you want to summarize here (minimum 20 characters)..."
                className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3.5 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-600 resize-none font-mono leading-relaxed"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>{summarizeText.length} characters</span>
                <button
                  type="button"
                  onClick={() =>
                    setSummarizeText(`Neural networks consist of an input layer, multiple hidden layers, and an output layer. In forward propagation, weighted sums of inputs pass through activation functions such as ReLU to introduce non-linearity. During training, error gradients are calculated using backpropagation via the chain rule of calculus and optimized with algorithms like Adam.`)
                  }
                  className="text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Load Sample Excerpt
                </button>
              </div>
            </div>

            <button
              onClick={handleRunSummarizer}
              disabled={isSummarizing || summarizeText.trim().length < 20}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 py-3 text-xs font-bold text-white shadow-md shadow-indigo-600/20 active:scale-[0.99] transition disabled:opacity-50"
            >
              {isSummarizing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Synthesizing Key Concepts...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Summary & Definitions</span>
                </>
              )}
            </button>
          </div>

          {/* Results Panel */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Brain className="w-4 h-4 text-violet-600" />
                  <span>Synthesized Knowledge</span>
                </h3>
                {summaryResult && (
                  <button
                    onClick={handleSaveSummaryAsNote}
                    disabled={isSavingSummary}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSavingSummary ? 'Saving...' : 'Save to Notes'}</span>
                  </button>
                )}
              </div>

              {!summaryResult ? (
                <div className="text-center py-16 text-slate-400 space-y-2">
                  <Sparkles className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
                  <p className="text-sm font-semibold">Ready to summarize</p>
                  <p className="text-xs max-w-xs mx-auto">
                    Paste your notes on the left and click Generate to extract key concepts, definitions, and high-yield revision points.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                  {/* Executive Summary */}
                  <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 block mb-1">
                      Executive Summary
                    </span>
                    <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                      {summaryResult.summary}
                    </p>
                  </div>

                  {/* Key Concepts */}
                  {summaryResult.keyConcepts?.length > 0 && (
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block mb-2">
                        Key Concepts
                      </span>
                      <ul className="space-y-1.5">
                        {summaryResult.keyConcepts.map((concept, idx) => (
                          <li
                            key={idx}
                            className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0 mt-1.5" />
                            <span>{concept}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Definitions */}
                  {summaryResult.definitions && summaryResult.definitions.length > 0 && (
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block mb-2">
                        Important Definitions
                      </span>
                      <div className="grid grid-cols-1 gap-2">
                        {summaryResult.definitions.map((def, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/80"
                          >
                            <span className="text-xs font-bold text-violet-600 dark:text-violet-400">
                              {def.term}:
                            </span>{' '}
                            <span className="text-xs text-slate-600 dark:text-slate-300">
                              {def.definition}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Revision Points */}
                  {summaryResult.revisionPoints?.length > 0 && (
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block mb-2">
                        High-Yield Revision Points
                      </span>
                      <div className="space-y-1.5">
                        {summaryResult.revisionPoints.map((pt, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{pt}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {summaryResult && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-400">
                <span>Stored permanently when saved</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${summaryResult.summary}\n\nKey Concepts:\n${summaryResult.keyConcepts.join(
                        '\n'
                      )}`
                    );
                    showToast('Copied summary to clipboard!', 'info');
                  }}
                  className="flex items-center gap-1 hover:text-indigo-600 transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Text</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. AI QUIZ GENERATOR */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'quiz' && (
        <div className="space-y-6">
          {/* Quiz Creation Settings Card */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-indigo-600" />
              <span>Configure AI Quiz</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Subject
                </label>
                <input
                  type="text"
                  value={quizSubject}
                  onChange={(e) => setQuizSubject(e.target.value)}
                  placeholder="e.g. Biology, Computer Science, History"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Difficulty Level
                </label>
                <select
                  value={quizDifficulty}
                  onChange={(e) => setQuizDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-600"
                >
                  <option value="easy">Easy (Fundamentals & Vocab)</option>
                  <option value="medium">Medium (Application & Analysis)</option>
                  <option value="hard">Hard (Multi-step Reasoning)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Question Count
                </label>
                <select
                  value={quizQuestionCount}
                  onChange={(e) => setQuizQuestionCount(parseInt(e.target.value, 10))}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-600"
                >
                  <option value={3}>3 Questions (Quick Sprint)</option>
                  <option value={5}>5 Questions (Recommended)</option>
                  <option value={10}>10 Questions (Comprehensive)</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Topic or Notes to Test
                </label>
                {userNotes.length > 0 && (
                  <select
                    onChange={(e) => {
                      const selected = userNotes.find((n) => n._id === e.target.value);
                      if (selected) {
                        setQuizTopic(selected.content);
                        setQuizSubject(selected.subject);
                      }
                    }}
                    defaultValue=""
                    className="text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 text-slate-600 dark:text-slate-300"
                  >
                    <option value="" disabled>Import from note...</option>
                    {userNotes.map((n) => (
                      <option key={n._id} value={n._id}>
                        {n.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <textarea
                rows={3}
                value={quizTopic}
                onChange={(e) => setQuizTopic(e.target.value)}
                placeholder="e.g. Glycolysis and Krebs Cycle, or paste notes regarding Deep Learning and Gradient Descent..."
                className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-600"
              />
            </div>

            <button
              onClick={handleGenerateQuiz}
              disabled={isGeneratingQuiz || !quizTopic.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 py-3 text-xs font-bold text-white shadow-md shadow-indigo-600/20 active:scale-[0.99] transition disabled:opacity-50"
            >
              {isGeneratingQuiz ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Drafting Adaptive Questions & Explanations...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Interactive Quiz</span>
                </>
              )}
            </button>
          </div>

          {/* Interactive Quiz Taker / Results */}
          {quizQuestions.length > 0 && (
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    {quizSubject} • {quizDifficulty.toUpperCase()}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {activeQuizTitle}
                  </h3>
                </div>

                {quizSubmitted && quizScore !== null && (
                  <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/60 px-4 py-2 rounded-2xl border border-indigo-200 dark:border-indigo-900">
                    <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                      Final Score:
                    </span>
                    <span className="text-lg font-extrabold text-indigo-900 dark:text-indigo-200">
                      {quizScore} / {quizQuestions.length} ({Math.round((quizScore / quizQuestions.length) * 100)}%)
                    </span>
                  </div>
                )}
              </div>

              {/* Questions List */}
              <div className="space-y-6">
                {quizQuestions.map((q, qIdx) => {
                  const selectedOpt = userAnswers[qIdx];
                  const hasAnswered = selectedOpt !== undefined;

                  return (
                    <div
                      key={qIdx}
                      className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3"
                    >
                      <div className="flex items-start gap-2">
                        <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {qIdx + 1}
                        </span>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">
                          {q.question}
                        </p>
                      </div>

                      {/* Options */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {q.options.map((opt, optIdx) => {
                          const isSelected = selectedOpt === optIdx;
                          const isCorrect = q.correctAnswerIndex === optIdx;

                          let btnClasses =
                            'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:border-indigo-400';

                          if (quizSubmitted) {
                            if (isCorrect) {
                              btnClasses =
                                'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-100 font-semibold';
                            } else if (isSelected && !isCorrect) {
                              btnClasses =
                                'border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-100';
                            } else {
                              btnClasses =
                                'border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 text-slate-400 opacity-60';
                            }
                          } else if (isSelected) {
                            btnClasses =
                              'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-100 font-semibold ring-2 ring-indigo-500/20';
                          }

                          return (
                            <button
                              key={optIdx}
                              disabled={quizSubmitted}
                              onClick={() => handleSelectQuizAnswer(qIdx, optIdx)}
                              className={`flex items-start gap-2.5 p-3 rounded-xl border text-left text-xs transition active:scale-[0.99] ${btnClasses}`}
                            >
                              <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span className="flex-1 leading-relaxed">{opt}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Pedagogical Explanation (visible after submit) */}
                      {quizSubmitted && (
                        <div className="mt-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 border-l-4 border-indigo-600 space-y-1">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400 block text-[11px] uppercase tracking-wider">
                            Pedagogical Explanation:
                          </span>
                          <p className="leading-relaxed">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Submit or Retake Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                {!quizSubmitted ? (
                  <button
                    onClick={handleSubmitQuiz}
                    disabled={isSavingQuiz}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition"
                  >
                    {isSavingQuiz ? 'Grading & Saving...' : 'Submit Answers for Grading'}
                  </button>
                ) : (
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      onClick={() => {
                        setQuizSubmitted(false);
                        setUserAnswers({});
                        setQuizScore(null);
                      }}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Retake Quiz</span>
                    </button>
                    {onNavigateQuizzes && (
                      <button
                        onClick={onNavigateQuizzes}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition"
                      >
                        <span>View in Quiz Center</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
                <span className="text-xs text-slate-400">
                  {Object.keys(userAnswers).length} / {quizQuestions.length} answered
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. ASK AI TUTOR */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'tutor' && (
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col h-[650px]">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  LearnMate Personal Tutor
                </h3>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Ready to explain concepts step-by-step
                </span>
              </div>
            </div>

            {/* Subject Selector */}
            <select
              value={tutorSubject}
              onChange={(e) => setTutorSubject(e.target.value)}
              className="text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-hidden"
            >
              <option value="Computer Science">Computer Science</option>
              <option value="Biology">Biology</option>
              <option value="History">History</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Physics">Physics</option>
              <option value="Literature">Literature</option>
              <option value="General Studies">General Studies</option>
            </select>
          </div>

          {/* Conversation History */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
            {tutorHistory.map((msg, i) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={i}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-indigo-600 text-white shadow-xs rounded-br-none'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-none border border-slate-200/60 dark:border-slate-700/60'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                    <span
                      className={`block text-[9px] mt-2 ${
                        isUser ? 'text-indigo-200' : 'text-slate-400'
                      }`}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              );
            })}

            {isTutorReplying && (
              <div className="flex justify-start">
                <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-3.5 rounded-bl-none border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
                  <span
                    className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  />
                  <span
                    className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"
                    style={{ animationDelay: '0.4s' }}
                  />
                  <span className="text-xs text-slate-400 font-medium ml-1">
                    Formulating explanation...
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Starter Prompt Chips */}
          <div className="py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            {starterPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSendTutorMessage(p)}
                className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600 transition shrink-0"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Message Input Bar */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendTutorMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={tutorInput}
                onChange={(e) => setTutorInput(e.target.value)}
                placeholder="Ask your tutor any question..."
                className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-600"
              />
              <button
                type="submit"
                disabled={isTutorReplying || !tutorInput.trim()}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 active:scale-95 transition disabled:opacity-50 shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ask</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. SMART REVISION PLANNER */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'planner' && (
        <div className="space-y-6">
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>Generate Spaced Repetition Study Schedule</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Subject / Domain
                </label>
                <input
                  type="text"
                  value={planSubject}
                  onChange={(e) => setPlanSubject(e.target.value)}
                  placeholder="e.g. Computer Science"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Target Exam or Completion Date
                </label>
                <input
                  type="date"
                  value={planTargetDate}
                  onChange={(e) => setPlanTargetDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Daily Study Budget
                </label>
                <select
                  value={planDailyMinutes}
                  onChange={(e) => setPlanDailyMinutes(parseInt(e.target.value, 10))}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-600"
                >
                  <option value={30}>30 Minutes / Day</option>
                  <option value={45}>45 Minutes / Day (Recommended)</option>
                  <option value={60}>60 Minutes / Day</option>
                  <option value={90}>90 Minutes / Day (Intensive)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Topic & Specific Concepts to Cover
              </label>
              <input
                type="text"
                value={planTopic}
                onChange={(e) => setPlanTopic(e.target.value)}
                placeholder="e.g. Data Structures & Algorithms: Binary Trees, Graph Traversals, and Dynamic Programming"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-600"
              />
            </div>

            <button
              onClick={handleGeneratePlan}
              disabled={isPlanning || !planTopic.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 py-3 text-xs font-bold text-white shadow-md shadow-indigo-600/20 active:scale-[0.99] transition disabled:opacity-50"
            >
              {isPlanning ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Computing Optimal Spaced Interval Schedule...</span>
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4" />
                  <span>Generate Revision Roadmap</span>
                </>
              )}
            </button>
          </div>

          {/* Planned Schedule Result */}
          {revisionPlan && (
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Spaced Repetition Schedule
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {planTopic}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {revisionPlan.overview}
                  </p>
                </div>

                <button
                  onClick={handleSavePlanToStudySessions}
                  disabled={isSavingPlan}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition self-start sm:self-auto shrink-0"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingPlan ? 'Saving Schedule...' : 'Add All to My Schedule'}</span>
                </button>
              </div>

              {/* Timeline tasks */}
              <div className="space-y-3">
                {revisionPlan.schedule.map((task) => (
                  <div
                    key={task.dayNumber}
                    className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-start gap-4"
                  >
                    <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold shrink-0">
                      <span className="text-[10px] uppercase font-semibold">Day</span>
                      <span className="text-sm">{task.dayNumber}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                          {task.taskTitle}
                        </h4>
                        <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap">
                          {task.scheduledDate} • {task.durationMinutes}m
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                        {task.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
