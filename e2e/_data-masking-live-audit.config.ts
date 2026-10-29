/**
 * Runs only the Data Masking + Compliance live audit (real df-masking
 * backend, no page.route mocks): every tab is compared with the system
 * API, and the real-backend screenshots are saved.
 *
 *   # ng serve proxied to a GOLD instance with df-masking installed
 *   PLAYWRIGHT_BASE_URL=http://127.0.0.1:4301 \
 *   DM_LIVE_SCREENS_DIR=/path/to/screens/live \
 *     npx playwright test -c e2e/_data-masking-live-audit.config.ts
 *
 * Optional: DM_OSS_BASE_URL (an admin UI proxied to an open-source
 * DreamFactory) runs the paywall check; DM_OSS_EMAIL / DM_OSS_PASSWORD
 * sign in there.
 */
import { defineConfig } from '@playwright/test';
import base from '../playwright.config';

export default defineConfig({
  ...base,
  testDir: '.',
  testIgnore: [],
  testMatch: ['_data-masking-live-audit.spec.ts'],
  // A never-scanned instance scans every covered database first.
  timeout: 20 * 60_000,
  expect: { timeout: 20_000 },
  retries: 0,
  workers: 1,
});
