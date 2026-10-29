/**
 * Data Masking and Compliance screenshots (exploratory: the leading
 * underscore keeps it out of CI). Logs in against a live DreamFactory
 * (any license), mocks /system/data_masking and /system/security_baseline
 * per the df-masking contract with real classifier output, and saves PNGs.
 * The real-backend journey lives in _data-masking-live.spec.ts.
 *
 *   PLAYWRIGHT_BASE_URL=http://127.0.0.1:4300 \
 *   DF_ADMIN_EMAIL=admin@dmui.local DF_ADMIN_PASSWORD=... \
 *   DM_SCREENS_DIR=/path/to/screens/round1 \
 *     npx playwright test e2e/_data-masking-screens.spec.ts
 */
import { Page, expect, test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loginAsAdmin } from './fixtures/admin-login';
import {
  DataMaskingMockOptions,
  installDataMaskingMock,
} from './fixtures/data-masking-mock';

const OUT =
  process.env['DM_SCREENS_DIR'] ?? 'test-results/data-masking-screens';
mkdirSync(OUT, { recursive: true });

const PAGE = '/dreamfactory/dist/#/api-security/data-masking';
type Theme = 'light' | 'dark' | 'phosphor';

test.describe.configure({ mode: 'default' });
test.setTimeout(180_000);

async function boot(
  page: Page,
  theme: Theme,
  opts: DataMaskingMockOptions = {}
) {
  await page.addInitScript(t => {
    localStorage.setItem('isDarkMode', JSON.stringify(t !== 'light'));
    localStorage.setItem('isPhosphor', JSON.stringify(t === 'phosphor'));
  }, theme);
  await installDataMaskingMock(page, opts);
  await loginAsAdmin(page);
}

async function shot(page: Page, name: string, full = false) {
  // Let motion and toasts settle; hide the caret so shots are stable.
  await page.waitForTimeout(450);
  await page.screenshot({
    path: join(OUT, `${name}.png`),
    fullPage: full,
    caret: 'hide',
  });
}

async function open(page: Page, tab = '') {
  await page.goto(`${PAGE}${tab ? `?tab=${tab}` : ''}`);
  // The mode control waits for the first scan; first run leads with its
  // call to action instead.
  await expect(
    page
      .locator(
        '[data-testid="dm-mode"], [data-testid="dm-no-scan"], [data-testid="dm-no-databases"]'
      )
      .first()
  ).toBeVisible({ timeout: 60_000 });
  // The dataMasking i18n scope loads lazily with the route.
  await expect(page.getByTestId('dm-tab-columns')).toHaveText(/\S/, {
    timeout: 20_000,
  });
}

async function dismissToasts(page: Page) {
  await page
    .locator('mat-snack-bar-container')
    .evaluateAll(els =>
      els.forEach(e => ((e as HTMLElement).style.display = 'none'))
    );
}

