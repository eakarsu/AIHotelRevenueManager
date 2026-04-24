import { useState, useEffect, useCallback } from 'react';
import { Tag, Percent, Plus, Edit, Trash2, X } from 'lucide-react';
import Modal from '../components/Modal';
import * as api from '../services/api';

const TYPES = ['Seasonal', 'Weekend', 'Holiday', 'Early Bird', 'Last Minute', 'Package', 'Loyalty'];

const typeBadge = {
  Seasonal: 'badge-info',
  Weekend: 'badge-purple',
  Holiday: 'badge-danger',
  'Early Bird': 'badge-success',
  'Last Minute': 'badge-warning',
  Package: 'badge-info',
  Loyalty: 'badge-purple',
};

const emptyForm = {
  name: '',
  type: 'Seasonal',
  description: '',
  discount_percent: '',
  min_nights: '',
  max_nights: '',
  valid_from: '',
  valid_until: '',
  applicable_room_types: '',
  promo_code: '',
  is_active: true,
  times_used: '',
  revenue_generated: '',
};

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchPromotions = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getPromotions();
      setPromotions(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const openCreate = () => {
    setForm(emptyForm);
    setShowCreate(true);
  };

  const openDetail = async (promo) => {
    try {
      const data = await api.getPromotion(promo._id || promo.id);
      const detail = data.data || data;
      setSelected(detail);
      setForm({
        name: detail.name || '',
        type: detail.type || 'Seasonal',
        description: detail.description || '',
        discount_percent: detail.discount_percent || '',
        min_nights: detail.min_nights || '',
        max_nights: detail.max_nights || '',
        valid_from: detail.valid_from ? detail.valid_from.slice(0, 10) : '',
        valid_until: detail.valid_until ? detail.valid_until.slice(0, 10) : '',
        applicable_room_types: Array.isArray(detail.applicable_room_types) ? detail.applicable_room_types.join(', ') : detail.applicable_room_types || '',
        promo_code: detail.promo_code || '',
        is_active: detail.is_active !== undefined ? detail.is_active : true,
        times_used: detail.times_used || '',
        revenue_generated: detail.revenue_generated || '',
      });
      setEditing(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const buildPayload = () => ({
    ...form,
    discount_percent: form.discount_percent ? Number(form.discount_percent) : undefined,
    min_nights: form.min_nights ? Number(form.min_nights) : undefined,
    max_nights: form.max_nights ? Number(form.max_nights) : undefined,
    times_used: form.times_used ? Number(form.times_used) : undefined,
    revenue_generated: form.revenue_generated ? Number(form.revenue_generated) : undefined,
    applicable_room_types: typeof form.applicable_room_types === 'string'
      ? form.applicable_room_types.split(',').map((s) => s.trim()).filter(Boolean)
      : form.applicable_room_types,
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.createPromotion(buildPayload());
      setShowCreate(false);
      fetchPromotions();
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
      await api.updatePromotion(selected._id || selected.id, buildPayload());
      setSelected(null);
      setEditing(false);
      fetchPromotions();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this promotion?')) return;
    try {
      setSaving(true);
      await api.deletePromotion(selected._id || selected.id);
      setSelected(null);
      fetchPromotions();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const renderForm = (onSubmit, submitLabel) => (
    <form onSubmit={onSubmit}>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Name</label>
          <input className="form-input" name="name" value={form.name} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label className="form-label">Type</label>
          <select className="form-select" name="type" value={form.type} onChange={handleChange}>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea className="form-textarea" name="description" value={form.description} onChange={handleChange} />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Discount %</label>
          <input className="form-input" name="discount_percent" type="number" step="0.1" value={form.discount_percent} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label className="form-label">Promo Code</label>
          <input className="form-input" name="promo_code" value={form.promo_code} onChange={handleChange} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Min Nights</label>
          <input className="form-input" name="min_nights" type="number" value={form.min_nights} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label className="form-label">Max Nights</label>
          <input className="form-input" name="max_nights" type="number" value={form.max_nights} onChange={handleChange} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Valid From</label>
          <input className="form-input" name="valid_from" type="date" value={form.valid_from} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label className="form-label">Valid Until</label>
          <input className="form-input" name="valid_until" type="date" value={form.valid_until} onChange={handleChange} />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Applicable Room Types (comma-separated)</label>
        <input className="form-input" name="applicable_room_types" value={form.applicable_room_types} onChange={handleChange} placeholder="Standard, Deluxe, Suite" />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Times Used</label>
          <input className="form-input" name="times_used" type="number" value={form.times_used} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label className="form-label">Revenue Generated ($)</label>
          <input className="form-input" name="revenue_generated" type="number" step="0.01" value={form.revenue_generated} onChange={handleChange} />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} />
          Active
        </label>
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
          <h1 className="page-title"><Tag size={28} style={{ verticalAlign: 'middle', marginRight: 8 }} />Promotions & Packages</h1>
          <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> New Promotion</button>
        </div>
        <p>Manage special offers, discounts, and promotional packages</p>
      </div>

      {error && <div className="error-message" style={{ color: 'var(--danger)', marginBottom: 16 }}>{error}</div>}

      {loading ? (
        <div className="spinner-container"><div className="spinner loading-spinner" /></div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Discount %</th>
                <th>Promo Code</th>
                <th>Valid From</th>
                <th>Valid Until</th>
                <th>Times Used</th>
                <th>Active</th>
              </tr>
            </thead>
            <tbody>
              {promotions.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40 }}>No promotions found. Create your first promotion.</td></tr>
              ) : promotions.map((promo) => (
                <tr key={promo._id || promo.id} onClick={() => openDetail(promo)} style={{ cursor: 'pointer' }}>
                  <td><strong>{promo.name}</strong></td>
                  <td><span className={`badge ${typeBadge[promo.type] || 'badge-neutral'}`}>{promo.type}</span></td>
                  <td>{promo.discount_percent}%</td>
                  <td>{promo.promo_code || '--'}</td>
                  <td>{promo.valid_from ? new Date(promo.valid_from).toLocaleDateString() : '--'}</td>
                  <td>{promo.valid_until ? new Date(promo.valid_until).toLocaleDateString() : '--'}</td>
                  <td>{promo.times_used || 0}</td>
                  <td><span className={`badge ${promo.is_active ? 'badge-success' : 'badge-neutral'}`}>{promo.is_active ? 'Yes' : 'No'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <Modal title="New Promotion" onClose={() => setShowCreate(false)}>
          {renderForm(handleCreate, 'Create Promotion')}
        </Modal>
      )}

      {/* Detail / Edit Modal */}
      {selected && (
        <Modal title={editing ? 'Edit Promotion' : selected.name} onClose={() => { setSelected(null); setEditing(false); }}>
          {editing ? (
            renderForm(handleUpdate, 'Update Promotion')
          ) : (
            <div>
              <div className="form-row" style={{ marginBottom: 16 }}>
                <div><span className="form-label">Name</span><p>{selected.name}</p></div>
                <div><span className="form-label">Type</span><p><span className={`badge ${typeBadge[selected.type] || 'badge-neutral'}`}>{selected.type}</span></p></div>
              </div>
              <div className="form-row" style={{ marginBottom: 16 }}>
                <div><span className="form-label">Discount</span><p>{selected.discount_percent}%</p></div>
                <div><span className="form-label">Promo Code</span><p>{selected.promo_code || 'N/A'}</p></div>
              </div>
              <div className="form-row" style={{ marginBottom: 16 }}>
                <div><span className="form-label">Valid From</span><p>{selected.valid_from ? new Date(selected.valid_from).toLocaleDateString() : 'N/A'}</p></div>
                <div><span className="form-label">Valid Until</span><p>{selected.valid_until ? new Date(selected.valid_until).toLocaleDateString() : 'N/A'}</p></div>
              </div>
              <div className="form-row" style={{ marginBottom: 16 }}>
                <div><span className="form-label">Min Nights</span><p>{selected.min_nights || 'N/A'}</p></div>
                <div><span className="form-label">Max Nights</span><p>{selected.max_nights || 'N/A'}</p></div>
              </div>
              <div className="form-row" style={{ marginBottom: 16 }}>
                <div><span className="form-label">Times Used</span><p>{selected.times_used || 0}</p></div>
                <div><span className="form-label">Revenue Generated</span><p>{selected.revenue_generated ? `$${Number(selected.revenue_generated).toLocaleString()}` : 'N/A'}</p></div>
              </div>
              <div className="form-row" style={{ marginBottom: 16 }}>
                <div><span className="form-label">Active</span><p><span className={`badge ${selected.is_active ? 'badge-success' : 'badge-neutral'}`}>{selected.is_active ? 'Yes' : 'No'}</span></p></div>
                <div><span className="form-label">Room Types</span><p>{Array.isArray(selected.applicable_room_types) ? selected.applicable_room_types.join(', ') : selected.applicable_room_types || 'All'}</p></div>
              </div>
              {selected.description && (
                <div style={{ marginBottom: 16 }}>
                  <span className="form-label">Description</span>
                  <p>{selected.description}</p>
                </div>
              )}
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
