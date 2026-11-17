import { Page, expect, test } from '@playwright/test';
import { loginAsAdmin, waitForAppReady } from './fixtures/admin-login';
import { DfApi } from './fixtures/df-api';

/**
 * The df-ai-* pickers (allowed roles, AI chat role/connection, data services,
 * MCP servers) and the service Access matrix must stay the same height
 * however many roles or services the instance has. Before the shared df-picker-list, each rendered one chip per
 * record straight into the form: 314 roles made the AI Chat form 7,800px tall.
 *
 * Runs against whatever the target instance holds; the search assertions
 * only apply once a list is long enough to get a search box.
 */
const MAX_LIST_HEIGHT = 300;

async function pickType(page: Page, label: RegExp) {
  const sel = page.locator('mat-select[formControlName="type"]').first();
  await expect(sel).toBeVisible({ timeout: 30_000 });
  await sel.click();
  await page.locator('mat-option', { hasText: label }).first().click();
}

async function listHeight(page: Page, testId: string) {
  const box = await page.getByTestId(`${testId}-list`).boundingBox();
  return box?.height ?? 0;
}

async function expectBounded(page: Page, testId: string) {
  const list = page.getByTestId(`${testId}-list`);
  await expect(list).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(500);
  expect(await listHeight(page, testId)).toBeLessThanOrEqual(MAX_LIST_HEIGHT);
  const chips = page.getByTestId(`${testId}-item`);
  expect(await chips.count()).toBeLessThanOrEqual(60);
  return chips;
}

test('AI Connection allowed roles stay bounded and searchable', async ({
  page,
}) => {
  await loginAsAdmin(page);
  await waitForAppReady(page);
  await page.goto('/dreamfactory/dist/#/ai/connections/create', {
    waitUntil: 'domcontentloaded',
  });
  await pickType(page, /^\s*AI Connection\s*$/);
  const chips = await expectBounded(page, 'allowed-roles');

  // Picking a role keeps the list the same height.
  await chips.first().click();
  await expect(chips.first()).toHaveAttribute('aria-pressed', 'true');
  expect(await listHeight(page, 'allowed-roles')).toBeLessThanOrEqual(
    MAX_LIST_HEIGHT
  );

  const search = page.getByTestId('allowed-roles-search').locator('input');
  if (await search.count()) {
    const sample = (await chips.last().textContent())!.trim();
    const query = sample.slice(0, Math.min(sample.length, 8));
    await search.fill(query);
    await page.waitForTimeout(400);
    const labels = await page
      .getByTestId('allowed-roles-item')
      .allTextContents();
    expect(labels.length).toBeGreaterThan(0);
    for (const l of labels) {
      expect(l.toLowerCase()).toContain(query.toLowerCase());
    }
    await search.fill('');
  }
});

test('AI Chat setup pickers stay bounded', async ({ page }) => {
  await loginAsAdmin(page);
  await waitForAppReady(page);
  await page.goto('/dreamfactory/dist/#/ai/chat-services/create', {
    waitUntil: 'domcontentloaded',
  });
  await pickType(page, /^\s*AI Chat\s*$/);
  await expectBounded(page, 'prereqs-roles');
  if (await page.getByTestId('data-services-list').count()) {
    await expectBounded(page, 'data-services');
  }
  const form = page.locator('mat-sidenav-content');
  const h = await form.evaluate(el => el.scrollHeight);
  // The whole create form, pickers included, fits in a few screens.
  expect(h).toBeLessThan(4000);
});