for (const theme of ['light', 'dark'] as Theme[]) {
  test(`data masking tour (${theme})`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await boot(page, theme);

    await page.goto('/dreamfactory/dist/#/api-security');
    await expect(page.getByText('Manage data masking')).toBeVisible({
      timeout: 30_000,
    });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1200);
    await shot(page, `security-overview-${theme}`);

    // Columns: review queue first.
    await open(page);
    await expect(page.getByTestId('dm-row').first()).toBeVisible();
    await shot(page, `columns-review-${theme}`);

    // Evidence ledger on a strong, multi-line verdict.
    await page.getByTestId('dm-filter-masked').click();
    await page
      .getByTestId('dm-rail-row')
      .filter({ hasText: 'hr_staff' })
      .click();
    const row = page.getByTestId('dm-row').filter({ hasText: 'ni_number' });
    await row.getByTestId('dm-expand').click();
    const row2 = page.getByTestId('dm-row').filter({ hasText: 'full_name' });
    await row2.getByTestId('dm-expand').click();
    await shot(page, `columns-expanded-ledger-${theme}`);

    // Class picker menu.
    await page
      .getByTestId('dm-row')
      .filter({ hasText: 'work_email' })
      .getByTestId('dm-class-chip')
      .click();
    await expect(page.locator('.dm-class-menu')).toBeVisible();
    await shot(page, `columns-class-menu-${theme}`);
    await page.keyboard.press('Escape');

    // Review flow: decide every column in the first review table.
    await page.getByTestId('dm-filter-review').click();
    await page
      .getByTestId('dm-rail-row')
      .filter({ hasText: 'facilities' })
      .click();
    const keeps = page.getByTestId('dm-keep');
    await keeps.first().click();
    await page.getByTestId('dm-clear').first().click();
    await shot(page, `columns-review-decided-${theme}`);
    while ((await page.getByTestId('dm-keep').count()) > 0) {
      await page.getByTestId('dm-keep').first().click();
    }
    await expect(page.getByTestId('dm-next-table')).toBeVisible();
    await dismissToasts(page);
    await shot(page, `columns-next-table-${theme}`);

    // Access.
    await page.getByTestId('dm-tab-access').click();
    await expect(page.getByTestId('dm-access')).toBeVisible();
    await page.getByTestId('dm-admin-2').locator('input').check();
    await page.getByTestId('dm-role-4').locator('button').click();
    await page.waitForTimeout(300);
    await dismissToasts(page);
    await shot(page, `access-${theme}`);

    // Masks: switch email to first letter so the example re-renders.
    await page.getByTestId('dm-tab-masks').click();
    await expect(page.getByTestId('dm-masks')).toBeVisible();
    await page.getByTestId('dm-format-email').click();
    await page.getByRole('option', { name: 'First letter' }).click();
    await dismissToasts(page);
    await shot(page, `masks-${theme}`);

    // Detection + add rule dialog with a live preview.
    await page.getByTestId('dm-tab-detection').click();
    await expect(page.getByTestId('dm-detection')).toBeVisible();
    await page.getByTestId('dm-builtin').click();
    await shot(page, `detection-${theme}`);
    await page.getByTestId('dm-builtin').click();
    await page.getByTestId('dm-add-rule').click();
    await page
      .getByTestId('dm-rule-pattern')
      .fill('(^|_)(lat|lng|latitude|longitude)$');
    await page.getByTestId('dm-rule-class').click();
    await page.getByRole('option', { name: 'Precise location' }).click();
    await expect(page.getByTestId('dm-rule-preview')).toContainText('Matches');
    await page.waitForTimeout(500);
    await shot(page, `detection-add-rule-dialog-${theme}`);
    await page.getByTestId('dm-rule-save').click();
    await dismissToasts(page);

    // Activity.
    await page.getByTestId('dm-tab-activity').click();
    await expect(page.getByTestId('dm-activity')).toBeVisible();
    await page.waitForTimeout(300);
    await shot(page, `activity-${theme}`);

    // Mode: On asks first, with the real numbers.
    await page.getByTestId('dm-mode-on').click();
    await expect(page.getByTestId('dm-confirm-ok')).toBeVisible();
    await shot(page, `mode-on-confirm-${theme}`);
    await page.getByTestId('dm-confirm-ok').click();
    await page.getByTestId('dm-tab-columns').click();
    await page.waitForTimeout(400);
    await shot(page, `mode-on-toast-${theme}`);

    // Off asks too; the toggle keeps showing On until it is confirmed.
    await dismissToasts(page);
    await page.getByTestId('dm-mode-off').click();
    await expect(page.getByTestId('dm-confirm-cancel')).toBeVisible();
    await shot(page, `mode-off-confirm-${theme}`);
    await page.getByTestId('dm-confirm-cancel').click();
  });
}

