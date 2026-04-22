/**
 * Discovery run. Not a regression gate — this spec is designed to walk
 * the most common journeys and report what breaks along the way. Each
 * journey reports to the shared `findings` list; the summary prints at
 * the end of the run.
 *
 * Now uses the NavPage page-object which depends on data-testid
 * attributes added to df-side-nav.component.html in this branch.
 */
import { test, expect, Page } from '@playwright/test';
import { loginAsAdmin, waitForAppReady } from './fixtures/admin-login';
import { NavPage } from './fixtures/nav';

type Finding = { journey: string; step: string; detail: string };
const findings: Finding[] = [];
function report(journey: string, step: string, detail: string) {
  findings.push({ journey, step, detail });
  console.log(`  [${journey}] ${step}: ${detail}`);
}

async function setupPage(page: Page) {
  await page.setViewportSize({ width: 1600, height: 900 });
  await loginAsAdmin(page);
  await waitForAppReady(page);
}

test.describe.configure({ timeout: 240_000 });

test('journey: event-scripts create', async ({ page }) => {
  const J = 'event-scripts';
  page.on('pageerror', e => report(J, 'jsError', e.message));

  await setupPage(page);
  const nav = new NavPage(page);
  try {
    await nav.goto('/api-connections/event-scripts');
  } catch (e: any) {
    report(J, 'nav', `nav.goto failed: ${e.message.split('\n')[0]}`);
    return;
  }
  report(J, 'nav', `ok → ${page.url()}`);

  // + button
  const addBtn = page.getByTestId('manage-table-create');
  if (!(await addBtn.isVisible().catch(() => false))) {
    report(J, '+ button', 'not visible on list');
    return;
  }
  await addBtn.click();
  await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => {});

  // Service dropdown
  const svcSel = page.locator('mat-select').first();
  if (!(await svcSel.isVisible().catch(() => false))) {
    report(J, 'form', 'no mat-select on create form');
    return;
  }
  await svcSel.click();
  const svcOptions = await page.locator('mat-option').allTextContents();
  if (svcOptions.length === 0) {
    report(J, 'service dropdown', 'zero options');
    return;
  }
  report(J, 'service dropdown', `${svcOptions.length} options`);
  await page
    .locator('mat-option')
    .filter({ hasText: /^db$/ })
    .first()
    .click()
    .catch(() => {});
  await page.waitForTimeout(500);

  // Script Type
  const typeSel = page.locator('mat-select').nth(1);
  await typeSel.click().catch(() => {});
  const typeOptions = await page.locator('mat-option').allTextContents();
  if (typeOptions.length === 0) {
    report(J, 'script type', 'zero options after picking db');
    return;
  }
  report(J, 'script type', `${typeOptions.length} options, first: ${typeOptions[0]}`);
  await page.locator('mat-option').first().click();
  await page.waitForTimeout(300);

  // Script Method
  const methodSel = page.locator('mat-select').nth(2);
  await methodSel.click().catch(() => {});
  const methodOptions = await page.locator('mat-option').allTextContents();
  if (methodOptions.length === 0) {
    report(J, 'script method', 'zero options after picking type');
    return;
  }
  report(
    J,
    'script method',
    `${methodOptions.length} options, first: ${methodOptions[0]}`
  );
  await page.locator('mat-option').first().click();
  await page.waitForTimeout(300);

  // Save
  const saveBtn = page.locator('button[type="submit"]').first();
  if (!(await saveBtn.isVisible().catch(() => false))) {
    report(J, 'save', 'no submit button');
    return;
  }
  const [saveResp] = await Promise.all([
    page
      .waitForResponse(
        r =>
          r.url().includes('/api/v2/system/event_script') &&
          r.request().method() === 'POST',
        { timeout: 10_000 }
      )
      .catch(() => null),
    saveBtn.click().catch(() => {}),
  ]);
  if (!saveResp) {
    report(J, 'save', 'no POST /system/event_script fired');
  } else if (!saveResp.ok()) {
    const body = await saveResp.text();
    report(J, 'save', `HTTP ${saveResp.status()}: ${body.slice(0, 180)}`);
  } else {
    report(J, 'save', `OK ${saveResp.status()}`);
  }
});

