import apiClient from './apiClient';

export const adminService = {
  // Fetch real paginated audit logs from GET /api/v1/admin/audit-logs
  getAuditLogs: async (page = 1, pageSize = 100) => {
    const response = await apiClient.get(`/admin/audit-logs?page=${page}&pageSize=${pageSize}`);
    return response.data;
  },

  // Fetch real system statistics from GET /api/v1/admin/dashboard-stats
  getDashboardStats: async () => {
    const response = await apiClient.get('/admin/dashboard-stats');
    return response.data;
  },

  // Fetch system settings from GET /api/v1/settings
  getSystemSettings: async () => {
    const response = await apiClient.get('/settings');
    return response.data;
  },

  // Update system settings bulk from PUT /api/v1/settings/bulk
  updateSettingsBulk: async (settingsList) => {
    const response = await apiClient.put('/settings/bulk', settingsList);
    return response.data;
  }
};
