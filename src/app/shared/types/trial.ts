/**
 * Self-service Docker trial (design contract TRIAL-DESIGN.md section 4.4 / 5).
 *
 * The dreamfactory/df-trial package injects one `trial` block into
 * GET /api/v2/system/environment (as `platform.trial`, or top-level `trial`
 * before login when there is no `platform`) and into GET /status (as `trial`).
 * The wire format is snake_case; caseInterceptor camelCases success bodies, so
 * the interface below uses the camelCase names the app actually sees.
 *
 * Error bodies are NEVER case-transformed, so the lock context (error.context
 * of the 402/403 envelope) keeps its snake_case keys.
 */
export type TrialStatus =
  | 'active'
  | 'expired'
  | 'revoked'
  | 'invalid'
  | 'missing';

export interface TrialInfo {
  status: TrialStatus;
  trialId: string | null;
  email: string | null;
  plan: string | null;
  /** ISO-8601, UTC. null when the token is missing/invalid. */
  startedAt: string | null;
  /** ISO-8601, UTC. null when the token is missing/invalid. */
  expiresAt: string | null;
  /** ceil(secondsRemaining / 86400), min 0 - server authoritative. */
  daysRemaining: number;
  secondsRemaining: number;
  warnDays: number;
  criticalDays: number;
  contactEmail: string;
  demoUrl: string;
  portalUrl: string;
  version: string;
}

/**
 * error.context.reason of a locked instance: 402 expired, 402 revoked (df-trial >= 0.1.3, remote revocation by
 * DreamFactory, CONTRACT-REVOCATION.md section 5), 403 invalid.
 */
export type TrialLockReason =
  | 'TRIAL_EXPIRED'
  | 'TRIAL_REVOKED'
  | 'TRIAL_TOKEN_INVALID';

/** error.context of the locked envelope; snake_case because error bodies are raw. */
export interface TrialLockContext {
  reason: TrialLockReason;
  trial_id?: string | null;
  expired_at?: string | null;
  /** TRIAL_REVOKED only: ISO date DreamFactory deactivated the trial. */
  revoked_at?: string | null;
  detail?: string;
  contact_email?: string;
  demo_url?: string;
  portal_url?: string;
}

export interface TrialLock {
  reason: TrialLockReason;
  context: TrialLockContext;
}

/** Banner escalation: info (> warnDays) > warning (<= warnDays) > critical (<= criticalDays). */
export type TrialSeverity = 'info' | 'warning' | 'critical';

export interface TrialRemaining {
  totalSeconds: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  severity: TrialSeverity;
}

/** Section 9 constants - used as fallbacks when the wire block omits them. */
export const TRIAL_CONTACT_EMAIL = 'sales@dreamfactory.com';
export const TRIAL_DEMO_URL = 'https://www.dreamfactory.com/demo';
export const TRIAL_PORTAL_URL = 'https://portal.dreamfactory.com';
export const TRIAL_DEFAULT_WARN_DAYS = 7;
export const TRIAL_DEFAULT_CRITICAL_DAYS = 3;

export const TRIAL_LOCK_REASONS: ReadonlyArray<TrialLockReason> = [
  'TRIAL_EXPIRED',
  'TRIAL_REVOKED',
  'TRIAL_TOKEN_INVALID',
];
/** HTTP statuses the instance uses for a locked trial (402 expired/revoked, 403 invalid). */
export const TRIAL_LOCK_HTTP_STATUSES: ReadonlyArray<number> = [402, 403];
