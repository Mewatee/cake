// /api/order?id=ORD-…  —  GET one full order (public capability link, used to reopen a design)
const store = require('../lib/store');
const { send } = require('../lib/http');

module.exports = async (req, res) => {
  try {
    if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' });
    const id = (req.query && req.query.id) || new URL(req.url, 'http://x').searchParams.get('id');
    if (!id) return send(res, 400, { error: 'Missing id' });
    const o = await store.get(id);
    return o ? send(res, 200, o) : send(res, 404, { error: 'Not found' });
  } catch (e) {
    console.error('[api/order]', e);
    return send(res, 500, { error: 'Server error' });
  }
};
