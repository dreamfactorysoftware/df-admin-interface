/**
 * Playwright route mock for the Data Masking backend
 * (/api/v2/system/data_masking/**) and, through compliance-mock.ts, the
 * Compliance baselines (/api/v2/system/security_baseline/**). It follows
 * the backend contract (df-masking, section 8) so screenshots and UI flows
 * can run without a GOLD backend; the live spec covers the real one.
 *
 * - Seeds from fixtures/data-masking/fixture.json: real classifier output for
 *   three live databases (crm, sports, store), with humanized evidence and
 *   masked renderings of real first-row values. No raw values.
 * - Keeps in-memory state per page, so mode changes, decisions, grants,
 *   formats and rules persist for the session, and every write lands in
 *   Activity.
 * - Speaks the wire format (snake_case); the app's case interceptor
 *   camelCases responses like any other system API.
 * - Reports the chosen license and, when the package counts as installed
 *   (default: GOLD only), adds the `data_masking` / `security_baseline`
 *   system resources so the pages open instead of the paywall.
 *
 * Usage:
 *   await installDataMaskingMock(page);                       // GOLD, seeded
 *   await installDataMaskingMock(page, { license: 'OPEN SOURCE' }); // paywall
 *   await installDataMaskingMock(page, { installed: false }); // GOLD, paywall
 *   await installDataMaskingMock(page, { scenario: 'unscanned' });
 *   await installDataMaskingMock(page, { scanUnknown: true }); // history unreadable
 */
import { Page, Route } from '@playwright/test';
import fixture from './data-masking/fixture.json';
import { installComplianceMock } from './compliance-mock';
import i18n from '../../src/assets/i18n/dataMasking/en.json';
import {
  CLASSES,
  MaskFormat,
  classDef,
} from '../../src/app/adf-data-masking/data-masking.catalog';
import {
  applyMask,
  sampleMask,
} from '../../src/app/adf-data-masking/mask-format';

export interface DataMaskingMockOptions {
  license?: 'GOLD' | 'SILVER' | 'OPEN SOURCE';
  /**
   * Whether the df-masking package's system resources exist. Default: on
   * GOLD only. Without them every license shows the standard paywall.
   */
  installed?: boolean;
  /**
   * default: scanned, 24 columns to review.
   * unscanned: nothing scanned yet; Scan now fills it from the fixture.
   * reviewed: every review column already decided.
   * nogrant: the signed-in admin cannot give real-value access.
   * nodb: a brand-new instance with no SQL database to scan.
   * emptydb: a default install: only the built-in `db` (SQLite, no tables).
   */
  scenario?:
    | 'default'
    | 'unscanned'
    | 'reviewed'
    | 'nogrant'
    | 'nodb'
    | 'emptydb';
  /** Default: preview when scanned, off when unscanned (as the server). */
  mode?: 'off' | 'preview' | 'on';
  /** List a non-SQL database Data Masking cannot cover (default true). */
  uncovered?: boolean;
  /** Add a covered SQL service that was never scanned (default false). */
  pending?: boolean;
  /**
   * Add a covered SQL service whose database cannot be reached: every scan
   * that includes it fails for it (default false).
   */
  unreachable?: boolean;
  /**
   * Refuse every Data Masking and Compliance write with 403 and this
   * message, as the server does for a caller it does not let change
   * settings. Reads still work.
   */
  forbidWrites?: string;
  /**
   * Add a computed field the scanner could not check (an expression over a
   * masked column): stored as review with no class, so it is redacted.
   */
  computed?: boolean;
  /**
   * The server cannot read its scan history (a database error): the
   * overview's scan says `unknown: true` with no finished_at, last_status
   * or failures, and every /table entry says `scan_unknown: true` with no
   * scan time. Classified columns still list (default false).
   */
  scanUnknown?: boolean;
}

/** Non-SQL database services: humans unaffected, AI blocked when on. */
const UNCOVERED = [
  { service: 'events', label: 'Event store', type: 'mongodb' },
];
/** A covered SQL service added after the last scan. */
const PENDING = { service: 'hr', label: 'HR (SQL Server)', tables: [] };
/** A covered SQL service whose database refuses the connection. */
const UNREACHABLE = { service: 'orders', label: 'Orders (MySQL)', tables: [] };
const UNREACHABLE_REASON = 'Could not connect to the database.';
/** A default install's built-in SQLite service: covered, no tables. */
const BUILTIN_DB = { service: 'db', label: 'Local SQL Database', tables: [] };

type Verdict = 'masked' | 'review' | 'clear';

interface FixColumn {
  id: string;
  service: string;
  table: string;
  column: string;
  type: string;
  verdict: Verdict;
  class: string | null;
  tier: string | null;
  confidence: number;
  total: number;
  lines: [number, string, string][];
  shapes?: [string, number][];
  examples?: Record<string, string | null>;
}

interface Col extends FixColumn {
  source: 'detected' | 'admin';
  decided_by: string | null;
  decided_at: string | null;
  extra: { points: number; kind: string; text: string }[];
}

