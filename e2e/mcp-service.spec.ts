import {
  APIRequestContext,
  Locator,
  Page,
  expect,
  test,
} from '@playwright/test';
import { loginAsAdmin, waitForAppReady } from './fixtures/admin-login';
import { DfApi } from './fixtures/df-api';
import {
  effectiveTotalOf,
  fetchBackendCatalog,
  McpBackendService,
  parseMcpConfig,
  SYSTEM_MCP_TOOL_COUNT,
  systemMcpEnabledCount,
} from './fixtures/mcp-model';

/**
 * Redesigned MCP editor — read/verify surfaces against a live instance.
 *
 * Covers the non-mutating half of the acceptance script: Connect landing +
 * probe + client panels, the Tools tab's exposure truth, the preview
 * drawer's excluded/served story, Settings (dirty + discard only — nothing
 * is saved here), the system_mcp variant, and the legacy-editor guard for
 * non-MCP services.
 *
 * Instance discipline: this file saves NOTHING. mcp_full's record is
 * snapshotted in beforeAll anyway and afterAll asserts it is byte-identical
 * — a tripwire against accidental saves. Mutating round-trips live in
 * mcp-redesign-flows.spec.ts.
 */

const MCP_FULL_ID = 9;
const SYS_MCP_ID = 21; // sysmcp_demo — read-only assertions only
const DB_SERVICE_ID = 6; // db (sqlite) — legacy-editor guard

let api: DfApi;
let apiCtx: APIRequestContext;
let snapshot: any; // mcp_full full service record
let catalog: McpBackendService[];

test.beforeAll(async ({ playwright }, testInfo) => {
  const baseURL = testInfo.project.use.baseURL;
  apiCtx = await playwright.request.newContext({ baseURL });
  api = await DfApi.login(apiCtx);
  snapshot = await api.snapshotService(MCP_FULL_ID);
  expect(snapshot.name).toBe('mcp_full');
  catalog = await fetchBackendCatalog(api);
});

test.afterAll(async () => {
  // Tripwire: nothing in this file may have changed the service.
  if (api && snapshot) await api.expectConfigRestored(snapshot);
  await apiCtx?.dispose();
});

/** The effective tool total the UI must display for the stored config. */
function expectedTotal(): number {
  return effectiveTotalOf(snapshot.config, catalog);
}

async function gotoMcpEditor(page: Page, id: number): Promise<void> {
  await page.goto(`/dreamfactory/dist/#/ai/mcp/${id}`);
  await expect(page.getByTestId('mcp-tab-connect')).toBeVisible({
    timeout: 15_000,
  });
}

async function openToolsTab(page: Page): Promise<void> {
  await page.getByTestId('mcp-tab-tools').click();
  await expect(page.getByTestId('mcp-tools-tab')).toBeVisible();
  // Rows render once the backend-services fetch lands.
  await expect(page.locator('.mcp-tools-loading')).toHaveCount(0, {
    timeout: 15_000,
  });
}

function headerToolsLiveChip(page: Page): Locator {
  return page.locator('.mcp-head').getByRole('button', { name: /tools live/ });
}

async function numberFrom(locator: Locator, re: RegExp): Promise<number> {
  const text = (await locator.textContent()) ?? '';
  const m = text.match(re);
  expect(m, `"${text}" should match ${re}`).toBeTruthy();
  return parseInt(m![1], 10);
}

