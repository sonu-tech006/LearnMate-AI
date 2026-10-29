import { Router, Response } from 'express';
import { db } from '../db.ts';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.ts';

export const quizzesRouter = Router();
quizzesRouter.use(requireAuth);

// GET /api/quizzes
quizzesRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const quizzes = await db.getQuizzes(userId);
    return res.json({ quizzes });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Fetch quizzes error:', msg);
    return res.status(500).json({ error: 'Failed to retrieve quizzes' });
  }
});

// GET /api/quizzes/:id
quizzesRouter.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const quiz = await db.getQuizById(req.params.id, userId);

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    return res.json({ quiz });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Fetch quiz error:', msg);
    return res.status(500).json({ error: 'Failed to retrieve quiz' });
  }
});

// POST /api/quizzes (Save new quiz)
quizzesRouter.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { title, subject, questions } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Quiz title is required' });
    }
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'Quiz must contain at least 1 question' });
    }

    // Validate questions format
    for (const q of questions) {
      if (!q.question || !Array.isArray(q.options) || q.options.length < 2) {
        return res.status(400).json({ error: 'Invalid question format: each requires question and options.' });
      }
    }

    const quiz = await db.createQuiz({
      userId,
      title: title.trim(),
      subject: (subject && typeof subject === 'string' && subject.trim()) || 'General',
      questions,
      totalQuestions: questions.length,
    });

    return res.status(201).json({ message: 'Quiz created successfully', quiz });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Create quiz error:', msg);
    return res.status(500).json({ error: 'Failed to create quiz' });
  }
});

// POST /api/quizzes/:id/submit
quizzesRouter.post('/:id/submit', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { answers } = req.body; // e.g. Record<number, number> (questionIndex -> selectedOptionIndex)

    const quiz = await db.getQuizById(req.params.id, userId);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ error: 'Answers must be provided as an object mapping index to option.' });
    }

    let correctCount = 0;
    const reviewDetails = quiz.questions.map((q, idx) => {
      const selectedIndex = answers[idx] !== undefined ? Number(answers[idx]) : -1;
      const isCorrect = selectedIndex === q.correctAnswerIndex;
      if (isCorrect) correctCount++;

      return {
        questionIndex: idx,
        question: q.question,
        options: q.options,
        userSelected: selectedIndex,
        correctAnswerIndex: q.correctAnswerIndex,
        isCorrect,
        explanation: q.explanation,
      };
    });

    const updatedQuiz = await db.submitQuiz(req.params.id, userId, correctCount);

    return res.json({
      message: 'Quiz submitted successfully',
      score: correctCount,
      totalQuestions: quiz.totalQuestions,
      percentage: Math.round((correctCount / quiz.totalQuestions) * 100),
      reviewDetails,
      quiz: updatedQuiz,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Submit quiz error:', msg);
    return res.status(500).json({ error: 'Failed to submit quiz' });
  }
});