const ME = { admin_id: 1, name: 'Kevin Admin', email: 'admin@dmui.local' };
const ADMINS = [
  ME,
  { admin_id: 2, name: 'Priya Shah', email: 'priya@example.com' },
  { admin_id: 3, name: 'Marco Rossi', email: 'marco@example.com' },
  { admin_id: 4, name: 'Dana Okafor', email: 'dana@example.com' },
  { admin_id: 5, name: 'Lee Chen', email: 'lee@example.com' },
];
const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const DURATIONS: Record<string, number | null> = {
  '1h': HOUR,
  '8h': 8 * HOUR,
  '24h': DAY,
  '7d': 7 * DAY,
  forever: null,
};
const CLASS_LABEL = (id: string | null) =>
  id ? ((i18n.classes as Record<string, string>)[id] ?? id) : i18n.notSensitive;
const FORMAT_LABEL = (f: string) =>
  ((i18n.formats as Record<string, string>)[f] ?? f).toLowerCase();

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

function buildState(opts: DataMaskingMockOptions) {
  const now = Date.now();
  const iso = (msAgo: number) => new Date(now - msAgo).toISOString();
  const fx0 = fixture as unknown as {
    meta: { ruleset: string; version: string };
    services: { service: string; label: string; tables: string[] }[];
    builtin: { class: string; detectors: string[] }[];
    columns: FixColumn[];
  };
  const empty = opts.scenario === 'nodb' || opts.scenario === 'emptydb';
  const fx = empty ? { ...fx0, services: [], columns: [] } : fx0;

  const seedColumns = (): Col[] =>
    fx.columns.map(c => ({
      ...c,
      source: 'detected',
      decided_by: null,
      decided_at: null,
      extra: [],
    }));

  const scanned = opts.scenario !== 'unscanned' && !empty;
  const state = {
    mode: opts.mode ?? (scanned ? 'preview' : 'off'),
    scan: {
      status: 'idle' as 'idle' | 'running',
      progress: 0,
      finished_at: scanned ? iso(2 * HOUR) : (null as string | null),
      last_status: (scanned ? 'done' : null) as
        | 'done'
        | 'partial'
        | 'failed'
        | null,
      failed: [] as {
        service_id: number;
        service: string;
        label: string;
        reason: string;
      }[],
      /** Services the running scan covers (null = all). */
      only: null as string | null,
    },
    /** Opaque access version: bumped by every access write. */
    accessVersion: 1,
    /** When each covered service was last scanned (null = never). */
    scannedAt: new Map<string, string | null>(),
    /** Why each service's last scan failed (absent = it did not). */
    scanError: new Map<string, string>(),
    builtinDb: opts.scenario === 'emptydb',
    unreachable: !!opts.unreachable,
    columns: scanned ? seedColumns() : ([] as Col[]),
    masks: CLASSES.map(c => ({
      class: c.id,
      tier: c.tier,
      format: c.format as MaskFormat,
      formats_allowed: c.formats,
    })),
    access: {
      admins: {
        mode: 'selected' as 'none' | 'selected' | 'all',
        grants: [
          { ...ME, expires_at: new Date(now + 8 * HOUR).toISOString() },
        ] as {
          admin_id: number;
          name: string;
          email: string;
          expires_at: string | null;
        }[],
      },
      ai: 'masked',
      roles: [
        {
          role_id: 1,
          name: 'Support agents',
          enabled: true,
          scope: 'except_restricted',
        },
        { role_id: 2, name: 'Billing service', enabled: true, scope: 'all' },
        {
          role_id: 3,
          name: 'Mobile app',
          enabled: false,
          scope: 'except_restricted',
        },
        {
          role_id: 4,
          name: 'Analytics',
          enabled: false,
          scope: 'except_restricted',
        },
      ],
    },
    rules: [] as {
      id: number;
      match: 'name' | 'value';
      pattern: string;
      class: string;
    }[],
    nextRule: 2,
    activity: [] as {
      id: number;
      at: string;
      actor: string;
      kind: string;
      text: string;
      target?: string | null;
    }[],
    nextEvent: 100,
    canGrant: opts.scenario !== 'nogrant',
    forbidWrites: opts.forbidWrites ?? null,
    uncovered: opts.uncovered === false ? [] : UNCOVERED,
    pending: !!opts.pending,
    scanUnknown: !!opts.scanUnknown,
    fx,
    seedColumns,
  };
  for (const svc of fx.services) {
    state.scannedAt.set(svc.service, scanned ? state.scan.finished_at : null);
  }

  const decide = (id: string, cls: string | null, by: string, at: string) => {
    const c = state.columns.find(x => x.id === id);
    if (!c) return;
    c.verdict = cls ? 'masked' : 'clear';
    c.class = cls;
    c.tier = classDef(cls)?.tier ?? null;
    c.source = 'admin';
    c.decided_by = by;
    c.decided_at = at;
  };

  if (scanned && opts.computed) {
    // DerivedFields: an expression that can't be checked is review with no
    // class (the server redacts it); evidence names it, never values.
    const base = state.columns.find(
      c => c.service === 'crm' && c.verdict === 'masked'
    );
    if (base) {
      state.columns.push({
        id: `${base.service}.${base.table}.contact_line`,
        service: base.service,
        table: base.table,
        column: 'contact_line',
        type: 'virtual',
        verdict: 'review',
        class: null,
        tier: null,
        confidence: 40,
        total: 40,
        lines: [
          [40, 'context', 'Built from an expression that could not be checked'],
        ],
        source: 'detected',
        decided_by: null,
        decided_at: null,
        extra: [],
      });
    }
  }

  if (scanned) {
    // A few earlier admin decisions, so sources and tooltips have history.
    decide(
      'crm.CustomerContacts.AccountName',
      'username',
      'Priya Shah',
      iso(2 * DAY)
    );
    decide('crm.CustomerContacts.LeadSource', null, 'Priya Shah', iso(2 * DAY));
    decide(
      'crm.hr_staff.salary',
      'financial_personal',
      'Kevin Admin',
      iso(5 * DAY)
    );
    if (opts.scenario === 'reviewed') {
      state.columns
        .filter(c => c.verdict === 'review')
        .forEach(c => decide(c.id, c.class, 'Kevin Admin', iso(HOUR)));
    }
    state.rules.push({
      id: 1,
      match: 'name',
      pattern: '(^|_)(ssn|nino|bsn)($|_)',
      class: 'national_id',
    });
  }

  const ev = (
    msAgo: number,
    actor: string,
    kind: string,
    text: string,
    target?: string
  ) =>
    state.activity.push({
      id: state.nextEvent++,
      at: iso(msAgo),
      actor,
      kind,
      text,
      target: target ?? null,
    });

  if (scanned) {
    const total = state.columns.length;
    ev(
      12 * 60_000,
      'Kevin Admin',
      'access',
      'Kevin Admin was given real values for 8 hours'
    );
    ev(
      40 * 60_000,
      'Claude Desktop (AI session)',
      'blocked',
      'Blocked an attempt to change access'
    );
    ev(
      2 * HOUR,
      'System',
      'scan',
      `Scan finished: ${total} columns in ${fx.services.length} databases`
    );
    ev(26 * HOUR, 'Priya Shah', 'mode', 'Masking set to Preview');
    ev(
      27 * HOUR,
      'Priya Shah',
      'rule',
      'Added a column name rule for National ID',
      '(^|_)(ssn|nino|bsn)($|_)'
    );
    ev(
      2 * DAY,
      'Priya Shah',
      'decision',
      'Kept masked as Username',
      'crm.CustomerContacts.AccountName'
    );
    ev(
      2 * DAY + 60_000,
      'Priya Shah',
      'decision',
      'Marked not sensitive',
      'crm.CustomerContacts.LeadSource'
    );
    ev(
      3 * DAY,
      'Dana Okafor',
      'blocked',
      'A filter on a masked column ran on masked values',
      'crm.CustomerContacts.EMail'
    );
    ev(
      5 * DAY,
      'Kevin Admin',
      'decision',
      'Kept masked as Personal financial',
      'crm.hr_staff.salary'
    );
    ev(
      5 * DAY + HOUR,
      'System',
      'scan',
      `Scan finished: ${total} columns in ${fx.services.length} databases`
    );
  }

  return Object.assign(state, { ev, decide, iso });
}

