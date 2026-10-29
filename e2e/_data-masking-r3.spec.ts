/**
 * Data Masking round-3 flows against the contract mock (exploratory: the
 * leading underscore keeps it out of CI). Each test drives one fix and saves
 * a screenshot of the screen it changed. Reads that are not Data Masking or
 * Compliance (login, services, schemas) go to the live backend; no test
 * writes to it.
 *
 *   DM_SPEC=_data-masking-r3.spec.ts PLAYWRIGHT_BASE_URL=http://127.0.0.1:4321 \
 *   DF_ADMIN_EMAIL=... DF_ADMIN_PASSWORD=... DM_SCREENS_DIR=... \
 *     npx playwright test -c e2e/_data-masking-screens.config.ts
 */
import { Page, expect, test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loginAsAdmin } from './fixtures/admin-login';
import {
  DataMaskingMockOptions,
  installDataExplorerMaskingMock,
  installDataMaskingMock,
} from './fixtures/data-masking-mock';

const OUT = process.env['DM_SCREENS_DIR'] ?? 'test-results/data-masking-r3';
mkdirSync(OUT, { recursive: true });
const BASE = '/dreamfactory/dist/#';
const PAGE = `${BASE}/api-security/data-masking`;
type Theme = 'light' | 'dark';

test.describe.configure({ mode: 'default' });
test.setTimeout(120_000);

async function boot(
  page: Page,
  opts: DataMaskingMockOptions = {},
  theme: Theme = 'light'
) {
  await page.addInitScript(t => {
    localStorage.setItem('isDarkMode', JSON.stringify(t === 'dark'));
    localStorage.setItem('isPhosphor', 'false');
  }, theme);
  const state = await installDataMaskingMock(page, opts);
  await loginAsAdmin(page);
  return state;
}

async function open(page: Page, tab = '') {
  await page.goto(`${PAGE}${tab ? `?tab=${tab}` : ''}`);
  await expect(
    page
      .locator(
        '[data-testid="dm-mode"], [data-testid="dm-no-scan"], [data-testid="dm-no-databases"]'
      )
      .first()
  ).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId('dm-tab-columns')).toHaveText(/\S/);
}

async function shot(page: Page, name: string, full = false) {
  await page.addStyleTag({
    content:
      '[id^="intercom"], .intercom-lightweight-app, iframe[name^="intercom"] { display: none !important; }',
  });
  await page.waitForTimeout(400);
  await page.screenshot({
    path: join(OUT, `${name}.png`),
    caret: 'hide',
    fullPage: full,
  });
}

const log: Record<string, unknown> = {};
test.afterAll(() =>
  writeFileSync(join(OUT, 'r3-checks.json'), JSON.stringify(log, null, 2))
);

test('data explorer: masked filter matches no rows; masked sort ignored (decision 20)', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const state = await boot(page, { mode: 'on' });
  await installDataExplorerMaskingMock(page, state);
  await page.goto(`${BASE}/api-connections/data-explorer?service=crm`);
  await page
    .getByText('CustomerContacts', { exact: true })
    .first()
    .click({ timeout: 60_000 });
  await expect(page.getByTestId('de-masked')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId('de-masking-dropped')).toHaveCount(0);

  // Filter on a masked column: no rows, and the note says why.
  const reads: string[] = [];
  page.on('request', r => {
    if (r.url().includes('/crm/_table/CustomerContacts')) reads.push(r.url());
  });
  const filterInput = page.locator('th.mat-column-filter_EMail .filter-input');
  await filterInput.fill('example');
  const note = page.getByTestId('de-masking-dropped');
  await expect(note).toHaveText(/Masked columns can't be filtered: EMail/, {
    timeout: 15_000,
  });
  await expect(page.locator('.footer-info').first()).toContainText('0 records');
  await expect(page.locator('.footer-info').first()).toContainText(
    '(filtered)'
  );
  const box = await note.boundingBox();
  log['de-filter'] = {
    note: (await note.innerText()).trim(),
    height: box?.height,
    footer: (await page.locator('.footer-info').first().innerText()).trim(),
  };
  await shot(page, 'r3-de-filter-masked');

  // Sort by a masked column: rows come back, the sort is ignored.
  await filterInput.fill('');
  await expect(note).toHaveCount(0, { timeout: 15_000 });
  await page.locator('th.mat-column-LastName').first().click();
  await expect(note).toHaveText(/Sort ignored on masked columns: LastName/, {
    timeout: 15_000,
  });
  log['de-sort'] = { note: (await note.innerText()).trim(), reads };
  await shot(page, 'r3-de-sort-masked');
});

