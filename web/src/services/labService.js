import apiClient from './apiClient';

export const labService = {
  getTestTypes: async () => {
    const response = await apiClient.get('/lab-test-types');
    return response.data;
  },

  createLabRequest: async (caseId, requesterID = 1) => {
    const response = await apiClient.post(`/cases/${caseId}/lab-requests`, { requesterID });
    return response.data;
  },

  postLabResult: async (requestId, labStaffID, resultText) => {
    const response = await apiClient.post(`/lab-requests/${requestId}/results`, { labStaffID, resultText });
    return response.data;
  }
};