type State = ReturnType<typeof buildState>;

function formatOf(state: State, cls: string | null): MaskFormat | null {
  return (state.masks.find(m => m.class === cls)?.format as MaskFormat) ?? null;
}

function ruleMatches(state: State, match: 'name' | 'value', pattern: string) {
  let re: RegExp;
  try {
    re = new RegExp(pattern, 'i');
  } catch {
    return [];
  }
  return state.columns.filter(c => {
    if (match === 'name') return re.test(c.column);
    // No raw values in the mock: test value shapes and the class sample.
    const probes = [
      ...(c.shapes ?? []).map(s => s[0]),
      ...(c.verdict !== 'clear' && c.class
        ? [classDef(c.class)?.sample ?? '']
        : []),
    ];
    return probes.some(p => re.test(p));
  });
}

function applyRule(
  state: State,
  rule: { match: 'name' | 'value'; pattern: string; class: string }
) {
  // Rules only ever add masking, and never override an admin decision.
  for (const c of ruleMatches(state, rule.match, rule.pattern)) {
    if (c.source === 'admin' || c.verdict === 'masked') continue;
    c.verdict = 'masked';
    c.class = rule.class;
    c.tier = classDef(rule.class)?.tier ?? null;
    // The scanner's evidence line (Rules::describe).
    const kind = rule.match === 'value' ? 'value rule' : 'rule';
    c.extra = [
      { points: 70, kind: 'context', text: `Custom ${kind} ${rule.pattern}` },
    ];
    c.total = Math.max(c.total, 70);
  }
}

