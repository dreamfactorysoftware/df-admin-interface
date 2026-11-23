import { test, expect, Page } from '@playwright/test';
import { loginAsAdmin, waitForAppReady } from './fixtures/admin-login';
import { DfApi } from './fixtures/df-api';

/**
 * The opt-in semantic switches on the MCP Settings tab (Semantic catalog,
 * Semantic tools, Compact results): flipping one and saving writes its
 * stored flag. Runs against an existing MCP service named by
 * E2E_SEMANTIC_MCP (default eval_employees); each test reads the flag first
 * and puts it back, so the service ends as it started.
 */
const SERVICE = process.env['E2E_SEMANTIC_MCP'] || 'eval_employees';

const SWITCHES = [
  { column: 'semantic_catalog', testId: 'mcp-semantic-catalog-toggle' },
  { column: 'semantic_tools', testId: 'mcp-semantic-tools-toggle' },
  { column: 'compact_results', testId: 'mcp-compact-results-toggle' },
];

async function saveAndWait(page: Page, id: number): Promise<void> {
  const put = page.waitForResponse(
    r =>
      r.url().includes(`/api/v2/system/service/${id}`) &&
      r.request().method() === 'PUT'
  );
  await page.getByTestId('mcp-save').click();
  const resp = await put;
  expect(resp.ok(), `save PUT -> HTTP ${resp.status()}`).toBe(true);
}

async function openSettings(page: Page, id: number) {
  await page.goto(`/dreamfactory/dist/#/ai/mcp/${id}`, {
    waitUntil: 'domcontentloaded',
  });
  await expect(page.getByTestId('mcp-tab-connect')).toBeVisible({
    timeout: 15_000,
  });
  await page.getByTestId('mcp-tab-settings').click();
}

for (const sw of SWITCHES) {
  test(`${sw.column} switch saves on and off`, async ({ page, request }) => {
    const api = await DfApi.login(request);
    const svc = await api.getServiceByName(SERVICE);
    test.skip(!svc, `no MCP service named ${SERVICE} on this instance`);
    const id = svc.id as number;
    const snapshot = await api.snapshotService(id);
    const config = snapshot.config ?? {};
    test.skip(
      !(sw.column in config),
      `${sw.column} is not a column on this instance yet (migration pending)`
    );
    const initial = config[sw.column] === true;

    await loginAsAdmin(page);
    await waitForAppReady(page);
    await openSettings(page, id);

    const toggle = page.getByTestId(sw.testId);
    const switchBtn = toggle.locator('button[role="switch"]');
    await expect(switchBtn).toHaveAttribute('aria-checked', String(initial));

    try {
      await toggle.click();
      await expect(switchBtn).toHaveAttribute('aria-checked', String(!initial));
      await expect(page.getByTestId('mcp-dirty-bar')).toBeVisible();
      await saveAndWait(page, id);
      expect((await api.getService(id)).config[sw.column]).toBe(!initial);

      await toggle.click();
      await expect(switchBtn).toHaveAttribute('aria-checked', String(initial));
      await saveAndWait(page, id);
      expect((await api.getService(id)).config[sw.column]).toBe(initial);
    } finally {
      // Whatever failed above, leave the stored flag as it was.
      const now = (await api.getService(id)).config?.[sw.column] === true;
      if (now !== initial) await api.restoreService(snapshot);
    }
  });
}
