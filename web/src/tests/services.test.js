import { describe, it, expect, vi, beforeEach } from 'vitest';
import apiClient from '../services/apiClient';
import { caseService } from '../services/caseService';
import { examService } from '../services/examService';
import { evidenceService } from '../services/evidenceService';
import { labService } from '../services/labService';
import { reportService } from '../services/reportService';
import { adminService } from '../services/adminService';

vi.mock('../services/apiClient', () => {
  return {
    default: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn()
    }
  };
});

describe('Frontend API Services & DTO Payload Construction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('caseService.registerCase sends exact DTO expected by CaseController', async () => {
    apiClient.post.mockResolvedValueOnce({ data: { caseID: 4, caseNumber: 'COL/2026/CL/0004' } });

    const result = await caseService.registerCase({
      patientID: 1,
      caseType: 'Clinical Forensic',
      referralSource: 'Police Station',
      referralSourceTypeID: 1,
      assignedOfficerID: 2,
      hospitalID: 1,
      wardID: 1
    });

    expect(apiClient.post).toHaveBeenCalledWith('/cases', {
      patientID: 1,
      caseType: 'Clinical Forensic',
      referralSource: 'Police Station',
      referralSourceTypeID: 1,
      assignedOfficerID: 2,
      hospitalID: 1,
      wardID: 1
    });
    expect(result.caseNumber).toBe('COL/2026/CL/0004');
  });

  it('examService.recordClinicalExam posts to /cases/{id}/clinical-exam with RecordClinicalExamRequest DTO', async () => {
    apiClient.post.mockResolvedValueOnce({ data: { clinicalExamID: 5, caseID: 1 } });

    const result = await examService.recordClinicalExam(1, {
      examinerID: 2,
      examDate: '2026-07-23T10:00:00Z',
      observations: 'Laceration on forearm',
      diagnosis: 'Soft tissue trauma'
    });

    expect(apiClient.post).toHaveBeenCalledWith('/cases/1/clinical-exam', {
      examinerID: 2,
      examDate: '2026-07-23T10:00:00Z',
      observations: 'Laceration on forearm',
      diagnosis: 'Soft tissue trauma'
    });
    expect(result.clinicalExamID).toBe(5);
  });

  it('examService.recordPostmortemExam posts to /cases/{id}/postmortem-exam with RecordPostmortemExamRequest DTO', async () => {
    apiClient.post.mockResolvedValueOnce({ data: { postmortemExamID: 2, caseID: 3 } });

    const result = await examService.recordPostmortemExam(3, {
      examinerID: 2,
      findings: 'Subdural hematoma',
      causeOfDeath: 'Intracranial hemorrhage'
    });

    expect(apiClient.post).toHaveBeenCalledWith('/cases/3/postmortem-exam', {
      examinerID: 2,
      findings: 'Subdural hematoma',
      causeOfDeath: 'Intracranial hemorrhage'
    });
    expect(result.postmortemExamID).toBe(2);
  });

  it('evidenceService.transferCustody posts to /evidence/{id}/transfer', async () => {
    apiClient.post.mockResolvedValueOnce({ data: { custodyID: 4, evidenceID: 3 } });

    const result = await evidenceService.transferCustody(3, {
      transferringOfficerID: 1,
      receivingOfficerID: 2,
      newLocation: 'Toxicology Lab',
      reason: 'Chemical analysis'
    });

    expect(apiClient.post).toHaveBeenCalledWith('/evidence/3/transfer', {
      transferringOfficerID: 1,
      receivingOfficerID: 2,
      newLocation: 'Toxicology Lab',
      reason: 'Chemical analysis'
    });
    expect(result.custodyID).toBe(4);
  });

  it('reportService.approveReportByCase calls POST /cases/{id}/reports/approve and handles status', async () => {
    apiClient.post.mockResolvedValueOnce({ data: { reportID: 10, approvalStatus: 'Approved' } });

    const result = await reportService.approveReportByCase(3, 2);

    expect(apiClient.post).toHaveBeenCalledWith('/cases/3/reports/approve', { jmoID: 2 });
    expect(result.approvalStatus).toBe('Approved');
  });

  it('adminService.getAuditLogs calls GET /admin/audit-logs?page=1&pageSize=100', async () => {
    apiClient.get.mockResolvedValueOnce({ data: [{ auditLogID: 1, action: 'Case Registration' }] });

    const result = await adminService.getAuditLogs(1, 100);

    expect(apiClient.get).toHaveBeenCalledWith('/admin/audit-logs?page=1&pageSize=100');
    expect(result).toHaveLength(1);
    expect(result[0].action).toBe('Case Registration');
  });

  it('adminService.getDashboardStats calls GET /admin/dashboard-stats', async () => {
    apiClient.get.mockResolvedValueOnce({ data: { totalCases: 10, clinicalCases: 6, postmortemCases: 4 } });

    const result = await adminService.getDashboardStats();

    expect(apiClient.get).toHaveBeenCalledWith('/admin/dashboard-stats');
    expect(result.totalCases).toBe(10);
  });
});
