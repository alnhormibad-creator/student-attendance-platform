import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import authRouter from './routes/auth';
import attendanceRouter from './routes/attendance';
import settingsRouter from './routes/settings';
import config from './config';

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(morgan('combined'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

import meRouter from './routes/me';

app.use('/api/auth', authRouter);
app.use('/api/auth/me', meRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/settings', settingsRouter);

app.get('/api/health', (_: express.Request, res: express.Response) => res.json({ success: true, status: 'ok' }));

app.use((_: express.Request, res: express.Response) => {
  res.status(404).json({ success: false, message: 'Not found' });
});

app.use((err: Error, _: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(500).json({ success: false, message: 'Server error' });
});

export default app;
