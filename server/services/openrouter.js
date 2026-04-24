const fetch = require('node-fetch');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });

async function callOpenRouter(prompt) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL,
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

  try {
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    return JSON.parse(content);
  } catch {
    return { raw_response: content };
  }
}

async function analyzeRoomPricing(roomData) {
  const prompt = `You are a hotel revenue management AI. Analyze the following room data and suggest optimal pricing.

Room Data:
${JSON.stringify(roomData, null, 2)}

Respond ONLY with a JSON object in this exact format (no markdown, no explanation):
{
  "recommended_price": <number>,
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

  return callOpenRouter(prompt);
}

async function optimizeChannelDistribution(channelData) {
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

  return callOpenRouter(prompt);
}

async function personalizeGuestExperience(guestData) {
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

  return callOpenRouter(prompt);
}

async function generateUpsellRecommendations(guestData, roomData) {
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

  return callOpenRouter(prompt);
}

async function analyzeSentiment(reviewText) {
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

  return callOpenRouter(prompt);
}

async function analyzeCompetitors(competitorData) {
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

  return callOpenRouter(prompt);
}

async function generateForecast(historicalData) {
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

  return callOpenRouter(prompt);
}

module.exports = {
  analyzeRoomPricing,
  optimizeChannelDistribution,
  personalizeGuestExperience,
  generateUpsellRecommendations,
  analyzeSentiment,
  analyzeCompetitors,
  generateForecast,
};
