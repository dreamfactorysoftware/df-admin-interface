import { AccessUsageRow, NotUsedFilter } from '../types/access-usage';

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/** A translation key plus its interpolation params. */
export interface TranslatableText {
  key: string;
  params?: Record<string, string | number>;
}

/** Presentation model for one "Last used" cell. */
export interface AccessUsageCellView {
  /** Relative wording ("3 days ago"), or null when never used. */
  relative: string | null;
  /** Never used or stale: render quietly. */
  muted: boolean;
  /** Inactive subject whose credential is still being sent. */
  warning: boolean;
  /** Role that nothing references. */
  unreferenced: boolean;
  /** Tooltip lines, translated and joined by the cell. */
  tooltip: TranslatableText[];
}

export interface DescribeAccessUsageOptions {
  locale?: string;
  /** Stale window the endpoint applied (meta.stale_days). */
  staleDays?: number | null;
  /** meta.tracking_started_at: "Never" only means "not since then". */
  trackingStartedAt?: string | null;
}

export const NOT_USED_FILTER_OPTIONS: ReadonlyArray<{
  value: NotUsedFilter;
  label: string;
}> = [
  { value: 'any', label: 'accessUsage.filter.any' },
  { value: '30', label: 'accessUsage.filter.days30' },
  { value: '90', label: 'accessUsage.filter.days90' },
  { value: '180', label: 'accessUsage.filter.days180' },
  { value: 'never', label: 'accessUsage.filter.never' },
];

const DF_DATE =
  /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?$/;

/**
 * Parse a DreamFactory system date (`YYYY-MM-DD HH:mm:ss`, server time,
 * treated as UTC). Strings carrying an explicit zone fall through to
 * Date.parse. Returns null for empty or unparseable input.
 */
export function parseDfDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  const m = DF_DATE.exec(trimmed);
  const ms = m
    ? Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] ?? 0))
    : Date.parse(trimmed);
  return Number.isNaN(ms) ? null : new Date(ms);
}

const RELATIVE_UNITS: ReadonlyArray<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 365 * DAY_MS],
  ['month', 30 * DAY_MS],
  ['week', 7 * DAY_MS],
  ['day', DAY_MS],
  ['hour', HOUR_MS],
  ['minute', MINUTE_MS],
];

function relativeFormatter(locale: string): Intl.RelativeTimeFormat {
  try {
    return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  } catch {
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  }
}

/** "3 days ago", "yesterday", "now". Future dates (clock skew) read "now". */
export function formatRelativeTime(
  date: Date,
  now: number,
  locale = 'en'
): string {
  const diff = Math.max(0, now - date.getTime());
  const rtf = relativeFormatter(locale);
  for (const [unit, size] of RELATIVE_UNITS) {
    if (diff >= size) {
      return rtf.format(-Math.floor(diff / size), unit);
    }
  }
  return rtf.format(0, 'second');
}

/** Exact local timestamp for tooltips. */
export function formatExactTime(date: Date, locale = 'en'): string {
  try {
    return date.toLocaleString(locale, {
      dateStyle: 'medium',
      timeStyle: 'medium',
    });
  } catch {
    return date.toISOString();
  }
}

/**
 * Client-side "Not used in" predicate. A subject with no usage record counts
 * as never used (the endpoint is queried with include_never_used=true, so a
 * missing record means the subject was created after the fetch).
 */
export function matchesNotUsedFilter(
  usage: AccessUsageRow | undefined,
  filter: NotUsedFilter,
  now: number
): boolean {
  if (filter === 'any') {
    return true;
  }
  const lastUsed = parseDfDate(usage?.lastUsedAt);
  if (filter === 'never') {
    return !lastUsed;
  }
  if (!lastUsed) {
    return true;
  }
  return now - lastUsed.getTime() >= Number(filter) * DAY_MS;
}

/** Sort key for the "Last used" column: epoch ms, never used sorts oldest. */
export function accessUsageSortValue(
  usage: AccessUsageRow | undefined
): number {
  return parseDfDate(usage?.lastUsedAt)?.getTime() ?? 0;
}

export function describeAccessUsage(
  usage: AccessUsageRow | undefined,
  now: number,
  options: DescribeAccessUsageOptions = {}
): AccessUsageCellView {
  const locale = options.locale || 'en';
  const lastUsed = parseDfDate(usage?.lastUsedAt);
  const lastDenied = parseDfDate(usage?.lastDeniedAt);
  const lastLogin = parseDfDate(usage?.lastLoginDate);
  const trackingSince = parseDfDate(options.trackingStartedAt);
  const warning = !!usage?.disabledButAttempted;
  const unreferenced = usage?.roleUnreferenced === true;
  const tooltip: TranslatableText[] = [];

  if (warning) {
    tooltip.push({ key: 'accessUsage.tooltip.disabledButAttempted' });
  }
  if (lastUsed) {
    tooltip.push({
      key: 'accessUsage.tooltip.lastUsed',
      params: { at: formatExactTime(lastUsed, locale) },
    });
    // last_service / last_status describe the last *use*; denials only
    // move last_denied_at.
    if (usage?.lastService) {
      tooltip.push(
        usage.lastStatus != null
          ? {
              key: 'accessUsage.tooltip.lastUsedOn',
              params: { service: usage.lastService, status: usage.lastStatus },
            }
          : {
              key: 'accessUsage.tooltip.lastUsedOnService',
              params: { service: usage.lastService },
            }
      );
    }
  } else {
    // Tracking starts at upgrade, so "never" is only "not since then".
    tooltip.push(
      trackingSince
        ? {
            key: 'accessUsage.tooltip.neverUsedSince',
            params: { since: formatExactTime(trackingSince, locale) },
          }
        : { key: 'accessUsage.tooltip.neverUsed' }
    );
  }
  if (lastDenied) {
    tooltip.push({
      key: 'accessUsage.tooltip.lastDenied',
      params: { at: formatExactTime(lastDenied, locale) },
    });
  }
  if (usage?.stale && lastUsed) {
    tooltip.push(
      options.staleDays
        ? {
            key: 'accessUsage.tooltip.stale',
            params: { days: options.staleDays },
          }
        : { key: 'accessUsage.tooltip.staleNoWindow' }
    );
  }
  if (lastLogin) {
    tooltip.push({
      key: 'accessUsage.tooltip.lastLogin',
      params: { at: formatExactTime(lastLogin, locale) },
    });
  }
  if (usage?.requests30d != null) {
    tooltip.push({
      key: 'accessUsage.tooltip.requests30d',
      params: { count: usage.requests30d },
    });
  }
  if (unreferenced) {
    tooltip.push({ key: 'accessUsage.tooltip.unreferenced' });
  }

  return {
    relative: lastUsed ? formatRelativeTime(lastUsed, now, locale) : null,
    muted: !lastUsed || !!usage?.stale || !!usage?.neverUsed,
    warning,
    unreferenced,
    tooltip,
  };
}
