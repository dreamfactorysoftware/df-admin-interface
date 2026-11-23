import { APIRequestContext, Page, expect, test } from '@playwright/test';
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  loginAsAdmin,
  waitForAppReady,
} from './fixtures/admin-login';

/**
 * Semantic catalog at scale, on the SQLite demo service `db` with mocked
 * responses (read-only: nothing is written to the service or the catalog).
 *
 * - 1,200 tables: the editor's table picker and the draft dialog's table
 *   list render a bounded set and narrow as you type. Before, each was a
 *   mat-select with one option per table.
 * - 500 catalog entries: the list filters and pages instead of rendering
 *   every row.
 */
const SERVICE = 'db';
const TABLES = Array.from(
  { length: 1200 },
  (_, i) => `zz_t_${String(i + 1).padStart(4, '0')}`
);

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

/** The table-name list the pickers load: 1,200 names instead of db's own. */
async function mockTables(page: Page) {
  await page.route(
    new RegExp(`/api/v2/${SERVICE}/_schema\\?(.*&)?fields=name`),
    route =>
      route.fulfill({ json: { resource: TABLES.map(name => ({ name })) } })
  );
}

async function openCatalog(page: Page) {
  await page.goto(
    `/dreamfactory/dist/#/api-connections/api-types/database/${serviceId}`,
    { waitUntil: 'domcontentloaded' }
  );
  const section = page.getByTestId('semantic-catalog');
  await expect(section).toBeVisible({ timeout: 20_000 });
  await section.scrollIntoViewIfNeeded();
  return section;
}

test.describe('semantic catalog at scale', () => {
  test.beforeAll(async ({ request }) => {
    serviceId = await dbServiceId(request);
  });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await waitForAppReady(page);
  });

  test('editor table picker stays bounded with 1,200 tables', async ({
    page,
  }) => {
    await mockTables(page);
    const section = await openCatalog(page);
    await section.getByTestId('semantic-new-metric').click();
    const dialog = page.locator('mat-dialog-container');
    const picker = dialog.getByTestId('semantic-editor-table');
    await picker.click();
    const options = page.locator('.cdk-overlay-pane mat-option');
    await expect(options.first()).toBeVisible();
    // A page of names plus the "N more match" line, never 1,200 nodes.
    expect(await options.count()).toBeLessThanOrEqual(51);
    const panel = await page.locator('.cdk-overlay-pane').last().boundingBox();
    expect(panel!.height).toBeLessThanOrEqual(300);

    // Typing narrows to the one table, past the first page.
    await picker.fill('zz_t_1187');
    await expect(options).toHaveCount(1);
    await options.first().click();
    await expect(picker).toHaveValue('zz_t_1187');
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
  });

  test('draft dialog table list is bounded, searchable and capped', async ({
    page,
  }) => {
    await mockTables(page);
    await page.route('**/api/v2/system/service?*', async route => {
      if (route.request().url().includes('ai_connection')) {
        await route.fulfill({
          json: { resource: [{ id: 1, name: 'mock_ai', label: 'Mock AI' }] },
        });
      } else {
        await route.continue();
      }
    });
    // Nothing may reach the real _draft endpoint from this test.
    await page.route(`**/api/v2/system/semantic/${SERVICE}/_draft`, route =>
      route.abort()
    );
    const section = await openCatalog(page);
    await section.getByTestId('semantic-fill-menu').click();
    await page.getByTestId('semantic-draft-open').click();
    const dialog = page.locator('mat-dialog-container');

    const chips = dialog.getByTestId('semantic-draft-tables-item');
    await expect(chips.first()).toBeVisible({ timeout: 15_000 });
    expect(await chips.count()).toBeLessThanOrEqual(60);
    const list = await dialog
      .getByTestId('semantic-draft-tables-list')
      .boundingBox();
    expect(list!.height).toBeLessThanOrEqual(320);
    // 1,200 > 60: tables are required before the draft can run.
    await expect(dialog.getByTestId('semantic-draft-run')).toBeDisabled();

    await dialog
      .getByTestId('semantic-draft-tables-search')
      .locator('input')
      .fill('zz_t_118');
    await expect(chips).toHaveCount(10);
    await chips.nth(0).click();
    await chips.nth(1).click();
    await expect(
      dialog.getByTestId('semantic-draft-tables-picked')
    ).toContainText('2 / 60');
    await expect(dialog.getByTestId('semantic-draft-run')).toBeEnabled();
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
  });

  test('catalog list filters and pages 500 entries', async ({ page }) => {
    const entries = Array.from({ length: 500 }, (_, i) => ({
      id: 900000 + i,
      service: SERVICE,
      kind: 'term',
      name: `zz term ${String(i + 1).padStart(3, '0')}`,
      description: null,
      definition: { meaning: `meaning ${i + 1}` },
      status: i % 3 ? 'approved' : 'draft',
      source: 'manual',
      stale_reason: null,
      approved_date: null,
      approved_by_id: null,
      created_date: '',
      last_modified_date: '',
    }));
    // Only the list read is mocked; nothing else is intercepted.
    await page.route(
      url => url.pathname.endsWith(`/api/v2/system/semantic/${SERVICE}`),
      route =>
        route.request().method() === 'GET'
          ? route.fulfill({ json: { resource: entries } })
          : route.continue()
    );
    const section = await openCatalog(page);
    const rows = section.getByTestId('semantic-row');
    await expect(rows.first()).toBeVisible({ timeout: 15_000 });
    expect(await rows.count()).toBe(25);
    const paginator = section.getByTestId('semantic-paginator');
    await expect(paginator).toBeVisible();
    await expect(paginator).toContainText('1 – 25 of 500');

    await paginator.getByRole('button', { name: /next page/i }).click();
    await expect(rows.first()).toHaveAttribute('data-name', 'zz term 026');

    const filter = section.getByTestId('semantic-filter');
    await filter.fill('zz term 49');
    await expect(rows).toHaveCount(10);
    await expect(paginator).toHaveCount(0);
    await filter.fill('');
    await expect(rows).toHaveCount(25);
  });
});
