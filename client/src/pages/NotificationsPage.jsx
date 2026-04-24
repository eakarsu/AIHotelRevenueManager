import { useState, useEffect, useCallback } from 'react';
import { Bell, Trash2, Check, CheckCheck, RefreshCw, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import * as api from '../services/api';

const typeIcons = {
  info: Info,
  warning: AlertTriangle,
  danger: AlertCircle,
  success: Check,
};

const typeColors = {
  info: { bg: '#eff6ff', border: '#3b82f6', text: '#1d4ed8' },
  warning: { bg: '#fffbeb', border: '#f59e0b', text: '#b45309' },
  danger: { bg: '#fef2f2', border: '#ef4444', text: '#b91c1c' },
  success: { bg: '#f0fdf4', border: '#22c55e', text: '#15803d' },
};

const priorityBadge = {
  high: 'badge-danger',
  medium: 'badge-warning',
  low: 'badge-info',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState('all');

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getNotifications();
      setNotifications(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const handleMarkRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      await api.generateNotifications();
      fetchNotifications();
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const formatTime = (d) => {
    if (!d) return '';
    const date = new Date(d);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.is_read;
    if (filter === 'high') return n.priority === 'high';
    if (filter !== 'all') return n.category === filter;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const categories = [...new Set(notifications.map((n) => n.category))];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <h1 className="page-title">
            <Bell size={28} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            Notifications & Alerts
            {unreadCount > 0 && (
              <span style={{ background: 'var(--danger)', color: '#fff', borderRadius: '50%', width: 24, height: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, marginLeft: 8, verticalAlign: 'middle' }}>
                {unreadCount}
              </span>
            )}
          </h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={handleMarkAllRead} disabled={unreadCount === 0}>
              <CheckCheck size={16} /> Mark All Read
            </button>
            <button className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
              <RefreshCw size={16} className={generating ? 'spin' : ''} /> {generating ? 'Scanning...' : 'Scan for Alerts'}
            </button>
          </div>
        </div>
        <p>System alerts for occupancy, check-ins, maintenance, billing, and promotions</p>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <button className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('all')}>
          All ({notifications.length})
        </button>
        <button className={`btn ${filter === 'unread' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('unread')}>
          Unread ({unreadCount})
        </button>
        <button className={`btn ${filter === 'high' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('high')}>
          High Priority
        </button>
        {categories.map((cat) => (
          <button key={cat} className={`btn ${filter === cat ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(cat)}>
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {error && <div className="error-message" style={{ color: 'var(--danger)', marginBottom: 16 }}>{error}</div>}

      {loading ? (
        <div className="spinner-container"><div className="spinner loading-spinner" /></div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}>
          <Bell size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
          <p style={{ fontSize: 16 }}>No notifications</p>
          <p style={{ fontSize: 13 }}>Click "Scan for Alerts" to check for issues</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((n) => {
            const colors = typeColors[n.type] || typeColors.info;
            const Icon = typeIcons[n.type] || Info;
            return (
              <div
                key={n.id}
                style={{
                  background: n.is_read ? 'var(--card-bg)' : colors.bg,
                  border: `1px solid ${n.is_read ? 'var(--border)' : colors.border}`,
                  borderLeft: `4px solid ${colors.border}`,
                  borderRadius: 10,
                  padding: 16,
                  opacity: n.is_read ? 0.7 : 1,
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: 12, flex: 1 }}>
                    <div style={{ color: colors.text, marginTop: 2 }}>
                      <Icon size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                        <h4 style={{ margin: 0, fontSize: 15, fontWeight: n.is_read ? 400 : 600 }}>{n.title}</h4>
                        <span className={`badge ${priorityBadge[n.priority] || 'badge-neutral'}`} style={{ fontSize: 11 }}>{n.priority}</span>
                        {n.category && <span className="badge badge-neutral" style={{ fontSize: 11 }}>{n.category}</span>}
                      </div>
                      <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)' }}>{n.message}</p>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6, display: 'block' }}>{formatTime(n.created_at)}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginLeft: 12 }}>
                    {!n.is_read && (
                      <button onClick={() => handleMarkRead(n.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-secondary)' }} title="Mark as read">
                        <Check size={16} />
                      </button>
                    )}
                    <button onClick={() => handleDelete(n.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-secondary)' }} title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
