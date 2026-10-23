'use strict';
const express = require('express');
const router = express.Router();
const fp = require('../services/featurePack');
let pool = null; try { pool = require('../db'); } catch (_) {}
const KINDS = ['revenue-summary','pricing-hint','guest-sentiment'];
function owner(req) { return (req.user && (req.user.id ?? req.user.userId)) ?? 'authenticated'; }
router.get('/tasks', (req, res) => res.json({ data: fp.store.list(owner(req), req.query) }));
router.post('/tasks', (req, res) => { try { res.status(201).json(fp.store.create(owner(req), req.body || {})); } catch (e) { res.status(e.status || 400).json({ error: e.message }); } });
router.put('/tasks/:id', (req, res) => { const t = fp.store.update(owner(req), req.params.id, req.body || {}); if (!t) return res.status(404).json({ error: 'Task not found' }); res.json(t); });
router.patch('/tasks/:id', (req, res) => { const t = fp.store.update(owner(req), req.params.id, req.body || {}); if (!t) return res.status(404).json({ error: 'Task not found' }); res.json(t); });
async function mainRows(req) {
  let rows = [];
  if (pool && pool.query) { try { const r = await pool.query('SELECT * FROM reservations LIMIT 500'); rows = r.rows || []; } catch (_) { rows = []; } }
  return fp.filterRecords(rows, req.query);
}
router.get('/export', async (req, res) => {
  const rows = await mainRows(req); const format = String(req.query.format || 'json').toLowerCase();
  if (format === 'csv') { res.setHeader('Content-Type', 'text/csv'); return res.send(fp.toCSV(rows)); }
  return res.json({ data: rows, count: rows.length });
});
for (const kind of KINDS) {
  router.post('/ai/' + kind, async (req, res) => {
    const body = req.body || {}; let records = Array.isArray(body.records) ? body.records : null;
    if (!records) records = await mainRows(req);
    res.json(await fp.runAI(kind, records));
  });
}
module.exports = router;
