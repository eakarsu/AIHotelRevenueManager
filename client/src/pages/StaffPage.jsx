import { useState, useEffect, useCallback } from 'react';
import { Users, UserPlus, Edit, Trash2, X } from 'lucide-react';
import Modal from '../components/Modal';
import * as api from '../services/api';

const ROLES = ['Manager', 'Receptionist', 'Housekeeper', 'Concierge', 'Chef', 'Maintenance', 'Security', 'Bellboy'];
const SHIFTS = ['Morning', 'Afternoon', 'Night'];
const STATUSES = ['Active', 'On Leave', 'Off Duty'];

const statusBadge = {
  Active: 'badge-success',
  'On Leave': 'badge-warning',
  'Off Duty': 'badge-danger',
};

const shiftBadge = {
  Morning: 'badge-info',
  Afternoon: 'badge-warning',
  Night: 'badge-purple',
};

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  role: 'Receptionist',
  department: '',
  shift: 'Morning',
  status: 'Active',
  hire_date: '',
  salary: '',
  performance_score: '',
  notes: '',
};

export default function StaffPage() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getStaff();
      setStaff(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const openCreate = () => {
    setForm(emptyForm);
    setShowCreate(true);
  };

  const openDetail = async (member) => {
    try {
      const data = await api.getStaffMember(member._id || member.id);
      const detail = data.data || data;
      setSelected(detail);
      setForm({
        name: detail.name || '',
        email: detail.email || '',
        phone: detail.phone || '',
        role: detail.role || 'Receptionist',
        department: detail.department || '',
        shift: detail.shift || 'Morning',
        status: detail.status || 'Active',
        hire_date: detail.hire_date ? detail.hire_date.slice(0, 10) : '',
        salary: detail.salary || '',
        performance_score: detail.performance_score || '',
        notes: detail.notes || '',
      });
      setEditing(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const buildPayload = () => ({
    ...form,
    salary: form.salary ? Number(form.salary) : undefined,
    performance_score: form.performance_score ? Number(form.performance_score) : undefined,
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.createStaffMember(buildPayload());
      setShowCreate(false);
      fetchStaff();
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
      await api.updateStaffMember(selected._id || selected.id, buildPayload());
      setSelected(null);
      setEditing(false);
      fetchStaff();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this staff member?')) return;
    try {
      setSaving(true);
      await api.deleteStaffMember(selected._id || selected.id);
      setSelected(null);
      fetchStaff();
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
          <label className="form-label">Email</label>
          <input className="form-input" name="email" type="email" value={form.email} onChange={handleChange} required />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Phone</label>
          <input className="form-input" name="phone" value={form.phone} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label className="form-label">Role</label>
          <select className="form-select" name="role" value={form.role} onChange={handleChange}>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Department</label>
          <input className="form-input" name="department" value={form.department} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label className="form-label">Shift</label>
          <select className="form-select" name="shift" value={form.shift} onChange={handleChange}>
            {SHIFTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="form-select" name="status" value={form.status} onChange={handleChange}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Hire Date</label>
          <input className="form-input" name="hire_date" type="date" value={form.hire_date} onChange={handleChange} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Salary ($)</label>
          <input className="form-input" name="salary" type="number" step="0.01" value={form.salary} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label className="form-label">Performance Score (1-100)</label>
          <input className="form-input" name="performance_score" type="number" min="1" max="100" value={form.performance_score} onChange={handleChange} />
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
          <h1 className="page-title"><Users size={28} style={{ verticalAlign: 'middle', marginRight: 8 }} />Staff Management</h1>
          <button className="btn btn-primary" onClick={openCreate}><UserPlus size={16} /> New Staff</button>
        </div>
        <p>Manage hotel staff, roles, and schedules</p>
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
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Shift</th>
                <th>Status</th>
                <th>Performance Score</th>
              </tr>
            </thead>
            <tbody>
              {staff.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}>No staff found. Add your first staff member.</td></tr>
              ) : staff.map((member) => (
                <tr key={member._id || member.id} onClick={() => openDetail(member)} style={{ cursor: 'pointer' }}>
                  <td><strong>{member.name}</strong></td>
                  <td>{member.email}</td>
                  <td>{member.role}</td>
                  <td>{member.department}</td>
                  <td><span className={`badge ${shiftBadge[member.shift] || 'badge-neutral'}`}>{member.shift}</span></td>
                  <td><span className={`badge ${statusBadge[member.status] || 'badge-neutral'}`}>{member.status}</span></td>
                  <td>{member.performance_score != null ? member.performance_score : '--'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <Modal title="Add New Staff Member" onClose={() => setShowCreate(false)}>
          {renderForm(handleCreate, 'Create Staff')}
        </Modal>
      )}

      {/* Detail / Edit Modal */}
      {selected && (
        <Modal title={editing ? 'Edit Staff Member' : selected.name} onClose={() => { setSelected(null); setEditing(false); }}>
          {editing ? (
            renderForm(handleUpdate, 'Update Staff')
          ) : (
            <div>
              <div className="form-row" style={{ marginBottom: 16 }}>
                <div><span className="form-label">Name</span><p>{selected.name}</p></div>
                <div><span className="form-label">Email</span><p>{selected.email}</p></div>
              </div>
              <div className="form-row" style={{ marginBottom: 16 }}>
                <div><span className="form-label">Phone</span><p>{selected.phone || 'N/A'}</p></div>
                <div><span className="form-label">Role</span><p>{selected.role}</p></div>
              </div>
              <div className="form-row" style={{ marginBottom: 16 }}>
                <div><span className="form-label">Department</span><p>{selected.department || 'N/A'}</p></div>
                <div><span className="form-label">Shift</span><p><span className={`badge ${shiftBadge[selected.shift] || 'badge-neutral'}`}>{selected.shift}</span></p></div>
              </div>
              <div className="form-row" style={{ marginBottom: 16 }}>
                <div><span className="form-label">Status</span><p><span className={`badge ${statusBadge[selected.status] || 'badge-neutral'}`}>{selected.status}</span></p></div>
                <div><span className="form-label">Hire Date</span><p>{selected.hire_date ? new Date(selected.hire_date).toLocaleDateString() : 'N/A'}</p></div>
              </div>
              <div className="form-row" style={{ marginBottom: 16 }}>
                <div><span className="form-label">Salary</span><p>{selected.salary ? `$${Number(selected.salary).toLocaleString()}` : 'N/A'}</p></div>
                <div><span className="form-label">Performance Score</span><p>{selected.performance_score != null ? selected.performance_score : 'N/A'}</p></div>
              </div>
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
