import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

router.get('/', (authenticateToken as any), async (req: AuthRequest, res: any) => {
  return res.json({ success: true, user: req.user });
});

export default router;
