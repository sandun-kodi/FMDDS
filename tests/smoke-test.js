/**
 * FMDDS Phase 11 Full End-to-End Smoke Test Suite
 * Run: node tests/smoke-test.js
 */

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5200/api/v1';

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

async function runSmokeTest() {
  console.log('==================================================');
  console.log('   FMDDS PHASE 11 END-TO-END SMOKE TEST SUITE');
  console.log('==================================================\n');

  let passed = 0;
  let failed = 0;
  const testUserPassword = process.env.TEST_USER_PASSWORD;

  if (!testUserPassword) {
    throw new Error('TEST_USER_PASSWORD environment variable is required to run smoke tests.');
  }

  // Step 1 & 2: Health Check & Database Connectivity
  try {
    console.log('Step 1-2: Health Check & Database Connectivity');
    const healthRes = await fetch(`${BACKEND_URL}/health`);
    assert(healthRes.status === 200, 'Health endpoint returns 200 OK');
    const healthData = await healthRes.json();
    assert(healthData.status === 'Healthy', 'Status is Healthy');
    assert(healthData.database.status === 'Connected', 'PostgreSQL Database is Connected');
    passed++;
    console.log('  -> Health Check Passed!\n');
  } catch (err) {
    console.error('  ✗ Health Check Failed:', err.message, '\n');
    failed++;
  }

  // Step 3-5: Login & Authentication
  let jmoToken = '';
  let jmoUserId = 0;
  let moToken = '';
  try {
    console.log('Step 3-5: Authentication & Token Verification');
    const loginRes = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'jmo_perera', password: testUserPassword })
    });
    assert(loginRes.status === 200, 'JMO login returns 200 OK');
    const loginData = await loginRes.json();
    jmoToken = loginData.token;
    jmoUserId = loginData.user.userID || loginData.user.UserID || 2;
    assert(!!jmoToken, 'JWT Token generated successfully');

    const moLogin = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'mo_silva', password: testUserPassword })
    });
    const moData = await moLogin.json();
    moToken = moData.token;

    const badLoginRes = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'jmo_perera', password: 'wrongpassword' })
    });
    assert(badLoginRes.status === 401, 'Invalid password returns 401 Unauthorized');
    passed++;
    console.log('  -> Authentication Passed!\n');
  } catch (err) {
    console.error('  ✗ Authentication Failed:', err.message, '\n');
    failed++;
  }

  // Step 6-10: Token Authorization & Protected Endpoints
  try {
    console.log('Step 6-10: Protected Endpoints & Authorization');
    const noTokenRes = await fetch(`${BACKEND_URL}/cases`);
    assert(noTokenRes.status === 401, 'No token returns 401 Unauthorized');

    const badTokenRes = await fetch(`${BACKEND_URL}/cases`, {
      headers: { 'Authorization': 'Bearer INVALID_TOKEN_STRING' }
    });
    assert(badTokenRes.status === 401, 'Invalid token returns 401 Unauthorized');

    const validTokenRes = await fetch(`${BACKEND_URL}/cases`, {
      headers: { 'Authorization': `Bearer ${jmoToken}` }
    });
    assert(validTokenRes.status === 200, 'Valid token returns 200 OK');

    // Test Token Revocation on Logout
    const logoutRes = await fetch(`${BACKEND_URL}/auth/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${moToken}` }
    });
    assert(logoutRes.status === 200, 'Logout endpoint returns 200 OK');

    const revokedTokenRes = await fetch(`${BACKEND_URL}/cases`, {
      headers: { 'Authorization': `Bearer ${moToken}` }
    });
    assert(revokedTokenRes.status === 401, 'Reusing revoked token after logout returns 401 Unauthorized');

    passed++;
    console.log('  -> Authorization Passed!\n');
  } catch (err) {
    console.error('  ✗ Authorization Failed:', err.message, '\n');
    failed++;
  }

  // Step 11-13: Patient & Case Creation
  let patientId = 0;
  let caseId = 0;
  let caseNumber = '';
  try {
    console.log('Step 11-13: Patient & Case Registration Workflow');
    const nic = '94' + Math.floor(1000000 + Math.random() * 9000000) + 'V';
    const patientRes = await fetch(`${BACKEND_URL}/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jmoToken}`
      },
      body: JSON.stringify({
        nic: nic,
        fullName: 'Smoke Test Patient',
        dateOfBirth: '1990-01-01T00:00:00Z',
        gender: 'Male',
        address: 'Colombo 07',
        telephone: '0712345678'
      })
    });
    assert(patientRes.status === 201, 'Patient registration returns 201 Created');
    const patientData = await patientRes.json();
    patientId = patientData.patientID;

    const caseRes = await fetch(`${BACKEND_URL}/cases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jmoToken}`
      },
      body: JSON.stringify({
        patientID: patientId,
        caseType: 'Clinical Forensic',
        referralSource: 'Police Station Colombo',
        assignedOfficerID: jmoUserId
      })
    });
    assert(caseRes.status === 201, 'Case registration returns 201 Created');
    const caseData = await caseRes.json();
    caseId = caseData.caseID;
    caseNumber = caseData.caseNumber;
    assert(!!caseNumber, 'Unique Case Number generated');
    passed++;
    console.log('  -> Patient & Case Registration Passed!\n');
  } catch (err) {
    console.error('  ✗ Patient & Case Registration Failed:', err.message, '\n');
    failed++;
  }

  // Step 14-16: Examinations, Status Transition, & Evidence
  try {
    console.log('Step 14-16: Clinical Examination & Evidence Custody Transfer');
    const examRes = await fetch(`${BACKEND_URL}/cases/${caseId}/clinical-exam`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jmoToken}`
      },
      body: JSON.stringify({
        examinerID: jmoUserId,
        examDate: new Date().toISOString(),
        observations: 'Blunt force trauma observed on left arm and shoulder.',
        diagnosis: 'Soft tissue contusion'
      })
    });
    assert(examRes.status === 201, 'Record clinical exam returns 201 Created');

    const evidenceRes = await fetch(`${BACKEND_URL}/cases/${caseId}/evidence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jmoToken}`
      },
      body: JSON.stringify({
        officerID: jmoUserId,
        evidenceType: 'Clothing Sample',
        description: 'Torn shirt with stain',
        storageLocation: 'Locker B2'
      })
    });
    assert(evidenceRes.status === 201, 'Register evidence returns 201 Created');
    const evidenceData = await evidenceRes.json();

    const transferRes = await fetch(`${BACKEND_URL}/evidence/${evidenceData.evidenceID}/transfer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jmoToken}`
      },
      body: JSON.stringify({
        transferringOfficerID: jmoUserId,
        receivingOfficerID: 4,
        newLocation: 'Forensic Lab Storage',
        reason: 'DNA & Staining Analysis'
      })
    });
    assert(transferRes.status === 201, 'Custody transfer returns 201 Created');

    const custodyLogRes = await fetch(`${BACKEND_URL}/evidence/${evidenceData.evidenceID}/custody-log`, {
      headers: { 'Authorization': `Bearer ${jmoToken}` }
    });
    assert(custodyLogRes.status === 200, 'Get custody log returns 200 OK');
    passed++;
    console.log('  -> Examination & Evidence Passed!\n');
  } catch (err) {
    console.error('  ✗ Examination & Evidence Failed:', err.message, '\n');
    failed++;
  }

  // Step 17-20: Lab Workflow, Draft Report, & Approval
  try {
    console.log('Step 17-20: Laboratory Workflow & Medico-Legal Report Approval');
    const labReqRes = await fetch(`${BACKEND_URL}/cases/${caseId}/lab-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jmoToken}`
      },
      body: JSON.stringify({ requesterID: jmoUserId })
    });
    assert(labReqRes.status === 201, 'Create lab request returns 201 Created');
    const labReqData = await labReqRes.json();

    // Authenticate as Lab Staff (lab_fernando) to post lab results
    const labStaffLogin = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'lab_fernando', password: testUserPassword })
    });
    const labStaffData = await labStaffLogin.json();
    const labStaffId = labStaffData.user.userID || labStaffData.user.UserID || 4;

    const labResultRes = await fetch(`${BACKEND_URL}/lab-requests/${labReqData.labRequestID}/results`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${labStaffData.token}`
      },
      body: JSON.stringify({
        labStaffID: labStaffId,
        resultText: 'Stain analysis confirms non-human origin.'
      })
    });
    if (labResultRes.status !== 201) {
      console.log('Debug Lab Result Status:', labResultRes.status, 'Body:', await labResultRes.text());
    }
    assert(labResultRes.status === 201, 'Post lab result returns 201 Created');

    // Create Draft Report
    const draftRes = await fetch(`${BACKEND_URL}/cases/${caseId}/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jmoToken}`
      },
      body: JSON.stringify({ summary: 'Comprehensive Medico-Legal Report' })
    });
    if (draftRes.status !== 201) {
      console.log('Debug Draft Report Status:', draftRes.status, 'Body:', await draftRes.text());
    }
    assert(draftRes.status === 201, 'Create draft report returns 201 Created');
    const reportData = await draftRes.json();

    // Approve Report by Report ID
    const approveRes = await fetch(`${BACKEND_URL}/reports/${reportData.reportID}/approve`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jmoToken}`
      },
      body: JSON.stringify({ jmoID: jmoUserId })
    });
    assert(approveRes.status === 200, 'Approve report returns 200 OK');

    // Verify Case Status is Locked to 'Report Approved'
    const getCaseRes = await fetch(`${BACKEND_URL}/cases/${caseId}`, {
      headers: { 'Authorization': `Bearer ${jmoToken}` }
    });
    const finalCaseData = await getCaseRes.json();
    assert(finalCaseData.status === 'Report Approved', 'Case status updated and locked to Report Approved');
    passed++;
    console.log('  -> Laboratory & Report Approval Passed!\n');
  } catch (err) {
    console.error('  ✗ Laboratory & Report Approval Failed:', err.message, '\n');
    failed++;
  }

  console.log('==================================================');
  console.log(`   SMOKE TEST RUN SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('==================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runSmokeTest().catch(err => {
  console.error('Fatal Smoke Test Error:', err);
  process.exit(1);
});
