/**
 * Runs only the Data Masking screenshot spec. The main config ignores `_*`
 * specs (they never gate CI), so this one opts that single file back in.
 *
 *   npx playwright test -c e2e/_data-masking-screens.config.ts
 */
import { defineConfig } from '@playwright/test';
import base from '../playwright.config';

export default defineConfig({
  ...base,
  testDir: '.',
  testIgnore: [],
  testMatch: [process.env['DM_SPEC'] ?? '_data-masking-screens.spec.ts'],
  timeout: 180_000,
});
