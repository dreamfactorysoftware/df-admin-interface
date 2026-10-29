/**
 * Data Masking + Compliance live audit against a REAL df-masking backend
 * (no page.route mocks). Where _data-masking-live.spec.ts walks the
 * journey, this one reads every tab and compares what is on screen with
 * what the system API says: counts, rail, rows, examples, evidence, access,
 * masks, rules (live test), activity, compliance statuses, Apply and
 * Export. With DM_LIVE_SCREENS_DIR set it saves the real-backend
 * screenshots (01-first-run ... 15-oss-paywall).
 *
 * Shared-stack discipline: everything it changes it puts back (mode,
 * admin access, baseline tracking), except what the product makes sticky
 * on purpose: Apply's tightening (detection rules a baseline adds) stays.
 * Set DM_AUDIT_APPLY=0 to skip applying a baseline.
 *
 *   PLAYWRIGHT_BASE_URL=http://127.0.0.1:4301 \
 *   DM_LIVE_SCREENS_DIR=/path/to/screens/live \
 *   DM_OSS_BASE_URL=http://127.0.0.1:4302 \
 *     npx playwright test -c e2e/_data-masking-live-audit.config.ts
 */
import {
  APIRequestContext,
  Browser,
  Locator,
  Page,
  expect,
  test,
} from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { ADMIN_EMAIL, ADMIN_PASSWORD } from './fixtures/admin-login';

const EMAIL = ADMIN_EMAIL;
const PASSWORD = ADMIN_PASSWORD;
const SCREENS = process.env['DM_LIVE_SCREENS_DIR'] ?? '';
const OSS_URL = process.env['DM_OSS_BASE_URL'] ?? '';
const OSS_EMAIL = process.env['DM_OSS_EMAIL'] ?? ADMIN_EMAIL;
const OSS_PASSWORD = process.env['DM_OSS_PASSWORD'] ?? ADMIN_PASSWORD;
/** An app (role without real-value access) and a covered table it reads. */
const PREVIEW_KEY = process.env['DM_APP_KEY'] ?? '';
const PREVIEW_PATH =
  process.env['DM_APP_PATH'] ??
  '/api/v2/crm_mysql/_table/customers?limit=1&fields=id,email';
/** A second admin who is not the super admin (tightens, never loosens). */
const OTHER_EMAIL = process.env['DM_OTHER_EMAIL'] ?? '';
const OTHER_PASSWORD = process.env['DM_OTHER_PASSWORD'] ?? '';
const APPLY = process.env['DM_AUDIT_APPLY'] !== '0';
const APPLY_BASELINE = process.env['DM_AUDIT_BASELINE'] ?? 'hipaa';
/** On a never-scanned instance: the shortcut whose Apply starts the scan. */
const FIRST_APPLY_BASELINE = process.env['DM_AUDIT_FIRST_BASELINE'] ?? 'soc2';
const SCAN_TIMEOUT = 15 * 60_000;

const DM = '/dreamfactory/dist/#/api-security/data-masking';
const CP = '/dreamfactory/dist/#/api-security/compliance';
const GLYPH = '\u2022';
const TOKEN_RE = /^[A-Z][A-Z0-9]*_[0-9a-f]{4,16}$/;

if (SCREENS) mkdirSync(SCREENS, { recursive: true });

const i18n = (scope: string) =>
  JSON.parse(
    readFileSync(join(__dirname, `../src/assets/i18n/${scope}/en.json`), 'utf8')
  );
const DMT = i18n('dataMasking');
const CPT = i18n('compliance');

/** Minimal system API client (raw wire format: snake_case). */
class Api {
  constructor(
    private ctx: APIRequestContext,
    private token: string
  ) {}

  static async login(ctx: APIRequestContext): Promise<Api> {
    const res = await ctx.post('/api/v2/system/admin/session', {
      data: { email: EMAIL, password: PASSWORD },
    });
    expect(res.ok(), `admin API login: HTTP ${res.status()}`).toBe(true);
    return new Api(ctx, (await res.json()).session_token);
  }

  private h() {
    return { 'X-DreamFactory-Session-Token': this.token };
  }

  async get(path: string): Promise<any> {
    const res = await this.ctx.get(`/api/v2${path}`, { headers: this.h() });
    expect(res.ok(), `GET ${path}: HTTP ${res.status()}`).toBe(true);
    return res.json();
  }

  async send(
    method: 'patch' | 'post' | 'delete',
    path: string,
    data?: unknown
  ): Promise<any> {
    const res = await this.ctx[method](`/api/v2${path}`, {
      headers: this.h(),
      data,
    });
    expect(res.ok(), `${method} ${path}: HTTP ${res.status()}`).toBe(true);
    return res.json().catch(() => ({}));
  }
}

let page: Page;
let api: Api;
const featureErrors: string[] = [];
const pageErrors: string[] = [];
const snap: {
  mode?: string;
  admins?: { mode: string; grants: { admin_id: number }[] };
  ai?: string;
  adopted?: string[];
} = {};

/** Everything the Columns tab is built from. */
interface Model {
  overview: any;
  services: any[];
  columns: Map<string, any[]>;
}

async function model(): Promise<Model> {
  const [overview, tables] = await Promise.all([
    api.get('/system/data_masking'),
    api.get('/system/data_masking/table'),
  ]);
  const columns = new Map<string, any[]>();
  await Promise.all(
    tables.resource.map(async (s: any) => {
      const r = await api.get(
        `/system/data_masking/column?service=${encodeURIComponent(s.service)}`
      );
      columns.set(s.service, r.resource);
    })
  );
  return { overview, services: tables.resource, columns };
}

const tableCols = (m: Model, svc: string, table: string) =>
  (m.columns.get(svc) ?? []).filter(c => c.table === table);

async function hideChrome() {
  // Third-party launcher and the test image's licence banner (its key
  // cannot reach the licence server): neither is part of the feature.
  await page.addStyleTag({
    content:
      '[id^="intercom"], .intercom-lightweight-app, iframe[name^="intercom"], .license-expired { display: none !important; }',
  });
}

async function shot(
  name: string,
  opts: { height?: number; top?: boolean } = {}
) {
  if (!SCREENS) return;
  await hideChrome();
  const size = page.viewportSize();
  if (opts.height && size) {
    await page.setViewportSize({ width: size.width, height: opts.height });
  }
  if (opts.top) {
    await page.evaluate(() => {
      document
        .querySelectorAll('mat-sidenav-content, .mat-drawer-content')
        .forEach(e => (e.scrollTop = 0));
      window.scrollTo(0, 0);
    });
  }
  await page.mouse.move(2, 2);
  // No stray focus ring from the last click or key press.
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(SCREENS, `${name}.png`), caret: 'hide' });
  if (opts.height && size) await page.setViewportSize(size);
}

async function dismissToasts() {
  await page
    .locator('mat-snack-bar-container')
    .evaluateAll(els =>
      els.forEach(e => ((e as HTMLElement).style.display = 'none'))
    );
}

