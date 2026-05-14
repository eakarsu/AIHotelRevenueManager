const fetch = require('node-fetch');
const path = require('path');
const pool = require('../db');

require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });

// Initialize cache + analyses tables fire-and-forget
pool.query(`
  CREATE TABLE IF NOT EXISTS ai_cache (
    id SERIAL PRIMARY KEY,
    cache_key TEXT UNIQUE,
    result TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
  )
`).catch(() => {});

pool.query(`
  CREATE TABLE IF NOT EXISTS ai_analyses (
    id SERIAL PRIMARY KEY,
    tool_name TEXT,
    result TEXT,
    model TEXT,
    user_id INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
  )
`).catch(() => {});

const DEFAULT_MODEL = 'anthropic/claude-3-5-sonnet-20241022';

async function checkCache(cacheKey) {
  try {
    const res = await pool.query(
      `SELECT result FROM ai_cache WHERE cache_key = $1 AND expires_at > NOW()`,
      [cacheKey]
    );
    if (res.rows.length > 0) {
      const parsed = JSON.parse(res.rows[0].result);
      return { ...parsed, _cached: true };
    }
  } catch (_) {}
  return null;
}

async function storeCache(cacheKey, result) {
  try {
    await pool.query(
      `INSERT INTO ai_cache (cache_key, result, created_at, expires_at)
       VALUES ($1, $2, NOW(), NOW() + interval '1 hour')
       ON CONFLICT (cache_key) DO UPDATE
         SET result = EXCLUDED.result, created_at = NOW(), expires_at = NOW() + interval '1 hour'`,
      [cacheKey, JSON.stringify(result)]
    );
  } catch (_) {}
}

function persistAnalysis(toolName, result, model, userId) {
  pool.query(
    `INSERT INTO ai_analyses (tool_name, result, model, user_id, created_at)
     VALUES ($1, $2, $3, $4, NOW())`,
    [toolName, JSON.stringify(result), model || DEFAULT_MODEL, userId || null]
  ).catch(() => {});
}

async function callOpenRouter(prompt, cacheKey, toolName, userId) {
  // Check cache first
  if (cacheKey) {
    const cached = await checkCache(cacheKey);
    if (cached) return cached;
  }

  const model = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorBody}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  let result;
  try {
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      result = JSON.parse(jsonMatch[1]);
    } else {
      result = JSON.parse(content);
    }
  } catch {
    result = { raw_response: content };
  }

  // Store cache and persist
  if (cacheKey) await storeCache(cacheKey, result);
  if (toolName) persistAnalysis(toolName, result, model, userId);

  return result;
}

async function analyzeRoomPricing(roomData, userId) {
  const cacheKey = `pricing:${JSON.stringify(roomData).slice(0, 200)}`;
  const prompt = `You are a hotel revenue management AI. Analyze the following room data and suggest optimal pricing.

Room Data:
${JSON.stringify(roomData, null, 2)}

Respond ONLY with a JSON object in this exact format (no markdown, no explanation):
{
  "recommended_price": <number>,
  "recommended_rate": <number>,
  "min_suggested_price": <number>,
  "max_suggested_price": <number>,
  "confidence_score": <number between 0 and 1>,
  "adjustment_factors": [
    {"factor": "<name>", "impact": "<positive/negative>", "weight": <number>}
  ],
  "reasoning": "<brief explanation>",
  "demand_forecast": "<low/medium/high>",
  "competitor_position": "<below_market/at_market/above_market>",
  "recommendations": ["<action item 1>", "<action item 2>"]
}`;

  return callOpenRouter(prompt, cacheKey, 'analyzeRoomPricing', userId);
}

async function optimizeChannelDistribution(channelData, userId) {
  const cacheKey = `channels:${JSON.stringify(channelData).slice(0, 200)}`;
  const prompt = `You are a hotel channel distribution optimization AI. Analyze the following channel data and suggest optimal distribution strategy.

Channel Data:
${JSON.stringify(channelData, null, 2)}

Respond ONLY with a JSON object in this exact format (no markdown, no explanation):
{
  "optimized_allocations": [
    {"channel": "<name>", "current_allocation": <number>, "recommended_allocation": <number>, "expected_revenue_change": <number>}
  ],
  "overall_strategy": "<description>",
  "cost_savings": <number>,
  "revenue_increase_potential": <number>,
  "risk_assessment": "<low/medium/high>",
  "recommendations": ["<action item 1>", "<action item 2>"],
  "priority_actions": ["<immediate action 1>", "<immediate action 2>"]
}`;

  return callOpenRouter(prompt, cacheKey, 'optimizeChannelDistribution', userId);
}

