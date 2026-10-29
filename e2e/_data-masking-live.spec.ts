/**
 * Data Masking + Compliance, end to end against a REAL df-masking backend
 * (no page.route mocks). One serial journey on one page:
 *
 *   login -> first-run scan (or note it already ran) -> review decision ->
 *   mode change with confirm -> admin access grant -> mask format change ->
 *   rule test / add / delete -> activity -> compliance apply + export.
 *
 * Every assertion that matters is checked twice: on screen, and against the
 * system API (/api/v2/system/data_masking, /system/security_baseline).
 *
 * Shared-stack discipline: the journey snapshots what it touches and puts
 * it back in afterAll (mode, admin access, AI switch, the email mask
 * format, its probe rule, baseline tracking). What it cannot undo, by
 * design of the product: a review decision is sticky (it only ever keeps a
 * column masked), and Apply's tightening (rules/formats a baseline adds)
 * stays. The first scan, when it runs here, is the instance's first scan.
 *
 *   PLAYWRIGHT_BASE_URL=http://127.0.0.1:4300 \
 *     npx playwright test -c e2e/_data-masking-live.config.ts
 */
import {
  APIRequestContext,
  Browser,
  Page,
  expect,
  test,
} from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { ADMIN_EMAIL, ADMIN_PASSWORD } from './fixtures/admin-login';

const EMAIL = ADMIN_EMAIL;
const PASSWORD = ADMIN_PASSWORD;
const BASELINE = process.env['DM_LIVE_BASELINE'] ?? 'gdpr';
const EVIDENCE = process.env['DM_LIVE_EVIDENCE_DIR'] ?? '';
const SCAN_TIMEOUT = Number(
  process.env['DM_LIVE_SCAN_TIMEOUT_MS'] ?? 20 * 60_000
);

const DM = '/dreamfactory/dist/#/api-security/data-masking';
const CP = '/dreamfactory/dist/#/api-security/compliance';
/** A name rule that matches no real column. */
const PROBE = `^dm_e2e_probe_${Date.now().toString(36)}$`;

if (EVIDENCE) mkdirSync(EVIDENCE, { recursive: true });

/* eslint-disable @typescript-eslint/no-explicit-any */

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
/** Responses >= 400 from the two feature APIs during the journey. */
const featureErrors: string[] = [];
const pageErrors: string[] = [];

/** What the journey found, for afterAll to put back. */
const snap: {
  mode?: string;
  admins?: { mode: string; grants: { admin_id: number }[] };
  ai?: string;
  emailFormat?: string;
  baselineAdopted?: boolean;
} = {};

async function evidence(name: string) {
  if (!EVIDENCE) return;
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(EVIDENCE, `${name}.png`), caret: 'hide' });
}

async function overview() {
  return api.get('/system/data_masking');
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

/** Opens one table of one database in the Columns tab (current filter). */
async function openTable(service: string, table: string) {
  const o = await overview();
  const label =
    o.coverage.covered.find((c: any) => c.service === service)?.label ??
    service;
  await page
    .locator('.rail-group')
    .filter({ has: page.locator('.rail-service', { hasText: label }) })
    .getByTestId('dm-rail-row')
    .filter({
      has: page.locator('.rail-name', {
        hasText: new RegExp(
          `^${table.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`
        ),
      }),
    })
    .click();
  await expect(page.locator('.list-title')).toHaveText(table);
}

const colRow = (column: string) =>
  page
    .locator('.list [data-testid="dm-row"]')
    .filter({ has: page.locator('.c-name code', { hasText: column }) })
    .first();

async function dismissToasts() {
  await page
    .locator('mat-snack-bar-container')
    .evaluateAll(els =>
      els.forEach(e => ((e as HTMLElement).style.display = 'none'))
    );
}

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
    const u = r.url();
    if (
      r.status() >= 400 &&
      /\/system\/(data_masking|security_baseline)/.test(u)
    ) {
      featureErrors.push(`${r.status()} ${r.request().method()} ${u}`);
    }
  });
  api = await Api.login(page.request);
  const [o, access, masks, b] = await Promise.all([
    overview(),
    api.get('/system/data_masking/access'),
    api.get('/system/data_masking/mask'),
    api.get(`/system/security_baseline/${BASELINE}`),
  ]);
  snap.mode = o.mode;
  snap.admins = {
    mode: access.admins.mode,
    grants: access.admins.grants.map((g: any) => ({ admin_id: g.admin_id })),
  };
  snap.ai = access.ai;
  snap.emailFormat = masks.resource.find(
    (m: any) => m.class === 'email'
  )?.format;
  snap.baselineAdopted = !!b.adopted;
});