async function waitFor<T>(
  read: () => Promise<T>,
  ok: (v: T) => boolean,
  what: string,
  timeout = 20_000
): Promise<T> {
  let last: T | undefined;
  await expect
    .poll(
      async () => {
        last = await read();
        return ok(last);
      },
      { timeout, message: what }
    )
    .toBe(true);
  return last as T;
}

async function openDataMasking(tab = '') {
  await page.goto(`${DM}${tab ? `?tab=${tab}` : ''}`);
  // Before the first scan with masking off the mode control is not drawn
  // (the page leads with the scan), so wait for whichever view loads.
  await expect(
    page
      .getByTestId('dm-mode')
      .or(page.getByTestId('dm-no-scan'))
      .or(page.getByTestId('dm-first-scan'))
      .first()
  ).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId('dm-tab-columns')).toHaveText(/\S/);
}

async function login(p: Page, email: string, password: string) {
  await p.context().clearCookies();
  await p.goto('/dreamfactory/dist/#/auth/login');
  const box = p.locator('input').first();
  await expect(box).toBeVisible({ timeout: 30_000 });
  await box.fill(email);
  await p.locator('input').nth(1).fill(password);
  const res = p.waitForResponse(
    r =>
      r.url().includes('/api/v2/system/admin/session') &&
      r.request().method() === 'POST'
  );
  await p.getByRole('button', { name: /^login$/i }).click();
  expect((await res).ok()).toBe(true);
  await p.waitForURL(u => !u.toString().includes('/auth/login'), {
    timeout: 30_000,
  });
}

/** Rail groups as drawn: [{ label, tables: [{ name, badge }] }]. */
async function railOnScreen() {
  return page
    .locator(
      '.rail .rail-group:not(.is-pending):not(.is-uncovered):not(.is-quiet):not(.is-failed)'
    )
    .evaluateAll(groups =>
      groups.map(g => ({
        label: (g.querySelector('.rail-service')?.textContent ?? '').trim(),
        tables: Array.from(
          g.querySelectorAll('[data-testid="dm-rail-row"]')
        ).map(r => ({
          name: (r.querySelector('.rail-name')?.textContent ?? '').trim(),
          badge: (r.querySelector('.badge')?.textContent ?? '').trim(),
          strip: r
            .querySelector('df-sensitivity-strip .strip')
            ?.getAttribute('aria-label'),
        })),
      }))
    );
}

/** Scanned databases listed quietly under the rail (nothing to list). */
async function quietOnScreen() {
  return page.locator('[data-testid="dm-rail-quiet-row"]').evaluateAll(rows =>
    rows.map(r => ({
      label: (r.querySelector('.rail-name')?.textContent ?? '').trim(),
      note: (r.querySelector('.rail-note')?.textContent ?? '').trim(),
    }))
  );
}

function expectedQuiet(m: Model, filter: string) {
  const inRail = new Set(
    expectedRail(
      m,
      filter === 'review'
        ? (x: any) => x.verdict === 'review'
        : filter === 'masked'
          ? (x: any) => x.verdict !== 'clear'
          : () => true
    ).map(g => g.label)
  );
  return m.services
    .filter(s => !inRail.has(s.label) && !s.scan_error)
    .flatMap(s => {
      if (!s.tables.length) {
        return s.scanned_at
          ? [{ label: s.label, note: DMT.columns.noTables }]
          : [];
      }
      const sensitive = s.tables.some(
        (t: any) => t.columns.masked + t.columns.review > 0
      );
      return !sensitive && (filter === 'masked' || filter === 'review')
        ? [{ label: s.label, note: DMT.columns.nothingSensitive }]
        : [];
    });
}

function expectedRail(m: Model, keep: (c: any) => boolean) {
  return m.services
    .map(s => ({
      label: s.label,
      tables: s.tables
        .filter((t: any) => tableCols(m, s.service, t.name).some(keep))
        .map((t: any) => ({
          name: t.name,
          badge: t.columns.review ? String(t.columns.review) : '',
          strip: fill(DMT.strip, t.columns),
        })),
    }))
    .filter(g => g.tables.length);
}

/** One row's rendered value, compared with the server's example. */
async function checkValue(row: Locator, c: any) {
  const cell = row.locator('.c-value');
  if (c.verdict === 'clear') {
    await expect(cell.locator('.dash')).toBeVisible();
    return;
  }
  const mv = cell.locator('.mv');
  if (c.example === null || c.example === undefined || c.format === 'null') {
    await expect(mv.locator('.mv-null')).toBeVisible();
    return;
  }
  const ex = String(c.example);
  if (TOKEN_RE.test(ex)) {
    await expect(mv.locator('.mv-token')).toHaveText(ex);
    return;
  }
  // Masked characters are drawn as bars, kept characters as text.
  expect(ex.includes(GLYPH), `${c.id}: example carries the mask`).toBe(true);
  const runs = ex.match(new RegExp(`${GLYPH}+`, 'g'))?.length ?? 0;
  if (c.format !== 'span') {
    await expect(mv.locator('.mv-bar')).toHaveCount(runs);
    const kept = (await mv.locator('.mv-seg').allTextContents()).join('');
    expect(kept, `${c.id}: kept characters`).toBe(
      ex.replace(new RegExp(GLYPH, 'g'), '')
    );
  } else {
    expect(await mv.locator('.mv-bar').count()).toBeGreaterThan(0);
  }
}

/** The ledger lines the receipt shows for a column (see the component). */
function ledgerLines(ev: any): any[] {
  const all = ev.lines ?? [];
  const scored = all.filter((l: any) => l.points !== 0);
  if (!scored.length) return all;
  const sum = scored.reduce((s: number, l: any) => s + l.points, 0);
  const total = Math.max(0, Math.min(100, ev.total));
  return Math.max(0, Math.min(100, sum)) === total ? scored : all;
}

/** Transloco-style {{param}} substitution. */
const fill = (tpl: string, p: Record<string, unknown>) =>
  tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => String(p[k]));

const pts = (p: number) => (p > 0 ? `+${p}` : p < 0 ? `\u2212${-p}` : '0');

test.describe.configure({ mode: 'serial' });

test.beforeAll(async ({ browser }: { browser: Browser }, testInfo) => {
  page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    acceptDownloads: true,
    baseURL: testInfo.project.use.baseURL,
    ignoreHTTPSErrors: true,
  });
  page.on('pageerror', e => pageErrors.push(e.message));
  page.on('response', r => {
    if (
      r.status() >= 400 &&
      /\/system\/(data_masking|security_baseline)/.test(r.url())
    ) {
      featureErrors.push(`${r.status()} ${r.request().method()} ${r.url()}`);
    }
  });
  api = await Api.login(page.request);
  const [o, access, list] = await Promise.all([
    api.get('/system/data_masking'),
    api.get('/system/data_masking/access'),
    api.get('/system/security_baseline'),
  ]);
  snap.mode = o.mode;
  snap.admins = {
    mode: access.admins.mode,
    grants: access.admins.grants.map((g: any) => ({ admin_id: g.admin_id })),
  };
  snap.ai = access.ai;
  snap.adopted = list.resource
    .filter((b: any) => b.adopted)
    .map((b: any) => b.id);
});

