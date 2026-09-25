import {
  APIRequestContext,
  Locator,
  Page,
  expect,
  test,
} from '@playwright/test';
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  loginAsAdmin,
  waitForAppReady,
} from './fixtures/admin-login';

/**
 * Semantic catalog tab on a database service (df-semantic).
 *
 * Drives the real UI against the SQLite demo service `db`: creates a term, a
 * metric and a verified query, approves them, checks the agent preview, shows
 * a server 400 inline, then deletes everything through the UI.
 *
 * Non-destructive: every entry this suite creates is named `uitest ...`, and
 * only those are cleaned up (before and after), via the system API.
 *
 * Screenshots (light and dark) are written only when SEM_SCREENS_DIR is set.
 */

const SERVICE = 'db';
const PREFIX = 'uitest ';
const TERM = `${PREFIX}open order`;
const METRIC = `${PREFIX}revenue`;
const QUERY = `${PREFIX}orders for a customer`;
const BAD = `${PREFIX}bad metric`;
const SCREENS = process.env['SEM_SCREENS_DIR'];

async function apiToken(request: APIRequestContext): Promise<string> {
  const resp = await request.post('/api/v2/system/admin/session', {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  expect(resp.ok(), `admin API login HTTP ${resp.status()}`).toBe(true);
  return (await resp.json()).session_token;
}

async function cleanup(request: APIRequestContext) {
  const token = await apiToken(request);
  const headers = { 'X-DreamFactory-Session-Token': token };
  const resp = await request.get(`/api/v2/system/semantic/${SERVICE}`, {
    headers,
  });
  expect(resp.ok()).toBe(true);
  for (const e of (await resp.json()).resource ?? []) {
    if (typeof e.name === 'string' && e.name.startsWith(PREFIX)) {
      await request.delete(`/api/v2/system/semantic/${SERVICE}/${e.id}`, {
        headers,
      });
    }
  }
}

async function dbServiceId(request: APIRequestContext): Promise<number> {
  const token = await apiToken(request);
  const resp = await request.get(
    `/api/v2/system/service?filter=${encodeURIComponent(`name=${SERVICE}`)}&fields=id`,
    { headers: { 'X-DreamFactory-Session-Token': token } }
  );
  expect(resp.ok()).toBe(true);
  return (await resp.json()).resource[0].id;
}

async function shot(page: Page, name: string, target?: Locator) {
  if (!SCREENS) return;
  const path = `${SCREENS}/${name}.png`;
  if (target) await target.screenshot({ path });
  else await page.screenshot({ path });
}

/** Choose option(s) in a mat-select inside the open dialog. */
async function pick(page: Page, testId: string, ...options: string[]) {
  await choose(page, testId, false, options);
}

async function pickMany(page: Page, testId: string, ...options: string[]) {
  await choose(page, testId, true, options);
}

async function choose(
  page: Page,
  testId: string,
  multi: boolean,
  options: string[]
) {
  const dialog = page.locator('mat-dialog-container');
  await dialog.getByTestId(testId).click();
  for (const o of options) {
    await page
      .locator('.cdk-overlay-pane mat-option')
      .filter({ hasText: new RegExp(`^\\s*${o.replace('*', '\\*')}\\s*$`) })
      .click();
  }
  // A multi-select stays open; close only its panel, never the dialog.
  if (multi) {
    await page.keyboard.press('Escape');
    await expect(page.locator('.mat-mdc-select-panel')).toHaveCount(0);
  }
}

function row(page: Page, name: string) {
  return page.locator(`[data-testid="semantic-row"][data-name="${name}"]`);
}

let serviceId = 0;

/**
 * Make the column picker offer a column the database does not have, as a
 * stale schema cache would, so the server's 400 can be exercised from the UI.
 */
async function injectUnknownColumn(page: Page) {
  await page.route(`**/api/v2/${SERVICE}/_schema/orders`, async route => {
    const resp = await route.fetch();
    const body = await resp.json();
    body.field = [...(body.field ?? []), { name: 'amount' }];
    await route.fulfill({ response: resp, json: body });
  });
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

test.describe.serial('semantic catalog', () => {
  test.beforeAll(async ({ request }) => {
    serviceId = await dbServiceId(request);
    await cleanup(request);
  });

  test.afterAll(async ({ request }) => {
    await cleanup(request);
  });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await waitForAppReady(page);
  });

  test('create a term, a metric and a query, approve, preview', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const jsErrors: string[] = [];
    page.on('pageerror', e => jsErrors.push(e.message));
    const section = await openCatalog(page);
    const dialog = page.locator('mat-dialog-container');

    // ---- term ----
    await section.getByTestId('semantic-new-term').click();
    await expect(dialog.getByTestId('semantic-editor-title')).toHaveText(
      /New term/i
    );
    await dialog.getByTestId('semantic-editor-name').fill(TERM);
    await dialog
      .getByTestId('semantic-editor-meaning')
      .fill('An order that has not shipped yet: pending or processing.');
    const syn = dialog.getByTestId('semantic-editor-synonyms');
    await syn.fill('open');
    await syn.press('Enter');
    await syn.fill('in-flight order');
    await syn.press('Enter');
    await dialog
      .getByRole('checkbox', { name: /Maps to a table or column/i })
      .check();
    await pick(page, 'semantic-editor-map-table', 'orders');
    await pick(page, 'semantic-editor-map-field', 'status');
    await dialog.getByRole('radio', { name: /A filter/i }).check();
    await dialog
      .getByTestId('semantic-editor-map-filter')
      .fill("status in ('pending','processing')");
    await shot(page, 'light-editor-term', dialog);
    await dialog.getByTestId('semantic-editor-save').click();
    await expect(dialog).toHaveCount(0);
    await expect(row(page, TERM)).toBeVisible();
    await expect(row(page, TERM).getByTestId('semantic-status')).toHaveText(
      /Draft/
    );

    // ---- metric ----
    await section.getByTestId('semantic-new-metric').click();
    await dialog.getByTestId('semantic-editor-name').fill(METRIC);
    await pick(page, 'semantic-editor-table', 'orders');
    // default function is SUM; the field picker lists the table's columns
    await pick(page, 'semantic-editor-agg-field', 'total_amount');
    await dialog.getByTestId('semantic-editor-agg-alias').fill('revenue');
    await pickMany(page, 'semantic-editor-group-by', 'status');
    await dialog.getByTestId('semantic-editor-unit').fill('USD');
    await shot(page, 'light-editor-metric', dialog);
    await dialog.getByTestId('semantic-editor-save').click();
    await expect(dialog).toHaveCount(0);
    await expect(row(page, METRIC)).toContainText(
      'SUM(total_amount) on orders by status'
    );

    // ---- query (with a placeholder the UI flags until it is declared) ----
    await section.getByTestId('semantic-new-query').click();
    await dialog.getByTestId('semantic-editor-name').fill(QUERY);
    await dialog
      .getByTestId('semantic-editor-question')
      .fill('What are the orders for customer X?');
    await pick(page, 'semantic-editor-table', 'orders');
    await pickMany(
      page,
      'semantic-editor-fields',
      'id',
      'order_date',
      'status',
      'total_amount'
    );
    await dialog
      .getByTestId('semantic-editor-filter')
      .fill('customer_id = {customer_id}');
    const warning = dialog.getByTestId('semantic-editor-param-warning');
    await expect(warning).toContainText('customer_id');
    await warning.getByRole('button', { name: /Declare/i }).click();
    await expect(warning).toHaveCount(0);
    await pick(page, 'semantic-editor-param-type', 'integer');
    await dialog.getByTestId('semantic-editor-order').fill('order_date DESC');
    await dialog.getByTestId('semantic-editor-limit').fill('20');
    await shot(page, 'light-editor-query', dialog);
    await dialog.getByTestId('semantic-editor-save').click();
    await expect(dialog).toHaveCount(0);
    await expect(row(page, QUERY)).toBeVisible();

    // ---- approve all three ----
    for (const name of [TERM, METRIC, QUERY]) {
      await row(page, name).getByTestId('semantic-approve').click();
      await expect(row(page, name).getByTestId('semantic-status')).toHaveText(
        /Approved/
      );
    }
    await shot(page, 'light-list', section);

    // ---- check against schema: all three still match ----
    await section.getByTestId('semantic-validate').click();
    await expect(section.getByTestId('semantic-validate-result')).toContainText(
      /All still match/
    );

    // ---- preview shows exactly the approved block ----
    await section.getByTestId('semantic-preview-open').click();
    const preview = dialog.getByTestId('semantic-preview');
    await expect(
      preview.getByTestId('semantic-preview-glossary')
    ).toContainText(TERM);
    const metrics = preview.getByTestId('semantic-preview-metrics');
    await expect(metrics).toContainText(METRIC);
    await expect(metrics).toContainText('aggregate_data');
    await expect(metrics).toContainText('"table_name": "orders"');
    const queries = preview.getByTestId('semantic-preview-queries');
    await expect(queries).toContainText('What are the orders for customer X?');
    await expect(queries).toContainText('get_table_data');
    await expect(queries).toContainText('{customer_id}');
    await shot(page, 'light-preview', dialog);
    await preview.getByTestId('semantic-preview-raw').click();
    await expect(preview.getByTestId('semantic-preview-raw')).toContainText(
      '"verified_queries"'
    );
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);

    // ---- back to draft takes it out of the preview state ----
    await row(page, METRIC).getByTestId('semantic-unapprove').click();
    await expect(row(page, METRIC).getByTestId('semantic-status')).toHaveText(
      /Draft/
    );
    await row(page, METRIC).getByTestId('semantic-approve').click();
    await expect(row(page, METRIC).getByTestId('semantic-status')).toHaveText(
      /Approved/
    );

    expect(jsErrors).toEqual([]);
  });

  test('a server 400 (unknown column) is shown inline', async ({ page }) => {
    // The server must reject the unknown column and the editor show its message.
    await injectUnknownColumn(page);
    const section = await openCatalog(page);
    const dialog = page.locator('mat-dialog-container');
    await section.getByTestId('semantic-new-metric').click();
    await dialog.getByTestId('semantic-editor-name').fill(BAD);
    // Picking the table fetches its columns; wait for that (patched) response
    // before opening the column picker, which can otherwise open on the list
    // from before the columns arrived.
    const columns = page.waitForResponse(r =>
      r.url().includes(`/api/v2/${SERVICE}/_schema/orders`)
    );
    await pick(page, 'semantic-editor-table', 'orders');
    await columns;
    await pick(page, 'semantic-editor-agg-field', 'amount');
    await dialog.getByTestId('semantic-editor-save').click();
    const err = dialog.getByTestId('semantic-editor-error');
    await expect(err).toContainText('column orders.amount does not exist');
    await expect(dialog).toBeVisible();
    await shot(page, 'light-validation-error', dialog);

    // Client-side mirror: * only with COUNT, before any request.
    await pick(page, 'semantic-editor-agg-function', 'COUNT');
    await pick(page, 'semantic-editor-agg-field', '*');
    await pick(page, 'semantic-editor-agg-function', 'AVG');
    await dialog.getByTestId('semantic-editor-save').click();
    await expect(
      dialog.getByTestId('semantic-editor-client-errors')
    ).toContainText('needs a field');
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(row(page, BAD)).toHaveCount(0);
  });

  test('dark theme renders list, editors and preview', async ({ page }) => {
    test.skip(!SCREENS, 'screenshots only');
    await injectUnknownColumn(page);
    const section = await openCatalog(page);
    await page.evaluate(() => {
      localStorage.setItem('isDarkMode', 'true');
      document.body.classList.add('dark-theme');
    });
    const dialog = page.locator('mat-dialog-container');
    await section.scrollIntoViewIfNeeded();
    await shot(page, 'dark-list', section);
    for (const [name, kind] of [
      [TERM, 'term'],
      [METRIC, 'metric'],
      [QUERY, 'query'],
    ]) {
      await row(page, name).getByTestId('semantic-edit').click();
      await expect(dialog.getByTestId('semantic-editor-name')).toHaveValue(
        name
      );
      await page.waitForTimeout(400);
      await shot(page, `dark-editor-${kind}`, dialog);
      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
    }
    await section.getByTestId('semantic-preview-open').click();
    await expect(dialog.getByTestId('semantic-preview-metrics')).toBeVisible();
    await shot(page, 'dark-preview', dialog);
    await page.keyboard.press('Escape');

    await section.getByTestId('semantic-new-metric').click();
    await dialog.getByTestId('semantic-editor-name').fill(BAD);
    // Picking the table fetches its columns; wait for that (patched) response
    // before opening the column picker, which can otherwise open on the list
    // from before the columns arrived.
    const columns = page.waitForResponse(r =>
      r.url().includes(`/api/v2/${SERVICE}/_schema/orders`)
    );
    await pick(page, 'semantic-editor-table', 'orders');
    await columns;
    await pick(page, 'semantic-editor-agg-field', 'amount');
    await dialog.getByTestId('semantic-editor-save').click();
    await expect(dialog.getByTestId('semantic-editor-error')).toBeVisible();
    await shot(page, 'dark-validation-error', dialog);
    await page.keyboard.press('Escape');
    await page.evaluate(() => {
      localStorage.setItem('isDarkMode', 'false');
      document.body.classList.remove('dark-theme');
    });
  });

  test('delete removes the entries', async ({ page }) => {
    const section = await openCatalog(page);
    for (const name of [TERM, METRIC, QUERY]) {
      await row(page, name).getByTestId('semantic-delete').click();
      await page.getByTestId('confirm-dialog-confirm').click();
      await expect(row(page, name)).toHaveCount(0);
    }
    // Nothing named uitest is left server-side either.
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(
      page
        .getByTestId('semantic-empty')
        .or(page.getByTestId('semantic-kind-filter'))
    ).toBeVisible({ timeout: 20_000 });
    await expect(
      section.locator('[data-testid="semantic-row"][data-name^="uitest "]')
    ).toHaveCount(0);
    if (await page.getByTestId('semantic-empty').isVisible()) {
      await shot(page, 'light-empty', page.getByTestId('semantic-catalog'));
    }
  });
});