test('scan progress and wide-table strips', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await boot(page, 'light');
  await open(page);
  await page.getByTestId('dm-scan').click();
  await expect(page.getByTestId('dm-scan')).toHaveText(/Scanning [1-9]/, {
    timeout: 20_000,
  });
  await page.screenshot({ path: join(OUT, 'scanning-light.png') });
  await expect(page.getByTestId('dm-scan')).toHaveText(/Scan now/, {
    timeout: 30_000,
  });
  await dismissToasts(page);
  await page.getByTestId('dm-filter-all').click();
  await page.getByTestId('dm-search').fill('american_football');
  await page.waitForTimeout(300);
  await page.getByTestId('dm-rail-row').first().hover();
  await page.locator('df-sensitivity-strip .strip').first().hover();
  await page.waitForTimeout(900);
  await shot(page, 'strips-wide-tooltip-light');
  await page.getByTestId('dm-search').fill('');
  await page.getByTestId('dm-filter-masked').click();
  await page.waitForTimeout(300);
  await shot(page, 'columns-masked-light');
});

test('phosphor masks and strips', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await boot(page, 'phosphor');
  await open(page, 'masks');
  await expect(page.getByTestId('dm-masks')).toBeVisible();
  await shot(page, 'masks-phosphor');
  await page.getByTestId('dm-tab-columns').click();
  await page.getByTestId('dm-filter-all').click();
  await shot(page, 'columns-all-phosphor');
});

test('narrow 1024 dark access and masked', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await boot(page, 'dark');
  await open(page);
  await page.getByTestId('dm-filter-masked').click();
  await shot(page, 'columns-1024-masked-dark');
  await page.getByTestId('dm-tab-access').click();
  await expect(page.getByTestId('dm-access')).toBeVisible();
  await page.getByTestId('dm-admin-mode').getByText('Selected').click();
  await page.waitForTimeout(400);
  await dismissToasts(page);
  await shot(page, 'access-1024-dark');
});

test('phosphor columns', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await boot(page, 'phosphor');
  await open(page);
  await page.getByTestId('dm-filter-masked').click();
  await page.getByTestId('dm-rail-row').filter({ hasText: 'hr_staff' }).click();
  await page
    .getByTestId('dm-row')
    .filter({ hasText: 'ni_number' })
    .getByTestId('dm-expand')
    .click();
  await shot(page, 'columns-phosphor');
});

test('mobile columns', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await boot(page, 'light');
  await open(page);
  await expect(page.getByTestId('dm-row').first()).toBeVisible();
  await shot(page, 'columns-mobile-light');
});

test('narrow 1024 columns', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await boot(page, 'light');
  await open(page);
  await expect(page.getByTestId('dm-row').first()).toBeVisible();
  await shot(page, 'columns-1024-light');
});

test('states: never scanned, all reviewed, no grant rights', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await boot(page, 'light', { scenario: 'unscanned' });
  await open(page);
  await expect(page.getByTestId('dm-no-scan')).toBeVisible();
  await shot(page, 'columns-no-scan-light');
  // Nothing classified yet and masking off: the page leads with the scan.
  await expect(page.getByTestId('dm-mode')).toHaveCount(0);
});

test('state: all reviewed', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await boot(page, 'light', { scenario: 'reviewed' });
  await open(page);
  // Nothing left to review: no To review chip (the header hides it too),
  // and the page opens on Masked.
  await expect(page.getByTestId('dm-filter-review')).toHaveCount(0);
  await expect(page.getByTestId('dm-count-review')).toHaveCount(0);
  await expect(page.getByTestId('dm-filter-masked')).toHaveClass(/is-on/);
  await shot(page, 'columns-all-reviewed-light');
});

test('state: no grant rights', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await boot(page, 'light', { scenario: 'nogrant' });
  await open(page, 'access');
  await expect(page.getByTestId('dm-access-lock')).toBeVisible();
  await shot(page, 'access-locked-light');
});

test('paywall on open source', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await boot(page, 'light', { license: 'OPEN SOURCE' });
  await page.goto(PAGE);
  await expect(page.locator('df-paywall')).toContainText('commercial', {
    timeout: 20_000,
  });
  await shot(page, 'paywall-opensource');
});

/*
 * Final product-owner set: numbered, clean full-viewport captures.
 *   DM_SCREENS_DIR=.../screens/final npx playwright test \
 *     -c e2e/_data-masking-screens.config.ts -g "final set"
 * Each test also writes <name>.console.json with console errors and any
 * raw transloco keys found in the visible text.
 */
