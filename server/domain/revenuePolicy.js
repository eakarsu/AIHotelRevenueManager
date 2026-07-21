const STAGES = Object.freeze(['draft','recommended','review','approved','published','rolled_back','measured']);
const MAX_EVIDENCE_AGE_MS = 60 * 60 * 1000;
const round = (value, places = 2) => Number(Number(value).toFixed(places));
function calculateMetrics({ inventory, reservations, rate }) {
  for (const [key, value] of Object.entries({ inventory, reservations, rate })) if (!Number.isFinite(Number(value)) || Number(value) < 0) throw new Error(`${key} must be non-negative`);
  if (Number(reservations) > Number(inventory)) throw new Error('reservations exceed physical inventory');
  const occupancy = Number(inventory) === 0 ? 0 : Number(reservations) / Number(inventory);
  return { occupancy: Math.round(occupancy * 10000) / 10000, room_revenue: Math.round(Number(reservations) * Number(rate) * 100) / 100, revpar: Math.round(occupancy * Number(rate) * 100) / 100 };
}
function validateSnapshot(input, now = Date.now()) {
  const metrics = calculateMetrics(input);
  const asOf = new Date(input.data_as_of);
  if (Number.isNaN(asOf.valueOf()) || asOf.valueOf() > now || now - asOf.valueOf() > MAX_EVIDENCE_AGE_MS) throw new Error('inventory snapshot is stale or invalid');
  const cancellations = Number(input.cancellations || 0), overbooking = Number(input.overbooking || 0);
  if (![cancellations, overbooking].every(Number.isInteger) || cancellations < 0 || overbooking < 0 || overbooking > Number(input.inventory)) throw new Error('invalid cancellation or overbooking counts');
  if (input.restrictions && typeof input.restrictions !== 'object') throw new Error('restrictions must be structured');
  return { ...metrics, cancellations, overbooking, data_as_of: asOf.toISOString() };
}
function evaluateRecommendation({ current_rate, recommended_rate, competitor_rate, forecast, actual, elasticity, projected_revenue, baseline_revenue }) {
  const values = [current_rate,recommended_rate,competitor_rate,forecast,actual,elasticity,projected_revenue,baseline_revenue].map(Number);
  if (!values.every(Number.isFinite) || values.slice(0,3).some(v=>v<0) || values.slice(3).some(v=>v<0)) throw new Error('recommendation evidence must be non-negative numbers');
  const forecastError = actual === 0 ? Math.abs(forecast-actual) : Math.abs(forecast-actual)/actual;
  return { rate_parity_delta: round(recommended_rate-competitor_rate), forecast_error: round(forecastError,4), elasticity: round(elasticity,4), projected_revenue_impact: round(projected_revenue-baseline_revenue) };
}
function validateTransition(from, to, context = {}) {
  const allowed = { draft:['recommended'],recommended:['draft','review'],review:['recommended','approved'],approved:['published'],published:['rolled_back','measured'],rolled_back:['measured'],measured:[] };
  if (!allowed[from]?.includes(to)) throw new Error('invalid revenue transition');
  if (['approved','published','rolled_back'].includes(to) && !['admin','revenue_manager'].includes(context.role)) throw new Error('revenue authority required');
  if (['approved','published'].includes(to) && (!context.evidenceCount || Number.isNaN(new Date(context.dataAsOf).valueOf()) || new Date(context.dataAsOf) <= new Date(Date.now()-MAX_EVIDENCE_AGE_MS))) throw new Error('current source evidence required');
  if (to === 'approved' && context.createdBy === context.actorId) throw new Error('maker-checker approval required');
  if (to === 'published' && (!context.providerReceipt || !context.rollbackSnapshot)) throw new Error('publish receipt and rollback snapshot required');
  return true;
}
module.exports = { STAGES, MAX_EVIDENCE_AGE_MS, calculateMetrics, validateSnapshot, evaluateRecommendation, validateTransition };
