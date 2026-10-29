/**
 * Playwright route mock for /api/v2/system/security_baseline/** (Compliance
 * baselines), stateful on top of the Data Masking mock: checks are computed
 * from the masking state (mode, review queue, formats, access), Apply
 * changes exactly what its `changes` list says, and every write lands in the
 * masking Activity. Platform checks (HTTPS, CORS, session TTL, ...) are
 * fixed per mock instance. Reports carry no data values.
 *
 * Installed by installDataMaskingMock(); not meant to be used on its own.
 */
import { Page, Route } from '@playwright/test';

type Mode = 'off' | 'preview' | 'on';

/** The slice of the masking mock state the baselines read and write. */
export interface MaskingStateView {
  mode: Mode;
  /** Refuse every write with 403 and this message (null: allow). */
  forbidWrites?: string | null;
  /** The masking mock's scan; status/progress drive the first scan. */
  scan: {
    finished_at: string | null;
    status?: 'idle' | 'running';
    progress?: number;
  };
  columns: { verdict: string; class: string | null; source: string }[];
  masks: { class: string; format: string; formats_allowed: string[] }[];
  access: {
    admins: {
      mode: 'none' | 'selected' | 'all';
      grants: { admin_id: number; name: string; expires_at: string | null }[];
    };
    ai: string;
    roles: { role_id: number; name: string; enabled: boolean; scope: string }[];
  };
  rules: {
    id: number;
    match: 'name' | 'value';
    pattern: string;
    class: string;
  }[];
  nextRule: number;
  ev: (
    msAgo: number,
    actor: string,
    kind: string,
    text: string,
    target?: string
  ) => void;
}

interface Check {
  id: string;
  refs: string[];
  title?: string;
}

interface BaselineDef {
  id: string;
  name: string;
  vertical: string;
  frameworks: string[];
  /** Longest admin grant allowed, in hours. */
  grantMax: number;
  /** Per-class formats allowed by this baseline. */
  formats: { class: string; allowed: string[]; title: string }[];
  rolesRestricted: boolean;
  adminsAllForbidden: boolean;
  checks: Check[];
  manual: { id: string; title: string; refs: string[] }[];
  rules: { match: 'name' | 'value'; pattern: string; class: string }[];
}

const HOUR = 3_600_000;
const ME = 'Kevin Admin';