function wireColumn(state: State, c: Col) {
  const format = c.verdict === 'clear' ? null : formatOf(state, c.class);
  let example: string | null = null;
  if (format && c.class) {
    example =
      c.examples && format in c.examples
        ? (c.examples[format] as string | null)
        : sampleMask(c.class, format).after;
  }
  return {
    id: c.id,
    service: c.service,
    table: c.table,
    column: c.column,
    type: c.type,
    verdict: c.verdict,
    class: c.class,
    tier: c.tier,
    source: c.source,
    decided_by: c.decided_by,
    decided_at: c.decided_at,
    confidence: c.confidence,
    example,
    format,
    evidence: {
      total: c.total,
      threshold_mask: 70,
      threshold_review: 40,
      lines: [
        ...c.lines.map(([points, kind, text]) => ({ points, kind, text })),
        ...c.extra,
      ],
      shapes: c.shapes ?? [],
    },
  };
}

function counts(state: State) {
  const out = { masked: 0, review: 0, clear: 0 };
  state.columns.forEach(c => out[c.verdict]++);
  return out;
}

function overview(state: State) {
  const mine = state.access.admins.grants.find(g => g.admin_id === ME.admin_id);
  const live =
    state.access.admins.mode === 'all' ||
    (state.access.admins.mode === 'selected' &&
      !!mine &&
      (mine.expires_at === null || Date.parse(mine.expires_at) > Date.now()));
  return {
    mode: state.mode,
    scan: {
      status: state.scan.status,
      progress: state.scan.status === 'running' ? state.scan.progress : null,
      columns: state.columns.length,
      // An unreadable scan history: nothing is known about past scans.
      ...(state.scanUnknown
        ? { finished_at: null, last_status: null, failed: [], unknown: true }
        : {
            finished_at: state.scan.finished_at,
            last_status: state.scan.last_status,
            failed: state.scan.failed,
          }),
    },
    counts: counts(state),
    you: {
      can_grant: state.canGrant,
      sees_real_values: live,
      grant_expires_at: live ? (mine?.expires_at ?? null) : null,
    },
    coverage: {
      covered: [
        ...state.fx.services.map(s => ({
          service: s.service,
          label: s.label,
          type: 'pgsql',
        })),
        ...(state.pending
          ? [{ service: PENDING.service, label: PENDING.label, type: 'sqlsrv' }]
          : []),
        ...(state.unreachable
          ? [
              {
                service: UNREACHABLE.service,
                label: UNREACHABLE.label,
                type: 'mysql',
              },
            ]
          : []),
        ...(state.builtinDb
          ? [
              {
                service: BUILTIN_DB.service,
                label: BUILTIN_DB.label,
                type: 'sqlite',
              },
            ]
          : []),
      ],
      uncovered: state.uncovered,
    },
  };
}

function tables(state: State) {
  // Like the server: every covered service; one never scanned has no
  // tables and no scan time, one the last scan could not read says why.
  const services = [
    ...state.fx.services.map(s => {
      const at = state.scannedAt.get(s.service) ?? null;
      return { ...s, scanned_at: at, tables: at ? s.tables : [] };
    }),
    ...(state.pending ? [{ ...PENDING, scanned_at: null }] : []),
    ...(state.unreachable
      ? [
          {
            ...UNREACHABLE,
            scanned_at: state.scannedAt.get(UNREACHABLE.service) ?? null,
          },
        ]
      : []),
    ...(state.builtinDb
      ? [
          {
            ...BUILTIN_DB,
            scanned_at: state.scannedAt.get(BUILTIN_DB.service) ?? null,
          },
        ]
      : []),
  ];
  return {
    resource: services.map(s => ({
      service: s.service,
      label: s.label,
      // An unreadable scan history: no scan time or error, only the flag.
      scanned_at: state.scanUnknown ? null : s.scanned_at,
      scan_error: state.scanUnknown
        ? null
        : (state.scanError.get(s.service) ?? null),
      ...(state.scanUnknown ? { scan_unknown: true } : {}),
      tables: (s.tables as string[]).map(name => {
        const cols = state.columns.filter(
          c => c.service === s.service && c.table === name
        );
        const columns = { masked: 0, review: 0, clear: 0 };
        cols.forEach(c => columns[c.verdict]++);
        return {
          name,
          columns,
          strip: cols.map(c => ({
            column: c.column,
            mark:
              c.verdict === 'review'
                ? 'review'
                : c.verdict === 'clear'
                  ? 'clear'
                  : c.tier,
            tier: c.tier,
          })),
        };
      }),
    })),
  };
}

const ADMIN_RANK: Record<string, number> = { none: 0, selected: 1, all: 2 };

/** The server's loosening rule (AccessHandler): more admins, a new or
 * longer grant, AI same as admins, a role enabled or widened to all. */
interface AccessBody {
  admins?: {
    mode?: string;
    grants?: { admin_id: number; duration?: string }[];
  };
  ai?: string;
  roles?: { role_id: number; enabled: boolean; scope: string }[];
}

