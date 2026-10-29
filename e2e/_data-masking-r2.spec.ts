/**
 * Data Masking round-2 flows against the contract mock (exploratory: the
 * leading underscore keeps it out of CI). Each test drives one fix and saves
 * a screenshot of the screen it changed.
 *
 *   DM_SPEC=_data-masking-r2.spec.ts PLAYWRIGHT_BASE_URL=http://127.0.0.1:4321 \
 *   DF_ADMIN_EMAIL=... DF_ADMIN_PASSWORD=... DM_SCREENS_DIR=... \
 *     npx playwright test -c e2e/_data-masking-screens.config.ts
 */
import { Page, Request, expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { loginAsAdmin } from './fixtures/admin-login';
import {
  DataMaskingMockOptions,
  installDataMaskingMock,
} from './fixtures/data-masking-mock';

const OUT = process.env['DM_SCREENS_DIR'] ?? 'test-results/data-masking-r2';
mkdirSync(OUT, { recursive: true });
const PAGE = '/dreamfactory/dist/#/api-security/data-masking';
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

async function shot(page: Page, name: string) {
  await page.addStyleTag({
    content:
      '[id^="intercom"], .intercom-lightweight-app, iframe[name^="intercom"] { display: none !important; }',
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(OUT, `${name}.png`), caret: 'hide' });
}

const isPatch = (path: RegExp) => (r: Request) =>
  r.method() === 'PATCH' && path.test(new URL(r.url()).pathname);

test('mode: leaving On asks first; Preview to Off does not', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await boot(page, { mode: 'on' });
  await open(page);
  await page.getByTestId('dm-mode-preview').click();
  await expect(page.getByRole('dialog')).toContainText('Stop masking?');
  await shot(page, 'r2-mode-on-to-preview-confirm');
  const patch = page.waitForRequest(isPatch(/\/system\/data_masking$/));
  await page.getByTestId('dm-confirm-ok').click();
  expect((await patch).postDataJSON()).toEqual({ mode: 'preview' });
  await expect(page.getByText('Masking stopped. Preview is on.')).toBeVisible();
  // Preview to Off: nothing was masked, so no dialog.
  const off = page.waitForRequest(isPatch(/\/system\/data_masking$/));
  await page.getByTestId('dm-mode-off').click();
  expect((await off).postDataJSON()).toEqual({ mode: 'off' });
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('mode: the turn-on confirm says admins are masked and what is left', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  // Kevin has no grant here, so he is masked too.
  const state = await boot(page);
  state.access.admins.grants = [];
  await open(page);
  // Header counts are disjoint: masked, then to review.
  await expect(page.getByTestId('dm-count-masked')).toContainText('182');
  await expect(page.getByTestId('dm-count-review')).toContainText('24');
  await page.getByTestId('dm-mode-on').click();
  await expect(page.getByRole('dialog')).toContainText(
    'will be masked for apps, AI tools and admins, you included. 24 still to review.'
  );
  await shot(page, 'r2-mode-on-confirm');
  await page.getByTestId('dm-confirm-cancel').click();
});

test('mode: an admin who cannot lower it sees Off and Preview locked', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await boot(page, { scenario: 'nogrant', mode: 'on' });
  await open(page);
  await expect(page.getByTestId('dm-mode-lock')).toHaveText(
    /Only the super admin can lower the masking mode\./
  );
  await expect(
    page.getByTestId('dm-mode-off').locator('button')
  ).toBeDisabled();
  await expect(
    page.getByTestId('dm-mode-preview').locator('button')
  ).toBeDisabled();
  await shot(page, 'r2-mode-lowering-locked');
});

test('mode: nothing is shown as selected while the overview loads', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await boot(page, { mode: 'on' });
  // Hold the overview so the loading state can be seen.
  let release: () => void = () => undefined;
  const held = new Promise<void>(r => (release = r));
  await page.route(/\/api\/v2\/system\/data_masking$/, async route => {
    await held;
    await route.fallback();
  });
  await page.goto(PAGE);
  await expect(page.getByTestId('dm-mode-loading')).toBeVisible({
    timeout: 60_000,
  });
  await expect(page.getByTestId('dm-mode')).toHaveCount(0);
  await shot(page, 'r2-mode-loading');
  release();
  await expect(page.getByTestId('dm-mode-on')).toHaveClass(
    /mat-button-toggle-checked/
  );
});

