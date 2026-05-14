import { useState, useEffect, useCallback } from 'react';
import { History, RefreshCw, Brain } from 'lucide-react';
import * as api from '../services/api';

const toolLabels = {
  analyzeRoomPricing: 'Pricing Analysis',
  optimizeChannelDistribution: 'Channel Optimization',
  personalizeGuestExperience: 'Guest Personalization',
  generateUpsellRecommendations: 'Upsell Recommendations',
  analyzeSentiment: 'Sentiment Analysis',
  analyzeCompetitors: 'Competitor Analysis',
  generateForecast: 'Demand Forecast',
  revenueWarRoom: 'Revenue War Room',
};

const toolColors = {
  analyzeRoomPricing: '#0F766E',
  optimizeChannelDistribution: '#0369A1',
  personalizeGuestExperience: '#7C3AED',
  generateUpsellRecommendations: '#D97706',
  analyzeSentiment: '#EC4899',
  analyzeCompetitors: '#DC2626',
  generateForecast: '#16A34A',
  revenueWarRoom: '#0F172A',
};

export default function AIHistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getAIHistory(30);
      setHistory(data.data || []);
    } catch (err) {
      setError('Failed to load AI history: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1000, margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <History size={28} color="#0F766E" /> AI Analysis History
          </h1>
          <p style={{ color: '#64748B', margin: '4px 0 0 0', fontSize: 14 }}>
            Recent AI analyses run across all tools
          </p>
        </div>
        <button
          onClick={fetchHistory}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', backgroundColor: '#0F172A', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {error && (
        <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '12px 16px', marginBottom: 16, color: '#DC2626', fontSize: 14 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748B' }}>
          <div style={{ width: 36, height: 36, border: '3px solid #E2E8F0', borderTopColor: '#0F766E', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p>Loading history...</p>
        </div>
      ) : history.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#94A3B8' }}>
          <Brain size={48} color="#E2E8F0" style={{ marginBottom: 16 }} />
          <p style={{ fontSize: 16 }}>No AI analyses recorded yet.</p>
          <p style={{ fontSize: 13 }}>Run any AI tool to see history here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {history.map((entry) => {
            const label = toolLabels[entry.tool_name] || entry.tool_name || 'Unknown Tool';
            const color = toolColors[entry.tool_name] || '#64748B';
            const isExpanded = expanded === entry.id;

            return (
              <div
                key={entry.id}
                style={{ backgroundColor: '#fff', borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden' }}
              >
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', cursor: 'pointer' }}
                  onClick={() => setExpanded(isExpanded ? null : entry.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#0F172A' }}>{label}</div>
                      <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
                        {new Date(entry.created_at).toLocaleString()}
                        {entry.model && <span style={{ marginLeft: 8, color: '#CBD5E1' }}>{entry.model}</span>}
                      </div>
                    </div>
                  </div>
                  <span style={{ color: '#64748B', fontSize: 18, lineHeight: 1 }}>{isExpanded ? '▲' : '▼'}</span>
                </div>
                {isExpanded && entry.result_preview && (
                  <div style={{ padding: '0 18px 14px', borderTop: '1px solid #F1F5F9' }}>
                    <p style={{ fontSize: 12, color: '#64748B', marginBottom: 6, marginTop: 10 }}>Result Preview (first 500 chars):</p>
                    <pre style={{ margin: 0, fontSize: 12, color: '#334155', backgroundColor: '#F8FAFC', borderRadius: 6, padding: '10px 12px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 200, overflowY: 'auto' }}>
                      {entry.result_preview}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
