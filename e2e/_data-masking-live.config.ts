/**
 * Runs only the Data Masking live journey (real df-masking backend, no
 * page.route mocks). The main config ignores `_*` specs, so this one opts
 * that single file back in.
 *
 *   # ng serve proxied to a GOLD instance with df-masking installed
 *   PLAYWRIGHT_BASE_URL=http://127.0.0.1:4300 \
 *   DF_ADMIN_EMAIL=<admin email> DF_ADMIN_PASSWORD=<admin password> \
 *     npx playwright test -c e2e/_data-masking-live.config.ts
 *
 * Optional: DM_LIVE_BASELINE (default gdpr) picks the baseline to apply;
 * DM_LIVE_EVIDENCE_DIR saves screenshots and the downloaded reports.
 */
import { defineConfig } from '@playwright/test';
import base from '../playwright.config';

export default defineConfig({
  ...base,
  testDir: '.',
  testIgnore: [],
  testMatch: ['_data-masking-live.spec.ts'],
  // The first scan of every covered database can take minutes.
  timeout: 30 * 60_000,
  expect: { timeout: 20_000 },
  retries: 0,
  workers: 1,
});