test('columns: disjoint chips, All with its count; Not sensitive has Undo', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await boot(page);
  await open(page);
  const chip = (f: string) => page.getByTestId(`dm-filter-${f}`);
  await expect(chip('review')).toContainText('24');
  await expect(chip('masked')).toContainText('182');
  await expect(chip('clear')).toContainText('447');
  await expect(chip('all')).toContainText('653');
  const patch = page.waitForRequest(isPatch(/\/system\/data_masking\/column$/));
  const row = page.getByTestId('dm-row').first();
  const name = (await row.locator('.c-name code').textContent())?.trim();
  await row.getByTestId('dm-clear').click();
  const body = (await patch).postDataJSON();
  expect(body.class).toBeNull();
  expect(body.id).toMatch(/\./);
  // Focus stays in the row, so keyboard review continues.
  expect(
    await page.evaluate(() =>
      document.activeElement?.getAttribute('data-testid')
    )
  ).toBe('dm-row');
  await expect(page.getByText(`${name} marked not sensitive`)).toBeVisible();
  await shot(page, 'r2-not-sensitive-undo');
  const undo = page.waitForRequest(isPatch(/\/system\/data_masking\/column$/));
  await page.getByTestId('dm-undo').click();
  expect((await undo).postDataJSON().class).not.toBeNull();
});

test('scan: a database that cannot be read is named, with Retry', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await boot(page, { unreachable: true });
  await open(page);
  await page.getByTestId('dm-scan').click();
  await expect(
    page.getByText("Scan finished. Couldn't read Orders (MySQL).")
  ).toBeVisible({ timeout: 30_000 });
  await page.getByTestId('dm-filter-masked').click();
  const failed = page.getByTestId('dm-rail-failed');
  await failed.scrollIntoViewIfNeeded();
  await expect(failed).toContainText("Couldn't scan");
  await expect(failed).toContainText('Orders (MySQL)');
  await shot(page, 'r2-scan-partial');
});

test('first run: a default install with only the empty built-in db', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await boot(page, { scenario: 'emptydb' });
  await open(page);
  await expect(page.getByTestId('dm-no-databases')).toContainText(
    'No tables to scan'
  );
  await expect(page.getByTestId('dm-no-scan')).toHaveCount(0);
  await expect(page.getByTestId('dm-baseline-iso27001')).toHaveText(
    /ISO 27001/
  );
  await expect(page.getByTestId('dm-mode')).toHaveCount(0);
  await shot(page, 'r2-first-run-empty-db');
});

test('access: All admins and AI asks first; a stale page is refused', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const state = await boot(page);
  await open(page, 'access');
  await expect(page.getByTestId('dm-access')).toBeVisible();
  await page.getByTestId('dm-admin-mode').getByText('All admins').click();
  await expect(page.getByRole('dialog')).toContainText(
    'All admins will see real values in 206 columns.'
  );
  await shot(page, 'r2-access-all-admins-confirm');
  await page.getByTestId('dm-confirm-cancel').click();
  await expect(
    page.getByTestId('dm-admin-mode').locator('.mat-button-toggle-checked')
  ).toHaveText('Selected');
  await page.getByTestId('dm-ai-mode').getByText('Same as admins').click();
  await expect(page.getByRole('dialog')).toContainText(
    'AI and MCP sessions will see real values'
  );
  await page.getByTestId('dm-confirm-cancel').click();

  // Someone else changes access (the CLI revokes every grant).
  state.access.admins.grants = [];
  state.accessVersion++;
  const patch = page.waitForRequest(isPatch(/\/data_masking\/access$/));
  await page.getByTestId('dm-role-3').locator('button').click();
  const body = (await patch).postDataJSON();
  // Only the changed role, with the version the page read.
  expect(body.roles).toEqual([
    { role_id: 3, enabled: true, scope: 'except_restricted' },
  ]);
  expect(body.version).toBe('v1');
  // The page re-reads by itself, and says so (not the server's "Reload").
  await expect(
    page.getByText('Access settings changed elsewhere. Showing the latest.')
  ).toBeVisible();
  // Re-read: the revoked grant is not brought back.
  await expect(
    page.getByTestId('dm-admin-1').locator('input')
  ).not.toBeChecked();
  await shot(page, 'r2-access-stale-refused');
});

