import {
  APIRequestContext,
  Locator,
  Page,
  expect,
  test,
} from '@playwright/test';
import { loginAsAdmin, waitForAppReady } from './fixtures/admin-login';
import { DfApi, E2E_SERVICE_PREFIX } from './fixtures/df-api';
import {
  createMcpFixtures,
  destroyMcpFixtures,
  McpFixtures,
} from './fixtures/mcp-fixtures';
import {
  dbWriteDataKeys,
  dbWriteExecKeys,
  effectiveTools,
  effectiveTotalOf,
  fetchBackendCatalog,
  McpBackendService,
  parseMcpConfig,
} from './fixtures/mcp-model';

/**
 * Redesigned MCP editor — mutating round-trips against the live backend.
 *
 * Every flow here performs REAL saves and verifies the outcome through both
 * the UI and a direct API GET of the stored config.
 *
 * Instance discipline: runs on any instance.
 *  - Its services are created in beforeAll (fixtures/mcp-fixtures, prefix
 *    e2e_fxflow_) and deleted in afterAll; nothing pre-existing is written.
 *  - The fixture MCP server is snapshotted after creation and restored
 *    byte-equivalent between tests (verified by a GET diff).
 *  - Services created through the UI use the `e2e_mcp_` prefix and are
 *    deleted in afterAll.
 */

const PREFIX = 'e2e_fxflow_';

let api: DfApi;
let apiCtx: APIRequestContext;
let fx: McpFixtures;
let snapshot: any; // fixture MCP server's pristine record
let catalog: McpBackendService[];

test.beforeAll(async ({ playwright }, testInfo) => {
  const baseURL = testInfo.project.use.baseURL;
  apiCtx = await playwright.request.newContext({ baseURL });
  api = await DfApi.login(apiCtx);
  fx = await createMcpFixtures(api, PREFIX);
  snapshot = await api.snapshotService(fx.mcpId);
  // Preconditions the flows rely on.
  expect(snapshot.config.exposed_services).toEqual([fx.db]);
  expect(snapshot.config.disabled_tools ?? []).toEqual([]);
  catalog = await fetchBackendCatalog(api);
});

test.afterAll(async () => {
  if (api) {
    await api.deleteByNamePrefix(E2E_SERVICE_PREFIX);
    await destroyMcpFixtures(api, PREFIX);
  }
  await apiCtx?.dispose();
});

function expectedTotal(): number {
  return effectiveTotalOf(snapshot.config, catalog);
}

async function gotoTools(page: Page, id: number): Promise<void> {
  await page.goto(`/dreamfactory/dist/#/ai/mcp/${id}`);
  await expect(page.getByTestId('mcp-tab-connect')).toBeVisible({
    timeout: 15_000,
  });
  await page.getByTestId('mcp-tab-tools').click();
  await expect(page.getByTestId('mcp-tools-tab')).toBeVisible();
  await expect(page.locator('.mcp-tools-loading')).toHaveCount(0, {
    timeout: 15_000,
  });
}

/** Click Save and wait for the PUT to system/service/{id} to succeed. */
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

async function numberFrom(locator: Locator, re: RegExp): Promise<number> {
  const text = (await locator.textContent()) ?? '';
  const m = text.match(re);
  expect(m, `"${text}" should match ${re}`).toBeTruthy();
  return parseInt(m![1], 10);
}

