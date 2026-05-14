# Apply Pass 5 — AIHotelRevenueManager

**Date:** 2026-05-08
**Project:** AIHotelRevenueManager
**Stack:** Node-Express + React, Postgres `pg` pool, JWT bearer auth
(`app.use('/api', authMiddleware)`).
**Audit source:** `/Users/erolakarsu/projects/_AUDIT/reports/batch_04.md` §26

## Verified-present (no changes)

Pass 1-4 already implemented every audit-flagged AI counterpart:
- `/api/pricing/ai-analyze`, `/api/forecasting/ai-forecast`,
  `/api/competitors/ai-analyze`, `/api/reviews/:id/ai-sentiment`,
  `/api/upsells/ai-recommend`, `/api/guests/:id/ai-personalize`,
  `/api/guests/ai-segment` (pass 2), `/api/channels/...`,
  `/api/aiWarRoom/revenue-war-room` etc.
- AI cache + `ai_analyses` persistence built in `services/openrouter.js`.

## Implemented this pass (5 items — at cap)

1. `POST /api/integrations/expedia/sync` — 503-on-no-key.
2. `POST /api/integrations/bookingcom/sync` — 503-on-no-key.
3. `POST /api/integrations/stripe/charge` — 503-on-no-key.
4. `POST /api/integrations/loyalty/lookup` — 503-on-no-key.
5. `GET  /api/labor-ops/housekeeping-recommendation` — mechanical,
   deterministic recommendation (rooms × ratio → attendants + supervisors)
   from existing `rooms` table.

Files written:
- `server/routes/integrations.js` (new)
- `server/routes/laborOps.js` (new)
- `server/index.js` (added 4 lines: 2 requires, 2 `app.use`)
- `_BACKLOG_NEEDS_CREDS.md` (new)

JWT auth is inherited automatically from the existing
`app.use('/api', authMiddleware)` — confirmed by reading server/index.js.

## Categorization of remaining backlog

- **NEEDS-CREDS (stubbed):** Expedia, Booking.com, Stripe, Loyalty.
- **MECHANICAL (implemented):** housekeeping headcount recommendation.
- **NEEDS-PRODUCT-DECISION:** agentic revenue manager autonomy, dynamic
  packaging, loyalty rules.

## Smoke test outcome

`node --check` passes for all 3 modified/new files. New endpoints inherit
JWT middleware automatically. Existing AI endpoints + rate limiter remain
untouched.

## Cap

5 / 5.
