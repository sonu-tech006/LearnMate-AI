import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './server/config.ts';
import { initDatabase, getDatabaseStatus } from './server/db.ts';
import { authRouter } from './server/routes/auth.ts';
import { notesRouter } from './server/routes/notes.ts';
import { quizzesRouter } from './server/routes/quizzes.ts';
import { aiRouter } from './server/routes/ai.ts';
import { studyRouter, analyticsRouter } from './server/routes/study.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();

  // Basic security and parsing middlewares
  app.use(cors({
    origin: '*',
    credentials: true,
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Central request logger (excluding health checks)
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') && req.path !== '/api/health') {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    }
    next();
  });

  // Health & Status endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'LearnMate AI Backend',
      database: getDatabaseStatus(),
      geminiConfigured: !!config.geminiApiKey,
      timestamp: new Date().toISOString(),
    });
  });

  // Mount API Routers
  app.use('/api/auth', authRouter);
  app.use('/api/notes', notesRouter);
  app.use('/api/quizzes', quizzesRouter);
  app.use('/api/ai', aiRouter);
  app.use('/api/study-sessions', studyRouter);
  app.use('/api/analytics', analyticsRouter);

  // Central API Error Handler
  app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Unhandled server error:', errorMsg);
    res.status(500).json({
      error: 'An unexpected internal server error occurred',
      message: process.env.NODE_ENV !== 'production' ? errorMsg : undefined,
    });
  });

  // Connect to Database
  await initDatabase();

  // Vite middleware in dev or static serve in prod
  if (config.isProd) {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const PORT = config.port;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 LearnMate AI server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup failure:', err);
  process.exit(1);
});
