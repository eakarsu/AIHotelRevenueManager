// Agentic revenue manager continuously optimizing pricing, channel inventory,
// and promotions.
// Audit: batch_04.md / AIHotelRevenueManager / Custom Feature Suggestions #1
const express = require('express');
const fetch = require('node-fetch');
const pool = require('../db');

const router = express.Router();

async function callAI(systemPrompt, userPrompt) {
  if (!process.env.OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY not configured');
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'X-Title': 'Hotel - Dynamic Pricing AI'
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3, max_tokens: 3000
    })
  });
  const d = await r.json();
  if (d.error) throw new Error(d.error.message || 'AI failed');
  return d.choices[0].message.content;
}

function parseJSON(t) { try { const m = t.match(/\{[\s\S]*\}/); if (m) return JSON.parse(m[0]); } catch (_) {} return { notes: t }; }

// POST /api/dynamic-pricing-ai/recommend { horizon_days?, channel_focus? }
router.post('/recommend', async (req, res) => {
  try {
    const { horizon_days = 14, channel_focus = 'all' } = req.body || {};

    let occupancy = { rows: [] }, comp = { rows: [] }, forecast = { rows: [] };
    try { occupancy = await pool.query(`SELECT date, occupancy_pct, adr FROM reservations_daily_rollup ORDER BY date DESC LIMIT 30`); } catch (_) {}
    try { comp = await pool.query(`SELECT * FROM competitors ORDER BY captured_at DESC LIMIT 30`); } catch (_) {}
    try { forecast = await pool.query(`SELECT * FROM forecasting ORDER BY forecast_date DESC LIMIT 30`); } catch (_) {}

    const systemPrompt = `You are an agentic hotel revenue manager. Recommend price moves by room type and
day, channel-mix adjustments, and promotion tactics. Return STRICT JSON only.`;

    const userPrompt = `Horizon (days): ${horizon_days}
Channel focus: ${channel_focus}
Recent occupancy/ADR: ${JSON.stringify(occupancy.rows.slice(0, 20))}
Competitor snapshots: ${JSON.stringify(comp.rows.slice(0, 15))}
Demand forecast: ${JSON.stringify(forecast.rows.slice(0, 14))}

Return JSON:
{
  "summary": "...",
  "price_moves": [{ "date": "YYYY-MM-DD", "room_type": "string", "current_rate_usd": 0, "recommended_rate_usd": 0, "delta_pct": 0, "rationale": "string" }],
  "channel_mix_recommendations": [{ "channel": "direct|booking|expedia|airbnb", "inventory_release_pct": 0, "rate_parity_note": "string" }],
  "promotion_recommendations": [{ "type": "string", "audience": "string", "expected_uplift_pct": 0 }],
  "expected_revpar_uplift_pct": 0,
  "risks": ["..."],
  "disclaimer": "Revenue advisory; revenue manager retains override."
}`;

    const raw = await callAI(systemPrompt, userPrompt);
    res.json({ horizon_days, channel_focus, recommendations: parseJSON(raw) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/snapshot', async (_req, res) => {
  try {
    const r = await pool.query(
      `SELECT date, occupancy_pct, adr FROM reservations_daily_rollup ORDER BY date DESC LIMIT 14`
    ).catch(() => ({ rows: [] }));
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
