import apiClient from './apiClient';

export const evidenceService = {
  registerEvidence: async (caseId, data) => {
    const response = await apiClient.post(`/cases/${caseId}/evidence`, data);
    return response.data;
  },

  transferCustody: async (evidenceId, data) => {
    const response = await apiClient.post(`/evidence/${evidenceId}/transfer`, data);
    return response.data;
  },

  getCustodyLog: async (evidenceId) => {
    const response = await apiClient.get(`/evidence/${evidenceId}/custody-log`);
    return response.data;
  }
};
