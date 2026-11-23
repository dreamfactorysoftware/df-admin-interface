import { APIRequestContext, Page, expect, test } from '@playwright/test';
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  loginAsAdmin,
  waitForAppReady,
} from './fixtures/admin-login';

/**
 * The Semantic catalog section when the catalog cannot be read, on the demo
 * service `db` with the list call mocked (read-only):
 * - 404 (df-semantic not installed): the section and its jump button are gone;
 * - 403: a neutral "no access" state, no toolbar, no red error.
 */
const SERVICE = 'db';
let serviceId = 0;

async function dbServiceId(request: APIRequestContext): Promise<number> {
  const login = await request.post('/api/v2/system/admin/session', {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  expect(login.ok()).toBe(true);
  const token = (await login.json()).session_token;
  const resp = await request.get(
    `/api/v2/system/service?filter=${encodeURIComponent(`name=${SERVICE}`)}&fields=id`,
    { headers: { 'X-DreamFactory-Session-Token': token } }
  );
  expect(resp.ok()).toBe(true);
  return (await resp.json()).resource[0].id;
}

async function mockList(page: Page, status: number, message: string) {
  await page.route(
    url => url.pathname.endsWith(`/api/v2/system/semantic/${SERVICE}`),
    route =>
      route.fulfill({
        status,
        json: { error: { code: status, message, status_code: status } },
      })
  );
}

async function openService(page: Page) {
  await page.goto(
    `/dreamfactory/dist/#/api-connections/api-types/database/${serviceId}`,
    { waitUntil: 'domcontentloaded' }
  );
  // The Schema button sits beside the catalog's jump button.
  await expect(
    page.locator('mat-sidenav-content button', { hasText: /^\s*Schema\s*$/ })
  ).toBeVisible({ timeout: 20_000 });
}

test.describe('semantic catalog access', () => {
  test.beforeAll(async ({ request }) => {
    serviceId = await dbServiceId(request);
  });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await waitForAppReady(page);
  });

  test('404: the section and the jump button are hidden', async ({ page }) => {
    await mockList(
      page,
      404,
      "Resource 'semantic' not found for service 'system'."
    );
    const listed = page.waitForResponse(r =>
      r.url().endsWith(`/api/v2/system/semantic/${SERVICE}`)
    );
    await openService(page);
    await listed;
    await expect(page.getByTestId('service-semantic-section')).toBeHidden();
    await expect(page.getByTestId('semantic-jump')).toHaveCount(0);
  });

  test('403: a neutral no-access state without the toolbar', async ({
    page,
  }) => {
    await mockList(page, 403, 'Forbidden');
    await openService(page);
    const section = page.getByTestId('service-semantic-section');
    await expect(section.getByTestId('semantic-no-access')).toBeVisible({
      timeout: 20_000,
    });
    await expect(section.getByTestId('semantic-new-term')).toHaveCount(0);
    await expect(section.locator('.sem-catalog__banner--error')).toHaveCount(0);
    await expect(page.getByTestId('semantic-jump')).toBeVisible();
  });
});