function loosens(state: State, body: AccessBody): boolean {
  const now = Date.now();
  const a = body.admins ?? {};
  if (a.mode && ADMIN_RANK[a.mode] > ADMIN_RANK[state.access.admins.mode]) {
    return true;
  }
  if (body.ai === 'same_as_admins' && state.access.ai !== 'same_as_admins') {
    return true;
  }
  for (const g of Array.isArray(a.grants) ? a.grants : []) {
    const old = state.access.admins.grants.find(
      p =>
        p.admin_id === g.admin_id &&
        (p.expires_at === null || Date.parse(p.expires_at) > now)
    );
    if (!old) return true;
    if (g.duration && old.expires_at !== null) {
      const ms = DURATIONS[g.duration];
      if (ms === null || now + (ms ?? 0) > Date.parse(old.expires_at)) {
        return true;
      }
    }
  }
  for (const r of Array.isArray(body.roles) ? body.roles : []) {
    const old = state.access.roles.find(x => x.role_id === r.role_id);
    if (r.enabled && !old?.enabled) return true;
    if (r.enabled && old?.enabled && r.scope === 'all' && old.scope !== 'all') {
      return true;
    }
  }
  return false;
}

function access(state: State) {
  return {
    admins: {
      mode: state.access.admins.mode,
      grants: state.access.admins.grants,
      available: ADMINS.map(a => ({ ...a, you: a.admin_id === ME.admin_id })),
    },
    ai: state.access.ai,
    roles: state.access.roles,
    version: `v${state.accessVersion}`,
  };
}

/** A scan reached 100%: classify, record what could not be read. */
function finishScan(state: State) {
  const now = new Date().toISOString();
  const only = state.scan.only;
  const covers = (svc: string) => only === null || only === svc;
  state.scan.status = 'idle';
  state.scan.only = null;
  const failed: typeof state.scan.failed = [];
  if (state.unreachable && covers(UNREACHABLE.service)) {
    failed.push({
      service_id: 90,
      service: UNREACHABLE.service,
      label: UNREACHABLE.label,
      reason: UNREACHABLE_REASON,
    });
    state.scanError.set(UNREACHABLE.service, UNREACHABLE_REASON);
  }
  const done = [
    ...state.fx.services.map(s => s.service),
    ...(state.builtinDb ? [BUILTIN_DB.service] : []),
  ].filter(covers);
  const first = !state.columns.length && !!state.fx.services.length;
  if (
    first &&
    done.some(svc => state.fx.services.some(f => f.service === svc))
  ) {
    state.columns = state.seedColumns();
    state.rules.forEach(r => applyRule(state, r));
  }
  done.forEach(svc => {
    state.scannedAt.set(svc, now);
    state.scanError.delete(svc);
  });
  state.scan.failed = failed;
  state.scan.last_status = !failed.length
    ? 'done'
    : done.length
      ? 'partial'
      : 'failed';
  // A failed scan does not move finished_at (the last done scan's time).
  if (state.scan.last_status !== 'failed') state.scan.finished_at = now;
  const firstEver = done.length > 0 && first;
  if (failed.length) {
    state.ev(
      0,
      'System',
      'scan',
      `Scan failed: could not read ${failed.map(f => f.service).join(', ')}`
    );
  }
  if (done.length) {
    state.ev(
      0,
      'System',
      'scan',
      `Scan finished: ${state.columns.length} columns in ${done.length} databases`
    );
  }
  // The server moves Off to Preview after the first scan ever.
  if ((firstEver || (state.builtinDb && done.length)) && state.mode === 'off') {
    state.mode = 'preview';
    state.ev(
      0,
      'System',
      'mode',
      'Masking set to Preview after the first scan'
    );
  }
}

