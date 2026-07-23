import { execSync, spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const DOTNET_EXE = process.env.DOTNET_EXE || 'dotnet';
const TEST_PORT = process.env.TEST_PORT ? parseInt(process.env.TEST_PORT, 10) : 5201;
const FRONTEND_PORT = 5173;
const TEST_BASE_URL = `http://localhost:${TEST_PORT}/api/v1`;
const FRONTEND_URL = `http://localhost:${FRONTEND_PORT}`;

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
console.log('   FMDDS ISOLATED PLAYWRIGHT E2E RUNNER');
console.log(`   Target database: ${targetDb}`);
console.log(`   Integration API: ${TEST_BASE_URL}`);
console.log(`   Frontend URL:    ${FRONTEND_URL}`);
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

function checkPort(port) {
  try {
    const output = execSync(`powershell -Command "Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue"`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    if (output.trim()) {
      return true;
    }
  } catch (e) {
    // If command fails, it likely means no connection was found.
  }
  return false;
}

async function main() {
  let exitCode = 1;
  let backendProcess = null;
  let frontendProcess = null;
  let serverCleanedUp = false;

  if (checkPort(TEST_PORT)) {
    console.error(`FATAL: Port ${TEST_PORT} is already in use. Ensure no old backend process is running.`);
    process.exit(1);
  }
  if (checkPort(FRONTEND_PORT)) {
    console.error(`FATAL: Port ${FRONTEND_PORT} is already in use. Ensure no old frontend process is running.`);
    process.exit(1);
  }

  function cleanup() {
    if (!serverCleanedUp) {
      serverCleanedUp = true;
      console.log('\nStopping test processes...');
      if (backendProcess) {
        try { backendProcess.kill(); } catch (e) {}
      }
      if (frontendProcess) {
        // on windows, killing cmd process might not kill vite. We kill by port or rely on process tree if possible.
        // For simplicity, kill the process. We might need tree-kill in a robust setup, but simple kill is acceptable here.
        try {
          execSync(`taskkill /pid ${frontendProcess.pid} /t /f`, { stdio: 'ignore' });
        } catch (e) {
          try { frontendProcess.kill(); } catch(e) {}
        }
      }
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
    SeedData__InitialPassword: testSeedPassword,
    VITE_API_BASE_URL: TEST_BASE_URL,
    TEST_USER_PASSWORD: testSeedPassword
  });

  const cwd = process.cwd();
  const repoRoot = cwd.endsWith('web') ? path.resolve(cwd, '..') : cwd;
  const backendProjectPath = path.join(repoRoot, 'Backend', 'backend.csproj');

  try {
    console.log(`1. Resetting test database ${targetDb}...`);
    try {
      const psqlPath = '"C:\\Program Files\\PostgreSQL\\15\\bin\\psql.exe"';
      const recreateScript = `
        REVOKE CONNECT ON DATABASE ${targetDb} FROM public;
        SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '${targetDb}' AND pid <> pg_backend_pid();
        DROP DATABASE IF EXISTS ${targetDb};
        CREATE DATABASE ${targetDb} OWNER fmdds_test_runner;
        \\c ${targetDb}
        GRANT ALL ON SCHEMA public TO fmdds_test_runner;
      `;
      const tmpSql = path.join(process.cwd(), 'reset_db.sql');
      fs.writeFileSync(tmpSql, recreateScript);
      execSync(`${psqlPath} -U postgres -f "${tmpSql}"`, { env: Object.assign({}, process.env, { PGPASSWORD: 'root' }), stdio: 'inherit' });
      fs.unlinkSync(tmpSql);
    } catch (e) {
      console.log('Postgres recreate failed or skipped, relying on EF update...', e);
    }

    console.log(`\n2. Applying EF Core migrations to isolated test database ${targetDb}...`);
    try {
      execSync(`"${DOTNET_EXE}" ef database update --project "${backendProjectPath}"`, { env, stdio: 'inherit' });
    } catch (err) {
      console.error('Migration update failed.');
      return 1;
    }

    console.log(`\n3. Launching backend API server on test port ${TEST_PORT}...`);
    backendProcess = spawn(DOTNET_EXE, ['run', '--project', backendProjectPath, '--urls', `http://localhost:${TEST_PORT}`, '--no-build'], {
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

    console.log(`\n4. Launching frontend dev server on port ${FRONTEND_PORT}...`);
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    frontendProcess = spawn(npmCmd, ['run', 'dev', '--', '--port', FRONTEND_PORT.toString(), '--strictPort'], {
      cwd: path.join(repoRoot, 'web'),
      env,
      stdio: 'inherit',
      shell: process.platform === 'win32'
    });

    console.log(`Waiting for frontend to respond on port ${FRONTEND_PORT}...`);
    const isFrontendReady = await waitForHealthEndpoint(FRONTEND_URL, 30000);
    if (!isFrontendReady) {
      console.error('FATAL: Frontend server failed to respond within timeout.');
      return 1;
    }
    console.log('   ✓ Isolated frontend is ready.');

    console.log('\n5. Executing Playwright E2E tests against isolated server...');
    try {
      const extraArgs = process.env.PLAYWRIGHT_EXTRA_ARGS || '';
      execSync(`npx playwright test ${extraArgs}`, {
        cwd: path.join(repoRoot, 'web'),
        env,
        stdio: 'inherit'
      });
      console.log('\n   ✓ Playwright E2E tests PASSED!');
      exitCode = 0;
    } catch (err) {
      console.error('Playwright E2E tests FAILED!');
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
    console.error('FATAL: Isolated test runner encountered an unhandled error.', err);
    process.exitCode = 1;
  });
