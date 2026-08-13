import { Router, Response } from 'express';
import prisma from '../prisma';
import { authenticateToken, requireRole } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

router.get('/maintenance', authenticateToken, requireRole('ADMIN'), async (_: AuthRequest, res: Response) => {
  const setting = await prisma.setting.findUnique({ where: { name: 'maintenance_mode' } });
  return res.json({ success: true, enabled: setting?.value === 'true' });
});

router.post('/maintenance', authenticateToken, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  const body = req.body;
  const enabled = body.enabled === true || body.enabled === 'true';
  await prisma.setting.upsert({
    where: { name: 'maintenance_mode' },
    update: { value: enabled ? 'true' : 'false' },
    create: { name: 'maintenance_mode', value: enabled ? 'true' : 'false' },
  });
  return res.json({ success: true, enabled });
});

export default router;
