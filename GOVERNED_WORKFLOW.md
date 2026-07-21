# Governed revenue workflow

`/api/governed-revenue` is the durable boundary for property/date/room-type recommendations. A tenant-scoped JWT is mandatory. Creation validates fresh inventory, reservation bounds, cancellations, overbooking, rate parity, forecast error, elasticity, and projected revenue impact. The state machine requires independent revenue-manager approval, a provider receipt and rollback snapshot before publish, and a measurement before completion. Every mutation is optimistic, idempotent, tenant-scoped, and audited.

The PMS/CRS/channel manager, competitor/event/weather, CRM, payment, and accounting adapters are contracts only. Configure approved adapter identifiers in `REVENUE_PROVIDER_ALLOWLIST`; an empty allowlist returns 503. No credentials or live connectivity are supplied. Guest-level data is intentionally excluded from this aggregate workflow.

Apply `server/migrations/` in numeric order with a reviewed migration tool, then assign tenant IDs through an authorized identity-admin process. The root launcher never installs, creates, migrates, seeds, or kills port owners. Install locked dependencies with `npm ci` in each package, copy `.env.example` to an untracked `.env`, migrate explicitly, then run `./start.sh`. Demo seeding is destructive and is disabled unless `ALLOW_DESTRUCTIVE_DEMO_SEED=true`, `NODE_ENV` is not production, and an explicit demo password is supplied.

This code has dependency-free policy tests, but no live provider, database, performance, security, or revenue-professional validation has been performed. Production release remains blocked on those activities and operational rollback drills.