const RAW_KEY =
  /\b(dataMasking|common|nav|apiSecurity|security)\.[a-zA-Z][\w.]+/g;

function watchConsole(page: Page) {
  const errors: string[] = [];
  page.on('console', m => {
    if (m.type() === 'error') errors.push(m.text().slice(0, 400));
  });
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  page.on('response', r => {
    if (r.status() >= 400)
      errors.push(`http ${r.status()} ${r.request().method()} ${r.url()}`);
  });
  return errors;
}

async function finalShot(page: Page, name: string, errors: string[]) {
  // Hide the third-party Intercom launcher; it is not part of the feature.
  await page.addStyleTag({
    content:
      '[id^="intercom"], .intercom-lightweight-app, iframe[name^="intercom"] { display: none !important; }',
  });
  await page.mouse.move(2, 890);
  await page.waitForTimeout(600);
  const text = await page.evaluate(() => document.body.innerText);
  const keys = Array.from(new Set(text.match(RAW_KEY) ?? []));
  writeFileSync(
    join(OUT, `${name}.console.json`),
    JSON.stringify({ errors: [...errors], rawKeys: keys }, null, 2)
  );
  await page.screenshot({ path: join(OUT, `${name}.png`), caret: 'hide' });
}

test('final set (light)', async ({ page }) => {
  const errors = watchConsole(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await boot(page, 'light');

  // Reach the overview in-app once the root translations have loaded: a cold
  // deep link renders its actions/notes as raw keys (see report).
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('link', { name: 'Home' }).first()).toBeVisible({
    timeout: 60_000,
  });
  await page.waitForTimeout(1500);
  await page.evaluate(() => (window.location.hash = '#/api-security'));
  await expect(page.getByText('Manage data masking')).toBeVisible({
    timeout: 60_000,
  });
  await expect(page.getByText(/provider types available/i)).toBeVisible({
    timeout: 60_000,
  });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1200);
  const overlays = await page.evaluate(() =>
    Array.from(
      document.querySelectorAll(
        '.cdk-overlay-backdrop, .mat-drawer-backdrop.mat-drawer-shown, .cdk-overlay-pane'
      )
    ).map(
      e => `${e.className} :: ${(e as HTMLElement).innerText?.slice(0, 120)}`
    )
  );
  errors.push(...overlays.map(o => `overlay: ${o}`));
  await finalShot(page, '01-security-overview', errors);

  await open(page);
  await expect(page.getByTestId('dm-row').first()).toBeVisible();
  await expect(page.getByTestId('dm-filter-review')).toBeVisible();
  await finalShot(page, '02-columns-review-light', errors);

  await page.getByTestId('dm-filter-masked').click();
  await page.getByTestId('dm-rail-row').filter({ hasText: 'hr_staff' }).click();
  await page
    .getByTestId('dm-row')
    .filter({ hasText: 'ni_number' })
    .getByTestId('dm-expand')
    .click();
  await page
    .getByTestId('dm-row')
    .filter({ hasText: 'full_name' })
    .getByTestId('dm-expand')
    .click();
  await finalShot(page, '03-columns-ledger-expanded-light', errors);

  // Collapse the ledgers so the menu has the table behind it.
  for (const c of ['ni_number', 'full_name']) {
    await page
      .getByTestId('dm-row')
      .filter({ hasText: c })
      .getByTestId('dm-expand')
      .click();
  }
  await page
    .getByTestId('dm-row')
    .filter({ hasText: 'work_email' })
    .getByTestId('dm-class-chip')
    .click();
  await expect(page.locator('.dm-class-menu')).toBeVisible();
  await page.waitForTimeout(400);
  await page.screenshot({
    path: join(OUT, '05-class-picker-open.png'),
    caret: 'hide',
  });
  await page.keyboard.press('Escape');

  await page.getByTestId('dm-tab-access').click();
  await expect(page.getByTestId('dm-access')).toBeVisible();
  await page.waitForTimeout(500);
  await dismissToasts(page);
  await finalShot(page, '07-access-light', errors);

  await page.getByTestId('dm-tab-masks').click();
  await expect(page.getByTestId('dm-masks')).toBeVisible();
  await page.waitForTimeout(500);
  await finalShot(page, '08-masks-light', errors);

  await page.getByTestId('dm-tab-detection').click();
  await expect(page.getByTestId('dm-detection')).toBeVisible();
  await page.getByTestId('dm-add-rule').click();
  await page
    .getByTestId('dm-rule-pattern')
    .fill('(^|_)(lat|lng|latitude|longitude)$');
  await page.getByTestId('dm-rule-class').click();
  await page.getByRole('option', { name: 'Precise location' }).click();
  await expect(page.getByTestId('dm-rule-preview')).toContainText('Matches');
  await page.waitForTimeout(600);
  await finalShot(page, '09-detection-add-rule', errors);
  await page.keyboard.press('Escape');

  await page.getByTestId('dm-tab-activity').click();
  await expect(page.getByTestId('dm-activity')).toBeVisible();
  await page.waitForTimeout(800);
  await finalShot(page, '10-activity-light', errors);

  await page.getByTestId('dm-tab-columns').click();
  await page.getByTestId('dm-mode-on').click();
  await expect(page.getByTestId('dm-confirm-ok')).toBeVisible();
  await page.waitForTimeout(500);
  await finalShot(page, '06-mode-on-confirm', errors);
  await page.getByTestId('dm-confirm-cancel').click();
});

