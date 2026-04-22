/**
 * Discovery run. Not a regression gate — this spec is designed to FAIL
 * loudly on anything that isn't working so we get a concrete bug list.
 * Do not add to jest.config.ci or the nightly Playwright workflow.
 *
 * Strategy: simulate a new admin working through the most common journeys
 * on a vanilla dev-docker instance. Each step records what it saw; the
 * final console report lists every deviation from expected.
 */
import { test, expect, Page } from '@playwright/test';
import { loginAsAdmin, waitForAppReady } from './fixtures/admin-login';

type Finding = {
  journey: string;
  step: string;
  detail: string;
};
const findings: Finding[] = [];
function report(journey: string, step: string, detail: string) {
  findings.push({ journey, step, detail });
  console.log(`  [${journey}] ${step}: ${detail}`);
}

async function clickNavByText(
  page: Page,
  label: string,
  journey: string
): Promise<boolean> {
  // Sidebar entries are <div mat-list-item> wrappers with a <button
  // .nav-item> and a <span .nav-item> inside. The router navigation is
  // bound to the mat-list-item, not the inner button — clicking only the
  // button appears to trigger but doesn't actually route. Click the
  // mat-list-item containing the target text.
  const el = page
    .locator(`[mat-list-item]:has(button.nav-item:has-text("${label}"))`)
    .first();
  const count = await el.count();
  if (count === 0) {
    report(journey, 'nav-select', `no mat-list-item matched "${label}"`);
    return false;
  }
  try {
    await el.scrollIntoViewIfNeeded({ timeout: 2_000 });
  } catch (e: any) {
    report(journey, 'nav-scroll', e.message.split('\n')[0]);
  }
  try {
    await el.click({ timeout: 5_000, force: true });
    return true;
  } catch (e: any) {
    report(journey, 'nav-click', e.message.split('\n')[0]);
    return false;
  }
}

async function setupPage(page: Page) {
  await page.setViewportSize({ width: 1600, height: 900 });
  await loginAsAdmin(page);
  await waitForAppReady(page);
  // Wait for the sidebar nav to populate. Home button is always present;
  // if it never appears, the login flow didn't resolve.
  await page
    .locator('button.nav-item:has-text("Home")')
    .first()
    .waitFor({ timeout: 10_000 })
    .catch(() => {});
}

test.describe.configure({ timeout: 240_000 });

test('journey: event-scripts create', async ({ page }) => {
  const J = 'event-scripts';
  const nav4xx: number[] = [];
  page.on('response', r => {
    if (r.url().includes('/api/') && r.status() >= 400) nav4xx.push(r.status());
  });
  page.on('pageerror', e => report(J, 'jsError', e.message));
  await setupPage(page);

  // 1. Navigate
  const clicked = await clickNavByText(page, 'Event Scripts', J);
  if (!clicked) {
    report(J, 'nav', 'Event Scripts nav entry not clickable from fresh login');
    return;
  }
  await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => {});
  const url = page.url();
  if (!/event-scripts/.test(url)) {
    report(J, 'nav', `expected /event-scripts, landed at ${url}`);
    return;
  }

  // 2. Click +
  const addBtn = page.locator('button.save-btn').first();
  if (!(await addBtn.isVisible().catch(() => false))) {
    report(J, '+ button', '.save-btn not visible on /event-scripts list');
    return;
  }
  await addBtn.click().catch(e => report(J, '+ click', e.message));

  await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => {});

  // 3. Create form — Service dropdown
  const svcSel = page.locator('mat-select').first();
  if (!(await svcSel.isVisible().catch(() => false))) {
    report(J, 'form', 'no mat-select visible on create form');
    return;
  }
  await svcSel.click();
  const svcOptions = await page.locator('mat-option').allTextContents();
  if (svcOptions.length === 0) {
    report(J, 'service dropdown', 'zero options');
    return;
  }
  report(J, 'service dropdown', `${svcOptions.length} options: ${svcOptions.slice(0, 5).join(', ')}…`);
  await page.locator('mat-option').filter({ hasText: /^db$/ }).first().click().catch(() => {});
  await page.waitForTimeout(500);

  // 4. Script Type
  const typeSel = page.locator('mat-select').nth(1);
  await typeSel.click().catch(() => {});
  const typeOptions = await page.locator('mat-option').allTextContents();
  if (typeOptions.length === 0) {
    report(J, 'script type dropdown', 'zero options after picking service=db');
    return;
  }
  report(J, 'script type dropdown', `${typeOptions.length} options, first: ${typeOptions[0]}`);
  await page.locator('mat-option').first().click();
  await page.waitForTimeout(300);

  // 5. Script Method
  const methodSel = page.locator('mat-select').nth(2);
  await methodSel.click().catch(() => {});
  const methodOptions = await page.locator('mat-option').allTextContents();
  if (methodOptions.length === 0) {
    report(J, 'script method dropdown', 'zero options after picking type');
    return;
  }
  report(J, 'script method dropdown', `${methodOptions.length} options, first: ${methodOptions[0]}`);
  await page.locator('mat-option').first().click();
  await page.waitForTimeout(300);

  // 6. Save
  const saveBtn = page.locator('button[type="submit"]').first();
  if (!(await saveBtn.isVisible().catch(() => false))) {
    report(J, 'save button', 'not visible');
    return;
  }
  const [saveResp] = await Promise.all([
    page.waitForResponse(r => r.url().includes('/api/v2/system/event_script') && r.request().method() === 'POST', { timeout: 10_000 }).catch(() => null),
    saveBtn.click().catch(() => {}),
  ]);
  if (!saveResp) {
    report(J, 'save', 'no POST /system/event_script fired — form submit did nothing');
  } else if (!saveResp.ok()) {
    report(J, 'save', `HTTP ${saveResp.status()} ${saveResp.statusText()}: ${(await saveResp.text()).slice(0, 200)}`);
  } else {
    report(J, 'save', `OK ${saveResp.status()}`);
  }

  if (nav4xx.length) report(J, '4xx/5xx', `statuses: ${nav4xx.join(',')}`);
});