test.afterAll(async () => {
  if (!api) {
    await page?.close();
    return;
  }
  const tries: Promise<unknown>[] = [];
  const attempt = (fn: () => Promise<unknown>) =>
    tries.push(fn().catch(e => console.warn('restore failed:', String(e))));
  if (snap.admins) {
    attempt(() =>
      api.send('patch', '/system/data_masking/access', {
        admins: snap.admins,
        ai: snap.ai,
      })
    );
  }
  attempt(async () => {
    const o = await api.get('/system/data_masking');
    // The first scan moves Off to Preview on purpose; keep that.
    const want =
      snap.mode === 'off' && o.mode === 'preview' ? 'preview' : snap.mode;
    if (want && o.mode !== want) {
      await api.send('patch', '/system/data_masking', { mode: want });
    }
  });
  attempt(async () => {
    const list = await api.get('/system/security_baseline');
    for (const b of list.resource) {
      if (b.adopted && !snap.adopted?.includes(b.id)) {
        await api.send('delete', `/system/security_baseline/${b.id}`);
      }
    }
  });
  await Promise.all(tries);
  await page?.close();
});

test('login opens Data Masking (GOLD)', async () => {
  await login(page, EMAIL, PASSWORD);
  await openDataMasking();
  await expect(page.locator('df-paywall')).toHaveCount(0);
});

test('first run: one action and the framework shortcuts', async () => {
  const o = await api.get('/system/data_masking');
  const never =
    !o.scan.finished_at && o.scan.columns === 0 && o.scan.status !== 'running';
  test.skip(!never, 'Already scanned: the first-run state cannot be shown.');
  await expect(page.getByTestId('dm-no-scan')).toBeVisible();
  await expect(page.getByTestId('empty-state-action')).toHaveText(
    DMT.empty.scanAction
  );
  // Masking off and nothing scanned: no mode control yet, no counts.
  if (o.mode === 'off') {
    await expect(page.getByTestId('dm-mode')).toHaveCount(0);
  } else {
    await expect(
      page.getByTestId('dm-mode-on').locator('button')
    ).toBeDisabled();
  }
  await expect(page.getByTestId('dm-count-masked')).toHaveCount(0);
  const chips = page.getByTestId('dm-first-run-baselines').locator('button');
  await expect(chips).toHaveText(
    ['HIPAA', 'PCI DSS', 'GLBA', 'CJIS', 'GDPR', 'SOC 2', 'ISO 27001'].map(
      v => new RegExp(v)
    )
  );
  await shot('01-first-run');
  // A shortcut lands on its baseline.
  await page.getByTestId('dm-baseline-hipaa').click();
  await expect(page).toHaveURL(/compliance\?baseline=hipaa/);
  await expect(page.locator('#cp-title')).toHaveText('HIPAA baseline', {
    timeout: 30_000,
  });
  await openDataMasking();
});

test('first run: Apply from a framework shortcut starts the first scan', async () => {
  const o = await api.get('/system/data_masking');
  const never =
    !o.scan.finished_at && o.scan.columns === 0 && o.scan.status !== 'running';
  test.skip(!never || !APPLY, 'Already scanned (or DM_AUDIT_APPLY=0).');
  const id = FIRST_APPLY_BASELINE;
  await page.getByTestId(`dm-baseline-${id}`).click();
  await expect(page).toHaveURL(new RegExp(`compliance\\?baseline=${id}`));
  const b = await api.get(`/system/security_baseline/${id}`);
  await expect(page.locator('#cp-title')).toHaveText(`${b.name} baseline`, {
    timeout: 30_000,
  });
  // Mapped frameworks and the disclaimer sit under the title.
  await expect(page.getByTestId('cp-mapped')).toContainText(
    'Not a certification'
  );
  // Never scanned: masking.mode cannot pass, and turning masking on is not
  // offered (the server would refuse it before a scan).
  await page.getByTestId('cp-apply').click();
  const dialog = page.locator('mat-dialog-container');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByTestId('cp-apply-turn-on')).toHaveCount(0);
  const applied = page.waitForResponse(
    r =>
      r.url().includes(`/system/security_baseline/${id}/apply`) &&
      r.request().method() === 'POST'
  );
  await dialog.getByTestId('cp-apply-confirm').click();
  const res = await applied;
  expect(res.status()).toBe(200);
  expect((await res.json()).scan_started).toBe(true);
  // The toast says the scan started, and the page follows it to the end.
  await expect(page.locator('mat-snack-bar-container')).toContainText(
    `${b.name} baseline applied. Scanning`
  );
  await expect(page.getByTestId('cp-tracking')).toBeVisible();
  const after = await waitFor(
    () => api.get('/system/data_masking'),
    v => v.scan.status !== 'running' && !!v.scan.finished_at,
    'first scan (started by Apply) finished',
    SCAN_TIMEOUT
  );
  await expect(page.getByTestId('cp-scanning')).toHaveCount(0, {
    timeout: 30_000,
  });
  // The checks were re-read after the scan: the score is the server's.
  const d = await api.get(`/system/security_baseline/${id}`);
  const pass = d.controls.filter((c: any) => c.status === 'pass').length;
  const fail = d.controls.filter((c: any) => c.status === 'fail').length;
  await expect(page.getByTestId('cp-score')).toHaveText(
    new RegExp(`${pass}\\s+of ${pass + fail}`)
  );
  expect(after.scan.columns).toBeGreaterThan(0);
  // The scan activity names the baseline that started it.
  const act = (await api.get('/system/data_masking/activity?kind=scan'))
    .resource;
  expect(act.map((e: any) => e.text)).toContain(
    `Scan started by the ${b.name} baseline`
  );
  await openDataMasking();
});

test('first scan from the page, then Preview without a reload', async () => {
  const o = await api.get('/system/data_masking');
  if (!o.scan.finished_at && o.scan.status !== 'running') {
    await page.getByTestId('empty-state-action').click();
    await expect(page.getByTestId('dm-first-scan')).toBeVisible();
  }
  await expect(page.getByTestId('dm-search')).toBeVisible({
    timeout: SCAN_TIMEOUT,
  });
  const after = await waitFor(
    () => api.get('/system/data_masking'),
    v => v.scan.status !== 'running' && !!v.scan.finished_at,
    'scan finished',
    SCAN_TIMEOUT
  );
  await expect(page.getByTestId(`dm-mode-${after.mode}`)).toHaveClass(
    /mat-button-toggle-checked/
  );
});