test('final set (dark)', async ({ page }) => {
  const errors = watchConsole(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await boot(page, 'dark');
  await open(page);
  await page.getByTestId('dm-filter-masked').click();
  await expect(page.getByTestId('dm-row').first()).toBeVisible();
  await page.waitForTimeout(400);
  await finalShot(page, '04-columns-masked-dark', errors);

  await page.getByTestId('dm-tab-access').click();
  await expect(page.getByTestId('dm-access')).toBeVisible();
  await page.waitForTimeout(500);
  await finalShot(page, '12-access-dark', errors);
});

test('final set (mobile)', async ({ page }) => {
  const errors = watchConsole(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await boot(page, 'light');
  await open(page);
  await expect(page.getByTestId('dm-row').first()).toBeVisible();
  await page.waitForTimeout(400);
  await finalShot(page, '11-columns-mobile-390', errors);
});

/*
 * Build 2 set: first run (baselines row, first-scan progress, Preview after
 * the first scan), coverage in the Columns rail, and the Compliance page,
 * in light and dark at 1440 and 390, plus phosphor / 1024 / paywall checks.
 *   DM_SCREENS_DIR=.../screens/build2 npx playwright test \
 *     -c e2e/_data-masking-screens.config.ts -g "build2"
 */
const COMPLIANCE = '/dreamfactory/dist/#/api-security/compliance';

async function openCompliance(page: Page, baseline = '') {
  await page.goto(`${COMPLIANCE}${baseline ? `?baseline=${baseline}` : ''}`);
  await expect(page.getByTestId('cp-detail')).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId('cp-controls')).toBeVisible({
    timeout: 20_000,
  });
}

async function hideChrome(page: Page) {
  await page.addStyleTag({
    content:
      '[id^="intercom"], .intercom-lightweight-app, iframe[name^="intercom"] { display: none !important; }',
  });
}

async function shot2(page: Page, name: string, full = false) {
  await hideChrome(page);
  await page.mouse.move(2, 2);
  await page.waitForTimeout(500);
  await page.screenshot({
    path: join(OUT, `${name}.png`),
    fullPage: full,
    caret: 'hide',
  });
}

test.describe('build2', () => {
  for (const theme of ['light', 'dark'] as Theme[]) {
    for (const width of [1440, 390]) {
      const size = { width, height: width === 390 ? 844 : 900 };
      const tag = `${theme}-${width}`;

      test(`build2 first run ${tag}`, async ({ page }) => {
        await page.setViewportSize(size);
        await boot(page, theme, { scenario: 'unscanned' });
        await open(page);
        await expect(page.getByTestId('dm-no-scan')).toBeVisible();
        await expect(page.getByTestId('dm-first-run-baselines')).toBeVisible();
        await expect(page.getByTestId('dm-mode')).toHaveCount(0);
        await shot2(page, `first-run-${tag}`);

        await page.getByTestId('empty-state-action').click();
        await expect(page.getByTestId('dm-first-scan')).toContainText(
          /Scanning [1-9]/,
          { timeout: 20_000 }
        );
        await shot2(page, `first-scan-progress-${tag}`);

        // The server switched Off -> Preview; the page follows, no reload.
        await expect(page.getByTestId('dm-mode-preview')).toHaveClass(
          /mat-button-toggle-checked/,
          { timeout: 30_000 }
        );
        await expect(page.getByTestId('dm-row').first()).toBeVisible();
        await expect(
          page.getByText('Scan finished. Preview is on.')
        ).toBeVisible();
        await shot2(page, `first-scan-done-preview-${tag}`);
      });

      test(`build2 columns coverage ${tag}`, async ({ page }) => {
        await page.setViewportSize(size);
        await boot(page, theme, { pending: true });
        await open(page);
        await page.getByTestId('dm-filter-masked').click();
        await expect(page.getByTestId('dm-row').first()).toBeVisible();
        if (width === 1440) {
          const uncovered = page.getByTestId('dm-rail-uncovered');
          await uncovered.scrollIntoViewIfNeeded();
          await expect(uncovered).toContainText('Event store');
          await expect(page.getByTestId('dm-rail-unscanned')).toContainText(
            'HR (SQL Server)'
          );
          await page.getByTestId('dm-rail-uncovered-row').first().hover();
          await page.waitForTimeout(900);
          await hideChrome(page);
          await page.screenshot({
            path: join(OUT, `columns-coverage-${tag}.png`),
            caret: 'hide',
          });
        } else {
          await page.locator('.table-select mat-select').click();
          const notCovered = page
            .locator('mat-optgroup')
            .filter({ hasText: 'Not covered' });
          await expect(notCovered).toBeVisible();
          await notCovered.scrollIntoViewIfNeeded();
          await page.waitForTimeout(400);
          await hideChrome(page);
          await page.screenshot({
            path: join(OUT, `columns-coverage-${tag}.png`),
            caret: 'hide',
          });
          await page.keyboard.press('Escape');
          await shot2(page, `columns-masked-${tag}`);
        }
      });

      test(`build2 compliance ${tag}`, async ({ page }) => {
        await page.setViewportSize(size);
        await boot(page, theme);
        await openCompliance(page, 'hipaa');
        await expect(page.locator('#cp-title')).toHaveText('HIPAA baseline');
        await shot2(page, `compliance-hipaa-${tag}`);
        if (width === 1440)
          await shot2(page, `compliance-hipaa-full-${tag}`, true);

        // Apply: the dialog lists exactly what will change.
        await page.getByTestId('cp-apply').click();
        await expect(page.getByTestId('cp-apply-changes')).toBeVisible();
        await shot2(page, `compliance-apply-dialog-${tag}`);
        await page.getByTestId('cp-apply-turn-on').locator('input').check();
        await page.getByTestId('cp-apply-confirm').click();
        await expect(page.getByTestId('cp-tracking')).toBeVisible();
        await expect(
          page.getByText('HIPAA baseline applied. Masking is on.')
        ).toBeVisible();
        await shot2(page, `compliance-applied-${tag}`);
        await dismissToasts(page);

        // Manual checks expand in place.
        await page.getByTestId('cp-manual-toggle').click();
        await page
          .locator('.controls.is-manual .control')
          .last()
          .scrollIntoViewIfNeeded();
        await shot2(page, `compliance-manual-${tag}`);

        // Another vertical.
        if (width === 1440) {
          await page.getByTestId('cp-rail-pci_dss').click();
        } else {
          await page.getByTestId('cp-select').click();
          await page.getByRole('option', { name: /PCI DSS/ }).click();
        }
        await expect(page.locator('#cp-title')).toHaveText('PCI DSS baseline');
        await page.waitForTimeout(300);
        await shot2(page, `compliance-pci-${tag}`);

        // Export: a real download of the evidence report.
        await page.getByTestId('cp-export').click();
        const dl = page.waitForEvent('download');
        await page.getByTestId('cp-export-csv').click();
        const file = await dl;
        expect(file.suggestedFilename()).toMatch(
          /^dreamfactory-pci_dss-baseline-\d{4}-\d{2}-\d{2}\.csv$/
        );
      });
    }
  }

  test('build2 first run with no SQL database', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await boot(page, 'light', { scenario: 'nodb' });
    await open(page);
    await expect(page.getByTestId('dm-no-databases')).toBeVisible();
    await expect(page.getByTestId('dm-first-run-baselines')).toBeVisible();
    await shot2(page, 'first-run-no-databases-light-1440');
    await page.getByTestId('empty-state-action').click();
    await expect(page).toHaveURL(/api-types\/database\/create/);
  });

  test('build2 baseline chip opens compliance on it', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await boot(page, 'light', { scenario: 'unscanned' });
    await open(page);
    await page.getByTestId('dm-baseline-pci_dss').click();
    await expect(page).toHaveURL(/compliance\?baseline=pci_dss/);
    await expect(page.locator('#cp-title')).toHaveText('PCI DSS baseline', {
      timeout: 30_000,
    });
    // Nothing scanned yet: the scan check fails and links back.
    await expect(
      page.getByTestId('cp-control-masking.scanned').getByTestId('cp-fix')
    ).toBeVisible();
    await shot2(page, 'compliance-from-first-run-light-1440');
  });

  test('build2 security overview with compliance', async ({ page }) => {
    for (const theme of ['light', 'dark'] as Theme[]) {
      await page.setViewportSize({ width: 1440, height: 900 });
      await boot(page, theme);
      await page.goto('/dreamfactory/dist/#/api-security');
      await expect(page.getByText('Manage compliance')).toBeVisible({
        timeout: 60_000,
      });
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1200);
      await shot2(page, `security-overview-${theme}-1440`);
      await page.context().clearCookies();
    }
  });

  test('build2 compliance phosphor and 1024', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await boot(page, 'phosphor');
    await openCompliance(page, 'pci_dss');
    await shot2(page, 'compliance-pci-phosphor-1440');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(400);
    await shot2(page, 'compliance-pci-phosphor-1024');
  });

  test('build2 compliance 1024 light', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await boot(page, 'light');
    await openCompliance(page, 'soc2');
    await shot2(page, 'compliance-soc2-light-1024');
  });

  test('build2 compliance paywall on open source', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await boot(page, 'light', { license: 'OPEN SOURCE' });
    await page.goto(COMPLIANCE);
    await expect(page.locator('df-paywall')).toContainText('commercial', {
      timeout: 30_000,
    });
    await shot2(page, 'compliance-paywall-opensource');
  });

  test('build2 data masking glyph bars and tokens', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await boot(page, 'light');
    await open(page);
    await page.getByTestId('dm-filter-masked').click();
    await page
      .getByTestId('dm-rail-row')
      .filter({ hasText: 'hr_staff' })
      .click();
    await page
      .getByTestId('dm-row')
      .filter({ hasText: 'ni_number' })
      .getByTestId('dm-expand')
      .click();
    // No raw glyphs on screen: every mask run is drawn as a bar.
    const text = await page.locator('df-dm-columns').innerText();
    expect(text).not.toContain('•');
    expect(await page.locator('.mv-bar').count()).toBeGreaterThan(3);
    await expect(page.locator('.mv-token').first()).toHaveText(
      /^[A-Z]+_[0-9a-f]{8}$/
    );
    await shot2(page, 'columns-masked-ledger-light-1440');
    await page.getByTestId('dm-tab-masks').click();
    await expect(page.getByTestId('dm-masks')).toBeVisible();
    await shot2(page, 'masks-light-1440');
    await page.getByTestId('dm-tab-activity').click();
    await expect(page.getByTestId('dm-activity')).toBeVisible();
    await page.waitForTimeout(500);
    await shot2(page, 'activity-light-1440');
  });
});
