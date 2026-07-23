import { execSync, spawn } from 'child_process';
import path from 'path';

const DOTNET_EXE = process.env.DOTNET_EXE || 'dotnet';
const TEST_PORT = process.env.TEST_PORT ? parseInt(process.env.TEST_PORT, 10) : 5201;
const TEST_BASE_URL = `http://localhost:${TEST_PORT}/api/v1`;

const testConnString = process.env.TEST_CONNECTION_STRING || '';

if (!testConnString) {
  console.error('FATAL: Test connection string missing.');
  console.error('Please set TEST_CONNECTION_STRING environment variable targeting an isolated test database (e.g. Database=fmdds_test).');
  process.exitCode = 1;
  process.exit(1);
}

const dbMatch = testConnString.match(/Database=([^;\r\n]+)/i);
const targetDb = dbMatch ? dbMatch[1] : '';

if (!targetDb || !targetDb.toLowerCase().endsWith('_test') || targetDb.toLowerCase() === 'fmdds_db') {
  console.error(`FATAL: Test launcher safety violation! Target database '${targetDb}' is not isolated or does not end with '_test'. Execution aborted.`);
  process.exitCode = 1;
  process.exit(1);
}

const testSeedPassword = process.env.TEST_USER_PASSWORD || 'TestRunnerSecure2026!';
const jwtSecret = process.env.TEST_JWT_SECRET || 'TEMPORARY_TEST_SUITE_JWT_SECRET_KEY_FOR_ISOLATED_RUNS_2026!';

console.log('==================================================');
console.log('   FMDDS ISOLATED FRONTEND-BACKEND TEST RUNNER');
console.log(`   Target database: ${targetDb}`);
console.log(`   Integration API: ${TEST_BASE_URL}`);
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
      // Server starting up...
    }
    await new Promise((r) => setTimeout(r, 1000));
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
    SeedData__InitialPassword: testSeedPassword
  });

  const cwd = process.cwd();
  const repoRoot = cwd.endsWith('web') ? path.resolve(cwd, '..') : cwd;
  const backendProjectPath = path.join(repoRoot, 'Backend', 'backend.csproj');
  const webDir = path.join(repoRoot, 'web');

  try {
    console.log(`1. Applying EF Core migrations to isolated test database ${targetDb}...`);
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
    console.log('   ✓ Isolated test backend API is ready.');

    console.log('\n3. Executing real backend integration tests against isolated server...');
    try {
      execSync('npx vitest run src/tests/realBackendIntegration.test.js', {
        cwd: webDir,
        env: Object.assign({}, process.env, {
          RUN_REAL_BACKEND_TESTS: 'true',
          TEST_API_BASE_URL: TEST_BASE_URL,
          TEST_USER_PASSWORD: testSeedPassword
        }),
        stdio: 'inherit'
      });
      console.log('\n   ✓ Isolated real backend integration tests PASSED 100%!');
      exitCode = 0;
    } catch (err) {
      console.error('Real backend integration tests FAILED!');
      exitCode = 1;
    }
  } finally {
    cleanup();
  }

  return exitCode;
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((err) => {
    console.error('FATAL: Isolated test runner encountered an unhandled error.');
    process.exitCode = 1;
  });
