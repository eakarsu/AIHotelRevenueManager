import { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Star, Brain, Plus, Edit, Trash2, X } from 'lucide-react';
import Modal from '../components/Modal';
import AIResultDisplay from '../components/AIResultDisplay';
import * as api from '../services/api';

const SENTIMENTS = ['Positive', 'Neutral', 'Negative'];

const sentimentBadge = {
  Positive: 'badge-success',
  Neutral: 'badge-warning',
  Negative: 'badge-danger',
};

const emptyForm = {
  guest_name: '',
  room_number: '',
  rating: '5',
  title: '',
  comment: '',
  sentiment: '',
  stay_date: '',
  response: '',
};

function renderStars(rating) {
  const filled = Number(rating) || 0;
  return (
    <span style={{ letterSpacing: 2 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ color: i < filled ? '#f59e0b' : '#d1d5db' }}>
          {i < filled ? '\u2605' : '\u2606'}
        </span>
      ))}
    </span>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getReviews();
      setReviews(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const openCreate = () => {
    setForm(emptyForm);
    setShowCreate(true);
  };

  const openDetail = async (review) => {
    try {
      const data = await api.getReview(review._id || review.id);
      const detail = data.data || data;
      setSelected(detail);
      setForm({
        guest_name: detail.guest_name || '',
        room_number: detail.room_number || '',
        rating: String(detail.rating || '5'),
        title: detail.title || '',
        comment: detail.comment || '',
        sentiment: detail.sentiment || '',
        stay_date: detail.stay_date ? detail.stay_date.substring(0, 10) : '',
        response: detail.response || '',
      });
      setEditing(false);
      setAiResult(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        ...form,
        rating: Number(form.rating),
      };
      await api.createReview(payload);
      setShowCreate(false);
      fetchReviews();
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
      const payload = {
        ...form,
        rating: Number(form.rating),
      };
      await api.updateReview(selected._id || selected.id, payload);
      setSelected(null);
      setEditing(false);
      fetchReviews();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      setSaving(true);
      await api.deleteReview(selected._id || selected.id);
      setSelected(null);
      fetchReviews();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAiSentiment = async () => {
    try {
      setAiLoading(true);
      setAiResult(null);
      const data = await api.aiSentimentAnalysis(selected._id || selected.id);
      setAiResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString();
  };

  const renderForm = (onSubmit, submitLabel) => (
    <form onSubmit={onSubmit}>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Guest Name</label>
          <input className="form-input" name="guest_name" value={form.guest_name} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label className="form-label">Room Number</label>
          <input className="form-input" name="room_number" value={form.room_number} onChange={handleChange} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Rating</label>
          <select className="form-select" name="rating" value={form.rating} onChange={handleChange}>
            {[1, 2, 3, 4, 5].map((v) => <option key={v} value={v}>{v} Star{v > 1 ? 's' : ''}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Sentiment</label>
          <select className="form-select" name="sentiment" value={form.sentiment} onChange={handleChange}>
            <option value="">-- Select --</option>
            {SENTIMENTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Title</label>
        <input className="form-input" name="title" value={form.title} onChange={handleChange} required />
      </div>
      <div className="form-group">
        <label className="form-label">Comment</label>
        <textarea className="form-textarea" name="comment" value={form.comment} onChange={handleChange} rows={4} />
      </div>
      <div className="form-group">
        <label className="form-label">Stay Date</label>
        <input className="form-input" name="stay_date" type="date" value={form.stay_date} onChange={handleChange} />
      </div>
      <div className="form-group">
        <label className="form-label">Hotel Response</label>
        <textarea className="form-textarea" name="response" value={form.response} onChange={handleChange} rows={3} />
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
          <h1 className="page-title"><MessageSquare size={28} style={{ verticalAlign: 'middle', marginRight: 8 }} />Guest Reviews</h1>
          <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> New Review</button>
        </div>
        <p>Manage guest reviews and AI sentiment analysis</p>
      </div>

      {error && <div className="error-message" style={{ color: 'var(--danger)', marginBottom: 16 }}>{error}</div>}

      {loading ? (
        <div className="spinner-container"><div className="spinner loading-spinner" /></div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Guest Name</th>
                <th>Room</th>
                <th>Rating</th>
                <th>Title</th>
                <th>Sentiment</th>
                <th>Stay Date</th>
              </tr>
            </thead>
            <tbody>
              {reviews.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>No reviews found. Add your first review.</td></tr>
              ) : reviews.map((r) => (
                <tr key={r._id || r.id} onClick={() => openDetail(r)} style={{ cursor: 'pointer' }}>
                  <td><strong>{r.guest_name}</strong></td>
                  <td>{r.room_number || '-'}</td>
                  <td>{renderStars(r.rating)}</td>
                  <td>{r.title}</td>
                  <td>
                    {r.sentiment ? (
                      <span className={`badge ${sentimentBadge[r.sentiment] || 'badge-neutral'}`}>{r.sentiment}</span>
                    ) : (
                      <span className="badge badge-neutral">-</span>
                    )}
                  </td>
                  <td>{formatDate(r.stay_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <Modal title="Add New Review" onClose={() => setShowCreate(false)}>
          {renderForm(handleCreate, 'Create Review')}
        </Modal>
      )}

      {/* Detail / Edit Modal */}
      {selected && (
        <Modal title={editing ? 'Edit Review' : `Review - ${selected.guest_name}`} onClose={() => { setSelected(null); setEditing(false); setAiResult(null); }} large>
          {editing ? (
            renderForm(handleUpdate, 'Update Review')
          ) : (
            <div>
              <div className="form-row" style={{ marginBottom: 16 }}>
                <div><span className="form-label">Guest Name</span><p>{selected.guest_name}</p></div>
                <div><span className="form-label">Room</span><p>{selected.room_number || '-'}</p></div>
              </div>
              <div className="form-row" style={{ marginBottom: 16 }}>
                <div><span className="form-label">Rating</span><p>{renderStars(selected.rating)}</p></div>
                <div><span className="form-label">Sentiment</span>
                  <p>
                    {selected.sentiment ? (
                      <span className={`badge ${sentimentBadge[selected.sentiment] || 'badge-neutral'}`}>{selected.sentiment}</span>
                    ) : (
                      <span className="badge badge-neutral">Not analyzed</span>
                    )}
                  </p>
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <span className="form-label">Title</span>
                <p>{selected.title}</p>
              </div>
              <div style={{ marginBottom: 16 }}>
                <span className="form-label">Comment</span>
                <p style={{ whiteSpace: 'pre-wrap' }}>{selected.comment || 'No comment'}</p>
              </div>
              <div className="form-row" style={{ marginBottom: 16 }}>
                <div><span className="form-label">Stay Date</span><p>{formatDate(selected.stay_date)}</p></div>
                <div />
              </div>
              <div style={{ marginBottom: 24 }}>
                <span className="form-label">Hotel Response</span>
                <p style={{ whiteSpace: 'pre-wrap' }}>{selected.response || 'No response yet'}</p>
              </div>

              {/* AI Sentiment Analysis */}
              <div style={{ marginBottom: 24 }}>
                <button className="btn btn-ai" onClick={handleAiSentiment} disabled={aiLoading}>
                  <Brain size={16} /> {aiLoading ? 'Analyzing...' : 'AI Sentiment Analysis'}
                </button>
              </div>

              {aiResult && <AIResultDisplay data={aiResult} type="sentiment" />}

              <div className="modal-actions" style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button className="btn btn-danger" onClick={handleDelete} disabled={saving}><Trash2 size={16} /> Delete</button>
                <button className="btn btn-primary" onClick={() => setEditing(true)}><Edit size={16} /> Edit</button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
