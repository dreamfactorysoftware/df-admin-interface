import { Page, expect, test } from '@playwright/test';
import { loginAsAdmin, waitForAppReady } from './fixtures/admin-login';

/**
 * The df-ai-* pickers (allowed roles, AI chat role/connection, data services,
 * MCP servers) must stay the same height however many roles or services the
 * instance has. Before the shared df-picker-list, each rendered one chip per
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