async function personalizeGuestExperience(guestData, userId) {
  const cacheKey = `guest:${JSON.stringify(guestData).slice(0, 200)}`;
  const prompt = `You are a hotel guest experience personalization AI. Based on the following guest data, provide personalized recommendations.

Guest Data:
${JSON.stringify(guestData, null, 2)}

Respond ONLY with a JSON object in this exact format (no markdown, no explanation):
{
  "guest_profile_summary": "<brief summary>",
  "personalization_score": <number between 0 and 100>,
  "room_preferences": {
    "recommended_room_type": "<type>",
    "floor_preference": "<low/mid/high>",
    "special_setup": ["<item 1>", "<item 2>"]
  },
  "service_recommendations": [
    {"service": "<name>", "reason": "<why>", "timing": "<when to offer>", "priority": "<high/medium/low>"}
  ],
  "dining_preferences": ["<preference 1>", "<preference 2>"],
  "communication_style": "<formal/casual/minimal>",
  "loyalty_actions": ["<action 1>", "<action 2>"],
  "avoid": ["<thing to avoid 1>"]
}`;

  return callOpenRouter(prompt, cacheKey, 'personalizeGuestExperience', userId);
}

async function generateUpsellRecommendations(guestData, roomData, userId) {
  const cacheKey = `upsell:${JSON.stringify({ guestData, roomData }).slice(0, 200)}`;
  const prompt = `You are a hotel upsell recommendation AI. Based on the guest and room data, suggest upsell opportunities.

Guest Data:
${JSON.stringify(guestData, null, 2)}

Room Data:
${JSON.stringify(roomData, null, 2)}

Respond ONLY with a JSON object in this exact format (no markdown, no explanation):
{
  "upsell_opportunities": [
    {
      "offer": "<name>",
      "category": "<room_upgrade/dining/spa/experience/amenity>",
      "description": "<details>",
      "price": <number>,
      "success_probability": <number between 0 and 1>,
      "revenue_potential": <number>,
      "best_timing": "<when to present>",
      "pitch": "<suggested sales pitch>"
    }
  ],
  "total_revenue_potential": <number>,
  "top_recommendation": "<best offer name>",
  "guest_spending_propensity": "<low/medium/high>",
  "approach_strategy": "<description>"
}`;

  return callOpenRouter(prompt, cacheKey, 'generateUpsellRecommendations', userId);
}

async function analyzeSentiment(reviewText, userId) {
  const cacheKey = `sentiment:${reviewText.slice(0, 100)}`;
  const prompt = `You are a hotel review sentiment analysis AI. Analyze the following guest review.

Review:
"${reviewText}"

Respond ONLY with a JSON object in this exact format (no markdown, no explanation):
{
  "overall_sentiment": "<positive/neutral/negative>",
  "sentiment_score": <number between -1 and 1>,
  "confidence": <number between 0 and 1>,
  "categories": {
    "cleanliness": {"score": <number -1 to 1>, "mentioned": <boolean>},
    "service": {"score": <number -1 to 1>, "mentioned": <boolean>},
    "location": {"score": <number -1 to 1>, "mentioned": <boolean>},
    "value": {"score": <number -1 to 1>, "mentioned": <boolean>},
    "amenities": {"score": <number -1 to 1>, "mentioned": <boolean>},
    "food": {"score": <number -1 to 1>, "mentioned": <boolean>}
  },
  "key_phrases": ["<phrase 1>", "<phrase 2>"],
  "issues_identified": ["<issue 1>"],
  "praise_points": ["<praise 1>"],
  "suggested_response": "<professional response to the review>",
  "actionable_insights": ["<insight 1>", "<insight 2>"]
}`;

  return callOpenRouter(prompt, cacheKey, 'analyzeSentiment', userId);
}