test('Database service Access matrix stays bounded', async ({ page }) => {
  await loginAsAdmin(page);
  await waitForAppReady(page);
  // Any database service will do; find one through the system API.
  const api = await DfApi.login(page.request);
  const groups = await api.listServiceTypeGroups();
  const db = (await api.listServices()).find(
    s => groups[s.type] === 'Database'
  );
  test.skip(!db, 'no database service on this instance');
  await page.goto(
    `/dreamfactory/dist/#/api-connections/api-types/database/${db.id}`,
    { waitUntil: 'domcontentloaded' }
  );

  // The Access section is a closed disclosure; open it.
  const header = page
    .locator('mat-sidenav-content .disclosure__header', {
      hasText: 'Who can reach this service',
    })
    .first();
  await expect(header).toBeVisible({ timeout: 30_000 });
  await header.click();

  const grid = page.getByTestId('scope-matrix-grid');
  await expect(grid).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(500);
  // Twelve roles or fewer render as the plain grid (every role a row, no
  // controls); only the grid with controls sits in the fixed-height well.
  const all = page.getByTestId('scope-matrix-view-all');
  const bounded = (await all.count()) > 0;
  const rows = await page.getByTestId('scope-matrix-row').count();
  if (bounded) {
    const box = await grid.boundingBox();
    expect(box!.height).toBeLessThanOrEqual(400);
    expect(rows).toBeLessThanOrEqual(60);
  } else {
    expect(rows).toBeLessThanOrEqual(12);
  }

  // With controls present, "all roles" is still bounded and search narrows.
  if (bounded) {
    await all.click();
    await page.waitForTimeout(300);
    expect((await grid.boundingBox())!.height).toBeLessThanOrEqual(400);
    const sample = (await page
      .getByTestId('scope-matrix-row')
      .last()
      .locator('.scope-matrix__role')
      .textContent())!.trim();
    await page
      .getByTestId('scope-matrix-search')
      .locator('input')
      .fill(sample.slice(0, 8));
    await page.waitForTimeout(300);
    const names = await page
      .locator('[data-testid="scope-matrix-row"] .scope-matrix__role')
      .allTextContents();
    expect(names.length).toBeGreaterThan(0);
    for (const n of names) {
      expect(n.toLowerCase()).toContain(sample.slice(0, 8).toLowerCase());
    }
  }
});

test('Access matrix with twelve roles or fewer lists every role', async ({
  page,
}) => {
  // Cut the role graph down to twelve roles and keep only the first one's
  // grants, so at most one role reaches the service: the plain grid must
  // still list the other eleven (muted) to prove they have no access.
  // Routed before login so no cached role list escapes the cut.
  type RoleRow = { name: string; role_service_access_by_role_id?: unknown[] };
  let listed: string[] = [];
  await page.route(
    url =>
      url.pathname.endsWith('/api/v2/system/role') &&
      (url.searchParams.get('related') ?? '').includes(
        'role_service_access_by_role_id'
      ),
    async route => {
      const res = await route.fetch();
      const body = await res.json();
      const cut: RoleRow[] = (body.resource ?? [])
        .slice(0, 12)
        .map((r: RoleRow, i: number) =>
          i === 0 ? r : { ...r, role_service_access_by_role_id: [] }
        );
      body.resource = cut;
      listed = cut.map(r => r.name);
      await route.fulfill({ response: res, json: body });
    }
  );
  await loginAsAdmin(page);
  await waitForAppReady(page);
  const api = await DfApi.login(page.request);
  const groups = await api.listServiceTypeGroups();
  const db = (await api.listServices()).find(
    s => groups[s.type] === 'Database'
  );
  test.skip(!db, 'no database service on this instance');
  await page.goto(
    `/dreamfactory/dist/#/api-connections/api-types/database/${db.id}`,
    { waitUntil: 'domcontentloaded' }
  );

  const header = page
    .locator('mat-sidenav-content .disclosure__header', {
      hasText: 'Who can reach this service',
    })
    .first();
  await expect(header).toBeVisible({ timeout: 30_000 });
  await header.click();
  await expect(page.getByTestId('df-scope-matrix')).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.locator('.scope-matrix__loading')).toHaveCount(0, {
    timeout: 30_000,
  });
  test.skip(listed.length === 0, 'no roles on this instance');

  const rows = page.getByTestId('scope-matrix-row');
  await expect(rows).toHaveCount(listed.length);
  const names = await rows.locator('.scope-matrix__role').allTextContents();
  expect(names.map(n => n.trim()).sort()).toEqual([...listed].sort());
  await expect(page.getByTestId('scope-matrix-view-all')).toHaveCount(0);
  await expect(page.getByTestId('scope-matrix-search')).toHaveCount(0);
  await expect(page.getByTestId('scope-matrix-status')).toHaveCount(0);
});
