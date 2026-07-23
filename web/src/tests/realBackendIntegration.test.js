import { describe, it, expect } from 'vitest';

const SHOULD_RUN = process.env.RUN_REAL_BACKEND_TESTS === 'true';
const BASE_URL = process.env.TEST_API_BASE_URL;
const SEEDED_PASSWORD = process.env.TEST_USER_PASSWORD || 'TestRunnerSecure2026!';

const CLERK_USER = process.env.TEST_CLERK_USERNAME || 'clerk_jayasuriya';
const JMO_USER = process.env.TEST_JMO_USERNAME || 'jmo_perera';
const LAB_USER = process.env.TEST_LAB_USERNAME || 'lab_fernando';
const ADMIN_USER = process.env.TEST_ADMIN_USERNAME || 'admin';

async function loginUser(username) {
  if (!SEEDED_PASSWORD) {
    throw new Error('TEST_USER_PASSWORD environment variable is missing.');
  }

  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password: SEEDED_PASSWORD })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Login failed for ${username}: ${res.status} ${text}`);
  }

  return res.json();
}

describe.runIf(SHOULD_RUN && !!BASE_URL && !!SEEDED_PASSWORD)(
  'Real Backend Integration Tests against Isolated Server',
  () => {
    it('1. GET /health returns status Healthy and Connected database', async () => {
      const res = await fetch(`${BASE_URL}/health`);
      expect(res.ok).toBe(true);
      const body = await res.json();
      expect(body.status).toBe('Healthy');
      expect(body.database.status).toBe('Connected');
    });

    it('2. Clerical Staff Authentication & Case Registration Workflow', async () => {
      const auth = await loginUser(CLERK_USER);
      expect(auth.token).toBeDefined();
      expect(auth.user.role).toBe('Clerical Staff');
      const token = auth.token;

      const uniqueNic = `9${Math.floor(10000000 + Math.random() * 90000000)}V`;
      const patRes = await fetch(`${BASE_URL}/patients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nic: uniqueNic,
          fullName: 'FEIT-Integration Test Patient',
          dateOfBirth: '1990-05-15T00:00:00Z',
          gender: 'Male',
          address: '123 Test Street, Colombo',
          telephone: '0771234567'
        })
      });
      expect(patRes.status).toBe(201);
      const patient = await patRes.json();

      const caseRes = await fetch(`${BASE_URL}/cases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          patientID: patient.patientID,
          caseType: 'Clinical Forensic',
          assignedOfficerID: auth.user.userID
        })
      });
      expect(caseRes.status).toBe(201);
      const newCase = await caseRes.json();
      expect(newCase.caseID).toBeDefined();

      const statusRes = await fetch(`${BASE_URL}/cases/${newCase.caseID}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'Examination In Progress',
          officerID: auth.user.userID
        })
      });
      expect(statusRes.ok).toBe(true);

      const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      expect(logoutRes.ok).toBe(true);
    });

    it('3. Judicial Medical Officer (JMO) Exam, Report & Approval Workflow', async () => {
      const auth = await loginUser(JMO_USER);
      const token = auth.token;
      const jmoId = auth.user.userID;

      const uniqueNic = `199${Math.floor(100000000 + Math.random() * 900000000)}`;
      const patRes = await fetch(`${BASE_URL}/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ nic: uniqueNic, fullName: 'FEIT-Deceased Test Profile', gender: 'Male' })
      });
      const patient = await patRes.json();

      const caseRes = await fetch(`${BASE_URL}/cases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ patientID: patient.patientID, caseType: 'Postmortem', assignedOfficerID: jmoId })
      });
      expect(caseRes.status).toBe(201);
      const pmCase = await caseRes.json();

      const pmExamRes = await fetch(`${BASE_URL}/cases/${pmCase.caseID}/postmortem-exam`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          examinerID: jmoId,
          findings: 'Detailed autopsy findings: FEIT-Subdural hematoma observed in cranial cavity',
          causeOfDeath: 'Intracranial hemorrhage'
        })
      });
      expect(pmExamRes.status).toBe(201);

      const draftRes = await fetch(`${BASE_URL}/cases/${pmCase.caseID}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ summary: 'FEIT-Synthetic postmortem report draft' })
      });
      expect(draftRes.status).toBe(201);

      const approveRes = await fetch(`${BASE_URL}/cases/${pmCase.caseID}/reports/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ jmoID: jmoId })
      });
      expect(approveRes.status).toBe(201);

      const pdfRes = await fetch(`${BASE_URL}/cases/${pmCase.caseID}/reports/download`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      expect(pdfRes.ok).toBe(true);
      expect(pdfRes.headers.get('content-type')).toBe('application/pdf');
    });

    it('4. Laboratory Staff & Evidence Transfer Workflows', async () => {
      const jmoAuth = await loginUser(JMO_USER);
      const jmoToken = jmoAuth.token;
      const jmoId = jmoAuth.user.userID;

      // Dynamically register patient and case for this workflow
      const uniqueNic = `9${Math.floor(10000000 + Math.random() * 90000000)}V`;
      const patRes = await fetch(`${BASE_URL}/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jmoToken}` },
        body: JSON.stringify({ nic: uniqueNic, fullName: 'FEIT-Lab Test Patient', gender: 'Female' })
      });
      const patient = await patRes.json();

      const caseRes = await fetch(`${BASE_URL}/cases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jmoToken}` },
        body: JSON.stringify({ patientID: patient.patientID, caseType: 'Clinical Forensic', assignedOfficerID: jmoId })
      });
      const createdCase = await caseRes.json();

      const evRes = await fetch(`${BASE_URL}/cases/${createdCase.caseID}/evidence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jmoToken}` },
        body: JSON.stringify({
          officerID: jmoId,
          evidenceType: 'Toxicology Sample',
          description: 'FEIT-Blood sample 10ml',
          storageLocation: 'Vault R-1'
        })
      });
      expect(evRes.status).toBe(201);
      const evItem = await evRes.json();

      const labAuth = await loginUser(LAB_USER);
      const labId = labAuth.user.userID;

      const transferRes = await fetch(`${BASE_URL}/evidence/${evItem.evidenceID}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jmoToken}` },
        body: JSON.stringify({
          transferringOfficerID: jmoId,
          receivingOfficerID: labId,
          newLocation: 'Toxicology Laboratory',
          reason: 'Blood alcohol analysis'
        })
      });
      expect(transferRes.ok).toBe(true);

      const labReqRes = await fetch(`${BASE_URL}/cases/${createdCase.caseID}/lab-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jmoToken}` },
        body: JSON.stringify({ requesterID: jmoId })
      });
      expect(labReqRes.status).toBe(201);
      const labReq = await labReqRes.json();

      const resultRes = await fetch(`${BASE_URL}/lab-requests/${labReq.labRequestID}/results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${labAuth.token}` },
        body: JSON.stringify({ labStaffID: labId, resultText: 'BAC: 0.05%' })
      });
      expect(resultRes.status).toBe(201);
    });

    it('5. System Administrator Endpoints & Audit Log Querying', async () => {
      const adminAuth = await loginUser(ADMIN_USER);
      const token = adminAuth.token;

      const statsRes = await fetch(`${BASE_URL}/admin/dashboard-stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      expect(statsRes.ok).toBe(true);

      const auditRes = await fetch(`${BASE_URL}/admin/audit-logs?page=1&pageSize=100`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      expect(auditRes.ok).toBe(true);
    });
  }
);
