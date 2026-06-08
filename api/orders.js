// /api/orders  —  POST = place an order (public),  GET = list (admin)
const crypto = require('crypto');
const store = require('../lib/store');
const auth = require('../lib/auth');
const { send, readJson } = require('../lib/http');

module.exports = async (req, res) => {
  try {
    if (req.method === 'POST') {
      const b = await readJson(req);
      const order = {
        orderId: 'ORD-' + crypto.randomBytes(8).toString('hex').toUpperCase(),
        createdAt: new Date().toISOString(),
        status: 'pending',
        customer: (b && typeof b.customer === 'object') ? b.customer : {},
        design: (b && typeof b.design === 'object') ? b.design : {}
      };
      await store.create(order);
      return send(res, 200, { orderId: order.orderId });
    }
    if (req.method === 'GET') {
      if (!auth.isAdminReq(req)) return send(res, 401, { error: 'Unauthorized' });
      return send(res, 200, await store.list());
    }
    return send(res, 405, { error: 'Method not allowed' });
  } catch (e) {
    console.error('[api/orders]', e);
    return send(res, 500, { error: 'Server error' });
  }
};
