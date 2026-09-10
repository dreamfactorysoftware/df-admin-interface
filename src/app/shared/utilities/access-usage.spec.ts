import { AccessUsageRow } from '../types/access-usage';
import {
  accessUsageSortValue,
  describeAccessUsage,
  formatExactTime,
  formatRelativeTime,
  matchesNotUsedFilter,
  parseDfDate,
} from './access-usage';
import {
  ACCESS_USAGE_COLUMN,
  AccessUsageTableState,
  withAccessUsageColumn,
} from '../components/df-manage-table/access-usage-table-state';

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 8, 10, 16, 30, 0);

/** DreamFactory system date string for NOW minus `ms`. */
const dfDate = (ms: number) =>
  new Date(NOW - ms).toISOString().replace('T', ' ').slice(0, 19);

const row = (overrides: Partial<AccessUsageRow> = {}): AccessUsageRow => ({
  subjectType: 'app',
  subjectId: 1,
  name: 'key',
  isActive: true,
  lastUsedAt: null,
  lastDeniedAt: null,
  lastService: null,
  lastStatus: null,
  neverUsed: false,
  stale: false,
  disabledButAttempted: false,
  roleUnreferenced: null,
  lastLoginDate: null,
  isSysAdmin: null,
  requests30d: null,
  topServices: null,
  ...overrides,
});

const keys = (view: ReturnType<typeof describeAccessUsage>) =>
  view.tooltip.map(t => t.key);

/** Exact tooltip time for a DreamFactory date string. */
const exact = (value: string) => formatExactTime(parseDfDate(value) as Date);

describe('parseDfDate', () => {
  it('reads DreamFactory system dates as UTC', () => {
    expect(parseDfDate('2026-09-10 16:08:12')?.getTime()).toBe(
      Date.UTC(2026, 8, 10, 16, 8, 12)
    );
    expect(parseDfDate('2026-09-10T16:08')?.getTime()).toBe(
      Date.UTC(2026, 8, 10, 16, 8, 0)
    );
  });

  it('honours an explicit zone', () => {
    expect(parseDfDate('2026-09-10T16:08:12+02:00')?.getTime()).toBe(
      Date.UTC(2026, 8, 10, 14, 8, 12)
    );
  });

  it('returns null for empty or garbage input', () => {
    expect(parseDfDate(null)).toBeNull();
    expect(parseDfDate(undefined)).toBeNull();
    expect(parseDfDate('')).toBeNull();
    expect(parseDfDate('not a date')).toBeNull();
  });
});

describe('formatRelativeTime', () => {
  const at = (ms: number) => new Date(NOW - ms);

  it('uses the largest whole unit', () => {
    expect(formatRelativeTime(at(3 * DAY + 5000), NOW)).toBe('3 days ago');
    expect(formatRelativeTime(at(DAY), NOW)).toBe('yesterday');
    expect(formatRelativeTime(at(2 * 3_600_000), NOW)).toBe('2 hours ago');
    expect(formatRelativeTime(at(5 * 60_000), NOW)).toBe('5 minutes ago');
    expect(formatRelativeTime(at(45 * DAY), NOW)).toBe('last month');
    expect(formatRelativeTime(at(800 * DAY), NOW)).toBe('2 years ago');
  });

  it('reads "now" for under a minute and for future dates', () => {
    expect(formatRelativeTime(at(30_000), NOW)).toBe('now');
    expect(formatRelativeTime(at(-DAY), NOW)).toBe('now');
  });

  it('falls back to English for an invalid locale', () => {
    expect(formatRelativeTime(at(3 * DAY), NOW, 'not a locale!!')).toBe(
      '3 days ago'
    );
  });
});