test('access: durations past a tracked baseline are marked', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await boot(page);
  // HIPAA tracked: the mock's baseline list says so.
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
  await shot(page, 'r2-access-duration-exceeds');
  await page.keyboard.press('Escape');
});

test('activity: chips ask the server; Load older pages back', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const state = await boot(page);
  for (let i = 0; i < 260; i++) {
    state.ev(
      i * 1000,
      'mobile-app',
      'preview',
      'Would mask 3 columns',
      `sports.t${i}`
    );
  }
  await open(page, 'activity');
  await expect(page.getByTestId('dm-activity-older')).toBeVisible();
  const req = page.waitForRequest(
    r =>
      r.url().includes('/data_masking/activity') &&
      r.url().includes('kind=blocked')
  );
  await page.getByTestId('dm-activity-filter-blocked').click();
  await req;
  await expect(page.locator('.event')).toHaveCount(2);
  await shot(page, 'r2-activity-blocked');
  await page.getByTestId('dm-activity-filter-all').click();
  const older = page.waitForRequest(
    r =>
      r.url().includes('/data_masking/activity') && r.url().includes('before=')
  );
  await page.getByTestId('dm-activity-older').click();
  await older;
  await expect(page.getByTestId('dm-activity-older')).toHaveCount(0);
});

test('detection: delete asks and offers to unmask what only it masked', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await boot(page);
  await open(page, 'detection');
  await page.getByTestId('dm-add-rule').click();
  await page.getByTestId('dm-rule-pattern').fill('(^|_)sku$');
  await page.getByTestId('dm-rule-class').click();
  await page.getByRole('option', { name: 'Username' }).click();
  await page.getByTestId('dm-rule-save').click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByTestId('dm-rule-delete').last().click();
  await expect(page.getByRole('dialog')).toContainText('Delete rule?');
  await shot(page, 'r2-rule-delete-confirm');
  await page.getByTestId('dm-confirm-cancel').click();
  // A PCRE-only pattern is the server's to judge, not refused here.
  await page.getByTestId('dm-add-rule').click();
  await page.getByTestId('dm-rule-pattern').fill('^(?>emp|staff)_ssn$');
  await page.getByTestId('dm-rule-class').click();
  await page.getByRole('option', { name: 'National ID' }).click();
  await expect(page.getByTestId('dm-rule-error')).toHaveCount(0);
  await expect(page.getByTestId('dm-rule-save')).toBeEnabled();
  await page.keyboard.press('Escape');
});

test('background: a database scanned while the page is open shows up', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const state = await boot(page);
  await open(page);
  await page.getByTestId('dm-filter-all').click();
  // The server scans a new database on its own (added in API Generation).
  state.pending = true;
  state.scan.finished_at = new Date().toISOString();
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.getByTestId('dm-rail-unscanned')).toContainText(
    'HR (SQL Server)',
    { timeout: 15_000 }
  );
  // The admin's place is kept.
  await expect(page.getByTestId('dm-filter-all')).toHaveClass(/is-on/);
  await shot(page, 'r2-background-new-db');
});

