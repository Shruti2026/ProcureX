import api from './api';

export const notificationService = {
  getMyNotifications: (params) => api.get('/api/v1/notifications', { params }),
  getUnreadCount:     ()       => api.get('/api/v1/notifications/unread-count'),
  getPreferences:     ()       => api.get('/api/v1/notifications/preferences'),
  updatePreferences:  (data)   => api.put('/api/v1/notifications/preferences', data),
};
