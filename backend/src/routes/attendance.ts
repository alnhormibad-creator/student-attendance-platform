import { Router, Response } from 'express';
import prisma from '../prisma';
import { authenticateToken, requireRole } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  if (req.user?.role === 'ADMIN') {
    const attendance = await prisma.attendance.findMany({
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      include: { student: { select: { username: true, email: true } } },
    });
    return res.json({ success: true, attendance });
  }

  const attendance = await prisma.attendance.findMany({
    where: { studentId: req.user?.id },
    orderBy: [{ date: 'desc' }],
  });

  return res.json({ success: true, attendance });
});

router.post('/', authenticateToken, requireRole('STUDENT'), async (req: AuthRequest, res: Response) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.attendance.upsert({
    where: {
      studentId_date: {
        studentId: req.user!.id,
        date: today,
      },
    },
    update: { status: 'PRESENT' },
    create: {
      studentId: req.user!.id,
      status: 'PRESENT',
      date: today,
    },
  });

  return res.json({ success: true, message: 'Attendance recorded' });
});

export default router;
