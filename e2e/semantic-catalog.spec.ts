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
const NOTE = `${PREFIX}zero totals`;
const IMPORTED = `${PREFIX}imported term`;
const SCREENS = process.env['SEM_SCREENS_DIR'];

async function apiToken(request: APIRequestContext): Promise<string> {
  const resp = await request.post('/api/v2/system/admin/session', {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  expect(resp.ok(), `admin API login HTTP ${resp.status()}`).toBe(true);
  return (await resp.json()).session_token;
}

/**
 * What this suite changed that is not named `uitest ...`: the entries the seed
 * test created (ids diffed around its seed click), drafts that already existed
 * and that bulk approve approved, and the orders.status description and label
 * it records (restored to what they were). Everything else on the service is
 * left alone, so the suite can run against a catalog other people use.
 */
const created = new Set<number>();
const approvedByUs = new Set<number>();
let statusMeta: { description: string; label: string } | null = null;

async function authHeaders(request: APIRequestContext) {
  return { 'X-DreamFactory-Session-Token': await apiToken(request) };
}

async function listEntries(
  request: APIRequestContext,
  headers: Record<string, string>
): Promise<
  Array<{ id: number; name: string; status: string; source: string }>
> {
  const resp = await request.get(`/api/v2/system/semantic/${SERVICE}`, {
    headers,
  });
  expect(resp.ok()).toBe(true);
  return (await resp.json()).resource ?? [];
}

async function cleanup(request: APIRequestContext) {
  const headers = await authHeaders(request);
  for (const e of await listEntries(request, headers)) {
    if (
      (typeof e.name === 'string' && e.name.startsWith(PREFIX)) ||
      created.has(e.id)
    ) {
      await request.delete(`/api/v2/system/semantic/${SERVICE}/${e.id}`, {
        headers,
      });
    } else if (approvedByUs.has(e.id) && e.status === 'approved') {
      await request.post(
        `/api/v2/system/semantic/${SERVICE}/${e.id}/unapprove`,
        { headers, data: {} }
      );
    }
  }
  created.clear();
  approvedByUs.clear();
  if (statusMeta) {
    await request.patch(`/api/v2/${SERVICE}/_schema/orders/_field/status`, {
      headers,
      data: statusMeta,
    });
    statusMeta = null;
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

/**
 * Type into a table picker (an autocomplete that renders a bounded list of
 * matches) and choose the exact name.
 */
async function pickTable(page: Page, testId: string, name: string) {
  const input = page.locator('mat-dialog-container').getByTestId(testId);
  await input.click();
  await input.fill(name);
  await page
    .locator('.cdk-overlay-pane mat-option')
    .filter({ hasText: new RegExp(`^\\s*${name}\\s*$`) })
    .first()
    .click();
  await expect(input).toHaveValue(name);
  await expect(page.locator('.mat-mdc-autocomplete-panel')).toHaveCount(0);
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
  const option = (o: string) =>
    page
      .locator('.cdk-overlay-pane mat-option')
      .filter({ hasText: new RegExp(`^\\s*${o.replace('*', '\\*')}\\s*$`) });
  const panel = page.locator('.mat-mdc-select-panel');
  // A previous select's transparent backdrop fades out after its panel closes;
  // a trigger click that lands on it opens nothing.
  await expect(page.locator('.cdk-overlay-transparent-backdrop')).toHaveCount(
    0
  );
  const trigger = dialog.getByTestId(testId);
  // Right after a dialog re-renders, the first click on a trigger sometimes
  // focuses the select without opening it; a second click toggles it open.
  for (let attempt = 0; ; attempt++) {
    await trigger.click();
    try {
      await expect(panel).toBeVisible({ timeout: 2000 });
      break;
    } catch (err) {
      if (attempt === 2) throw err;
    }
  }
  // Column options arrive after the panel opened (the schema loads lazily), so
  // the overlay was positioned for a near-empty list and the grown panel can
  // hang off-screen, where a real click never lands. Wait for the option, then
  // select it with a dispatched click: mat-option handles it the same way.
  for (const o of options) {
    await expect(option(o)).toBeAttached();
    await option(o).dispatchEvent('click');
  }
  if (!multi) await expect(panel).toHaveCount(0);
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
  // The list pages at 25; on a busy catalog show 100 so the rows this suite
  // looks up by name are on screen.
  await expect(
    section
      .getByTestId('semantic-kind-filter')
      .or(section.getByTestId('semantic-empty'))
  ).toBeVisible({ timeout: 20_000 });
  const paginator = section.getByTestId('semantic-paginator');
  if (await paginator.count()) {
    await paginator.locator('mat-select').click();
    await page.locator('mat-option', { hasText: /^\s*100\s*$/ }).click();
  }
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
    await pickTable(page, 'semantic-editor-map-table', 'orders');
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
    await pickTable(page, 'semantic-editor-table', 'orders');
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
    await pickTable(page, 'semantic-editor-table', 'orders');
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

  test('a note becomes a warning ahead of the metrics', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', e => jsErrors.push(e.message));
    const section = await openCatalog(page);
    const dialog = page.locator('mat-dialog-container');

    await section.getByTestId('semantic-new-note').click();
    await expect(dialog.getByTestId('semantic-editor-title')).toHaveText(
      /New note/i
    );
    await dialog.getByTestId('semantic-editor-name').fill(NOTE);
    await dialog
      .getByTestId('semantic-editor-text')
      .fill('Orders with total_amount = 0 are test rows; exclude them.');
    await dialog.getByTestId('semantic-editor-add-target').click();
    await pickTable(page, 'semantic-editor-target-table', 'orders');
    await pick(page, 'semantic-editor-target-field', 'total_amount');
    await shot(page, 'light-editor-note', dialog);
    await dialog.getByTestId('semantic-editor-save').click();
    await expect(dialog).toHaveCount(0);
    await expect(row(page, NOTE)).toBeVisible();
    await expect(row(page, NOTE)).toContainText(
      'orders.total_amount: Orders with total_amount = 0'
    );

    await row(page, NOTE).getByTestId('semantic-approve').click();
    await expect(row(page, NOTE).getByTestId('semantic-status')).toHaveText(
      /Approved/
    );

    await section.getByTestId('semantic-preview-open').click();
    const preview = dialog.getByTestId('semantic-preview');
    const warnings = preview.getByTestId('semantic-preview-warnings');
    await expect(warnings).toContainText(
      `${NOTE} (orders.total_amount): Orders with total_amount = 0 are test rows; exclude them.`
    );
    // Warnings render before the glossary, as the agent receives them.
    const order = await preview
      .locator('[data-testid^="semantic-preview-"]')
      .evaluateAll(els => els.map(e => e.getAttribute('data-testid')));
    expect(order.indexOf('semantic-preview-warnings')).toBeLessThan(
      order.indexOf('semantic-preview-glossary')
    );
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);

    // Edit: switch to info and the preview moves it to the notes section.
    await row(page, NOTE).getByTestId('semantic-edit').click();
    await pick(page, 'semantic-editor-severity', 'Info');
    await dialog.getByTestId('semantic-editor-save').click();
    await expect(dialog).toHaveCount(0);
    await expect(row(page, NOTE).getByTestId('semantic-status')).toHaveText(
      /Draft/
    );
    await row(page, NOTE).getByTestId('semantic-approve').click();
    await expect(row(page, NOTE).getByTestId('semantic-status')).toHaveText(
      /Approved/
    );
    await section.getByTestId('semantic-preview-open').click();
    await expect(preview.getByTestId('semantic-preview-notes')).toContainText(
      NOTE
    );
    await expect(preview.getByTestId('semantic-preview-warnings')).toHaveCount(
      0
    );
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);

    expect(jsErrors).toEqual([]);
  });

  test('seed, review and bulk-approve; draft with AI (mocked); import', async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);
    const jsErrors: string[] = [];
    page.on('pageerror', e => jsErrors.push(e.message));

    // A description to seed from, recorded through the schema API; the
    // current one is kept so cleanup can put it back.
    const headers = await authHeaders(request);
    const field = await request.get(
      `/api/v2/${SERVICE}/_schema/orders/_field/status`,
      { headers }
    );
    expect(field.ok()).toBe(true);
    const before = await field.json();
    statusMeta = {
      description: before.description ?? '',
      label: before.label ?? '',
    };
    const patched = await request.patch(
      `/api/v2/${SERVICE}/_schema/orders/_field/status`,
      {
        headers,
        data: {
          description:
            'Order status: pending, processing, shipped or cancelled.',
          label: 'Order status',
        },
      }
    );
    expect(patched.ok()).toBe(true);

    const section = await openCatalog(page);
    const dialog = page.locator('mat-dialog-container');

    // ---- seed ----
    const idsBefore = new Set(
      (await listEntries(request, headers)).map(e => e.id)
    );
    await section.getByTestId('semantic-fill-menu').click();
    await page.getByTestId('semantic-seed').click();
    const banner = section.getByTestId('semantic-action-banner');
    await expect(banner).toContainText(/Seeded \d+ draft terms/);
    const afterSeed = await listEntries(request, headers);
    for (const e of afterSeed) if (!idsBefore.has(e.id)) created.add(e.id);
    // Drafts that were already waiting get approved by "approve all" too;
    // cleanup sends them back to draft.
    for (const e of afterSeed) {
      if (
        !created.has(e.id) &&
        !e.name.startsWith(PREFIX) &&
        e.status === 'draft' &&
        e.source !== 'manual'
      ) {
        approvedByUs.add(e.id);
      }
    }
    const seeded = row(page, 'Order status');
    await expect(seeded).toBeVisible();
    await expect(seeded.getByTestId('semantic-source')).toHaveText(/Seeded/);
    await expect(seeded.getByTestId('semantic-status')).toHaveText(/Draft/);

    // ---- review mode lists only the automated drafts, bulk approve clears it ----
    const review = section.getByTestId('semantic-review-banner');
    await expect(review).toContainText(/waiting for review/);
    await review.getByTestId('semantic-review-start').click();
    await expect(review).toContainText(/Reviewing/);
    await expect(row(page, TERM)).toHaveCount(0);
    await expect(seeded).toBeVisible();
    await shot(page, 'light-review', section);
    const approveAll = review.getByTestId('semantic-approve-all');
    await expect(approveAll).toContainText(/Approve all \d+ waiting drafts/);
    await approveAll.click();
    await expect(page.locator('mat-dialog-container')).toContainText(
      /Approve \d+ drafts\?/
    );
    await page.getByTestId('confirm-dialog-confirm').click();
    await expect(banner).toContainText(/Approved \d+ of \d+ drafts/);
    await expect(seeded.getByTestId('semantic-status')).toHaveText(/Approved/);
    await expect(review).toHaveCount(0);
    await expect(row(page, TERM)).toBeVisible();

    // ---- draft with AI: the backend is exercised by the package's own tests; here the dialog ----
    await page.route('**/api/v2/system/service?*', async route => {
      if (route.request().url().includes('ai_connection')) {
        await route.fulfill({
          json: { resource: [{ id: 1, name: 'mock_ai', label: 'Mock AI' }] },
        });
      } else {
        await route.continue();
      }
    });
    await page.route(`**/api/v2/system/semantic/${SERVICE}/_draft`, route =>
      route.fulfill({
        json: {
          ai_service: 'mock_ai',
          model: 'mock-1',
          input_tokens: 1200,
          output_tokens: 300,
          proposed: 2,
          created: 0,
          rejected: [
            {
              index: 1,
              kind: 'metric',
              name: 'bogus',
              reason: 'column orders.amount does not exist',
            },
          ],
          entries: [],
        },
      })
    );
    await section.getByTestId('semantic-fill-menu').click();
    await page.getByTestId('semantic-draft-open').click();
    await expect(dialog.getByTestId('semantic-draft-title')).toHaveText(
      /Draft with AI/
    );
    await expect(dialog.getByTestId('semantic-draft-ai-service')).toContainText(
      'Mock AI'
    );
    await shot(page, 'light-draft', dialog);
    await dialog.getByTestId('semantic-draft-run').click();
    await expect(dialog.getByTestId('semantic-draft-result')).toContainText(
      /proposed 2 entries/
    );
    await expect(dialog.getByTestId('semantic-draft-rejected')).toContainText(
      'orders.amount does not exist'
    );
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await page.unroute(`**/api/v2/system/semantic/${SERVICE}/_draft`);
    await page.unroute('**/api/v2/system/service?*');

    // ---- import a document, approving what it marks approved ----
    await section.getByTestId('semantic-fill-menu').click();
    await page.getByTestId('semantic-import-open').click();
    await dialog.getByTestId('semantic-import-json').fill(
      JSON.stringify({
        entries: [
          {
            kind: 'term',
            name: IMPORTED,
            description: 'from the import dialog',
            status: 'approved',
            definition: {
              meaning: 'A term that arrived by import',
              maps_to: { table: 'orders' },
            },
          },
        ],
      })
    );
    await dialog.getByTestId('semantic-import-run').click();
    await expect(dialog.getByTestId('semantic-import-result')).toContainText(
      /1 created/
    );
    await expect(dialog.getByTestId('semantic-import-result')).toContainText(
      /1 approved/
    );
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    const imported = row(page, IMPORTED);
    await expect(imported).toBeVisible();
    await expect(imported.getByTestId('semantic-source')).toHaveText(
      /Imported/
    );
    await expect(imported.getByTestId('semantic-status')).toHaveText(
      /Approved/
    );

    // ---- export downloads the document ----
    await section.getByTestId('semantic-fill-menu').click();
    const download = page.waitForEvent('download');
    await page.getByTestId('semantic-export').click();
    expect((await download).suggestedFilename()).toBe(
      `semantic-${SERVICE}.json`
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
    await pickTable(page, 'semantic-editor-table', 'orders');
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
    await pickTable(page, 'semantic-editor-table', 'orders');
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
    for (const name of [TERM, METRIC, QUERY, NOTE, IMPORTED]) {
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
