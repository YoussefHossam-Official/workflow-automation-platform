import { Request, Response, NextFunction } from 'express';
import { verifyJwt } from '../utils/jwt.js';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing Bearer token' });
  }
  const token = header.slice(7);
  try {
    const payload = verifyJwt(token);
    (req as any).user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

export function requireRole(role: 'ADMIN'|'USER') {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || user.role !== role) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}
