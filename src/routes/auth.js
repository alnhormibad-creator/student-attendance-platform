const express = require('express');
const nodemailer = require('nodemailer');
const { getAsync, runAsync } = require('../database');
const {
  sanitizeInput,
  validateEmail,
  createToken,
  authorizeToken,
  generateCode,
  createCodeExpiry,
  isCodeExpired,
  hashPassword,
  verifyPassword
} = require('../auth-service');
const config = require('../config');

const router = express.Router();
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: config.emailUser,
    pass: config.emailPass
  }
});

async function sendVerificationEmail(email, code) {
  if (!config.emailEnabled) {
    return { skipped: true, code };
  }
  return transporter.sendMail({
    from: config.emailUser,
    to: email,
    subject: 'Verify your account',
    text: `Your verification code is ${code}`
  });
}

async function sendResetEmail(email, code) {
  if (!config.emailEnabled) {
    return { skipped: true, code };
  }
  return transporter.sendMail({
    from: config.emailUser,
    to: email,
    subject: 'Password reset code',
    text: `Your password reset code is ${code}`
  });
}

router.post('/register', async (req, res) => {
  const username = sanitizeInput(req.body.username || '', 64);
  const email = sanitizeInput(req.body.email || '', 128);
  const password = sanitizeInput(req.body.password || '', 128);

  if (!username || !email || !password) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
  if (!validateEmail(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email address' });
  }
  if (username.toLowerCase() === 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access cannot be registered.' });
  }

  const existing = await getAsync('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
  if (existing) {
    return res.status(409).json({ success: false, message: 'A user with that username or email already exists.' });
  }

  const hashedPassword = await hashPassword(password);
  const code = generateCode();
  const expiresAt = createCodeExpiry(15);

  await runAsync(
    'INSERT INTO users (username, email, password, role, is_verified, verification_code, verification_expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [username, email, hashedPassword, 'student', 0, code, expiresAt]
  );

  try {
    const mailResult = await sendVerificationEmail(email, code);
    if (mailResult && mailResult.skipped) {
      return res.status(201).json({ success: true, message: 'Account created. Verification code ready below.', code });
    }
    return res.status(201).json({ success: true, message: 'Account created. Please verify your email.', code });
  } catch (mailErr) {
    return res.status(201).json({ success: true, message: 'Account created. Verification email could not be sent. Use the code below.', code });
  }
});

router.post('/login', async (req, res) => {
  const username = sanitizeInput(req.body.username || '', 64);
  const password = sanitizeInput(req.body.password || '', 128);

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Missing credentials' });
  }

  const user = await getAsync('SELECT id, username, role, password, is_verified FROM users WHERE username = ? OR email = ?', [username, username]);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid username or password' });
  }

  let isValid = false;
  if (typeof user.password === 'string' && user.password.startsWith('$2')) {
    isValid = await verifyPassword(password, user.password);
  } else {
    isValid = password === user.password;
  }

  if (!isValid) {
    return res.status(401).json({ success: false, message: 'Invalid username or password' });
  }

  if (typeof user.password === 'string' && !user.password.startsWith('$2')) {
    const hashed = await hashPassword(password);
    await runAsync('UPDATE users SET password = ? WHERE id = ?', [hashed, user.id]);
  }

  if (!user.is_verified) {
    return res.status(403).json({ success: false, message: 'Please verify your email before logging in' });
  }

  const token = createToken(user);
  return res.status(200).json({ success: true, token, role: user.role, username: user.username });
});

router.post('/verify', async (req, res) => {
  const email = sanitizeInput(req.body.email || '', 128);
  const code = sanitizeInput(req.body.code || '', 16);

  if (!email || !code) {
    return res.status(400).json({ success: false, message: 'Missing verification data' });
  }

  const user = await getAsync('SELECT id, is_verified, verification_code, verification_expires_at FROM users WHERE email = ?', [email]);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  if (user.is_verified) {
    return res.status(200).json({ success: true, message: 'Account already verified' });
  }
  if (isCodeExpired(user.verification_expires_at) || user.verification_code !== code) {
    return res.status(400).json({ success: false, message: 'Invalid or expired verification code' });
  }

  await runAsync('UPDATE users SET is_verified = 1, verification_code = NULL, verification_expires_at = NULL WHERE email = ?', [email]);
  return res.status(200).json({ success: true, message: 'Account verified successfully' });
});

router.post('/forgot-password', async (req, res) => {
  const email = sanitizeInput(req.body.email || '', 128);

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }
  if (!validateEmail(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email address' });
  }

  const user = await getAsync('SELECT id FROM users WHERE email = ?', [email]);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const code = generateCode();
  const expiresAt = createCodeExpiry(10);
  await runAsync('DELETE FROM password_resets WHERE email = ?', [email]);
  await runAsync('INSERT INTO password_resets (email, code, expires_at) VALUES (?, ?, ?)', [email, code, expiresAt]);

  try {
    const mailResult = await sendResetEmail(email, code);
    if (mailResult && mailResult.skipped) {
      return res.status(200).json({ success: true, message: 'Recovery code ready below.', code });
    }
    return res.status(200).json({ success: true, message: 'Recovery code sent to your email', code });
  } catch (mailErr) {
    return res.status(200).json({ success: true, message: 'Recovery code generated. Email delivery is unavailable in this demo.', code });
  }
});

router.post('/reset-password', async (req, res) => {
  const email = sanitizeInput(req.body.email || '', 128);
  const code = sanitizeInput(req.body.code || '', 16);
  const password = sanitizeInput(req.body.password || '', 128);

  if (!email || !code || !password) {
    return res.status(400).json({ success: false, message: 'Missing reset data' });
  }

  const reset = await getAsync('SELECT id, code, expires_at FROM password_resets WHERE email = ? AND used = 0 ORDER BY id DESC LIMIT 1', [email]);
  if (!reset) {
    return res.status(404).json({ success: false, message: 'No reset request found' });
  }
  if (isCodeExpired(reset.expires_at) || reset.code !== code) {
    return res.status(400).json({ success: false, message: 'Invalid or expired recovery code' });
  }

  const hashedPassword = await hashPassword(password);
  await runAsync('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);
  await runAsync('UPDATE password_resets SET used = 1 WHERE id = ?', [reset.id]);
  return res.status(200).json({ success: true, message: 'Password updated successfully' });
});

router.get('/me', authorizeToken, (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = router;
