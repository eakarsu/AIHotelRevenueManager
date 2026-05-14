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
import RevenueWarRoomPage from './pages/RevenueWarRoomPage';
import AIHistoryPage from './pages/AIHistoryPage';
import GroupBookingPage from './pages/GroupBookingPage';
import GuestLTVPage from './pages/GuestLTVPage';
import GuestSegmentationPage from './pages/GuestSegmentationPage';

// === Batch 04 Gaps & Frontend Mounts ===
import CfAgenticRevenueManagerContinuouslyOpt from './pages/CfAgenticRevenueManagerContinuouslyOpt';
import CfGuestLifecycleAiPredictingLtvAnd from './pages/CfGuestLifecycleAiPredictingLtvAnd';
import CfDynamicPackagingGeneratingRoomSpaDi from './pages/CfDynamicPackagingGeneratingRoomSpaDi';
import CfOccupancySmoothingRecommendingGroupE from './pages/CfOccupancySmoothingRecommendingGroupE';
import CfReputationReviewResponseMonitoringOt from './pages/CfReputationReviewResponseMonitoringOt';
import CfLaborOptimizerExtendingLaboropsjsWit from './pages/CfLaborOptimizerExtendingLaboropsjsWit';
import GapNoDynamicPricingOptimizerEndpointRu from './pages/GapNoDynamicPricingOptimizerEndpointRu';
import GapNoDemandForecaster from './pages/GapNoDemandForecaster';
import GapNoGuestSegmentationAi from './pages/GapNoGuestSegmentationAi';
import GapNoReviewSentimentAnalyzer from './pages/GapNoReviewSentimentAnalyzer';
import GapNoCompetitorRateAiRecommender from './pages/GapNoCompetitorRateAiRecommender';
import GapNoUpsellRecommendationEngine from './pages/GapNoUpsellRecommendationEngine';
import GapNoLoyaltyProgramManagement from './pages/GapNoLoyaltyProgramManagement';
import GapNoRealTimeWebsocketBookingBoard from './pages/GapNoRealTimeWebsocketBookingBoard';
import GapNoWebhookSurfaceForOtaEvent from './pages/GapNoWebhookSurfaceForOtaEvent';
import GapNoFileUploadForGuestDocuments from './pages/GapNoFileUploadForGuestDocuments';
import GapNoMultiPropertyFleetManagement from './pages/GapNoMultiPropertyFleetManagement';

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
      <Route path="/revenue-war-room" element={<ProtectedRoute><AppLayout><RevenueWarRoomPage /></AppLayout></ProtectedRoute>} />
      <Route path="/ai-history" element={<ProtectedRoute><AppLayout><AIHistoryPage /></AppLayout></ProtectedRoute>} />
      <Route path="/group-booking" element={<ProtectedRoute><AppLayout><GroupBookingPage /></AppLayout></ProtectedRoute>} />
      <Route path="/guest-ltv" element={<ProtectedRoute><AppLayout><GuestLTVPage /></AppLayout></ProtectedRoute>} />
      <Route path="/guest-segmentation" element={<ProtectedRoute><AppLayout><GuestSegmentationPage /></AppLayout></ProtectedRoute>} />
          {/* // === Batch 04 Gaps & Frontend Mounts === */}
          <Route path="/cf-agentic-revenue-manager-continuously-opt" element={<CfAgenticRevenueManagerContinuouslyOpt />} />
          <Route path="/cf-guest-lifecycle-ai-predicting-ltv-and" element={<CfGuestLifecycleAiPredictingLtvAnd />} />
          <Route path="/cf-dynamic-packaging-generating-room-spa-di" element={<CfDynamicPackagingGeneratingRoomSpaDi />} />
          <Route path="/cf-occupancy-smoothing-recommending-group-e" element={<CfOccupancySmoothingRecommendingGroupE />} />
          <Route path="/cf-reputation-review-response-monitoring-ot" element={<CfReputationReviewResponseMonitoringOt />} />
          <Route path="/cf-labor-optimizer-extending-laboropsjs-wit" element={<CfLaborOptimizerExtendingLaboropsjsWit />} />
          <Route path="/gap-no-dynamic-pricing-optimizer-endpoint-ru" element={<GapNoDynamicPricingOptimizerEndpointRu />} />
          <Route path="/gap-no-demand-forecaster" element={<GapNoDemandForecaster />} />
          <Route path="/gap-no-guest-segmentation-ai" element={<GapNoGuestSegmentationAi />} />
          <Route path="/gap-no-review-sentiment-analyzer" element={<GapNoReviewSentimentAnalyzer />} />
          <Route path="/gap-no-competitor-rate-ai-recommender" element={<GapNoCompetitorRateAiRecommender />} />
          <Route path="/gap-no-upsell-recommendation-engine" element={<GapNoUpsellRecommendationEngine />} />
          <Route path="/gap-no-loyalty-program-management" element={<GapNoLoyaltyProgramManagement />} />
          <Route path="/gap-no-real-time-websocket-booking-board" element={<GapNoRealTimeWebsocketBookingBoard />} />
          <Route path="/gap-no-webhook-surface-for-ota-event" element={<GapNoWebhookSurfaceForOtaEvent />} />
          <Route path="/gap-no-file-upload-for-guest-documents" element={<GapNoFileUploadForGuestDocuments />} />
          <Route path="/gap-no-multi-property-fleet-management" element={<GapNoMultiPropertyFleetManagement />} />

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
