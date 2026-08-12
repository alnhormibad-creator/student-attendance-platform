import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import { AuthRequest } from '../types';

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = (req.headers as any).authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, config.jwtSecret) as { id: number; username: string; role: string };
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

export function requireRole(role: 'ADMIN' | 'STUDENT') {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ success: false, message: 'Permission denied' });
    }
    next();
  };
}
