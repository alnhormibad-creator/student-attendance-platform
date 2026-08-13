import { Router, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  return res.json({ success: true, user: req.user });
});

export default router;
