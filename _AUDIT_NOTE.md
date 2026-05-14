# Audit Apply Notes — AIHotelRevenueManager

## Source
`/Users/erolakarsu/projects/_AUDIT/reports/batch_04.md` section 26.

## Audit vs. Reality
Audit reported "0 AI endpoints"; in fact AI is broadly integrated through `services/openrouter.js` and per-domain `ai-*` sub-routes:

- `POST /api/pricing/ai-analyze` — dynamic-pricing-optimizer equivalent (analyzeRoomPricing)
- `POST /api/forecasting/ai-forecast` — demand-forecaster equivalent (generateForecast)
- `POST /api/competitors/ai-analyze` — competitor-rate-monitoring equivalent (analyzeCompetitors)
- `POST /api/reviews/:id/ai-sentiment` — review-sentiment-analyzer equivalent (analyzeSentiment)
- `POST /api/upsells/ai-recommend` — upsell-recommendation equivalent (generateUpsellRecommendations)
- `POST /api/guests/:id/ai-personalize` — per-guest personalization (personalizeGuestExperience)
- `POST /api/channels/...` channel optimization
- `POST /api/aiWarRoom/revenue-war-room`, `/group-booking-optimizer`, `/guest-lifetime-value`
- AI cache + `ai_analyses` persistence built in

So 5 of the 6 audit gaps are already met. The truly missing item is cohort-level guest segmentation distinct from per-guest personalization.

## Original Recommendations (AI Counterparts)
- `/dynamic-pricing-optimizer` — already exists as `/api/pricing/ai-analyze`
- `/demand-forecaster` — already exists as `/api/forecasting/ai-forecast`
- `/guest-segmentation` — MISSING (added)
- `/review-sentiment-analyzer` — already exists as `/api/reviews/:id/ai-sentiment`
- `/competitor-rate-monitoring` — already exists as `/api/competitors/ai-analyze`
- `/upsell-recommendation` — already exists as `/api/upsells/ai-recommend`

## Implemented (this pass)
- `services/openrouter.js`: added `analyzeGuestSegmentation(guests, userId)` — uses existing `callOpenRouter` (with caching + persistence) and a JSON-only segmentation prompt.
- `routes/guests.js`: added `POST /api/guests/ai-segment` — pulls up to 500 guests (default 200), calls `analyzeGuestSegmentation`, returns segments / churn risk / recommended actions.

Syntax: `node --check` passes for both modified files.

## Backlog
- Custom: agentic revenue manager (autonomy boundary needed), guest lifecycle automation, dynamic packaging, occupancy smoothing, reputation/review-response automation, staff scheduling/labor optimization.
- Non-AI: direct booking management, housekeeping/maintenance scheduling depth, loyalty program, OTA API integrations, employee scheduling.

## Categorization
- MECHANICAL: 1 endpoint (done — exhausts the audit's missing list once existing endpoints are recognized).
- NEEDS-CREDS: OTA APIs (Expedia, Booking.com), payment integrations.
- NEEDS-PRODUCT-DECISION: agent autonomy bounds, loyalty program rules.

## Apply pass 3 (frontend)

All AI backend endpoints are already wired through `client/src/services/api.js` and dedicated pages: `PricingPage` (ai-analyze), `ChannelsPage` (ai-optimize), `GuestsPage` (ai-personalize), `UpsellsPage` (ai-recommend), `ReviewsPage` (ai-sentiment), `CompetitorsPage` (ai-analyze), `ForecastingPage` (ai-forecast), `GuestSegmentationPage` (/api/guests/ai-segment), `RevenueWarRoomPage`, `GroupBookingPage`, `GuestLTVPage`. JWT Bearer is applied via shared `request()` helper that pulls from `localStorage.token`. No FE changes needed.

## Apply pass 4 (mechanical backlog)

LEFT-AS-IS. No code changes.

Pass 2 already exhausted the audit's mechanical AI list — guest segmentation (the only missing item) was implemented as `POST /api/guests/ai-segment` in `services/openrouter.js` + `routes/guests.js`. Pass 3 confirmed every AI endpoint has a dedicated FE page wired through the shared `request()` JWT helper.

Remaining backlog is non-mechanical: OTA APIs (Expedia, Booking.com) and payments are NEEDS-CREDS; agent autonomy bounds and loyalty program rules are NEEDS-PRODUCT-DECISION; housekeeping / maintenance scheduling depth and employee scheduling are non-AI.
