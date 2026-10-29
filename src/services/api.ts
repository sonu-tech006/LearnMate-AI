import { Note, Quiz, StudySession, AnalyticsOverview, AISummary, RevisionPlanTask, AISearchResult } from '../types.ts';

const TOKEN_KEY = 'learnmate_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // System Health
  getHealth: () => request<{ status: string; database: { status: string; message: string; isAtlas: boolean }; geminiConfigured: boolean }>('/api/health'),

  // Auth
  signup: (body: { name: string; email: string; password: string }) =>
    request<{ user: { id: string; name: string; email: string; createdAt: string }; token: string }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  login: (body: { email: string; password: string }) =>
    request<{ user: { id: string; name: string; email: string; createdAt: string }; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getMe: () =>
    request<{ user: { id: string; name: string; email: string; createdAt: string } }>('/api/auth/me'),

  // Notes
  getNotes: (params?: { q?: string; subject?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.q) query.set('q', params.q);
    if (params?.subject && params.subject !== 'All') query.set('subject', params.subject);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return request<{ notes: Note[]; total: number; page: number; limit: number }>(`/api/notes${qs ? `?${qs}` : ''}`);
  },

  getNote: (id: string) => request<{ note: Note }>(`/api/notes/${id}`),

  createNote: (data: { title: string; subject: string; content: string; tags?: string[]; aiSummary?: AISummary }) =>
    request<{ message: string; note: Note }>('/api/notes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateNote: (id: string, data: Partial<Pick<Note, 'title' | 'subject' | 'content' | 'tags' | 'aiSummary'>>) =>
    request<{ message: string; note: Note }>(`/api/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteNote: (id: string) =>
    request<{ message: string }>(`/api/notes/${id}`, {
      method: 'DELETE',
    }),

  // AI Features
  summarizeText: (text: string, subject?: string) =>
    request<{ summary: AISummary }>('/api/ai/summarize', {
      method: 'POST',
      body: JSON.stringify({ text, subject }),
    }),

  generateQuizAI: (content: string, options?: { subject?: string; difficulty?: string; numQuestions?: number }) =>
    request<{ quiz: { title: string; subject: string; questions: Quiz['questions'] } }>('/api/ai/generate-quiz', {
      method: 'POST',
      body: JSON.stringify({ content, ...options }),
    }),

  askTutor: (message: string, history?: { role: 'user' | 'model'; text: string }[], subject?: string) =>
    request<{ reply: string }>('/api/ai/tutor', {
      method: 'POST',
      body: JSON.stringify({ message, history, subject }),
    }),

  planRevision: (topic: string, targetDate: string, dailyMinutes?: number, subject?: string) =>
    request<{ plan: { overview: string; schedule: RevisionPlanTask[] } }>('/api/ai/plan-revision', {
      method: 'POST',
      body: JSON.stringify({ topic, targetDate, dailyMinutes, subject }),
    }),

  searchAI: (query: string) =>
    request<{ searchResult: AISearchResult }>('/api/ai/search', {
      method: 'POST',
      body: JSON.stringify({ query }),
    }),

  // Quizzes
  getQuizzes: () => request<{ quizzes: Quiz[] }>('/api/quizzes'),

  getQuiz: (id: string) => request<{ quiz: Quiz }>(`/api/quizzes/${id}`),

  saveQuiz: (data: { title: string; subject: string; questions: Quiz['questions'] }) =>
    request<{ message: string; quiz: Quiz }>('/api/quizzes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  submitQuiz: (id: string, answers: Record<number, number>) =>
    request<{
      message: string;
      score: number;
      totalQuestions: number;
      percentage: number;
      reviewDetails: {
        questionIndex: number;
        question: string;
        options: string[];
        userSelected: number;
        correctAnswerIndex: number;
        isCorrect: boolean;
        explanation: string;
      }[];
      quiz: Quiz;
    }>(`/api/quizzes/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    }),

  // Study Sessions & Analytics
  getStudySessions: () => request<{ sessions: StudySession[] }>('/api/study-sessions'),

  createStudySession: (data: { taskTitle: string; subject: string; durationMinutes: number; scheduledAt?: string }) =>
    request<{ message: string; session: StudySession }>('/api/study-sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  scheduleBatchTasks: (tasks: RevisionPlanTask[], subject?: string) =>
    request<{ message: string; sessions: StudySession[] }>('/api/study-sessions', {
      method: 'POST',
      body: JSON.stringify({ tasks, subject }),
    }),

  updateStudySession: (id: string, updates: Partial<Pick<StudySession, 'completed' | 'durationMinutes' | 'taskTitle' | 'scheduledAt'>>) =>
    request<{ message: string; session: StudySession }>(`/api/study-sessions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  deleteStudySession: (id: string) =>
    request<{ message: string }>(`/api/study-sessions/${id}`, {
      method: 'DELETE',
    }),

  getAnalyticsOverview: () => request<{ analytics: AnalyticsOverview }>('/api/analytics/overview'),
};
