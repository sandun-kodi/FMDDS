import { test, expect } from '@playwright/test';

const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'TestRunnerSecure2026!';

test.describe('FMDDS E2E Browser Workflows (against Isolated Port 5201 & Vite 5173)', () => {
  test('1. Anonymous user accessing protected route /dashboard is redirected to login page', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL('**/');
    await expect(page.getByText('FMDDS Secure Portal')).toBeVisible();
    await expect(page.getByText('Sign In')).toBeVisible();
  });

  test('2. Login screen renders required inputs and credentials form', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('FMDDS Secure Portal')).toBeVisible();
    await expect(page.getByPlaceholder('Enter system username')).toBeVisible();
    await expect(page.getByPlaceholder('••••••••')).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign In/i })).toBeVisible();
  });

  test('3. Invalid login credentials display error feedback', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('Enter system username').fill('invalid_user');
    await page.getByPlaceholder('••••••••').fill('WrongPassword123!');
    await page.getByRole('button', { name: /Sign In/i }).click();

    await expect(page.getByText(/Invalid credentials|Authentication failed|401/i)).toBeVisible({ timeout: 10000 });
  });

  test('4-18. Full End-to-End User Journeys (Auth, Roles, Intake, Exams, Admin, Settings & Logout)', async ({ page }) => {
    // 4. Successful login as Judicial Medical Officer (jmo_perera)
    await page.goto('/');
    await page.getByPlaceholder('Enter system username').fill('jmo_perera');
    await page.getByPlaceholder('••••••••').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /Sign In/i }).click();

    await page.waitForURL('**/dashboard');
    await expect(page.getByText('Dashboard')).toBeVisible();

    // 5. Permission-filtered sidebar navigation for JMO
    await expect(page.getByText('Patient Intake')).toBeVisible();
    await expect(page.getByText('Case Registration')).toBeVisible();
    await expect(page.getByText('Clinical Exam')).toBeVisible();
    await expect(page.getByText('Postmortem Exam')).toBeVisible();
    await expect(page.getByText('Reports Queue')).toBeVisible();

    // 6. Dashboard rendering with stats & quick actions
    await expect(page.getByText('Forensic Medicine Dashboard')).toBeVisible();

    // 7. Patient registration flow
    await page.getByText('Patient Intake').click();
    await page.waitForURL('**/patients/register');
    const uniqueNic = `9${Math.floor(10000000 + Math.random() * 90000000)}V`;
    await page.locator('#nic').fill(uniqueNic);
    await page.locator('#fullName').fill('FEIT-Playwright Test Patient');
    await page.locator('#gender').selectOption('Male');
    await page.getByRole('button', { name: /Register Patient/i }).click();
    await expect(page.getByText(/Patient registered successfully/i)).toBeVisible({ timeout: 10000 });

    // 8. Patient NIC lookup
    await page.locator('#searchNic').fill(uniqueNic);
    await page.getByRole('button', { name: /Search/i }).click();
    await expect(page.getByText('FEIT-Playwright Test Patient')).toBeVisible();

    // 9. Case registration flow
    await page.getByText('Case Registration').click();
    await page.waitForURL('**/cases/register');
    await page.locator('#patientNic').fill(uniqueNic);
    await page.getByRole('button', { name: /Lookup/i }).click();
    await expect(page.getByText('FEIT-Playwright Test Patient')).toBeVisible();
    await page.locator('#caseType').selectOption('Clinical Forensic');
    await page.getByRole('button', { name: /Create Case/i }).click();

    // 10. Server-generated case number display
    await expect(page.getByText(/COL\/2026\/CL\//i)).toBeVisible({ timeout: 10000 });

    // 11. Case directory & search
    await page.getByText('Cases Directory').click();
    await page.waitForURL('**/cases');
    await expect(page.getByText('Cases Directory')).toBeVisible();

    // 12. Clinical examination submission
    await page.getByText('Clinical Exam').click();
    await page.waitForURL('**/clinical-exam');
    await page.locator('#observations').fill('FEIT-Playwright Clinical Observation: Laceration 3cm on left forearm.');
    await page.locator('#diagnosis').fill('FEIT-Playwright Simple blunt force injury.');
    await page.getByRole('button', { name: /Save Clinical Examination/i }).click();
    await expect(page.getByText(/Clinical examination recorded successfully/i)).toBeVisible({ timeout: 10000 });

    // 13. Postmortem examination submission
    await page.getByText('Postmortem Exam').click();
    await page.waitForURL('**/postmortem-exam');
    await page.locator('#findings').fill('FEIT-Playwright Postmortem Autopsy: Subdural hematoma observed.');
    await page.locator('#causeOfDeath').fill('FEIT-Playwright Traumatic brain injury.');
    await page.getByRole('button', { name: /Save Postmortem Examination/i }).click();
    await expect(page.getByText(/Postmortem examination recorded successfully/i)).toBeVisible({ timeout: 10000 });

    // Logout JMO
    await page.getByRole('button', { name: /Sign Out/i }).click();
    await page.waitForURL('**/');

    // Login as Admin for Admin views
    await page.getByPlaceholder('Enter system username').fill('admin');
    await page.getByPlaceholder('••••••••').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /Sign In/i }).click();
    await page.waitForURL('**/dashboard');

    // 14. Admin Audit Log rendering
    await page.getByText('Audit Log').click();
    await page.waitForURL('**/admin/audit-log');
    await expect(page.getByText('System Audit Log (SCR-013)')).toBeVisible();

    // 15. Admin statistics rendering
    await page.getByText('Dashboard').click();
    await expect(page.getByText(/Active Cases|Registered Patients|Audit Log Events/i)).toBeVisible();

    // 16. System Settings blocked-state message display
    await page.getByText('System Settings').click();
    await page.waitForURL('**/admin/settings');
    await expect(page.getByText('System Settings Integration Blocked')).toBeVisible();
    await expect(page.getByText('Feature Disabled Pending Backend Authorization Patch')).toBeVisible();

    // 17. Logout flow
    await page.getByRole('button', { name: /Sign Out/i }).click();
    await page.waitForURL('**/');
    await expect(page.getByText('FMDDS Secure Portal')).toBeVisible();

    // 18. Protected-route redirect after logout
    await page.goto('/cases');
    await page.waitForURL('**/');
    await expect(page.getByText('FMDDS Secure Portal')).toBeVisible();
  });
});
