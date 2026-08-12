import { Router } from 'express';
import prisma from '../prisma';
import { authenticateToken, requireRole } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

router.get('/maintenance', (authenticateToken as any), (requireRole('ADMIN') as any), async (_, res: any) => {
  const setting = await prisma.setting.findUnique({ where: { name: 'maintenance_mode' } });
  return res.json({ success: true, enabled: setting?.value === 'true' });
});

router.post('/maintenance', (authenticateToken as any), (requireRole('ADMIN') as any), async (req: AuthRequest, res: any) => {
  const enabled = req.body.enabled === true || req.body.enabled === 'true';
  await prisma.setting.upsert({
    where: { name: 'maintenance_mode' },
    update: { value: enabled ? 'true' : 'false' },
    create: { name: 'maintenance_mode', value: enabled ? 'true' : 'false' },
  });
  return res.json({ success: true, enabled });
});

export default router;
