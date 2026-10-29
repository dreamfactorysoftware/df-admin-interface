/**
 * Data Masking API types, as the UI sees them: responses pass through the
 * case interceptor, so snake_case wire keys arrive camelCased
 * (finished_at -> finishedAt, can_grant -> canGrant).
 */
import { MaskFormat, Tier } from './data-masking.catalog';

export type MaskingMode = 'off' | 'preview' | 'on';
export type Verdict = 'masked' | 'review' | 'clear';
export type StripMark = Tier | 'clear' | 'review';

/** A database service as the coverage lists name it. */
export interface CoverageService {
  service: string;
  label: string;
  /** Service type, e.g. "pgsql", "mongodb". */
  type: string;
}

/** A database the last scan could not read. `reason` carries no data. */
export interface ScanFailure {
  serviceId?: number;
  service: string;
  label: string;
  reason?: string | null;
}

export type ScanOutcome = 'done' | 'partial' | 'failed';

export interface MaskingOverview {
  mode: MaskingMode;
  scan: {
    status: 'idle' | 'running';
    progress?: number | null;
    finishedAt?: string | null;
    columns: number;
    /** Outcome of the last finished scan; null before the first one. */
    lastStatus?: ScanOutcome | null;
    /** Databases the last scan could not read. */
    failed?: ScanFailure[];
    /**
     * The server could not read its scan history (a database error), so
     * finishedAt, lastStatus and failed say nothing: "never scanned" is
     * unknown, not true.
     */
    unknown?: boolean;
  };
  counts: { masked: number; review: number; clear: number };
  you: {
    canGrant: boolean;
    seesRealValues: boolean;
    grantExpiresAt?: string | null;
  };
  /**
   * SQL services Data Masking covers, and database services it cannot mask
   * (humans and apps are unaffected; AI sessions are blocked from them
   * while masking is on).
   */
  coverage?: {
    covered: CoverageService[];
    uncovered: CoverageService[];
  };
}

export type EvidenceKind = 'name' | 'values' | 'context' | 'text' | 'penalty';

export interface EvidenceLine {
  points: number;
  kind: EvidenceKind;
  text: string;
}

export interface Evidence {
  total: number;
  thresholdMask: number;
  thresholdReview: number;
  lines: EvidenceLine[];
  /** [shape, percent] pairs, e.g. ["999-99-9999", 100]. */
  shapes?: [string, number][];
}

export interface MaskedColumn {
  /** service.table.column */
  id: string;
  service: string;
  table: string;
  column: string;
  type: string;
  verdict: Verdict;
  class: string | null;
  tier: Tier | null;
  source: 'detected' | 'admin';
  decidedBy?: string | null;
  decidedAt?: string | null;
  confidence: number;
  /** Masked rendering of a real value; never raw for masked/review. */
  example?: string | null;
  /** Format `example` was rendered with. */
  format?: MaskFormat | null;
  evidence: Evidence;
}

export interface TableSummary {
  name: string;
  rows?: number | null;
  columns: { masked: number; review: number; clear: number };
  /** One mark per column; review marks keep their tier for the outline. */
  strip: { column: string; mark: StripMark; tier?: Tier | null }[];
}

export interface ServiceTables {
  service: string;
  label: string;
  /**
   * When the service was last scanned; null = never. Tells a scanned
   * database that holds no tables (`tables: []`) from one never scanned.
   */
  scannedAt?: string | null;
  /** Why the last scan could not read this database; null when it could. */
  scanError?: string | null;
  /** The scan history could not be read: scannedAt null means unknown. */
  scanUnknown?: boolean;
  tables: TableSummary[];
}

export type AdminAccessMode = 'none' | 'selected' | 'all';
export type GrantDuration = '1h' | '8h' | '24h' | '7d' | 'forever';

export interface AdminGrant {
  adminId: number;
  name: string;
  email: string;
  /** null = until turned off. */
  expiresAt: string | null;
}

export interface AdminRow {
  adminId: number;
  name: string;
  email: string;
  you?: boolean;
}

export interface RoleAccess {
  roleId: number;
  name: string;
  enabled: boolean;
  scope: 'all' | 'except_restricted';
}

export interface AccessSettings {
  admins: {
    mode: AdminAccessMode;
    grants: AdminGrant[];
    /** Every admin the super admin can pick from. */
    available: AdminRow[];
  };
  ai: 'masked' | 'same_as_admins';
  roles: RoleAccess[];
  /**
   * Opaque version of these settings. PATCH sends it back; the server
   * answers 409 when someone changed access since it was read.
   */
  version?: string;
}

/**
 * PATCH /access body. `grants` is the complete desired list; a grant with a
 * duration (new, or re-timed) gets a fresh expiry from the server, one
 * without keeps the expiry it has. `roles` lists only the roles that change.
 * `version` is added by the store from the last read.
 */
export interface AccessPatch {
  admins?: {
    mode?: AdminAccessMode;
    grants?: { adminId: number; duration?: GrantDuration }[];
  };
  ai?: 'masked' | 'same_as_admins';
  roles?: { roleId: number; enabled: boolean; scope: RoleAccess['scope'] }[];
  version?: string;
}

export interface MaskSetting {
  class: string;
  tier: Tier;
  format: MaskFormat;
  formatsAllowed: MaskFormat[];
}

export interface DetectionRule {
  id: number;
  match: 'name' | 'value';
  pattern: string;
  class: string;
  matches: number;
  /** 'admin', or 'baseline:<id>' for a rule a Compliance baseline added. */
  source?: string;
}

export interface RuleTestResult {
  matches: { id: string }[];
  /** Value rules sample live under a time budget; true when it ran out. */
  partial?: boolean;
}

export type ActivityKind =
  | 'mode'
  | 'decision'
  | 'access'
  | 'scan'
  | 'blocked'
  | 'rule'
  | 'baseline'
  /** Aggregated "would mask" rows while the mode is Preview. */
  | 'preview';

export interface ActivityEvent {
  id: number;
  at: string;
  actor: string;
  kind: ActivityKind;
  text: string;
  target?: string | null;
}

/** One page of activity, newest first. */
export interface ActivityPage {
  events: ActivityEvent[];
  /** Older events exist beyond this page (`before` the last id). */
  hasMore: boolean;
}

export interface ActivityQuery {
  /** Only these kinds; all kinds when absent. */
  kinds?: ActivityKind[] | null;
  limit?: number;
  /** Events older than this activity id. */
  before?: number;
}

/** A Compliance baseline as the list endpoint returns it. */
export interface BaselineSummary {
  id: string;
  name: string;
  adopted: boolean;
}

export interface Detector {
  class: string;
  detectors: string[];
}

export interface BuiltInRules {
  ruleset: string;
  version: string;
  classes: Detector[];
}
