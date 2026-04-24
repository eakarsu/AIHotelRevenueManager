import { useState, useEffect, useCallback } from 'react';
import { Calendar, Plus, Edit, Trash2, X, CreditCard } from 'lucide-react';
import Modal from '../components/Modal';
import * as api from '../services/api';

const ROOM_TYPES = ['Standard', 'Deluxe', 'Suite', 'Presidential', 'Penthouse'];
const CHANNELS = ['Direct', 'Booking.com', 'Expedia', 'Hotels.com', 'Airbnb'];
const STATUSES = ['Confirmed', 'Pending', 'Checked In', 'Checked Out', 'Cancelled'];

const statusBadge = {
  Confirmed: 'badge-success',
  Pending: 'badge-warning',
  'Checked In': 'badge-info',
  'Checked Out': 'badge-purple',
  Cancelled: 'badge-danger',
};

const emptyForm = {
  guest_name: '',
  guest_email: '',
  room_number: '',
  room_type: 'Standard',
  check_in: '',
  check_out: '',
  nights: '',
  total_price: '',
  channel: 'Direct',
  status: 'Pending',
  special_requests: '',
};

export default function ReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchReservations = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getReservations();
      setReservations(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const openCreate = () => {
    setForm(emptyForm);
    setShowCreate(true);
  };

  const openDetail = async (reservation) => {
    try {
      const data = await api.getReservation(reservation._id || reservation.id);
      const detail = data.data || data;
      setSelected(detail);
      setForm({
        guest_name: detail.guest_name || '',
        guest_email: detail.guest_email || '',
        room_number: detail.room_number || '',
        room_type: detail.room_type || 'Standard',
        check_in: detail.check_in ? detail.check_in.substring(0, 10) : '',
        check_out: detail.check_out ? detail.check_out.substring(0, 10) : '',
        nights: detail.nights || '',
        total_price: detail.total_price || '',
        channel: detail.channel || 'Direct',
        status: detail.status || 'Pending',
        special_requests: detail.special_requests || '',
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
        nights: Number(form.nights),
        total_price: Number(form.total_price),
      };
      await api.createReservation(payload);
      setShowCreate(false);
      fetchReservations();
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
        nights: Number(form.nights),
        total_price: Number(form.total_price),
      };
      await api.updateReservation(selected._id || selected.id, payload);
      setSelected(null);
      setEditing(false);
      fetchReservations();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this reservation?')) return;
    try {
      setSaving(true);
      await api.deleteReservation(selected._id || selected.id);
      setSelected(null);
      fetchReservations();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
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
          <label className="form-label">Guest Email</label>
          <input className="form-input" name="guest_email" type="email" value={form.guest_email} onChange={handleChange} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Room Number</label>
          <input className="form-input" name="room_number" value={form.room_number} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label className="form-label">Room Type</label>
          <select className="form-select" name="room_type" value={form.room_type} onChange={handleChange}>
            {ROOM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Check-in</label>
          <input className="form-input" name="check_in" type="date" value={form.check_in} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label className="form-label">Check-out</label>
          <input className="form-input" name="check_out" type="date" value={form.check_out} onChange={handleChange} required />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Nights</label>
          <input className="form-input" name="nights" type="number" value={form.nights} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label className="form-label">Total Price ($)</label>
          <input className="form-input" name="total_price" type="number" step="0.01" value={form.total_price} onChange={handleChange} required />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Channel</label>
          <select className="form-select" name="channel" value={form.channel} onChange={handleChange}>
            {CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="form-select" name="status" value={form.status} onChange={handleChange}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Special Requests</label>
        <textarea className="form-textarea" name="special_requests" value={form.special_requests} onChange={handleChange} />
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
          <h1 className="page-title"><Calendar size={28} style={{ verticalAlign: 'middle', marginRight: 8 }} />Reservations</h1>
          <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> New Reservation</button>
        </div>
        <p>Manage hotel reservations and bookings</p>
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
                <th>Room Number</th>
                <th>Room Type</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Nights</th>
                <th>Total Price</th>
                <th>Channel</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {reservations.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40 }}>No reservations found. Add your first reservation.</td></tr>
              ) : reservations.map((r) => (
                <tr key={r._id || r.id} onClick={() => openDetail(r)} style={{ cursor: 'pointer' }}>
                  <td><strong>{r.guest_name}</strong></td>
                  <td>{r.room_number}</td>
                  <td>{r.room_type}</td>
                  <td>{formatDate(r.check_in)}</td>
                  <td>{formatDate(r.check_out)}</td>
                  <td>{r.nights}</td>
                  <td>${Number(r.total_price).toFixed(2)}</td>
                  <td>{r.channel}</td>
                  <td><span className={`badge ${statusBadge[r.status] || 'badge-neutral'}`}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <Modal title="New Reservation" onClose={() => setShowCreate(false)}>
          {renderForm(handleCreate, 'Create Reservation')}
        </Modal>
      )}

      {/* Detail / Edit Modal */}
      {selected && (
        <Modal title={editing ? 'Edit Reservation' : `Reservation - ${selected.guest_name}`} onClose={() => { setSelected(null); setEditing(false); }}>
          {editing ? (
            renderForm(handleUpdate, 'Update Reservation')
          ) : (
            <div>
              <div className="form-row" style={{ marginBottom: 16 }}>
                <div><span className="form-label">Guest Name</span><p>{selected.guest_name}</p></div>
                <div><span className="form-label">Guest Email</span><p>{selected.guest_email || '-'}</p></div>
              </div>
              <div className="form-row" style={{ marginBottom: 16 }}>
                <div><span className="form-label">Room Number</span><p>{selected.room_number}</p></div>
                <div><span className="form-label">Room Type</span><p>{selected.room_type}</p></div>
              </div>
              <div className="form-row" style={{ marginBottom: 16 }}>
                <div><span className="form-label">Check-in</span><p>{formatDate(selected.check_in)}</p></div>
                <div><span className="form-label">Check-out</span><p>{formatDate(selected.check_out)}</p></div>
              </div>
              <div className="form-row" style={{ marginBottom: 16 }}>
                <div><span className="form-label">Nights</span><p>{selected.nights}</p></div>
                <div><span className="form-label">Total Price</span><p>${Number(selected.total_price).toFixed(2)}</p></div>
              </div>
              <div className="form-row" style={{ marginBottom: 16 }}>
                <div><span className="form-label">Channel</span><p>{selected.channel}</p></div>
                <div><span className="form-label">Status</span><p><span className={`badge ${statusBadge[selected.status] || 'badge-neutral'}`}>{selected.status}</span></p></div>
              </div>
              <div style={{ marginBottom: 24 }}>
                <span className="form-label">Special Requests</span>
                <p>{selected.special_requests || 'None'}</p>
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
