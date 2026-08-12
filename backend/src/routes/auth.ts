import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';
import config from '../config';
import { z } from 'zod';

const router = Router();

const registerSchema = z.object({
  username: z.string().min(3).max(32),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  username: z.string().min(3).max(32),
  password: z.string().min(8).max(128),
});

router.post('/register', async (req, res) => {
  try {
    const input = registerSchema.parse(req.body);
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: input.email }, { username: input.username }] },
    });

    if (existing) {
      return res.status(409).json({ success: false, message: 'User already exists' });
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    await prisma.user.create({
      data: {
        username: input.username,
        email: input.email,
        password: passwordHash,
        role: 'STUDENT',
      },
    });

    return res.status(201).json({ success: true, message: 'Registration successful' });
  } catch (error) {
    return res.status(400).json({ success: false, message: 'Invalid input' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const input = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { username: input.username },
    });

    if (!user || !(await bcrypt.compare(input.password, user.password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, config.jwtSecret, {
      expiresIn: '7d',
    });

    return res.json({ success: true, token, role: user.role, username: user.username });
  } catch (error) {
    return res.status(400).json({ success: false, message: 'Invalid input' });
  }
});

export default router;