test('layout: 1024 rail, dark tabs, phone tabs and chips, phone access', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await boot(page, {}, 'dark');
  await open(page);
  await page.getByTestId('dm-filter-all').click();
  await page.waitForTimeout(500);
  const overlaps = await page.evaluate(
    () =>
      Array.from(
        document.querySelectorAll('[data-testid="dm-rail-row"]')
      ).filter(row => {
        const strip = row.querySelector('df-sensitivity-strip .strip');
        const badge = row.querySelector('.rail-badge') as HTMLElement | null;
        if (!strip || !badge || !badge.getBoundingClientRect().width)
          return false;
        const right = Math.max(
          ...Array.from(strip.children).map(
            t => (t as HTMLElement).getBoundingClientRect().right
          )
        );
        return right > badge.getBoundingClientRect().left + 0.5;
      }).length
  );
  expect(overlaps).toBe(0);
  await shot(page, 'r2-1024-rail-dark');
  const underline = await page
    .locator('.dm-tabs .mdc-tab--active .mdc-tab-indicator__content--underline')
    .evaluate(e => getComputedStyle(e).borderTopColor);
  expect(underline).not.toBe('rgb(15, 7, 97)');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  // Phones: one select for the tabs (none hidden behind chevrons), and
  // every filter chip in view.
  await expect(page.getByTestId('dm-tab-columns')).toBeHidden();
  await expect(page.getByTestId('dm-tab-select')).toBeVisible();
  for (const f of ['review', 'masked', 'clear', 'all']) {
    const box = await page.getByTestId(`dm-filter-${f}`).boundingBox();
    expect(box && box.x >= 0 && box.x + box.width <= 390).toBeTruthy();
  }
  await shot(page, 'r2-390-columns-dark');

  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByTestId('dm-tab-select').click();
  await page.getByRole('option', { name: 'Access' }).click();
  await expect(page.getByTestId('dm-access')).toBeVisible();
  await page.waitForTimeout(400);
  const spill = await page.evaluate(() => {
    const list = document.querySelector('.admins') as HTMLElement | null;
    return list ? list.scrollWidth - list.clientWidth : 0;
  });
  expect(spill).toBeLessThanOrEqual(0);
  await shot(page, 'r2-375-access-dark');
});

test('masks: an often-numeric class shows what a number comes back as', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await boot(page);
  await open(page, 'masks');
  const n = page.getByTestId('dm-numeric-example').first();
  await n.scrollIntoViewIfNeeded();
  await expect(n.locator('.mv-null')).toHaveText('null');
  await shot(page, 'r2-masks-numeric-example');
});

/**
 * Wide tables (RU-7): one service with 220 small tables and one wide
 * table. Run against a production build; numbers land in perf-<n>.json.
 */
