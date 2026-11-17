import { APIRequestContext, Page, Route, expect, test } from '@playwright/test';
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  loginAsAdmin,
  waitForAppReady,
} from './fixtures/admin-login';

/**
 * AI budgets and model aliases.
 *
 * The feature needs a df-ai that serves /_internal/ai/budgets and
 * /_internal/ai/aliases, and the admin UI must work against servers that do
 * not. These tests ask the target server which kind it is and follow it:
 *
 *  - on a server that has the feature, the entry points show and a budget is
 *    created, edited, disabled and deleted against the real API (cleaned up
 *    after); that test skips on a server without the feature, unless
 *    EXPECT_AI_BUDGETS=1, which makes a missing feature a failure. A gate that
 *    expects the feature must run its DF with
 *    DF_AI_BUDGET_MANAGEMENT_ENABLED=true and set EXPECT_AI_BUDGETS=1;
 *  - the "no such feature" and "no access" pages are checked on any server by
 *    answering the support check in the browser.
 */
const APP = '/dreamfactory/dist/#';
const PROBE = '**/_internal/ai/aliases';
const INTERNAL_AI = '**/_internal/ai/**';

/** What a server without the routes answers (read off a live 7.7 stack). */
const NO_ROUTE = {
  status: 404,
  contentType: 'text/html; charset=utf-8',
  body: 'Could not find a service for _internal',
};

const FORBIDDEN = {
  status: 403,
  contentType: 'application/json',
  body: JSON.stringify({
    error: { code: 403, message: 'Admin access required.' },
  }),
};

type Support = 'available' | 'unsupported' | 'forbidden' | 'unknown';

