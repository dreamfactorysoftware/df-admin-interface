import { Page, expect } from '@playwright/test';

export const ADMIN_EMAIL =
  process.env.DF_ADMIN_EMAIL ?? 'admin@dreamfactory.com';
export const ADMIN_PASSWORD =
  process.env.DF_ADMIN_PASSWORD ?? 'passwordpassword';

/**
 * Log in via the actual UI. The admin UI keeps the session in a cookie
 * and userData in-memory; a synthetic localStorage seed does not work
 * because no code path hydrates userData from storage at bootstrap.
 */
export async function loginAsAdmin(page: Page) {
  await page.goto('/dreamfactory/dist/#/auth/login');
  // Labels come from the userManagement i18n bundle — "Enter Email" /
  // "Enter Password" in English. Use type-based selectors to stay
  // language-agnostic.
  const email = page.locator('input[type="email"]').first();
  await expect(email).toBeVisible({ timeout: 15_000 });
  await email.fill(ADMIN_EMAIL);
  await page.locator('input[type="password"]').first().fill(ADMIN_PASSWORD);

  const loginReq = page.waitForResponse(
    r =>
      r.url().includes('/api/v2/system/admin/session') &&
      r.request().method() === 'POST'
  );
  await page.getByRole('button', { name: /^login$/i }).click();
  const resp = await loginReq;
  expect(
    resp.ok(),
    `admin login HTTP ${resp.status()}: ${await resp.text()}`
  ).toBe(true);

  // After login the router navigates off /auth/login to the home route.
  await page.waitForURL(url => !url.toString().includes('/auth/login'), {
    timeout: 15_000,
  });
}

/** Wait for the admin UI shell to be fully painted. */
export async function waitForAppReady(page: Page) {
  await page.waitForSelector('mat-toolbar, mat-sidenav, nav', {
    timeout: 15_000,
  });
}