async function handle(route: Route, state: State) {
  const req = route.request();
  const url = new URL(req.url());
  const method = req.method();
  const sub = url.pathname.replace(/^.*\/system\/data_masking/, '') || '/';
  const body = (() => {
    try {
      return req.postDataJSON() ?? {};
    } catch {
      return {};
    }
  })();

  // A caller the server does not let change settings: every write is
  // refused (the rule preview is a read, even though it is a POST).
  if (state.forbidWrites && method !== 'GET' && sub !== '/rule/test') {
    state.ev(0, ME.name, 'blocked', 'Blocked an attempt to change settings');
    return json(
      route,
      { error: { code: 403, message: state.forbidWrites, status_code: 403 } },
      403
    );
  }

  // ------------------------------------------------------------ overview
  if (sub === '/' || sub === '') {
    if (method === 'PATCH' && body.mode) {
      const rank: Record<string, number> = { off: 0, preview: 1, on: 2 };
      const neverScanned = ![...state.scannedAt.values()].some(Boolean);
      // Like the server: nothing to mask before the first scan.
      if (body.mode === 'on' && neverScanned) {
        return json(
          route,
          {
            error: {
              code: 409,
              message: 'Scan your databases before turning masking on.',
            },
          },
          409
        );
      }
      // Lowering from On is the super admin's call.
      if (
        state.mode === 'on' &&
        rank[body.mode] < rank['on'] &&
        !state.canGrant
      ) {
        state.ev(0, ME.name, 'blocked', 'Blocked an attempt to lower the mode');
        return json(
          route,
          {
            error: {
              code: 403,
              message: 'Only the super admin can lower the masking mode.',
            },
          },
          403
        );
      }
      state.mode = body.mode;
      const label = { off: 'Off', preview: 'Preview', on: 'On' }[
        body.mode as string
      ];
      state.ev(0, ME.name, 'mode', `Masking set to ${label}`);
    }
    if (method === 'GET' && state.scan.status === 'running') {
      state.scan.progress = Math.min(100, state.scan.progress + 25);
      if (state.scan.progress >= 100) finishScan(state);
    }
    return json(route, overview(state));
  }

  if (sub === '/scan' && method === 'POST') {
    // A scan already running: the overview, unchanged (idempotent).
    if (state.scan.status !== 'running') {
      state.scan.status = 'running';
      state.scan.progress = 0;
      state.scan.only = (body.service as string | undefined) ?? null;
    }
    return json(route, overview(state));
  }

  if (sub === '/table') return json(route, tables(state));

  // ------------------------------------------------------------- columns
  if (sub === '/column') {
    const svc = url.searchParams.get('service');
    return json(route, {
      resource: state.columns
        .filter(c => !svc || c.service === svc)
        .map(c => wireColumn(state, c)),
    });
  }
  const colMatch = sub.match(/^\/column(?:\/(.+))?$/);
  if (colMatch && method === 'PATCH') {
    // The id travels in the body (any column name); the path form is kept.
    const id =
      (body.id as string | undefined) ?? decodeURIComponent(colMatch[1] ?? '');
    const c = state.columns.find(x => x.id === id);
    if (!c) return json(route, { error: { message: 'Column not found' } }, 404);
    const wasReview = c.verdict === 'review';
    const cls = (body.class ?? null) as string | null;
    const sameClass = cls === c.class;
    state.decide(id, cls, ME.name, new Date().toISOString());
    const label = classDef(cls) ? CLASS_LABEL(cls) : '';
    state.ev(
      0,
      ME.name,
      'decision',
      !cls
        ? 'Marked not sensitive'
        : wasReview && sameClass
          ? `Kept masked as ${label}`
          : `Set class to ${label}`,
      id
    );
    return json(route, wireColumn(state, c));
  }

  // -------------------------------------------------------------- access
  if (sub === '/access') {
    if (method === 'PATCH') {
      // Optimistic concurrency, like the server: a stale version is refused.
      if (body.version && body.version !== `v${state.accessVersion}`) {
        return json(
          route,
          {
            error: {
              code: 409,
              message:
                'Access settings changed since you loaded them. Reload and try again.',
            },
          },
          409
        );
      }
      // Like the server: anyone may tighten; loosening needs the super
      // admin, and a PATCH with any loosening change fails as a whole.
      if (!state.canGrant && loosens(state, body)) {
        state.ev(0, ME.name, 'blocked', 'Blocked an attempt to change access');
        return json(
          route,
          {
            error: {
              code: 403,
              message: 'Only the super admin can give access.',
            },
          },
          403
        );
      }
      state.accessVersion++;
      const a = body.admins ?? {};
      if (a.mode) state.access.admins.mode = a.mode;
      if (Array.isArray(a.grants)) {
        const prev = state.access.admins.grants;
        const now = Date.now();
        const live = (p: { expires_at: string | null }) =>
          p.expires_at === null || Date.parse(p.expires_at) > now;
        state.access.admins.grants = a.grants
          // A grant sent without a duration only keeps a live grant; it
          // never brings back one that ended or was revoked.
          .filter(
            (g: { admin_id: number; duration?: string }) =>
              !!g.duration ||
              prev.some(p => p.admin_id === g.admin_id && live(p))
          )
          .map((g: { admin_id: number; duration?: string }) => {
            const who = ADMINS.find(x => x.admin_id === g.admin_id) ?? ME;
            const old = prev.find(p => p.admin_id === g.admin_id);
            const ms = g.duration ? DURATIONS[g.duration] : undefined;
            const expires_at =
              g.duration === undefined && old
                ? old.expires_at
                : ms === null
                  ? null
                  : new Date(Date.now() + (ms ?? 8 * HOUR)).toISOString();
            if (g.duration) {
              const span =
                g.duration === 'forever'
                  ? 'until turned off'
                  : `for ${g.duration
                      .replace('h', ' hours')
                      .replace('d', ' days')
                      .replace(/^1 hours/, '1 hour')}`;
              state.ev(
                0,
                ME.name,
                'access',
                `${who.name} was given real values ${span}`
              );
            }
            return { ...who, expires_at };
          });
        prev
          .filter(
            p =>
              !state.access.admins.grants.some(g => g.admin_id === p.admin_id)
          )
          .forEach(p =>
            state.ev(0, ME.name, 'access', `Real values removed for ${p.name}`)
          );
      }
      if (body.ai) {
        state.access.ai = body.ai;
        state.ev(
          0,
          ME.name,
          'access',
          body.ai === 'masked'
            ? 'AI and MCP sessions set to always masked'
            : 'AI and MCP sessions now match admins'
        );
      }
      if (Array.isArray(body.roles)) {
        for (const r of body.roles) {
          const role = state.access.roles.find(x => x.role_id === r.role_id);
          if (!role) continue;
          if (role.enabled !== r.enabled) {
            state.ev(
              0,
              ME.name,
              'access',
              `${role.name} ${r.enabled ? 'now sees real values' : 'is masked again'}`
            );
          }
          Object.assign(role, { enabled: r.enabled, scope: r.scope });
        }
      }
      if (a.mode)
        state.ev(
          0,
          ME.name,
          'access',
          `Admin access set to ${a.mode === 'none' ? 'no one' : a.mode}`
        );
    }
    return json(route, access(state));
  }

  // --------------------------------------------------------------- masks
  if (sub === '/mask') {
    if (method === 'PATCH' && Array.isArray(body.resource)) {
      for (const m of body.resource) {
        const row = state.masks.find(x => x.class === m.class);
        if (row && row.formats_allowed.includes(m.format)) {
          row.format = m.format;
          state.ev(
            0,
            ME.name,
            'decision',
            `${CLASS_LABEL(m.class)} now masked as ${FORMAT_LABEL(m.format)}`
          );
        }
      }
    }
    return json(route, { resource: state.masks });
  }

  // --------------------------------------------------------------- rules
  if (sub === '/rule/builtin') {
    return json(route, {
      ruleset: state.fx.meta.ruleset,
      version: state.fx.meta.version,
      classes: state.fx.builtin,
    });
  }
  if (sub === '/rule/test' && method === 'POST') {
    return json(route, {
      matches: ruleMatches(state, body.match, body.pattern).map(c => ({
        id: c.id,
      })),
      partial: false,
    });
  }
  if (sub === '/rule') {
    if (method === 'POST') {
      const rule = {
        id: state.nextRule++,
        match: body.match,
        pattern: body.pattern,
        class: body.class,
      };
      state.rules.push(rule);
      applyRule(state, rule);
      state.ev(
        0,
        ME.name,
        'rule',
        `Added a ${rule.match === 'name' ? 'column name' : 'value'} rule for ${CLASS_LABEL(rule.class)}`,
        rule.pattern
      );
      return json(route, {
        ...rule,
        matches: ruleMatches(state, rule.match, rule.pattern).length,
      });
    }
    return json(route, {
      resource: state.rules.map(r => ({
        ...r,
        matches: ruleMatches(state, r.match, r.pattern).length,
      })),
    });
  }
  const ruleMatch = sub.match(/^\/rule\/(\d+)$/);
  if (ruleMatch && method === 'DELETE') {
    const id = Number(ruleMatch[1]);
    const r = state.rules.find(x => x.id === id);
    state.rules = state.rules.filter(x => x.id !== id);
    if (r) state.ev(0, ME.name, 'rule', 'Deleted a rule', r.pattern);
    return json(route, { id });
  }

  // ------------------------------------------------------------ activity
  if (sub === '/activity') {
    // Server-side filter and paging: kind=a,b&limit=n&before=<id>.
    const kinds = (url.searchParams.get('kind') ?? '')
      .split(',')
      .filter(Boolean);
    const limit = Math.min(1000, Number(url.searchParams.get('limit')) || 200);
    const before = Number(url.searchParams.get('before')) || 0;
    const sorted = [...state.activity]
      .filter(e => !kinds.length || kinds.includes(e.kind))
      .sort((a, b) => Date.parse(b.at) - Date.parse(a.at) || b.id - a.id);
    // Older than `before`: everything after that row in newest-first order.
    const at = before ? sorted.findIndex(e => e.id === before) : -1;
    const all = !before
      ? sorted
      : at >= 0
        ? sorted.slice(at + 1)
        : sorted.filter(e => e.id < before);
    return json(route, {
      resource: all.slice(0, limit),
      has_more: all.length > limit,
    });
  }

  return json(
    route,
    { error: { message: `No mock for ${method} ${sub}` } },
    404
  );
}

