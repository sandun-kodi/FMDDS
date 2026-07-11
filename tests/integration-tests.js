/**
 * FMDDS API Integration & Regression Test Suite
 * Run this test suite using: node tests/integration-tests.js
 * 
 * Requirements: Node.js (v18+) and the backend server running on http://localhost:5200
 */

const BACKEND_URL = 'http://localhost:5200/api/v1';

// Helper for assertions
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

async function runTests() {
  console.log('==================================================');
  console.log('   FMDDS INTEGRATION & REGRESSION TEST SUITE');
  console.log('==================================================\n');

  let passed = 0;
  let failed = 0;

  // Test Case 1: Authentication & RBAC Login
  try {
    console.log('Test 1: User Authentication & Role Mappings');
    
    // Test JMO Login
    const jmoRes = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'jmo_perera', password: 'password123' })
    });
    assert(jmoRes.status === 200, 'JMO login returns 200 OK');
    const jmoData = await jmoRes.json();
    assert(!!jmoData.token, 'JMO login returns a valid JWT token');
    assert(jmoData.user.role === 'Judicial Medical Officer', 'JMO has the correct role mapped');

    // Test Invalid Login
    const badRes = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'wrongpassword' })
    });
    assert(badRes.status === 401, 'Invalid password returns 401 Unauthorized');
    
    console.log('  -> Test 1 Passed!\n');
    passed++;
  } catch (err) {
    console.error('  ✗ Test 1 Failed:', err.message, '\n');
    failed++;
  }

  // Test Case 2: Patient Registration & Permissions (RBAC)
  try {
    console.log('Test 2: Patient Registration (Authorized JMO)');
    
    // Authenticate as JMO
    const jmoLogin = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'jmo_perera', password: 'password123' })
    });
    const { token } = await jmoLogin.json();

    // Register a new patient
    const randomNic = '94' + Math.floor(100000 + Math.random() * 900000) + 'V';
    const registerRes = await fetch(`${BACKEND_URL}/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        nic: randomNic,
        fullName: 'Regression Test Patient',
        dateOfBirth: '1995-05-15T00:00:00Z',
        gender: 'Female',
        address: 'No. 45, Kandy Road, Kurunegala',
        telephone: '0779876543'
      })
    });

    assert(registerRes.status === 201, 'Registering patient returns 201 Created');
    const patient = await registerRes.json();
    assert(patient.nic === randomNic, 'Returned patient record matches submitted NIC');
    assert(patient.fullName === 'Regression Test Patient', 'Returned patient record matches name');
    
    // Duplicate NIC check
    const duplicateRes = await fetch(`${BACKEND_URL}/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        nic: randomNic,
        fullName: 'Another Patient',
        gender: 'Male'
      })
    });
    assert(duplicateRes.status === 400, 'Duplicate NIC returns 400 Bad Request');
    
    console.log('  -> Test 2 Passed!\n');
    passed++;
  } catch (err) {
    console.error('  ✗ Test 2 Failed:', err.message, '\n');
    failed++;
  }

  // Test Case 3: Patient NIC Search
  try {
    console.log('Test 3: Patient Lookup by NIC');
    
    // Authenticate JMO
    const jmoLogin = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'jmo_perera', password: 'password123' })
    });
    const { token } = await jmoLogin.json();

    // Create a specific patient
    const lookupNic = '94' + Math.floor(100000 + Math.random() * 900000) + 'V';
    const createRes = await fetch(`${BACKEND_URL}/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        nic: lookupNic,
        fullName: 'Lookup Test Target',
        gender: 'Other'
      })
    });
    if (createRes.status !== 201) {
      console.log(`Debug Create status: ${createRes.status}, Body: ${await createRes.text()}`);
    }
    assert(createRes.status === 201, 'Target patient registered successfully');

    // Lookup patient
    const searchRes = await fetch(`${BACKEND_URL}/patients/nic/${lookupNic}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (searchRes.status !== 200) {
      console.log(`Debug Search status: ${searchRes.status}, Body: ${await searchRes.text()}`);
    }
    assert(searchRes.status === 200, 'Searching by valid NIC returns 200 OK');
    const target = await searchRes.json();
    assert(target.fullName === 'Lookup Test Target', 'Lookup returns correct patient name');

    // Non-existent NIC lookup
    const emptyRes = await fetch(`${BACKEND_URL}/patients/nic/000000000000`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert(emptyRes.status === 404, 'Searching non-existent NIC returns 404 Not Found');

    console.log('  -> Test 3 Passed!\n');
    passed++;
  } catch (err) {
    console.error('  ✗ Test 3 Failed:', err.message, '\n');
    failed++;
  }

  // Test Case 4: Account Lockout (BRL-020)
  try {
    console.log('Test 4: Account Lockout (BRL-020)');
    
    // We will use the 'admin' account and intentionally fail login 5 times.
    // 1. Five failed logins
    for (let i = 0; i < 5; i++) {
      const failRes = await fetch(`${BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'wrongpassword' })
      });
      assert(failRes.status === 401 || failRes.status === 423, `Failed attempt ${i + 1} processed`);
    }

    // 2. The 6th attempt should return 423 Locked out, even with the CORRECT password
    const lockedRes = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'password123' })
    });
    
    assert(lockedRes.status === 423, '6th attempt returns 423 Locked Out (even with correct password)');
    const lockedData = await lockedRes.json();
    assert(lockedData.message && lockedData.message.includes('locked'), 'Response message indicates lockout status');

    console.log('  -> Test 4 Passed!\n');
    passed++;
  } catch (err) {
    console.error('  ✗ Test 4 Failed:', err.message, '\n');
    failed++;
  }

  console.log('==================================================');
  console.log(`   TEST RUN SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('==================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

// Start test runner
runTests().catch(err => {
  console.error('Fatal Test Runner Exception:', err);
  process.exit(1);
});
