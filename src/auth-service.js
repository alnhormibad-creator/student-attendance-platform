const jwt = require('jsonwebtoken');
const config = require('./config');
const { generateCode, createCodeExpiry, isCodeExpired, hashPassword, verifyPassword } = require('../auth-utils');

function sanitizeInput(value, maxLength = 128) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function createToken(user) {
  return jwt.sign({ id: user.id, username: user.username, role: user.role }, config.jwtSecret, {
    expiresIn: '7d'
  });
}

function authorizeToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Missing authorization token' });
  }

  jwt.verify(token, config.jwtSecret, (err, decoded) => {
    if (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
    req.user = decoded;
    next();
  });
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    next();
  };
}

module.exports = {
  sanitizeInput,
  validateEmail,
  createToken,
  authorizeToken,
  requireRole,
  generateCode,
  createCodeExpiry,
  isCodeExpired,
  hashPassword,
  verifyPassword,
};
