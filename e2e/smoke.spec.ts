import { test, expect } from '@playwright/test';
import { loginAsAdmin, waitForAppReady } from './fixtures/admin-login';

test.describe('Admin UI smoke', () => {
  test('admin login + app shell loads without console errors', async ({
    page,
  }) => {
    // Track uncaught JS exceptions only. Generic "Failed to load resource"
    // notices (4xx/5xx fetches) are covered separately by the network
    // assertions below and are too noisy for a smoke check.
    const jsErrors: string[] = [];
    page.on('pageerror', err => jsErrors.push(err.message));

    await loginAsAdmin(page);
    await waitForAppReady(page);

    // Every nav label should be translated — raw Transloco keys like
    // "nav.ai.nav" mean the i18n bundle didn't load. This was the
    // clearest tell of the stale public/ issue on the Triskele install.
    const body = await page.textContent('body');
    expect(body, 'raw transloco key leaked through').not.toMatch(
      /\bnav\.[a-z]+\.(nav|title)\b/
    );

    // Static assets under /dreamfactory/dist/assets must resolve. A 404
    // here is the original ace-builds + fonts bug class.
    const aceModeResponse = await page.request.get(
      '/dreamfactory/dist/assets/ace-builds/mode-javascript.js'
    );
    expect(aceModeResponse.ok(), 'ace mode asset must 200').toBe(true);

    expect(jsErrors, 'page threw uncaught JS exceptions').toEqual([]);
  });

  test('top-nav entries navigate without errors', async ({ page }) => {
    await loginAsAdmin(page);
    await waitForAppReady(page);

    // Paths taken from routes.ts. Each should render without throwing.
    const paths = [
      '/api-connections/api-types',
      '/api-connections/roles',
      '/api-connections/api-keys',
      '/event-scripts',
      '/system-settings/config',
    ];

    for (const p of paths) {
      const url = `/dreamfactory/dist/#${p}`;
      const responses: number[] = [];
      page.on('response', r => {
        if (r.url().includes('/api/v2/')) responses.push(r.status());
      });
      await page.goto(url);
      // Wait for any xhr to land or for the page to settle.
      await page.waitForLoadState('networkidle', { timeout: 15_000 });

      // No 5xx on any backend call triggered by the navigation.
      expect(
        responses.filter(s => s >= 500),
        `${p} produced 5xx responses`
      ).toEqual([]);
    }
  });
});
