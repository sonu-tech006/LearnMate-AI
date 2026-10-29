import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.ts';
import { db } from '../db.ts';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { id: string; email: string };
    if (!decoded || !decoded.id) {
      return res.status(401).json({ error: 'Invalid or expired session token.' });
    }

    const user = await db.findUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User account not found.' });
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
}

// Simple in-memory rate limiting map for AI endpoints to prevent abusive bursts
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimiter(windowMs: number = 60000, maxRequests: number = 30) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const identifier = req.user?.id || req.ip || 'anonymous';
    const now = Date.now();
    const userStats = requestCounts.get(identifier);

    if (!userStats || now > userStats.resetTime) {
      requestCounts.set(identifier, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (userStats.count >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests. Please pause a moment before generating another AI task.',
      });
    }

    userStats.count++;
    next();
  };
}
