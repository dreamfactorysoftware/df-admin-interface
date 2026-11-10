import { Page, Response } from '@playwright/test';
import { test, expect } from './support/test';
import { FlowApi } from './support/api';

import { uniqueName } from './support/names';
import { loginAsRoot } from './support/login';
import { openRoute } from './support/system';
import { content, pickOptions } from './support/ui';

/**
 * AI usage analytics (`/ai/usage`): with logged requests the dashboard
 * renders, a filter narrows it, and every range renders without an error.
 *
 * Usage rows: the log has no delete API. `ensureUsageRow` adds one failed
 * request (through an AI connection of its own, on a dead provider) only
 * when the last 24 hours hold none, so a run leaves at most one row behind
 * and usually none.
 */
test.describe.configure({ timeout: 900_000 });

const ROUTE = '/ai/usage';
const USAGE = '/_internal/ai/usage';

const usage = (page: Page) => {
  const c = content(page);
  return {
    range: (label: string) =>
      c
        .locator('.usage__controls mat-button-toggle')
        .filter({ hasText: new RegExp(`^\\s*${label}\\s*$`) })
        .getByRole('button'),
    status: c
      .locator('.usage__filter-field')
      .filter({ has: page.locator('mat-label', { hasText: /^\s*Status\s*$/ }) })
      .locator('mat-select'),
    chips: c.locator('.usage__filter-chips mat-chip'),
    clearAll: c.getByRole('button', { name: /clear all/i }),
    empty: c.locator('.usage__empty'),
    error: c.locator('.usage__error'),
    spinner: c.locator('.usage__loading'),
    summary: c.locator('df-usage-summary'),
  };
};

const usageCall =
  (period?: string) =>
  (r: Response): boolean => {
    const u = new URL(r.url());
    return (
      u.pathname === USAGE &&
      (period === undefined || u.searchParams.get('period') === period)
    );
  };

async function usageTotal(api: FlowApi, period: string): Promise<number> {
  const res = await api.raw('GET', `${USAGE}?period=${period}`);
  expect(res.ok(), `GET ${USAGE}?period=${period}`).toBe(true);
  return (await res.json()).total_requests as number;
}

/** Make sure the last 24 hours hold at least one logged AI request. */
async function ensureUsageRow(api: FlowApi): Promise<void> {
  if ((await usageTotal(api, '24h')) > 0) return;
  const name = uniqueName('aiconn');
  await api.create('service', {
    name,
    label: `Flow usage ${name}`,
    description: 'flow suite: one failed request for the usage page',
    is_active: true,
    type: 'ai_connection',
    config: {
      provider: 'openai_compatible',
      base_url: 'http://127.0.0.1:9/v1',
      api_key: 'sk-e2e-not-a-real-key',
      default_model: 'e2e-model',
      timeout: 5,
    },
  });
  const res = await api.raw('POST', `/api/v2/${name}/chat`, {
    messages: [{ role: 'user', content: 'flow suite usage row' }],
  });
  expect(res.status(), 'the dead provider refuses the request').toBe(500);
  await expect
    .poll(() => usageTotal(api, '24h'), {
      message: 'the failed request is in the usage log',
    })
    .toBeGreaterThan(0);
}

test('AI usage: with logged requests the dashboard renders and a filter narrows it', async ({
  page,
  api,
}) => {
  await ensureUsageRow(api);
  await loginAsRoot(page);
  const first = page.waitForResponse(usageCall('7d'));
  await openRoute(page, ROUTE);
  const u = usage(page);
  expect((await first).ok()).toBe(true);
  await expect(u.spinner).toHaveCount(0, { timeout: 30_000 });

  await test.step('summary, charts and breakdowns are on the page', async () => {
    await expect(u.empty).toHaveCount(0);
    await expect(u.summary).toBeVisible();
    const c = content(page);
    await expect(c.locator('df-usage-stacked-area')).toBeVisible();
    await expect(c.locator('df-cost-by-dimension')).toHaveCount(4);
    await expect(c.locator('df-expensive-calls')).toBeVisible();
    await expect(
      c.locator('df-usage-bars').filter({ hasText: 'By AI Connection' })
    ).toBeVisible();
    await expect(c).toContainText('DreamFactory AI usage');
    await expect(u.error).toHaveCount(0);
  });

  await test.step('a Status filter adds a chip and re-queries with it', async () => {
    await u.status.click();
    const panel = page.locator('.cdk-overlay-container .mat-mdc-select-panel');
    const option = panel.getByRole('option').first();
    await expect(option, 'the logged request offers its status').toBeVisible();
    const value = (await option.innerText()).trim();
    await page.keyboard.press('Escape');
    await expect(panel).toHaveCount(0);

    const filtered = page.waitForResponse(
      r => usageCall('7d')(r) && new URL(r.url()).searchParams.has('status')
    );
    await pickOptions(page, u.status, [value]);
    expect((await filtered).ok()).toBe(true);
    await expect(u.chips).toHaveCount(1);
    await expect(u.spinner).toHaveCount(0, { timeout: 30_000 });
    await expect(u.error).toHaveCount(0);
  });

  await test.step('"Clear all" drops the chip and asks without the filter', async () => {
    const unfiltered = page.waitForResponse(
      r => usageCall('7d')(r) && !new URL(r.url()).searchParams.has('status')
    );
    await u.clearAll.click();
    expect((await unfiltered).ok()).toBe(true);
    await expect(u.chips).toHaveCount(0);
    await expect(u.spinner).toHaveCount(0, { timeout: 30_000 });
    await expect(u.summary).toBeVisible();
  });

  await test.step('every range renders the dashboard without an error', async () => {
    for (const [label, period] of [
      ['24h', '24h'],
      ['30d', '30d'],
      ['All', '3650d'],
    ]) {
      const answered = page.waitForResponse(usageCall(period));
      await u.range(label).click();
      expect((await answered).ok()).toBe(true);
      await expect(u.spinner).toHaveCount(0, { timeout: 30_000 });
      await expect(u.summary, `range ${label}`).toBeVisible();
      await expect(u.error).toHaveCount(0);
    }
  });
});