describe('matchesNotUsedFilter', () => {
  const used = (days: number) => row({ lastUsedAt: dfDate(days * DAY) });

  it('passes everything for "any"', () => {
    expect(matchesNotUsedFilter(used(1), 'any', NOW)).toBe(true);
    expect(matchesNotUsedFilter(undefined, 'any', NOW)).toBe(true);
  });

  it('keeps only never-used subjects for "never"', () => {
    expect(matchesNotUsedFilter(row(), 'never', NOW)).toBe(true);
    expect(matchesNotUsedFilter(undefined, 'never', NOW)).toBe(true);
    expect(matchesNotUsedFilter(used(400), 'never', NOW)).toBe(false);
  });

  it('keeps subjects idle for at least N days, plus never used', () => {
    expect(matchesNotUsedFilter(used(100), '90', NOW)).toBe(true);
    expect(matchesNotUsedFilter(used(90), '90', NOW)).toBe(true);
    expect(matchesNotUsedFilter(used(10), '90', NOW)).toBe(false);
    expect(matchesNotUsedFilter(used(31), '30', NOW)).toBe(true);
    expect(matchesNotUsedFilter(used(179), '180', NOW)).toBe(false);
    expect(matchesNotUsedFilter(row(), '30', NOW)).toBe(true);
    expect(matchesNotUsedFilter(undefined, '180', NOW)).toBe(true);
  });
});

describe('accessUsageSortValue', () => {
  it('sorts by last-used epoch, never used as oldest', () => {
    expect(
      accessUsageSortValue(row({ lastUsedAt: '2026-09-10 16:08:12' }))
    ).toBe(Date.UTC(2026, 8, 10, 16, 8, 12));
    expect(accessUsageSortValue(row())).toBe(0);
    expect(accessUsageSortValue(undefined)).toBe(0);
  });
});

describe('describeAccessUsage', () => {
  it('renders a never-used subject muted with a single tooltip line', () => {
    const view = describeAccessUsage(row({ neverUsed: true }), NOW);
    expect(view.relative).toBeNull();
    expect(view.muted).toBe(true);
    expect(view.warning).toBe(false);
    expect(view.unreferenced).toBe(false);
    expect(keys(view)).toEqual(['accessUsage.tooltip.neverUsed']);
  });

  it('qualifies "never" with when tracking started', () => {
    const since = '2026-06-01 00:00:00';
    const view = describeAccessUsage(row({ neverUsed: true }), NOW, {
      trackingStartedAt: since,
    });
    expect(view.tooltip).toEqual([
      {
        key: 'accessUsage.tooltip.neverUsedSince',
        params: { since: exact(since) },
      },
    ]);
  });

  it('treats a missing record as never used', () => {
    const view = describeAccessUsage(undefined, NOW);
    expect(view.relative).toBeNull();
    expect(view.muted).toBe(true);
  });

  it('shows relative time plus exact time, last request and last denial', () => {
    const lastUsed = dfDate(3 * DAY);
    const lastDenied = dfDate(DAY);
    const view = describeAccessUsage(
      row({
        lastUsedAt: lastUsed,
        lastDeniedAt: lastDenied,
        lastService: 'db',
        lastStatus: 200,
      }),
      NOW
    );
    expect(view.relative).toBe('3 days ago');
    expect(view.muted).toBe(false);
    expect(view.tooltip).toEqual([
      {
        key: 'accessUsage.tooltip.lastUsed',
        params: { at: exact(lastUsed) },
      },
      {
        key: 'accessUsage.tooltip.lastUsedOn',
        params: { service: 'db', status: 200 },
      },
      {
        key: 'accessUsage.tooltip.lastDenied',
        params: { at: exact(lastDenied) },
      },
    ]);
  });

  it('falls back to the service-only line when status is missing', () => {
    const view = describeAccessUsage(
      row({ lastUsedAt: dfDate(DAY), lastService: 'files' }),
      NOW
    );
    expect(view.tooltip[1]).toEqual({
      key: 'accessUsage.tooltip.lastUsedOnService',
      params: { service: 'files' },
    });
  });

  it('never attributes a service to a subject with no recorded use', () => {
    const view = describeAccessUsage(
      row({ lastService: 'db', lastStatus: 200, lastDeniedAt: dfDate(DAY) }),
      NOW
    );
    expect(keys(view)).toEqual([
      'accessUsage.tooltip.neverUsed',
      'accessUsage.tooltip.lastDenied',
    ]);
  });

  it('mutes stale subjects and names the window when known', () => {
    const stale = row({ lastUsedAt: dfDate(120 * DAY), stale: true });
    const withWindow = describeAccessUsage(stale, NOW, { staleDays: 90 });
    expect(withWindow.muted).toBe(true);
    expect(withWindow.tooltip).toContainEqual({
      key: 'accessUsage.tooltip.stale',
      params: { days: 90 },
    });
    expect(keys(describeAccessUsage(stale, NOW))).toContain(
      'accessUsage.tooltip.staleNoWindow'
    );
  });

  it('flags an inactive credential that is still being sent', () => {
    const view = describeAccessUsage(
      row({
        isActive: false,
        disabledButAttempted: true,
        lastDeniedAt: dfDate(3_600_000),
      }),
      NOW
    );
    expect(view.warning).toBe(true);
    expect(keys(view)[0]).toBe('accessUsage.tooltip.disabledButAttempted');
    expect(keys(view)).toContain('accessUsage.tooltip.lastDenied');
  });

  it('flags only roles explicitly marked unreferenced', () => {
    const role = row({ subjectType: 'role', roleUnreferenced: true });
    expect(describeAccessUsage(role, NOW).unreferenced).toBe(true);
    expect(keys(describeAccessUsage(role, NOW))).toContain(
      'accessUsage.tooltip.unreferenced'
    );
    expect(
      describeAccessUsage(row({ roleUnreferenced: false }), NOW).unreferenced
    ).toBe(false);
    expect(describeAccessUsage(row(), NOW).unreferenced).toBe(false);
  });

  it('adds last login and 30-day volume for users when present', () => {
    const view = describeAccessUsage(
      row({
        subjectType: 'user',
        lastUsedAt: dfDate(DAY),
        lastLoginDate: dfDate(2 * DAY),
        requests30d: 0,
      }),
      NOW
    );
    expect(keys(view)).toContain('accessUsage.tooltip.lastLogin');
    expect(view.tooltip).toContainEqual({
      key: 'accessUsage.tooltip.requests30d',
      params: { count: 0 },
    });
  });
});

