import { expect, test } from '@playwright/test';
import { loginAsAdmin, waitForAppReady } from './fixtures/admin-login';

/**
 * MCP server page (#523): the exposure grid reflects `exposed_services`.
 *
 * Runs against a live DreamFactory (PLAYWRIGHT_BASE_URL) that has the
 * `demo_mcp` service. The expected row states come from the service's own
 * config over the API, so the test holds for whatever demo_mcp exposes.
 * Read-only: nothing is saved.
 */
test('MCP: exposure grid reflects exposed_services for demo_mcp', async ({
  page,
  request,
  baseURL,
}) => {
  await loginAsAdmin(page);
  await waitForAppReady(page);

  // Session token from the UI login cookie for the API lookups below.
  const cookies = await page.context().cookies();
  const token = cookies.find(c => c.name === 'session_token')?.value;
  expect(token, 'session_token cookie after login').toBeTruthy();
  const headers = { 'X-DreamFactory-Session-Token': token as string };

  const svc = await request.get(
    `${baseURL}/api/v2/system/service?filter=name%3Ddemo_mcp&fields=id,name`,
    { headers }
  );
  expect(svc.ok()).toBe(true);
  const id = (await svc.json()).resource?.[0]?.id;
  expect(id, 'demo_mcp exists on the dev instance').toBeTruthy();

  const detail = await request.get(`${baseURL}/api/v2/system/service/${id}`, {
    headers,
  });
  const record = await detail.json();
  const config = record.config;
  const title: string = record.label || record.name;
  const exposed: string[] = config.exposed_services ?? [];
  expect(exposed.length).toBeGreaterThan(0);

  await page.goto(`/dreamfactory/dist/#/ai/mcp/${id}/exposure`);
  const grid = page.getByTestId('mcp-exposure-grid');
  await expect(grid).toBeVisible({ timeout: 20_000 });

  // Every exposed backend has its row switch on; every other row is off.
  const rows = grid.locator('tr[data-backend]');
  const count = await rows.count();
  expect(count).toBeGreaterThanOrEqual(exposed.length);
  for (let i = 0; i < count; i++) {
    const row = rows.nth(i);
    const name = await row.getAttribute('data-backend');
    const on = await row.getAttribute('data-exposed');
    expect(on, `row ${name}`).toBe(String(exposed.includes(name as string)));
  }
  for (const name of exposed) {
    await expect(grid.locator(`tr[data-backend="${name}"]`)).toHaveCount(1);
  }

  // Cells of an exposed row are live ("on"); cells of a hidden row are gone.
  const onRow = grid.locator(`tr[data-backend="${exposed[0]}"]`);
  await expect(onRow.locator('button[data-state="on"]').first()).toBeVisible();
  const offRow = grid.locator('tr[data-exposed="false"]').first();
  if (await offRow.count()) {
    await expect(
      offRow.locator('button[data-state="gone"]').first()
    ).toBeAttached();
  }

  // The tools tile counts only what is exposed: globals + aggregates
  // (when 2+ databases) + 16 verbs per exposed database.
  const tile = page.getByTestId('mcp-tile-tools');
  await expect(tile).toBeVisible();
  const advertised = Number(
    (await tile.locator('.mcp__v').textContent())?.trim()
  );
  expect(advertised).toBeGreaterThan(0);
  expect(advertised).toBeLessThanOrEqual(5 + 5 + exposed.length * 16 + 6 * 2);

  // Column switch: one click disables the verb on every exposed backend,
  // the tile drops by that many tools, the next click restores it.
  const before = advertised;
  const colSwitch = grid.locator('button.grid__sw[data-verb="get_tables"]');
  await expect(colSwitch).toHaveAttribute('data-state', 'on');
  await colSwitch.click();
  await expect(colSwitch).toHaveAttribute('data-state', 'off');
  for (const name of exposed) {
    await expect(
      grid.locator(`tr[data-backend="${name}"] button[data-key$="_get_tables"]`)
    ).toHaveAttribute('data-state', 'off');
  }
  const offRows = grid.locator('tr[data-exposed="false"]');
  if (await offRows.count()) {
    await expect(
      offRows.first().locator('button[data-key$="_get_tables"]')
    ).toHaveAttribute('data-state', 'gone');
  }
  if (config.tool_style !== 'merged') {
    await expect(tile.locator('.mcp__v')).toHaveText(
      String(before - exposed.length)
    );
  } else {
    await expect(tile.locator('.mcp__v')).toHaveText(String(before - 1));
  }
  await colSwitch.click();
  await expect(colSwitch).toHaveAttribute('data-state', 'on');
  await expect(tile.locator('.mcp__v')).toHaveText(String(before));

  // Breadcrumb and title come from the route data, tab segment or not.
  const crumbs = page.locator('nav.topbar-breadcrumbs');
  await expect(crumbs).toContainText('MCP Servers');
  await expect(crumbs).toContainText('demo_mcp');
  await expect(page.locator('h1.page-header')).toContainText(title);

  // Tabs are route segments; switching keeps the page state (no reload).
  await page.locator('[role="tab"]', { hasText: 'Access' }).click();
  await expect(page).toHaveURL(new RegExp(`/ai/mcp/${id}/access$`));
  await expect(page.getByTestId('mcp-access')).toBeVisible();
  await expect(crumbs).toContainText('demo_mcp');
  await expect(page.locator('h1.page-header')).toContainText(title);
  // Create role opens an inline panel (no modal): every backend starts at
  // "No access", the live summary is the diff, Cancel closes it.
  await page.getByRole('button', { name: 'Create role' }).click();
  const editor = page.getByTestId('mcp-access-editor');
  await expect(editor).toBeVisible();
  await expect(page.locator('mat-dialog-container')).toHaveCount(0);
  const rowsInEditor = editor.locator('.editor__row');
  expect(await rowsInEditor.count()).toBe(exposed.length);
  expect(
    await editor.locator('.editor__opt--on[data-level="none"]').count()
  ).toBe(exposed.length);
  const summary = page.getByTestId('mcp-access-summary');
  await expect(summary).toContainText('grants this server');
  await expect(summary).not.toContainText('read on');
  await rowsInEditor.first().locator('[data-level="read"]').click();
  await expect(summary).toContainText('read on 1 APIs');
  await editor.getByRole('button', { name: 'Cancel' }).click();
  await expect(editor).toHaveCount(0);

  await page.locator('[role="tab"]', { hasText: 'Connect' }).click();
  await expect(page).toHaveURL(new RegExp(`/ai/mcp/${id}/connect$`));
  await expect(page.getByTestId('mcp-connect')).toContainText('/mcp/demo_mcp');
  await expect(page.getByTestId('mcp-preview-as')).toContainText('Any admin');
});
