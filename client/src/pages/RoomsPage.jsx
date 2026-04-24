import { useState, useEffect, useCallback } from 'react';
import { DoorOpen, Plus, Edit, Trash2, X } from 'lucide-react';
import Modal from '../components/Modal';
import * as api from '../services/api';

const ROOM_TYPES = ['Standard', 'Deluxe', 'Suite', 'Presidential', 'Penthouse'];
const STATUSES = ['Available', 'Occupied', 'Maintenance', 'Reserved'];

const statusBadge = {
  Available: 'badge-success',
  Occupied: 'badge-danger',
  Maintenance: 'badge-warning',
  Reserved: 'badge-info',
};

const emptyForm = {
  room_number: '',
  type: 'Standard',
  floor: '',
  capacity: '',
  base_price: '',
  status: 'Available',
  amenities: '',
  description: '',
};

export default function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getRooms();
      setRooms(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const openCreate = () => {
    setForm(emptyForm);
    setShowCreate(true);
  };

  const openDetail = async (room) => {
    try {
      const data = await api.getRoom(room._id || room.id);
      const detail = data.data || data;
      setSelected(detail);
      setForm({
        room_number: detail.room_number || '',
        type: detail.type || 'Standard',
        floor: detail.floor || '',
        capacity: detail.capacity || '',
        base_price: detail.base_price || '',
        status: detail.status || 'Available',
        amenities: Array.isArray(detail.amenities) ? detail.amenities.join(', ') : detail.amenities || '',
        description: detail.description || '',
      });
      setEditing(false);
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
        floor: Number(form.floor),
        capacity: Number(form.capacity),
        base_price: Number(form.base_price),
        amenities: typeof form.amenities === 'string'
          ? form.amenities.split(',').map((s) => s.trim()).filter(Boolean)
          : form.amenities,
      };
      await api.createRoom(payload);
      setShowCreate(false);
      fetchRooms();
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
        floor: Number(form.floor),
        capacity: Number(form.capacity),
        base_price: Number(form.base_price),
        amenities: typeof form.amenities === 'string'
          ? form.amenities.split(',').map((s) => s.trim()).filter(Boolean)
          : form.amenities,
      };
      await api.updateRoom(selected._id || selected.id, payload);
      setSelected(null);
      setEditing(false);
      fetchRooms();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this room?')) return;
    try {
      setSaving(true);
      await api.deleteRoom(selected._id || selected.id);
      setSelected(null);
      fetchRooms();
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
          <label className="form-label">Type</label>
          <select className="form-select" name="type" value={form.type} onChange={handleChange}>
            {ROOM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Floor</label>
          <input className="form-input" name="floor" type="number" value={form.floor} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label className="form-label">Capacity</label>
          <input className="form-input" name="capacity" type="number" value={form.capacity} onChange={handleChange} required />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Base Price ($)</label>
          <input className="form-input" name="base_price" type="number" step="0.01" value={form.base_price} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="form-select" name="status" value={form.status} onChange={handleChange}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Amenities (comma-separated)</label>
        <input className="form-input" name="amenities" value={form.amenities} onChange={handleChange} placeholder="WiFi, TV, Mini Bar" />
      </div>
      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea className="form-textarea" name="description" value={form.description} onChange={handleChange} />
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
          <h1 className="page-title"><DoorOpen size={28} style={{ verticalAlign: 'middle', marginRight: 8 }} />Room Inventory</h1>
          <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> New Room</button>
        </div>
        <p>Manage hotel room inventory and availability</p>
      </div>

      {error && <div className="error-message" style={{ color: 'var(--danger)', marginBottom: 16 }}>{error}</div>}

      {loading ? (
        <div className="spinner-container"><div className="spinner loading-spinner" /></div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Room Number</th>
                <th>Type</th>
                <th>Floor</th>
                <th>Capacity</th>
                <th>Base Price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rooms.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>No rooms found. Add your first room.</td></tr>
              ) : rooms.map((room) => (
                <tr key={room._id || room.id} onClick={() => openDetail(room)} style={{ cursor: 'pointer' }}>
                  <td><strong>{room.room_number}</strong></td>
                  <td>{room.type}</td>
                  <td>{room.floor}</td>
                  <td>{room.capacity}</td>
                  <td>${Number(room.base_price).toFixed(2)}</td>
                  <td><span className={`badge ${statusBadge[room.status] || 'badge-neutral'}`}>{room.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <Modal title="Add New Room" onClose={() => setShowCreate(false)}>
          {renderForm(handleCreate, 'Create Room')}
        </Modal>
      )}

      {/* Detail / Edit Modal */}
      {selected && (
        <Modal title={editing ? 'Edit Room' : `Room ${selected.room_number}`} onClose={() => { setSelected(null); setEditing(false); }}>
          {editing ? (
            renderForm(handleUpdate, 'Update Room')
          ) : (
            <div>
              <div className="form-row" style={{ marginBottom: 16 }}>
                <div><span className="form-label">Room Number</span><p>{selected.room_number}</p></div>
                <div><span className="form-label">Type</span><p>{selected.type}</p></div>
              </div>
              <div className="form-row" style={{ marginBottom: 16 }}>
                <div><span className="form-label">Floor</span><p>{selected.floor}</p></div>
                <div><span className="form-label">Capacity</span><p>{selected.capacity}</p></div>
              </div>
              <div className="form-row" style={{ marginBottom: 16 }}>
                <div><span className="form-label">Base Price</span><p>${Number(selected.base_price).toFixed(2)}</p></div>
                <div><span className="form-label">Status</span><p><span className={`badge ${statusBadge[selected.status] || 'badge-neutral'}`}>{selected.status}</span></p></div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <span className="form-label">Amenities</span>
                <p>{Array.isArray(selected.amenities) ? selected.amenities.join(', ') : selected.amenities || 'None'}</p>
              </div>
              <div style={{ marginBottom: 24 }}>
                <span className="form-label">Description</span>
                <p>{selected.description || 'No description'}</p>
              </div>
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