test('columns: counts, rail, rows and examples match the server', async () => {
  await openDataMasking();
  const m = await model();
  const c = m.overview.counts;
  // Disjoint counts, the same as the API, CLI and evidence export.
  await expect(page.getByTestId('dm-count-masked')).toContainText(
    String(c.masked)
  );
  if (c.review) {
    await expect(page.getByTestId('dm-count-review')).toContainText(
      String(c.review)
    );
  }
  // To review shows only while there is something to review.
  if (c.review) {
    await expect(page.getByTestId('dm-filter-review')).toContainText(
      String(c.review)
    );
  } else {
    await expect(page.getByTestId('dm-filter-review')).toHaveCount(0);
  }
  await expect(page.getByTestId('dm-filter-masked')).toContainText(
    String(c.masked)
  );
  await expect(page.getByTestId('dm-filter-all')).toContainText(
    String(c.masked + c.review + c.clear)
  );
  await expect(page.getByTestId('dm-filter-clear')).toContainText(
    String(c.clear)
  );
  // Server counts add up to the stored columns.
  const all = [...m.columns.values()].flat();
  expect(all.length).toBe(c.masked + c.review + c.clear);
  expect(all.filter(x => x.verdict === 'review').length).toBe(c.review);

  // Default filter: Review when there is anything to review.
  const filter = c.review > 0 ? 'review' : 'masked';
  await expect(page.getByTestId(`dm-filter-${filter}`)).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  const keep =
    filter === 'review'
      ? (x: any) => x.verdict === 'review'
      : (x: any) => x.verdict !== 'clear';
  expect(await railOnScreen()).toEqual(expectedRail(m, keep));
  // Scanned databases with nothing under this filter stay listed quietly.
  expect(await quietOnScreen()).toEqual(expectedQuiet(m, filter));

  // The selected (first) table: the queue, then its other columns.
  const first = expectedRail(m, keep)[0];
  const svc = m.services.find(s => s.label === first.label);
  const cols = tableCols(m, svc.service, first.tables[0].name);
  const queue = cols.filter(keep);
  const rest = filter === 'review' ? cols.filter(x => !keep(x)) : [];
  const expected = [...queue, ...rest];
  await expect(page.locator('.list-title')).toHaveText(first.tables[0].name);
  const rows = page.locator('.list [data-testid="dm-row"]');
  await expect(rows).toHaveCount(expected.length);
  for (let i = 0; i < expected.length; i++) {
    const row = rows.nth(i);
    const col = expected[i];
    await expect(row.locator('.c-name code')).toHaveText(col.column);
    const label =
      col.verdict === 'clear' || !col.class
        ? DMT.notSensitive
        : DMT.classes[col.class];
    await expect(row.getByTestId('dm-class-chip')).toContainText(label);
    await checkValue(row, col);
    if (col.verdict === 'review') {
      await expect(row.getByTestId('dm-clear')).toBeVisible();
      await expect(row.getByTestId('dm-keep')).toHaveCount(col.class ? 1 : 0);
    }
  }
  await shot('02-columns-review');

  // Every stored example the API returns renders on its row (All filter).
  await page.getByTestId('dm-filter-all').click();
  expect(await railOnScreen()).toEqual(expectedRail(m, () => true));
  let checked = 0;
  for (const s of m.services) {
    for (const t of s.tables) {
      const tc = tableCols(m, s.service, t.name);
      if (!tc.some(x => x.verdict !== 'clear')) continue;
      await page
        .locator('.rail-group')
        .filter({ has: page.locator('.rail-service', { hasText: s.label }) })
        .getByTestId('dm-rail-row')
        .filter({
          has: page.locator('.rail-name', {
            hasText: new RegExp(
              `^${t.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`
            ),
          }),
        })
        .click();
      await expect(page.locator('.list-title')).toHaveText(t.name);
      const r = page.locator('.list [data-testid="dm-row"]');
      await expect(r).toHaveCount(tc.length);
      for (let i = 0; i < tc.length; i++) {
        if (tc[i].verdict === 'clear') continue;
        await checkValue(r.nth(i), tc[i]);
        checked++;
      }
    }
  }
  expect(checked).toBe(c.masked + c.review);
});

test('evidence: the receipt is the server evidence', async () => {
  const m = await model();
  const all = [...m.columns.values()].flat();
  // A sampled masked column (values + shapes), a review one, and one whose
  // receipt only adds up with its zero-point lines.
  const sampled = (c: any, valid: boolean) =>
    c.verdict === 'masked' &&
    c.evidence.shapes?.length &&
    c.evidence.lines.some(
      (l: any) =>
        l.kind === 'values' &&
        l.points > 0 &&
        (!valid || /\bvalid\b/.test(l.text))
    );
  const picks = [
    // Prefer one a validator confirmed (checksums, issuer ranges).
    all.find(c => sampled(c, true)) ?? all.find(c => sampled(c, false)),
    all.find(c => c.verdict === 'review'),
    all.find(c => {
      const scored = c.evidence.lines.filter((l: any) => l.points !== 0);
      const sum = scored.reduce((s: number, l: any) => s + l.points, 0);
      return scored.length && Math.min(100, sum) !== c.evidence.total;
    }),
  ].filter(Boolean);
  expect(picks.length).toBeGreaterThan(1);
  await page.getByTestId('dm-filter-all').click();
  for (const col of picks) {
    await page.getByTestId('dm-search').fill(col.column);
    const svc = m.services.find(s => s.service === col.service);
    await page
      .locator('.rail-group')
      .filter({ has: page.locator('.rail-service', { hasText: svc.label }) })
      .getByTestId('dm-rail-row')
      .filter({ hasText: col.table })
      .first()
      .click();
    await expect(page.locator('.list-title')).toHaveText(col.table);
    const row = page
      .locator('.list [data-testid="dm-row"]')
      .filter({ has: page.locator('.c-name code', { hasText: col.column }) })
      .first();
    await row.getByTestId('dm-expand').click();
    const ledger = page.locator('df-evidence-ledger').first();
    await expect(ledger).toBeVisible();
    const want = ledgerLines(col.evidence);
    const lines = ledger.locator('.line:not(.total)');
    await expect(lines.locator('.why')).toHaveText(want.map(l => l.text));
    await expect(lines.locator('.pts')).toHaveText(
      want.map(l => pts(l.points))
    );
    await expect(ledger.locator('.line.total .pts')).toHaveText(
      String(Math.max(0, Math.min(100, col.evidence.total)))
    );
    if (col.evidence.shapes?.length) {
      await expect(ledger.locator('.shape code')).toHaveText(
        col.evidence.shapes.map((s: any) => s[0])
      );
    }
    if (col.type) {
      await expect(ledger.locator('.facts dd code').first()).toHaveText(
        col.type
      );
    }
    if (col === picks[0]) await shot('03-evidence', { top: true });
    await row.getByTestId('dm-expand').click();
  }
  await page.getByTestId('dm-search').fill('');
});

