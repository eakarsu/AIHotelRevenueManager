import { useState, useEffect, useCallback } from 'react';
import { DollarSign, TrendingUp, Brain, Plus, Edit, Trash2, X } from 'lucide-react';
import Modal from '../components/Modal';
import AIResultDisplay from '../components/AIResultDisplay';
import * as api from '../services/api';

const SEASONS = ['Peak', 'High', 'Regular', 'Low', 'Off-Peak'];
const DAYS = ['All', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Weekday', 'Weekend'];
const ROOM_TYPES = ['Standard', 'Deluxe', 'Suite', 'Presidential', 'Penthouse'];

const emptyForm = {
  room_type: 'Standard',
  base_price: '',
  min_price: '',
  max_price: '',
  season: 'Regular',
  day_of_week: 'All',
  occupancy_threshold: '',
  adjustment_percent: '',
  is_active: true,
  notes: '',
};

export default function PricingPage() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getPricingRules();
      setRules(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const openCreate = () => {
    setForm(emptyForm);
    setShowCreate(true);
  };

  const openDetail = async (rule) => {
    try {
      const data = await api.getPricingRule(rule._id || rule.id);
      const detail = data.data || data;
      setSelected(detail);
      setForm({
        room_type: detail.room_type || 'Standard',
        base_price: detail.base_price || '',
        min_price: detail.min_price || '',
        max_price: detail.max_price || '',
        season: detail.season || 'Regular',
        day_of_week: detail.day_of_week || 'All',
        occupancy_threshold: detail.occupancy_threshold || '',
        adjustment_percent: detail.adjustment_percent || '',
        is_active: detail.is_active !== undefined ? detail.is_active : true,
        notes: detail.notes || '',
      });
      setEditing(false);
      setAiResult(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const buildPayload = () => ({
    ...form,
    base_price: Number(form.base_price),
    min_price: Number(form.min_price),
    max_price: Number(form.max_price),
    occupancy_threshold: form.occupancy_threshold ? Number(form.occupancy_threshold) : undefined,
    adjustment_percent: Number(form.adjustment_percent),
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.createPricingRule(buildPayload());
      setShowCreate(false);
      fetchRules();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.updatePricingRule(selected._id || selected.id, buildPayload());
      setSelected(null);
      setEditing(false);
      fetchRules();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this pricing rule?')) return;
    try {
      setSaving(true);
      await api.deletePricingRule(selected._id || selected.id);
      setSelected(null);
      fetchRules();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAiAnalyze = async () => {
    if (!selected) return;
    try {
      setAiLoading(true);
      setAiResult(null);
      const result = await api.aiAnalyzePricing(selected);
      setAiResult(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const renderForm = (onSubmit, submitLabel) => (
    <form onSubmit={onSubmit}>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Room Type</label>
          <select className="form-select" name="room_type" value={form.room_type} onChange={handleChange}>
            {ROOM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Season</label>
          <select className="form-select" name="season" value={form.season} onChange={handleChange}>
            {SEASONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Base Price ($)</label>
          <input className="form-input" name="base_price" type="number" step="0.01" value={form.base_price} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label className="form-label">Day of Week</label>
          <select className="form-select" name="day_of_week" value={form.day_of_week} onChange={handleChange}>
            {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Min Price ($)</label>
          <input className="form-input" name="min_price" type="number" step="0.01" value={form.min_price} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label className="form-label">Max Price ($)</label>
          <input className="form-input" name="max_price" type="number" step="0.01" value={form.max_price} onChange={handleChange} required />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Occupancy Threshold (%)</label>
          <input className="form-input" name="occupancy_threshold" type="number" value={form.occupancy_threshold} onChange={handleChange} placeholder="e.g. 80" />
        </div>
        <div className="form-group">
          <label className="form-label">Adjustment (%)</label>
          <input className="form-input" name="adjustment_percent" type="number" step="0.1" value={form.adjustment_percent} onChange={handleChange} required />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} />
          Active
        </label>
      </div>
      <div className="form-group">
        <label className="form-label">Notes</label>
        <textarea className="form-textarea" name="notes" value={form.notes} onChange={handleChange} />
      </div>
      <div className="modal-actions" style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-secondary" onClick={() => { setShowCreate(false); setSelected(null); setEditing(false); }}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <h1 className="page-title"><DollarSign size={28} style={{ verticalAlign: 'middle', marginRight: 8 }} />Dynamic Pricing</h1>
          <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> New Rule</button>
        </div>
        <p>Manage AI-powered dynamic pricing rules for room types</p>
      </div>

      {error && <div className="error-message" style={{ color: 'var(--danger)', marginBottom: 16 }}>{error}</div>}

      {loading ? (
        <div className="spinner-container"><div className="spinner loading-spinner" /></div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Room Type</th>
                <th>Base Price</th>
                <th>Min / Max</th>
                <th>Season</th>
                <th>Day of Week</th>
                <th>Adjustment %</th>
                <th>Active</th>
              </tr>
            </thead>
            <tbody>
              {rules.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}>No pricing rules found.</td></tr>
              ) : rules.map((rule) => (
                <tr key={rule._id || rule.id} onClick={() => openDetail(rule)} style={{ cursor: 'pointer' }}>
                  <td><strong>{rule.room_type}</strong></td>
                  <td>${Number(rule.base_price).toFixed(2)}</td>
                  <td>${Number(rule.min_price).toFixed(2)} / ${Number(rule.max_price).toFixed(2)}</td>
                  <td>{rule.season}</td>
                  <td>{rule.day_of_week}</td>
                  <td>
                    <span className={`badge ${Number(rule.adjustment_percent) >= 0 ? 'badge-success' : 'badge-danger'}`}>
                      {Number(rule.adjustment_percent) > 0 ? '+' : ''}{rule.adjustment_percent}%
                    </span>
                  </td>
                  <td><span className={`badge ${rule.is_active ? 'badge-success' : 'badge-neutral'}`}>{rule.is_active ? 'Yes' : 'No'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <Modal title="New Pricing Rule" onClose={() => setShowCreate(false)}>
          {renderForm(handleCreate, 'Create Rule')}
        </Modal>
      )}

      {/* Detail / Edit Modal */}
      {selected && (
        <Modal title={editing ? 'Edit Pricing Rule' : `Pricing: ${selected.room_type} - ${selected.season}`} onClose={() => { setSelected(null); setEditing(false); setAiResult(null); }} large>
          {editing ? (
            renderForm(handleUpdate, 'Update Rule')
          ) : (
            <div>
              <div className="form-row" style={{ marginBottom: 16 }}>
                <div><span className="form-label">Room Type</span><p>{selected.room_type}</p></div>
                <div><span className="form-label">Season</span><p>{selected.season}</p></div>
              </div>
              <div className="form-row" style={{ marginBottom: 16 }}>
                <div><span className="form-label">Base Price</span><p>${Number(selected.base_price).toFixed(2)}</p></div>
                <div><span className="form-label">Day of Week</span><p>{selected.day_of_week}</p></div>
              </div>
              <div className="form-row" style={{ marginBottom: 16 }}>
                <div><span className="form-label">Min Price</span><p>${Number(selected.min_price).toFixed(2)}</p></div>
                <div><span className="form-label">Max Price</span><p>${Number(selected.max_price).toFixed(2)}</p></div>
              </div>
              <div className="form-row" style={{ marginBottom: 16 }}>
                <div><span className="form-label">Occupancy Threshold</span><p>{selected.occupancy_threshold ? `${selected.occupancy_threshold}%` : 'N/A'}</p></div>
                <div><span className="form-label">Adjustment</span><p><span className={`badge ${Number(selected.adjustment_percent) >= 0 ? 'badge-success' : 'badge-danger'}`}>{Number(selected.adjustment_percent) > 0 ? '+' : ''}{selected.adjustment_percent}%</span></p></div>
              </div>
              <div className="form-row" style={{ marginBottom: 16 }}>
                <div><span className="form-label">Active</span><p><span className={`badge ${selected.is_active ? 'badge-success' : 'badge-neutral'}`}>{selected.is_active ? 'Yes' : 'No'}</span></p></div>
              </div>
              {selected.notes && (
                <div style={{ marginBottom: 16 }}>
                  <span className="form-label">Notes</span>
                  <p>{selected.notes}</p>
                </div>
              )}

              <div className="modal-actions" style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginBottom: aiResult ? 24 : 0 }}>
                <button className="btn btn-danger" onClick={handleDelete} disabled={saving}><Trash2 size={16} /> Delete</button>
                <button className="btn btn-ai" onClick={handleAiAnalyze} disabled={aiLoading}>
                  <Brain size={16} /> {aiLoading ? 'Analyzing...' : 'AI Analyze'}
                </button>
                <button className="btn btn-primary" onClick={() => setEditing(true)}><Edit size={16} /> Edit</button>
              </div>

              {aiLoading && (
                <div className="spinner-container"><div className="spinner loading-spinner" /></div>
              )}
              {aiResult && <AIResultDisplay data={aiResult} type="pricing" />}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
