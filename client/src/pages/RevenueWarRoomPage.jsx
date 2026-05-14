import { useState, useEffect } from 'react';
import { Zap, RefreshCw, TrendingUp, Users, BarChart2, DollarSign, Clock, CheckCircle } from 'lucide-react';
import * as api from '../services/api';

function InfoCard({ title, icon: Icon, color, children }) {
  return (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: 12,
      border: '1px solid #E2E8F0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      overflow: 'hidden',
    }}>
      <div style={{ background: color, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10, color: '#fff' }}>
        <Icon size={20} />
        <span style={{ fontWeight: 700, fontSize: 15 }}>{title}</span>
      </div>
      <div style={{ padding: '16px 20px', fontSize: 14, color: '#334155', lineHeight: 1.6 }}>
        {children}
      </div>
    </div>
  );
}

function StringList({ items, color }) {
  if (!items || items.length === 0) return <p style={{ color: '#94A3B8' }}>None</p>;
  return (
    <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }}>
      {items.map((item, i) => (
        <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
          <span style={{ color: color || '#0F766E', fontWeight: 700, flexShrink: 0 }}>•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function RevenueWarRoomPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [generatedAt, setGeneratedAt] = useState(null);
  const [applyingPricing, setApplyingPricing] = useState(false);
  const [pricingApplied, setPricingApplied] = useState(null);

  const runAnalysis = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    setPricingApplied(null);
    try {
      const data = await api.runRevenueWarRoom();
      setResult(data.data);
      setGeneratedAt(data.generated_at || new Date().toISOString());
    } catch (err) {
      if (err.message.includes('429') || err.message.toLowerCase().includes('rate limit')) {
        setError('Rate limit reached. You can run 20 AI requests per hour. Please try again later.');
      } else {
        setError('Analysis failed: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const applyPricing = async () => {
    if (!result?.pricing_analysis?.recommended_rate) return;
    setApplyingPricing(true);
    try {
      const rate = result.pricing_analysis.recommended_rate;
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      await api.createPricingRule({
        room_type: 'Standard',
        base_price: rate,
        season: 'ai_dynamic',
        notes: `War Room AI pricing — ${today} to ${tomorrow}`,
      });
      setPricingApplied(rate);
    } catch (err) {
      setError('Failed to apply pricing: ' + err.message);
    } finally {
      setApplyingPricing(false);
    }
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200, margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Zap size={30} color="#F59E0B" /> Revenue War Room
          </h1>
          <p style={{ color: '#64748B', margin: '4px 0 0 0', fontSize: 14 }}>
            3-in-1 AI analysis: pricing, competitors, and demand forecast
          </p>
        </div>
        <button
          onClick={runAnalysis}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 24px',
            backgroundColor: loading ? '#94A3B8' : '#0F172A',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          <RefreshCw size={18} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          {loading ? 'Analyzing...' : result ? 'Run Again' : 'Run Analysis'}
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {error && (
        <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '12px 16px', marginBottom: 20, color: '#DC2626', fontSize: 14 }}>
          {error}
          <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontWeight: 700 }}>Dismiss</button>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748B' }}>
          <div style={{ width: 48, height: 48, border: '3px solid #E2E8F0', borderTopColor: '#0F766E', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ fontSize: 15 }}>Running 3 parallel analyses with AI...</p>
        </div>
      )}

      {result && !loading && (
        <>
          {/* Meta */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
            {generatedAt && (
              <span style={{ fontSize: 12, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={12} /> Generated {new Date(generatedAt).toLocaleString()}
              </span>
            )}
            {result.confidence_score !== undefined && (
              <span style={{ fontSize: 12, fontWeight: 600, backgroundColor: '#DCFCE7', color: '#166534', padding: '2px 10px', borderRadius: 9999 }}>
                {Math.round((result.confidence_score || 0) * 100)}% Confidence
              </span>
            )}
            {result.expected_revenue_impact !== undefined && (
              <span style={{ fontSize: 12, fontWeight: 600, backgroundColor: '#FEF9C3', color: '#854D0E', padding: '2px 10px', borderRadius: 9999 }}>
                Est. Revenue Impact: ${Number(result.expected_revenue_impact).toLocaleString()}
              </span>
            )}
          </div>

          {/* Executive Summary */}
          {result.executive_summary && (
            <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '16px 20px', marginBottom: 24, fontSize: 15, color: '#14532D', lineHeight: 1.6, fontWeight: 500 }}>
              {result.executive_summary}
            </div>
          )}

          {/* 3-panel grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20, marginBottom: 24 }}>
            {/* Pricing */}
            <InfoCard title="Pricing Analysis" icon={DollarSign} color="linear-gradient(135deg, #0F766E, #14B8A6)">
              {result.pricing_analysis && (
                <>
                  <p><strong>Position:</strong> {result.pricing_analysis.current_position || '—'}</p>
                  {result.pricing_analysis.recommended_rate && (
                    <p><strong>Recommended Rate:</strong> <span style={{ color: '#0F766E', fontWeight: 700, fontSize: 18 }}>${result.pricing_analysis.recommended_rate}</span></p>
                  )}
                  {result.pricing_analysis.rationale && (
                    <p style={{ color: '#64748B', fontSize: 13, marginTop: 4 }}>{result.pricing_analysis.rationale}</p>
                  )}
                  {result.pricing_analysis.recommended_rate && (
                    <div style={{ marginTop: 12 }}>
                      {pricingApplied ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#16A34A', fontWeight: 600, fontSize: 13 }}>
                          <CheckCircle size={16} /> Pricing rule created at ${pricingApplied}
                        </div>
                      ) : (
                        <button
                          onClick={applyPricing}
                          disabled={applyingPricing}
                          style={{ padding: '8px 16px', backgroundColor: '#0F766E', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: applyingPricing ? 'not-allowed' : 'pointer' }}
                        >
                          {applyingPricing ? 'Applying...' : 'Apply This Pricing'}
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </InfoCard>

            {/* Competitors */}
            <InfoCard title="Competitor Analysis" icon={Users} color="linear-gradient(135deg, #7C3AED, #A78BFA)">
              {result.competitor_analysis && (
                <>
                  {result.competitor_analysis.key_threats && result.competitor_analysis.key_threats.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <p style={{ fontWeight: 600, color: '#991B1B', marginBottom: 4 }}>Key Threats</p>
                      <StringList items={result.competitor_analysis.key_threats} color="#DC2626" />
                    </div>
                  )}
                  {result.competitor_analysis.opportunities && result.competitor_analysis.opportunities.length > 0 && (
                    <div>
                      <p style={{ fontWeight: 600, color: '#166534', marginBottom: 4 }}>Opportunities</p>
                      <StringList items={result.competitor_analysis.opportunities} color="#16A34A" />
                    </div>
                  )}
                </>
              )}
            </InfoCard>

            {/* Demand Forecast */}
            <InfoCard title="Demand Forecast" icon={TrendingUp} color="linear-gradient(135deg, #0369A1, #38BDF8)">
              {result.demand_forecast && (
                <>
                  <p><strong>Outlook:</strong> <span style={{
                    color: result.demand_forecast.outlook === 'bullish' ? '#16A34A' : result.demand_forecast.outlook === 'bearish' ? '#DC2626' : '#D97706',
                    fontWeight: 700,
                    textTransform: 'capitalize',
                  }}>{result.demand_forecast.outlook || '—'}</span></p>
                  {result.demand_forecast.peak_periods && result.demand_forecast.peak_periods.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <p style={{ fontWeight: 600, marginBottom: 4 }}>Peak Periods</p>
                      <StringList items={result.demand_forecast.peak_periods} />
                    </div>
                  )}
                  {result.demand_forecast.recommended_actions && result.demand_forecast.recommended_actions.length > 0 && (
                    <div>
                      <p style={{ fontWeight: 600, marginBottom: 4 }}>Recommended Actions</p>
                      <StringList items={result.demand_forecast.recommended_actions} />
                    </div>
                  )}
                </>
              )}
            </InfoCard>
          </div>

          {/* Revenue Strategy */}
          {result.revenue_strategy && (
            <div style={{ backgroundColor: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <BarChart2 size={18} color="#0F766E" /> Revenue Strategy
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                {result.revenue_strategy.immediate_actions && result.revenue_strategy.immediate_actions.length > 0 && (
                  <div>
                    <p style={{ fontWeight: 700, color: '#DC2626', marginBottom: 6, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Immediate Actions</p>
                    <StringList items={result.revenue_strategy.immediate_actions} color="#DC2626" />
                  </div>
                )}
                {result.revenue_strategy.short_term_tactics && result.revenue_strategy.short_term_tactics.length > 0 && (
                  <div>
                    <p style={{ fontWeight: 700, color: '#D97706', marginBottom: 6, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Short-term Tactics</p>
                    <StringList items={result.revenue_strategy.short_term_tactics} color="#D97706" />
                  </div>
                )}
                {result.revenue_strategy.long_term_strategy && (
                  <div>
                    <p style={{ fontWeight: 700, color: '#0F766E', marginBottom: 6, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Long-term Strategy</p>
                    <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.6 }}>{result.revenue_strategy.long_term_strategy}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {!result && !loading && !error && (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#94A3B8' }}>
          <Zap size={48} color="#E2E8F0" style={{ marginBottom: 16 }} />
          <p style={{ fontSize: 16, marginBottom: 4 }}>Click "Run Analysis" to start your Revenue War Room session.</p>
          <p style={{ fontSize: 13 }}>AI will analyze pricing, competitors, and demand data in parallel.</p>
        </div>
      )}
    </div>
  );
}
