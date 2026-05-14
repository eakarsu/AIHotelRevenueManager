import { useState } from 'react';
import { Sparkles, Target, AlertTriangle } from 'lucide-react';
import AIResultDisplay from '../components/AIResultDisplay';

async function postGuestSegmentation(body) {
  const token = localStorage.getItem('token');
  const res = await fetch('/api/guests/ai-segment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(body || {}),
  });
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || 'Request failed');
  return data;
}

export default function GuestSegmentationPage() {
  const [limit, setLimit] = useState(200);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const body = {};
      if (limit) body.limit = Number(limit);
      const data = await postGuestSegmentation(body);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const segmentationData = result?.data || result?.segmentation || result;

  return (
    <div className="page guest-segmentation-page">
      <div className="page-header">
        <div>
          <h1>
            <Target size={28} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            AI Guest Segmentation
          </h1>
          <p>Cohort-level segmentation, churn risk, and recommended actions across your guest base.</p>
        </div>
      </div>

      <div className="card">
        <form onSubmit={submit} style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Guest Sample Size</label>
            <input
              type="number"
              min={10}
              max={500}
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid var(--border, #e5e7eb)', borderRadius: 8, width: 200 }}
            />
            <small style={{ color: 'var(--text-secondary, #6b7280)' }}>Max 500 guests, default 200.</small>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 10, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              background: loading ? '#94a3b8' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white', fontWeight: 600,
            }}
          >
            <Sparkles size={16} />
            {loading ? 'Segmenting...' : 'Run Segmentation'}
          </button>
        </form>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginTop: 16, padding: 12, background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={18} /> {error}
        </div>
      )}

      {loading && (
        <div className="card" style={{ marginTop: 16, textAlign: 'center', padding: 32 }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          <div>AI is segmenting your guest base...</div>
        </div>
      )}

      {!loading && result && (
        <div className="card" style={{ marginTop: 16 }}>
          <h2 style={{ marginTop: 0 }}>Segmentation Result</h2>
          {/* Try to render structured data via AIResultDisplay; otherwise dump JSON */}
          {segmentationData && typeof segmentationData === 'object' ? (
            <AIResultDisplay result={segmentationData} />
          ) : (
            <pre style={{ background: '#0f172a', color: '#e2e8f0', padding: 14, borderRadius: 8, overflow: 'auto', fontSize: 12 }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
