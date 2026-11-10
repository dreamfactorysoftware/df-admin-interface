import { test, expect } from './support/test';
import { APP, ROOT_ADMIN } from './support/env';
import {
  loginAsRoot,
  loginForm,
  submitLogin,
  waitForShell,
} from './support/login';
import { openRoute, routeOf } from './support/system';
import { content, expectRealText } from './support/ui';

/** Login, wrong password, form validation, logout, session expiry. */
test.describe.configure({ timeout: 240_000 });

const SESSION = /\/api\/v2\/system\/admin\/session/;

test('login with valid credentials lands on Home with the shell', async ({
  page,
}) => {
  await page.goto(`${APP}#/auth/login`);
  const res = await submitLogin(page, ROOT_ADMIN);
  expect(res.status(), 'login must answer 200').toBe(200);
  const body = await res.json();
  expect(body.session_token, 'the session carries a token').toBeTruthy();
  expect(body.email).toBe(ROOT_ADMIN.email);

  await page.waitForURL(u => u.hash.startsWith('#/home'), { timeout: 20_000 });
  await waitForShell(page);
  // The session cookie is what a reload relies on.
  const cookies = await page.context().cookies();
  expect(
    cookies.find(c => c.name === 'session_token')?.value,
    'session_token cookie must be set after login'
  ).toBe(body.session_token);
  // The shell shows the navigation, not the login form.
  await expect(page.getByTestId('nav-group-api-connections')).toBeVisible();
  await expect(loginForm(page).email).toHaveCount(0);
});

test('wrong password shows an inline error and does not log in', async ({
  page,
  watch,
}) => {
  watch.allowHttp({
    status: 401,
    method: 'POST',
    url: SESSION,
    reason: 'deliberate wrong password',
  });
  watch.allowConsole(
    /Invalid credentials supplied/,
    'the app logs the refused login as an unhandled error'
  );
  await page.goto(`${APP}#/auth/login`);
  const res = await submitLogin(page, {
    email: ROOT_ADMIN.email,
    password: 'definitely-not-the-password-1',
  });
  expect(res.status()).toBe(401);

  const alert = page.locator('df-alert').first();
  await expect(alert, 'an error banner must explain the failure').toBeVisible();
  expectRealText(await alert.innerText(), 'login error banner');
  expect(routeOf(new URL(page.url())), 'the user stays on the login page').toBe(
    '/auth/login'
  );
  await expect(loginForm(page).email).toHaveValue(ROOT_ADMIN.email);
  expect(
    (await page.context().cookies()).find(c => c.name === 'session_token')
      ?.value ?? '',
    'no session cookie after a failed login'
  ).toBe('');

  // The same form still works with the right password.
  const ok = await submitLogin(page, ROOT_ADMIN);
  expect(ok.status()).toBe(200);
  await page.waitForURL(u => u.hash.startsWith('#/home'));
});

test('empty and malformed input is rejected in the form, no request sent', async ({
  page,
  watch,
}) => {
  await page.goto(`${APP}#/auth/login`);
  const form = loginForm(page);
  await expect(form.email).toBeVisible();

  await form.submit.click();
  await expect(
    page.locator('form[name="login-form"] mat-error').first(),
    'a required-field error must show'
  ).toBeVisible();
  for (const text of await page
    .locator('form[name="login-form"] mat-error')
    .allInnerTexts()) {
    expectRealText(text, 'login validation message');
  }

  await form.email.fill('not-an-email');
  await form.password.fill('some-long-password-01');
  await form.submit.click();
  await expect(
    page.locator('form[name="login-form"] mat-error').first()
  ).toBeVisible();

  expect(
    watch.writesTo(/\/session/),
    'an invalid form must not send a login request'
  ).toEqual([]);
  expect(routeOf(new URL(page.url()))).toBe('/auth/login');
});

