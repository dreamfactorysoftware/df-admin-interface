/** Subject kinds reported by GET system/access_usage. */
export type AccessUsageSubject = 'app' | 'role' | 'user';

export interface AccessUsageTopService {
  service: string;
  requests: number;
}

/**
 * One subject's usage record from GET system/access_usage, in the camelCase
 * shape the case interceptor delivers. Dates are DreamFactory system format
 * (`YYYY-MM-DD HH:mm:ss`, server time, treated as UTC).
 */
export interface AccessUsageRow {
  subjectType: AccessUsageSubject;
  subjectId: number;
  name: string | null;
  isActive: boolean | null;
  lastUsedAt: string | null;
  lastDeniedAt: string | null;
  lastService: string | null;
  lastStatus: number | null;
  neverUsed: boolean;
  stale: boolean;
  disabledButAttempted: boolean;
  /** Boolean for roles only; null for other subjects. */
  roleUnreferenced: boolean | null;
  /** Users only. */
  lastLoginDate: string | null;
  /** Users only (the user subject includes admins). */
  isSysAdmin: boolean | null;
  /** Null when the activity ledger is unavailable (OSS). */
  requests30d: number | null;
  topServices: AccessUsageTopService[] | null;
}

export interface AccessUsageMeta {
  subject: AccessUsageSubject;
  staleDays: number;
  generatedAt: string;
  ledgerAvailable: boolean;
  /** Earliest recorded activity (tracking starts at upgrade, plus any
   *  ledger backfill); null when nothing has been recorded yet. */
  trackingStartedAt: string | null;
}

/**
 * Result of one fetch. `available` is false whenever the endpoint could not be
 * used (older DreamFactory 404, restricted admin 403, network or shape error);
 * callers then hide every access-usage affordance.
 */
export interface AccessUsageResult {
  available: boolean;
  rows: Map<number, AccessUsageRow>;
  meta: AccessUsageMeta | null;
}

/** "Not used in" filter values: any, N days, or never used. */
export type NotUsedFilter = 'any' | '30' | '90' | '180' | 'never';
