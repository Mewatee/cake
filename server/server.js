/* ═══════════════════════════════════════════════════════════
   Celestial Cake — order backend
   Run:   node server/server.js   (or  npm start)
   Open   http://localhost:3000          (designer)
          http://localhost:3000/admin     (admin dashboard)

   Config comes from server/.env (see server/.env.example).
   Storage is in server/store.js — file by default, Supabase if configured.
   ═══════════════════════════════════════════════════════════ */
const http   = require('http');
const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');

/* ── load server/.env into process.env (no dependency) ── */
(function loadEnv() {
  try {
    const envPath = path.join(__dirname, '.env');
    if (!fs.existsSync(envPath)) return;
    fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach((line) => {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !line.trim().startsWith('#') && process.env[m[1]] === undefined) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
      }
    });
  } catch (e) { /* ignore */ }
})();

const store = require('./store');

const PORT           = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;   // override in server/.env
const PUBLIC_DIR     = path.join(__dirname, '..', 'public');
const MAX_BODY       = 12 * 1024 * 1024;       // 12 MB cap (photos are data-URLs)
const TOKEN_TTL      = 12 * 60 * 60 * 1000;    // admin session lifetime: 12h
const LOGIN_MAX      = 6;                        // failed logins before lockout
const LOGIN_WINDOW   = 15 * 60 * 1000;          // lockout window: 15 min

// Refuse to boot in production with the default password (override: ALLOW_DEFAULT_PASSWORD=1)
if (ADMIN_PASSWORD === 'cake-admin') {
  const msg = '⚠  ADMIN_PASSWORD is the default ("cake-admin"). Set a strong one in server/.env';
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEFAULT_PASSWORD !== '1') {
    console.error('\n⛔ Refusing to start in production: ' + msg + '\n');
    process.exit(1);
  }
  console.warn('\n' + msg + '\n');
}

const tokens     = new Map();   // token -> expiry timestamp
const loginFails = new Map();   // ip -> { count, until }

/* ── tiny http helpers ── */
function send(res, code, data, type) {
  const isRaw = typeof data === 'string' || Buffer.isBuffer(data);
  res.writeHead(code, {
    'Content-Type': type || 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer'
  });
  res.end(isRaw ? data : JSON.stringify(data));
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    // fast reject via declared length, then enforce while streaming as a fallback
    const declared = parseInt(req.headers['content-length'] || '0', 10);
    if (declared > MAX_BODY) { const e = new Error('TOO_LARGE'); e.tooLarge = true; return reject(e); }
    let b = '', size = 0, done = false;
    req.on('data', (c) => {
      if (done) return;
      size += c.length;
      if (size > MAX_BODY) { done = true; req.destroy(); const e = new Error('TOO_LARGE'); e.tooLarge = true; reject(e); return; }
      b += c;
    });
    req.on('end', () => { if (done) return; try { resolve(b ? JSON.parse(b) : {}); } catch (e) { resolve({}); } });
    req.on('error', () => { if (!done) resolve({}); });
  });
}
function safeEqual(a, b) {
  const ab = Buffer.from(String(a)), bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}