test('journey: api-connections > database', async ({ page }) => {
  const J = 'api-db';
  page.on('pageerror', e => report(J, 'jsError', e.message));
  await setupPage(page);

  if (!(await clickNavByText(page, 'Database', J))) {
    return;
  }
  await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => {});
  report(J, 'nav', `landed at ${page.url()}`);

  // Look for + button
  if (!(await page.locator('button.save-btn').first().isVisible().catch(() => false))) {
    report(J, '+ button', 'no .save-btn on Database list view');
    return;
  }
  await page.locator('button.save-btn').first().click();
  await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => {});
  report(J, 'create form', `URL after +: ${page.url()}`);

  // Is there a service type picker?
  const typeSel = page.locator('mat-select').first();
  if (!(await typeSel.isVisible().catch(() => false))) {
    report(J, 'type picker', 'no mat-select on create form');
    return;
  }
  await typeSel.click();
  const types = await page.locator('mat-option').count();
  report(J, 'type picker', `${types} service-type options`);
});

test('journey: roles list', async ({ page }) => {
  const J = 'roles';
  page.on('pageerror', e => report(J, 'jsError', e.message));
  await setupPage(page);

  const ok = await clickNavByText(page, 'Role Based Access', J);
  if (!ok) {
    report(J, 'nav', 'Role Based Access nav entry not clickable');
    return;
  }
  await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => {});
  report(J, 'nav', `landed at ${page.url()}`);

  // List view
  const rows = await page.locator('mat-row, tr.mat-mdc-row').count();
  report(J, 'list', `${rows} role rows rendered`);

  if (!(await page.locator('button.save-btn').first().isVisible().catch(() => false))) {
    report(J, '+ button', 'no .save-btn on roles list');
    return;
  }
  await page.locator('button.save-btn').first().click();
  await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => {});
  report(J, 'create form', `URL: ${page.url()}`);

  const inputs = await page.locator('input[type="text"], mat-select').count();
  report(J, 'create form', `${inputs} inputs/selects on form`);
});

test('journey: admin users list', async ({ page }) => {
  const J = 'admins';
  page.on('pageerror', e => report(J, 'jsError', e.message));
  await setupPage(page);

  if (!(await clickNavByText(page, 'Admins', J))) {
    return;
  }
  await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => {});
  report(J, 'nav', `landed at ${page.url()}`);

  const rows = await page.locator('mat-row, tr.mat-mdc-row').count();
  report(J, 'list', `${rows} admin rows rendered`);

  if (!(await page.locator('button.save-btn').first().isVisible().catch(() => false))) {
    report(J, '+ button', 'no .save-btn on admins list');
    return;
  }
  await page.locator('button.save-btn').first().click();
  await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => {});
  report(J, 'create form', `URL: ${page.url()}`);
});

test('journey: mcp create service', async ({ page }) => {
  const J = 'mcp';
  page.on('pageerror', e => report(J, 'jsError', e.message));
  await setupPage(page);

  if (!(await clickNavByText(page, 'Utility', J))) {
    return;
  }
  await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => {});
  report(J, 'nav', `landed at ${page.url()}`);

  // Look for sub-nav MCP link
  const mcpLink = page.locator('a:has-text("MCP"), button:has-text("MCP")').first();
  if (!(await mcpLink.isVisible().catch(() => false))) {
    report(J, 'mcp link', 'no MCP sub-nav under Utility');
    return;
  }
  await mcpLink.click().catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => {});
  report(J, 'mcp page', `URL: ${page.url()}`);
});

test.afterAll(() => {
  console.log('\n=== DISCOVERY FINDINGS ===\n');
  if (findings.length === 0) {
    console.log('(no issues recorded)');
  } else {
    const byJ = new Map<string, Finding[]>();
    for (const f of findings) {
      if (!byJ.has(f.journey)) byJ.set(f.journey, []);
      byJ.get(f.journey)!.push(f);
    }
    for (const [j, list] of byJ) {
      console.log(`\n== ${j} ==`);
      for (const f of list) console.log(`  • ${f.step.padEnd(22)} ${f.detail}`);
    }
  }
  console.log('\n=== END FINDINGS ===\n');
});