test('palette: pii, pci, phi and mask open with Data Masking', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await boot(page);
  await page.goto(`${BASE}/home`);
  await page.waitForTimeout(1500);
  const found: Record<string, string[]> = {};
  for (const q of ['pii', 'pci', 'phi', 'mask']) {
    await page.keyboard.press('Control+k');
    const input = page.locator('.palette-search__input');
    await expect(input).toBeVisible();
    await input.fill(q);
    await page.waitForTimeout(300);
    const first = page.locator('.palette-option').first();
    await expect(first.locator('.palette-option__label')).toHaveText(
      'Data Masking'
    );
    await expect(first).toHaveClass(/active/);
    found[q] = await page
      .locator('.palette-group__label, .palette-option__label')
      .allInnerTexts();
    if (q === 'pii') await shot(page, 'r3-palette-pii');
    await page.keyboard.press('Escape');
  }
  log['palette'] = found;
});

test('access: a stale write says the page shows the latest', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const state = await boot(page);
  await open(page, 'access');
  await expect(page.getByTestId('dm-access')).toBeVisible();
  // Someone else changes access (the CLI revokes every grant).
  state.access.admins.grants = [];
  state.accessVersion++;
  await page.getByTestId('dm-role-3').locator('button').click();
  const toast = page.locator('mat-snack-bar-container').last();
  await expect(toast).toContainText(
    'Access settings changed elsewhere. Showing the latest.'
  );
  await expect(toast).not.toContainText('Reload');
  await expect(
    page.getByTestId('dm-admin-1').locator('input')
  ).not.toBeChecked();
  log['stale'] = (await toast.innerText()).trim();
  await shot(page, 'r3-access-stale');
});

test('access: duration options fit on one line next to "Exceeds HIPAA"', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await boot(page);
  await page.route('**/api/v2/system/security_baseline', route =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        resource: [{ id: 'hipaa', name: 'HIPAA', adopted: true }],
      }),
    })
  );
  await open(page, 'access');
  await page.locator('.admin.is-granted mat-select').first().click();
  await expect(page.getByTestId('dm-duration-exceeds').first()).toHaveText(
    'Exceeds HIPAA'
  );
  // Every option is one text line tall.
  const lines = await page.locator('mat-option').evaluateAll(opts =>
    opts.map(o => {
      const text = o.querySelector(
        '.mdc-list-item__primary-text'
      ) as HTMLElement;
      const lh = parseFloat(getComputedStyle(text).lineHeight) || 20;
      return {
        text: text.innerText.replace(/\s+/g, ' ').trim(),
        lines: Math.round(text.getBoundingClientRect().height / lh),
      };
    })
  );
  log['durations'] = lines;
  expect(lines.length).toBe(5);
  for (const l of lines) expect(l.lines, l.text).toBe(1);
  await shot(page, 'r3-access-durations-hipaa');
  await page.keyboard.press('Escape');

  // Phone: the wider list still fits the screen.
  await page.setViewportSize({ width: 375, height: 800 });
  await page.waitForTimeout(400);
  await page.locator('.admin.is-granted mat-select').first().click();
  await expect(page.getByTestId('dm-duration-exceeds').first()).toBeVisible();
  const panel = await page.locator('.mat-mdc-select-panel').evaluate(p => {
    const r = p.getBoundingClientRect();
    return { left: r.left, right: r.right, vw: window.innerWidth };
  });
  log['durations375'] = panel;
  expect(panel.left).toBeGreaterThanOrEqual(0);
  expect(panel.right).toBeLessThanOrEqual(panel.vw);
  await shot(page, 'r3-access-durations-375');
  await page.keyboard.press('Escape');
});

test('columns: a computed field with no class is masked as Redact', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await boot(page, { computed: true });
  await open(page);
  await page.getByTestId('dm-filter-all').click();
  await page.getByPlaceholder('Search tables and columns').fill('contact_line');
  const row = page.getByTestId('dm-row').filter({ hasText: 'contact_line' });
  await expect(row).toBeVisible();
  await expect(row.locator('.c-value')).toHaveText('Redact');
  await expect(row.getByTestId('dm-class-chip')).toContainText(
    'Choose a class'
  );
  await row.getByTestId('dm-expand').click();
  await expect(page.locator('df-evidence-ledger')).toContainText(
    'Built from an expression that could not be checked'
  );
  log['computed'] = (await row.innerText()).replace(/\s+/g, ' ').trim();
  await shot(page, 'r3-columns-computed-redact');
});

