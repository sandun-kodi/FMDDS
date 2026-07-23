const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SAFE_PLACEHOLDERS = [
  'YOUR_LOCAL_PASSWORD',
  'YOUR_LOCAL_POSTGRES_PASSWORD',
  '<LOCAL_TEST_PASSWORD>',
  '<LOCAL_FMDDS_APP_CONNECTION_STRING>',
  '<LOCAL_FMDDS_APP_PASSWORD>',
  '<GENERATE_A_RANDOM_SECRET_OF_AT_LEAST_32_BYTES>',
  '<GENERATE_RANDOM_32_BYTE_STRING>',
  '<LOCAL_INITIAL_PASSWORD>',
  '<GENERATE_SECURE_INITIAL_SEED_PASSWORD>',
  '<password>',
  'YOUR_JWT_SECRET_KEY_MUST_BE_AT_LEAST_32_CHARACTERS',
  '${ENVIRONMENT_VARIABLE}'
];

const SUSPICIOUS_PATTERNS = [
  { pattern: /Password=([^;<\r\n"']+)/i, description: 'PostgreSQL connection password' },
  { pattern: /Bearer\s+ey[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+/i, description: 'Hardcoded JWT Bearer Token' },
  { pattern: /PGPASSWORD\s*=\s*['"]?[^'"\s]+['"]?/i, description: 'Exposed PGPASSWORD assignment' }
];

function isSafeMatch(matchStr) {
  if (!matchStr || matchStr.trim() === '') return true;
  for (const placeholder of SAFE_PLACEHOLDERS) {
    if (matchStr.includes(placeholder)) return true;
  }
  return false;
}

function scanTrackedFiles() {
  console.log('==================================================');
  console.log('   FMDDS AUTOMATED REPOSITORY SECRET REGRESSION SCAN');
  console.log('==================================================\n');

  let trackedFiles = [];
  try {
    const output = execSync('git ls-files', { encoding: 'utf8' });
    trackedFiles = output.split(/\r?\n/).filter(f => f.trim().length > 0);
  } catch (err) {
    console.error('Failed to list git tracked files:', err.message);
    process.exit(1);
  }

  const ignoredDirs = ['.git', 'node_modules', 'bin', 'obj', 'dist', 'coverage'];
  let violations = [];

  for (const relPath of trackedFiles) {
    if (ignoredDirs.some(dir => relPath.startsWith(dir + '/'))) continue;
    if (relPath.endsWith('.png') || relPath.endsWith('.jpg') || relPath.endsWith('.ico')) continue;
    if (relPath.endsWith('secret-scan.js')) continue;

    const fullPath = path.resolve(relPath);
    if (!fs.existsSync(fullPath)) continue;

    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split(/\r?\n/);

    lines.forEach((line, idx) => {
      if (line.includes('StringComparison.') || line.includes('Contains(')) return;
      // Check appsettings secret key
      if (relPath.endsWith('appsettings.json') && line.includes('"SecretKey"') && !line.includes('""')) {
        const valMatch = line.match(/"SecretKey"\s*:\s*"([^"]+)"/);
        if (valMatch && valMatch[1] && !isSafeMatch(valMatch[1])) {
          violations.push({ file: relPath, line: idx + 1, rule: 'Usable JwtSettings:SecretKey in appsettings.json', snippet: line.trim() });
        }
      }

      // Check appsettings initial password
      if (relPath.endsWith('appsettings.json') && line.includes('"InitialPassword"') && !line.includes('""')) {
        const valMatch = line.match(/"InitialPassword"\s*:\s*"([^"]+)"/);
        if (valMatch && valMatch[1] && !isSafeMatch(valMatch[1])) {
          violations.push({ file: relPath, line: idx + 1, rule: 'Usable SeedData:InitialPassword in appsettings.json', snippet: line.trim() });
        }
      }

      // Check regex patterns
      for (const item of SUSPICIOUS_PATTERNS) {
        const match = line.match(item.pattern);
        if (match) {
          const matchedVal = match[0];
          if (!isSafeMatch(matchedVal) && !isSafeMatch(line)) {
            // Exclude documentation warnings or example comments explicitly labelled
            if (line.includes('Do NOT commit') || line.includes('<LOCAL_') || line.includes('<password>')) continue;
            violations.push({ file: relPath, line: idx + 1, rule: item.description, snippet: line.trim() });
          }
        }
      }
    });
  }

  if (violations.length > 0) {
    console.error(`FATAL: Secret regression scanner detected ${violations.length} committed secret violations:\n`);
    violations.forEach(v => {
      console.error(`  [!] ${v.file}:${v.line} -> ${v.rule}`);
      console.error(`      Snippet: ${v.snippet}`);
    });
    console.error('\nPlease remove all hardcoded secrets or use safe placeholders before committing.');
    process.exitCode = 1;
  } else {
    console.log('✓ Secret scan completed cleanly: Zero hardcoded or usable secrets found in tracked repository files.\n');
    process.exitCode = 0;
  }
}

scanTrackedFiles();
