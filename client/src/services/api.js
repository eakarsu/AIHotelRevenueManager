const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || data.error || 'Something went wrong');
  }

  return data;
}

// Auth
export const login = (email, password) =>
  request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });

export const register = (userData) =>
  request('/auth/register', { method: 'POST', body: JSON.stringify(userData) });

export const getMe = () => request('/auth/me');

// Rooms
export const getRooms = () => request('/rooms');
export const getRoom = (id) => request(`/rooms/${id}`);
export const createRoom = (data) =>
  request('/rooms', { method: 'POST', body: JSON.stringify(data) });
export const updateRoom = (id, data) =>
  request(`/rooms/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteRoom = (id) =>
  request(`/rooms/${id}`, { method: 'DELETE' });

// Pricing
export const getPricingRules = () => request('/pricing');
export const getPricingRule = (id) => request(`/pricing/${id}`);
export const createPricingRule = (data) =>
  request('/pricing', { method: 'POST', body: JSON.stringify(data) });
export const updatePricingRule = (id, data) =>
  request(`/pricing/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deletePricingRule = (id) =>
  request(`/pricing/${id}`, { method: 'DELETE' });
export const aiAnalyzePricing = (data) =>
  request('/pricing/ai-analyze', { method: 'POST', body: JSON.stringify(data) });

// Channels
export const getChannels = () => request('/channels');
export const getChannel = (id) => request(`/channels/${id}`);
export const createChannel = (data) =>
  request('/channels', { method: 'POST', body: JSON.stringify(data) });
export const updateChannel = (id, data) =>
  request(`/channels/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteChannel = (id) =>
  request(`/channels/${id}`, { method: 'DELETE' });
export const aiOptimizeChannels = (data) =>
  request('/channels/ai-optimize', { method: 'POST', body: JSON.stringify(data) });

// Guests
export const getGuests = () => request('/guests');
export const getGuest = (id) => request(`/guests/${id}`);
export const createGuest = (data) =>
  request('/guests', { method: 'POST', body: JSON.stringify(data) });
export const updateGuest = (id, data) =>
  request(`/guests/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteGuest = (id) =>
  request(`/guests/${id}`, { method: 'DELETE' });
export const aiPersonalizeGuest = (id) =>
  request(`/guests/${id}/ai-personalize`, { method: 'POST' });

// Housekeeping
export const getHousekeepingTasks = () => request('/housekeeping');
export const getHousekeepingTask = (id) => request(`/housekeeping/${id}`);
export const createHousekeepingTask = (data) =>
  request('/housekeeping', { method: 'POST', body: JSON.stringify(data) });
export const updateHousekeepingTask = (id, data) =>
  request(`/housekeeping/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteHousekeepingTask = (id) =>
  request(`/housekeeping/${id}`, { method: 'DELETE' });

// Upsells
export const getUpsells = () => request('/upsells');
export const getUpsell = (id) => request(`/upsells/${id}`);
export const createUpsell = (data) =>
  request('/upsells', { method: 'POST', body: JSON.stringify(data) });
export const updateUpsell = (id, data) =>
  request(`/upsells/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteUpsell = (id) =>
  request(`/upsells/${id}`, { method: 'DELETE' });
export const aiRecommendUpsells = (data) =>
  request('/upsells/ai-recommend', { method: 'POST', body: JSON.stringify(data) });

// Reservations
export const getReservations = () => request('/reservations');
export const getReservation = (id) => request(`/reservations/${id}`);
export const createReservation = (data) =>
  request('/reservations', { method: 'POST', body: JSON.stringify(data) });
export const updateReservation = (id, data) =>
  request(`/reservations/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteReservation = (id) =>
  request(`/reservations/${id}`, { method: 'DELETE' });

// Analytics
export const getAnalytics = () => request('/analytics');
export const getAnalyticsById = (id) => request(`/analytics/${id}`);
export const createAnalytics = (data) =>
  request('/analytics', { method: 'POST', body: JSON.stringify(data) });
export const deleteAnalytics = (id) =>
  request(`/analytics/${id}`, { method: 'DELETE' });
export const getAnalyticsSummary = () => request('/analytics/summary');

// Reviews
export const getReviews = () => request('/reviews');
export const getReview = (id) => request(`/reviews/${id}`);
export const createReview = (data) =>
  request('/reviews', { method: 'POST', body: JSON.stringify(data) });
export const updateReview = (id, data) =>
  request(`/reviews/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteReview = (id) =>
  request(`/reviews/${id}`, { method: 'DELETE' });
export const aiSentimentAnalysis = (id) =>
  request(`/reviews/${id}/ai-sentiment`, { method: 'POST' });

// Staff
export const getStaff = () => request('/staff');
export const getStaffMember = (id) => request(`/staff/${id}`);
export const createStaffMember = (data) =>
  request('/staff', { method: 'POST', body: JSON.stringify(data) });
export const updateStaffMember = (id, data) =>
  request(`/staff/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteStaffMember = (id) =>
  request(`/staff/${id}`, { method: 'DELETE' });

// Promotions
export const getPromotions = () => request('/promotions');
export const getPromotion = (id) => request(`/promotions/${id}`);
export const createPromotion = (data) =>
  request('/promotions', { method: 'POST', body: JSON.stringify(data) });
export const updatePromotion = (id, data) =>
  request(`/promotions/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deletePromotion = (id) =>
  request(`/promotions/${id}`, { method: 'DELETE' });

// Competitors
export const getCompetitors = () => request('/competitors');
export const getCompetitor = (id) => request(`/competitors/${id}`);
export const createCompetitor = (data) =>
  request('/competitors', { method: 'POST', body: JSON.stringify(data) });
export const updateCompetitor = (id, data) =>
  request(`/competitors/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteCompetitor = (id) =>
  request(`/competitors/${id}`, { method: 'DELETE' });
export const aiAnalyzeCompetitors = (data) =>
  request('/competitors/ai-analyze', { method: 'POST', body: JSON.stringify(data) });

// Maintenance
export const getMaintenanceRequests = () => request('/maintenance');
export const getMaintenanceRequest = (id) => request(`/maintenance/${id}`);
export const createMaintenanceRequest = (data) =>
  request('/maintenance', { method: 'POST', body: JSON.stringify(data) });
export const updateMaintenanceRequest = (id, data) =>
  request(`/maintenance/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteMaintenanceRequest = (id) =>
  request(`/maintenance/${id}`, { method: 'DELETE' });

// Forecasting
export const getForecasts = () => request('/forecasting');
export const getForecast = (id) => request(`/forecasting/${id}`);
export const createForecast = (data) =>
  request('/forecasting', { method: 'POST', body: JSON.stringify(data) });
export const deleteForecast = (id) =>
  request(`/forecasting/${id}`, { method: 'DELETE' });
export const aiForecast = (data) =>
  request('/forecasting/ai-forecast', { method: 'POST', body: JSON.stringify(data) });

// Billing
export const getInvoices = () => request('/billing');
export const getInvoice = (id) => request(`/billing/${id}`);
export const createInvoice = (data) =>
  request('/billing', { method: 'POST', body: JSON.stringify(data) });
export const updateInvoice = (id, data) =>
  request(`/billing/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteInvoice = (id) =>
  request(`/billing/${id}`, { method: 'DELETE' });

// Reports
export const getReport = (type, queryString) =>
  request(`/reports/${type}${queryString ? '?' + queryString : ''}`);

// Notifications
export const getNotifications = () => request('/notifications');
export const markNotificationRead = (id) =>
  request(`/notifications/${id}/read`, { method: 'PUT' });
export const markAllNotificationsRead = () =>
  request('/notifications/read-all', { method: 'PUT' });
export const deleteNotification = (id) =>
  request(`/notifications/${id}`, { method: 'DELETE' });
export const generateNotifications = () =>
  request('/notifications/generate', { method: 'POST' });