test.describe('MCP editor — Connect tab', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await waitForAppReady(page);
  });

  test('list -> open mcp_full lands on Connect with URL, probe and live count', async ({
    page,
  }) => {
    // AI → MCP list.
    await page.goto('/dreamfactory/dist/#/ai/mcp');
    const row = page.getByRole('row', { name: /mcp_full/ });
    await expect(row).toBeVisible({ timeout: 15_000 });
    await row.click();

    // Lands on the redesigned editor, Connect tab active.
    await expect(page.getByTestId('mcp-connect-tab')).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId('mcp-tab-connect')).toHaveAttribute(
      'aria-selected',
      'true'
    );

    // Endpoint URL = {origin}/mcp/mcp_full, in header and endpoint card.
    const origin = new URL(page.url()).origin;
    await expect(page.getByTestId('mcp-endpoint-url')).toHaveText(
      `${origin}/mcp/mcp_full`
    );
    await expect(
      page.getByTestId('mcp-endpoint-card').locator('code.mcp-endpoint-url')
    ).toHaveText(`${origin}/mcp/mcp_full`);

    // Probe: live 401 renders as the positive reachability state.
    await expect(page.getByTestId('mcp-probe-chip')).toHaveText(
      /✓ Reachable — auth enforced/,
      { timeout: 15_000 }
    );

    // Header carries the live effective count, N > 0 and = model(config).
    const n = await numberFrom(headerToolsLiveChip(page), /(\d+) tools live/);
    expect(n).toBeGreaterThan(0);
    expect(n).toBe(expectedTotal());
  });

  test('client panels are auth-aware and never leak a real credential', async ({
    page,
  }) => {
    await gotoMcpEditor(page, MCP_FULL_ID);
    const origin = new URL(page.url()).origin;
    const panel = page.getByTestId('mcp-client-panel');

    // Claude Code panel: the documented one-liner.
    await page.getByTestId('mcp-client-chip-claude-code').click();
    await expect(panel).toContainText(
      `claude mcp add --transport http mcp_full ${origin}/mcp/mcp_full`
    );

    // mcp_full has allow_api_key_auth=true → the sub-toggle exists and the
    // API-key variant adds the header with the YOUR_API_KEY placeholder.
    expect(snapshot.config.allow_api_key_auth).toBe(true);
    const authToggle = page.locator('.mcp-auth-toggle');
    await expect(authToggle).toContainText('Connect with:');
    await authToggle.getByRole('button', { name: 'API key' }).click();
    await expect(panel).toContainText(
      '--header "X-DreamFactory-API-Key: YOUR_API_KEY"'
    );
    // Placeholder only — no hex credential of any kind inside the panel.
    expect(await panel.textContent()).not.toMatch(/[0-9a-f]{32}/);

    // Generic JSON panel: key header variant + the legacy alias comment.
    await page.getByTestId('mcp-client-chip-json').click();
    await expect(panel).toContainText(
      '"X-DreamFactory-API-Key": "YOUR_API_KEY"'
    );
    await expect(panel).toContainText(
      `Legacy alias (same server): ${origin}/api/v2/mcp_full/_mcp`
    );
    expect(await panel.textContent()).not.toMatch(/[0-9a-f]{32}/);

    // The OAuth card renders credentials from config with the secret masked.
    const oauthCard = page.getByTestId('mcp-oauth-card');
    await expect(oauthCard).toContainText(snapshot.config.oauth_client_id);
    expect(await oauthCard.textContent()).not.toContain(
      snapshot.config.oauth_client_secret
    );
    // API-key card reflects the on state.
    await expect(page.getByTestId('mcp-apikey-card')).toContainText(
      'Manage API keys'
    );
  });
});

test.describe('MCP editor — Tools tab (read view)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await waitForAppReady(page);
    await gotoMcpEditor(page, MCP_FULL_ID);
    await openToolsTab(page);
  });

  test('exposure is the only gate: one row for db, none for the unexposed', async ({
    page,
  }) => {
    expect(snapshot.config.exposed_services).toEqual(['db']);

    // Exactly one exposed-service row — db.
    await expect(page.getByTestId('mcp-svc-row-db')).toBeVisible();
    await expect(page.locator('[data-testid^="mcp-svc-row-"]')).toHaveCount(1);
    for (const name of ['db2', 'files', 'logs']) {
      await expect(page.getByTestId(`mcp-svc-row-${name}`)).toHaveCount(0);
    }

    // Global + custom sections are peers on the same surface.
    await expect(page.getByTestId('mcp-global-section')).toBeVisible();
    const custom = page.getByTestId('mcp-custom-section');
    await expect(custom).toBeVisible();
    await expect(custom.locator('code', { hasText: 'env_info' })).toBeVisible();

    // One live answer: rail total = tab label count = header chip.
    const railN = await numberFrom(
      page.getByTestId('mcp-rail-total'),
      /(\d+)\s*callable tools/
    );
    const tabN = await numberFrom(
      page.getByTestId('mcp-tab-tools'),
      /Tools · (\d+)/
    );
    const headN = await numberFrom(
      headerToolsLiveChip(page),
      /(\d+) tools live/
    );
    expect(railN).toBe(expectedTotal());
    expect(tabN).toBe(railN);
    expect(headN).toBe(railN);
  });

  test('preview drawer names served tools per style and excluded per reason', async ({
    page,
  }) => {
    await page.getByTestId('mcp-preview-btn').click();
    const drawer = page.getByTestId('mcp-preview-drawer');
    await expect(drawer).toBeVisible();

    // Excluded section: the unexposed backend services are named, with the
    // layer that excludes them.
    const excluded = page.getByTestId('mcp-preview-excluded');
    await expect(excluded).toContainText('not exposed');
    const unexposed = catalog
      .map(s => s.name)
      .filter(n => !snapshot.config.exposed_services.includes(n));
    const shown =
      unexposed.slice(0, 3).join(', ') +
      (unexposed.length > 3 ? `, +${unexposed.length - 3} more` : '');
    await expect(excluded).toContainText(shown);

    // Served list: emitted names follow the STORED tool_style.
    const merged = snapshot.config.tool_style === 'merged';
    if (merged) {
      await expect(
        drawer.locator('code', { hasText: /^get_table_data$/ })
      ).toBeVisible();
    } else {
      await expect(
        drawer.locator('code', { hasText: /^db_get_table_data$/ })
      ).toBeVisible();
      await expect(
        drawer.locator('code', { hasText: /^get_table_data$/ })
      ).toHaveCount(0);
    }
    // Custom tools are part of the served story.
    await expect(
      drawer.locator('code', { hasText: /^env_info$/ })
    ).toBeVisible();

    // Footer total agrees with the one computation.
    await expect(drawer.locator('.mcp-preview-foot')).toContainText(
      `${expectedTotal()} tools`
    );
  });
});