test('columns in the dark theme', async () => {
  await page.evaluate(() => localStorage.setItem('isDarkMode', 'true'));
  await openDataMasking();
  const row = page.locator('.list [data-testid="dm-row"]').first();
  await expect(row).toBeVisible();
  await row.getByTestId('dm-expand').click();
  await shot('04-columns-dark');
  await page.evaluate(() => localStorage.setItem('isDarkMode', 'false'));
  await openDataMasking();
});

test('mode: turning on asks first, with the real numbers', async () => {
  const m = await model();
  const start = m.overview.mode;
  test.skip(start === 'on', 'Masking is already on.');
  const total = m.overview.counts.masked + m.overview.counts.review;
  const dbs = m.services.filter(s =>
    s.tables.some((t: any) => t.columns.masked + t.columns.review > 0)
  ).length;
  await page.getByTestId('dm-mode-on').click();
  const dialog = page.locator('mat-dialog-container');
  await expect(dialog).toContainText(DMT.mode.confirmOn.title);
  await expect(dialog).toContainText(
    `${total} column${total === 1 ? '' : 's'} in ${dbs} database${dbs === 1 ? '' : 's'}`
  );
  await shot('05-mode-on-confirm');
  await dialog.getByRole('button', { name: DMT.cancel }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByTestId(`dm-mode-${start}`)).toHaveClass(
    /mat-button-toggle-checked/
  );
  expect((await api.get('/system/data_masking')).mode).toBe(start);
});

test('access mirrors the server; a grant shows its expiry', async () => {
  await dismissToasts();
  await page.getByTestId('dm-tab-access').click();
  await expect(page.getByTestId('dm-access')).toBeVisible();
  const a = await api.get('/system/data_masking/access');
  const modeLabel: Record<string, string> = {
    none: DMT.access.none,
    selected: DMT.access.selected,
    all: DMT.access.allAdmins,
  };
  await expect(
    page.getByTestId('dm-admin-mode').locator('.mat-button-toggle-checked')
  ).toHaveText(modeLabel[a.admins.mode]);
  await expect(
    page.getByTestId('dm-ai-mode').locator('.mat-button-toggle-checked')
  ).toHaveText(a.ai === 'masked' ? DMT.access.aiMasked : DMT.access.aiSame);
  for (const r of a.roles) {
    const toggle = page.getByTestId(`dm-role-${r.role_id}`);
    await expect(toggle).toContainText(r.name);
    await expect(toggle.locator('button[role="switch"]')).toHaveAttribute(
      'aria-checked',
      String(r.enabled)
    );
  }
  const other = a.admins.available.find((x: any) => !x.you);
  if (!other || !(await api.get('/system/data_masking')).you.can_grant) {
    await shot('06-access');
    return;
  }
  // Selected: every available admin is listed; grant one for an hour.
  if (a.admins.mode !== 'selected') {
    await page
      .getByTestId('dm-admin-mode')
      .getByText(DMT.access.selected)
      .click();
  }
  const names = page.locator('.admins .admin-name');
  await expect(names).toHaveText(a.admins.available.map((x: any) => x.name));
  await page.getByTestId(`dm-admin-${other.admin_id}`).locator('input').check();
  await waitFor(
    () => api.get('/system/data_masking/access'),
    x => x.admins.grants.some((g: any) => g.admin_id === other.admin_id),
    'grant saved'
  );
  await page.getByLabel(`Access for ${other.name} lasts`).click();
  await page.getByRole('option', { name: DMT.access.durations['1h'] }).click();
  await waitFor(
    () => api.get('/system/data_masking/access'),
    x => {
      const g = x.admins.grants.find((y: any) => y.admin_id === other.admin_id);
      return (
        !!g?.expires_at && Date.parse(g.expires_at) - Date.now() < 3_700_000
      );
    },
    'grant re-timed to 1 hour'
  );
  await expect(page.locator('.admin.is-granted .until')).toBeVisible();
  await dismissToasts();
  await shot('06-access');
  // Put it back.
  await page
    .getByTestId(`dm-admin-${other.admin_id}`)
    .locator('input')
    .uncheck();
  await waitFor(
    () => api.get('/system/data_masking/access'),
    x => !x.admins.grants.some((g: any) => g.admin_id === other.admin_id),
    'grant revoked'
  );
  if (a.admins.mode !== 'selected') {
    await page
      .getByTestId('dm-admin-mode')
      .getByText(modeLabel[a.admins.mode], { exact: true })
      .click();
    await waitFor(
      () => api.get('/system/data_masking/access'),
      x => x.admins.mode === a.admins.mode,
      'admins mode restored'
    );
  }
});

test('access: another admin can take access away, never give it', async ({
  browser,
}) => {
  const a = await api.get('/system/data_masking/access');
  const me = a.admins.available.find((x: any) => x.you);
  const other = a.admins.available.find((x: any) => x.email === OTHER_EMAIL);
  const role = a.roles[0];
  test.skip(
    !me || !other || !role,
    'Needs a second admin (DM_OTHER_EMAIL, DM_OTHER_PASSWORD) and a role.'
  );
  // As the super admin: something for the other admin to tighten.
  await api.send('patch', '/system/data_masking/access', {
    admins: {
      mode: 'selected',
      grants: [
        { admin_id: me.admin_id, duration: '1h' },
        { admin_id: other.admin_id, duration: '8h' },
      ],
    },
    roles: [{ role_id: role.role_id, enabled: true, scope: 'all' }],
  });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    baseURL: test.info().project.use.baseURL,
  });
  const p2 = await ctx.newPage();
  const denied: string[] = [];
  p2.on('response', r => {
    if (r.status() >= 400 && /\/system\/data_masking/.test(r.url())) {
      denied.push(`${r.status()} ${r.request().method()} ${r.url()}`);
    }
  });
  const access = () => api.get('/system/data_masking/access');
  try {
    await login(p2, OTHER_EMAIL, OTHER_PASSWORD);
    await p2.goto(`${DM}?tab=access`);
    await expect(p2.getByTestId('dm-access-lock')).toBeVisible({
      timeout: 60_000,
    });
    const seg = (group: string, label: string) =>
      p2
        .getByTestId(group)
        .locator('mat-button-toggle')
        .filter({ hasText: label });
    await expect(seg('dm-admin-mode', DMT.access.allAdmins)).toHaveClass(
      /mat-button-toggle-disabled/
    );
    await expect(seg('dm-ai-mode', DMT.access.aiSame)).toHaveClass(
      /mat-button-toggle-disabled/
    );
    // Taking the super admin's own grant away is tightening.
    await p2.getByTestId(`dm-admin-${me.admin_id}`).locator('input').uncheck();
    await waitFor(
      access,
      x => !x.admins.grants.some((g: any) => g.admin_id === me.admin_id),
      'grant removed by the other admin'
    );
    // Narrowing a role's scope, then masking it again.
    await p2
      .getByRole('combobox', { name: `Real values ${role.name} sees` })
      .click();
    await expect(
      p2.getByRole('option', { name: DMT.access.scopeAll })
    ).not.toHaveAttribute('aria-disabled', 'true');
    await p2
      .getByRole('option', { name: DMT.access.scopeExceptRestricted })
      .click();
    await waitFor(
      access,
      x =>
        x.roles.find((r: any) => r.role_id === role.role_id)?.scope ===
        'except_restricted',
      'role narrowed'
    );
    // The panel is gone before the select is opened again.
    await expect(p2.getByRole('listbox')).toHaveCount(0);
    await p2
      .getByRole('combobox', { name: `Real values ${role.name} sees` })
      .click();
    await expect(
      p2.getByRole('option', { name: DMT.access.scopeAll })
    ).toHaveAttribute('aria-disabled', 'true');
    await p2.keyboard.press('Escape');
    await p2
      .getByTestId(`dm-role-${role.role_id}`)
      .locator('button[role="switch"]')
      .click();
    await waitFor(
      access,
      x => !x.roles.find((r: any) => r.role_id === role.role_id)?.enabled,
      'role masked again'
    );
    await expect(
      p2.getByTestId(`dm-role-${role.role_id}`).locator('button[role="switch"]')
    ).toBeDisabled();
    // And nobody at all.
    await seg('dm-admin-mode', DMT.access.none).click();
    await waitFor(
      access,
      x => x.admins.mode === 'none',
      'admins set to no one'
    );
    await expect(seg('dm-admin-mode', DMT.access.selected)).toHaveClass(
      /mat-button-toggle-disabled/
    );
    expect(denied, denied.join('\n')).toEqual([]);
  } finally {
    await ctx.close();
    await api.send('patch', '/system/data_masking/access', {
      admins: snap.admins,
      ai: snap.ai,
      roles: [
        { role_id: role.role_id, enabled: role.enabled, scope: role.scope },
      ],
    });
  }
});

