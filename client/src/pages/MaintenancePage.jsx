import { useState, useEffect, useCallback } from 'react';
import { Wrench, AlertCircle, Plus, Edit, Trash2, X } from 'lucide-react';
import Modal from '../components/Modal';
import * as api from '../services/api';

const CATEGORIES = ['Plumbing', 'Electrical', 'HVAC', 'Furniture', 'Appliance', 'Structural', 'Cosmetic', 'Safety'];
const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];
const STATUSES = ['Open', 'In Progress', 'Awaiting Parts', 'Completed', 'Cancelled'];

const priorityBadge = {
  Critical: 'badge-danger',
  High: 'badge-warning',
  Medium: 'badge-info',
  Low: 'badge-success',
};

const statusBadge = {
  Open: 'badge-warning',
  'In Progress': 'badge-info',
  'Awaiting Parts': 'badge-purple',
  Completed: 'badge-success',
  Cancelled: 'badge-danger',
};

const emptyForm = {
  room_number: '',
  category: 'Plumbing',
  title: '',
  description: '',
  reported_by: '',
  assigned_to: '',
  priority: 'Medium',
  status: 'Open',
  estimated_cost: '',
  actual_cost: '',
  reported_date: '',
  completed_date: '',
  notes: '',
};

export default function MaintenancePage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getMaintenanceRequests();
      setRequests(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const openCreate = () => {
    setForm(emptyForm);
    setShowCreate(true);
  };

  const openDetail = async (req) => {
    try {
      const data = await api.getMaintenanceRequest(req._id || req.id);
      const detail = data.data || data;
      setSelected(detail);
      setForm({
        room_number: detail.room_number || '',
        category: detail.category || 'Plumbing',
        title: detail.title || '',
        description: detail.description || '',
        reported_by: detail.reported_by || '',
        assigned_to: detail.assigned_to || '',
        priority: detail.priority || 'Medium',
        status: detail.status || 'Open',
        estimated_cost: detail.estimated_cost || '',
        actual_cost: detail.actual_cost || '',
        reported_date: detail.reported_date ? detail.reported_date.slice(0, 10) : '',
        completed_date: detail.completed_date ? detail.completed_date.slice(0, 10) : '',
        notes: detail.notes || '',
      });
      setEditing(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const buildPayload = () => ({
    ...form,
    estimated_cost: form.estimated_cost ? Number(form.estimated_cost) : undefined,
    actual_cost: form.actual_cost ? Number(form.actual_cost) : undefined,
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.createMaintenanceRequest(buildPayload());
      setShowCreate(false);
      fetchRequests();
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
      await api.updateMaintenanceRequest(selected._id || selected.id, buildPayload());
      setSelected(null);
      setEditing(false);
      fetchRequests();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this maintenance request?')) return;
    try {
      setSaving(true);
      await api.deleteMaintenanceRequest(selected._id || selected.id);
      setSelected(null);
      fetchRequests();
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
          <label className="form-label">Room Number</label>
          <input className="form-input" name="room_number" value={form.room_number} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label className="form-label">Category</label>
          <select className="form-select" name="category" value={form.category} onChange={handleChange}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Title</label>
        <input className="form-input" name="title" value={form.title} onChange={handleChange} required />
      </div>
      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea className="form-textarea" name="description" value={form.description} onChange={handleChange} />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Reported By</label>
          <input className="form-input" name="reported_by" value={form.reported_by} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label className="form-label">Assigned To</label>
          <input className="form-input" name="assigned_to" value={form.assigned_to} onChange={handleChange} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Priority</label>
          <select className="form-select" name="priority" value={form.priority} onChange={handleChange}>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="form-select" name="status" value={form.status} onChange={handleChange}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Estimated Cost ($)</label>
          <input className="form-input" name="estimated_cost" type="number" step="0.01" value={form.estimated_cost} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label className="form-label">Actual Cost ($)</label>
          <input className="form-input" name="actual_cost" type="number" step="0.01" value={form.actual_cost} onChange={handleChange} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Reported Date</label>
          <input className="form-input" name="reported_date" type="date" value={form.reported_date} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label className="form-label">Completed Date</label>
          <input className="form-input" name="completed_date" type="date" value={form.completed_date} onChange={handleChange} />
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
          <h1 className="page-title"><Wrench size={28} style={{ verticalAlign: 'middle', marginRight: 8 }} />Maintenance Requests</h1>
          <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> New Request</button>
        </div>
        <p>Track and manage hotel maintenance and repair requests</p>
      </div>

      {error && <div className="error-message" style={{ color: 'var(--danger)', marginBottom: 16 }}>{error}</div>}

      {loading ? (
        <div className="spinner-container"><div className="spinner loading-spinner" /></div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Room</th>
                <th>Category</th>
                <th>Title</th>
                <th>Reported By</th>
                <th>Assigned To</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Est. Cost</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40 }}>No maintenance requests found. Create your first request.</td></tr>
              ) : requests.map((req) => (
                <tr key={req._id || req.id} onClick={() => openDetail(req)} style={{ cursor: 'pointer' }}>
                  <td><strong>{req.room_number}</strong></td>
                  <td>{req.category}</td>
                  <td>{req.title}</td>
                  <td>{req.reported_by || '--'}</td>
                  <td>{req.assigned_to || '--'}</td>
                  <td><span className={`badge ${priorityBadge[req.priority] || 'badge-neutral'}`}>{req.priority}</span></td>
                  <td><span className={`badge ${statusBadge[req.status] || 'badge-neutral'}`}>{req.status}</span></td>
                  <td>{req.estimated_cost ? `$${Number(req.estimated_cost).toFixed(2)}` : '--'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <Modal title="New Maintenance Request" onClose={() => setShowCreate(false)}>
          {renderForm(handleCreate, 'Create Request')}
        </Modal>
      )}

      {/* Detail / Edit Modal */}
      {selected && (
        <Modal title={editing ? 'Edit Maintenance Request' : selected.title} onClose={() => { setSelected(null); setEditing(false); }}>
          {editing ? (
            renderForm(handleUpdate, 'Update Request')
          ) : (
            <div>
              <div className="form-row" style={{ marginBottom: 16 }}>
                <div><span className="form-label">Room</span><p>{selected.room_number}</p></div>
                <div><span className="form-label">Category</span><p>{selected.category}</p></div>
              </div>
              <div className="form-row" style={{ marginBottom: 16 }}>
                <div><span className="form-label">Title</span><p>{selected.title}</p></div>
                <div><span className="form-label">Priority</span><p><span className={`badge ${priorityBadge[selected.priority] || 'badge-neutral'}`}>{selected.priority}</span></p></div>
              </div>
              <div className="form-row" style={{ marginBottom: 16 }}>
                <div><span className="form-label">Status</span><p><span className={`badge ${statusBadge[selected.status] || 'badge-neutral'}`}>{selected.status}</span></p></div>
                <div><span className="form-label">Reported By</span><p>{selected.reported_by || 'N/A'}</p></div>
              </div>
              <div className="form-row" style={{ marginBottom: 16 }}>
                <div><span className="form-label">Assigned To</span><p>{selected.assigned_to || 'N/A'}</p></div>
                <div><span className="form-label">Estimated Cost</span><p>{selected.estimated_cost ? `$${Number(selected.estimated_cost).toFixed(2)}` : 'N/A'}</p></div>
              </div>
              <div className="form-row" style={{ marginBottom: 16 }}>
                <div><span className="form-label">Actual Cost</span><p>{selected.actual_cost ? `$${Number(selected.actual_cost).toFixed(2)}` : 'N/A'}</p></div>
                <div><span className="form-label">Reported Date</span><p>{selected.reported_date ? new Date(selected.reported_date).toLocaleDateString() : 'N/A'}</p></div>
              </div>
              <div className="form-row" style={{ marginBottom: 16 }}>
                <div><span className="form-label">Completed Date</span><p>{selected.completed_date ? new Date(selected.completed_date).toLocaleDateString() : 'N/A'}</p></div>
              </div>
              {selected.description && (
                <div style={{ marginBottom: 16 }}>
                  <span className="form-label">Description</span>
                  <p>{selected.description}</p>
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
                <button className="btn btn-primary" onClick={() => setEditing(true)}><Edit size={16} /> Edit</button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
