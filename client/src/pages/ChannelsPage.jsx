import { useState, useEffect, useCallback } from 'react';
import { Share2, Globe, Brain, Plus, Edit, Trash2, X } from 'lucide-react';
import Modal from '../components/Modal';
import AIResultDisplay from '../components/AIResultDisplay';
import * as api from '../services/api';

const emptyForm = {
  name: '',
  commission_rate: '',
  is_active: true,
  priority: '',
  allocation_percent: '',
  avg_booking_value: '',
  performance_score: '',
  contract_end: '',
  notes: '',
};

export default function ChannelsPage() {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const fetchChannels = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getChannels();
      setChannels(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const openCreate = () => {
    setForm(emptyForm);
    setShowCreate(true);
  };

  const openDetail = async (channel) => {
    try {
      const data = await api.getChannel(channel._id || channel.id);
      const detail = data.data || data;
      setSelected(detail);
      setForm({
        name: detail.name || '',
        commission_rate: detail.commission_rate || '',
        is_active: detail.is_active !== undefined ? detail.is_active : true,
        priority: detail.priority || '',
        allocation_percent: detail.allocation_percent || '',
        avg_booking_value: detail.avg_booking_value || '',
        performance_score: detail.performance_score || '',
        contract_end: detail.contract_end ? detail.contract_end.slice(0, 10) : '',
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
    commission_rate: Number(form.commission_rate),
    priority: form.priority ? Number(form.priority) : undefined,
    allocation_percent: Number(form.allocation_percent),
    avg_booking_value: form.avg_booking_value ? Number(form.avg_booking_value) : undefined,
    performance_score: form.performance_score ? Number(form.performance_score) : undefined,
    contract_end: form.contract_end || undefined,
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.createChannel(buildPayload());
      setShowCreate(false);
      fetchChannels();
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
      await api.updateChannel(selected._id || selected.id, buildPayload());
      setSelected(null);
      setEditing(false);
      fetchChannels();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this channel?')) return;
    try {
      setSaving(true);
      await api.deleteChannel(selected._id || selected.id);
      setSelected(null);
      fetchChannels();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAiOptimize = async () => {
    if (!selected) return;
    try {
      setAiLoading(true);
      setAiResult(null);
      const result = await api.aiOptimizeChannels(selected);
      setAiResult(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const renderForm = (onSubmit, submitLabel) => (
    <form onSubmit={onSubmit}>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Channel Name</label>
          <input className="form-input" name="name" value={form.name} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label className="form-label">Commission Rate (%)</label>
          <input className="form-input" name="commission_rate" type="number" step="0.1" value={form.commission_rate} onChange={handleChange} required />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Priority</label>
          <input className="form-input" name="priority" type="number" value={form.priority} onChange={handleChange} placeholder="1 = highest" />
        </div>
        <div className="form-group">
          <label className="form-label">Allocation (%)</label>
          <input className="form-input" name="allocation_percent" type="number" step="0.1" value={form.allocation_percent} onChange={handleChange} required />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Avg Booking Value ($)</label>
          <input className="form-input" name="avg_booking_value" type="number" step="0.01" value={form.avg_booking_value} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label className="form-label">Performance Score</label>
          <input className="form-input" name="performance_score" type="number" step="0.1" min="0" max="100" value={form.performance_score} onChange={handleChange} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Contract End Date</label>
          <input className="form-input" name="contract_end" type="date" value={form.contract_end} onChange={handleChange} />
        </div>
        <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 20 }}>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 0 }}>
            <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} />
            Active
          </label>
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

  const scoreColor = (score) => {
    const s = Number(score);
    if (s >= 80) return 'badge-success';
    if (s >= 60) return 'badge-info';
    if (s >= 40) return 'badge-warning';
    return 'badge-danger';
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <h1 className="page-title"><Share2 size={28} style={{ verticalAlign: 'middle', marginRight: 8 }} />Channel Distribution</h1>
          <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> New Channel</button>
        </div>
        <p>Manage and optimize distribution channel performance</p>
      </div>

      {error && <div className="error-message" style={{ color: 'var(--danger)', marginBottom: 16 }}>{error}</div>}

      {loading ? (
        <div className="spinner-container"><div className="spinner loading-spinner" /></div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Channel Name</th>
                <th>Commission Rate</th>
                <th>Allocation %</th>
                <th>Avg Booking Value</th>
                <th>Performance Score</th>
                <th>Active</th>
              </tr>
            </thead>
            <tbody>
              {channels.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>No channels found. Add your first channel.</td></tr>
              ) : channels.map((ch) => (
                <tr key={ch._id || ch.id} onClick={() => openDetail(ch)} style={{ cursor: 'pointer' }}>
                  <td><strong><Globe size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />{ch.name}</strong></td>
                  <td>{ch.commission_rate}%</td>
                  <td>{ch.allocation_percent}%</td>
                  <td>{ch.avg_booking_value ? `$${Number(ch.avg_booking_value).toFixed(2)}` : 'N/A'}</td>
                  <td>
                    {ch.performance_score != null ? (
                      <span className={`badge ${scoreColor(ch.performance_score)}`}>{ch.performance_score}</span>
                    ) : 'N/A'}
                  </td>
                  <td><span className={`badge ${ch.is_active ? 'badge-success' : 'badge-neutral'}`}>{ch.is_active ? 'Yes' : 'No'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <Modal title="Add New Channel" onClose={() => setShowCreate(false)}>
          {renderForm(handleCreate, 'Create Channel')}
        </Modal>
      )}

      {/* Detail / Edit Modal */}
      {selected && (
        <Modal title={editing ? 'Edit Channel' : selected.name} onClose={() => { setSelected(null); setEditing(false); setAiResult(null); }} large>
          {editing ? (
            renderForm(handleUpdate, 'Update Channel')
          ) : (
            <div>
              <div className="form-row" style={{ marginBottom: 16 }}>
                <div><span className="form-label">Channel Name</span><p>{selected.name}</p></div>
                <div><span className="form-label">Commission Rate</span><p>{selected.commission_rate}%</p></div>
              </div>
              <div className="form-row" style={{ marginBottom: 16 }}>
                <div><span className="form-label">Priority</span><p>{selected.priority || 'N/A'}</p></div>
                <div><span className="form-label">Allocation</span><p>{selected.allocation_percent}%</p></div>
              </div>
              <div className="form-row" style={{ marginBottom: 16 }}>
                <div><span className="form-label">Avg Booking Value</span><p>{selected.avg_booking_value ? `$${Number(selected.avg_booking_value).toFixed(2)}` : 'N/A'}</p></div>
                <div><span className="form-label">Performance Score</span>
                  <p>{selected.performance_score != null ? <span className={`badge ${scoreColor(selected.performance_score)}`}>{selected.performance_score}</span> : 'N/A'}</p>
                </div>
              </div>
              <div className="form-row" style={{ marginBottom: 16 }}>
                <div><span className="form-label">Active</span><p><span className={`badge ${selected.is_active ? 'badge-success' : 'badge-neutral'}`}>{selected.is_active ? 'Yes' : 'No'}</span></p></div>
                <div><span className="form-label">Contract End</span><p>{selected.contract_end ? new Date(selected.contract_end).toLocaleDateString() : 'N/A'}</p></div>
              </div>
              {selected.notes && (
                <div style={{ marginBottom: 16 }}>
                  <span className="form-label">Notes</span>
                  <p>{selected.notes}</p>
                </div>
              )}

              <div className="modal-actions" style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginBottom: aiResult ? 24 : 0 }}>
                <button className="btn btn-danger" onClick={handleDelete} disabled={saving}><Trash2 size={16} /> Delete</button>
                <button className="btn btn-ai" onClick={handleAiOptimize} disabled={aiLoading}>
                  <Brain size={16} /> {aiLoading ? 'Optimizing...' : 'AI Optimize'}
                </button>
                <button className="btn btn-primary" onClick={() => setEditing(true)}><Edit size={16} /> Edit</button>
              </div>

              {aiLoading && (
                <div className="spinner-container"><div className="spinner loading-spinner" /></div>
              )}
              {aiResult && <AIResultDisplay data={aiResult} type="channels" />}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