test('masks mirror the server', async () => {
  await dismissToasts();
  await page.getByTestId('dm-tab-masks').click();
  await expect(page.getByTestId('dm-masks')).toBeVisible();
  const masks = (await api.get('/system/data_masking/mask')).resource;
  const tiers = [...new Set(masks.map((x: any) => x.tier))];
  await expect(page.locator('.masks .tier-head')).toHaveText(
    tiers.map(t => new RegExp(DMT.tiers[t as string]))
  );
  for (const mk of masks) {
    await expect(page.getByTestId(`dm-format-${mk.class}`)).toContainText(
      DMT.formats[mk.format]
    );
  }
  // The options are exactly the formats the server allows.
  const email = masks.find((x: any) => x.class === 'email');
  await page.getByTestId('dm-format-email').click();
  await expect(page.getByRole('option')).toHaveText(
    email.formats_allowed.map((f: string) => DMT.formats[f])
  );
  await page.keyboard.press('Escape');
  await shot('07-masks');
});

test('detection: built-in pack, rules and a live rule test', async () => {
  await dismissToasts();
  await page.getByTestId('dm-tab-detection').click();
  await expect(page.getByTestId('dm-detection')).toBeVisible();
  const [builtin, rules] = await Promise.all([
    api.get('/system/data_masking/rule/builtin'),
    api.get('/system/data_masking/rule'),
  ]);
  await expect(page.getByTestId('dm-builtin')).toContainText(
    `${builtin.ruleset} ${builtin.version}`
  );
  await expect(
    page.locator('.rules .row:not(.head-row) code.pattern')
  ).toHaveText(rules.resource.map((r: any) => r.pattern));
  await page.getByTestId('dm-builtin').click();
  for (const c of builtin.classes.slice(0, 6)) {
    const row = page
      .locator('.bi-row')
      .filter({
        has: page.locator('.bi-cls', { hasText: DMT.classes[c.class] }),
      })
      .first();
    await expect(row.locator('.det')).toHaveText(c.detectors);
  }
  await page.getByTestId('dm-builtin').click();

  if (rules.resource.length) await shot('08b-detection-rules', { top: true });
  await page.getByTestId('dm-add-rule').click();
  const pattern = '(^|_)(dob|birth_?date|date_of_birth)$';
  const test = await api.send('post', '/system/data_masking/rule/test', {
    match: 'name',
    pattern,
  });
  await page.getByTestId('dm-rule-pattern').fill(pattern);
  const n = test.matches.length;
  await expect(page.getByTestId('dm-rule-preview')).toContainText(
    `Matches ${n} column${n === 1 ? '' : 's'}`,
    { timeout: 15_000 }
  );
  await page.getByTestId('dm-rule-class').click();
  await page
    .getByRole('option', { name: DMT.classes.date_of_birth, exact: true })
    .click();
  await shot('08-detection-rule');
  await page
    .locator('mat-dialog-container')
    .getByRole('button', { name: DMT.cancel })
    .click();
  await expect(page.locator('mat-dialog-container')).toHaveCount(0);
  expect((await api.get('/system/data_masking/rule')).resource).toEqual(
    rules.resource
  );
});

test('activity mirrors the server, newest first', async () => {
  await dismissToasts();
  // In Preview, an app reading a covered table leaves a "would mask" row.
  const o = await api.get('/system/data_masking');
  if (o.mode === 'preview' && PREVIEW_KEY) {
    const res = await page.request.get(PREVIEW_PATH, {
      headers: { 'X-DreamFactory-API-Key': PREVIEW_KEY },
    });
    expect(res.status(), `GET ${PREVIEW_PATH} with the app key`).toBe(200);
    expect(res.headers()['x-dreamfactory-masking']).toBe('preview');
    await res.dispose();
  }
  await page.getByTestId('dm-tab-activity').click();
  await expect(page.getByTestId('dm-activity')).toBeVisible();
  const act = (await api.get('/system/data_masking/activity')).resource;
  if (act.some((e: any) => e.kind === 'preview')) {
    await expect(
      page.getByTestId('dm-activity').getByRole('button', {
        name: DMT.activity.filters.preview,
        exact: true,
      })
    ).toBeVisible();
  }
  expect(act.length).toBeGreaterThan(0);
  const shown = act.slice(0, 30);
  const events = page.locator('.event');
  await expect(events.locator('.text'))
    .toHaveText(
      shown.map(
        (e: any) =>
          new RegExp(
            `^\\s*${(e.text + (e.target ? ` ${e.target}` : '')).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+')}\\s*$`
          )
      ),
      { useInnerText: true }
    )
    .catch(async () => {
      // Long lists render in full; compare the leading rows only.
      const texts = (await events.locator('.text').allInnerTexts()).slice(
        0,
        shown.length
      );
      expect(texts.map(t => t.replace(/\s+/g, ' ').trim())).toEqual(
        shown.map((e: any) => `${e.text}${e.target ? ` ${e.target}` : ''}`)
      );
    });
  const actors = (await events.locator('.actor').allInnerTexts()).slice(
    0,
    shown.length
  );
  expect(actors).toEqual(shown.map((e: any) => e.actor));
  // Kind filters narrow the list to their kinds.
  await page
    .getByTestId('dm-activity')
    .getByRole('button', { name: DMT.activity.filters.scans, exact: true })
    .click();
  // Each kind is read from the server (kind=…), so wait for its page.
  const scans = act.filter((e: any) => e.kind === 'scan').slice(0, 30);
  await expect
    .poll(async () =>
      (await events.locator('.text').allInnerTexts())
        .slice(0, scans.length)
        .map(t => t.replace(/\s+/g, ' ').trim())
    )
    .toEqual(
      scans.map((e: any) => `${e.text}${e.target ? ` ${e.target}` : ''}`)
    );
  await expect(page.locator('.event:not(.is-scan)')).toHaveCount(0);
  await page
    .getByTestId('dm-activity')
    .getByRole('button', { name: DMT.activity.filters.all, exact: true })
    .click();
  await shot('09-activity');
});