test.describe('curation round-trip on the fixture MCP server', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(90_000);
    await loginAsAdmin(page);
    await waitForAppReady(page);
    await gotoTools(page, fx.mcpId);
  });

  test('unchecking Write data persists exact keys, then re-enable restores', async ({
    page,
  }) => {
    const was = expectedTotal();

    // Drill into the db row.
    const row = page.getByTestId(`mcp-svc-row-${fx.db}`);
    await row.locator('.mcp-row-main').click();
    const drill = row.locator('.mcp-drill');
    await expect(drill).toBeVisible();

    // Uncheck the "Write data" capability group (3 verbs).
    const writeGroup = drill
      .locator('.mcp-group-row', { hasText: 'Write data' })
      .locator('mat-checkbox input[type="checkbox"]');
    await writeGroup.uncheck();
    await expect(
      drill.locator('.mcp-group-row', { hasText: 'Write data' })
    ).toContainText('0 of 3 on');

    // Dirty bar appears with the delta.
    const dirtyBar = page.getByTestId('mcp-dirty-bar');
    await expect(dirtyBar).toBeVisible();
    await expect(dirtyBar).toContainText(`${was} → ${was - 3} tools`);

    // Access chip: partial write-off is Custom (procedures stay on).
    await expect(page.getByTestId(`mcp-svc-access-${fx.db}`)).toHaveText(
      /Custom ◐ 13 of 16/
    );
    await expect(page.getByTestId(`mcp-svc-fraction-${fx.db}`)).toHaveText(
      '13 of 16'
    );

    // Save — stays in place, snackbar carries the delta.
    await saveAndWait(page, fx.mcpId);
    await expect(
      page.getByText(`Saved — ${was - 3} tools live (was ${was}).`)
    ).toBeVisible();
    await expect(dirtyBar).toHaveCount(0);

    // API truth: exactly the three Write-data keys, nothing else.
    const mid = await api.getService(fx.mcpId);
    expect([...(mid.config.disabled_tools ?? [])].sort()).toEqual(
      dbWriteDataKeys(fx.db)
    );
    expect(mid.config.exposed_services).toEqual([fx.db]);

    // Re-enable the group and save back to the pristine state.
    await writeGroup.check();
    await expect(dirtyBar).toBeVisible();
    await expect(dirtyBar).toContainText(`${was - 3} → ${was} tools`);
    await saveAndWait(page, fx.mcpId);
    await expect(
      page.getByText(`Saved — ${was} tools live (was ${was - 3}).`)
    ).toBeVisible();

    const after = await api.getService(fx.mcpId);
    expect(after.config.disabled_tools ?? []).toEqual([]);
    await expect(page.getByTestId(`mcp-svc-access-${fx.db}`)).toHaveText(
      'Full'
    );
  });
});

test.describe('picker exposure round-trip on the fixture MCP server', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(90_000);
    await loginAsAdmin(page);
    await waitForAppReady(page);
    await gotoTools(page, fx.mcpId);
  });

  test.afterEach(async () => {
    // Each picker test restores the pristine record before the next one.
    await api.restoreService(snapshot);
    await api.expectConfigRestored(snapshot);
  });

  test('exposing a second db read-only writes exposure + compiled curation once', async ({
    page,
  }) => {
    const was = expectedTotal();

    await page.getByTestId('mcp-expose-btn').click();
    const dialog = page.getByTestId('mcp-picker-dialog');
    await expect(dialog).toBeVisible();

    // Only not-yet-exposed services are listed: db2 and files, never db.
    for (const name of [fx.db2, fx.files]) {
      await expect(
        dialog.locator('.mcp-picker-row', {
          has: page.locator('.mcp-chip', { hasText: new RegExp(`^${name}$`) }),
        })
      ).toBeVisible();
    }
    await expect(
      dialog.locator('.mcp-chip', { hasText: new RegExp(`^${fx.db}$`) })
    ).toHaveCount(0);

    // Read-only is the pre-selected default.
    await expect(
      page.getByTestId('mcp-picker-access-ro').locator('input')
    ).toBeChecked();

    // Select db2; the consequence line simulates the real result.
    await dialog
      .locator('.mcp-picker-row', {
        has: page.locator('.mcp-chip', {
          hasText: new RegExp(`^${fx.db2}$`),
        }),
      })
      .click();
    const cfg = parseMcpConfig(snapshot.config);
    cfg.exposedServices = [...cfg.exposedServices, fx.db2];
    dbWriteExecKeys(fx.db2).forEach(k => cfg.disabledTools.add(k));
    const next = effectiveTools(cfg, catalog).total;
    await expect(page.getByTestId('mcp-picker-consequence')).toHaveText(
      `1 selected · read-only → server will serve ${next} tools (was ${was})`
    );

    // Expose → the row appears, read-only, and the page is dirty.
    await page.getByTestId('mcp-picker-confirm').click();
    await expect(dialog).toHaveCount(0);
    const newRow = page.getByTestId(`mcp-svc-row-${fx.db2}`);
    await expect(newRow).toBeVisible();
    await expect(page.getByTestId(`mcp-svc-access-${fx.db2}`)).toHaveText(
      'Read-only'
    );
    await expect(page.getByTestId(`mcp-svc-fraction-${fx.db2}`)).toHaveText(
      '9 of 16'
    );
    const dirtyBar = page.getByTestId('mcp-dirty-bar');
    await expect(dirtyBar).toContainText(`${was} → ${next} tools`);

    // Save, then verify the stored contract via the API.
    await saveAndWait(page, fx.mcpId);
    await expect(
      page.getByText(`Saved — ${next} tools live (was ${was}).`)
    ).toBeVisible();

    const stored = await api.getService(fx.mcpId);
    expect(stored.config.exposed_services).toEqual([fx.db, fx.db2]);
    expect([...(stored.config.disabled_tools ?? [])].sort()).toEqual(
      dbWriteExecKeys(fx.db2)
    );
    // db's own curation was never touched (migration-safety rule 3).
    expect(
      (stored.config.disabled_tools ?? []).filter((k: string) =>
        k.startsWith(`${fx.db}_`)
      )
    ).toEqual([]);
  });
});

