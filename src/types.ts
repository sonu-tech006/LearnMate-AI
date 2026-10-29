export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface AISummary {
  summary: string;
  keyConcepts: string[];
  definitions?: { term: string; definition: string }[];
  revisionPoints: string[];
}

export interface Note {
  _id: string;
  userId: string;
  title: string;
  subject: string;
  content: string;
  tags: string[];
  aiSummary?: AISummary;
  createdAt: string;
  updatedAt: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface Quiz {
  _id: string;
  userId: string;
  title: string;
  subject: string;
  questions: QuizQuestion[];
  score?: number | null;
  totalQuestions: number;
  completedAt?: string | null;
  createdAt: string;
}

export interface StudySession {
  _id: string;
  userId: string;
  subject: string;
  durationMinutes: number;
  taskTitle: string;
  completed: boolean;
  scheduledAt: string;
  createdAt: string;
}

export interface WeeklyActivity {
  day: string;
  date: string;
  minutes: number;
  tasksCompleted: number;
}

export interface SubjectPerformance {
  subject: string;
  studyMinutes: number;
  averageQuizScore: number;
  notesCount: number;
  quizzesTaken: number;
}

export interface AnalyticsOverview {
  streakDays: number;
  totalStudyMinutes: number;
  todayMinutes: number;
  dailyTargetMinutes: number;
  todayGoalCompletion: number;
  totalNotes: number;
  totalQuizzesTaken: number;
  averageQuizScore: number;
  weeklyActivity: WeeklyActivity[];
  subjectPerformance: SubjectPerformance[];
  upcomingTasksCount: number;
}

export interface RevisionPlanTask {
  dayNumber: number;
  scheduledDate: string;
  taskTitle: string;
  durationMinutes: number;
  focusArea: string;
  description: string;
}

export interface AISearchResult {
  directAnswer: string;
  matchedConcepts: string[];
  suggestedAction: string;
}