async function analyzeCompetitors(competitorData, userId) {
  const cacheKey = `competitors:${JSON.stringify(competitorData).slice(0, 200)}`;
  const prompt = `You are a hotel competitive intelligence AI. Analyze the following competitor data and provide strategic recommendations.

Competitor Data:
${JSON.stringify(competitorData, null, 2)}

Respond ONLY with a JSON object in this exact format (no markdown, no explanation):
{
  "competitive_position": "<strong/moderate/weak>",
  "market_summary": "<brief overview of competitive landscape>",
  "rate_analysis": {
    "average_competitor_rate": <number>,
    "our_average_rate": <number>,
    "rate_position": "<below_market/at_market/above_market>",
    "recommended_rate_adjustment": <number positive or negative>
  },
  "competitor_rankings": [
    {"name": "<competitor>", "threat_level": "<high/medium/low>", "key_advantage": "<description>"}
  ],
  "opportunities": ["<opportunity 1>", "<opportunity 2>", "<opportunity 3>"],
  "threats": ["<threat 1>", "<threat 2>"],
  "recommended_actions": [
    {"action": "<description>", "priority": "<high/medium/low>", "expected_impact": "<description>", "timeframe": "<immediate/short-term/long-term>"}
  ],
  "differentiation_strategies": ["<strategy 1>", "<strategy 2>"],
  "price_war_risk": "<low/medium/high>",
  "overall_recommendation": "<strategic summary>"
}`;

  return callOpenRouter(prompt, cacheKey, 'analyzeCompetitors', userId);
}

async function generateForecast(historicalData, userId) {
  const cacheKey = `forecast:${JSON.stringify(historicalData).slice(0, 200)}`;
  const prompt = `You are a hotel demand forecasting and revenue prediction AI. Based on the following historical data, generate forecasts and strategic recommendations.

Historical Data:
${JSON.stringify(historicalData, null, 2)}

Respond ONLY with a JSON object in this exact format (no markdown, no explanation):
{
  "forecast_period": "<description of forecast period>",
  "demand_forecast": {
    "next_7_days": {"predicted_occupancy": <number>, "confidence": <number 0-1>},
    "next_30_days": {"predicted_occupancy": <number>, "confidence": <number 0-1>},
    "next_90_days": {"predicted_occupancy": <number>, "confidence": <number 0-1>}
  },
  "revenue_forecast": {
    "next_7_days": {"predicted_revenue": <number>, "predicted_adr": <number>},
    "next_30_days": {"predicted_revenue": <number>, "predicted_adr": <number>},
    "next_90_days": {"predicted_revenue": <number>, "predicted_adr": <number>}
  },
  "trend_analysis": {
    "occupancy_trend": "<increasing/stable/decreasing>",
    "revenue_trend": "<increasing/stable/decreasing>",
    "adr_trend": "<increasing/stable/decreasing>"
  },
  "seasonal_factors": ["<factor 1>", "<factor 2>"],
  "risk_factors": ["<risk 1>", "<risk 2>"],
  "optimization_strategies": [
    {"strategy": "<description>", "expected_revenue_impact": <number>, "priority": "<high/medium/low>"}
  ],
  "pricing_recommendations": {
    "weekday_adjustment": <number>,
    "weekend_adjustment": <number>,
    "special_event_premium": <number>
  },
  "confidence_score": <number between 0 and 1>,
  "summary": "<brief forecast summary>"
}`;

  return callOpenRouter(prompt, cacheKey, 'generateForecast', userId);
}

async function runRevenueWarRoom(pricingData, competitorData, reservationData, userId) {
  // No cache for war room — always fresh
  const model = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
  const prompt = `You are a hotel revenue strategy AI running a full Revenue War Room analysis. Provide a comprehensive strategy based on all three data sources.

CURRENT PRICING & OCCUPANCY:
${JSON.stringify(pricingData, null, 2)}

COMPETITOR INTELLIGENCE:
${JSON.stringify(competitorData, null, 2)}

DEMAND FORECAST (last 30 days reservations):
${JSON.stringify(reservationData, null, 2)}

Respond ONLY with a JSON object (no markdown):
{
  "executive_summary": "<2-3 sentences>",
  "pricing_analysis": {
    "current_position": "<below/at/above market>",
    "recommended_rate": <number>,
    "rationale": "<explanation>"
  },
  "competitor_analysis": {
    "key_threats": ["<threat1>"],
    "opportunities": ["<opp1>"]
  },
  "demand_forecast": {
    "outlook": "<bullish/neutral/bearish>",
    "peak_periods": ["<period1>"],
    "recommended_actions": ["<action1>"]
  },
  "revenue_strategy": {
    "immediate_actions": ["<action1>", "<action2>"],
    "short_term_tactics": ["<tactic1>", "<tactic2>"],
    "long_term_strategy": "<description>"
  },
  "expected_revenue_impact": <number>,
  "confidence_score": <number 0-1>
}`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorBody}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  let result;
  try {
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    result = jsonMatch ? JSON.parse(jsonMatch[1]) : JSON.parse(content);
  } catch {
    result = { raw_response: content };
  }

  persistAnalysis('revenueWarRoom', result, model, userId);
  return result;
}

