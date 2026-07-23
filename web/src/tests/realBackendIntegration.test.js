import { describe, it, expect } from 'vitest';

const BASE_URL = 'http://localhost:5200/api/v1';

// Seeded test account password in database
const SEEDED_PASSWORD = process.env.TEST_USER_PASSWORD || 'password123';

async function loginUser(username) {
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

describe('Real Backend Integration Tests against Running Server (http://localhost:5200)', () => {
  it('1. GET /api/v1/health returns status Healthy and Connected database', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    expect(res.ok).toBe(true);
    const body = await res.json();
    expect(body.status).toBe('Healthy');
    expect(body.database.status).toBe('Connected');
  });

  it('2. Clerical Staff Authentication & Case Registration Workflow', async () => {
    // A. Login as clerk_jayasuriya
    const auth = await loginUser('clerk_jayasuriya');
    expect(auth.token).toBeDefined();
    expect(auth.user.role).toBe('Clerical Staff');
    const token = auth.token;

    // B. Register synthetic patient
    const uniqueNic = `9${Math.floor(10000000 + Math.random() * 90000000)}V`;
    const patRes = await fetch(`${BASE_URL}/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        nic: uniqueNic,
        fullName: 'Integration Test Patient',
        dateOfBirth: '1990-05-15T00:00:00Z',
        gender: 'Male',
        address: '123 Test Street, Colombo',
        telephone: '0771234567'
      })
    });
    expect(patRes.status).toBe(201);
    const patient = await patRes.json();
    expect(patient.patientID).toBeDefined();
    expect(patient.nic).toBe(uniqueNic);

    // C. Lookup patient by NIC
    const lookupRes = await fetch(`${BASE_URL}/patients/nic/${uniqueNic}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    expect(lookupRes.ok).toBe(true);
    const lookedUp = await lookupRes.json();
    expect(lookedUp.patientID).toBe(patient.patientID);

    // D. Register a new Clinical Forensic Case with assignedOfficerID 2
    const caseRes = await fetch(`${BASE_URL}/cases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        patientID: patient.patientID,
        caseType: 'Clinical Forensic',
        assignedOfficerID: 2
      })
    });
    expect(caseRes.status).toBe(201);
    const newCase = await caseRes.json();
    expect(newCase.caseID).toBeDefined();
    expect(newCase.caseNumber).toMatch(/^COL\/\d{4}\/CL\/\d{4}$/);

    // E. Update case status to Examination In Progress
    const statusRes = await fetch(`${BASE_URL}/cases/${newCase.caseID}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        status: 'Examination In Progress',
        officerID: 2
      })
    });
    expect(statusRes.ok).toBe(true);
    const updated = await statusRes.json();
    expect(updated.status).toBe('Examination In Progress');

    // F. Logout
    const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    expect(logoutRes.ok).toBe(true);
  });

  it('3. Judicial Medical Officer (JMO) Exam, Report & Approval Workflow', async () => {
    // A. Login as jmo_perera
    const auth = await loginUser('jmo_perera');
    const token = auth.token;

    // B. Register a Postmortem case for autopsy test
    const uniqueNic = `199${Math.floor(100000000 + Math.random() * 900000000)}`;
    const patRes = await fetch(`${BASE_URL}/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ nic: uniqueNic, fullName: 'Deceased Test Profile', gender: 'Male' })
    });
    const patient = await patRes.json();

    const caseRes = await fetch(`${BASE_URL}/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ patientID: patient.patientID, caseType: 'Postmortem', assignedOfficerID: 2 })
    });
    expect(caseRes.status).toBe(201);
    const pmCase = await caseRes.json();

    // C. Record Postmortem Exam via POST /api/v1/cases/{caseId}/postmortem-exam (findings >= 20 chars)
    const pmExamRes = await fetch(`${BASE_URL}/cases/${pmCase.caseID}/postmortem-exam`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        examinerID: 2,
        findings: 'Detailed autopsy findings: Subdural hematoma observed in cranial cavity',
        causeOfDeath: 'Intracranial hemorrhage'
      })
    });
    expect(pmExamRes.status).toBe(201);

    // D. Save structured causes of death via POST /api/v1/cases/{caseId}/postmortem-exam/causes
    const causesRes = await fetch(`${BASE_URL}/cases/${pmCase.caseID}/postmortem-exam/causes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify([
        { recordType: 'Part I', category: '1a', description: 'Intracranial hemorrhage' }
      ])
    });
    expect(causesRes.ok).toBe(true);

    // E. Create draft report
    const draftRes = await fetch(`${BASE_URL}/cases/${pmCase.caseID}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ summary: 'Synthetic postmortem report draft' })
    });
    expect(draftRes.status).toBe(201);

    // F. Approve report by case (JMO authorization)
    const approveRes = await fetch(`${BASE_URL}/cases/${pmCase.caseID}/reports/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ jmoID: 2 })
    });
    expect(approveRes.status).toBe(201);
    const approvedReport = await approveRes.json();
    expect(approvedReport.approvalStatus).toBe('Approved');

    // G. Download PDF report
    const pdfRes = await fetch(`${BASE_URL}/cases/${pmCase.caseID}/reports/download`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    expect(pdfRes.ok).toBe(true);
    expect(pdfRes.headers.get('content-type')).toBe('application/pdf');
  });

  it('4. Laboratory Staff & Evidence Transfer Workflows', async () => {
    const jmoAuth = await loginUser('jmo_perera');

    // JMO creates evidence item
    const evRes = await fetch(`${BASE_URL}/cases/1/evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jmoAuth.token}` },
      body: JSON.stringify({
        officerID: 2,
        evidenceType: 'Toxicology Sample',
        description: 'Blood sample 10ml',
        storageLocation: 'Vault R-1'
      })
    });
    expect(evRes.status).toBe(201);
    const evItem = await evRes.json();

    // JMO transfers custody to Lab
    const transferRes = await fetch(`${BASE_URL}/evidence/${evItem.evidenceID}/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jmoAuth.token}` },
      body: JSON.stringify({
        transferringOfficerID: 2,
        receivingOfficerID: 4,
        newLocation: 'Toxicology Laboratory',
        reason: 'Blood alcohol analysis'
      })
    });
    expect(transferRes.ok).toBe(true);

    // Fetch custody log
    const logRes = await fetch(`${BASE_URL}/evidence/${evItem.evidenceID}/custody-log`, {
      headers: { 'Authorization': `Bearer ${jmoAuth.token}` }
    });
    expect(logRes.ok).toBe(true);
    const logs = await logRes.json();
    expect(logs.length).toBeGreaterThan(0);

    // JMO creates Lab request
    const labReqRes = await fetch(`${BASE_URL}/cases/1/lab-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jmoAuth.token}` },
      body: JSON.stringify({ requesterID: 2 })
    });
    expect(labReqRes.status).toBe(201);
    const labReq = await labReqRes.json();

    // Lab staff posts result
    const labAuth = await loginUser('lab_fernando');
    const resultRes = await fetch(`${BASE_URL}/lab-requests/${labReq.labRequestID}/results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${labAuth.token}` },
      body: JSON.stringify({ labStaffID: 4, resultText: 'BAC: 0.05%' })
    });
    expect(resultRes.status).toBe(201);
  });

  it('5. System Administrator Endpoints & Audit Log Querying', async () => {
    const adminAuth = await loginUser('admin');
    const token = adminAuth.token;

    // Fetch Dashboard stats
    const statsRes = await fetch(`${BASE_URL}/admin/dashboard-stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    expect(statsRes.ok).toBe(true);

    // Fetch Audit logs
    const auditRes = await fetch(`${BASE_URL}/admin/audit-logs?page=1&pageSize=100`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    expect(auditRes.ok).toBe(true);
    const auditLogs = await auditRes.json();
    expect(Array.isArray(auditLogs)).toBe(true);

    // Fetch System settings
    const settingsRes = await fetch(`${BASE_URL}/settings`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    expect(settingsRes.ok).toBe(true);
  });
});
