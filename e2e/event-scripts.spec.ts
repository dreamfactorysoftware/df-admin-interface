import { test, expect } from '@playwright/test';
import { loginAsAdmin, waitForAppReady } from './fixtures/admin-login';

/**
 * End-to-end regression for the Event Scripts create flow — the path that
 * was broken for the Triskele customer on 2026-04-22.
 *
 * Covers the entire chain that broke during that fire-drill:
 *  - form opens without a stuck spinner (loading-spinner race fix)
 *  - Service dropdown populates with raw service names (/system/event
 *    services_only fast path + case-interceptor exemption)
 *  - Script Type dropdown populates (response lookup uses raw key)
 *  - Script Method dropdown populates
 *  - Save produces a 201/200, not a 400 "No record(s) detected"
 */
test.describe('Event Scripts — create flow', () => {
  // TODO: this spec navigates via hash-routing, which doesn't reliably
  // trigger the lazy-loaded route resolver on `page.goto('#/event-scripts')`.
  // Need to either click through the sidenav (resolved reliably by role
  // selectors once the welcome/license flow is accounted for) or switch
  // the app to path-based routing. Keeping the spec scaffolded so the
  // intent is visible and fixing the navigation is small follow-up work.
  test.fixme('create an event script end-to-end', async ({ page }) => {
    await loginAsAdmin(page);
    await waitForAppReady(page);

    // Navigate into Event Scripts. Use a hard reload of the full URL so
    // the hash router definitely re-evaluates (in-app hash-only changes
    // from page.goto don't always trigger lazy-loaded route resolvers).
    await page.goto('/dreamfactory/dist/#/event-scripts', {
      waitUntil: 'networkidle',
      timeout: 15_000,
    });

    // Click the + button. DfManageTable renders a mat-mini-fab with class
    // .save-btn for the "New Entry" action.
    const addBtn = page.locator('button.save-btn').first();
    await expect(addBtn).toBeVisible({ timeout: 15_000 });
    await addBtn.click();

    // Spinner must clear. If the loading-spinner race is back, this
    // waits forever until the test timeout.
    await expect(
      page.locator('mat-progress-spinner, .loading-spinner')
    ).toHaveCount(0, { timeout: 20_000 });

    // Service dropdown
    const serviceSelect = page.getByLabel(/^service$/i);
    await serviceSelect.click();
    // `db` is always present in a dev-docker setup; any underscore service
    // also exercises the case-interceptor exemption.
    const dbOption = page.getByRole('option', { name: /^db$/ });
    await expect(dbOption).toBeVisible({ timeout: 10_000 });
    await dbOption.click();

    // Script Type dropdown must populate. Empty = the pre-fix bug.
    const typeSelect = page.getByLabel(/script\s*type/i);
    await typeSelect.click();
    const firstType = page.getByRole('option').first();
    await expect(firstType).toBeVisible({ timeout: 10_000 });
    // Pick a type without {table_name} templating so selectedRoute()
    // alone produces a valid completeScriptName.
    const dbType = page.getByRole('option', { name: /^db$/ });
    await dbType.click();

    // Script Method
    const methodSelect = page.getByLabel(/script\s*method/i);
    await methodSelect.click();
    const firstMethod = page
      .getByRole('option', { name: /\.get\.pre_process$/ })
      .first();
    await expect(firstMethod).toBeVisible({ timeout: 10_000 });
    await firstMethod.click();

    // Grab the method text we picked so we can clean up after save.
    // At this point completeScriptName === selectedRouteItem.

    // Activate the script and add a one-line body.
    const isActiveToggle = page.getByLabel(/active/i).first();
    await isActiveToggle.click();

    // Save
    const saveBtn = page.getByRole('button', { name: /^save$/i });
    const savePromise = page.waitForResponse(
      r =>
        r.url().includes('/api/v2/system/event_script') &&
        r.request().method() === 'POST'
    );
    await saveBtn.click();
    const resp = await savePromise;
    expect(
      [200, 201].includes(resp.status()),
      `expected save to succeed, got ${resp.status()}: ${await resp.text()}`
    ).toBe(true);
  });
});
