/**
 * Compliance baseline API types, as the UI sees them: responses pass through
 * the case interceptor, so snake_case wire keys arrive camelCased
 * (adopted_at -> adoptedAt). Backend contract, section 8.
 */

export type ControlStatus = 'pass' | 'fail' | 'manual' | 'na';

export interface BaselineScore {
  pass: number;
  fail: number;
  manual: number;
  total: number;
}

/** One row of GET /system/security_baseline. */
export interface BaselineSummary {
  id: string;
  name: string;
  /** healthcare | payments | banking | government | privacy | general */
  vertical: string;
  frameworks: string[];
  adopted: boolean;
  score: BaselineScore;
}

export interface ControlFix {
  /**
   * apply: Apply fixes it. link: the admin fixes it at `route`.
   * none: nothing DreamFactory can do (or nothing to do).
   */
  kind: 'apply' | 'link' | 'none';
  route: string | null;
}

export interface BaselineControl {
  id: string;
  title: string;
  /** Framework control references, e.g. "45 CFR 164.312(b)". */
  refs: string[];
  status: ControlStatus;
  /** Why it failed or what was found; never data values. */
  detail: string | null;
  fix: ControlFix;
}

/** One line of what Apply would change right now. */
export interface BaselineChange {
  id: string;
  text: string;
}

/** GET /system/security_baseline/{id} (and the apply response). */
export interface BaselineDetail {
  id: string;
  name: string;
  vertical: string;
  frameworks: string[];
  adopted: boolean;
  adoptedAt: string | null;
  appliedAt: string | null;
  controls: BaselineControl[];
  /** Exactly what Apply would change now; empty when nothing to do. */
  changes: BaselineChange[];
  /**
   * Apply response only (`scan_started`): Apply ran on an instance that
   * was never scanned, so it started the first scan.
   */
  scanStarted?: boolean;
}

export type ReportFormat = 'json' | 'csv';
