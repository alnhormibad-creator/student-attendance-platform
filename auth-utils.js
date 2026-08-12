const crypto = require('crypto');
const bcrypt = require('bcryptjs');

function generateCode(length = 6) {
  return crypto.randomInt(0, 10 ** length).toString().padStart(length, '0');
}

function createCodeExpiry(minutes = 10) {
  return new Date(Date.now() + minutes * 60000).toISOString();
}

function isCodeExpired(expiresAt) {
  return new Date(expiresAt).getTime() <= Date.now();
}

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function verifyPassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

module.exports = {
  generateCode,
  createCodeExpiry,
  isCodeExpired,
  hashPassword,
  verifyPassword
};