export async function installDataMaskingMock(
  page: Page,
  opts: DataMaskingMockOptions = {}
) {
  const license = opts.license ?? 'GOLD';
  const installed = opts.installed ?? license === 'GOLD';
  const state = buildState(opts);

  // Never call out to the license / paywall tracking service.
  await page.route('https://updates.dreamfactory.com/**', r =>
    json(r, { disableUi: 'false', msg: 'Mock license' })
  );

  await page.route('**/api/v2/system/environment*', async route => {
    const res = await route.fetch();
    const env = await res.json();
    env.platform = { ...(env.platform ?? {}), license };
    // The license guard checks a commercial key against the (mocked)
    // updates service, so give the mock license one.
    if (license !== 'OPEN SOURCE') env.platform.license_key = 'dm-mock-license';
    return route.fulfill({ response: res, json: env });
  });

  // The resource list the paywall checks (GET /api/v2/system).
  await page.route(/\/api\/v2\/system(\?[^/]*)?$/, async route => {
    const res = await route.fetch();
    const sys = await res.json();
    const gold = ['data_masking', 'security_baseline'];
    if (installed && Array.isArray(sys.resource)) {
      for (const name of gold) {
        const has = sys.resource.some(
          (r: { name?: string }) => r?.name === name
        );
        if (!has) sys.resource.push({ name });
      }
    } else if (Array.isArray(sys.resource)) {
      // Package absent: the resources do not exist, even if the login
      // backend (a GOLD dev stack) has them.
      sys.resource = sys.resource.filter(
        (r: { name?: string }) => !gold.includes(r?.name ?? '')
      );
    }
    return route.fulfill({ response: res, json: sys });
  });

  await page.route('**/api/v2/system/data_masking**', route =>
    handle(route, state)
  );

  // DreamFactory's own table list for the mocked databases (first run asks
  // whether there is anything to scan). Other services pass through.
  await page.route(/\/api\/v2\/([^/?]+)\/_table(\?|$)/, route => {
    const svc = new URL(route.request().url()).pathname.split('/')[3];
    if (state.unreachable && svc === UNREACHABLE.service) {
      return json(route, { error: { message: UNREACHABLE_REASON } }, 500);
    }
    if (state.builtinDb && svc === BUILTIN_DB.service) {
      return json(route, { resource: [] });
    }
    const fx = state.fx.services.find(s => s.service === svc);
    if (fx) return json(route, { resource: fx.tables });
    return route.fallback();
  });
  await installComplianceMock(page, state);
  return state;
}