test.afterAll(async () => {
  // Nothing was snapshotted (or changed) without a session.
  if (!api) {
    await page?.close();
    return;
  }
  // Best effort, each on its own: never leave the shared stack changed.
  const tries: Promise<unknown>[] = [];
  const attempt = (fn: () => Promise<unknown>) =>
    tries.push(fn().catch(e => console.warn('restore failed:', String(e))));
  attempt(async () => {
    const rules = await api.get('/system/data_masking/rule');
    for (const r of rules.resource.filter((x: any) => x.pattern === PROBE)) {
      await api.send('delete', `/system/data_masking/rule/${r.id}`);
    }
  });
  if (snap.emailFormat) {
    attempt(() =>
      api.send('patch', '/system/data_masking/mask', {
        resource: [{ class: 'email', format: snap.emailFormat }],
      })
    );
  }
  if (snap.admins) {
    attempt(() =>
      api.send('patch', '/system/data_masking/access', {
        admins: snap.admins,
        ai: snap.ai,
      })
    );
  }
  if (snap.mode) {
    attempt(() =>
      api.send('patch', '/system/data_masking', { mode: snap.mode })
    );
  }
  if (snap.baselineAdopted === false) {
    attempt(async () => {
      const b = await api.get(`/system/security_baseline/${BASELINE}`);
      if (b.adopted) {
        await api.send('delete', `/system/security_baseline/${BASELINE}`);
      }
    });
  }
  await Promise.all(tries);
  await page?.close();
});

test('login opens Data Masking (GOLD)', async () => {
  await page.context().clearCookies();
  await page.goto('/dreamfactory/dist/#/auth/login');
  const email = page.locator('input').first();
  await expect(email).toBeVisible({ timeout: 30_000 });
  await email.fill(EMAIL);
  await page.locator('input').nth(1).fill(PASSWORD);
  const login = page.waitForResponse(
    r =>
      r.url().includes('/api/v2/system/admin/session') &&
      r.request().method() === 'POST'
  );
  await page.getByRole('button', { name: /^login$/i }).click();
  expect((await login).ok()).toBe(true);
  await page.waitForURL(u => !u.toString().includes('/auth/login'), {
    timeout: 30_000,
  });
  await openDataMasking();
  await expect(page.locator('df-paywall')).toHaveCount(0);
});

test('first run: one scan, then Preview without a reload', async () => {
  const o = await overview();
  const neverScanned =
    !o.scan.finished_at && o.scan.columns === 0 && o.scan.status !== 'running';
  if (neverScanned) {
    await expect(page.getByTestId('dm-no-scan')).toBeVisible();
    await expect(page.getByTestId('dm-first-run-baselines')).toBeVisible();
    // Masking off and nothing scanned: the page leads with the scan; the
    // mode control waits (Off stays reachable if masking was left on).
    if (o.mode === 'off') {
      await expect(page.getByTestId('dm-mode')).toHaveCount(0);
    } else {
      await expect(
        page.getByTestId('dm-mode-off').locator('button')
      ).toBeEnabled();
      await expect(
        page.getByTestId('dm-mode-on').locator('button')
      ).toBeDisabled();
    }
    await evidence('01-first-run');
    await page.getByTestId('empty-state-action').click();
    await expect(page.getByTestId('dm-first-scan')).toBeVisible();
    await evidence('02-first-scan-running');
  } else {
    test.info().annotations.push({
      type: 'note',
      description: `Already scanned (finished_at=${o.scan.finished_at}); the never-scanned state cannot be shown on this instance.`,
    });
  }
  // Whatever started the scan, the page follows it to the end, live.
  await expect(page.getByTestId('dm-search')).toBeVisible({
    timeout: SCAN_TIMEOUT,
  });
  const after = await waitFor(
    overview,
    v => v.scan.status !== 'running' && !!v.scan.finished_at,
    'scan finished',
    SCAN_TIMEOUT
  );
  expect(after.scan.columns).toBeGreaterThan(0);
  if (neverScanned && o.mode === 'off') {
    // The server moves Off -> Preview after the first scan ever.
    expect(after.mode).toBe('preview');
    await expect(page.getByTestId('dm-mode-preview')).toHaveClass(
      /mat-button-toggle-checked/
    );
  }
  // Header counts are the server's, disjoint: masked, then to review.
  await expect(page.getByTestId('dm-count-masked')).toContainText(
    String(after.counts.masked)
  );
  snap.mode = after.mode;
  await evidence('03-scanned');
});