function isAdmin(req) {
  const tok = (req.headers.authorization || '').replace('Bearer ', '');
  const exp = tokens.get(tok);
  if (!exp) return false;
  if (Date.now() > exp) { tokens.delete(tok); return false; }
  return true;
}

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.json': 'application/json', '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const p = url.pathname;

  /* ─────────── API ─────────── */
  if (p.startsWith('/api/')) {
    try {
      // admin login → issue a token (rate-limited, timing-safe)
      if (p === '/api/login' && req.method === 'POST') {
        const ip = req.socket.remoteAddress || '?';
        const now = Date.now();
        const f = loginFails.get(ip) || { count: 0, ts: 0, until: 0 };
        if (f.until > now) return send(res, 429, { error: 'Too many attempts. Try again later.' });
        if (now - f.ts > LOGIN_WINDOW) f.count = 0;   // window expired → reset counter
        const b = await readBody(req);
        if (safeEqual(b.password, ADMIN_PASSWORD)) {
          loginFails.delete(ip);
          const tok = crypto.randomBytes(24).toString('hex');
          tokens.set(tok, now + TOKEN_TTL);
          return send(res, 200, { token: tok });
        }
        f.count += 1; f.ts = now;
        if (f.count >= LOGIN_MAX) f.until = now + LOGIN_WINDOW;
        loginFails.set(ip, f);
        return send(res, 401, { error: 'Wrong password' });
      }

      // place an order (public — anyone designing a cake can submit)
      if (p === '/api/orders' && req.method === 'POST') {
        const b = await readBody(req);
        const order = {
          // random, unguessable ID → acts as a capability link (orders can't be enumerated)
          orderId: 'ORD-' + crypto.randomBytes(8).toString('hex').toUpperCase(),
          createdAt: new Date().toISOString(),
          status: 'pending',
          customer: (b && typeof b.customer === 'object') ? b.customer : {},
          design: (b && typeof b.design === 'object') ? b.design : {}
        };
        await store.create(order);
        return send(res, 200, { orderId: order.orderId });
      }

      // list orders (admin only) — summary rows for the table
      if (p === '/api/orders' && req.method === 'GET') {
        if (!isAdmin(req)) return send(res, 401, { error: 'Unauthorized' });
        return send(res, 200, await store.list());
      }

      // get one full order (used to re-open a design)
      const one = p.match(/^\/api\/orders\/([^/]+)$/);
      if (one && req.method === 'GET') {
        const o = await store.get(one[1]);
        return o ? send(res, 200, o) : send(res, 404, { error: 'Not found' });
      }

      // update status (admin only) — only a known status value is accepted
      const st = p.match(/^\/api\/orders\/([^/]+)\/status$/);
      if (st && req.method === 'PATCH') {
        if (!isAdmin(req)) return send(res, 401, { error: 'Unauthorized' });
        const b = await readBody(req);
        const ALLOWED = ['pending', 'baking', 'ready', 'collected', 'cancelled'];
        if (ALLOWED.indexOf(b.status) === -1) return send(res, 400, { error: 'Invalid status' });
        const ok = await store.updateStatus(st[1], b.status);
        return ok ? send(res, 200, { ok: true }) : send(res, 404, { error: 'Not found' });
      }

      return send(res, 404, { error: 'Unknown API route' });
    } catch (e) {
      if (e && e.tooLarge) return send(res, 413, { error: 'Payload too large' });
      console.error('[api error]', e);                 // log server-side
      return send(res, 500, { error: 'Server error' }); // generic to client
    }
  }

  /* ─────────── static files ─────────── */
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed', 'text/plain');
  let rel = p === '/' ? '/celestial_box_3d.html' : p;
  if (p === '/admin') rel = '/admin.html';
  let file;
  try { file = path.join(PUBLIC_DIR, decodeURIComponent(rel)); }
  catch (e) { return send(res, 400, 'Bad request', 'text/plain'); }
  // ensure the resolved path stays inside PUBLIC_DIR (no traversal)
  const relCheck = path.relative(PUBLIC_DIR, file);
  if (relCheck.startsWith('..') || path.isAbsolute(relCheck)) return send(res, 403, 'Forbidden', 'text/plain');
  fs.readFile(file, (err, data) => {
    if (err) return send(res, 404, 'Not found', 'text/plain');
    send(res, 200, data, MIME[path.extname(file)] || 'application/octet-stream');
  });
});

server.listen(PORT, () => {
  console.log('🎂 Celestial Cake server running:');
  console.log('   Designer →  http://localhost:' + PORT);
  console.log('   Admin    →  http://localhost:' + PORT + '/admin');
  console.log('   Storage  →  ' + store.mode + (store.mode === 'file' ? ' (server/orders.json)' : ' (Supabase)'));
});
