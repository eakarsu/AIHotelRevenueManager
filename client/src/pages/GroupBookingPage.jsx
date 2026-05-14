import { useState } from 'react';
import { Users, TrendingUp, AlertCircle, CheckCircle, DollarSign } from 'lucide-react';
import * as api from '../services/api';

function Badge({ value, greenIf, label }) {
  const isGood = value === greenIf;
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
      background: isGood ? '#dcfce7' : value === 'reject' ? '#fee2e2' : '#fef9c3',
      color: isGood ? '#166534' : value === 'reject' ? '#991b1b' : '#854d0e',
    }}>
      {label || value}
    </span>
  );
}

export default function GroupBookingPage() {
  const [form, setForm] = useState({
    group_size: '',
    event_type: 'corporate meeting',
    start_date: '',
    end_date: '',
    requested_rate: '',
    food_beverage_spend: '',
    ancillary_spend: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/ai/group-booking-optimizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          group_size: parseInt(form.group_size) || 50,
          event_type: form.event_type,
          requested_dates: { start: form.start_date, end: form.end_date },
          requested_rate: parseFloat(form.requested_rate) || 150,
          food_beverage_spend: parseFloat(form.food_beverage_spend) || 0,
          ancillary_spend: parseFloat(form.ancillary_spend) || 0,
          notes: form.notes,
        }),
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

  const inputStyle = {
    width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14,
    boxSizing: 'border-box', outline: 'none',
  };
  const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={20} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', margin: 0 }}>Group Booking Optimizer</h1>
            <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>AI-powered RFP analysis with displacement cost modeling</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
        {/* Form */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginTop: 0, marginBottom: 20 }}>Group RFP Details</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Group Size</label>
                <input name="group_size" type="number" value={form.group_size} onChange={handleChange} placeholder="e.g. 80" style={inputStyle} required />
              </div>
              <div>
                <label style={labelStyle}>Event Type</label>
                <select name="event_type" value={form.event_type} onChange={handleChange} style={inputStyle}>
                  {['corporate meeting', 'wedding', 'conference', 'incentive trip', 'social event', 'sports group', 'tour group'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Check-in Date</label>
                <input name="start_date" type="date" value={form.start_date} onChange={handleChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Check-out Date</label>
                <input name="end_date" type="date" value={form.end_date} onChange={handleChange} style={inputStyle} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Requested Rate/Night ($)</label>
                <input name="requested_rate" type="number" value={form.requested_rate} onChange={handleChange} placeholder="150" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>F&B Spend ($)</label>
                <input name="food_beverage_spend" type="number" value={form.food_beverage_spend} onChange={handleChange} placeholder="5000" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Ancillary Spend ($)</label>
                <input name="ancillary_spend" type="number" value={form.ancillary_spend} onChange={handleChange} placeholder="2000" style={inputStyle} />
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Notes / Special Requirements</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Any special requirements or context..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            {error && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '10px 14px', background: '#FEF2F2', borderRadius: 8, marginBottom: 16, color: '#B91C1C', fontSize: 13 }}>
                <AlertCircle size={14} /> {error}
              </div>
            )}
            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '12px', borderRadius: 8, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              background: loading ? '#94A3B8' : '#6366f1', color: '#fff', fontWeight: 700, fontSize: 15,
            }}>
              {loading ? 'Analyzing RFP...' : 'Analyze Group Booking'}
            </button>
          </form>
        </div>

        {/* Result */}
        <div>
          {result ? (
            <div style={{ display: 'grid', gap: 16 }}>
              {/* Decision */}
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>AI Recommendation</h3>
                  <Badge value={result.recommendation} greenIf="accept" />
                </div>
                <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, margin: 0 }}>{result.decision_rationale}</p>
              </div>

              {/* Financials */}
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px' }}>Financial Analysis</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { label: 'Group Revenue', value: `$${(result.total_group_revenue || 0).toLocaleString()}` },
                    { label: 'Displacement Cost', value: `$${(result.displacement_cost || 0).toLocaleString()}` },
                    { label: 'Net Revenue Impact', value: `$${(result.net_revenue_impact || 0).toLocaleString()}` },
                    { label: 'Risk Level', value: result.risk_assessment || '-' },
                  ].map(item => (
                    <div key={item.label} style={{ padding: 12, background: '#F8FAFC', borderRadius: 8 }}>
                      <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>{item.label}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Counter Proposal */}
              {result.counter_proposal && (
                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: 24 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px' }}>Counter Proposal</h3>
                  <div style={{ fontSize: 14, color: '#475569' }}>
                    <p><strong>Rate:</strong> ${result.counter_proposal.suggested_rate}/night</p>
                    {result.counter_proposal.f_b_minimum && <p><strong>F&B Minimum:</strong> ${result.counter_proposal.f_b_minimum}</p>}
                    {result.counter_proposal.special_conditions?.length > 0 && (
                      <ul style={{ paddingLeft: 18, margin: 0 }}>
                        {result.counter_proposal.special_conditions.map((c, i) => <li key={i}>{c}</li>)}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              {/* Concerns & Leverage */}
              {(result.key_concerns?.length > 0 || result.negotiation_leverage_points?.length > 0) && (
                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: 24 }}>
                  {result.key_concerns?.length > 0 && (
                    <>
                      <h4 style={{ fontSize: 13, fontWeight: 600, color: '#DC2626', margin: '0 0 8px' }}>Key Concerns</h4>
                      <ul style={{ paddingLeft: 18, margin: '0 0 12px', fontSize: 13, color: '#475569' }}>
                        {result.key_concerns.map((c, i) => <li key={i}>{c}</li>)}
                      </ul>
                    </>
                  )}
                  {result.negotiation_leverage_points?.length > 0 && (
                    <>
                      <h4 style={{ fontSize: 13, fontWeight: 600, color: '#16A34A', margin: '0 0 8px' }}>Negotiation Leverage</h4>
                      <ul style={{ paddingLeft: 18, margin: 0, fontSize: 13, color: '#475569' }}>
                        {result.negotiation_leverage_points.map((p, i) => <li key={i}>{p}</li>)}
                      </ul>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div style={{ height: '100%', minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', borderRadius: 12, border: '2px dashed #E2E8F0' }}>
              <div style={{ textAlign: 'center', color: '#94A3B8' }}>
                <Users size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
                <p style={{ margin: 0, fontSize: 14 }}>Fill in the RFP details and run analysis</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
