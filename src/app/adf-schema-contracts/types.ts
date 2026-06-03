/**
 * TypeScript shapes for the /api/v2/system/schema_contract/* endpoints.
 *
 * IMPORTANT: every HTTP response goes through `caseInterceptor`, which
 * recursively converts API snake_case keys to camelCase. These interfaces
 * therefore use camelCase, even though the canonical JSON documented in
 * df-schema-contracts/docs/{CANONICAL_SCHEMA_JSON,SYSTEM_API}.md uses
 * snake_case on the wire.
 */

export type ContractMode = 'none' | 'auto' | 'strict';

export type DriftSeverity =
  | 'breaking'
  | 'potentially_breaking'
  | 'additive'
  | 'cosmetic';

export interface DriftSummary {
  breakingCount: number;
  potentiallyBreakingCount: number;
  additiveCount: number;
  cosmeticCount: number;
  totalChanges: number;
}

export interface DriftChange {
  severity: DriftSeverity;
  kind: string;
  path: string;
  table: string;
  detail: Record<string, unknown>;
}

export interface SnapshotMeta {
  version: number;
  hash: string;
  createdDate: string | null;
}

export interface TableEntry {
  name: string;
  catalog: string | null;
  schema: string | null;
  type: string;
  locked: boolean;
  snapshot: SnapshotMeta | null;
  drift: {
    hasDrift: boolean;
    hasBreaking: boolean;
    summary: DriftSummary;
  } | null;
}

export interface TablesResponse {
  service: string;
  mode: ContractMode;
  summary: {
    tablesTotal: number;
    tablesLocked: number;
    tablesWithDrift: number;
    tablesWithBreaking: number;
  };
  tables: TableEntry[];
  describeError: string | null;
}

/**
 * Service-level rollup from GET /schema_contract/{service}. Distinct from
 * TablesResponse: focuses on service-wide metadata (mode, retention,
 * snapshot counts, latest promotion) rather than per-table drift.
 */
export interface ServiceSummary {
  service: string;
  mode: ContractMode;
  archiveRetentionCount: number | null;
  snapshotCounts: {
    active: number;
    archived: number;
    total: number;
  };
  latestPromotion: string | null;
  drift: {
    hasDrift: boolean;
    hasBreaking: boolean;
    tablesWithDrift: number;
    tablesWithBreaking: number;
    summary: DriftSummary;
  } | null;
  describeError?: string | null;
}

export interface TableDiffResponse {
  service: string;
  table: string;
  checkedAt: string;
  activeSnapshotVersion: number;
  activeSnapshotHash: string;
  hasDrift: boolean;
  hasBreaking: boolean;
  summary: DriftSummary;
  changes: DriftChange[];
  candidate: Record<string, unknown> | null;
}

export interface LockResponse {
  id: number;
  serviceId: number;
  serviceName: string;
  tableCatalog: string | null;
  tableSchema: string | null;
  tableName: string;
  objectType: string;
  contractVersion: number;
  schemaHash: string;
  status: string;
  createdDate: string | null;
  lastModifiedDate: string | null;
  lockResult: 'locked' | 'promoted' | 'no_change' | null;
  schema: Record<string, unknown>;
}

/**
 * Dry-run preview from POST /test. Always returns a candidate; drift report
 * is empty when there's no active snapshot to compare against. The
 * `wouldBeAction` field tells the UI what Lock would do right now.
 */
export interface TestResponse {
  service: string;
  table: string;
  checkedAt: string;
  wouldBeVersion: number;
  wouldBeAction: 'locked' | 'promoted' | 'no_change';
  activeSnapshotVersion: number | null;
  activeSnapshotHash: string | null;
  candidateHash: string;
  hasDrift: boolean;
  hasBreaking: boolean;
  summary: DriftSummary;
  changes: DriftChange[];
  candidate: Record<string, unknown>;
}

/**
 * History row from GET /snapshots — metadata only, no schema_json. Use
 * getSnapshotVersion() to fetch a specific version's full content.
 */
export interface SnapshotHistoryEntry {
  id: number;
  contractVersion: number;
  status: 'active' | 'archived';
  objectType: string;
  tableCatalog: string | null;
  tableSchema: string | null;
  schemaHash: string;
  createdDate: string | null;
  lastModifiedDate: string | null;
}

export interface SnapshotHistoryResponse {
  service: string;
  table: string;
  versions: SnapshotHistoryEntry[];
}

export interface ServiceDescriptor {
  id: number;
  name: string;
  label: string;
  type: string;
}

export interface UpdateServiceConfigBody {
  mode?: ContractMode;
  archiveRetentionCount?: number | null;
}

export interface PromoteTableResult {
  table: string;
  fromVersion: number;
  toVersion: number;
}

export interface PromoteNeedsReviewEntry {
  table: string;
  version: number;
  reason: 'breaking_drift' | 'strict_mode' | 'table_removed';
  hasBreaking: boolean;
  summary: DriftSummary;
}

export interface PromoteResponse {
  service: string;
  mode: ContractMode;
  summary: {
    tablesEvaluated: number;
    tablesPromoted: number;
    tablesNeedsReview: number;
    tablesNoDrift: number;
  };
  promoted: PromoteTableResult[];
  needsReview: PromoteNeedsReviewEntry[];
  skippedNoDrift: string[];
}

export interface UnlockServiceResponse {
  service: string;
  result: 'unlocked';
  snapshotsArchived: number;
  serviceConfigRemoved: boolean;
}

/**
 * OpenAPI schema for one table from GET /tables/{table}/openapi. `source`
 * tells you whether the schema is frozen to a locked snapshot or reflects
 * live schema (mode-dependent).
 */
export interface TableOpenApiResponse {
  service: string;
  table: string;
  source: 'snapshot' | 'live';
  snapshotVersion: number | null;
  schemaName: string;
  schema: Record<string, unknown>;
}