// Framework references: only ones double-checked against the source texts
// (HIPAA 45 CFR Part 164, PCI DSS v4.0, GLBA Safeguards Rule 16 CFR 314,
// CJIS Security Policy, GDPR, AICPA TSC 2017, ISO/IEC 27001:2022 Annex A).
const BASELINES: BaselineDef[] = [
  {
    id: 'hipaa',
    name: 'HIPAA',
    vertical: 'healthcare',
    frameworks: ['HIPAA Security Rule', 'HIPAA Privacy Rule'],
    grantMax: 8,
    formats: [
      {
        class: 'date_of_birth',
        allowed: ['year', 'redact', 'null'],
        title: 'Birth dates show at most the year',
      },
    ],
    rolesRestricted: true,
    adminsAllForbidden: true,
    checks: [
      { id: 'masking.mode', refs: ['164.312(a)(1)', '164.514(b)'] },
      { id: 'masking.scanned', refs: ['164.514(b)'] },
      { id: 'masking.review', refs: ['164.514(b)'] },
      { id: 'masking.format', refs: ['164.514(b)'] },
      { id: 'access.ai', refs: ['164.312(a)(1)'] },
      { id: 'access.grant_expiry', refs: ['164.312(a)(1)'] },
      { id: 'access.admins_all', refs: ['164.312(a)(1)'] },
      { id: 'access.roles_restricted', refs: ['164.312(a)(1)'] },
      { id: 'platform.https', refs: ['164.312(e)(1)'] },
      { id: 'platform.session_ttl', refs: ['164.312(a)(2)(iii)'] },
      { id: 'platform.audit', refs: ['164.312(b)'] },
      { id: 'platform.root_admin', refs: ['164.312(a)(1)'] },
    ],
    manual: [
      {
        id: 'manual.encryption_at_rest',
        title: 'Encryption at rest on your databases',
        refs: ['164.312(a)(2)(iv)'],
      },
      {
        id: 'manual.baa',
        title: 'Business associate agreements in place',
        refs: ['164.308(b)(1)'],
      },
    ],
    rules: [
      {
        match: 'name',
        pattern: '(^|_)(mrn|medical_record|diagnosis|icd10?)($|_)',
        class: 'special_category',
      },
    ],
  },
  {
    id: 'pci_dss',
    name: 'PCI DSS',
    vertical: 'payments',
    frameworks: ['PCI DSS v4.0.1'],
    grantMax: 8,
    formats: [
      {
        class: 'card_number',
        allowed: ['last4', 'redact', 'null'],
        title: 'Card numbers show at most the last 4 digits',
      },
      {
        class: 'card_security',
        allowed: ['null', 'redact'],
        title: 'Card security codes never shown',
      },
    ],
    rolesRestricted: true,
    adminsAllForbidden: true,
    checks: [
      { id: 'masking.mode', refs: ['3.4.1'] },
      { id: 'masking.scanned', refs: ['3.4.1'] },
      { id: 'masking.review', refs: ['3.4.1'] },
      { id: 'masking.format', refs: ['3.3.1', '3.4.1'] },
      { id: 'access.ai', refs: ['7.2.1'] },
      { id: 'access.grant_expiry', refs: ['7.2.1'] },
      { id: 'access.admins_all', refs: ['7.2.1'] },
      { id: 'access.roles_restricted', refs: ['7.2.1'] },
      { id: 'platform.https', refs: ['4.2.1'] },
      { id: 'platform.session_ttl', refs: ['8.2.8'] },
      { id: 'platform.audit', refs: ['10.2.1'] },
      { id: 'platform.rate_limit', refs: [] },
    ],
    manual: [
      {
        id: 'manual.encryption_at_rest',
        title: 'Stored card numbers are unreadable at rest',
        refs: ['3.5.1'],
      },
    ],
    rules: [
      {
        match: 'name',
        pattern: '(^|_)(pan|cc_?num|card_?no)($|_)',
        class: 'card_number',
      },
      {
        match: 'name',
        pattern: '(^|_)(cvv2?|cvc|csc)($|_)',
        class: 'card_security',
      },
    ],
  },
  {
    id: 'glba',
    name: 'GLBA',
    vertical: 'banking',
    frameworks: ['GLBA Safeguards Rule (16 CFR 314)'],
    grantMax: 24,
    formats: [],
    rolesRestricted: true,
    adminsAllForbidden: false,
    checks: [
      { id: 'masking.mode', refs: ['314.4(c)(1)'] },
      { id: 'masking.scanned', refs: ['314.4(c)(1)'] },
      { id: 'masking.review', refs: ['314.4(c)(1)'] },
      { id: 'access.ai', refs: ['314.4(c)(1)'] },
      { id: 'access.grant_expiry', refs: ['314.4(c)(1)'] },
      { id: 'access.roles_restricted', refs: ['314.4(c)(1)'] },
      { id: 'platform.https', refs: ['314.4(c)(3)'] },
      { id: 'platform.audit', refs: ['314.4(c)(8)'] },
    ],
    manual: [
      {
        id: 'manual.encryption_at_rest',
        title: 'Customer information encrypted at rest',
        refs: ['314.4(c)(3)'],
      },
    ],
    rules: [],
  },
  {
    id: 'cjis',
    name: 'CJIS',
    vertical: 'government',
    frameworks: ['FBI CJIS Security Policy v5.9'],
    grantMax: 8,
    formats: [],
    rolesRestricted: true,
    adminsAllForbidden: true,
    checks: [
      { id: 'masking.mode', refs: ['5.5.2'] },
      { id: 'masking.review', refs: ['5.5.2'] },
      { id: 'access.ai', refs: ['5.5.2'] },
      { id: 'access.grant_expiry', refs: ['5.5.2'] },
      { id: 'access.admins_all', refs: ['5.5.2'] },
      { id: 'access.roles_restricted', refs: ['5.5.2'] },
      { id: 'platform.session_ttl', refs: ['5.5.5'] },
      { id: 'platform.https', refs: ['5.10.1.2'] },
      { id: 'platform.audit', refs: ['5.4'] },
    ],
    manual: [
      {
        id: 'manual.encryption_at_rest',
        title: 'Criminal justice information encrypted at rest',
        refs: ['5.10.1.2'],
      },
    ],
    rules: [],
  },
  {
    id: 'gdpr',
    name: 'GDPR',
    vertical: 'privacy',
    frameworks: ['EU GDPR (Regulation (EU) 2016/679)'],
    grantMax: 24,
    formats: [],
    rolesRestricted: false,
    adminsAllForbidden: false,
    checks: [
      { id: 'masking.mode', refs: ['Art. 25'] },
      { id: 'masking.scanned', refs: ['Art. 30'] },
      { id: 'masking.review', refs: ['Art. 5(1)(c)'] },
      { id: 'access.ai', refs: ['Art. 5(1)(c)', 'Art. 25'] },
      { id: 'access.grant_expiry', refs: ['Art. 32'] },
      { id: 'platform.https', refs: ['Art. 32'] },
      { id: 'platform.audit', refs: ['Art. 30'] },
    ],
    manual: [
      {
        id: 'manual.dpia',
        title: 'Impact assessment for high-risk processing',
        refs: ['Art. 35'],
      },
    ],
    rules: [],
  },
  {
    id: 'soc2',
    name: 'SOC 2',
    vertical: 'general',
    frameworks: ['AICPA SOC 2 Trust Services Criteria (2017)'],
    grantMax: 24,
    formats: [],
    rolesRestricted: false,
    adminsAllForbidden: false,
    checks: [
      { id: 'masking.mode', refs: ['C1.1'] },
      { id: 'masking.review', refs: ['C1.1'] },
      { id: 'access.ai', refs: ['CC6.1'] },
      { id: 'access.grant_expiry', refs: ['CC6.3'] },
      { id: 'platform.https', refs: ['CC6.7'] },
      { id: 'platform.cors', refs: ['CC6.1'] },
      { id: 'platform.rate_limit', refs: ['CC6.1'] },
      { id: 'platform.audit', refs: ['CC7.2'] },
    ],
    manual: [
      {
        id: 'manual.access_review',
        title: 'Quarterly access review',
        refs: ['CC6.3'],
      },
    ],
    rules: [],
  },
  {
    id: 'iso27001',
    name: 'ISO 27001',
    vertical: 'general',
    frameworks: ['ISO/IEC 27001:2022'],
    grantMax: 24,
    formats: [],
    rolesRestricted: false,
    adminsAllForbidden: false,
    checks: [
      { id: 'masking.mode', refs: ['A.8.11'] },
      { id: 'masking.scanned', refs: ['A.5.12'] },
      { id: 'masking.review', refs: ['A.5.12'] },
      { id: 'access.ai', refs: ['A.5.15'] },
      { id: 'access.grant_expiry', refs: ['A.8.2'] },
      { id: 'platform.https', refs: ['A.8.24'] },
      { id: 'platform.audit', refs: ['A.8.15'] },
    ],
    manual: [
      {
        id: 'manual.classification_policy',
        title: 'Information classification policy approved',
        refs: ['A.5.12'],
      },
    ],
    rules: [],
  },
];