test('compliance: rail scores and grouping match the server', async () => {
  await page.goto(CP);
  await expect(page.getByTestId('cp-detail')).toBeVisible({ timeout: 60_000 });
  const list = (await api.get('/system/security_baseline')).resource;
  expect(list.map((b: any) => b.id)).toEqual([
    'hipaa',
    'pci_dss',
    'glba',
    'cjis',
    'gdpr',
    'soc2',
    'iso27001',
  ]);
  for (const b of list) {
    const row = page.getByTestId(`cp-rail-${b.id}`);
    await expect(row.locator('.rail-name')).toHaveText(b.name);
    await expect(row.locator('.rail-score')).toHaveText(
      `${b.score.pass}/${b.score.pass + b.score.fail}`
    );
    await expect(row.locator('.rail-tracking')).toHaveCount(b.adopted ? 1 : 0);
  }
  await expect(page.locator('.rail-vertical')).toHaveText(
    [...new Set(list.map((b: any) => b.vertical))].map(
      v => new RegExp(CPT.verticals[v as string])
    )
  );
  await expect(page.locator('#cp-title')).toHaveText(
    `${(list.find((b: any) => b.adopted) ?? list[0]).name} baseline`
  );
  await shot('10-compliance-list');
});

test('compliance: every Fix link opens a real admin page', async () => {
  const list = (await api.get('/system/security_baseline')).resource;
  const routes = new Set<string>();
  for (const b of list) {
    const d = await api.get(`/system/security_baseline/${b.id}`);
    for (const c of d.controls) {
      if (c.fix?.kind === 'link' && c.fix.route) routes.add(c.fix.route);
    }
  }
  expect(routes.size).toBeGreaterThan(0);
  for (const route of routes) {
    const [path] = route.split('?');
    await page.goto(`/dreamfactory/dist/#${route}`);
    // Unknown routes bounce to home; a real one stays and paints a page.
    await page.waitForTimeout(1500);
    expect(page.url(), route).toContain(path);
    await expect(page.locator('df-paywall')).toHaveCount(0);
    await expect(
      page.locator('mat-sidenav-content, main').first()
    ).toBeVisible();
  }
  await page.goto(CP);
  await expect(page.getByTestId('cp-detail')).toBeVisible({ timeout: 60_000 });
});

test('compliance: every HIPAA check is the server check', async () => {
  await page.getByTestId('cp-rail-gdpr').click();
  await expect(page).toHaveURL(/baseline=gdpr/);
  await page.getByTestId('cp-rail-hipaa').click();
  await expect(page).toHaveURL(/baseline=hipaa/);
  const d = await api.get('/system/security_baseline/hipaa');
  await expect(page.locator('#cp-title')).toHaveText(`${d.name} baseline`);
  const pass = d.controls.filter((c: any) => c.status === 'pass').length;
  const fail = d.controls.filter((c: any) => c.status === 'fail').length;
  await expect(page.getByTestId('cp-score')).toHaveText(
    new RegExp(`${pass}\\s+of ${pass + fail}`)
  );
  const manual = d.controls.filter((c: any) => c.status === 'manual');
  if (manual.length) {
    await expect(page.getByTestId('cp-manual-toggle')).toContainText(
      String(manual.length)
    );
    await page.getByTestId('cp-manual-toggle').click();
  }
  for (const c of d.controls) {
    const row = page.getByTestId(`cp-control-${c.id}`);
    await expect(row).toHaveClass(new RegExp(`is-${c.status}`));
    await expect(row.locator('.c-title')).toHaveText(c.title);
    await expect(row.locator('.ref')).toHaveText(c.refs);
    await expect(row.locator('.c-detail')).toHaveCount(
      c.detail && c.status !== 'pass' ? 1 : 0
    );
    if (c.detail && c.status !== 'pass') {
      await expect(row.locator('.c-detail')).toHaveText(c.detail);
    }
    // Every failing check DreamFactory can fix has one action: a link to
    // the page that fixes it, or Apply (a button).
    const linked = c.status === 'fail' && c.fix?.kind === 'link' && c.fix.route;
    const applies = c.status === 'fail' && c.fix?.kind === 'apply';
    await expect(row.getByTestId('cp-fix')).toHaveCount(
      linked || applies ? 1 : 0
    );
    if (linked) {
      const [path] = c.fix.route.split('?');
      const href = await row.getByTestId('cp-fix').getAttribute('href');
      expect(href ?? '').toContain(path);
    }
  }
  // "Masking is on" failing after a scan: its Fix opens Apply with turning
  // masking on already ticked, listing what Apply with masking on changes.
  const modeCheck = d.controls.find(
    (c: any) => c.id === 'masking.mode' && c.status === 'fail'
  );
  const ov = await api.get('/system/data_masking');
  if (modeCheck?.fix?.kind === 'apply' && ov.scan.finished_at) {
    const fix = page
      .getByTestId('cp-control-masking.mode')
      .getByTestId('cp-fix');
    expect(await fix.evaluate(e => e.tagName)).toBe('BUTTON');
    await fix.click();
    const dialog = page.locator('mat-dialog-container');
    await expect(
      dialog.getByTestId('cp-apply-turn-on').locator('input')
    ).toBeChecked();
    const on = await api.get(`/system/security_baseline/${d.id}?mode=on`);
    await expect
      .poll(async () =>
        (
          await dialog
            .getByTestId('cp-apply-changes')
            .locator('li')
            .allInnerTexts()
        ).map(t => t.trim())
      )
      .toEqual(on.changes.map((c: any) => c.text));
    await dialog.getByTestId('cp-apply-cancel').click();
    await expect(dialog).toHaveCount(0);
    expect((await api.get('/system/data_masking')).mode).toBe(ov.mode);
  }
  await shot('11-compliance-hipaa', { height: 1240 });
  // The review queue's Fix opens Data Masking on the Review filter.
  const review = d.controls.find(
    (c: any) => c.id === 'masking.review' && c.status === 'fail'
  );
  if (review) {
    await page
      .getByTestId('cp-control-masking.review')
      .getByTestId('cp-fix')
      .click();
    await expect(page.getByTestId('dm-filter-review')).toHaveAttribute(
      'aria-pressed',
      'true',
      { timeout: 30_000 }
    );
    await expect(page).not.toHaveURL(/filter=/);
    await page.goBack();
    await expect(page.locator('#cp-title')).toHaveText(`${d.name} baseline`, {
      timeout: 30_000,
    });
  }
});

