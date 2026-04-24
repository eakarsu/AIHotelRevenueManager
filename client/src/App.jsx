import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import RoomsPage from './pages/RoomsPage';
import PricingPage from './pages/PricingPage';
import ChannelsPage from './pages/ChannelsPage';
import GuestsPage from './pages/GuestsPage';
import HousekeepingPage from './pages/HousekeepingPage';
import UpsellsPage from './pages/UpsellsPage';
import ReservationsPage from './pages/ReservationsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ReviewsPage from './pages/ReviewsPage';
import StaffPage from './pages/StaffPage';
import PromotionsPage from './pages/PromotionsPage';
import CompetitorsPage from './pages/CompetitorsPage';
import MaintenancePage from './pages/MaintenancePage';
import ForecastingPage from './pages/ForecastingPage';
import BillingPage from './pages/BillingPage';
import ReportsPage from './pages/ReportsPage';
import CalendarPage from './pages/CalendarPage';
import NotificationsPage from './pages/NotificationsPage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout><DashboardPage /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/rooms"
        element={
          <ProtectedRoute>
            <AppLayout><RoomsPage /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pricing"
        element={
          <ProtectedRoute>
            <AppLayout><PricingPage /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/channels"
        element={
          <ProtectedRoute>
            <AppLayout><ChannelsPage /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/guests"
        element={
          <ProtectedRoute>
            <AppLayout><GuestsPage /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/housekeeping"
        element={
          <ProtectedRoute>
            <AppLayout><HousekeepingPage /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/upsells"
        element={
          <ProtectedRoute>
            <AppLayout><UpsellsPage /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reservations"
        element={
          <ProtectedRoute>
            <AppLayout><ReservationsPage /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <AppLayout><AnalyticsPage /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reviews"
        element={
          <ProtectedRoute>
            <AppLayout><ReviewsPage /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route path="/staff" element={<ProtectedRoute><AppLayout><StaffPage /></AppLayout></ProtectedRoute>} />
      <Route path="/promotions" element={<ProtectedRoute><AppLayout><PromotionsPage /></AppLayout></ProtectedRoute>} />
      <Route path="/competitors" element={<ProtectedRoute><AppLayout><CompetitorsPage /></AppLayout></ProtectedRoute>} />
      <Route path="/maintenance" element={<ProtectedRoute><AppLayout><MaintenancePage /></AppLayout></ProtectedRoute>} />
      <Route path="/forecasting" element={<ProtectedRoute><AppLayout><ForecastingPage /></AppLayout></ProtectedRoute>} />
      <Route path="/billing" element={<ProtectedRoute><AppLayout><BillingPage /></AppLayout></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><AppLayout><ReportsPage /></AppLayout></ProtectedRoute>} />
      <Route path="/calendar" element={<ProtectedRoute><AppLayout><CalendarPage /></AppLayout></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><AppLayout><NotificationsPage /></AppLayout></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
