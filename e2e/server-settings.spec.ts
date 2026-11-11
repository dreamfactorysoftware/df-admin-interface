import { APIRequestContext, expect, request, test } from '@playwright/test';
import { loginAsAdmin, waitForAppReady } from './fixtures/admin-login';
import { DfApi } from './fixtures/df-api';

const PAGE = '/dreamfactory/dist/#/system-settings/config/server-settings';
const NAV_ENTRY = 'nav-system-settings-config-server-settings';
const OVERVIEW_CARD = 'a.section-card[aria-label="Server Settings"]';
const INFO_LINK = 'system-info-log-level-change';

/**
 * Server settings (#552). The backend support is detected first (the system
 * resource list has `server_setting` only on a df-system that ships it):
 * - with support: override the log level from the UI, see the override badge
 *   and the new System Info value, then reset to .env. Non-destructive: the
 *   override is always removed in afterAll.
 * - without support: the UI must show no entry point, and the direct URL must
 *   say the feature is not available. Read-only.
 */
test.describe('Server settings', () => {
  let ctx: APIRequestContext;
  let api: DfApi;
  let supported = false;
  let original: string;

  test.beforeAll(async ({ baseURL }) => {
    ctx = await request.newContext({ baseURL });
    api = await DfApi.login(ctx);
    supported = await api.hasSystemResource('server_setting');
    if (supported) {
      original = await api.getEnvironmentLogLevel();
    }
  });

  test.afterAll(async () => {
    if (supported) {
      await api.resetServerSetting('log_level');
    }
    await ctx.dispose();
  });

  const needsSupport = () =>
    test.skip(
      !supported,
      'Backend has no system/server_setting resource: it needs the df-system version that adds runtime server settings. The "backend without server settings" test covers this backend.'
    );

  test('backend without server settings: no entry points, direct URL says not available', async ({
    page,
  }) => {
    test.skip(
      supported,
      'Backend has system/server_setting: the old-backend checks do not apply.'
    );
    const serverSettingCalls: string[] = [];
    page.on('request', r => {
      if (r.url().includes('/system/server_setting')) {
        serverSettingCalls.push(`${r.method()} ${r.url()}`);
      }
    });

    await loginAsAdmin(page);
    await waitForAppReady(page);

    // nav entry
    await expect(
      page.getByTestId('nav-system-settings-config-system-info')
    ).toHaveCount(1);
    await expect(page.getByTestId(NAV_ENTRY)).toHaveCount(0);

    // overview card
    await page.goto('/dreamfactory/dist/#/system-settings');
    await expect(
      page.locator('a.section-card[aria-label="System Info"]')
    ).toBeVisible();
    await expect(page.locator(OVERVIEW_CARD)).toHaveCount(0);

    // System Info "Change" link
    await page.goto('/dreamfactory/dist/#/system-settings/config/system-info');
    await expect(page.locator('body')).toContainText('Log Level');
    await expect(page.getByTestId(INFO_LINK)).toHaveCount(0);

    // direct URL: a clear state, not a load error
    await page.goto(PAGE);
    await expect(page.getByTestId('server-settings-unavailable')).toContainText(
      'Not available on this server version'
    );
    await expect(page.getByTestId('server-settings-error')).toHaveCount(0);
    await expect(page.getByTestId('server-setting-log_level')).toHaveCount(0);
    // the UI knows from the resource list; it never calls the missing resource
    expect(serverSettingCalls).toEqual([]);
  });

  test('entry points lead to the page: nav, overview card, System Info link', async ({
    page,
  }) => {
    needsSupport();
    await loginAsAdmin(page);
    await waitForAppReady(page);

    await expect(page.getByTestId(NAV_ENTRY)).toHaveAttribute(
      'href',
      /#\/system-settings\/config\/server-settings$/
    );

    await page.goto('/dreamfactory/dist/#/system-settings');
    await expect(page.locator(OVERVIEW_CARD)).toHaveAttribute(
      'href',
      /#\/system-settings\/config\/server-settings$/
    );

    await page.goto('/dreamfactory/dist/#/system-settings/config/system-info');
    await page.getByTestId(INFO_LINK).click();
    await expect(page).toHaveURL(
      /#\/system-settings\/config\/server-settings$/
    );
    await expect(page.getByTestId('server-setting-log_level')).toBeVisible();
    await expect(page.getByTestId('server-settings-unavailable')).toHaveCount(
      0
    );
  });

  test('change the log level, then reset it to .env', async ({ page }) => {
    needsSupport();
    const target = original === 'error' ? 'debug' : 'error';

    await loginAsAdmin(page);
    await waitForAppReady(page);
    // Hash-only change: no reload, so the in-memory login survives.
    await page.goto(PAGE);

    // sidenav label and page header must be translated, not raw i18n keys
    await expect(page.locator('body')).toContainText('Server Settings');
    await expect(page.locator('body')).not.toContainText(
      /nav\.system-settings/
    );

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
    await expect(page.getByTestId('server-settings-stale')).toHaveCount(0);
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

    test.beforeEach(needsSupport);

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
          'X-DreamFactory-Session-Token': (await session.json()).session_token,
        },
      });
      expect(denied.status()).toBe(403);

      await loginAsAdmin(page, email, password);
      await waitForAppReady(page);
      // Present in the DOM or not: an entry in a collapsed nav group still
      // counts, so this cannot pass just because the group is closed.
      await expect(page.getByTestId(NAV_ENTRY)).toHaveCount(0);
      await page.goto(PAGE);
      await expect(page).toHaveURL(/#\/home/);
      await expect(page.getByTestId('server-setting-log_level')).toHaveCount(0);
    });

    test('with the Config tab: opens the page', async ({ page }) => {
      const email = await makeAdmin(['config']);

      await loginAsAdmin(page, email, password);
      await waitForAppReady(page);
      await expect(page.getByTestId(NAV_ENTRY)).toHaveCount(1);
      await page.goto(PAGE);
      await expect(page.getByTestId('server-setting-log_level')).toBeVisible();
    });
  });
});
