import { test, expect, Page } from '@playwright/test';
import { loginAsAdmin, waitForAppReady } from './fixtures/admin-login';

/**
 * Regression guard for component styles that leak onto the rest of the app.
 *
 * Angular 16 keeps a component's <style> in <head> for the whole session once
 * the component has rendered (REMOVE_STYLES_ON_COMPONENT_DESTROY is false until
 * v17), so any ::ng-deep rule without a :host prefix is effectively global from
 * then on. The Data Explorer used to clip the shell's mat-sidenav-content this
 * way, which removed the page scrollbar everywhere until a hard refresh.
 */

const SHELL_SCROLLER = 'mat-sidenav-content.sidenav-content';

async function shellOverflowY(page: Page) {
  return page
    .locator(SHELL_SCROLLER)
    .evaluate(el => getComputedStyle(el).overflowY);
}

async function openExplorerTable(page: Page) {
  await page.goto('/dreamfactory/dist/#/api-connections/data-explorer', {
    waitUntil: 'domcontentloaded',
  });
  const db = page
    .locator('.db-item', {
      has: page.locator('.db-type', { hasText: /sqlite/i }),
    })
    .first();
  await expect(db).toBeVisible({ timeout: 20_000 });
  await db.click();
  const table = page.locator('.table-item').first();
  await expect(table).toBeVisible({ timeout: 20_000 });
  await table.click();
  await expect(page.locator('select.filter-op').first()).toBeVisible({
    timeout: 20_000,
  });
}

test.describe('component style leaks', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await waitForAppReady(page);
  });

  test('shell keeps its scrollbar after visiting the Data Explorer', async ({
    page,
  }) => {
    await openExplorerTable(page);

    // The explorer still clips its own sidenav content...
    const inner = page.locator(
      '.explorer-sidenav-container > .mat-drawer-content'
    );
    await expect(inner).toBeVisible();
    expect(await inner.evaluate(el => getComputedStyle(el).overflowY)).toBe(
      'hidden'
    );
    // ...but never the shell's scroller, even while it is on screen.
    expect(await shellOverflowY(page)).toBe('auto');

    // Leave for a long page: the shell must still scroll.
    await page.evaluate(() => {
      location.hash = '#/api-connections/api-types/database/5';
    });
    await page.waitForSelector('df-service-details', { timeout: 20_000 });
    expect(await shellOverflowY(page)).toBe('auto');

    // No stylesheet may carry an unscoped rule that clips the shell.
    const unscoped = await page.evaluate(
      () =>
        Array.from(document.head.querySelectorAll('style')).filter(s =>
          /(^|[},])\s*\.mat-(sidenav|drawer)-content[^{,]*\{[^}]*overflow:\s*hidden/.test(
            s.textContent || ''
          )
        ).length
    );
    expect(unscoped).toBe(0);
  });

  test('roles access select panels size to content without a global overlay rule', async ({
    page,
  }) => {
    await page.goto(
      '/dreamfactory/dist/#/api-connections/role-based-access/create',
      {
        waitUntil: 'domcontentloaded',
      }
    );
    await page.waitForSelector('df-roles-access', { timeout: 20_000 });
    await page.getByRole('button', { name: /create a new entry/i }).click();
    const select = page.locator('df-roles-access mat-select').first();
    await expect(select).toBeVisible({ timeout: 10_000 });
    await select.click();
    const pane = page
      .locator('.cdk-overlay-pane:has(.mat-mdc-select-panel)')
      .first();
    await expect(pane).toBeVisible({ timeout: 5_000 });
    // panelWidth: null leaves the pane unsized so it fits its options.
    expect(await pane.evaluate(el => (el as HTMLElement).style.width)).toBe('');
    const leaked = await page.evaluate(
      () =>
        Array.from(document.head.querySelectorAll('style')).filter(s =>
          /\.cdk-overlay-pane\s*\{[^}]*max-content/.test(s.textContent || '')
        ).length
    );
    expect(leaked).toBe(0);
    await page.keyboard.press('Escape');
  });
});
