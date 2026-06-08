const auth = require('../lib/auth');
const { send, readJson } = require('../lib/http');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  const b = await readJson(req);
  if (auth.passwordOk(b.password)) return send(res, 200, { token: auth.sign(auth.TTL) });
  return send(res, 401, { error: 'Wrong password' });
};
