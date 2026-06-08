// /api/status?id=ORD-…  —  PATCH order status (admin)
const store = require('../lib/store');
const auth = require('../lib/auth');
const { send, readJson } = require('../lib/http');

const ALLOWED = ['pending', 'baking', 'ready', 'collected', 'cancelled'];

module.exports = async (req, res) => {
  try {
    if (req.method !== 'PATCH' && req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
    if (!auth.isAdminReq(req)) return send(res, 401, { error: 'Unauthorized' });
    const id = (req.query && req.query.id) || new URL(req.url, 'http://x').searchParams.get('id');
    const b = await readJson(req);
    if (!id) return send(res, 400, { error: 'Missing id' });
    if (ALLOWED.indexOf(b.status) === -1) return send(res, 400, { error: 'Invalid status' });
    const ok = await store.updateStatus(id, b.status);
    return ok ? send(res, 200, { ok: true }) : send(res, 404, { error: 'Not found' });
  } catch (e) {
    console.error('[api/status]', e);
    return send(res, 500, { error: 'Server error' });
  }
};
