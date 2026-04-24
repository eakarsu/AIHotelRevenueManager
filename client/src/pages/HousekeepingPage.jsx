import { useState, useEffect, useCallback } from 'react';
import { Sparkles, Plus, Edit, Trash2, X, Clock } from 'lucide-react';
import Modal from '../components/Modal';
import * as api from '../services/api';

const TASK_TYPES = ['Deep Clean', 'Standard Clean', 'Turnover', 'Inspection', 'Maintenance', 'Linen Change'];
const PRIORITIES = ['Urgent', 'High', 'Medium', 'Low'];
const STATUSES = ['Pending', 'In Progress', 'Completed', 'Cancelled'];

const priorityBadgeColor = {
  Urgent: 'red',
  High: 'yellow',
  Medium: 'blue',
  Low: 'green',
};

const statusBadgeColor = {
  Pending: 'yellow',
  'In Progress': 'blue',
  Completed: 'green',
  Cancelled: 'red',
};

const emptyForm = {
  room_number: '',
  task_type: 'Standard Clean',
  assigned_to: '',
  priority: 'Medium',
  status: 'Pending',
  scheduled_date: '',
  scheduled_time: '',
  estimated_duration: '',
  notes: '',
};

export default function HousekeepingPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedTask, setSelectedTask] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getHousekeepingTasks();
      setTasks(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const openDetail = async (task) => {
    try {
      const data = await api.getHousekeepingTask(task._id || task.id);
      setSelectedTask(data.data || data);
    } catch {
      setSelectedTask(task);
    }
    setShowDetailModal(true);
  };

  const openCreate = () => {
    setFormData(emptyForm);
    setIsEditing(false);
    setShowFormModal(true);
  };

  const openEdit = () => {
    const t = selectedTask;
    setFormData({
      room_number: t.room_number || '',
      task_type: t.task_type || 'Standard Clean',
      assigned_to: t.assigned_to || '',
      priority: t.priority || 'Medium',
      status: t.status || 'Pending',
      scheduled_date: t.scheduled_date ? t.scheduled_date.substring(0, 10) : '',
      scheduled_time: t.scheduled_time || '',
      estimated_duration: t.estimated_duration || '',
      notes: t.notes || '',
    });
    setIsEditing(true);
    setShowDetailModal(false);
    setShowFormModal(true);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.deleteHousekeepingTask(selectedTask._id || selectedTask.id);
      setShowDetailModal(false);
      setSelectedTask(null);
      fetchTasks();
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
        estimated_duration: formData.estimated_duration ? Number(formData.estimated_duration) : undefined,
      };
      if (isEditing) {
        await api.updateHousekeepingTask(selectedTask._id || selectedTask.id, payload);
      } else {
        await api.createHousekeepingTask(payload);
      }
      setShowFormModal(false);
      fetchTasks();
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

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  if (loading) return <div className="page-loading">Loading housekeeping tasks...</div>;
  if (error) return <div className="page-error">Error: {error}</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">
          <Sparkles size={24} />
          Housekeeping
        </h1>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} />
          + New Task
        </button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Room Number</th>
            <th>Task Type</th>
            <th>Assigned To</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Scheduled Date</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {tasks.length === 0 ? (
            <tr>
              <td colSpan="7" style={{ textAlign: 'center' }}>No housekeeping tasks found</td>
            </tr>
          ) : (
            tasks.map((task) => (
              <tr key={task._id || task.id} onClick={() => openDetail(task)} style={{ cursor: 'pointer' }}>
                <td>{task.room_number}</td>
                <td>{task.task_type}</td>
                <td>{task.assigned_to || '-'}</td>
                <td>
                  <span className={`badge badge-${priorityBadgeColor[task.priority] || 'default'}`}>
                    {task.priority}
                  </span>
                </td>
                <td>
                  <span className={`badge badge-${statusBadgeColor[task.status] || 'default'}`}>
                    {task.status}
                  </span>
                </td>
                <td>{formatDate(task.scheduled_date)}</td>
                <td>{task.scheduled_time || '-'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Detail Modal */}
      {showDetailModal && selectedTask && (
        <Modal title="Task Details" onClose={() => setShowDetailModal(false)}>
          <div className="detail-grid">
            <div className="detail-row">
              <span className="detail-label">Room Number</span>
              <span className="detail-value">{selectedTask.room_number}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Task Type</span>
              <span className="detail-value">{selectedTask.task_type}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Assigned To</span>
              <span className="detail-value">{selectedTask.assigned_to || '-'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Priority</span>
              <span className="detail-value">
                <span className={`badge badge-${priorityBadgeColor[selectedTask.priority] || 'default'}`}>
                  {selectedTask.priority}
                </span>
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Status</span>
              <span className="detail-value">
                <span className={`badge badge-${statusBadgeColor[selectedTask.status] || 'default'}`}>
                  {selectedTask.status}
                </span>
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Scheduled Date</span>
              <span className="detail-value">{formatDate(selectedTask.scheduled_date)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Time</span>
              <span className="detail-value">
                <Clock size={14} style={{ marginRight: 4 }} />
                {selectedTask.scheduled_time || '-'}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Estimated Duration</span>
              <span className="detail-value">{selectedTask.estimated_duration ? `${selectedTask.estimated_duration} min` : '-'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Notes</span>
              <span className="detail-value">{selectedTask.notes || '-'}</span>
            </div>
          </div>

          <div className="modal-actions">
            <button className="btn btn-primary" onClick={openEdit}>
              <Edit size={16} />
              Edit
            </button>
            <button className="btn btn-danger" onClick={handleDelete}>
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        </Modal>
      )}

      {/* Create / Edit Modal */}
      {showFormModal && (
        <Modal title={isEditing ? 'Edit Task' : 'New Task'} onClose={() => setShowFormModal(false)}>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Room Number</label>
                <input className="form-input" name="room_number" value={formData.room_number} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Task Type</label>
                <select className="form-select" name="task_type" value={formData.task_type} onChange={handleChange}>
                  {TASK_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Assigned To</label>
                <input className="form-input" name="assigned_to" value={formData.assigned_to} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-select" name="priority" value={formData.priority} onChange={handleChange}>
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" name="status" value={formData.status} onChange={handleChange}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Scheduled Date</label>
                <input className="form-input" name="scheduled_date" type="date" value={formData.scheduled_date} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Scheduled Time</label>
                <input className="form-input" name="scheduled_time" type="time" value={formData.scheduled_time} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Estimated Duration (min)</label>
                <input className="form-input" name="estimated_duration" type="number" min="0" value={formData.estimated_duration} onChange={handleChange} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-textarea" name="notes" value={formData.notes} onChange={handleChange} rows={3} />
            </div>
            <div className="modal-actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : isEditing ? 'Update Task' : 'Create Task'}
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
