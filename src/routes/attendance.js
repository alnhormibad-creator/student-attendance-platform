const express = require('express');
const { allAsync, getAsync, runAsync } = require('../database');
const { authorizeToken, requireRole } = require('../auth-service');

const router = express.Router();

router.get('/attendance', authorizeToken, async (req, res) => {
  if (req.user.role === 'student') {
    const attendance = await allAsync('SELECT id, student, status, date FROM attendance WHERE student = ? ORDER BY date DESC', [req.user.username]);
    return res.json({ success: true, attendance });
  }

  const attendance = await allAsync('SELECT id, student, status, date FROM attendance ORDER BY date DESC, student ASC');
  res.json({ success: true, attendance });
});

router.post('/attendance', authorizeToken, requireRole('student'), async (req, res) => {
  const student = req.user.username;
  const status = 'present';
  const date = new Date().toISOString().split('T')[0];

  const existing = await getAsync('SELECT id FROM attendance WHERE student = ? AND date = ?', [student, date]);
  if (existing) {
    await runAsync('UPDATE attendance SET status = ? WHERE id = ?', [status, existing.id]);
    return res.json({ success: true, message: 'Attendance updated' });
  }

  await runAsync('INSERT INTO attendance (student, status, date) VALUES (?, ?, ?)', [student, status, date]);
  res.json({ success: true, message: 'Attendance recorded' });
});

module.exports = router;
