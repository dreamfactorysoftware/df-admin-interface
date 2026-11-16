/**
 * Data Masking round-4 flow against the contract mock (exploratory: the
 * leading underscore keeps it out of CI): the server cannot read its scan
 * history (overview `scan.unknown`, /table `scan_unknown`), so the screen
 * says so instead of looking never-scanned, and offers no first scan.
 * Login goes to the live backend; no test writes to it.
 *
 *   DM_SPEC=_data-masking-r4.spec.ts PLAYWRIGHT_BASE_URL=http://127.0.0.1:4321 \
 *   DF_ADMIN_EMAIL=... DF_ADMIN_PASSWORD=... DM_SCREENS_DIR=... \
 *     npx playwright test -c e2e/_data-masking-screens.config.ts
 */
import { Page, expect, test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loginAsAdmin } from './fixtures/admin-login';
import {
  DataMaskingMockOptions,
  installDataMaskingMock,
} from './fixtures/data-masking-mock';

const OUT = process.env['DM_SCREENS_DIR'] ?? 'test-results/data-masking-r4';
mkdirSync(OUT, { recursive: true });
const PAGE = '/dreamfactory/dist/#/api-security/data-masking';
const LINE = "Couldn't read the scan history. Check the DreamFactory log.";
type Theme = 'light' | 'dark';

test.describe.configure({ mode: 'default' });
test.setTimeout(120_000);

async function boot(
  page: Page,
  opts: DataMaskingMockOptions,
  theme: Theme = 'light'
) {
  await page.addInitScript(t => {
    localStorage.setItem('isDarkMode', JSON.stringify(t === 'dark'));
    localStorage.setItem('isPhosphor', 'false');
  }, theme);
  await installDataMaskingMock(page, opts);
  await loginAsAdmin(page);
  await page.goto(PAGE);
  await expect(page.getByTestId('dm-tab-columns')).toHaveText(/\S/, {
    timeout: 60_000,
  });
}

async function shot(page: Page, name: string) {
  await page.addStyleTag({
    content:
      '[id^="intercom"], .intercom-lightweight-app, iframe[name^="intercom"] { display: none !important; }',
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(OUT, `${name}.png`), caret: 'hide' });
}

const log: Record<string, unknown> = {};
test.afterAll(() =>
  writeFileSync(join(OUT, 'r4-checks.json'), JSON.stringify(log, null, 2))
);

for (const [w, theme] of [
  [1440, 'light'],
  [375, 'dark'],
] as const) {
  test(`unreadable scan history, nothing classified: one line, no first scan (${w} ${theme})`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: w, height: 900 });
    await boot(page, { scenario: 'unscanned', scanUnknown: true }, theme);
    const line = page.getByTestId('dm-scan-unknown');
    await expect(line).toContainText(LINE, { timeout: 30_000 });
    await expect(page.getByTestId('dm-no-scan')).toHaveCount(0);
    await expect(page.getByTestId('dm-first-scan')).toHaveCount(0);
    await expect(page.getByText('No scan yet')).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: /scan databases|scan now/i })
    ).toHaveCount(0);
    // The baseline shortcuts stay.
    await expect(page.getByTestId('dm-first-run-baselines')).toBeVisible();
    log[`first-run-${w}`] = {
      line: (await line.innerText()).trim(),
      buttons: await page
        .locator('.dm-panel button')
        .evaluateAll(b => b.map(x => x.textContent?.trim())),
    };
    await shot(page, `r4-scan-unknown-first-run-${w}-${theme}`);
  });
}

test('unreadable scan history with classified columns: results stay, no "Not scanned yet"', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await boot(page, { scanUnknown: true, pending: true });
  await expect(page.getByTestId('dm-search')).toBeVisible({ timeout: 30_000 });
  const line = page.getByTestId('dm-scan-unknown');
  await expect(line).toContainText(LINE);
  await expect(page.getByTestId('dm-rail-unscanned')).toHaveCount(0);
  await expect(page.getByText('Not scanned yet')).toHaveCount(0);
  log['results'] = {
    line: (await line.innerText()).trim(),
    railGroups: await page
      .locator('nav.rail > *')
      .evaluateAll(els => els.map(e => e.getAttribute('data-testid'))),
  };
  await shot(page, 'r4-scan-unknown-results-1440-light');
  // Other tabs keep working.
  await page.getByTestId('dm-tab-access').click();
  await expect(page.getByTestId('dm-tab-access')).toHaveClass(/active/);
});