test.describe('MCP editor — Settings tab (discard only)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await waitForAppReady(page);
    await gotoMcpEditor(page, MCP_FULL_ID);
    await page.getByTestId('mcp-tab-settings').click();
    await expect(page.getByTestId('mcp-settings-tab')).toBeVisible();
  });

  test('tool-naming radio reflects the stored value with the honest subnote', async ({
    page,
  }) => {
    const stored = snapshot.config.tool_style; // null | 'prefixed' | 'merged'
    const prefixedRadio = page.getByTestId('mcp-toolstyle-prefixed');
    const mergedRadio = page.getByTestId('mcp-toolstyle-merged');
    if (stored === 'merged') {
      await expect(mergedRadio.locator('input')).toBeChecked();
      await expect(mergedRadio).toContainText(
        'Matches the recommended default.'
      );
    } else {
      // null renders as prefixed — labeled server default, never "Auto".
      await expect(prefixedRadio.locator('input')).toBeChecked();
      if (stored === null) {
        await expect(prefixedRadio).toContainText(
          'Server default (per-service names).'
        );
      }
    }
    // The Tool-naming control itself never offers an "Auto" choice.
    await expect(page.locator('.mcp-toolstyle')).not.toContainText('Auto');
  });

  test('API-key toggle dirties the page; Discard restores the saved state', async ({
    page,
  }) => {
    const toggle = page.getByTestId('mcp-apikey-toggle');
    const switchBtn = toggle.locator('button[role="switch"]');
    await expect(switchBtn).toHaveAttribute('aria-checked', 'true');

    await toggle.click();
    await expect(switchBtn).toHaveAttribute('aria-checked', 'false');
    const dirtyBar = page.getByTestId('mcp-dirty-bar');
    await expect(dirtyBar).toBeVisible();
    await expect(dirtyBar).toContainText('Unsaved changes');

    // DISCARD — nothing is saved by this suite.
    await page.getByTestId('mcp-discard').click();
    await expect(dirtyBar).toHaveCount(0);
    await expect(switchBtn).toHaveAttribute('aria-checked', 'true');
  });

  test('full-config viewer masks the secret; housekeeping renders', async ({
    page,
  }) => {
    const fullConfig = page.getByTestId('mcp-fullconfig');
    await expect(fullConfig).toBeVisible();
    const json = JSON.parse((await fullConfig.textContent()) ?? '{}');
    expect(json.oauthClientSecret).toBe('••••••••');
    expect(await fullConfig.textContent()).not.toContain(
      snapshot.config.oauth_client_secret
    );
    expect(json.exposedServices).toEqual(snapshot.config.exposed_services);

    const housekeeping = page.getByTestId('mcp-housekeeping');
    await expect(housekeeping).toBeVisible();
    const parsed = parseMcpConfig(snapshot.config);
    const hasOrphans = [...parsed.disabledTools].some(
      k => !catalog.some(s => k.startsWith(s.name + '_'))
    );
    if (!hasOrphans) {
      await expect(housekeeping).toContainText('No orphaned tool settings.');
    } else {
      await expect(page.getByTestId('mcp-housekeeping-review')).toBeVisible();
    }
    await expect(page.getByTestId('mcp-flush-cache')).toBeVisible();
    // Danger zone is present but untouched.
    await expect(page.getByTestId('mcp-delete-server')).toBeVisible();
  });
});

