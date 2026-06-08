/* ═══════════════════════════════════════════════════════════
   Order storage — pluggable.
   • Default: a local JSON file (server/orders.json).
   • If SUPABASE_URL + SUPABASE_KEY are set, uses Supabase (Postgres)
     via its REST API (PostgREST) — no npm dependency, uses fetch.
   The rest of the app only calls these 4 async methods.
   ═══════════════════════════════════════════════════════════ */
const fs   = require('fs');
const path = require('path');

const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';
const USE_SUPABASE = !!(SUPABASE_URL && SUPABASE_KEY);
const TABLE        = 'orders';

const FILE = process.env.ORDERS_FILE || path.join(__dirname, 'orders.json');

/* ── file helpers ── */
function fileAll() {
  try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); }
  catch (e) { return []; }
}
function fileWrite(list) { fs.writeFileSync(FILE, JSON.stringify(list, null, 2)); }

/* ── supabase REST helper ── */
function sb(query, opts) {
  return fetch(SUPABASE_URL + '/rest/v1/' + query, Object.assign({
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    }
  }, opts || {}));
}
// map a DB row → the shape the app expects
function fromRow(o) {
  return { orderId: o.order_id, createdAt: o.created_at, status: o.status, customer: o.customer, design: o.design };
}
function summary(o) {
  return { orderId: o.orderId, createdAt: o.createdAt, status: o.status, customer: o.customer,
           cakes: ((o.design && o.design.cakes) || []).length };
}

module.exports = {
  mode: USE_SUPABASE ? 'supabase' : 'file',

  async create(order) {
    if (USE_SUPABASE) {
      const r = await sb(TABLE, { method: 'POST', body: JSON.stringify({
        order_id: order.orderId, created_at: order.createdAt,
        status: order.status, customer: order.customer, design: order.design
      }) });
      if (!r.ok) throw new Error('Supabase insert failed: ' + r.status + ' ' + (await r.text()));
      return;
    }
    const list = fileAll(); list.push(order); fileWrite(list);
  },

  async list() {
    if (USE_SUPABASE) {
      const r = await sb(TABLE + '?select=order_id,created_at,status,customer,design&order=created_at.desc');
      if (!r.ok) throw new Error('Supabase list failed: ' + r.status + ' ' + (await r.text()));
      const rows = await r.json();
      if (!Array.isArray(rows)) throw new Error('Supabase list returned: ' + JSON.stringify(rows));
      return rows.map((o) => summary(fromRow(o)));
    }
    return fileAll().map(summary);
  },

  async get(id) {
    if (USE_SUPABASE) {
      const r = await sb(TABLE + '?order_id=eq.' + encodeURIComponent(id) + '&select=*&limit=1');
      if (!r.ok) throw new Error('Supabase get failed: ' + r.status + ' ' + (await r.text()));
      const rows = await r.json();
      return Array.isArray(rows) && rows[0] ? fromRow(rows[0]) : null;
    }
    return fileAll().find((x) => x.orderId === id) || null;
  },

  async updateStatus(id, status) {
    if (USE_SUPABASE) {
      const r = await sb(TABLE + '?order_id=eq.' + encodeURIComponent(id),
        { method: 'PATCH', body: JSON.stringify({ status }) });
      return r.ok;
    }
    const list = fileAll();
    const o = list.find((x) => x.orderId === id);
    if (!o) return false;
    o.status = status; fileWrite(list); return true;
  }
};
