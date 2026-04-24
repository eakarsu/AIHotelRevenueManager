import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Brain, Plus, Trash2, X, Target } from 'lucide-react';
import Modal from '../components/Modal';
import AIResultDisplay from '../components/AIResultDisplay';
import * as api from '../services/api';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const PERIODS = ['Daily', 'Weekly', 'Monthly', 'Quarterly'];

const confidenceBadge = (score) => {
  const n = Number(score);
  if (n > 80) return 'badge-success';
  if (n > 60) return 'badge-info';
  if (n > 40) return 'badge-warning';
  return 'badge-danger';
};

const emptyForm = {
  forecast_date: '',
  period: 'Daily',
  predicted_occupancy: '',
  predicted_revenue: '',
  predicted_adr: '',
  confidence_score: '',
  factors: '',
  actual_occupancy: '',
  actual_revenue: '',
  notes: '',
};

export default function ForecastingPage() {
  const [forecasts, setForecasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const fetchForecasts = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getForecasts();
      setForecasts(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchForecasts();
  }, [fetchForecasts]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const openCreate = () => {
    setForm(emptyForm);
    setShowCreate(true);
  };

  const openDetail = async (forecast) => {
    try {
      const data = await api.getForecast(forecast._id || forecast.id);
      const detail = data.data || data;
      setSelected(detail);
    } catch (err) {
      setError(err.message);
    }
  };

  const buildPayload = () => ({
    ...form,
    predicted_occupancy: form.predicted_occupancy ? Number(form.predicted_occupancy) : undefined,
    predicted_revenue: form.predicted_revenue ? Number(form.predicted_revenue) : undefined,
    predicted_adr: form.predicted_adr ? Number(form.predicted_adr) : undefined,
    confidence_score: form.confidence_score ? Number(form.confidence_score) : undefined,
    actual_occupancy: form.actual_occupancy ? Number(form.actual_occupancy) : undefined,
    actual_revenue: form.actual_revenue ? Number(form.actual_revenue) : undefined,
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.createForecast(buildPayload());
      setShowCreate(false);
      fetchForecasts();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this forecast?')) return;
    try {
      setSaving(true);
      await api.deleteForecast(selected._id || selected.id);
      setSelected(null);
      fetchForecasts();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAiForecast = async () => {
    try {
      setAiLoading(true);
      setAiResult(null);
      const result = await api.aiForecast({ forecasts });
      setAiResult(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const chartData = forecasts
    .filter((f) => f.forecast_date)
    .map((f) => ({
      date: new Date(f.forecast_date).toLocaleDateString(),
      'Predicted Occupancy': f.predicted_occupancy || 0,
      'Actual Occupancy': f.actual_occupancy || 0,
      'Predicted Revenue': f.predicted_revenue || 0,
      'Actual Revenue': f.actual_revenue || 0,
    }));

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <h1 className="page-title"><TrendingUp size={28} style={{ verticalAlign: 'middle', marginRight: 8 }} />Forecasting</h1>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-ai" onClick={handleAiForecast} disabled={aiLoading}>
              <Brain size={16} /> {aiLoading ? 'Generating...' : 'AI Generate Forecast'}
            </button>
            <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> New Forecast</button>
          </div>
        </div>
        <p>AI-powered demand forecasting and predictions</p>
      </div>

      {error && <div className="error-message" style={{ color: 'var(--danger)', marginBottom: 16 }}>{error}</div>}

      {aiLoading && (
        <div className="spinner-container" style={{ marginBottom: 16 }}><div className="spinner loading-spinner" /></div>
      )}
      {aiResult && <div style={{ marginBottom: 24 }}><AIResultDisplay data={aiResult} type="pricing" /></div>}

      {/* Chart Section */}
      {chartData.length > 0 && (
        <div className="card chart-card" style={{ marginBottom: 28 }}>
          <div className="card-header">
            <h3>Predicted vs Actual Occupancy</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="Predicted Occupancy" stroke="#2563eb" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Actual Occupancy" stroke="#16a34a" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {loading ? (
        <div className="spinner-container"><div className="spinner loading-spinner" /></div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Forecast Date</th>
                <th>Period</th>
                <th>Predicted Occupancy</th>
                <th>Predicted Revenue</th>
                <th>Predicted ADR</th>
                <th>Confidence</th>
                <th>Actual Occupancy</th>
                <th>Actual Revenue</th>
                <th>Variance</th>
              </tr>
            </thead>
            <tbody>
              {forecasts.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40 }}>No forecasts found. Create your first forecast or use AI to generate one.</td></tr>
              ) : forecasts.map((f) => {
                const variance = f.actual_occupancy != null && f.predicted_occupancy != null
                  ? (Number(f.actual_occupancy) - Number(f.predicted_occupancy)).toFixed(1)
                  : null;
                return (
                  <tr key={f._id || f.id} onClick={() => openDetail(f)} style={{ cursor: 'pointer' }}>
                    <td><strong>{f.forecast_date ? new Date(f.forecast_date).toLocaleDateString() : '--'}</strong></td>
                    <td>{f.period || '--'}</td>
                    <td>{f.predicted_occupancy != null ? `${f.predicted_occupancy}%` : '--'}</td>
                    <td>{f.predicted_revenue != null ? `$${Number(f.predicted_revenue).toLocaleString()}` : '--'}</td>
                    <td>{f.predicted_adr != null ? `$${Number(f.predicted_adr).toFixed(2)}` : '--'}</td>
                    <td>
                      {f.confidence_score != null ? (
                        <span className={`badge ${confidenceBadge(f.confidence_score)}`}>{f.confidence_score}%</span>
                      ) : '--'}
                    </td>
                    <td>{f.actual_occupancy != null ? `${f.actual_occupancy}%` : '--'}</td>
                    <td>{f.actual_revenue != null ? `$${Number(f.actual_revenue).toLocaleString()}` : '--'}</td>
                    <td>
                      {variance != null ? (
                        <span className={`badge ${Number(variance) >= 0 ? 'badge-success' : 'badge-danger'}`}>
                          {Number(variance) >= 0 ? '+' : ''}{variance}%
                        </span>
                      ) : '--'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <Modal title="New Forecast" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Forecast Date</label>
                <input className="form-input" name="forecast_date" type="date" value={form.forecast_date} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Period</label>
                <select className="form-select" name="period" value={form.period} onChange={handleChange}>
                  {PERIODS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Predicted Occupancy (%)</label>
                <input className="form-input" name="predicted_occupancy" type="number" step="0.1" value={form.predicted_occupancy} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Predicted Revenue ($)</label>
                <input className="form-input" name="predicted_revenue" type="number" step="0.01" value={form.predicted_revenue} onChange={handleChange} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Predicted ADR ($)</label>
                <input className="form-input" name="predicted_adr" type="number" step="0.01" value={form.predicted_adr} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Confidence Score (%)</label>
                <input className="form-input" name="confidence_score" type="number" min="0" max="100" value={form.confidence_score} onChange={handleChange} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Factors</label>
              <textarea className="form-textarea" name="factors" value={form.factors} onChange={handleChange} placeholder="Seasonal trends, events, etc." />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Actual Occupancy (%)</label>
                <input className="form-input" name="actual_occupancy" type="number" step="0.1" value={form.actual_occupancy} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Actual Revenue ($)</label>
                <input className="form-input" name="actual_revenue" type="number" step="0.01" value={form.actual_revenue} onChange={handleChange} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-textarea" name="notes" value={form.notes} onChange={handleChange} />
            </div>
            <div className="modal-actions" style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Create Forecast'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Detail Modal */}
      {selected && (
        <Modal title={`Forecast: ${selected.forecast_date ? new Date(selected.forecast_date).toLocaleDateString() : 'Details'}`} onClose={() => setSelected(null)}>
          <div>
            <div className="form-row" style={{ marginBottom: 16 }}>
              <div><span className="form-label">Forecast Date</span><p>{selected.forecast_date ? new Date(selected.forecast_date).toLocaleDateString() : 'N/A'}</p></div>
              <div><span className="form-label">Period</span><p>{selected.period || 'N/A'}</p></div>
            </div>
            <div className="form-row" style={{ marginBottom: 16 }}>
              <div><span className="form-label">Predicted Occupancy</span><p>{selected.predicted_occupancy != null ? `${selected.predicted_occupancy}%` : 'N/A'}</p></div>
              <div><span className="form-label">Predicted Revenue</span><p>{selected.predicted_revenue != null ? `$${Number(selected.predicted_revenue).toLocaleString()}` : 'N/A'}</p></div>
            </div>
            <div className="form-row" style={{ marginBottom: 16 }}>
              <div><span className="form-label">Predicted ADR</span><p>{selected.predicted_adr != null ? `$${Number(selected.predicted_adr).toFixed(2)}` : 'N/A'}</p></div>
              <div><span className="form-label">Confidence</span><p>{selected.confidence_score != null ? <span className={`badge ${confidenceBadge(selected.confidence_score)}`}>{selected.confidence_score}%</span> : 'N/A'}</p></div>
            </div>
            <div className="form-row" style={{ marginBottom: 16 }}>
              <div><span className="form-label">Actual Occupancy</span><p>{selected.actual_occupancy != null ? `${selected.actual_occupancy}%` : 'N/A'}</p></div>
              <div><span className="form-label">Actual Revenue</span><p>{selected.actual_revenue != null ? `$${Number(selected.actual_revenue).toLocaleString()}` : 'N/A'}</p></div>
            </div>
            {selected.factors && (
              <div style={{ marginBottom: 16 }}>
                <span className="form-label">Factors</span>
                <p>{selected.factors}</p>
              </div>
            )}
            {selected.notes && (
              <div style={{ marginBottom: 16 }}>
                <span className="form-label">Notes</span>
                <p>{selected.notes}</p>
              </div>
            )}
            <div className="modal-actions" style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn btn-danger" onClick={handleDelete} disabled={saving}><Trash2 size={16} /> Delete</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