test('logout ends the session and protected pages ask for login again', async ({
  page,
  api,
  watch,
}) => {
  await loginAsRoot(page);
  const token = (await page.context().cookies()).find(
    c => c.name === 'session_token'
  )!.value;

  // Known defect F-02: logging out can fire requests with the session that
  // was just ended. Allowed so this test judges the logout itself.
  watch.allowHttp({
    status: [400, 401, 403],
    method: 'GET',
    url: /^\/(api\/v2\/system\/(role|service|service_type)|_internal\/ai\/usage)\b/,
    reason: 'F-02: data requests sent during and after logout',
    optional: true,
  });
  await page.locator('button.profile-icon').click();
  const loggedOut = page.waitForResponse(
    r => SESSION.test(r.url()) && r.request().method() === 'DELETE'
  );
  await page.getByRole('menuitem', { name: /^\s*log\s*out\s*$/i }).click();
  expect((await loggedOut).ok(), 'DELETE session must succeed').toBe(true);

  await page.waitForURL(u => u.hash.startsWith('#/auth/login'));
  await expect(loginForm(page).email).toBeVisible();
  expect(
    (await page.context().cookies()).find(c => c.name === 'session_token')
      ?.value ?? '',
    'the session cookie is cleared on logout'
  ).toBe('');

  // The server really ended the session: the old token is refused.
  const stale = await api.asClient('GET', '/api/v2/system/role?limit=1', {
    sessionToken: token,
  });
  expect(
    stale.status(),
    'the old session token must not work after logout'
  ).toBeGreaterThanOrEqual(401);

  // A protected deep link now bounces to login.
  watch.allowHttp({
    status: [401, 403],
    url: /\/api\/v2\//,
    reason: 'session check of a logged-out browser',
    optional: true,
  });
  await page.goto(`${APP}#/api-connections/role-based-access`);
  await page.reload();
  await page.waitForURL(u => u.hash.startsWith('#/auth'));
  await expect(loginForm(page).email).toBeVisible();
});

test('an expired session redirects to login and returns to the page', async ({
  page,
  api,
  watch,
}) => {
  await loginAsRoot(page);
  await openRoute(page, '/api-connections/role-based-access');
  await expect(content(page).locator('table[mat-table]')).toBeVisible();

  // Expire the session on the server, exactly what a timeout does: the token
  // the browser still holds is no longer valid.
  const token = (await page.context().cookies()).find(
    c => c.name === 'session_token'
  )!.value;
  const killed = await api.asClient('DELETE', '/api/v2/system/admin/session', {
    sessionToken: token,
  });
  expect(killed.ok(), 'server-side logout of the browser session').toBe(true);

  watch.allowHttp({
    status: [401, 403],
    url: /\/api\/v2\//,
    reason: 'the browser session was expired on the server on purpose',
  });
  // The next thing the user does needs the API.
  const apiKeys = page.getByTestId('nav-api-connections-api-keys');
  await expect(
    apiKeys,
    'the navigation group of the current page is open'
  ).toBeVisible();
  await apiKeys.click();
  await page.waitForURL(u => u.hash.startsWith('#/auth/login'), {
    timeout: 20_000,
  });
  await expect(loginForm(page).email).toBeVisible();
  const returnUrl = new URLSearchParams(
    new URL(page.url()).hash.split('?')[1] ?? ''
  ).get('returnUrl');
  expect(
    returnUrl,
    'the login page must remember the page the user was on or going to'
  ).toMatch(/^\/api-connections\/(api-keys|role-based-access)/);

  const res = await submitLogin(page, ROOT_ADMIN);
  expect(res.ok()).toBe(true);
  await page.waitForURL(u => u.hash.startsWith(`#${returnUrl}`), {
    timeout: 20_000,
  });
  await waitForShell(page);
  await expect(
    content(page).locator('table[mat-table]'),
    'the page the user returns to must load its data with the new session'
  ).toBeVisible();
  await expect(content(page).locator('tr[mat-row]').first()).toBeVisible();
});
