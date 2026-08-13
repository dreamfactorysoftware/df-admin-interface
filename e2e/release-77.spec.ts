import { test, expect } from '@playwright/test';
import { loginAsAdmin, waitForAppReady } from './fixtures/admin-login';

/**
 * 7.7 merge-gate verification (exploratory, not CI-gated).
 *
 * PROMPT_MERGE.md: "boot the admin UI and confirm login, service list,
 * service detail, AI chat, the scheduler run-as fields, and cURL import
 * all render and work."
 */

const CURL_CMD =
  "curl -X GET 'https://api.example.com/v1/users?limit=10&active=true' " +
  "-H 'Authorization: Bearer TOKEN123' -H 'X-Custom: yes'";

test('service list renders', async ({ page }) => {
  await loginAsAdmin(page);
  await waitForAppReady(page);
  await page.goto('/dreamfactory/dist/#/api-connections/api-types/network');
  // The manage-services table should render at least the header row.
  await expect(page.locator('table, mat-table').first()).toBeVisible({
    timeout: 15_000,
  });
});

test('cURL import populates HTTP service config', async ({ page }) => {
  await loginAsAdmin(page);
  await waitForAppReady(page);
  await page.goto(
    '/dreamfactory/dist/#/api-connections/api-types/network/create'
  );

  // Pick the HTTP service type. The create page renders a type selector;
  // choose the HTTP/rws entry.
  const typeSelect = page.locator('mat-select').first();
  await expect(typeSelect).toBeVisible({ timeout: 15_000 });
  await typeSelect.click();
  await page
    .locator('mat-option')
    .filter({ hasText: /^\s*HTTP\b/i })
    .first()
    .click();

  // The import button gates on showCurlImport (network service + baseUrl
  // field in schema).
  const importBtn = page.getByTestId('open-curl-import');
  await expect(importBtn, 'curl import button must render').toBeVisible({
    timeout: 15_000,
  });
  await importBtn.click();

  // Paste the command, check the parsed preview, import.
  const dialog = page.locator('df-curl-import-dialog');
  await expect(dialog).toBeVisible();
  await dialog.locator('textarea').fill(CURL_CMD);
  await expect(dialog.getByText('https://api.example.com/v1/users')).toBeVisible(
    { timeout: 10_000 }
  );
  await dialog
    .getByRole('button', { name: /import/i })
    .last()
    .click();
  await expect(dialog).toBeHidden();

  // Base URL landed in the config form (value property, not attribute).
  const baseUrl = page.getByRole('textbox', { name: /base url/i });
  await expect(
    baseUrl,
    'baseUrl input must be populated from the cURL command'
  ).toHaveValue('https://api.example.com/v1/users', { timeout: 10_000 });

  // Parameters and headers land under Advanced Options, mapped to the
  // importing verb (GET).
  await page.getByRole('button', { name: /advanced options/i }).click();
  await expect(
    page.getByRole('row', { name: /^limit 10 .*GET/ }).first()
  ).toBeVisible();
  await expect(
    page.getByRole('row', { name: /^Authorization Bearer TOKEN123/ }).first()
  ).toBeVisible();
});

test('scheduler create shows run-as fields', async ({ page }) => {
  await loginAsAdmin(page);
  await waitForAppReady(page);
  await page.goto('/dreamfactory/dist/#/system-settings/scheduler/create');
  await expect(
    page.getByText(/run as app/i).first(),
    'scheduler run-as app field must render'
  ).toBeVisible({ timeout: 15_000 });
});

test('AI chat renders', async ({ page }) => {
  await loginAsAdmin(page);
  await waitForAppReady(page);
  await page.goto('/dreamfactory/dist/#/ai/chat');
  await expect(
    page.locator('df-ai-chat, textarea, input[type="text"]').first(),
    'AI chat surface must render'
  ).toBeVisible({ timeout: 15_000 });
});