test('a 403 on any write: the server says why, the screen stays as it was', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const message =
    'Only a system administrator can change Data Masking settings.';
  const state = await boot(page, { mode: 'preview', forbidWrites: message });
  const toast = page.locator('mat-snack-bar-container').last();
  const out: Record<string, unknown> = {};

  // Mode.
  await open(page);
  await page.getByTestId('dm-mode-off').click();
  await expect(toast).toContainText(message);
  await expect(
    page.getByTestId('dm-mode').locator('.mat-button-toggle-checked')
  ).toHaveText('Preview');
  out['mode'] = state.mode;
  await shot(page, 'r3-forbidden-mode');

  // A column decision.
  await page.getByTestId('dm-filter-review').click();
  const firstRow = page.getByTestId('dm-row').first();
  const name = (await firstRow.locator('.c-name').innerText()).trim();
  const reviewBefore = state.columns.filter(c => c.verdict === 'review').length;
  await firstRow.getByTestId('dm-clear').click();
  await expect(toast).toContainText(message);
  await expect(
    page.getByTestId('dm-row').filter({ hasText: name }).first()
  ).toHaveClass(/is-review/);
  out['review'] = [
    reviewBefore,
    state.columns.filter(c => c.verdict === 'review').length,
  ];

  // Add a rule: the dialog stays open, nothing in place, the toast says why.
  await open(page, 'detection');
  await page.getByRole('button', { name: 'Add rule' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.locator('input').first().fill('^emp_ssn$');
  await dialog.getByRole('combobox').click();
  await page.getByRole('option', { name: 'National ID' }).click();
  await dialog
    .getByRole('button', { name: /save|add/i })
    .last()
    .click();
  await expect(toast).toContainText(message);
  await expect(dialog).toBeVisible();
  await expect(dialog).not.toContainText(message);
  await shot(page, 'r3-forbidden-rule');
  await page.keyboard.press('Escape');
  out['rules'] = state.rules.length;

  // Compliance Apply.
  const cmsg = 'Only a system administrator can change Compliance baselines.';
  await page.goto(`${BASE}/api-security/compliance`);
  await page
    .getByRole('button', { name: /^Apply/ })
    .first()
    .click({ timeout: 60_000 });
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /^Apply/ })
    .click();
  await expect(toast).toContainText(cmsg);
  out['compliance'] = (await toast.innerText()).trim();
  await shot(page, 'r3-forbidden-compliance-apply');
  log['forbidden'] = out;
});

test('GOLD without the package: the standard paywall, like every commercial feature', async ({
  page,
}) => {
  // Paywall hits the shared component reports (the mock answers them).
  const hits: string[] = [];
  page.on('request', req => {
    if (
      req.method() === 'POST' &&
      req.url().startsWith('https://updates.dreamfactory.com/api/paywall')
    ) {
      hits.push(String(req.postDataJSON()?.service_name));
    }
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  // GOLD license, no data_masking / security_baseline system resources.
  await boot(page, { license: 'GOLD', installed: false });
  const out: Record<string, unknown> = {};

  for (const [path, name] of [
    ['data-masking', 'Data Masking'],
    ['compliance', 'Compliance'],
  ] as const) {
    await page.goto(`${BASE}/api-security/${path}`);
    const paywall = page.locator('df-paywall');
    await expect(paywall).toContainText('commercial', { timeout: 60_000 });
    await expect(page.getByTestId('feature-install')).toHaveCount(0);
    await expect(page.locator('.dm, .cp')).toHaveCount(0);
    await expect.poll(() => hits.includes(name)).toBe(true);
    out[path] = (await paywall.locator('h2').first().innerText()).trim();
    await shot(page, `r3-paywall-gold-${path}`);
  }

  // The Security overview card reads like the other paywalled cards: no
  // status line.
  await page.goto(`${BASE}/api-security`);
  const card = page.locator('a.section-card[aria-label="Data Masking"]');
  await expect(card).toBeVisible({ timeout: 60_000 });
  await page.waitForTimeout(800);
  await expect(card.locator('.section-card__meta')).toHaveCount(0);
  await expect(page.getByText('Not installed')).toHaveCount(0);
  await shot(page, 'r3-paywall-gold-security');

  // Phone width: the same paywall, nothing scrolls sideways.
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto(`${BASE}/api-security/data-masking`);
  await expect(page.locator('df-paywall')).toContainText('commercial', {
    timeout: 60_000,
  });
  const m = await page.evaluate(() => ({
    doc: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }));
  expect(m.doc).toBeLessThanOrEqual(m.viewport);
  await shot(page, 'r3-paywall-gold-375');
  out['hits'] = hits;
  log['goldWithoutPackage'] = out;
});
