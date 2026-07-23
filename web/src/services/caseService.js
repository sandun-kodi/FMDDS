import apiClient from './apiClient';

export const caseService = {
  // Get all cases with optional filtering (status, caseType, nic)
  getAllCases: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.caseType) params.append('caseType', filters.caseType);
    if (filters.nic) params.append('nic', filters.nic);

    const response = await apiClient.get(`/cases?${params.toString()}`);
    return response.data;
  },

  // Get single case details by ID
  getCaseById: async (id) => {
    const response = await apiClient.get(`/cases/${id}`);
    return response.data;
  },

  // Register a new patient
  registerPatient: async (patientData) => {
    const response = await apiClient.post('/patients', patientData);
    return response.data;
  },

  // Lookup patient by NIC
  getPatientByNic: async (nic) => {
    const response = await apiClient.get(`/patients/nic/${encodeURIComponent(nic)}`);
    return response.data;
  },

  // Register a new case linked to a patient
  registerCase: async (caseData) => {
    const response = await apiClient.post('/cases', caseData);
    return response.data;
  },

  // Update case status
  updateCaseStatus: async (caseId, status, officerID = 1) => {
    const response = await apiClient.put(`/cases/${caseId}/status`, { status, officerID });
    return response.data;
  }
};
