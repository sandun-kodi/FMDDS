const { execSync, spawn } = require('child_process');
const http = require('http');
const path = require('path');

const DOTNET_EXE = process.env.DOTNET_EXE || 'dotnet';
const TEST_PORT = process.env.TEST_PORT ? parseInt(process.env.TEST_PORT, 10) : 5201;
const TEST_BASE_URL = `http://localhost:${TEST_PORT}/api/v1`;

// Connection string resolution
const testConnString = process.env.TEST_CONNECTION_STRING || process.env.ConnectionStrings__DefaultConnection || '';

if (!testConnString) {
  console.error('FATAL: Test connection string missing.');
  console.error('Please set the TEST_CONNECTION_STRING environment variable before running tests.');
  console.error('Example: $env:TEST_CONNECTION_STRING="Host=localhost;Port=5432;Database=fmdds_test;Username=fmdds_app;Password=<password>"');
  process.exitCode = 1;
  return;
}

// Database safety assertion: Extract database name and confirm it ends with _test
const dbMatch = testConnString.match(/Database=([^;\r\n]+)/i);
const targetDb = dbMatch ? dbMatch[1] : '';

if (!targetDb || !targetDb.toLowerCase().endsWith('_test')) {
  console.error(`FATAL: Test launcher safety violation! Target database '${targetDb}' does not end with '_test'. Aborting execution.`);
  process.exitCode = 1;
  return;
}

const jwtSecret = process.env.TEST_JWT_SECRET || 'TEST_SUITE_JWT_SECRET_KEY_FOR_AUTOMATED_TESTS_2026!';

console.log('==================================================');
console.log('   FMDDS ISOLATED AUTOMATED TEST RUNNER');
console.log(`   Target database: ${targetDb}`);
console.log(`   Test port:       ${TEST_PORT}`);
console.log('==================================================\n');

async function waitForHealthEndpoint(url, timeoutMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status === 200) {
        return true;
      }
    } catch (e) {
      // Server not ready yet
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  return false;
}

async function main() {
  let exitCode = 1;
  let serverProcess = null;
  let serverCleanedUp = false;

  function cleanup() {
    if (!serverCleanedUp && serverProcess) {
      serverCleanedUp = true;
      console.log('\nStopping backend test server process...');
      try {
        serverProcess.kill();
      } catch (e) {}
    }
  }

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  const env = Object.assign({}, process.env, {
    ASPNETCORE_ENVIRONMENT: 'Testing',
    ASPNETCORE_URLS: `http://localhost:${TEST_PORT}`,
    ConnectionStrings__DefaultConnection: testConnString,
    TEST_CONNECTION_STRING: testConnString,
    JwtSettings__SecretKey: jwtSecret,
    JwtSettings__Issuer: 'FMDDS_API',
    JwtSettings__Audience: 'FMDDS_CLIENTS',
    SeedData__InitialPassword: 'password123'
  });


  const backendProjectPath = path.join('Backend', 'backend.csproj');
  const testsProjectPath = path.join('Backend.Tests', 'Backend.Tests.csproj');

  try {
    console.log(`1. Applying EF Core migrations to test database ${targetDb}...`);
    try {
      execSync(`"${DOTNET_EXE}" ef database update --project "${backendProjectPath}"`, { env, stdio: 'inherit' });
    } catch (err) {
      console.error('Migration update failed.');
      return 1;
    }

    console.log(`\n2. Launching backend API server on test port ${TEST_PORT}...`);
    serverProcess = spawn(DOTNET_EXE, ['run', '--project', backendProjectPath, '--urls', `http://localhost:${TEST_PORT}`, '--no-build'], {
      env,
      stdio: 'inherit'
    });

    console.log(`Waiting for test backend API health endpoint to respond on port ${TEST_PORT}...`);
    const isReady = await waitForHealthEndpoint(`${TEST_BASE_URL}/health`, 25000);

    if (!isReady) {
      console.error('FATAL: Test server health endpoint failed to respond within timeout.');
      return 1;
    }
    console.log('   ✓ Health endpoint responded 200 OK.');

    console.log('\n==================================================');
    console.log(`   RUNNING INTEGRATION TEST SUITE ON ${targetDb.toUpperCase()}`);
    console.log('==================================================');

    let integrationPassed = false;
    try {
      execSync('node tests/integration-tests.js', {
        env: Object.assign({}, env, { BACKEND_URL: TEST_BASE_URL }),
        stdio: 'inherit'
      });
      integrationPassed = true;
    } catch (err) {
      console.error('Integration tests FAILED!');
    }

    console.log('\n==================================================');
    console.log(`   RUNNING SMOKE TEST SUITE (RUN 1/2) ON ${targetDb.toUpperCase()}`);
    console.log('==================================================');

    let smokeRun1Passed = false;
    try {
      execSync('node tests/smoke-test.js', {
        env: Object.assign({}, env, { BACKEND_URL: TEST_BASE_URL }),
        stdio: 'inherit'
      });
      smokeRun1Passed = true;
    } catch (err) {
      console.error('Smoke test run 1 FAILED!');
    }

    console.log('\n==================================================');
    console.log(`   RUNNING SMOKE TEST SUITE (RUN 2/2) ON ${targetDb.toUpperCase()}`);
    console.log('==================================================');

    let smokeRun2Passed = false;
    try {
      execSync('node tests/smoke-test.js', {
        env: Object.assign({}, env, { BACKEND_URL: TEST_BASE_URL }),
        stdio: 'inherit'
      });
      smokeRun2Passed = true;
    } catch (err) {
      console.error('Smoke test run 2 FAILED!');
    }

    console.log('\n==================================================');
    console.log(`   RUNNING POSTGRESQL BACKFILL & CONCURRENCY SUITE ON ${targetDb.toUpperCase()}`);
    console.log('==================================================');

    let dotnetTestsPassed = false;
    try {
      execSync(`"${DOTNET_EXE}" test "${testsProjectPath}" --configuration Release`, {
        env,
        stdio: 'inherit'
      });
      dotnetTestsPassed = true;
    } catch (err) {
      console.error('PostgreSQL Backfill & Concurrency tests FAILED!');
    }

    if (integrationPassed && smokeRun1Passed && smokeRun2Passed && dotnetTestsPassed) {
      console.log('\n==================================================');
      console.log('   ALL ISOLATED BACKEND TEST SUITES PASSED 100%');
      console.log('==================================================');
      exitCode = 0;
    } else {
      console.error('\nFATAL: One or more test suites failed.');
      exitCode = 1;
    }
  } finally {
    cleanup();
  }

  return exitCode;
}

main()
  .then(code => {
    process.exitCode = code;
  })
  .catch(error => {
    console.error('FATAL: Test runner encountered an unhandled error.');
    process.exitCode = 1;
  });