/**
 * Data Explorer reads of the mocked databases (GET <service>/_table/<table>)
 * as df-masking answers them in mode On (decision 20): synthetic rows with
 * masked columns masked; a filter condition on a masked column is unknown,
 * so the filter (Data Explorer ANDs its column filters) matches no rows; a
 * sort on one is ignored. Both are named in X-DreamFactory-Masking-Dropped.
 * Outside mode On there are no masking headers and nothing is dropped.
 */
export async function installDataExplorerMaskingMock(
  page: Page,
  state: Awaited<ReturnType<typeof installDataMaskingMock>>,
  rows = 8
) {
  await page.route(/\/api\/v2\/([^/?]+)\/_table\/([^/?]+)(\?|$)/, route => {
    const req = route.request();
    const url = new URL(req.url());
    const [, , , svc, , rawTable] = url.pathname.split('/');
    const table = decodeURIComponent(rawTable ?? '');
    const cols = state.columns.filter(
      c => c.service === svc && c.table === table
    );
    if (req.method() !== 'GET' || !cols.length) return route.fallback();
    const on = state.mode === 'on';
    const hidden = new Map(
      cols
        .filter(c => on && c.verdict !== 'clear')
        .map(c => [c.column.toLowerCase(), c])
    );
    const dropped: string[] = [];
    let none = false;
    // Column filters: "(col op value) AND (…)".
    for (const part of (url.searchParams.get('filter') ?? '').split(/ AND /i)) {
      const m = part.trim().match(/^\(?\s*([^\s()]+)\s+(.+?)\)?$/);
      const col = m?.[1].toLowerCase();
      if (!col || !hidden.has(col)) continue;
      if (/^IS (NOT )?NULL$/i.test(m![2].trim())) continue;
      dropped.push(`filter:${encodeURIComponent(hidden.get(col)!.column)}`);
      none = true;
    }
    const order = (url.searchParams.get('order') ?? '').split(' ')[0];
    if (order && hidden.has(order.toLowerCase())) {
      dropped.push(`order:${encodeURIComponent(order)}`);
    }
    const value = (c: Col, i: number): unknown => {
      if (hidden.has(c.column.toLowerCase())) {
        const format = c.class ? formatOf(state, c.class) : 'redact';
        return c.class && format
          ? sampleMask(c.class, format).after
          : applyMask('', 'redact', '');
      }
      const t = c.type.toLowerCase();
      if (/int|numeric|serial/.test(t)) return i;
      if (t.startsWith('bool')) return i % 2 === 0;
      if (t.startsWith('date') || t.startsWith('timestamp')) {
        return `2026-0${1 + (i % 9)}-1${i % 10}`;
      }
      return `${c.column}-${i}`;
    };
    const resource = none
      ? []
      : Array.from({ length: rows }, (_, i) =>
          Object.fromEntries(cols.map(c => [c.column, value(c, i + 1)]))
        );
    const headers: Record<string, string> = {};
    if (on && hidden.size) headers['X-DreamFactory-Masking'] = 'on';
    if (dropped.length) {
      headers['X-DreamFactory-Masking-Dropped'] = [...new Set(dropped)].join(
        ','
      );
      // Same-origin in the app; exposed anyway, like the server's CORS.
      headers['Access-Control-Expose-Headers'] =
        'X-DreamFactory-Masking, X-DreamFactory-Masking-Dropped';
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers,
      body: JSON.stringify({ resource, meta: { count: resource.length } }),
    });
  });
}

/** Synthetic sample through a format, for assertions. */
export const maskSample = (cls: string, f: MaskFormat) =>
  applyMask(classDef(cls)?.sample ?? '', f, cls);