const TITLES: Record<string, string> = {
  'masking.mode': 'Masking is on',
  'masking.scanned': 'Every database scanned in the last 30 days',
  'masking.review': 'No columns waiting for review',
  'masking.format': 'Mask formats meet the baseline',
  'access.ai': 'AI and MCP sessions always masked',
  'access.grant_expiry': 'Admin access to real values expires in time',
  'access.admins_all': 'Real values not open to all admins',
  'access.roles_restricted': 'No role sees restricted classes',
  'platform.https': 'Served over HTTPS',
  'platform.session_ttl': 'Sessions expire within 15 minutes',
  'platform.cors': 'No CORS rule allows any origin',
  'platform.rate_limit': 'Rate limits are active',
  'platform.audit': 'Audit logging is on',
  'platform.root_admin': 'A super admin is designated',
};

const CLASS_LABEL: Record<string, string> = {
  card_number: 'Card number',
  card_security: 'Card security code',
  date_of_birth: 'Date of birth',
};
const FORMAT_LABEL: Record<string, string> = {
  last4: 'Last 4',
  redact: 'Redact',
  null: 'Null',
  year: 'Year only',
};

interface Control {
  id: string;
  title: string;
  refs: string[];
  status: 'pass' | 'fail' | 'manual' | 'na';
  detail: string | null;
  fix: { kind: 'apply' | 'link' | 'none'; route: string | null };
}

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

