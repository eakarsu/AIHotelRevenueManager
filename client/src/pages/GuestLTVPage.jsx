import { useState } from 'react';
import { Heart, AlertCircle, TrendingUp } from 'lucide-react';

function Stat({ label, value, color }) {
  return (
    <div style={{ padding: '12px 16px', background: '#F8FAFC', borderRadius: 8 }}>
      <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: color || '#0F172A' }}>{value}</div>
    </div>
  );
}

function TierBadge({ tier }) {
  const map = {
    vip: { bg: '#fef3c7', color: '#92400e', label: 'VIP' },
    loyal: { bg: '#d1fae5', color: '#065f46', label: 'Loyal' },
    occasional: { bg: '#dbeafe', color: '#1e40af', label: 'Occasional' },
    at_risk: { bg: '#fee2e2', color: '#991b1b', label: 'At Risk' },
    lost: { bg: '#f1f5f9', color: '#64748b', label: 'Lost' },
  };
  const s = map[tier] || map.occasional;
  return (
    <span style={{ padding: '4px 12px', borderRadius: 20, background: s.bg, color: s.color, fontWeight: 700, fontSize: 13 }}>
      {s.label}
    </span>
  );
}

export default function GuestLTVPage() {
  const [guestId, setGuestId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/ai/guest-lifetime-value', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ guest_id: parseInt(guestId) || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setResult(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Heart size={20} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', margin: 0 }}>Guest Lifetime Value Analyzer</h1>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>Predict repeat probability and generate personalized win-back campaigns</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
        <input
          type="number"
          value={guestId}
          onChange={(e) => setGuestId(e.target.value)}
          placeholder="Guest ID (leave blank for general analysis)"
          style={{ flex: 1, padding: '10px 14px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14 }}
        />
        <button type="submit" disabled={loading} style={{
          padding: '10px 24px', borderRadius: 8, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
          background: loading ? '#94A3B8' : '#ec4899', color: '#fff', fontWeight: 700, fontSize: 14,
          whiteSpace: 'nowrap',
        }}>
          {loading ? 'Analyzing...' : 'Analyze Guest LTV'}
        </button>
      </form>

      {error && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '12px 16px', background: '#FEF2F2', borderRadius: 8, marginBottom: 20, color: '#B91C1C', fontSize: 13 }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {result && (
        <div style={{ display: 'grid', gap: 20 }}>
          {/* Overview */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Guest Profile</h3>
              {result.guest_tier && <TierBadge tier={result.guest_tier} />}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              <Stat label="Lifetime Value" value={`$${(result.ltv_estimate || 0).toLocaleString()}`} color="#6366f1" />
              <Stat label="Repeat Probability" value={`${result.repeat_probability_percent || 0}%`} color="#10b981" />
              <Stat label="Avg Spend / Stay" value={`$${(result.avg_spend_per_stay || 0).toLocaleString()}`} />
              <Stat label="Churn Risk" value={result.churn_risk || '-'} color={result.churn_risk === 'high' ? '#DC2626' : result.churn_risk === 'medium' ? '#D97706' : '#16A34A'} />
            </div>
          </div>

          {/* Win-back Campaign */}
          {result.win_back_campaign && (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px', color: '#ec4899' }}>Win-back Campaign</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4, textTransform: 'uppercase' }}>Subject Line</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{result.win_back_campaign.subject}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4, textTransform: 'uppercase' }}>Recommended Channel</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', textTransform: 'capitalize' }}>{result.win_back_campaign.best_channel}</div>
                </div>
              </div>
              <div style={{ padding: 16, background: '#FDF4FF', borderRadius: 8, border: '1px solid #E9D5FF' }}>
                <div style={{ fontSize: 11, color: '#7C3AED', fontWeight: 600, marginBottom: 6 }}>OFFER ({result.win_back_campaign.discount_percent}% off)</div>
                <p style={{ margin: 0, fontSize: 14, color: '#374151' }}>{result.win_back_campaign.offer}</p>
              </div>
            </div>
          )}

          {/* Retention Actions & Personalization */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {result.retention_actions?.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: 20 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 12px', color: '#0F172A' }}>Retention Actions</h4>
                <ul style={{ paddingLeft: 18, margin: 0, fontSize: 13, color: '#475569', lineHeight: 1.7 }}>
                  {result.retention_actions.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </div>
            )}
            {result.personalization_opportunities?.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: 20 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 12px', color: '#0F172A' }}>Personalization Opportunities</h4>
                <ul style={{ paddingLeft: 18, margin: 0, fontSize: 13, color: '#475569', lineHeight: 1.7 }}>
                  {result.personalization_opportunities.map((o, i) => <li key={i}>{o}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {!result && !loading && (
        <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', borderRadius: 12, border: '2px dashed #E2E8F0' }}>
          <div style={{ textAlign: 'center', color: '#94A3B8' }}>
            <Heart size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
            <p style={{ margin: 0, fontSize: 14 }}>Enter a Guest ID to analyze LTV, or leave blank for a general analysis</p>
          </div>
        </div>
      )}
    </div>
  );
}