for (const wide of [300, 1500]) {
  test(`perf: a ${wide}-column table`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await boot(page, { uncovered: false });
    const cols: Record<string, unknown>[] = [];
    const mk = (t: string, c: string, i: number) => {
      const v = i % 7 === 0 ? 'review' : i % 3 === 0 ? 'masked' : 'clear';
      return {
        id: `big.${t}.${c}`,
        service: 'big',
        table: t,
        column: c,
        type: 'varchar',
        verdict: v,
        class: v === 'clear' ? null : 'email',
        tier: v === 'clear' ? null : 'identity',
        source: 'detected',
        decided_by: null,
        decided_at: null,
        confidence: v === 'clear' ? 10 : 80,
        example: v === 'clear' ? null : 'EMAIL_7f3a9c21',
        format: v === 'clear' ? null : 'token',
        evidence: {
          total: 80,
          threshold_mask: 70,
          threshold_review: 40,
          lines: [{ points: 80, kind: 'name', text: 'Column name' }],
          shapes: [],
        },
      };
    };
    for (let t = 0; t < 220; t++) {
      for (let c = 0; c < 5; c++) {
        cols.push(mk(`t${String(t).padStart(3, '0')}`, `c${c}`, t * 5 + c));
      }
    }
    for (let c = 0; c < wide; c++) cols.push(mk('a_wide', `col_${c}`, c));
    const counts: Record<string, number> = { masked: 0, review: 0, clear: 0 };
    cols.forEach(c => counts[c['verdict'] as string]++);
    const byTable = new Map<string, Record<string, unknown>[]>();
    cols.forEach(c => {
      const k = c['table'] as string;
      byTable.set(k, [...(byTable.get(k) ?? []), c]);
    });
    const tables = [...byTable.entries()].map(([name, cs]) => {
      const cc: Record<string, number> = { masked: 0, review: 0, clear: 0 };
      cs.forEach(c => cc[c['verdict'] as string]++);
      return {
        name,
        rows: null,
        columns: cc,
        strip: cs.map(c => ({
          column: c['column'],
          mark:
            c['verdict'] === 'review'
              ? 'review'
              : c['verdict'] === 'clear'
                ? 'clear'
                : 'identity',
          tier: c['tier'],
        })),
      };
    });
    const now = new Date().toISOString();
    await page.route('**/api/v2/system/data_masking/table*', r =>
      r.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          resource: [
            { service: 'big', label: 'Big DB', scanned_at: now, tables },
          ],
        }),
      })
    );
    await page.route('**/api/v2/system/data_masking/column?*', r =>
      r.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ resource: cols }),
      })
    );
    await page.route(/\/api\/v2\/system\/data_masking$/, async r => {
      if (r.request().method() !== 'GET') return r.fallback();
      return r.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          you: { can_grant: true, sees_real_values: false },
          mode: 'preview',
          scan: {
            status: 'idle',
            finished_at: now,
            columns: cols.length,
            last_status: 'done',
          },
          counts,
          coverage: {
            covered: [{ service: 'big', label: 'Big DB', type: 'pgsql' }],
            uncovered: [],
          },
        }),
      });
    });
    await open(page);
    await expect(page.getByTestId('dm-row').first()).toBeVisible();
    const frame = () =>
      page.evaluate(
        () => new Promise(r => requestAnimationFrame(() => setTimeout(r, 0)))
      );
    const time = async (
      act: () => Promise<unknown>,
      done: () => Promise<unknown>
    ) => {
      const t0 = Date.now();
      await act();
      await done();
      return Date.now() - t0;
    };
    const filterAllMs = await time(
      () => page.getByTestId('dm-filter-all').click(),
      frame
    );
    // Measured in the page: from the click to the frame where the first
    // rows show, and to the frame where every row is drawn.
    const opened = await page.evaluate(async n => {
      const row = Array.from(
        document.querySelectorAll<HTMLElement>('[data-testid="dm-rail-row"]')
      ).find(e => e.textContent?.includes('a_wide'))!;
      const t0 = performance.now();
      row.click();
      let first = 0;
      await new Promise<void>(res => {
        const tick = () => {
          const rows = document.querySelectorAll('[data-testid="dm-row"]');
          const title = document.querySelector('.list-title')?.textContent;
          if (title === 'a_wide' && rows.length && !first) {
            first = performance.now() - t0;
          }
          if (title === 'a_wide' && rows.length >= n) return res();
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
      return { first, all: performance.now() - t0 };
    }, wide);
    const openFirstMs = Math.round(opened.first);
    const allRowsMs = Math.round(opened.all);
    await expect(page.getByTestId('dm-row')).toHaveCount(wide);
    // In-page timings (Playwright's own selector work on a large DOM is
    // not the app's cost): from the event to the next painted frame.
    const inPage = (what: 'key' | 'keep') =>
      page.evaluate(async w => {
        const painted = () =>
          new Promise(r => requestAnimationFrame(() => setTimeout(r, 0)));
        const t0 = performance.now();
        if (w === 'key') {
          const input = document.querySelector(
            '[data-testid="dm-search"]'
          ) as HTMLInputElement;
          input.value = 'c';
          input.dispatchEvent(new Event('input', { bubbles: true }));
          await painted();
          const typed = performance.now() - t0;
          // The rebuild runs once typing pauses (debounce).
          await new Promise(r => setTimeout(r, 160));
          const t1 = performance.now();
          await painted();
          return { typed, rebuilt: performance.now() - t1 };
        }
        (
          document.querySelector('[data-testid="dm-keep"]') as HTMLElement
        ).click();
        await painted();
        return { typed: performance.now() - t0, rebuilt: 0 };
      }, what);
    const key = await inPage('key');
    await page.getByTestId('dm-search').fill('');
    await page.waitForTimeout(400);
    await page.getByTestId('dm-filter-review').click();
    await expect(page.getByTestId('dm-row')).toHaveCount(wide, {
      timeout: 60_000,
    });
    await frame();
    const keep = await inPage('keep');
    const keyMs = Math.round(key.typed + key.rebuilt);
    const keepMs = Math.round(keep.typed);
    const longTasks = await page.evaluate(
      () => performance.getEntriesByType('longtask').length
    );
    const out = {
      wide,
      columns: cols.length,
      filterAllMs,
      openFirstRowsMs: openFirstMs,
      openAllRowsMs: allRowsMs,
      keystrokeTypedMs: Math.round(key.typed),
      keystrokeRebuildMs: Math.round(key.rebuilt),
      keystrokeMs: keyMs,
      keepMs,
      longTasks,
    };
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(out));
    const { writeFileSync } = await import('node:fs');
    writeFileSync(join(OUT, `perf-${wide}.json`), JSON.stringify(out, null, 2));
  });
}

