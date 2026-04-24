import { useState, useEffect, useCallback } from 'react';
import { Users, UserPlus, Brain, Edit, Trash2, X, Star } from 'lucide-react';
import Modal from '../components/Modal';
import AIResultDisplay from '../components/AIResultDisplay';
import * as api from '../services/api';

const VIP_LEVELS = ['Diamond', 'Platinum', 'Gold', 'Silver', 'Bronze'];

const vipBadgeColor = {
  Diamond: 'purple',
  Platinum: 'blue',
  Gold: 'yellow',
  Silver: 'green',
  Bronze: 'default',
};

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  nationality: '',
  vip_level: 'Bronze',
  total_stays: 0,
  preferences: '',
  notes: '',
};

export default function GuestsPage() {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedGuest, setSelectedGuest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const fetchGuests = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getGuests();
      setGuests(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGuests();
  }, [fetchGuests]);

  const openDetail = async (guest) => {
    try {
      const data = await api.getGuest(guest._id || guest.id);
      setSelectedGuest(data.data || data);
    } catch {
      setSelectedGuest(guest);
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
    const g = selectedGuest;
    let prefs = g.preferences || '';
    if (typeof prefs === 'object') {
      prefs = Array.isArray(prefs) ? prefs.join(', ') : JSON.stringify(prefs);
    }
    setFormData({
      name: g.name || '',
      email: g.email || '',
      phone: g.phone || '',
      nationality: g.nationality || '',
      vip_level: g.vip_level || 'Bronze',
      total_stays: g.total_stays || 0,
      preferences: prefs,
      notes: g.notes || '',
    });
    setIsEditing(true);
    setShowDetailModal(false);
    setShowFormModal(true);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this guest?')) return;
    try {
      await api.deleteGuest(selectedGuest._id || selectedGuest.id);
      setShowDetailModal(false);
      setSelectedGuest(null);
      fetchGuests();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...formData, total_stays: Number(formData.total_stays) };
      // Parse preferences
      if (typeof payload.preferences === 'string' && payload.preferences.trim()) {
        try {
          payload.preferences = JSON.parse(payload.preferences);
        } catch {
          payload.preferences = payload.preferences.split(',').map((s) => s.trim()).filter(Boolean);
        }
      }
      if (isEditing) {
        await api.updateGuest(selectedGuest._id || selectedGuest.id, payload);
      } else {
        await api.createGuest(payload);
      }
      setShowFormModal(false);
      fetchGuests();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAiPersonalize = async () => {
    setAiLoading(true);
    try {
      const result = await api.aiPersonalizeGuest(selectedGuest._id || selectedGuest.id);
      setAiResult(result);
    } catch (err) {
      alert('AI Personalization failed: ' + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const renderPreferences = (prefs) => {
    if (!prefs) return '-';
    let items = [];
    if (Array.isArray(prefs)) {
      items = prefs;
    } else if (typeof prefs === 'string') {
      try {
        const parsed = JSON.parse(prefs);
        items = Array.isArray(parsed) ? parsed : [prefs];
      } catch {
        items = prefs.split(',').map((s) => s.trim()).filter(Boolean);
      }
    } else if (typeof prefs === 'object') {
      items = Object.values(prefs);
    }
    if (items.length === 0) return '-';
    return items.map((tag, i) => (
      <span key={i} className="badge badge-default" style={{ marginRight: 4, marginBottom: 2 }}>
        {String(tag)}
      </span>
    ));
  };

  if (loading) return <div className="page-loading">Loading guests...</div>;
  if (error) return <div className="page-error">Error: {error}</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">
          <Users size={24} />
          Guest Management
        </h1>
        <button className="btn btn-primary" onClick={openCreate}>
          <UserPlus size={16} />
          + New Guest
        </button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Nationality</th>
            <th>VIP Level</th>
            <th>Total Stays</th>
          </tr>
        </thead>
        <tbody>
          {guests.length === 0 ? (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center' }}>No guests found</td>
            </tr>
          ) : (
            guests.map((guest) => (
              <tr key={guest._id || guest.id} onClick={() => openDetail(guest)} style={{ cursor: 'pointer' }}>
                <td>{guest.name}</td>
                <td>{guest.email}</td>
                <td>{guest.phone || '-'}</td>
                <td>{guest.nationality || '-'}</td>
                <td>
                  <span className={`badge badge-${vipBadgeColor[guest.vip_level] || 'default'}`}>
                    {guest.vip_level || 'Bronze'}
                  </span>
                </td>
                <td>{guest.total_stays || 0}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Detail Modal */}
      {showDetailModal && selectedGuest && (
        <Modal title="Guest Details" onClose={() => setShowDetailModal(false)} large>
          <div className="detail-grid">
            <div className="detail-row">
              <span className="detail-label">Name</span>
              <span className="detail-value">{selectedGuest.name}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Email</span>
              <span className="detail-value">{selectedGuest.email}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Phone</span>
              <span className="detail-value">{selectedGuest.phone || '-'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Nationality</span>
              <span className="detail-value">{selectedGuest.nationality || '-'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">VIP Level</span>
              <span className="detail-value">
                <span className={`badge badge-${vipBadgeColor[selectedGuest.vip_level] || 'default'}`}>
                  <Star size={12} /> {selectedGuest.vip_level || 'Bronze'}
                </span>
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Total Stays</span>
              <span className="detail-value">{selectedGuest.total_stays || 0}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Preferences</span>
              <span className="detail-value">{renderPreferences(selectedGuest.preferences)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Notes</span>
              <span className="detail-value">{selectedGuest.notes || '-'}</span>
            </div>
          </div>

          <div className="modal-actions">
            <button className="btn btn-ai" onClick={handleAiPersonalize} disabled={aiLoading}>
              <Brain size={16} />
              {aiLoading ? 'Personalizing...' : 'AI Personalize'}
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

          {aiResult && <AIResultDisplay data={aiResult} type="personalization" />}
        </Modal>
      )}

      {/* Create / Edit Modal */}
      {showFormModal && (
        <Modal title={isEditing ? 'Edit Guest' : 'New Guest'} onClose={() => setShowFormModal(false)}>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Name</label>
                <input className="form-input" name="name" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" name="email" type="email" value={formData.email} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" name="phone" value={formData.phone} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Nationality</label>
                <input className="form-input" name="nationality" value={formData.nationality} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">VIP Level</label>
                <select className="form-select" name="vip_level" value={formData.vip_level} onChange={handleChange}>
                  {VIP_LEVELS.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Total Stays</label>
                <input className="form-input" name="total_stays" type="number" min="0" value={formData.total_stays} onChange={handleChange} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Preferences (comma-separated or JSON)</label>
              <textarea className="form-textarea" name="preferences" value={formData.preferences} onChange={handleChange} rows={3} />
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-textarea" name="notes" value={formData.notes} onChange={handleChange} rows={3} />
            </div>
            <div className="modal-actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : isEditing ? 'Update Guest' : 'Create Guest'}
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
