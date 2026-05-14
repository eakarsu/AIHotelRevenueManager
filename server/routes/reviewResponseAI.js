// Reputation + review response monitoring OTA feedback and drafting
// management replies.
// Audit: batch_04.md / AIHotelRevenueManager / Custom Feature Suggestions #5
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
      'X-Title': 'Hotel - Review Response AI'
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.5, max_tokens: 2000
    })
  });
  const d = await r.json();
  if (d.error) throw new Error(d.error.message || 'AI failed');
  return d.choices[0].message.content;
}

function parseJSON(t) { try { const m = t.match(/\{[\s\S]*\}/); if (m) return JSON.parse(m[0]); } catch (_) {} return { notes: t }; }

// POST /api/review-response-ai/draft { review_id? , review_text?, source?, stars? }
router.post('/draft', async (req, res) => {
  try {
    const { review_id, review_text, source = 'unspecified', stars, guest_name } = req.body || {};

    let review = null;
    if (review_id && !review_text) {
      try {
        const r = await pool.query(`SELECT * FROM reviews WHERE id = $1`, [review_id]);
        review = r.rows[0] || null;
      } catch (_) {}
    }
    const text = review_text || review?.text;
    if (!text) return res.status(400).json({ error: 'review_id or review_text required' });

    const systemPrompt = `You are a hotel general manager's review-response assistant. Draft a professional,
empathetic, brand-safe reply. Acknowledge specific concerns, offer remediation where appropriate, and protect
brand reputation. Return STRICT JSON only.`;

    const userPrompt = `Source: ${source}
Stars: ${stars || review?.stars || 'unspecified'}
Guest name: ${guest_name || review?.guest_name || 'Valued Guest'}
Review text: ${text.slice(0, 4000)}

Return JSON:
{
  "sentiment_score": -1,
  "topics_extracted": ["..."],
  "issues_to_acknowledge": ["..."],
  "draft_reply": "string (2-3 paragraphs, professional, ${stars && stars <= 3 ? 'apologetic but not over-apologizing' : 'gracious and inviting return'})",
  "alternate_reply": "string (shorter version)",
  "internal_followup_actions": ["..."],
  "escalate_to_gm": false,
  "disclaimer": "AI draft; verify before publishing."
}`;

    const raw = await callAI(systemPrompt, userPrompt);
    const parsed = parseJSON(raw);

    try {
      await pool.query(
        `INSERT INTO ai_results (review_id, payload, created_at) VALUES ($1, $2, NOW())`,
        [review_id || null, JSON.stringify(parsed)]
      );
    } catch (_) {}

    res.json({ review_id: review_id || null, source, draft: parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/recent', async (_req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, source, stars, guest_name, text, captured_at FROM reviews
       ORDER BY captured_at DESC LIMIT 50`
    ).catch(() => ({ rows: [] }));
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
