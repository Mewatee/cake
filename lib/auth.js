/* Stateless admin auth — HMAC-signed tokens (no server-side session store,
   so it works on serverless where memory isn't shared between invocations). */
const crypto = require('crypto');

// Signing secret: a dedicated SESSION_SECRET if set, else derived from the password.
const SECRET = process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || 'dev-only-secret';

function b64u(buf) { return Buffer.from(buf).toString('base64url'); }

function sign(ttlMs) {
  const payload = b64u(JSON.stringify({ exp: Date.now() + ttlMs }));
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
  return payload + '.' + sig;
}

function verify(token) {
  if (!token || token.indexOf('.') < 0) return false;
  const [payload, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
  const a = Buffer.from(sig), b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  try { return Date.now() < JSON.parse(Buffer.from(payload, 'base64url').toString()).exp; }
  catch (e) { return false; }
}

function passwordOk(input) {
  const a = Buffer.from(String(input || '')), b = Buffer.from(String(process.env.ADMIN_PASSWORD || ''));
  if (b.length === 0 || a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function isAdminReq(req) {
  return verify((req.headers.authorization || '').replace('Bearer ', ''));
}

module.exports = { sign, verify, passwordOk, isAdminReq, TTL: 12 * 60 * 60 * 1000 };
