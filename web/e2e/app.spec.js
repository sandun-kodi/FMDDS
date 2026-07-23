import { test, expect } from '@playwright/test';

const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'TestRunnerSecure2026!';

/**
 * Navigates to the login page, fills credentials, clicks Sign In,
 * waits for the backend login response, and asserts dashboard is reached.
 */
async function loginAs(page, username, password) {
  await page.goto('/');

  const loginResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes('/api/v1/auth/login') &&
      response.request().method() === 'POST'
  );

  await page.getByPlaceholder('Enter system username').fill(username);
  await page.getByPlaceholder('••••••••').fill(password);
  await page.getByRole('button', { name: /Sign In/i }).click();

  const loginResponse = await loginResponsePromise;
  expect(loginResponse.status()).toBe(200);

  await page.waitForURL('**/dashboard');
  await expect(page.getByText(/Welcome back/i)).toBeVisible();
}

test.describe('FMDDS E2E Browser Workflows (against Isolated Port 5201 & Vite 5173)', () => {

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 1 — Anonymous redirect
  // ─────────────────────────────────────────────────────────────────────────
  test('1. Anonymous user accessing protected route /dashboard is redirected to login page', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL('**/');;
    await expect(page.getByText('FMDDS Secure Portal')).toBeVisible();
    await expect(page.getByText('Sign In')).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 2 — Login form renders
  // ─────────────────────────────────────────────────────────────────────────
  test('2. Login screen renders required inputs and credentials form', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('FMDDS Secure Portal')).toBeVisible();
    await expect(page.getByPlaceholder('Enter system username')).toBeVisible();
    await expect(page.getByPlaceholder('••••••••')).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign In/i })).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 3 — Invalid credential feedback
  // ─────────────────────────────────────────────────────────────────────────
  test('3. Invalid login credentials display error feedback', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('Enter system username').fill('invalid_user');
    await page.getByPlaceholder('••••••••').fill('WrongPassword123!');
    await page.getByRole('button', { name: /Sign In/i }).click();
    await expect(
      page.getByText(/Invalid username or password|Invalid credentials|Authentication failed|401/i)
    ).toBeVisible({ timeout: 10000 });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 4 — JMO full workflow (steps 4–13 + logout)
  // Explicit 90 s timeout because it covers patient, case, clinical, and
  // postmortem submission flows end-to-end.
  // ─────────────────────────────────────────────────────────────────────────
  test('4-13. JMO Workflow (Login, Patient, Cases, Clinical Exam, Postmortem Exam, Logout)', async ({ page }) => {
    test.setTimeout(90000);

    // 4. Login as Judicial Medical Officer
    await loginAs(page, 'jmo_perera', TEST_PASSWORD);

    // 5. Permission-filtered sidebar navigation
    await expect(page.getByText('Patient Intake').first()).toBeVisible();
    await expect(page.getByText('Case Registration').first()).toBeVisible();
    await expect(page.getByText('Postmortem Exams').first()).toBeVisible();
    await expect(page.getByText('Reports Queue')).toBeVisible();

    // 6. Dashboard rendering
    await expect(page.getByText('Medico-Legal System Portal')).toBeVisible();

    // 7. Patient registration flow
    await page.getByText('Patient Intake').first().click();
    await page.waitForURL('**/patients/register');
    const uniqueNic = `9${Math.floor(10000000 + Math.random() * 90000000)}V`;
    await page.locator('#nic').fill(uniqueNic);
    await page.locator('#fullName').fill('FEIT-Playwright Test Patient');
    await page.locator('#gender').selectOption('Male');
    await page.getByRole('button', { name: /Save Patient Profile/i }).click();
    await expect(
      page.getByText(/Patient registered successfully/i).first()
    ).toBeVisible({ timeout: 10000 });

    // 8–9. Proceed to Case Registration (handoff flow)
    await page.getByRole('button', { name: /Proceed to Case Registration/i }).click();
    await page.waitForURL('**/cases/register');
    await expect(page.getByText('FEIT-Playwright Test Patient')).toBeVisible();
    await page.locator('#caseType').selectOption('Clinical Forensic');
    await page.getByRole('button', { name: /Submit & Register Case/i }).click();

    // 10. Server-generated case number display
    await expect(
      page.getByText(/COL\/2026\/CL\//i).first()
    ).toBeVisible({ timeout: 10000 });

    // 11. Case directory & search
    await page.getByText('Cases Directory').first().click();
    await page.waitForURL('**/cases');
    await expect(page.getByText('Cases Directory').first()).toBeVisible();

    // 12. Clinical examination submission
    await page.goto('http://localhost:5173/exams/clinical');
    await page.waitForURL('**/exams/clinical');
    await page.getByPlaceholder(/Enter Case ID/i).fill('1');
    await page.getByRole('button', { name: /2\. Physical Findings/i }).click();
    await page
      .getByPlaceholder(/Detailed description of injuries/i)
      .fill('FEIT-Playwright Clinical Observation: Laceration 3cm on left forearm.');
    await page.getByRole('button', { name: /4\. Diagnosis & Conclusion/i }).click();
    await page
      .getByPlaceholder(/Medical officer opinion/i)
      .fill('FEIT-Playwright Simple blunt force injury.');
    await page.getByRole('button', { name: /Submit Clinical Exam/i }).click();
    await expect(
      page.getByText(/Clinical forensic examination recorded successfully/i).first()
    ).toBeVisible({ timeout: 10000 });

    // 13. Register second case for Postmortem
    await page.goto('http://localhost:5173/cases/register');
    await page.waitForURL('**/cases/register');
    await page.getByPlaceholder(/Enter patient NIC/i).fill(uniqueNic);
    await page.getByRole('button', { name: /Find Patient/i }).click();
    await expect(page.getByText('FEIT-Playwright Test Patient')).toBeVisible();
    await page.locator('#caseType').selectOption('Postmortem');
    await page.getByRole('button', { name: /Submit & Register Case/i }).click();
    await expect(
      page.getByText(/COL\/2026\/PM\//i).first()
    ).toBeVisible({ timeout: 10000 });

    // Postmortem examination submission
    await page.getByText('Postmortem Exams').first().click();
    await page.waitForURL('**/exams/postmortem');
    await page.getByPlaceholder(/Enter Case ID/i).fill('2');
    await page
      .getByPlaceholder(/Rigor mortis state/i)
      .fill('FEIT-Playwright Postmortem Autopsy: Subdural hematoma observed.');
    await page
      .getByPlaceholder(/e\.g\. Intracranial hemorrhage/i)
      .fill('FEIT-Playwright Traumatic brain injury.');
    await page.getByRole('button', { name: /Submit Autopsy Exam/i }).click();
    await expect(
      page.getByText(/Postmortem autopsy examination recorded successfully/i).first()
    ).toBeVisible({ timeout: 10000 });

    // Logout JMO
    await page.getByRole('button', { name: /Log Out/i }).click();
    await page.getByRole('button', { name: /Sign Out/i }).click();
    await page.waitForURL('**/');
    await expect(page.getByText('FMDDS Secure Portal')).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 5 — Administrator workflow (steps 14–18)
  // Fresh browser context — no JMO state carries over.
  // ─────────────────────────────────────────────────────────────────────────
  test('14-18. Administrator Workflow (Login, Audit Logs, Stats, Settings, Logout, Protected-Route Redirect)', async ({ page }) => {
    test.setTimeout(60000);

    // 14a. Login as Administrator
    await loginAs(page, 'admin', TEST_PASSWORD);

    // 14b. Verify Audit Logs sidebar link is visible and navigate
    const auditLogsLink = page.getByRole('link', { name: 'Audit Logs' });
    await expect(auditLogsLink).toBeVisible({ timeout: 10000 });
    await auditLogsLink.click();
    await page.waitForURL('**/admin/audit');
    await expect(page.getByText('Audit Log Viewer')).toBeVisible();

    // 15. Admin dashboard statistics
    await page.getByText('Dashboard').first().click();
    await page.waitForURL('**/dashboard');
    await expect(page.getByText('Total Cases')).toBeVisible();

    // 16. System Settings blocked-state message
    await page.getByText('System Settings').first().click();
    await page.waitForURL('**/admin/settings');
    await expect(page.getByText('System Settings Integration Blocked')).toBeVisible();
    await expect(page.getByText('Feature Disabled Pending Backend Authorization Patch')).toBeVisible();

    // 17. Logout flow
    await page.getByRole('button', { name: /Log Out/i }).click();
    await page.getByRole('button', { name: /Sign Out/i }).click();
    await page.waitForURL('**/');
    await expect(page.getByText('FMDDS Secure Portal')).toBeVisible();

    // 18. Protected-route redirect after logout
    await page.goto('/cases');
    await page.waitForURL('**/');
    await expect(page.getByText('FMDDS Secure Portal')).toBeVisible();
  });

});
