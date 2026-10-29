import { Router, Response } from 'express';
import { requireAuth, rateLimiter, AuthenticatedRequest } from '../middleware/auth.ts';
import { db } from '../db.ts';
import {
  summarizeNotesWithGemini,
  generateQuizWithGemini,
  askTutorWithGemini,
  planRevisionWithGemini,
  searchAndSynthesizeWithGemini,
} from '../gemini.ts';

export const aiRouter = Router();
aiRouter.use(requireAuth);
aiRouter.use(rateLimiter(60000, 30));

// POST /api/ai/summarize
aiRouter.post('/summarize', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { text, subject } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length < 20) {
      return res.status(400).json({ error: 'Please provide at least 20 characters of study text to summarize.' });
    }

    const summary = await summarizeNotesWithGemini(text.trim(), subject);
    return res.json({ summary });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('AI Summarize Route Error:', msg);
    return res.status(500).json({ error: 'Failed to generate AI summary. Please retry in a moment.' });
  }
});

// POST /api/ai/generate-quiz
aiRouter.post('/generate-quiz', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { content, subject, difficulty, numQuestions } = req.body;

    if (!content || typeof content !== 'string' || content.trim().length < 10) {
      return res.status(400).json({ error: 'Please provide notes content or a topic title to generate questions from.' });
    }

    const quizData = await generateQuizWithGemini(content.trim(), {
      subject,
      difficulty: ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'medium',
      numQuestions: numQuestions ? parseInt(numQuestions, 10) : 5,
    });

    return res.json({ quiz: quizData });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('AI Quiz Route Error:', msg);
    return res.status(500).json({ error: 'Failed to generate AI quiz. Please try again.' });
  }
});

// POST /api/ai/tutor
aiRouter.post('/tutor', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { message, history, subject } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Please enter a question for your tutor.' });
    }

    const answer = await askTutorWithGemini(
      message.trim(),
      Array.isArray(history) ? history : [],
      subject
    );

    return res.json({ reply: answer });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('AI Tutor Route Error:', msg);
    return res.status(500).json({ error: 'AI Tutor encountered a temporary error. Please try asking again.' });
  }
});

// POST /api/ai/plan-revision
aiRouter.post('/plan-revision', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { topic, targetDate, dailyMinutes, subject } = req.body;

    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      return res.status(400).json({ error: 'Topic is required.' });
    }
    if (!targetDate || typeof targetDate !== 'string') {
      return res.status(400).json({ error: 'Target revision date is required.' });
    }

    const plan = await planRevisionWithGemini(
      topic.trim(),
      targetDate,
      dailyMinutes ? parseInt(dailyMinutes, 10) : 45,
      subject
    );

    return res.json({ plan });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('AI Plan Revision Route Error:', msg);
    return res.status(500).json({ error: 'Failed to generate revision plan.' });
  }
});

// POST /api/ai/search (Gemini Knowledge Synthesis across user's notes and syllabus)
aiRouter.post('/search', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { query } = req.body;
    const userId = req.user!.id;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ error: 'Please provide a search query.' });
    }

    // Retrieve user's notes for local context
    const notesResult = await db.getNotes(userId, { limit: 20 });
    const context = notesResult.notes.map((n) => ({
      title: n.title,
      subject: n.subject,
      content: n.content,
    }));

    const result = await searchAndSynthesizeWithGemini(query.trim(), context);
    return res.json({ searchResult: result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('AI Search Route Error:', msg);
    return res.status(500).json({ error: 'AI Search synthesis failed. Please try again.' });
  }
});
