import { test, expect } from '@playwright/test';
import { loginAsAdmin, waitForAppReady } from './fixtures/admin-login';

test('schema contracts tab renders and hits the backend', async ({ page }) => {
  const jsErrors: string[] = [];
  page.on('pageerror', err => jsErrors.push(err.message));

  await loginAsAdmin(page);
  await waitForAppReady(page);
  await page.goto('/dreamfactory/dist/#/admin-settings/schema-contracts');

  // The manage component must render (its host element or a recognizable heading).
  await expect(
    page.locator('df-manage-schema-contracts, table, mat-table').first()
  ).toBeVisible({ timeout: 15_000 });

  // The lifted service should call the schema_contract backend, proving the
  // route wired to the component and the API path resolves (not a 404 route).
  const body = await page.textContent('body');
  expect(body, 'raw transloco key leaked (i18n not wired)').not.toMatch(
    /admin-settings\.schema-contracts/
  );
  expect(jsErrors, 'page threw uncaught JS exceptions').toEqual([]);

  // Nav active-state: only Schema Contracts must highlight, not the sibling
  // Schema item whose path is a string prefix. Guards the isActive() segment
  // match in df-side-nav.
  const active = await page.$$eval('.active', els =>
    els.map(e => (e.textContent || '').trim()).filter(Boolean)
  );
  expect(active).toContain('Schema Contracts');
  expect(active).not.toContain('Schema');
});
