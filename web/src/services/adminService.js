import apiClient from './apiClient';

/**
 * Service handling system administration, audit logs, and dashboard metrics.
 */
export const adminService = {
  /**
   * Retrieves paginated system audit logs.
   * Requires `admin:audit` permission on backend.
   * @param {number} page Page number (1-based)
   * @param {number} pageSize Number of logs per page
   * @returns {Promise<Array>} List of audit log records
   */
  async getAuditLogs(page = 1, pageSize = 100) {
    const response = await apiClient.get(`/admin/audit-logs?page=${page}&pageSize=${pageSize}`);
    return response.data;
  },

  /**
   * Retrieves aggregated system dashboard statistics.
   * Requires `admin:stats` permission on backend.
   * @returns {Promise<Object>} Aggregated metric counters
   */
  async getDashboardStats() {
    const response = await apiClient.get('/admin/dashboard-stats');
    return response.data;
  },

  /**
   * Retrieves system roles and permissions matrix.
   * Requires `user:manage` permission on backend.
   * @returns {Promise<Array>} List of roles with assigned permissions
   */
  async getRolesPermissions() {
    const response = await apiClient.get('/admin/roles-permissions');
    return response.data;
  }
};