export function installComplianceMock(page: Page, m: MaskingStateView) {
  const adopted = new Map<string, { at: string; applied: string | null }>();
  /** Baselines whose detection rules were already added. */
  const rulesAdded = new Set<string>();

  const tooLong = (b: BaselineDef) =>
    m.access.admins.grants.filter(
      g =>
        g.expires_at === null ||
        Date.parse(g.expires_at) - Date.now() > b.grantMax * HOUR + 60_000
    );
  const formatMisses = (b: BaselineDef) =>
    b.formats.filter(f => {
      const row = m.masks.find(x => x.class === f.class);
      return !!row && !f.allowed.includes(row.format);
    });
  const openRoles = () =>
    m.access.roles.filter(r => r.enabled && r.scope === 'all');
  const review = () => m.columns.filter(c => c.verdict === 'review').length;

  function evaluate(b: BaselineDef, c: Check): Control {
    const base = {
      id: c.id,
      title: c.title ?? TITLES[c.id] ?? c.id,
      refs: c.refs,
      detail: null as string | null,
    };
    const pass = (ok: boolean, fail: Partial<Control> = {}): Control => ({
      ...base,
      status: ok ? 'pass' : 'fail',
      fix: { kind: 'none', route: null },
      ...(ok ? {} : fail),
    });
    switch (c.id) {
      case 'masking.mode':
        return pass(m.mode === 'on', {
          detail:
            m.mode === 'preview' ? 'Masking is in Preview' : 'Masking is off',
          // As the server (Checks::CATALOG): Apply with masking on fixes it.
          fix: { kind: 'apply', route: null },
        });
      case 'masking.scanned':
        return pass(!!m.scan.finished_at && m.columns.length > 0, {
          detail: 'No scan yet',
          fix: { kind: 'link', route: '/api-security/data-masking' },
        });
      case 'masking.review': {
        const n = review();
        return pass(n === 0, {
          detail: `${n} ${n === 1 ? 'column' : 'columns'} to review`,
          fix: {
            kind: 'link',
            route: '/api-security/data-masking?filter=review',
          },
        });
      }
      case 'masking.format': {
        const miss = formatMisses(b);
        return {
          ...pass(miss.length === 0, {
            detail: miss
              .map(
                f => `${CLASS_LABEL[f.class] ?? f.class} is not masked enough`
              )
              .join('; '),
            fix: { kind: 'apply', route: null },
          }),
          title: b.formats.length === 1 ? b.formats[0].title : base.title,
        };
      }
      case 'access.ai':
        return pass(m.access.ai === 'masked', {
          detail: 'AI and MCP sessions see what admins see',
          fix: { kind: 'apply', route: null },
        });
      case 'access.grant_expiry': {
        const long = tooLong(b);
        return {
          ...pass(long.length === 0, {
            detail: `${long.map(g => g.name).join(', ')}: longer than ${b.grantMax} hours`,
            fix: { kind: 'apply', route: null },
          }),
          title: `Admin access to real values expires within ${b.grantMax} hours`,
        };
      }
      case 'access.admins_all':
        return pass(m.access.admins.mode !== 'all', {
          detail: 'All admins see real values',
          fix: { kind: 'link', route: '/api-security/data-masking?tab=access' },
        });
      case 'access.roles_restricted': {
        const roles = openRoles();
        return pass(roles.length === 0, {
          detail: roles.map(r => r.name).join(', '),
          fix: { kind: 'apply', route: null },
        });
      }
      case 'platform.https':
      case 'platform.audit':
      case 'platform.root_admin':
        return pass(true);
      case 'platform.session_ttl':
        return pass(false, {
          detail: 'Sessions last 1440 minutes',
          fix: { kind: 'none', route: null },
        });
      case 'platform.cors':
        return pass(false, {
          detail: '1 rule allows any origin',
          fix: { kind: 'link', route: '/system-settings/cors' },
        });
      case 'platform.rate_limit':
        return c.refs.length
          ? pass(false, {
              detail: 'No active limits',
              fix: { kind: 'link', route: '/api-security/rate-limiting' },
            })
          : { ...base, status: 'na', fix: { kind: 'none', route: null } };
      default:
        return { ...base, status: 'na', fix: { kind: 'none', route: null } };
    }
  }

  function changes(b: BaselineDef) {
    const out: { id: string; text: string }[] = [];
    if (m.mode === 'off') {
      out.push({ id: 'masking.mode', text: 'Masking mode: Preview' });
    }
    for (const f of formatMisses(b)) {
      out.push({
        id: `masking.format.${f.class}`,
        text: `${CLASS_LABEL[f.class] ?? f.class}: ${FORMAT_LABEL[f.allowed[0]] ?? f.allowed[0]}`,
      });
    }
    if (m.access.ai !== 'masked') {
      out.push({ id: 'access.ai', text: 'AI and MCP sessions: always masked' });
    }
    for (const g of tooLong(b)) {
      out.push({
        id: `access.grant_expiry.${g.admin_id}`,
        text: `${g.name}: real values for at most ${b.grantMax} hours`,
      });
    }
    if (b.rolesRestricted) {
      for (const r of openRoles()) {
        out.push({
          id: `access.roles_restricted.${r.role_id}`,
          text: `${r.name}: all except restricted`,
        });
      }
    }
    if (b.rules.length && !rulesAdded.has(b.id)) {
      out.push({
        id: 'detection.rules',
        text: `Add ${b.rules.length} detection ${b.rules.length === 1 ? 'rule' : 'rules'} for ${b.name}`,
      });
    }
    return out;
  }

  function controls(b: BaselineDef): Control[] {
    return [
      ...b.checks.map(c => evaluate(b, c)),
      ...b.manual.map(x => ({
        ...x,
        status: 'manual' as const,
        detail: null,
        fix: { kind: 'none' as const, route: null },
      })),
    ];
  }

  function summary(b: BaselineDef) {
    const cs = controls(b);
    return {
      id: b.id,
      name: b.name,
      vertical: b.vertical,
      frameworks: b.frameworks,
      adopted: adopted.has(b.id),
      score: {
        pass: cs.filter(c => c.status === 'pass').length,
        fail: cs.filter(c => c.status === 'fail').length,
        manual: cs.filter(c => c.status === 'manual').length,
        total: cs.length,
      },
    };
  }

  function detail(b: BaselineDef) {
    const a = adopted.get(b.id);
    return {
      id: b.id,
      name: b.name,
      vertical: b.vertical,
      frameworks: b.frameworks,
      adopted: !!a,
      adopted_at: a?.at ?? null,
      applied_at: a?.applied ?? null,
      controls: controls(b),
      changes: changes(b),
    };
  }

  function apply(b: BaselineDef, turnOn: boolean) {
    const now = new Date().toISOString();
    if (m.mode === 'off') m.mode = 'preview';
    for (const f of formatMisses(b)) {
      const row = m.masks.find(x => x.class === f.class)!;
      row.format = f.allowed[0];
    }
    m.access.ai = 'masked';
    for (const g of tooLong(b)) {
      g.expires_at = new Date(Date.now() + b.grantMax * HOUR).toISOString();
    }
    if (b.rolesRestricted) {
      openRoles().forEach(r => (r.scope = 'except_restricted'));
    }
    if (b.rules.length && !rulesAdded.has(b.id)) {
      for (const r of b.rules) m.rules.push({ id: m.nextRule++, ...r });
      rulesAdded.add(b.id);
    }
    if (turnOn) m.mode = 'on';
    adopted.set(b.id, { at: adopted.get(b.id)?.at ?? now, applied: now });
    m.ev(0, ME, 'baseline', `Applied the ${b.name} baseline`);
    if (turnOn) m.ev(0, ME, 'mode', 'Masking set to On');
  }

  function report(b: BaselineDef, format: string) {
    const d = detail(b);
    if (format === 'csv') {
      const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
      const rows = d.controls.map(c =>
        [c.id, c.title, c.status, c.refs.join('; '), c.detail ?? '']
          .map(esc)
          .join(',')
      );
      return ['control,title,status,refs,detail', ...rows].join('\n') + '\n';
    }
    const inventory: Record<string, number> = {};
    for (const c of m.columns)
      inventory[c.verdict] = (inventory[c.verdict] ?? 0) + 1;
    return JSON.stringify(
      {
        instance: 'mock',
        generated_at: new Date().toISOString(),
        baseline: { id: b.id, name: b.name, frameworks: b.frameworks },
        controls: d.controls.map(c => ({
          id: c.id,
          title: c.title,
          status: c.status,
          refs: c.refs,
          detail: c.detail,
        })),
        inventory,
        access: {
          admins: m.access.admins.mode,
          ai: m.access.ai,
          grants: m.access.admins.grants.length,
        },
      },
      null,
      2
    );
  }

  return page.route('**/api/v2/system/security_baseline**', async route => {
    const req = route.request();
    const url = new URL(req.url());
    const method = req.method();
    const sub = url.pathname.replace(/^.*\/system\/security_baseline/, '');
    const body = (() => {
      try {
        return req.postDataJSON() ?? {};
      } catch {
        return {};
      }
    })();
    if (sub === '' || sub === '/') {
      return json(route, { resource: BASELINES.map(summary) });
    }
    const match = sub.match(/^\/([a-z0-9_]+)(\/apply|\/report)?$/);
    const b = match && BASELINES.find(x => x.id === match[1]);
    if (!match || !b) {
      return json(route, { error: { code: 404, message: 'Not found' } }, 404);
    }
    const action = match[2] ?? '';
    if (m.forbidWrites && method !== 'GET') {
      return json(
        route,
        {
          error: {
            code: 403,
            // The server names what it refused (security_baseline).
            message: m.forbidWrites.replace(
              'Data Masking settings',
              'Compliance baselines'
            ),
            status_code: 403,
          },
        },
        403
      );
    }
    if (action === '/apply' && method === 'POST') {
      // As the server: no masking On before the first scan; Apply on a
      // never-scanned instance starts that scan (scan_started).
      const neverScanned = !m.scan.finished_at;
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
      apply(b, body.mode === 'on');
      const scanStarted = neverScanned && m.scan.status !== 'running';
      if (scanStarted) {
        m.scan.status = 'running';
        m.scan.progress = 0;
      }
      return json(route, { ...detail(b), scan_started: scanStarted });
    }
    if (action === '/report' && method === 'GET') {
      const format = url.searchParams.get('format') ?? 'json';
      return route.fulfill({
        status: 200,
        contentType: format === 'csv' ? 'text/csv' : 'application/json',
        body: report(b, format),
      });
    }
    if (action === '' && method === 'DELETE') {
      adopted.delete(b.id);
      m.ev(0, ME, 'baseline', `Stopped tracking the ${b.name} baseline`);
      return json(route, detail(b));
    }
    // GET ?mode=on: what Apply with masking turned on would change.
    if (url.searchParams.get('mode') === 'on' && m.mode !== 'on') {
      const d = detail(b);
      return json(route, {
        ...d,
        changes: [
          {
            id: 'mode',
            text:
              m.mode === 'preview'
                ? 'Turn masking on (now Preview).'
                : 'Turn masking on.',
          },
          ...d.changes.filter(c => c.id !== 'masking.mode'),
        ],
      });
    }
    return json(route, detail(b));
  });
}
