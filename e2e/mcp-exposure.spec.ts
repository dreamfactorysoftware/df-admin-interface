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
  const config = (await detail.json()).config;
  const exposed: string[] = config.exposed_services ?? [];
  expect(exposed.length).toBeGreaterThan(0);

  await page.goto(`/dreamfactory/dist/#/ai/mcp/${id}`);
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

  // Who can connect + connect card render for the admin identity.
  await expect(page.getByTestId('mcp-access')).toBeVisible();
  await expect(page.getByTestId('mcp-connect')).toContainText('/mcp/demo_mcp');
});