async function sessionToken(request: APIRequestContext): Promise<string> {
  const login = await request.post('/api/v2/system/admin/session', {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  expect(login.ok(), `admin API login failed: HTTP ${login.status()}`).toBe(
    true
  );
  return (await login.json()).session_token;
}

/** Ask the server the same question the UI asks. Read only. */
async function serverSupport(request: APIRequestContext): Promise<Support> {
  const probe = await request.get('/_internal/ai/aliases', {
    headers: { 'X-DreamFactory-Session-Token': await sessionToken(request) },
  });
  if (probe.status() === 200) return 'available';
  if (probe.status() === 404) return 'unsupported';
  if (probe.status() === 403) return 'forbidden';
  return 'unknown';
}

/** Answer every budget and alias request in the browser with one response. */
async function answerFeatureWith(
  page: Page,
  response: { status: number; contentType: string; body: string }
): Promise<{ probes: () => number }> {
  let probes = 0;
  await page.route(INTERNAL_AI, (route: Route) => {
    const path = new URL(route.request().url()).pathname;
    if (!/^\/_internal\/ai\/(budgets|aliases)(\/|$)/.test(path)) {
      return route.fallback();
    }
    if (path === '/_internal/ai/aliases') {
      probes++;
    }
    return route.fulfill(response);
  });
  return { probes: () => probes };
}

async function expectEntryPointsHidden(page: Page, probes: () => number) {
  // Wait for the support check to be answered, so "hidden" means decided.
  await expect.poll(probes, { timeout: 15_000 }).toBeGreaterThan(0);
  await expect(page.getByTestId('nav-ai-budgets')).toHaveCount(0);

  await page.goto(`${APP}/ai/usage`);
  await expect(page.locator('.usage__title h2')).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByTestId('manage-budgets')).toHaveCount(0);

  const serviceLists: string[] = [];
  page.on('request', r => {
    if (r.url().includes('/api/v2/system/service?')) {
      serviceLists.push(r.url());
    }
  });
  await page.goto(`${APP}/ai`);
  await expect(
    page
      .getByRole('heading', { name: 'Bring AI to your DreamFactory data' })
      .first()
  ).toBeVisible({ timeout: 30_000 });
  // Give the page time to send whatever it is going to send.
  await page.waitForTimeout(1500);
  await expect(page.getByTestId('aliases')).toHaveCount(0);
  // The alias section used to list AI connections on every AI page load.
  expect(
    serviceLists.filter(u => decodeURIComponent(u).includes('ai_connection'))
  ).toEqual([]);
  // One check per session, however many pages were opened.
  expect(probes()).toBe(1);
}

test.describe('AI budgets: server support', () => {
  const REAL_LABEL = 'e2e real round trip';

  // Leave nothing behind, whether the test passed or not.
  test.afterEach(async ({ request }) => {
    const token = await sessionToken(request);
    const headers = { 'X-DreamFactory-Session-Token': token };
    const list = await request.get('/_internal/ai/budgets', { headers });
    if (!list.ok()) return;
    for (const b of (await list.json()).resource ?? []) {
      if (b.label === REAL_LABEL) {
        await request.delete(`/_internal/ai/budgets/${b.id}`, { headers });
      }
    }
  });

  test('this server has the feature: entry points show, and a budget can be created, edited, disabled and deleted', async ({
    page,
    request,
  }) => {
    const support = await serverSupport(request);
    const why = `this server does not offer AI budgets to this admin (support check: ${support})`;
    if (process.env.EXPECT_AI_BUDGETS) {
      expect(support, why).toBe('available');
    } else {
      test.skip(support !== 'available', why);
    }
    await loginAsAdmin(page);
    await waitForAppReady(page);

    await expect(page.getByTestId('nav-ai-budgets')).toHaveCount(1, {
      timeout: 15_000,
    });

    await page.goto(`${APP}/ai/usage`);
    await expect(page.getByTestId('manage-budgets')).toBeVisible({
      timeout: 30_000,
    });
    await page.getByTestId('manage-budgets').click();
    await expect(page).toHaveURL(/#\/ai\/budgets$/);
    await expect(
      page.getByTestId('budget-table').or(page.getByTestId('budget-empty'))
    ).toBeVisible({ timeout: 30_000 });

    // The real server: create, edit the cap, disable, delete.
    await page.getByTestId('budget-new').click();
    await page.getByTestId('budget-label').fill(REAL_LABEL);
    await page.getByTestId('budget-scope-type').click();
    await page.getByRole('option', { name: 'All AI spend' }).click();
    await page.getByTestId('budget-cap').fill('12.5');
    await page.getByTestId('budget-hard-stop').locator('button').click();
    await expect(page.getByTestId('budget-hard-stop-warning')).toContainText(
      'HTTP 429'
    );
    await page.getByTestId('budget-save').click();
    await expect(page.getByTestId('budget-form')).toHaveCount(0);
    const row = page.getByTestId('budget-row').filter({ hasText: REAL_LABEL });
    await expect(row).toContainText('$12.50');

    await row.getByTestId('budget-edit').click();
    await page.getByTestId('budget-cap').fill('40');
    await page.getByTestId('budget-save').click();
    await expect(row).toContainText('$40.00');

    await row.locator('mat-slide-toggle button').click();
    const stored = async () => {
      const res = await request.get('/_internal/ai/budgets', {
        headers: {
          'X-DreamFactory-Session-Token': await sessionToken(request),
        },
      });
      return (await res.json()).resource.find(
        (b: { label: string }) => b.label === REAL_LABEL
      );
    };
    await expect.poll(async () => (await stored())?.is_active).toBe(false);

    await row.getByTestId('budget-delete').click();
    await page.getByTestId('confirm-dialog-confirm').click();
    await expect(row).toHaveCount(0);
    expect(await stored()).toBeUndefined();

    await page.goto(`${APP}/ai`);
    await expect(page.getByTestId('aliases')).toBeVisible({
      timeout: 30_000,
    });
  });

  test('a server without the feature: no entry points, a clear page on the direct URL', async ({
    page,
  }) => {
    const { probes } = await answerFeatureWith(page, NO_ROUTE);
    await loginAsAdmin(page);
    await waitForAppReady(page);
    await expectEntryPointsHidden(page, probes);

    await page.goto(`${APP}/ai/budgets`);
    const state = page.getByTestId('budget-unsupported');
    await expect(state).toBeVisible({ timeout: 30_000 });
    await expect(state).toContainText(
      'AI budgets are not available on this server'
    );
    // No raw server text, no controls that cannot work.
    await expect(page.locator('body')).not.toContainText(
      'Could not find a service'
    );
    await expect(page.getByTestId('budget-new')).toHaveCount(0);
    await expect(page.getByTestId('budget-table')).toHaveCount(0);
  });

  test('a server that refuses this admin: no entry points, a clear page on the direct URL', async ({
    page,
  }) => {
    const { probes } = await answerFeatureWith(page, FORBIDDEN);
    await loginAsAdmin(page);
    await waitForAppReady(page);
    await expectEntryPointsHidden(page, probes);

    await page.goto(`${APP}/ai/budgets`);
    const state = page.getByTestId('budget-forbidden');
    await expect(state).toBeVisible({ timeout: 30_000 });
    await expect(state).toContainText("can't manage AI budgets");
    await expect(page.getByTestId('budget-new')).toHaveCount(0);
  });
});
