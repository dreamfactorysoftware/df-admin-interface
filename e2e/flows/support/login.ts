import { Page, Response } from '@playwright/test';
import { expect } from './expect';
import { APP, Credentials, ROOT_ADMIN } from './env';

/** Login and logout through the real form, the way a person does it. */
export const loginForm = (page: Page) => ({
  email: page.locator('form[name="login-form"] input[formcontrolname="email"]'),
  password: page.locator(
    'form[name="login-form"] input[formcontrolname="password"]'
  ),
  submit: page.locator('form[name="login-form"] button[type="submit"]'),
});

const isSessionPost = (kind: 'user' | 'admin') => (r: Response) =>
  r.request().method() === 'POST' &&
  new URL(r.url()).pathname.replace(/\/$/, '') ===
    (kind === 'user' ? '/api/v2/user/session' : '/api/v2/system/admin/session');

/** Fill and submit the login form that is already on screen. */
export async function submitLogin(
  page: Page,
  creds: Credentials
): Promise<Response> {
  const form = loginForm(page);
  await expect(form.email).toBeVisible({ timeout: 120_000 });
  await form.email.fill(creds.email);
  await form.password.fill(creds.password);
  const asUser = page.waitForResponse(isSessionPost('user'), {
    timeout: 120_000,
  });
  const asAdmin = page
    .waitForResponse(isSessionPost('admin'), { timeout: 120_000 })
    .catch(() => null);
  await form.submit.click();
  const user = await asUser;
  if (user.ok()) return user;
  const admin = await asAdmin;
  if (!admin) {
    throw new Error(
      `login as ${creds.email}: user/session answered ${user.status()} and the admin login was never tried`
    );
  }
  return admin;
}

/** Log in as root through the form and wait for the shell. */
export async function loginAsRoot(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.goto(`${APP}#/auth/login`);
  const res = await submitLogin(page, ROOT_ADMIN);
  expect(res.ok(), `login -> HTTP ${res.status()}`).toBe(true);
  await page.waitForURL(url => !url.hash.startsWith('#/auth'), {
    timeout: 120_000,
  });
  await waitForShell(page);
}

/** The side navigation is painted and the route content is in place. */
export async function waitForShell(page: Page): Promise<void> {
  await expect(page.locator('mat-sidenav-container').first()).toBeVisible({
    timeout: 120_000,
  });
}