/** WCAG contrast of an element's text on what is painted behind it. */
async function contrastOf(page: Page, selector: string) {
  return page
    .locator(selector)
    .first()
    .evaluate(el => {
      // rgb()/rgba(), or color(srgb r g b / a) for color-mix() results.
      const parse = (c: string) => {
        const m = c.match(/[\d.]+/g)!.map(Number);
        const k = c.startsWith('color(') ? 255 : 1;
        return {
          r: m[0] * k,
          g: m[1] * k,
          b: m[2] * k,
          a: m.length > 3 ? m[3] : 1,
        };
      };
      const over = (
        top: ReturnType<typeof parse>,
        under: ReturnType<typeof parse>
      ) => ({
        r: top.r * top.a + under.r * (1 - top.a),
        g: top.g * top.a + under.g * (1 - top.a),
        b: top.b * top.a + under.b * (1 - top.a),
        a: 1,
      });
      // Composite the backgrounds from the page down to the element.
      const chain: HTMLElement[] = [];
      for (
        let e: HTMLElement | null = el as HTMLElement;
        e;
        e = e.parentElement
      ) {
        chain.unshift(e);
      }
      let bg = { r: 255, g: 255, b: 255, a: 1 };
      for (const e of chain) {
        const c = parse(getComputedStyle(e).backgroundColor);
        if (c.a > 0) bg = over(c, bg);
      }
      const fg = over(parse(getComputedStyle(el).color), bg);
      const lum = (c: { r: number; g: number; b: number }) => {
        const ch = [c.r, c.g, c.b].map(v => {
          const s = v / 255;
          return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
      };
      const [l1, l2] = [lum(fg), lum(bg)].sort((a, b) => b - a);
      return Math.round(((l1 + 0.05) / (l2 + 0.05)) * 100) / 100;
    });
}

for (const theme of ['light', 'dark'] as Theme[]) {
  test(`contrast: small tier and "Not sensitive" text reach 4.5:1 (${theme})`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await boot(page, {}, theme);
    await open(page);
    await page.getByTestId('dm-filter-all').click();
    await page.mouse.move(2, 890);
    const clear = await contrastOf(page, '.chip.is-clear .chip-label');
    const identity = await contrastOf(
      page,
      '.mv.dm-tier-identity .mv-token, .mv.dm-tier-identity .mv-null'
    );
    const chip = await contrastOf(page, '.chip.dm-tier-identity .chip-label');
    const badge = await contrastOf(page, '.rail-badge .badge');
    expect(clear).toBeGreaterThanOrEqual(4.5);
    expect(identity).toBeGreaterThanOrEqual(4.5);
    expect(chip).toBeGreaterThanOrEqual(4.5);
    expect(badge).toBeGreaterThanOrEqual(4.5);
  });
}
