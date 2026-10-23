'use strict';
// Feature pack helpers (FP37B): pure, DB-free, testable. No secrets, no paid calls.
function hasProviderKey(env) { env = env || process.env; return Boolean(env.OPENROUTER_API_KEY || env.OPENAI_API_KEY); }
function preserve(v) { return v === undefined ? null : v; }
function filterRecords(records, query) {
  const list = Array.isArray(records) ? records : [];
  const q = (query && query.q != null ? String(query.q) : '').trim().toLowerCase();
  const status = query && query.status != null && query.status !== '' ? String(query.status) : null;
  return list.filter((r) => {
    if (status !== null && String(r.status ?? '') !== status) return false;
    if (!q) return true;
    return Object.values(r).some((v) => v !== null && v !== undefined && String(v).toLowerCase().includes(q));
  });
}
function toCSV(records) {
  const rows = Array.isArray(records) ? records : [];
  if (rows.length === 0) return 'id,title,status\n';
  const cols = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const esc = (v) => { if (v === null || v === undefined) return ''; const s = typeof v === 'object' ? JSON.stringify(v) : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  return [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n') + '\n';
}
function createTaskStore() {
  const tasks = new Map(); let seq = 1;
  return {
    list(owner, query) { return filterRecords([...tasks.values()].filter((t) => t.owner_id === owner), query || {}); },
    create(owner, body) {
      const b = body || {}; if (b.title === undefined || b.title === null || String(b.title).trim() === '') { const e = new Error('title is required'); e.status = 400; throw e; }
      const t = { id: seq++, owner_id: owner, title: String(b.title), description: b.description ?? '', status: b.status ?? 'open', priority: b.priority ?? 'medium', done: b.done ?? false, estimate: b.estimate ?? 0, created_at: new Date().toISOString() };
      tasks.set(t.id, t); return t;
    },
    update(owner, id, body) {
      const t = tasks.get(Number(id)); if (!t || t.owner_id !== owner) return null; const b = body || {};
      for (const k of ['title','description','status','priority','done','estimate']) if (Object.prototype.hasOwnProperty.call(b, k)) t[k] = b[k];
      return t;
    },
    _clear() { tasks.clear(); seq = 1; },
  };
}
const store = createTaskStore();
function labelled(title, lines) { return { title, lines: lines.map((l) => String(l)) }; }
function fallback(kind, records) {
  const rows = Array.isArray(records) ? records : [];
  const sections = buildSections(kind, rows);
  return { aiGenerated: false, provider: 'deterministic-fallback', kind, recordCount: rows.length, sections };
}
function buildSections(kind, rows) { return KIND_BUILDERS[kind](rows); }
const KIND_BUILDERS = {
  'revenue-summary': (rows) => ({ Overview: labelled('Overview', ['Reservations analysed: ' + rows.length, 'Total revenue: ' + rows.reduce((s, r) => s + (Number(r.total_price) || 0), 0)]), Detail: labelled('Detail', rows.slice(0, 5).map((r) => 'Guest ' + (r.guest_name ?? '') + ' | status=' + (r.status ?? '') + ' | price=' + (r.total_price ?? 0))) }),
  'pricing-hint': (rows) => ({ Signal: labelled('Signal', ['Average price: ' + (rows.length ? (rows.reduce((s, r) => s + (Number(r.total_price) || 0), 0) / rows.length).toFixed(2) : '0'), 'Zero-price rows preserved: ' + rows.filter((r) => Number(r.total_price) === 0).length]), Action: labelled('Action', ['Hold price when occupancy evidence is empty; review zero-price rows before discounting.']) }),
  'guest-sentiment': (rows) => ({ Signal: labelled('Signal', ['Records with empty notes preserved: ' + rows.filter((r) => !r.special_requests).length, 'Cancelled: ' + rows.filter((r) => r.status === 'cancelled').length]), Action: labelled('Action', ['Follow up cancelled or empty-note reservations first.']) }),
};
async function runAI(kind, records, env) {
  if (!hasProviderKey(env)) return fallback(kind, records);
  try {
    const key = (env || process.env).OPENROUTER_API_KEY || (env || process.env).OPENAI_API_KEY;
    const base = ((env || process.env).OPENROUTER_API_KEY ? ((env || process.env).OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1') : 'https://api.openai.com/v1').replace(/\/$/, '');
    const res = await fetch(base + '/chat/completions', { method: 'POST', headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: (env || process.env).OPENROUTER_MODEL || 'openai/gpt-4o-mini', messages: [{ role: 'user', content: 'Analyse labelled sections for ' + kind + ': ' + JSON.stringify(records).slice(0, 4000) }], max_tokens: 600 }) });
    if (!res.ok) return fallback(kind, records);
    const data = await res.json(); const text = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!text) return fallback(kind, records);
    return { aiGenerated: true, provider: 'provider', kind, recordCount: rowsCount(records), sections: { Provider: labelled('Provider', [text]) } };
  } catch (_) { return fallback(kind, records); }
}
function rowsCount(r) { return Array.isArray(r) ? r.length : 0; }
module.exports = { hasProviderKey, filterRecords, toCSV, createTaskStore, store, fallback, buildSections, runAI, labelled };