/**
 * Review decisions are made on purpose, not on whatever row comes first:
 * free-text clinical notes in a patient table stay masked, and a sign-up
 * date the value shapes mistook for a birth date is marked not sensitive
 * (its Undo is tried, then the decision is made again). Override with
 * DM_LIVE_KEEP / DM_LIVE_CLEAR (service.table.column).
 */
const KEEP_ID =
  process.env['DM_LIVE_KEEP'] ?? 'crm.patient_encounters.clinical_notes';
const CLEAR_ID = process.env['DM_LIVE_CLEAR'] ?? 'crm.clientes.fecha_alta';

async function column(id: string): Promise<any> {
  const [service] = id.split('.');
  const r = await api.get(
    `/system/data_masking/column?service=${encodeURIComponent(service)}`
  );
  return r.resource.find((c: any) => c.id === id);
}

test('review: deliberate decisions (keep notes masked, a sign-up date is not a birth date)', async () => {
  const before = await overview();
  const [keep, clear] = await Promise.all([column(KEEP_ID), column(CLEAR_ID)]);
  test.skip(
    keep?.verdict !== 'review' || clear?.verdict !== 'review',
    `${KEEP_ID} and ${CLEAR_ID} are not both waiting for review here.`
  );
  // Column decisions go out with the id in the body (any column name works).
  const decisions: { url: string; body: any }[] = [];
  const onRequest = (r: any) => {
    if (
      r.method() === 'PATCH' &&
      /\/system\/data_masking\/column/.test(r.url())
    ) {
      decisions.push({ url: r.url(), body: r.postDataJSON() });
    }
  };
  page.on('request', onRequest);
  try {
    await dismissToasts();
    await page.getByTestId('dm-filter-review').click();

    // 1. Clinical notes: free text about patients stays masked.
    await openTable(keep.service, keep.table);
    await colRow(keep.column).getByTestId('dm-keep').click();
    await expect(colRow(keep.column).getByTestId('dm-decided')).toBeVisible();
    const kept = await waitFor(
      () => column(KEEP_ID),
      c => c.verdict === 'masked' && c.source === 'admin',
      `${KEEP_ID} kept masked by the admin`
    );
    expect(kept.class).toBe(keep.class);

    // 2. fecha_alta is when the customer signed up: not sensitive.
    await openTable(clear.service, clear.table);
    await colRow(clear.column).getByTestId('dm-clear').click();
    const toast = page.locator('df-dm-undo-toast');
    await expect(toast).toContainText(`${clear.column} marked not sensitive`);
    await waitFor(
      () => column(CLEAR_ID),
      c => c.verdict === 'clear' && c.source === 'admin',
      `${CLEAR_ID} marked not sensitive`
    );
    // Undo masks it again with the class it had...
    await toast.getByTestId('dm-undo').click();
    await waitFor(
      () => column(CLEAR_ID),
      c => c.verdict === 'masked' && c.class === clear.class,
      `${CLEAR_ID} masked again by Undo`
    );
    // ...and the admin then makes the decision that is actually right.
    await page.getByTestId('dm-filter-all').click();
    await openTable(clear.service, clear.table);
    await colRow(clear.column).getByTestId('dm-class-chip').click();
    await page.getByTestId('dm-class-none').click();
    await waitFor(
      () => column(CLEAR_ID),
      c => c.verdict === 'clear' && c.source === 'admin',
      `${CLEAR_ID} not sensitive again`
    );
    await waitFor(
      overview,
      v => v.counts.review === before.counts.review - 2,
      'review count went down by two'
    );
    await dismissToasts();
    await evidence('04-review-decided');
    expect(decisions.length).toBeGreaterThanOrEqual(4);
    for (const d of decisions) {
      expect(d.body?.id, d.url).toMatch(/^[^.]+\.[^.]+\..+$/);
      expect(new URL(d.url).pathname).toMatch(
        /\/system\/data_masking\/column$/
      );
    }
  } finally {
    page.off('request', onRequest);
  }
});