test('journey: api-connections > database list + create form', async ({ page }) => {
  const J = 'api-db';
  page.on('pageerror', e => report(J, 'jsError', e.message));

  await setupPage(page);
  const nav = new NavPage(page);
  try {
    await nav.goto('/api-connections/api-types/database');
  } catch (e: any) {
    report(J, 'nav', `nav.goto failed: ${e.message.split('\n')[0]}`);
    return;
  }
  report(J, 'nav', `ok → ${page.url()}`);

  const addBtn = page.getByTestId('manage-table-create');
  if (!(await addBtn.isVisible().catch(() => false))) {
    report(J, '+ button', 'not visible on list');
    return;
  }
  await addBtn.click();
  await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => {});
  report(J, 'create form', `URL: ${page.url()}`);

  const typeSel = page.locator('mat-select').first();
  if (!(await typeSel.isVisible().catch(() => false))) {
    report(J, 'type picker', 'no mat-select');
    return;
  }
  await typeSel.click();
  const types = await page.locator('mat-option').count();
  report(J, 'type picker', `${types} service-type options`);
});

test('journey: roles list + create form', async ({ page }) => {
  const J = 'roles';
  page.on('pageerror', e => report(J, 'jsError', e.message));

  await setupPage(page);
  const nav = new NavPage(page);
  try {
    await nav.goto('/api-connections/role-based-access');
  } catch (e: any) {
    report(J, 'nav', `nav.goto failed: ${e.message.split('\n')[0]}`);
    return;
  }
  report(J, 'nav', `ok → ${page.url()}`);

  const rows = await page.locator('mat-row, tr.mat-mdc-row').count();
  report(J, 'list', `${rows} role rows`);

  const addBtn = page.getByTestId('manage-table-create');
  if (!(await addBtn.isVisible().catch(() => false))) {
    report(J, '+ button', 'not visible on list');
    return;
  }
  await addBtn.click();
  await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => {});
  report(J, 'create form', `URL: ${page.url()}`);

  const inputs = await page.locator('input[type="text"], mat-select').count();
  report(J, 'create form inputs', `${inputs} inputs/selects`);
});

test('journey: admin users list + create form', async ({ page }) => {
  const J = 'admins';
  page.on('pageerror', e => report(J, 'jsError', e.message));

  await setupPage(page);
  const nav = new NavPage(page);
  try {
    await nav.goto('/admin-settings/admins');
  } catch (e: any) {
    report(J, 'nav', `nav.goto failed: ${e.message.split('\n')[0]}`);
    return;
  }
  report(J, 'nav', `ok → ${page.url()}`);

  const rows = await page.locator('mat-row, tr.mat-mdc-row').count();
  report(J, 'list', `${rows} admin rows`);

  const addBtn = page.getByTestId('manage-table-create');
  if (!(await addBtn.isVisible().catch(() => false))) {
    report(J, '+ button', 'not visible on list');
    return;
  }
  await addBtn.click();
  await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => {});
  report(J, 'create form', `URL: ${page.url()}`);
});

test('journey: api-keys list + create form', async ({ page }) => {
  const J = 'api-keys';
  page.on('pageerror', e => report(J, 'jsError', e.message));

  await setupPage(page);
  const nav = new NavPage(page);
  try {
    await nav.goto('/api-connections/api-keys');
  } catch (e: any) {
    report(J, 'nav', `nav.goto failed: ${e.message.split('\n')[0]}`);
    return;
  }
  report(J, 'nav', `ok → ${page.url()}`);

  const addBtn = page.getByTestId('manage-table-create');
  if (!(await addBtn.isVisible().catch(() => false))) {
    report(J, '+ button', 'not visible on list');
    return;
  }
  await addBtn.click();
  await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => {});
  report(J, 'create form', `URL: ${page.url()}`);
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
      for (const f of list) {
        console.log(`  • ${f.step.padEnd(24)} ${f.detail}`);
      }
    }
  }
  console.log('\n=== END FINDINGS ===\n');
});
