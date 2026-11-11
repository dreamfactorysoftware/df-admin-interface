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
 *    after); that test skips on a server without the feature, so the gate's
 *    DF must run with DF_AI_BUDGET_MANAGEMENT_ENABLED=true;
 *  - the "no such feature" and "no access" pages are checked on any server by
 *    answering the support check in the browser;
 *  - the screen's write paths also run against an in-browser fake of the
 *    budget API; any other write to /_internal/ai/* is aborted.
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
    test.skip(
      support !== 'available',
      `this server does not offer AI budgets to this admin (support check: ${support})`
    );
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

interface FakeBudget {
  id: number;
  label: string;
  dimension_type: string;
  dimension_id: number | null;
  dimension_name: string | null;
  period: string;
  budget_usd: number;
  hard_stop: boolean;
  is_active: boolean;
  alert_webhook_url: string | null;
  has_alert_webhook_auth: boolean;
  spent_usd: number;
  remaining_usd: number;
  utilization: number;
  blocking: boolean;
}

/**
 * An in-browser stand-in for the budget and alias API, so the write paths of
 * the screen can run without changing anything on the server.
 */
async function fakeBudgetApi(page: Page, seed: FakeBudget[] = []) {
  const budgets = [...seed];
  const calls: Array<{ method: string; path: string; body: any }> = [];
  let nextId = 9000;
  const json = (route: Route, status: number, body: unknown) =>
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });

  await page.route(INTERNAL_AI, (route: Route) => {
    const req = route.request();
    const method = req.method();
    const path = new URL(req.url()).pathname;
    const match = path.match(
      /^\/_internal\/ai\/(budgets|aliases)(?:\/(\d+))?$/
    );
    if (!match) {
      // Usage and the rest of /_internal/ai are read only: let reads through.
      return method === 'GET' ? route.fallback() : route.abort();
    }
    const [, kind, idText] = match;
    const body = method === 'GET' ? null : req.postDataJSON();
    calls.push({ method, path, body });

    if (kind === 'aliases') {
      return method === 'GET'
        ? json(route, 200, { resource: [] })
        : json(route, 400, { error: { code: 400, message: 'not faked' } });
    }
    if (method === 'GET') {
      return json(route, 200, {
        resource: budgets,
        usage_logging_enabled: true,
      });
    }
    if (method === 'POST') {
      const created: FakeBudget = {
        id: nextId++,
        dimension_name: body.dimension_type === 'global' ? null : 'picked',
        is_active: true,
        alert_webhook_url: null,
        has_alert_webhook_auth: false,
        spent_usd: 0,
        remaining_usd: body.budget_usd,
        utilization: 0,
        blocking: false,
        ...body,
      };
      budgets.push(created);
      return json(route, 201, created);
    }
    const index = budgets.findIndex(b => b.id === Number(idText));
    if (index === -1) {
      return json(route, 404, {
        error: { code: 404, message: 'Budget not found.' },
      });
    }
    if (method === 'PATCH') {
      budgets[index] = { ...budgets[index], ...body };
      return json(route, 200, budgets[index]);
    }
    if (method === 'DELETE') {
      budgets.splice(index, 1);
      return json(route, 200, { id: Number(idText) });
    }
    return route.abort();
  });
  return { budgets, calls };
}

function seedBudget(over: Partial<FakeBudget> = {}): FakeBudget {
  return {
    id: 1,
    label: 'e2e seeded budget',
    dimension_type: 'global',
    dimension_id: null,
    dimension_name: null,
    period: 'monthly',
    budget_usd: 100,
    hard_stop: false,
    is_active: true,
    alert_webhook_url: null,
    has_alert_webhook_auth: false,
    spent_usd: 25,
    remaining_usd: 75,
    utilization: 0.25,
    blocking: false,
    ...over,
  };
}

test.describe('AI budgets: the screen, against a faked budget API', () => {
  test('create, edit, disable and delete a budget', async ({ page }) => {
    const api = await fakeBudgetApi(page, [seedBudget()]);
    await loginAsAdmin(page);
    await waitForAppReady(page);
    await page.goto(`${APP}/ai/budgets`);
    await expect(page.getByTestId('budget-row')).toHaveCount(1, {
      timeout: 30_000,
    });

    // Create: hard stop is off until asked for, and asking shows the warning.
    await page.getByTestId('budget-new').click();
    const save = page.getByTestId('budget-save');
    await expect(save).toBeDisabled();
    await page.getByTestId('budget-label').fill('e2e global cap');
    await page.getByTestId('budget-scope-type').click();
    await page.getByRole('option', { name: 'All AI spend' }).click();
    await expect(page.getByTestId('budget-scope-record')).toHaveCount(0);
    await page.getByTestId('budget-cap').fill('12.5');
    await expect(page.getByTestId('budget-hard-stop-warning')).toHaveCount(0);
    await page.getByTestId('budget-hard-stop').locator('button').click();
    await expect(page.getByTestId('budget-hard-stop-warning')).toContainText(
      'HTTP 429'
    );
    await expect(save).toBeEnabled();
    await save.click();
    await expect(page.getByTestId('budget-form')).toHaveCount(0);
    await expect(page.getByTestId('budget-row')).toHaveCount(2);

    const created = api.calls.find(c => c.method === 'POST')!;
    expect(created.body).toMatchObject({
      label: 'e2e global cap',
      dimension_type: 'global',
      dimension_id: null,
      period: 'monthly',
      budget_usd: 12.5,
      hard_stop: true,
    });
    expect(created.body).not.toHaveProperty('alert_webhook_auth_header');

    const row = page
      .getByTestId('budget-row')
      .filter({ hasText: 'e2e global cap' });
    await expect(row).toContainText('$12.50');
    await expect(row).toContainText('On');

    // Edit.
    await row.getByTestId('budget-edit').click();
    await expect(page.getByTestId('budget-label')).toHaveValue(
      'e2e global cap'
    );
    await page.getByTestId('budget-cap').fill('40');
    await page.getByTestId('budget-save').click();
    await expect(row).toContainText('$40.00');
    const patched = api.calls.find(
      c => c.method === 'PATCH' && c.body.budget_usd === 40
    );
    expect(patched).toBeTruthy();

    // Disable from the table.
    await row.locator('mat-slide-toggle button').click();
    await expect
      .poll(
        () => api.budgets.find(b => b.label === 'e2e global cap')?.is_active
      )
      .toBe(false);

    // Delete, with confirmation.
    await row.getByTestId('budget-delete').click();
    await expect(page.getByRole('dialog')).toContainText('Delete this budget?');
    await page.getByTestId('confirm-dialog-confirm').click();
    await expect(page.getByTestId('budget-row')).toHaveCount(1);
    expect(api.calls.filter(c => c.method === 'DELETE')).toHaveLength(1);
  });
});