test('mode: On asks first with the real numbers, then back', async () => {
  await dismissToasts();
  const start = (await overview()).mode as string;
  // Confirms come whenever masking is added or removed: turning On, and
  // leaving On (for Preview or Off). Preview and Off swap without one.
  const go = async (mode: string, confirm: boolean) => {
    await page.getByTestId(`dm-mode-${mode}`).click();
    if (confirm) {
      await expect(page.getByTestId('dm-confirm-ok')).toBeVisible();
      await page.getByTestId('dm-confirm-ok').click();
    } else {
      await expect(page.getByTestId('dm-confirm-ok')).toHaveCount(0);
    }
    await expect(page.getByTestId(`dm-mode-${mode}`)).toHaveClass(
      /mat-button-toggle-checked/
    );
    await waitFor(overview, v => v.mode === mode, `mode is ${mode}`);
  };
  if (start === 'on') await go('preview', true);
  await page.getByTestId('dm-mode-on').click();
  const dialog = page.locator('mat-dialog-container');
  await expect(dialog).toContainText('Turn on masking?');
  await expect(dialog).toContainText(/\d+ columns? in \d+ databases?/);
  await evidence('05-mode-on-confirm');
  await page.getByTestId('dm-confirm-ok').click();
  await expect(page.getByTestId('dm-mode-on')).toHaveClass(
    /mat-button-toggle-checked/
  );
  await waitFor(overview, v => v.mode === 'on', 'mode is on');
  // Restore what the journey started from.
  if (start === 'preview') await go('preview', true);
  if (start === 'off') await go('off', true);
});

test('access: grant an admin real values, re-time it, revoke it', async () => {
  await dismissToasts();
  const access = await api.get('/system/data_masking/access');
  const other = access.admins.available.find((a: any) => !a.you);
  test.skip(!other, 'No second admin on this instance');
  const canGrant = (await overview()).you.can_grant;
  test.skip(!canGrant, 'Signed-in admin cannot give access (not super admin)');
  await page.getByTestId('dm-tab-access').click();
  await expect(page.getByTestId('dm-access')).toBeVisible();
  await expect(page.getByTestId('dm-access-lock')).toHaveCount(0);
  if (access.admins.mode !== 'selected') {
    await page.getByTestId('dm-admin-mode').getByText('Selected').click();
    await waitFor(
      () => api.get('/system/data_masking/access'),
      a => a.admins.mode === 'selected',
      'admins mode selected'
    );
  }
  const box = page.getByTestId(`dm-admin-${other.admin_id}`).locator('input');
  await box.check();
  const granted = await waitFor(
    () => api.get('/system/data_masking/access'),
    a => a.admins.grants.some((g: any) => g.admin_id === other.admin_id),
    'grant saved'
  );
  const g8 = granted.admins.grants.find(
    (g: any) => g.admin_id === other.admin_id
  );
  // New grants default to 8 hours.
  expect(g8.expires_at).not.toBeNull();
  expect(Date.parse(g8.expires_at) - Date.now()).toBeLessThanOrEqual(
    8 * 3_600_000 + 120_000
  );
  await page.getByLabel(`Access for ${other.name} lasts`).click();
  await page.getByRole('option', { name: '1 hour' }).click();
  await waitFor(
    () => api.get('/system/data_masking/access'),
    a => {
      const g = a.admins.grants.find((x: any) => x.admin_id === other.admin_id);
      return (
        !!g?.expires_at &&
        Date.parse(g.expires_at) - Date.now() <= 3_600_000 + 120_000
      );
    },
    'grant re-timed to 1 hour'
  );
  await dismissToasts();
  await evidence('06-access-granted');
  await box.uncheck();
  await waitFor(
    () => api.get('/system/data_masking/access'),
    a => !a.admins.grants.some((g: any) => g.admin_id === other.admin_id),
    'grant revoked'
  );
  if (snap.admins && snap.admins.mode !== 'selected') {
    const label = { none: 'No one', all: 'All admins' }[snap.admins.mode];
    if (label) {
      await page.getByTestId('dm-admin-mode').getByText(label).click();
      await waitFor(
        () => api.get('/system/data_masking/access'),
        a => a.admins.mode === snap.admins!.mode,
        'admins mode restored'
      );
    }
  }
});

