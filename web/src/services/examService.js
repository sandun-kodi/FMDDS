import apiClient from './apiClient';

export const examService = {
  // Record clinical forensic examination for a living patient
  recordClinicalExam: async (caseId, examData) => {
    const response = await apiClient.post(`/cases/${caseId}/clinical-exam`, {
      examinerID: examData.examinerID || 1,
      examDate: examData.examDate || new Date().toISOString(),
      observations: examData.observations || '',
      diagnosis: examData.diagnosis || ''
    });
    return response.data;
  },

  // Record postmortem autopsy examination for a deceased case
  recordPostmortemExam: async (caseId, examData) => {
    const response = await apiClient.post(`/cases/${caseId}/postmortem-exam`, {
      examinerID: examData.examinerID || 1,
      findings: examData.findings || '',
      causeOfDeath: examData.causeOfDeath || ''
    });
    return response.data;
  },

  // Save structured cause of death records
  saveCausesOfDeath: async (caseId, causesList) => {
    const response = await apiClient.post(`/cases/${caseId}/postmortem-exam/causes`, causesList);
    return response.data;
  }
};
