import apiClient from './apiClient';

export const reportService = {
  createDraftReport: async (caseId, summary = 'Draft Medico-Legal Report') => {
    const response = await apiClient.post(`/cases/${caseId}/reports`, { summary });
    return response.data;
  },

  approveReportByCase: async (caseId, jmoID = 1) => {
    const response = await apiClient.post(`/cases/${caseId}/reports/approve`, { jmoID });
    return response.data;
  },

  approveReportById: async (reportId, jmoID = 1) => {
    const response = await apiClient.put(`/reports/${reportId}/approve`, { jmoID });
    return response.data;
  },

  downloadReportPdf: async (caseId) => {
    const response = await apiClient.get(`/cases/${caseId}/reports/download`, {
      responseType: 'blob'
    });
    // Return Blob object for download link trigger
    return response.data;
  }
};