test('compliance: Apply lists exactly the server changes', async () => {
  await dismissToasts();
  const id = APPLY_BASELINE;
  await page.getByTestId(`cp-rail-${id}`).click();
  const [before, beforeOn, o] = await Promise.all([
    api.get(`/system/security_baseline/${id}`),
    api.get(`/system/security_baseline/${id}?mode=on`),
    api.get('/system/data_masking'),
  ]);
  await expect(page.locator('#cp-title')).toHaveText(`${before.name} baseline`);
  test.skip(
    before.adopted && !before.changes.length,
    'Already tracked with nothing to change.'
  );
  await page.getByTestId('cp-apply').click();
  const dialog = page.locator('mat-dialog-container');
  await expect(dialog).toBeVisible();
  const listed = async () =>
    (
      await dialog.getByTestId('cp-apply-changes').locator('li').allInnerTexts()
    ).map(s => s.trim());
  if (before.changes.length) {
    expect(await listed()).toEqual(before.changes.map((c: any) => c.text));
  } else {
    await expect(dialog.getByTestId('cp-apply-none')).toBeVisible();
  }
  if (o.mode !== 'on' && o.scan?.finished_at) {
    // Turning masking on (offered once a scan has finished) lists what
    // Apply with mode on would change.
    await dialog.getByTestId('cp-apply-turn-on').locator('input').check();
    await expect.poll(listed).toEqual(beforeOn.changes.map((c: any) => c.text));
    await shot('12-compliance-apply-confirm');
    await dialog.getByTestId('cp-apply-turn-on').locator('input').uncheck();
    await expect
      .poll(async () =>
        before.changes.length
          ? listed()
          : (await dialog.getByTestId('cp-apply-none').count()) === 1
      )
      .toEqual(
        before.changes.length ? before.changes.map((c: any) => c.text) : true
      );
  } else {
    await shot('12-compliance-apply-confirm');
  }
  if (!APPLY) {
    await dialog.getByTestId('cp-apply-cancel').click();
    return;
  }
  await dialog.getByTestId('cp-apply-confirm').click();
  await expect(page.getByTestId('cp-tracking')).toBeVisible();
  const after = await waitFor(
    () => api.get(`/system/security_baseline/${id}`),
    b => b.adopted === true,
    'baseline adopted'
  );
  // Exactly the listed changes were made: nothing is left to change.
  expect(after.changes).toEqual([]);
  // Apply stays only while a check Apply fixes still fails (masking.mode
  // needs Apply with masking turned on).
  const fixable = after.controls.some(
    (c: any) => c.status === 'fail' && c.fix?.kind === 'apply'
  );
  await expect(page.getByTestId('cp-apply')).toHaveCount(fixable ? 1 : 0);
  const rules = (await api.get('/system/data_masking/rule')).resource;
  const added = before.changes.filter((c: any) => c.id.startsWith('rule:'));
  expect(
    rules.filter((r: any) => r.source === `baseline:${id}`).length
  ).toBeGreaterThanOrEqual(added.length);
  expect((await api.get('/system/data_masking')).mode).toBe(o.mode);

  // Evidence export: byte-for-byte the server's report.
  for (const format of ['json', 'csv'] as const) {
    await dismissToasts();
    await page.getByTestId('cp-export').click();
    const dl = page.waitForEvent('download');
    await page.getByTestId(`cp-export-${format}`).click();
    const file = await dl;
    const text = readFileSync(await file.path(), 'utf8');
    if (format === 'json') {
      const report = JSON.parse(text);
      expect(report.baseline?.id ?? report.baseline).toBeTruthy();
      expect(text).not.toMatch(/"generatedAt"/);
      for (const c of after.controls) expect(text).toContain(c.id);
    } else {
      expect(text.trim().split(/\r?\n/).length).toBeGreaterThan(
        after.controls.length
      );
    }
  }
  // Stop tracking: settings stay.
  if (!snap.adopted?.includes(id)) {
    await page.getByTestId('cp-stop').click();
    await expect(page.getByTestId('cp-tracking')).toHaveCount(0);
    await waitFor(
      () => api.get(`/system/security_baseline/${id}`),
      b => b.adopted === false,
      'stopped tracking'
    );
  }
});

test('narrow screens: columns and compliance at 390 px', async () => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openDataMasking();
  await expect(page.locator('.table-select')).toBeVisible();
  await expect(
    page.locator('.list [data-testid="dm-row"]').first()
  ).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth
  );
  expect(overflow).toBeLessThanOrEqual(0);
  await shot('13-mobile-columns-390');
  await page.goto(`${CP}?baseline=hipaa`);
  await expect(page.getByTestId('cp-select')).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('#cp-title')).toHaveText('HIPAA baseline');
  const overflow2 = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth
  );
  expect(overflow2).toBeLessThanOrEqual(0);
  await shot('14-mobile-compliance-390');
  await page.setViewportSize({ width: 1440, height: 900 });
});

test('no feature API errors and no page errors along the way', async () => {
  expect(featureErrors, featureErrors.join('\n')).toEqual([]);
  expect(pageErrors, pageErrors.join('\n')).toEqual([]);
});

test('open source: Data Masking and Compliance show the paywall', async ({
  browser,
}) => {
  test.skip(!OSS_URL, 'Set DM_OSS_BASE_URL to an admin UI on open source.');
  const oss = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    baseURL: OSS_URL,
  });
  try {
    await login(oss, OSS_EMAIL, OSS_PASSWORD);
    for (const [url, name] of [
      [DM, 'Data Masking'],
      [CP, 'Compliance'],
    ]) {
      await oss.goto(url);
      await expect(oss.locator('df-paywall')).toBeVisible({ timeout: 60_000 });
      await expect(oss.getByTestId('dm-mode')).toHaveCount(0);
      await expect(oss.getByTestId('cp-detail')).toHaveCount(0);
      await expect(oss.locator('df-paywall')).toContainText(/\S/);
      if (SCREENS) {
        await oss.addStyleTag({
          content:
            '[id^="intercom"], .intercom-lightweight-app, iframe[name^="intercom"] { display: none !important; }',
        });
        await oss.mouse.move(2, 2);
        await oss.waitForTimeout(600);
        await oss.screenshot({
          path: join(
            SCREENS,
            name === 'Data Masking'
              ? '15-oss-paywall.png'
              : '15b-oss-paywall-compliance.png'
          ),
          caret: 'hide',
        });
      }
    }
  } finally {
    await oss.close();
  }
});