test.describe('create flow', () => {
  const NAME = `${E2E_SERVICE_PREFIX}proto`;

  test.beforeEach(async ({ page }) => {
    test.setTimeout(120_000);
    // A leftover from an aborted earlier run would break name uniqueness.
    await api.deleteByNamePrefix(E2E_SERVICE_PREFIX);
    await loginAsAdmin(page);
    await waitForAppReady(page);
  });

  test.afterEach(async () => {
    await api.deleteByNamePrefix(E2E_SERVICE_PREFIX);
  });

  test('list create button -> create page -> first save lands on Connect ?created=1', async ({
    page,
  }) => {
    // From the AI → MCP list, the create affordance.
    await page.goto('/dreamfactory/dist/#/ai/mcp');
    await page.getByTestId('manage-table-create').click();
    await expect(page.getByTestId('mcp-create-page')).toBeVisible({
      timeout: 15_000,
    });

    // Fill the name; keep the Read-only default; expose the fixture db.
    await page.getByTestId('mcp-create-name').fill(NAME);
    await expect(page.getByTestId('mcp-create-url-preview')).toContainText(
      `/mcp/${NAME}`
    );
    await expect(
      page
        .getByTestId('mcp-create-access-ro')
        .and(page.locator('[aria-checked="true"]'))
    ).toBeVisible();
    await page.getByTestId(`mcp-create-svc-${fx.db}`).click();

    // Consequence line: a real simulated number (merged style, db read-only).
    const draft = parseMcpConfig({});
    draft.exposedServices = [fx.db];
    dbWriteExecKeys(fx.db).forEach(k => draft.disabledTools.add(k));
    draft.toolStyle = 'merged';
    const expected = effectiveTools(draft, catalog).total;
    await expect(page.getByTestId('mcp-create-consequence')).toContainText(
      `Agents will get ${expected} tools`
    );
    await expect(page.getByTestId('mcp-create-consequence')).toContainText(
      'Write tools are off.'
    );

    // Create → the new server's own edit page, Connect tab, first-run state.
    const post = page.waitForResponse(
      r =>
        r.url().includes('/api/v2/system/service') &&
        r.request().method() === 'POST'
    );
    await page.getByTestId('mcp-create-submit').click();
    expect((await post).ok()).toBe(true);
    await page.waitForURL(/#\/ai\/mcp\/\d+\?created=1/, { timeout: 15_000 });
    await expect(page.getByTestId('mcp-connect-tab')).toBeVisible();

    // Checklist with step ③ pre-checked (created with services).
    const checklist = page.getByTestId('mcp-checklist');
    await expect(checklist).toBeVisible();
    await expect(checklist).toContainText(
      `1 service exposed (${expected} tools, read-only)`
    );
    await expect(checklist).toContainText('refine in Tools');
    const step3 = checklist.locator('li').nth(2);
    await expect(step3).toHaveClass(/done/);

    // Header reflects the created catalog.
    await expect(
      page.locator('.mcp-head').getByRole('button', { name: /tools live/ })
    ).toHaveText(`${expected} tools live`);

    // API truth for the created record — the §2.1/§4 contract.
    const created = await api.getServiceByName(NAME);
    expect(created, `service ${NAME} must exist`).toBeTruthy();
    const full = await api.getService(created.id);
    expect(full.type).toBe('mcp');
    expect(full.is_active).toBe(true);
    expect(full.config.tool_style).toBe('merged');
    expect(full.config.exposed_services).toEqual([fx.db]);
    expect([...(full.config.disabled_tools ?? [])].sort()).toEqual(
      dbWriteExecKeys(fx.db)
    );
    expect(!!full.config.allow_api_key_auth).toBe(false);
    // OAuth was provisioned silently.
    expect(full.config.oauth_client_id).toBeTruthy();

    // The e2e-prefixed service is deleted in afterEach via the API.
  });
});
