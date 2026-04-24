import { useState, useEffect, useCallback } from 'react';
import { Gift, TrendingUp, Brain, Plus, Edit, Trash2, X } from 'lucide-react';
import Modal from '../components/Modal';
import AIResultDisplay from '../components/AIResultDisplay';
import * as api from '../services/api';

const CATEGORIES = ['Dining', 'Spa', 'Room Upgrade', 'Experience', 'Service'];

const categoryBadgeColor = {
  Dining: 'yellow',
  Spa: 'purple',
  'Room Upgrade': 'blue',
  Experience: 'green',
  Service: 'default',
};

const emptyForm = {
  name: '',
  category: 'Dining',
  target_segment: '',
  trigger_event: '',
  offer_description: '',
  discount_percent: '',
  revenue_potential: '',
  success_rate: '',
  is_active: true,
};

export default function UpsellsPage() {
  const [upsells, setUpsells] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedUpsell, setSelectedUpsell] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const fetchUpsells = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getUpsells();
      setUpsells(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUpsells();
  }, [fetchUpsells]);

  const openDetail = async (upsell) => {
    try {
      const data = await api.getUpsell(upsell._id || upsell.id);
      setSelectedUpsell(data.data || data);
    } catch {
      setSelectedUpsell(upsell);
    }
    setAiResult(null);
    setShowDetailModal(true);
  };

  const openCreate = () => {
    setFormData(emptyForm);
    setIsEditing(false);
    setShowFormModal(true);
  };

  const openEdit = () => {
    const u = selectedUpsell;
    setFormData({
      name: u.name || '',
      category: u.category || 'Dining',
      target_segment: u.target_segment || '',
      trigger_event: u.trigger_event || '',
      offer_description: u.offer_description || '',
      discount_percent: u.discount_percent ?? '',
      revenue_potential: u.revenue_potential ?? '',
      success_rate: u.success_rate ?? '',
      is_active: u.is_active !== undefined ? u.is_active : true,
    });
    setIsEditing(true);
    setShowDetailModal(false);
    setShowFormModal(true);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this upsell?')) return;
    try {
      await api.deleteUpsell(selectedUpsell._id || selectedUpsell.id);
      setShowDetailModal(false);
      setSelectedUpsell(null);
      fetchUpsells();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        discount_percent: formData.discount_percent !== '' ? Number(formData.discount_percent) : undefined,
        revenue_potential: formData.revenue_potential !== '' ? Number(formData.revenue_potential) : undefined,
        success_rate: formData.success_rate !== '' ? Number(formData.success_rate) : undefined,
      };
      if (isEditing) {
        await api.updateUpsell(selectedUpsell._id || selectedUpsell.id, payload);
      } else {
        await api.createUpsell(payload);
      }
      setShowFormModal(false);
      fetchUpsells();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAiRecommend = async () => {
    setAiLoading(true);
    try {
      const result = await api.aiRecommendUpsells(selectedUpsell);
      setAiResult(result);
    } catch (err) {
      alert('AI Recommendation failed: ' + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const formatCurrency = (val) => {
    if (val === undefined || val === null || val === '') return '-';
    return `$${Number(val).toLocaleString()}`;
  };

  const formatPercent = (val) => {
    if (val === undefined || val === null || val === '') return '-';
    return `${Number(val).toFixed(1)}%`;
  };

  if (loading) return <div className="page-loading">Loading upsells...</div>;
  if (error) return <div className="page-error">Error: {error}</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">
          <Gift size={24} />
          Upsell Recommendations
        </h1>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} />
          + New Upsell
        </button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Target Segment</th>
            <th>Trigger Event</th>
            <th>Revenue Potential</th>
            <th>Success Rate</th>
            <th>Active</th>
          </tr>
        </thead>
        <tbody>
          {upsells.length === 0 ? (
            <tr>
              <td colSpan="7" style={{ textAlign: 'center' }}>No upsells found</td>
            </tr>
          ) : (
            upsells.map((upsell) => (
              <tr key={upsell._id || upsell.id} onClick={() => openDetail(upsell)} style={{ cursor: 'pointer' }}>
                <td>{upsell.name}</td>
                <td>
                  <span className={`badge badge-${categoryBadgeColor[upsell.category] || 'default'}`}>
                    {upsell.category}
                  </span>
                </td>
                <td>{upsell.target_segment || '-'}</td>
                <td>{upsell.trigger_event || '-'}</td>
                <td>{formatCurrency(upsell.revenue_potential)}</td>
                <td>{formatPercent(upsell.success_rate)}</td>
                <td>
                  <span className={`badge badge-${upsell.is_active ? 'green' : 'red'}`}>
                    {upsell.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Detail Modal */}
      {showDetailModal && selectedUpsell && (
        <Modal title="Upsell Details" onClose={() => setShowDetailModal(false)} large>
          <div className="detail-grid">
            <div className="detail-row">
              <span className="detail-label">Name</span>
              <span className="detail-value">{selectedUpsell.name}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Category</span>
              <span className="detail-value">
                <span className={`badge badge-${categoryBadgeColor[selectedUpsell.category] || 'default'}`}>
                  {selectedUpsell.category}
                </span>
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Target Segment</span>
              <span className="detail-value">{selectedUpsell.target_segment || '-'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Trigger Event</span>
              <span className="detail-value">{selectedUpsell.trigger_event || '-'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Offer Description</span>
              <span className="detail-value">{selectedUpsell.offer_description || '-'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Discount</span>
              <span className="detail-value">{selectedUpsell.discount_percent != null ? `${selectedUpsell.discount_percent}%` : '-'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Revenue Potential</span>
              <span className="detail-value">
                <TrendingUp size={14} style={{ marginRight: 4 }} />
                {formatCurrency(selectedUpsell.revenue_potential)}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Success Rate</span>
              <span className="detail-value">{formatPercent(selectedUpsell.success_rate)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Active</span>
              <span className="detail-value">
                <span className={`badge badge-${selectedUpsell.is_active ? 'green' : 'red'}`}>
                  {selectedUpsell.is_active ? 'Active' : 'Inactive'}
                </span>
              </span>
            </div>
          </div>

          <div className="modal-actions">
            <button className="btn btn-ai" onClick={handleAiRecommend} disabled={aiLoading}>
              <Brain size={16} />
              {aiLoading ? 'Analyzing...' : 'AI Recommend'}
            </button>
            <button className="btn btn-primary" onClick={openEdit}>
              <Edit size={16} />
              Edit
            </button>
            <button className="btn btn-danger" onClick={handleDelete}>
              <Trash2 size={16} />
              Delete
            </button>
          </div>

          {aiResult && <AIResultDisplay data={aiResult} type="upsells" />}
        </Modal>
      )}

      {/* Create / Edit Modal */}
      {showFormModal && (
        <Modal title={isEditing ? 'Edit Upsell' : 'New Upsell'} onClose={() => setShowFormModal(false)}>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Name</label>
                <input className="form-input" name="name" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" name="category" value={formData.category} onChange={handleChange}>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Target Segment</label>
                <input className="form-input" name="target_segment" value={formData.target_segment} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Trigger Event</label>
                <input className="form-input" name="trigger_event" value={formData.trigger_event} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Discount %</label>
                <input className="form-input" name="discount_percent" type="number" min="0" max="100" step="0.1" value={formData.discount_percent} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Revenue Potential ($)</label>
                <input className="form-input" name="revenue_potential" type="number" min="0" step="0.01" value={formData.revenue_potential} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Success Rate (%)</label>
                <input className="form-input" name="success_rate" type="number" min="0" max="100" step="0.1" value={formData.success_rate} onChange={handleChange} />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 24 }}>
                <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} id="is_active" />
                <label className="form-label" htmlFor="is_active" style={{ margin: 0 }}>Active</label>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Offer Description</label>
              <textarea className="form-textarea" name="offer_description" value={formData.offer_description} onChange={handleChange} rows={3} />
            </div>
            <div className="modal-actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : isEditing ? 'Update Upsell' : 'Create Upsell'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowFormModal(false)}>
                <X size={16} />
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