async function analyzeGroupBooking(groupData, userId) {
  const model = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
  const prompt = `You are a hotel group booking revenue analyst. Analyze this group event RFP and recommend whether to accept, reject, or counter-propose.

Group Booking Request:
${JSON.stringify(groupData, null, 2)}

Respond ONLY with a JSON object (no markdown):
{
  "recommendation": "accept"|"reject"|"counter",
  "decision_rationale": "<explanation>",
  "displacement_cost": <number>,
  "total_group_revenue": <number>,
  "net_revenue_impact": <number>,
  "counter_proposal": {
    "suggested_rate": <number>,
    "minimum_nights": <number>,
    "f&b_minimum": <number>,
    "special_conditions": ["<condition>"]
  },
  "risk_assessment": "<low/medium/high>",
  "key_concerns": ["<concern1>", "<concern2>"],
  "negotiation_leverage_points": ["<point1>", "<point2>"]
}`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], temperature: 0.7 }),
  });
  if (!response.ok) throw new Error(`OpenRouter error: ${response.status}`);
  const data = await response.json();
  const content = data.choices[0].message.content;
  let result;
  try {
    const m = content.match(/\{[\s\S]*\}/);
    result = m ? JSON.parse(m[0]) : { raw_response: content };
  } catch { result = { raw_response: content }; }
  persistAnalysis('analyzeGroupBooking', result, model, userId);
  return result;
}

async function analyzeGuestLifetimeValue(guestData, stayHistory, userId) {
  const model = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
  const prompt = `You are a hotel guest lifetime value and retention AI analyst.

Guest Profile:
${JSON.stringify(guestData, null, 2)}

Stay History (most recent first):
${JSON.stringify(stayHistory, null, 2)}

Respond ONLY with a JSON object (no markdown):
{
  "ltv_estimate": <number>,
  "repeat_probability_percent": <number 0-100>,
  "guest_tier": "vip"|"loyal"|"occasional"|"at_risk"|"lost",
  "churn_risk": "low"|"medium"|"high",
  "preferred_room_type": "<type>",
  "avg_spend_per_stay": <number>,
  "total_stays": <number>,
  "win_back_campaign": {
    "subject": "<email subject>",
    "offer": "<specific offer>",
    "discount_percent": <number>,
    "best_channel": "email"|"sms"|"phone"
  },
  "retention_actions": ["<action1>", "<action2>"],
  "personalization_opportunities": ["<opportunity1>", "<opportunity2>"]
}`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], temperature: 0.7 }),
  });
  if (!response.ok) throw new Error(`OpenRouter error: ${response.status}`);
  const data = await response.json();
  const content = data.choices[0].message.content;
  let result;
  try {
    const m = content.match(/\{[\s\S]*\}/);
    result = m ? JSON.parse(m[0]) : { raw_response: content };
  } catch { result = { raw_response: content }; }
  persistAnalysis('analyzeGuestLifetimeValue', result, model, userId);
  return result;
}

async function analyzeGuestSegmentation(guests, userId) {
  const cacheKey = `guest-segmentation:${guests.length}:${JSON.stringify(guests.slice(0, 5)).slice(0, 200)}`;
  const prompt = `You are a hotel CRM and revenue analytics AI. Segment the guest base into meaningful cohorts based on lifetime value, stay frequency, channel mix, preferences, and churn risk. Recommend marketing actions per segment.

Guests sample (${guests.length} total, showing up to 60):
${JSON.stringify(guests.slice(0, 60), null, 2)}

Respond ONLY with a JSON object in this exact format (no markdown, no explanation):
{
  "segments": [
    {
      "name": "<short label>",
      "criteria": "<criteria summary>",
      "estimated_size_pct": <number 0-100>,
      "ltv_band": "low|medium|high|vip",
      "churn_risk": "low|medium|high",
      "recommended_actions": ["<action 1>", "<action 2>"],
      "ideal_channels": ["<channel>"]
    }
  ],
  "high_priority_segment": "<name>",
  "summary": "<overall narrative>",
  "next_best_actions": ["<action 1>", "<action 2>", "<action 3>"]
}`;
  return callOpenRouter(prompt, cacheKey, 'analyzeGuestSegmentation', userId);
}

module.exports = {
  analyzeRoomPricing,
  optimizeChannelDistribution,
  personalizeGuestExperience,
  generateUpsellRecommendations,
  analyzeSentiment,
  analyzeCompetitors,
  generateForecast,
  runRevenueWarRoom,
  analyzeGroupBooking,
  analyzeGuestLifetimeValue,
  analyzeGuestSegmentation,
  persistAnalysis,
};
