import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  BedDouble,
  TrendingUp,
  BarChart3,
  CalendarCheck,
  Users,
  Share2,
  ShoppingBag,
  MessageSquare,
  Brush,
  Sparkles,
  UserCog,
  Wrench,
  Tag,
  Building2,
} from 'lucide-react';
import { getAnalyticsSummary } from '../services/api';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const quickActions = [
  { to: '/rooms', icon: BedDouble, title: 'Room Inventory', desc: 'Manage rooms, types, and availability', color: 'blue' },
  { to: '/reservations', icon: CalendarCheck, title: 'Reservations', desc: 'View and manage guest reservations', color: 'green' },
  { to: '/pricing', icon: DollarSign, title: 'Dynamic Pricing', desc: 'AI-powered pricing optimization', color: 'purple' },
  { to: '/channels', icon: Share2, title: 'Channel Distribution', desc: 'Optimize OTA and direct channels', color: 'yellow' },
  { to: '/guests', icon: Users, title: 'Guest Management', desc: 'Guest profiles and personalization', color: 'blue' },
  { to: '/housekeeping', icon: Brush, title: 'Housekeeping', desc: 'Task assignments and schedules', color: 'green' },
  { to: '/upsells', icon: ShoppingBag, title: 'Upsell Recommendations', desc: 'AI-driven upsell opportunities', color: 'purple' },
  { to: '/analytics', icon: BarChart3, title: 'Revenue Analytics', desc: 'Comprehensive revenue insights', color: 'yellow' },
  { to: '/reviews', icon: MessageSquare, title: 'Reviews & Sentiment', desc: 'AI sentiment analysis on reviews', color: 'blue' },
  { to: '/staff', icon: UserCog, title: 'Staff Management', desc: 'Manage employees and schedules', color: 'green' },
  { to: '/promotions', icon: Tag, title: 'Promotions', desc: 'Special offers and packages', color: 'yellow' },
  { to: '/competitors', icon: Building2, title: 'Competitor Analysis', desc: 'AI market positioning insights', color: 'red' },
  { to: '/maintenance', icon: Wrench, title: 'Maintenance', desc: 'Track repair requests', color: 'blue' },
  { to: '/forecasting', icon: TrendingUp, title: 'Forecasting', desc: 'AI demand predictions', color: 'purple' },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getAnalyticsSummary();
        setSummary(data.summary || data);
      } catch {
        // summary might not be available yet
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const metrics = [
    {
      label: 'Total Revenue',
      value: summary?.totalRevenue != null ? `$${Number(summary.totalRevenue).toLocaleString()}` : '--',
      icon: DollarSign,
      color: 'blue',
      change: summary?.revenueChange,
    },
    {
      label: 'Occupancy Rate',
      value: summary?.occupancyRate != null ? `${summary.occupancyRate}%` : '--',
      icon: BedDouble,
      color: 'green',
      change: summary?.occupancyChange,
    },
    {
      label: 'ADR',
      value: summary?.adr != null ? `$${Number(summary.adr).toLocaleString()}` : '--',
      icon: TrendingUp,
      color: 'yellow',
      change: summary?.adrChange,
    },
    {
      label: 'RevPAR',
      value: summary?.revpar != null ? `$${Number(summary.revpar).toLocaleString()}` : '--',
      icon: BarChart3,
      color: 'red',
      change: summary?.revparChange,
    },
  ];

  const chartData = summary?.trend || summary?.chartData || null;

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome back. Here is your hotel performance overview.</p>
      </div>

      {/* Metric Cards */}
      <div className="metrics-grid">
        {metrics.map((m) => (
          <div key={m.label} className="metric-card">
            <div className="metric-card-header">
              <span className="metric-card-label">{m.label}</span>
              <div className={`metric-card-icon ${m.color}`}>
                <m.icon size={22} />
              </div>
            </div>
            <div className="metric-card-value">
              {loading ? <span className="spinner spinner-sm" /> : m.value}
            </div>
            {m.change != null && (
              <div className={`metric-card-change ${m.change >= 0 ? 'positive' : 'negative'}`}>
                {m.change >= 0 ? '+' : ''}{m.change}% from last period
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Revenue Trend Chart */}
      {chartData && Array.isArray(chartData) && chartData.length > 0 && (
        <div className="card chart-card" style={{ marginBottom: 28 }}>
          <div className="card-header">
            <h3>Revenue Trend</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="page-header" style={{ marginTop: 4 }}>
        <h1 style={{ fontSize: '1.25rem' }}>Quick Actions</h1>
        <p>Navigate to any feature module</p>
      </div>
      <div className="quick-actions-grid">
        {quickActions.map((action) => (
          <div
            key={action.to}
            className="quick-action-card"
            onClick={() => navigate(action.to)}
          >
            <div className="quick-action-icon">
              <action.icon size={24} />
            </div>
            <div className="quick-action-content">
              <h4>{action.title}</h4>
              <p>{action.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
