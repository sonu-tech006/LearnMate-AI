import { Router, Response } from 'express';
import { db } from '../db.ts';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.ts';

export const notesRouter = Router();
notesRouter.use(requireAuth);

// GET /api/notes (Supports search ?q=, subject filter ?subject=, pagination ?page=&limit=)
notesRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { q, subject, page, limit } = req.query;

    const result = await db.getNotes(userId, {
      search: typeof q === 'string' ? q : undefined,
      subject: typeof subject === 'string' ? subject : undefined,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 50,
    });

    return res.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Fetch notes error:', msg);
    return res.status(500).json({ error: 'Failed to retrieve notes' });
  }
});

// GET /api/notes/:id
notesRouter.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const note = await db.getNoteById(req.params.id, userId);

    if (!note) {
      return res.status(404).json({ error: 'Note not found or permission denied' });
    }

    return res.json({ note });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Fetch note error:', msg);
    return res.status(500).json({ error: 'Failed to retrieve note' });
  }
});

// POST /api/notes
notesRouter.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { title, subject, content, tags, aiSummary } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Note title is required.' });
    }
    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ error: 'Note content cannot be empty.' });
    }

    const note = await db.createNote({
      userId,
      title: title.trim(),
      subject: (subject && typeof subject === 'string' && subject.trim()) || 'General',
      content: content.trim(),
      tags: Array.isArray(tags) ? tags.map((t) => String(t).trim()).filter(Boolean) : [],
      aiSummary: aiSummary && typeof aiSummary === 'object' ? aiSummary : undefined,
    });

    return res.status(201).json({ message: 'Note created successfully', note });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Create note error:', msg);
    return res.status(500).json({ error: 'Failed to create note' });
  }
});

// PUT /api/notes/:id
notesRouter.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { title, subject, content, tags, aiSummary } = req.body;

    const existing = await db.getNoteById(req.params.id, userId);
    if (!existing) {
      return res.status(404).json({ error: 'Note not found or permission denied' });
    }

    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = String(title).trim();
    if (subject !== undefined) updates.subject = String(subject).trim();
    if (content !== undefined) updates.content = String(content).trim();
    if (tags !== undefined) {
      updates.tags = Array.isArray(tags) ? tags.map((t) => String(t).trim()).filter(Boolean) : [];
    }
    if (aiSummary !== undefined) updates.aiSummary = aiSummary;

    const updated = await db.updateNote(req.params.id, userId, updates);
    return res.json({ message: 'Note updated successfully', note: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Update note error:', msg);
    return res.status(500).json({ error: 'Failed to update note' });
  }
});

// DELETE /api/notes/:id
notesRouter.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const success = await db.deleteNote(req.params.id, userId);

    if (!success) {
      return res.status(404).json({ error: 'Note not found or already deleted' });
    }

    return res.json({ message: 'Note deleted successfully' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Delete note error:', msg);
    return res.status(500).json({ error: 'Failed to delete note' });
  }
});
