const sqlite3 = require('sqlite3').verbose();
const { hashPassword } = require('../auth-utils');
const config = require('./config');

const db = new sqlite3.Database(config.dbPath, (err) => {
  if (err) {
    console.error('Unable to open database', err);
    process.exit(1);
  }
});

function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

async function getSetting(name) {
  const row = await getAsync('SELECT value FROM settings WHERE name = ?', [name]);
  return row ? row.value : null;
}

async function upsertSetting(name, value) {
  await runAsync(
    `INSERT INTO settings (name, value) VALUES (?, ?)
     ON CONFLICT(name) DO UPDATE SET value = excluded.value`,
    [name, value]
  );
}

async function upgradeLegacyUsers() {
  const users = await allAsync('SELECT id, username, email, password, role FROM users');
  for (const user of users) {
    const updates = {};
    if (!user.email) {
      updates.email = `${user.username}@example.com`;
    }
    if (user.username === 'admin' && user.role === 'admin') {
      updates.is_verified = 1;
    }
    if (typeof user.password === 'string' && !user.password.startsWith('$2')) {
      updates.password = await hashPassword(user.password);
    }
    if (Object.keys(updates).length > 0) {
      const setClause = Object.keys(updates).map((key) => `${key} = ?`).join(', ');
      await runAsync(`UPDATE users SET ${setClause} WHERE id = ?`, [...Object.values(updates), user.id]);
    }
  }
}

async function initDb() {
  await runAsync(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      email TEXT UNIQUE,
      password TEXT,
      role TEXT,
      is_verified INTEGER DEFAULT 0,
      verification_code TEXT,
      verification_expires_at TEXT
    )`);

  await runAsync(`CREATE TABLE IF NOT EXISTS password_resets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT,
      code TEXT,
      expires_at TEXT,
      used INTEGER DEFAULT 0
    )`);

  await runAsync(`CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student TEXT,
      status TEXT,
      date TEXT
    )`);
  await runAsync(`CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      value TEXT
    )`);
  await upgradeLegacyUsers();

  const userCount = await getAsync('SELECT COUNT(*) AS count FROM users');
  if (userCount && userCount.count === 0) {
    const adminHash = await hashPassword(config.defaultAdminPassword);
    await runAsync('INSERT INTO users (username, email, password, role, is_verified) VALUES (?, ?, ?, ?, ?)', ['admin', 'admin@example.com', adminHash, 'admin', 1]);
    const studentHash = await hashPassword('student123');
    await runAsync('INSERT INTO users (username, email, password, role, is_verified) VALUES (?, ?, ?, ?, ?)', ['student', 'student@example.com', studentHash, 'student', 1]);
  }

  const attendanceCount = await getAsync('SELECT COUNT(*) AS count FROM attendance');
  if (attendanceCount && attendanceCount.count === 0) {
    await runAsync('INSERT INTO attendance (student, status, date) VALUES (?, ?, ?)', ['Alicia', 'pending', '2026-08-06']);
    await runAsync('INSERT INTO attendance (student, status, date) VALUES (?, ?, ?)', ['Ben', 'pending', '2026-08-06']);
    await runAsync('INSERT INTO attendance (student, status, date) VALUES (?, ?, ?)', ['Chris', 'pending', '2026-08-06']);
  }
}

module.exports = {
  db,
  initDb,
  runAsync,
  getAsync,
  allAsync,
  getSetting,
  upsertSetting,
};
