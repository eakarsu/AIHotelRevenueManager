import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Hotel,
  LayoutDashboard,
  BedDouble,
  DollarSign,
  Share2,
  Users,
  Sparkles,
  ShoppingBag,
  CalendarCheck,
  BarChart3,
  MessageSquare,
  LogOut,
  Brush,
  UserCog,
  Wrench,
  Tag,
  Building2,
  TrendingUp,
  Receipt,
  FileText,
  CalendarDays,
  Bell,
  Zap,
  History,
  Heart,
  Target,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', section: 'overview' },
  { to: '/rooms', icon: BedDouble, label: 'Room Inventory', section: 'management' },
  { to: '/reservations', icon: CalendarCheck, label: 'Reservations', section: 'management' },
  { to: '/guests', icon: Users, label: 'Guest Management', section: 'management' },
  { to: '/housekeeping', icon: Brush, label: 'Housekeeping', section: 'management' },
  { to: '/pricing', icon: DollarSign, label: 'Dynamic Pricing', section: 'revenue' },
  { to: '/channels', icon: Share2, label: 'Channel Distribution', section: 'revenue' },
  { to: '/upsells', icon: ShoppingBag, label: 'Upsell Recommendations', section: 'revenue' },
  { to: '/analytics', icon: BarChart3, label: 'Revenue Analytics', section: 'intelligence' },
  { to: '/reviews', icon: MessageSquare, label: 'Reviews & Sentiment', section: 'intelligence' },
  { to: '/staff', icon: UserCog, label: 'Staff Management', section: 'management' },
  { to: '/maintenance', icon: Wrench, label: 'Maintenance', section: 'management' },
  { to: '/promotions', icon: Tag, label: 'Promotions', section: 'revenue' },
  { to: '/competitors', icon: Building2, label: 'Competitor Analysis', section: 'intelligence' },
  { to: '/forecasting', icon: TrendingUp, label: 'Forecasting', section: 'intelligence' },
  { to: '/billing', icon: Receipt, label: 'Billing & Invoicing', section: 'revenue' },
  { to: '/reports', icon: FileText, label: 'Reports & Export', section: 'revenue' },
  { to: '/calendar', icon: CalendarDays, label: 'Calendar View', section: 'management' },
  { to: '/notifications', icon: Bell, label: 'Notifications', section: 'overview' },
  { to: '/revenue-war-room', icon: Zap, label: 'Revenue War Room', section: 'intelligence' },
  { to: '/group-booking', icon: Users, label: 'Group Booking Optimizer', section: 'intelligence' },
  { to: '/guest-ltv', icon: Heart, label: 'Guest Lifetime Value', section: 'intelligence' },
  { to: '/guest-segmentation', icon: Target, label: 'Guest Segmentation', section: 'intelligence' },
  { to: '/ai-history', icon: History, label: 'AI History', section: 'intelligence' },
];

const sections = {
  overview: 'Overview',
  management: 'Management',
  revenue: 'Revenue',
  intelligence: 'AI Intelligence',
};

export default function Sidebar() {
  const { user, logout } = useAuth();

  const grouped = {};
  navItems.forEach((item) => {
    if (!grouped[item.section]) grouped[item.section] = [];
    grouped[item.section].push(item);
  });

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <Hotel size={20} />
        </div>
        <div className="sidebar-brand-text">
          <h2>AI Hotel Revenue</h2>
          <span>Manager</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {Object.entries(grouped).map(([section, items]) => (
          <div key={section}>
            <div className="sidebar-section-label">{sections[section]}</div>
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `sidebar-link${isActive ? ' active' : ''}`
                }
              >
                <item.icon size={20} />
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      
        {/* // === Batch 04 Gaps & Frontend Mounts === */}
        <div style={{ borderTop: '1px solid #eee', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
        <a href="/cf-agentic-revenue-manager-continuously-opt" style={{ display: "block", padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}>Agentic revenue manager continuously opt</a>
        <a href="/cf-guest-lifecycle-ai-predicting-ltv-and" style={{ display: "block", padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}>Guest lifecycle AI predicting LTV and re</a>
        <a href="/cf-dynamic-packaging-generating-room-spa-di" style={{ display: "block", padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}>Dynamic packaging generating room + spa </a>
        <a href="/cf-occupancy-smoothing-recommending-group-e" style={{ display: "block", padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}>Occupancy smoothing recommending group e</a>
        <a href="/cf-reputation-review-response-monitoring-ot" style={{ display: "block", padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}>Reputation + review response monitoring </a>
        <a href="/cf-labor-optimizer-extending-laboropsjs-wit" style={{ display: "block", padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}>Labor optimizer extending laborOps</a>
        <a href="/gap-no-dynamic-pricing-optimizer-endpoint-ru" style={{ display: "block", padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}>No /dynamic-pricing-optimizer endpoint (</a>
        <a href="/gap-no-demand-forecaster" style={{ display: "block", padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}>No demand forecaster</a>
        <a href="/gap-no-guest-segmentation-ai" style={{ display: "block", padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}>No guest segmentation AI</a>
        <a href="/gap-no-review-sentiment-analyzer" style={{ display: "block", padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}>No review sentiment analyzer</a>
        <a href="/gap-no-competitor-rate-ai-recommender" style={{ display: "block", padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}>No competitor-rate AI recommender</a>
        <a href="/gap-no-upsell-recommendation-engine" style={{ display: "block", padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}>No upsell recommendation engine</a>
        <a href="/gap-no-loyalty-program-management" style={{ display: "block", padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}>No loyalty program management</a>
        <a href="/gap-no-real-time-websocket-booking-board" style={{ display: "block", padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}>No real-time WebSocket booking board</a>
        <a href="/gap-no-webhook-surface-for-ota-event" style={{ display: "block", padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}>No webhook surface for OTA event ingesti</a>
        <a href="/gap-no-file-upload-for-guest-documents" style={{ display: "block", padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}>No file upload for guest documents</a>
        <a href="/gap-no-multi-property-fleet-management" style={{ display: "block", padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}>No multi-property fleet management</a>
        </div>
</nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <p>{user?.name || 'User'}</p>
            <span>{user?.email || ''}</span>
          </div>
        </div>
        <button className="sidebar-logout" onClick={logout}>
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