test('masks: changing a format re-renders the example and the columns', async () => {
  await dismissToasts();
  await page.getByTestId('dm-tab-masks').click();
  await expect(page.getByTestId('dm-masks')).toBeVisible();
  const from = snap.emailFormat ?? 'token';
  const to = from === 'initial' ? 'token' : 'initial';
  const label = { initial: 'First letter', token: 'Token' }[to];
  await page.getByTestId('dm-format-email').click();
  await page.getByRole('option', { name: label }).click();
  await waitFor(
    () => api.get('/system/data_masking/mask'),
    m => m.resource.find((x: any) => x.class === 'email')?.format === to,
    `email masked as ${to}`
  );
  // Stored examples follow the class format on the server too.
  const cols = await waitFor(
    () => api.get('/system/data_masking/column?service=crm'),
    c =>
      c.resource
        .filter((x: any) => x.class === 'email' && x.verdict !== 'clear')
        .every((x: any) => x.format === to),
    'email columns report the new format'
  );
  const emails = cols.resource.filter(
    (x: any) => x.class === 'email' && x.verdict !== 'clear' && x.example
  );
  for (const e of emails) {
    if (to === 'token')
      expect(e.example).toMatch(/^[A-Z][A-Z0-9]*_[0-9a-f]{8}$/);
    else expect(e.example).toContain('•');
  }
  await dismissToasts();
  await evidence('07-masks-email-changed');
  // Back to what it was.
  const back =
    { initial: 'First letter', token: 'Token', redact: 'Redact', null: 'Null' }[
      from
    ] ?? from;
  await page.getByTestId('dm-format-email').click();
  await page.getByRole('option', { name: back, exact: true }).click();
  await waitFor(
    () => api.get('/system/data_masking/mask'),
    m => m.resource.find((x: any) => x.class === 'email')?.format === from,
    'email format restored'
  );
});

test('detection: live rule test, add a rule, delete it', async () => {
  await dismissToasts();
  await page.getByTestId('dm-tab-detection').click();
  await expect(page.getByTestId('dm-detection')).toBeVisible();
  await page.getByTestId('dm-add-rule').click();
  const pattern = page.getByTestId('dm-rule-pattern');
  // A pattern that matches real columns: the preview counts them live.
  await pattern.fill('e_?mail');
  await expect(page.getByTestId('dm-rule-preview')).toContainText(
    /Matches (at least )?[1-9]\d* columns?/,
    { timeout: 15_000 }
  );
  await pattern.fill(PROBE);
  await expect(page.getByTestId('dm-rule-preview')).toContainText(
    'Matches 0 columns',
    { timeout: 15_000 }
  );
  await page.getByTestId('dm-rule-class').click();
  await page.getByRole('option', { name: 'Email', exact: true }).click();
  await page.getByTestId('dm-rule-save').click();
  await expect(page.locator('mat-dialog-container')).toHaveCount(0);
  const row = page.locator('.rules .row').filter({ hasText: PROBE });
  await expect(row).toBeVisible();
  await waitFor(
    () => api.get('/system/data_masking/rule'),
    r => r.resource.some((x: any) => x.pattern === PROBE),
    'rule saved'
  );
  await evidence('08-rule-added');
  await row.getByRole('button', { name: 'Delete rule' }).click();
  // Delete asks first and says the rule's columns stay masked.
  await expect(page.locator('mat-dialog-container')).toContainText(
    'Delete rule?'
  );
  await page.getByTestId('dm-confirm-ok').click();
  await expect(row).toHaveCount(0);
  await waitFor(
    () => api.get('/system/data_masking/rule'),
    r => !r.resource.some((x: any) => x.pattern === PROBE),
    'rule deleted'
  );
});

