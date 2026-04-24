import { useState, useEffect, useCallback } from 'react';
import { BarChart3, TrendingUp, Plus, Trash2, X, DollarSign } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Modal from '../components/Modal';
import * as api from '../services/api';

const emptyForm = {
  date: '',
  revenue: '',
  occupancy_rate: '',
  adr: '',
  revpar: '',
  channel: '',
  room_type: '',
  total_bookings: '',
  cancellations: '',
  notes: '',
};

export default function AnalyticsPage() {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [analyticsData, summaryData] = await Promise.all([
        api.getAnalytics(),
        api.getAnalyticsSummary().catch(() => null),
      ]);
      setRecords(Array.isArray(analyticsData) ? analyticsData : analyticsData.data || []);
      if (summaryData) {
        setSummary(summaryData.summary || summaryData.data || summaryData);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const openCreate = () => {
    setForm(emptyForm);
    setShowCreate(true);
  };

  const openDetail = async (record) => {
    try {
      const data = await api.getAnalyticsById(record._id || record.id);
      const detail = data.data || data;
      setSelected(detail);
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
        revenue: Number(form.revenue),
        occupancy_rate: Number(form.occupancy_rate),
        adr: Number(form.adr),
        revpar: Number(form.revpar),
        total_bookings: Number(form.total_bookings),
        cancellations: Number(form.cancellations),
      };
      await api.createAnalytics(payload);
      setShowCreate(false);
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      setSaving(true);
      await api.deleteAnalytics(selected._id || selected.id);
      setSelected(null);
      fetchData();
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

  const formatCurrency = (v) => {
    if (v == null) return '-';
    return '$' + Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const chartData = records
    .slice()
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((r) => ({
      date: r.date ? new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
      revenue: Number(r.revenue) || 0,
      occupancy_rate: Number(r.occupancy_rate) || 0,
    }));

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <h1 className="page-title"><BarChart3 size={28} style={{ verticalAlign: 'middle', marginRight: 8 }} />Revenue Analytics</h1>
          <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> New Record</button>
        </div>
        <p>Track revenue performance and key metrics</p>
      </div>

      {error && <div className="error-message" style={{ color: 'var(--danger)', marginBottom: 16 }}>{error}</div>}

      {/* Summary Cards */}
      {summary && (
        <div className="summary-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          <div className="summary-card" style={{ background: 'var(--bg-card, #fff)', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <DollarSign size={18} style={{ color: 'var(--success, #22c55e)' }} />
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Total Revenue</span>
            </div>
            <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{formatCurrency(summary.total_revenue || summary.totalRevenue)}</p>
          </div>
          <div className="summary-card" style={{ background: 'var(--bg-card, #fff)', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <TrendingUp size={18} style={{ color: 'var(--info, #3b82f6)' }} />
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Avg Occupancy</span>
            </div>
            <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{Number(summary.avg_occupancy || summary.avgOccupancy || 0).toFixed(1)}%</p>
          </div>
          <div className="summary-card" style={{ background: 'var(--bg-card, #fff)', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <DollarSign size={18} style={{ color: 'var(--warning, #f59e0b)' }} />
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Avg ADR</span>
            </div>
            <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{formatCurrency(summary.avg_adr || summary.avgAdr)}</p>
          </div>
          <div className="summary-card" style={{ background: 'var(--bg-card, #fff)', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <BarChart3 size={18} style={{ color: 'var(--purple, #8b5cf6)' }} />
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Avg RevPAR</span>
            </div>
            <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{formatCurrency(summary.avg_revpar || summary.avgRevpar)}</p>
          </div>
        </div>
      )}

      {/* Charts Section */}
      {!loading && chartData.length > 0 && (
        <div className="charts-section" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24, marginBottom: 32 }}>
          <div className="chart-container" style={{ background: 'var(--bg-card, #fff)', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginBottom: 16, fontSize: '1rem', fontWeight: 600 }}>
              <TrendingUp size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              Revenue Trend
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(value) => ['$' + Number(value).toLocaleString(), 'Revenue']} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Revenue ($)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-container" style={{ background: 'var(--bg-card, #fff)', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginBottom: 16, fontSize: '1rem', fontWeight: 600 }}>
              <BarChart3 size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              Occupancy Rate
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} domain={[0, 100]} />
                <Tooltip formatter={(value) => [value + '%', 'Occupancy']} />
                <Legend />
                <Bar dataKey="occupancy_rate" fill="#22c55e" name="Occupancy (%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {loading ? (
        <div className="spinner-container"><div className="spinner loading-spinner" /></div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Revenue</th>
                <th>Occupancy Rate</th>
                <th>ADR</th>
                <th>RevPAR</th>
                <th>Channel</th>
                <th>Room Type</th>
                <th>Bookings</th>
                <th>Cancellations</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40 }}>No analytics records found. Add your first record.</td></tr>
              ) : records.map((r) => (
                <tr key={r._id || r.id} onClick={() => openDetail(r)} style={{ cursor: 'pointer' }}>
                  <td>{formatDate(r.date)}</td>
                  <td>{formatCurrency(r.revenue)}</td>
                  <td>{r.occupancy_rate != null ? Number(r.occupancy_rate).toFixed(1) + '%' : '-'}</td>
                  <td>{formatCurrency(r.adr)}</td>
                  <td>{formatCurrency(r.revpar)}</td>
                  <td>{r.channel || '-'}</td>
                  <td>{r.room_type || '-'}</td>
                  <td>{r.total_bookings ?? '-'}</td>
                  <td>{r.cancellations ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <Modal title="Add Analytics Record" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Date</label>
                <input className="form-input" name="date" type="date" value={form.date} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Revenue ($)</label>
                <input className="form-input" name="revenue" type="number" step="0.01" value={form.revenue} onChange={handleChange} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Occupancy Rate (%)</label>
                <input className="form-input" name="occupancy_rate" type="number" step="0.1" value={form.occupancy_rate} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">ADR ($)</label>
                <input className="form-input" name="adr" type="number" step="0.01" value={form.adr} onChange={handleChange} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">RevPAR ($)</label>
                <input className="form-input" name="revpar" type="number" step="0.01" value={form.revpar} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Channel</label>
                <input className="form-input" name="channel" value={form.channel} onChange={handleChange} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Room Type</label>
                <input className="form-input" name="room_type" value={form.room_type} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Total Bookings</label>
                <input className="form-input" name="total_bookings" type="number" value={form.total_bookings} onChange={handleChange} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Cancellations</label>
                <input className="form-input" name="cancellations" type="number" value={form.cancellations} onChange={handleChange} />
              </div>
              <div className="form-group" />
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-textarea" name="notes" value={form.notes} onChange={handleChange} />
            </div>
            <div className="modal-actions" style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Create Record'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Detail Modal */}
      {selected && (
        <Modal title={`Analytics - ${formatDate(selected.date)}`} onClose={() => setSelected(null)}>
          <div>
            <div className="form-row" style={{ marginBottom: 16 }}>
              <div><span className="form-label">Date</span><p>{formatDate(selected.date)}</p></div>
              <div><span className="form-label">Revenue</span><p>{formatCurrency(selected.revenue)}</p></div>
            </div>
            <div className="form-row" style={{ marginBottom: 16 }}>
              <div><span className="form-label">Occupancy Rate</span><p>{selected.occupancy_rate != null ? Number(selected.occupancy_rate).toFixed(1) + '%' : '-'}</p></div>
              <div><span className="form-label">ADR</span><p>{formatCurrency(selected.adr)}</p></div>
            </div>
            <div className="form-row" style={{ marginBottom: 16 }}>
              <div><span className="form-label">RevPAR</span><p>{formatCurrency(selected.revpar)}</p></div>
              <div><span className="form-label">Channel</span><p>{selected.channel || '-'}</p></div>
            </div>
            <div className="form-row" style={{ marginBottom: 16 }}>
              <div><span className="form-label">Room Type</span><p>{selected.room_type || '-'}</p></div>
              <div><span className="form-label">Total Bookings</span><p>{selected.total_bookings ?? '-'}</p></div>
            </div>
            <div className="form-row" style={{ marginBottom: 16 }}>
              <div><span className="form-label">Cancellations</span><p>{selected.cancellations ?? '-'}</p></div>
              <div />
            </div>
            <div style={{ marginBottom: 24 }}>
              <span className="form-label">Notes</span>
              <p>{selected.notes || 'No notes'}</p>
            </div>
            <div className="modal-actions" style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn btn-danger" onClick={handleDelete} disabled={saving}><Trash2 size={16} /> Delete</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
