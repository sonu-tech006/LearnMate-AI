import { Router, Response } from 'express';
import { db } from '../db.ts';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.ts';

export const studyRouter = Router();
studyRouter.use(requireAuth);

// GET /api/study-sessions
studyRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const sessions = await db.getStudySessions(userId);
    return res.json({ sessions });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Fetch study sessions error:', msg);
    return res.status(500).json({ error: 'Failed to retrieve study sessions' });
  }
});

// POST /api/study-sessions (Supports creating single task or array of batch tasks from planner)
studyRouter.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { taskTitle, subject, durationMinutes, scheduledAt, tasks } = req.body;

    // Batch insertion from AI Revision Planner
    if (Array.isArray(tasks) && tasks.length > 0) {
      const createdList = [];
      for (const t of tasks) {
        if (t.taskTitle && t.scheduledDate) {
          const item = await db.createStudySession({
            userId,
            subject: t.focusArea || subject || 'General',
            taskTitle: t.taskTitle,
            durationMinutes: t.durationMinutes ? parseInt(t.durationMinutes, 10) : 45,
            completed: false,
            scheduledAt: new Date(t.scheduledDate),
          });
          createdList.push(item);
        }
      }
      return res.status(201).json({ message: 'Study tasks scheduled successfully', sessions: createdList });
    }

    // Single creation
    if (!taskTitle || typeof taskTitle !== 'string' || !taskTitle.trim()) {
      return res.status(400).json({ error: 'Task title is required.' });
    }

    const session = await db.createStudySession({
      userId,
      subject: (subject && typeof subject === 'string' && subject.trim()) || 'General',
      taskTitle: taskTitle.trim(),
      durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : 45,
      completed: false,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
    });

    return res.status(201).json({ message: 'Study task scheduled successfully', session });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Create study session error:', msg);
    return res.status(500).json({ error: 'Failed to create study session' });
  }
});

// PATCH /api/study-sessions/:id (e.g. toggle completed)
studyRouter.patch('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { completed, durationMinutes, taskTitle, scheduledAt } = req.body;

    const updates: Record<string, unknown> = {};
    if (completed !== undefined) updates.completed = Boolean(completed);
    if (durationMinutes !== undefined) updates.durationMinutes = parseInt(durationMinutes, 10);
    if (taskTitle !== undefined) updates.taskTitle = String(taskTitle).trim();
    if (scheduledAt !== undefined) updates.scheduledAt = new Date(scheduledAt);

    const updated = await db.updateStudySession(req.params.id, userId, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Study session not found or permission denied' });
    }

    return res.json({ message: 'Study task updated', session: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Update study session error:', msg);
    return res.status(500).json({ error: 'Failed to update study session' });
  }
});

// DELETE /api/study-sessions/:id
studyRouter.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const deleted = await db.deleteStudySession(req.params.id, userId);

    if (!deleted) {
      return res.status(404).json({ error: 'Study session not found or already deleted' });
    }

    return res.json({ message: 'Study task removed' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Delete study session error:', msg);
    return res.status(500).json({ error: 'Failed to delete study session' });
  }
});

// GET /api/analytics/overview
export const analyticsRouter = Router();
analyticsRouter.use(requireAuth);

analyticsRouter.get('/overview', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const overview = await db.getAnalyticsOverview(userId);
    return res.json({ analytics: overview });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Analytics overview error:', msg);
    return res.status(500).json({ error: 'Failed to calculate learning analytics' });
  }
});
