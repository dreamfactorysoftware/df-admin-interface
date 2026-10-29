import { APIRequestContext, expect, request, test } from '@playwright/test';
import { loginAsAdmin, waitForAppReady } from './fixtures/admin-login';
import { DfApi } from './fixtures/df-api';

/**
 * Server settings (#552): override the log level from the UI, see the
 * override badge and the new System Info value, then reset to .env.
 * Non-destructive: the override is always removed in afterAll.
 */
test.describe('Server settings', () => {
  let ctx: APIRequestContext;
  let api: DfApi;
  let original: string;

  test.beforeAll(async ({ baseURL }) => {
    ctx = await request.newContext({ baseURL });
    api = await DfApi.login(ctx);
    original = await api.getEnvironmentLogLevel();
  });

  test.afterAll(async () => {
    await api.resetServerSetting('log_level');
    await ctx.dispose();
  });

  test('change the log level, then reset it to .env', async ({ page }) => {
    const target = original === 'error' ? 'debug' : 'error';

    await loginAsAdmin(page);
    await waitForAppReady(page);
    // Hash-only change: no reload, so the in-memory login survives.
    await page.goto('/dreamfactory/dist/#/system-settings/config/server-settings');

    // sidenav label and page header must be translated, not raw i18n keys
    await expect(page.locator('body')).toContainText('Server Settings');
    await expect(page.locator('body')).not.toContainText(/nav\.system-settings/);

    const row = page.getByTestId('server-setting-log_level');
    await expect(row.getByTestId('server-setting-source')).toHaveText(/\.env/);
    await expect(row.getByTestId('server-setting-reset')).toBeDisabled();

    await row.getByTestId('server-setting-select').click();
    await page.getByRole('option', { name: target, exact: true }).click();
    await row.getByTestId('server-setting-save').click();

    await expect(row.getByTestId('server-setting-source')).toHaveText(
      /override/
    );
    await expect(page.getByTestId('server-settings-view-info')).toBeVisible();
    expect(await api.getEnvironmentLogLevel()).toBe(target);

    await row.getByTestId('server-setting-reset').click();
    await page.getByTestId('confirm-dialog-confirm').click();

    await expect(row.getByTestId('server-setting-source')).toHaveText(/\.env/);
    expect(await api.getEnvironmentLogLevel()).toBe(original);
  });

  test.describe('restricted admins', () => {
    const password = 'E2e-restricted-pass1!';
    const created: { id: number; email: string }[] = [];

    const makeAdmin = async (tabs: string[]) => {
      const email = `e2e-ss-${tabs[0]}-${Date.now()}@example.com`;
      created.push({
        id: await api.createRestrictedAdmin(email, password, tabs),
        email,
      });
      return email;
    };

    test.afterAll(async () => {
      for (const a of created) {
        await api.deleteRestrictedAdmin(a.id, a.email);
      }
    });

    test('without the Config tab: API 403, no nav entry, deep link lands Home', async ({
      page,
    }) => {
      const email = await makeAdmin(['apps']);

      const session = await ctx.post('/api/v2/system/admin/session', {
        data: { email, password },
      });
      expect(session.ok()).toBe(true);
      const denied = await ctx.get('/api/v2/system/server_setting', {
        headers: {
          'X-DreamFactory-API-Key': await api.getAdminAppApiKey(),
          'X-DreamFactory-Session-Token': (await session.json())
            .session_token,
        },
      });
      expect(denied.status()).toBe(403);

      await loginAsAdmin(page, email, password);
      await waitForAppReady(page);
      await page.goto(
        '/dreamfactory/dist/#/system-settings/config/server-settings'
      );
      await expect(page).toHaveURL(/#\/home/);
      await expect(page.getByTestId('server-setting-log_level')).toHaveCount(0);
      await expect(
        page.getByRole('link', { name: 'Server Settings' })
      ).toHaveCount(0);
    });

    test('with the Config tab: opens the page', async ({ page }) => {
      const email = await makeAdmin(['config']);

      await loginAsAdmin(page, email, password);
      await waitForAppReady(page);
      await page.goto(
        '/dreamfactory/dist/#/system-settings/config/server-settings'
      );
      await expect(page.getByTestId('server-setting-log_level')).toBeVisible();
    });
  });
});