describe('withAccessUsageColumn', () => {
  const base = [
    { columnDef: 'name', header: 'name' },
    { columnDef: 'tokens', header: 'tokens' },
    { columnDef: 'actions' },
  ];

  it('inserts before actions by default without mutating the input', () => {
    const next = withAccessUsageColumn(base, 'accessUsage.lastUsed');
    expect(next.map(c => c.columnDef)).toEqual([
      'name',
      'tokens',
      ACCESS_USAGE_COLUMN,
      'actions',
    ]);
    expect(next).not.toBe(base);
    expect(base.length).toBe(3);
  });

  it('inserts before a named column, or appends when it is absent', () => {
    expect(
      withAccessUsageColumn(base, 'h', 'tokens').map(c => c.columnDef)
    ).toEqual(['name', ACCESS_USAGE_COLUMN, 'tokens', 'actions']);
    expect(
      withAccessUsageColumn([{ columnDef: 'name' }], 'h').map(c => c.columnDef)
    ).toEqual(['name', ACCESS_USAGE_COLUMN]);
  });

  it('is idempotent', () => {
    const once = withAccessUsageColumn(base, 'h');
    expect(withAccessUsageColumn(once, 'h')).toBe(once);
  });
});

describe('AccessUsageTableState', () => {
  it('matches every row while unavailable', () => {
    const state = new AccessUsageTableState();
    state.filter.setValue('never');
    expect(state.available).toBe(false);
    expect(state.filterActive).toBe(false);
    expect(state.matches(1)).toBe(true);
  });

  it('filters and sorts through the fetched map once applied', () => {
    const state = new AccessUsageTableState();
    state.apply({
      available: true,
      rows: new Map([[1, row({ lastUsedAt: dfDate(DAY) })]]),
      meta: {
        subject: 'app',
        staleDays: 60,
        generatedAt: '2026-09-10 16:30:00',
        ledgerAvailable: false,
        trackingStartedAt: '2026-06-01 00:00:00',
      },
    });
    expect(state.staleDays).toBe(60);
    expect(state.trackingStartedAt).toBe('2026-06-01 00:00:00');
    state.filter.setValue('never');
    expect(state.filterActive).toBe(true);
    expect(state.matches(1, NOW)).toBe(false);
    expect(state.matches(2, NOW)).toBe(true);
    expect(state.sortValue(1)).toBe(NOW - DAY);
    expect(state.get(null)).toBeUndefined();
  });
});
