import { useState, useEffect, useCallback } from 'react';
import { Building2, TrendingUp, Brain, Plus, Edit, Trash2, X, Star } from 'lucide-react';
import Modal from '../components/Modal';
import AIResultDisplay from '../components/AIResultDisplay';
import * as api from '../services/api';

const emptyForm = {
  name: '',
  location: '',
  star_rating: '',
  avg_rate: '',
  our_rate: '',
  occupancy_estimate: '',
  strengths: '',
  weaknesses: '',
  last_checked: '',
  source: '',
  notes: '',
};

export default function CompetitorsPage() {
  const [competitors, setCompetitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const fetchCompetitors = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getCompetitors();
      setCompetitors(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompetitors();
  }, [fetchCompetitors]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const openCreate = () => {
    setForm(emptyForm);
    setShowCreate(true);
  };

  const openDetail = async (comp) => {
    try {
      const data = await api.getCompetitor(comp._id || comp.id);
      const detail = data.data || data;
      setSelected(detail);
      setForm({
        name: detail.name || '',
        location: detail.location || '',
        star_rating: detail.star_rating || '',
        avg_rate: detail.avg_rate || '',
        our_rate: detail.our_rate || '',
        occupancy_estimate: detail.occupancy_estimate || '',
        strengths: detail.strengths || '',
        weaknesses: detail.weaknesses || '',
        last_checked: detail.last_checked ? detail.last_checked.slice(0, 10) : '',
        source: detail.source || '',
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
    star_rating: form.star_rating ? Number(form.star_rating) : undefined,
    avg_rate: form.avg_rate ? Number(form.avg_rate) : undefined,
    our_rate: form.our_rate ? Number(form.our_rate) : undefined,
    occupancy_estimate: form.occupancy_estimate ? Number(form.occupancy_estimate) : undefined,
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.createCompetitor(buildPayload());
      setShowCreate(false);
      fetchCompetitors();
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
      await api.updateCompetitor(selected._id || selected.id, buildPayload());
      setSelected(null);
      setEditing(false);
      fetchCompetitors();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this competitor?')) return;
    try {
      setSaving(true);
      await api.deleteCompetitor(selected._id || selected.id);
      setSelected(null);
      fetchCompetitors();
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
      const result = await api.aiAnalyzeCompetitors(selected);
      setAiResult(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star key={i} size={14} style={{ color: i <= rating ? '#f59e0b' : '#d1d5db', fill: i <= rating ? '#f59e0b' : 'none' }} />
      );
    }
    return <span style={{ display: 'inline-flex', gap: 2 }}>{stars}</span>;
  };

  const renderForm = (onSubmit, submitLabel) => (
    <form onSubmit={onSubmit}>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Hotel Name</label>
          <input className="form-input" name="name" value={form.name} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label className="form-label">Location</label>
          <input className="form-input" name="location" value={form.location} onChange={handleChange} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Star Rating (1-5)</label>
          <input className="form-input" name="star_rating" type="number" min="1" max="5" value={form.star_rating} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label className="form-label">Avg Rate ($)</label>
          <input className="form-input" name="avg_rate" type="number" step="0.01" value={form.avg_rate} onChange={handleChange} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Our Rate ($)</label>
          <input className="form-input" name="our_rate" type="number" step="0.01" value={form.our_rate} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label className="form-label">Occupancy Estimate (%)</label>
          <input className="form-input" name="occupancy_estimate" type="number" value={form.occupancy_estimate} onChange={handleChange} />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Strengths</label>
        <textarea className="form-textarea" name="strengths" value={form.strengths} onChange={handleChange} />
      </div>
      <div className="form-group">
        <label className="form-label">Weaknesses</label>
        <textarea className="form-textarea" name="weaknesses" value={form.weaknesses} onChange={handleChange} />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Last Checked</label>
          <input className="form-input" name="last_checked" type="date" value={form.last_checked} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label className="form-label">Source</label>
          <input className="form-input" name="source" value={form.source} onChange={handleChange} />
        </div>
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
          <h1 className="page-title"><Building2 size={28} style={{ verticalAlign: 'middle', marginRight: 8 }} />Competitor Analysis</h1>
          <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> New Competitor</button>
        </div>
        <p>Track and analyze competitor pricing and positioning</p>
      </div>

      {error && <div className="error-message" style={{ color: 'var(--danger)', marginBottom: 16 }}>{error}</div>}

      {loading ? (
        <div className="spinner-container"><div className="spinner loading-spinner" /></div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Hotel Name</th>
                <th>Location</th>
                <th>Star Rating</th>
                <th>Avg Rate</th>
                <th>Our Rate</th>
                <th>Rate Diff</th>
                <th>Occupancy Est.</th>
              </tr>
            </thead>
            <tbody>
              {competitors.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}>No competitors found. Add your first competitor.</td></tr>
              ) : competitors.map((comp) => {
                const diff = comp.our_rate && comp.avg_rate ? Number(comp.avg_rate) - Number(comp.our_rate) : null;
                return (
                  <tr key={comp._id || comp.id} onClick={() => openDetail(comp)} style={{ cursor: 'pointer' }}>
                    <td><strong>{comp.name}</strong></td>
                    <td>{comp.location || '--'}</td>
                    <td>{renderStars(comp.star_rating || 0)}</td>
                    <td>{comp.avg_rate ? `$${Number(comp.avg_rate).toFixed(2)}` : '--'}</td>
                    <td>{comp.our_rate ? `$${Number(comp.our_rate).toFixed(2)}` : '--'}</td>
                    <td>
                      {diff != null ? (
                        <span className={`badge ${diff >= 0 ? 'badge-success' : 'badge-danger'}`}>
                          {diff >= 0 ? '+' : ''}{diff.toFixed(2)}
                        </span>
                      ) : '--'}
                    </td>
                    <td>{comp.occupancy_estimate != null ? `${comp.occupancy_estimate}%` : '--'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <Modal title="Add New Competitor" onClose={() => setShowCreate(false)}>
          {renderForm(handleCreate, 'Create Competitor')}
        </Modal>
      )}

      {/* Detail / Edit Modal */}
      {selected && (
        <Modal title={editing ? 'Edit Competitor' : selected.name} onClose={() => { setSelected(null); setEditing(false); setAiResult(null); }} large>
          {editing ? (
            renderForm(handleUpdate, 'Update Competitor')
          ) : (
            <div>
              <div className="form-row" style={{ marginBottom: 16 }}>
                <div><span className="form-label">Hotel Name</span><p>{selected.name}</p></div>
                <div><span className="form-label">Location</span><p>{selected.location || 'N/A'}</p></div>
              </div>
              <div className="form-row" style={{ marginBottom: 16 }}>
                <div><span className="form-label">Star Rating</span><p>{renderStars(selected.star_rating || 0)}</p></div>
                <div><span className="form-label">Occupancy Estimate</span><p>{selected.occupancy_estimate != null ? `${selected.occupancy_estimate}%` : 'N/A'}</p></div>
              </div>
              <div className="form-row" style={{ marginBottom: 16 }}>
                <div><span className="form-label">Avg Rate</span><p>{selected.avg_rate ? `$${Number(selected.avg_rate).toFixed(2)}` : 'N/A'}</p></div>
                <div><span className="form-label">Our Rate</span><p>{selected.our_rate ? `$${Number(selected.our_rate).toFixed(2)}` : 'N/A'}</p></div>
              </div>
              {selected.strengths && (
                <div style={{ marginBottom: 16 }}>
                  <span className="form-label">Strengths</span>
                  <p>{selected.strengths}</p>
                </div>
              )}
              {selected.weaknesses && (
                <div style={{ marginBottom: 16 }}>
                  <span className="form-label">Weaknesses</span>
                  <p>{selected.weaknesses}</p>
                </div>
              )}
              <div className="form-row" style={{ marginBottom: 16 }}>
                <div><span className="form-label">Last Checked</span><p>{selected.last_checked ? new Date(selected.last_checked).toLocaleDateString() : 'N/A'}</p></div>
                <div><span className="form-label">Source</span><p>{selected.source || 'N/A'}</p></div>
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
                  <Brain size={16} /> {aiLoading ? 'Analyzing...' : 'AI Competitive Analysis'}
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
