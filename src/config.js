const path = require('path');

const rootDir = path.resolve(__dirname, '..');

module.exports = {
  port: Number(process.env.PORT || 3000),
  host: process.env.HOST || '0.0.0.0',
  dbPath: process.env.DB_PATH || path.join(rootDir, 'attendance.db'),
  jwtSecret: process.env.JWT_SECRET || 'replace-with-a-secure-secret',
  defaultAdminPassword: process.env.ADMIN_PASSWORD || 'admin123',
  emailUser: process.env.EMAIL_USER,
  emailPass: process.env.EMAIL_PASS,
  emailEnabled: Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS),
  frontendOrigin: process.env.FRONTEND_ORIGIN || '*',
  tokenExpiresIn: '7d',
  maxPayloadSize: '1mb',
  rateLimitWindowMs: 15 * 60 * 1000,
  rateLimitMax: 100,
};