test('activity lists what this journey did, newest first', async () => {
  await dismissToasts();
  await page.getByTestId('dm-tab-activity').click();
  await expect(page.getByTestId('dm-activity')).toBeVisible();
  const act = await api.get('/system/data_masking/activity?limit=50');
  const kinds = new Set(act.resource.map((e: any) => e.kind));
  for (const k of ['mode', 'access', 'rule']) expect(kinds).toContain(k);
  // The newest server row is on screen.
  await expect(page.locator('.event').first()).toContainText(
    act.resource[0].text.slice(0, 40)
  );
  await page.getByRole('button', { name: 'Access', exact: true }).click();
  await expect(page.locator('.event').first()).toBeVisible();
  await evidence('09-activity');
});

test('compliance: apply lists exactly the server changes; export JSON and CSV', async () => {
  await dismissToasts();
  const before = await api.get(`/system/security_baseline/${BASELINE}`);
  await page.goto(`${CP}?baseline=${BASELINE}`);
  await expect(page.locator('#cp-title')).toHaveText(
    `${before.name} baseline`,
    {
      timeout: 60_000,
    }
  );
  // The score is the server's pass / (pass + fail).
  const pass = before.controls.filter((c: any) => c.status === 'pass').length;
  const fail = before.controls.filter((c: any) => c.status === 'fail').length;
  await expect(page.getByTestId('cp-score')).toHaveText(
    new RegExp(`${pass}\\s+of ${pass + fail}`)
  );
  await evidence('10-compliance');

  if (!before.adopted || before.changes.length) {
    await page.getByTestId('cp-apply').click();
    const dialog = page.locator('mat-dialog-container');
    await expect(dialog).toBeVisible();
    if (before.changes.length) {
      const shown = await page
        .getByTestId('cp-apply-changes')
        .locator('li')
        .allInnerTexts();
      expect(shown.map(s => s.trim())).toEqual(
        before.changes.map((c: any) => c.text)
      );
    } else {
      await expect(page.getByTestId('cp-apply-none')).toBeVisible();
    }
    await evidence('11-compliance-apply-dialog');
    await page.getByTestId('cp-apply-confirm').click();
    await expect(page.getByTestId('cp-tracking')).toBeVisible();
    const after = await api.get(`/system/security_baseline/${BASELINE}`);
    expect(after.adopted).toBe(true);
    expect(after.changes.length).toBeLessThanOrEqual(before.changes.length);
    // Apply stays while anything is left to change or a check Apply fixes
    // still fails (masking.mode needs Apply with masking turned on).
    const fixable = after.controls.some(
      (c: any) => c.status === 'fail' && c.fix?.kind === 'apply'
    );
    await expect(page.getByTestId('cp-apply')).toHaveCount(
      after.changes.length || fixable ? 1 : 0
    );
    await evidence('12-compliance-applied');
  }

  for (const format of ['json', 'csv'] as const) {
    await dismissToasts();
    await page.getByTestId('cp-export').click();
    const dl = page.waitForEvent('download');
    await page.getByTestId(`cp-export-${format}`).click();
    const file = await dl;
    expect(file.suggestedFilename()).toMatch(
      new RegExp(
        `^dreamfactory-${BASELINE}-baseline-\\d{4}-\\d{2}-\\d{2}\\.${format}$`
      )
    );
    const path = await file.path();
    const text = readFileSync(path!, 'utf8');
    if (EVIDENCE) writeFileSync(join(EVIDENCE, file.suggestedFilename()), text);
    const ids = before.controls.map((c: any) => c.id);
    if (format === 'json') {
      const report = JSON.parse(text);
      // Saved verbatim: the server's snake_case keys, not camelCased.
      expect(text).not.toMatch(/"generatedAt"/);
      const reported = JSON.stringify(report);
      for (const id of ids) expect(reported).toContain(id);
    } else {
      const lines = text.trim().split(/\r?\n/);
      expect(lines.length).toBeGreaterThanOrEqual(ids.length + 1);
      for (const id of ids) expect(text).toContain(id);
    }
  }

  if (snap.baselineAdopted === false) {
    await page.getByTestId('cp-stop').click();
    await expect(page.getByTestId('cp-tracking')).toHaveCount(0);
    await waitFor(
      () => api.get(`/system/security_baseline/${BASELINE}`),
      b => b.adopted === false,
      'baseline no longer tracked'
    );
  }
});

test('no feature API errors and no page errors along the way', async () => {
  expect(featureErrors, featureErrors.join('\n')).toEqual([]);
  expect(pageErrors, pageErrors.join('\n')).toEqual([]);
});
