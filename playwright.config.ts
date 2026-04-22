import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E config.
 *
 * Runs against a live DreamFactory admin instance. Defaults to the local
 * dev docker at http://localhost:8080 (served from df-docker-dev), but
 * any URL can be passed via PLAYWRIGHT_BASE_URL — for example the
 * crucible.home.nicdavidson.net box or a CI-spun ephemeral instance.
 *
 * Admin credentials default to the dev-docker defaults. In CI override
 * via DF_ADMIN_EMAIL / DF_ADMIN_PASSWORD.
 */
export default defineConfig({
  testDir: './e2e',
  // Files prefixed with `_` are exploratory / discovery runs — not gated
  // on CI. Run them explicitly with `npx playwright test e2e/_findings.spec.ts`.
  testIgnore: ['**/_*.spec.ts'],
  fullyParallel: false, // DF sessions are stateful; run serial to avoid flakes
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['html'], ['github']] : 'list',
  timeout: 30_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:8080',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: process.env.CI ? 'retain-on-failure' : 'off',
    ignoreHTTPSErrors: true,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
