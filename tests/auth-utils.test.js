const { test, expect } = require('@jest/globals');
const { generateCode, createCodeExpiry, isCodeExpired, hashPassword, verifyPassword } = require('../auth-utils');

test('generateCode returns a numeric code of expected length', () => {
  const code = generateCode();
  expect(code).toHaveLength(6);
  expect(code).toMatch(/^\d{6}$/);
});

test('createCodeExpiry produces a future timestamp', () => {
  const expiresAt = createCodeExpiry(10);
  expect(new Date(expiresAt).getTime()).toBeGreaterThan(Date.now());
});

test('isCodeExpired flags past expiry correctly', () => {
  const expiredAt = new Date(Date.now() - 1000).toISOString();
  expect(isCodeExpired(expiredAt)).toBe(true);
});

test('hashPassword and verifyPassword work together', async () => {
  const password = 'StrongPass123!';
  const hashed = await hashPassword(password);
  expect(hashed.startsWith('$2')).toBe(true);
  expect(await verifyPassword(password, hashed)).toBe(true);
  expect(await verifyPassword('wrong', hashed)).toBe(false);
});