test.describe('system_mcp variant', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await waitForAppReady(page);
  });

  test('sysmcp_demo renders the redesigned editor with the fixed catalog', async ({
    page,
  }) => {
    const sys = await api.getService(SYS_MCP_ID);
    expect(sys.type).toBe('system_mcp');
    const enabled = systemMcpEnabledCount(sys.config);

    await gotoMcpEditor(page, SYS_MCP_ID);
    // The redesigned editor, not the legacy page.
    await expect(page.locator('df-service-details')).toHaveCount(0);

    // Header count = enabled count of the fixed catalog.
    const headN = await numberFrom(
      headerToolsLiveChip(page),
      /(\d+) tools live/
    );
    expect(headN).toBe(enabled);

    await openToolsTab(page);
    await expect(
      page.getByText(
        `System API tools (${enabled} of ${SYSTEM_MCP_TOOL_COUNT})`
      )
    ).toBeVisible();

    // Read system / Modify system groups summing to the fixed 18.
    const readRow = page.locator('.mcp-group-row', {
      hasText: 'Read system',
    });
    const modifyRow = page.locator('.mcp-group-row', {
      hasText: 'Modify system',
    });
    await expect(readRow).toBeVisible();
    await expect(modifyRow).toBeVisible();
    // Group rows state the count once — the "x of y on" trailer (§3.2);
    // with nothing disabled, y per group sums to the fixed catalog.
    const readN = await numberFrom(readRow, /of (\d+) on/);
    const modifyN = await numberFrom(modifyRow, /of (\d+) on/);
    expect(readN + modifyN).toBe(SYSTEM_MCP_TOOL_COUNT);
    expect(SYSTEM_MCP_TOOL_COUNT).toBe(18);

    // Scope is fixed: no exposure picker, no per-service rows.
    await expect(page.getByTestId('mcp-expose-btn')).toHaveCount(0);
    await expect(page.locator('[data-testid^="mcp-svc-row-"]')).toHaveCount(0);

    // Settings: nothing to consolidate — no Tool naming radio.
    await page.getByTestId('mcp-tab-settings').click();
    await expect(page.getByTestId('mcp-settings-tab')).toBeVisible();
    await expect(page.getByTestId('mcp-toolstyle-merged')).toHaveCount(0);
    await expect(page.getByTestId('mcp-toolstyle-prefixed')).toHaveCount(0);
    // Catalog delivery still exists for system servers.
    await expect(page.getByTestId('mcp-lazy-select')).toBeVisible();
  });
});

test.describe('same-route navigation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await waitForAppReady(page);
  });

  test('in-app :id -> :id navigation re-initializes the editor', async ({
    page,
  }) => {
    // Full load of mcp_full first.
    await gotoMcpEditor(page, MCP_FULL_ID);
    const origin = new URL(page.url()).origin;
    await expect(page.getByTestId('mcp-endpoint-url')).toHaveText(
      `${origin}/mcp/mcp_full`
    );

    // Hash-only navigation to another service reuses the routed component;
    // the editor must re-initialize from the new resolve, not keep showing
    // the previous service.
    await page.goto(`/dreamfactory/dist/#/ai/mcp/${SYS_MCP_ID}`);
    await expect(page.getByTestId('mcp-endpoint-url')).toHaveText(
      `${origin}/mcp/sysmcp_demo`,
      { timeout: 15_000 }
    );
    await openToolsTab(page);
    await expect(page.getByText(/System API tools \(/)).toBeVisible();
    await expect(page.getByTestId('mcp-expose-btn')).toHaveCount(0);

    // And on to a non-MCP service: the shim must swap to the legacy editor.
    await page.goto(`/dreamfactory/dist/#/ai/mcp/${DB_SERVICE_ID}`);
    await expect(page.locator('df-service-details')).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId('mcp-tab-connect')).toHaveCount(0);
  });
});

test.describe('legacy regression guard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await waitForAppReady(page);
  });

  test('a non-MCP service still gets the legacy editor', async ({ page }) => {
    await page.goto(
      `/dreamfactory/dist/#/api-connections/api-types/database/${DB_SERVICE_ID}`
    );
    const legacy = page.locator('df-service-details');
    await expect(legacy).toBeVisible({ timeout: 15_000 });
    // None of the redesigned MCP chrome leaks onto other service types.
    await expect(page.getByTestId('mcp-tab-connect')).toHaveCount(0);
    await expect(page.getByTestId('mcp-tools-tab')).toHaveCount(0);
    // Its normal controls render, populated from the service.
    await expect(
      legacy.locator('input[formcontrolname="name"]').first()
    ).toHaveValue('db', { timeout: 15_000 });
  });
});
