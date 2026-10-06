import { HttpErrorResponse } from '@angular/common/http';
import {
  TRIAL_LOCK_HTTP_STATUSES,
  TRIAL_LOCK_REASONS,
  TrialInfo,
  TrialLock,
  TrialLockContext,
  TrialLockReason,
  TrialRemaining,
  TrialSeverity,
} from '../types/trial';
import { Environment } from '../types/system';
import { isAppError } from './app-error';

const SECONDS_PER_DAY = 86400;
const SECONDS_PER_HOUR = 3600;

export function isTrialLockReason(value: unknown): value is TrialLockReason {
  return (
    typeof value === 'string' &&
    (TRIAL_LOCK_REASONS as ReadonlyArray<string>).includes(value)
  );
}

/**
 * The trial block wherever the backend put it: `platform.trial` once logged
 * in, top-level `trial` before login (no `platform` block pre-auth).
 */
export function trialFromEnvironment(
  environment: Environment | null | undefined
): TrialInfo | null {
  return environment?.platform?.trial ?? environment?.trial ?? null;
}

/**
 * Detects the df-trial locked envelope on any error shape the app handles:
 * the raw HttpErrorResponse (inside interceptors / retry), a normalized
 * AppError, or a bare body. Locked means HTTP 402 or 403 AND
 * error.context.reason in {TRIAL_EXPIRED, TRIAL_REVOKED, TRIAL_TOKEN_INVALID}; a plain 403
 * (role denied) or 402 without the reason is NOT a trial lock.
 */
export function trialLockFromError(err: unknown): TrialLock | null {
  let status: number | undefined;
  let body: unknown;
  let context: unknown;

  if (isAppError(err)) {
    status = err.status;
    body = err.raw;
    context = err.context;
  } else if (err instanceof HttpErrorResponse) {
    status = err.status;
    body = err.error;
  } else if (err && typeof err === 'object') {
    body = err;
  } else {
    return null;
  }

  const envelope =
    body && typeof body === 'object'
      ? (body as { error?: unknown }).error
      : undefined;
  if (envelope && typeof envelope === 'object') {
    const env = envelope as {
      code?: unknown;
      status_code?: unknown;
      context?: unknown;
    };
    if (context === undefined) {
      context = env.context;
    }
    if (status === undefined) {
      const code = Number(env.status_code ?? env.code);
      status = Number.isFinite(code) ? code : undefined;
    }
  }

  if (status === undefined || !TRIAL_LOCK_HTTP_STATUSES.includes(status)) {
    return null;
  }
  if (!context || typeof context !== 'object') {
    return null;
  }
  const reason = (context as { reason?: unknown }).reason;
  if (!isTrialLockReason(reason)) {
    return null;
  }
  return { reason, context: context as TrialLockContext };
}

/**
 * A trial block that reports a locked status (e.g. the `/status`-shaped block
 * or a future environment payload) maps onto the same lock reasons the error
 * envelope uses: expired -> TRIAL_EXPIRED, revoked -> TRIAL_REVOKED,
 * invalid/missing -> TRIAL_TOKEN_INVALID.
 */
export function trialLockFromStatus(trial: TrialInfo | null): TrialLock | null {
  if (!trial) {
    return null;
  }
  switch (trial.status) {
    case 'expired':
      return {
        reason: 'TRIAL_EXPIRED',
        context: {
          reason: 'TRIAL_EXPIRED',
          trial_id: trial.trialId,
          expired_at: trial.expiresAt,
          contact_email: trial.contactEmail,
          demo_url: trial.demoUrl,
          portal_url: trial.portalUrl,
        },
      };
    case 'revoked':
      return {
        reason: 'TRIAL_REVOKED',
        context: {
          reason: 'TRIAL_REVOKED',
          trial_id: trial.trialId,
          contact_email: trial.contactEmail,
          demo_url: trial.demoUrl,
          portal_url: trial.portalUrl,
        },
      };
    case 'invalid':
    case 'missing':
      return {
        reason: 'TRIAL_TOKEN_INVALID',
        context: {
          reason: 'TRIAL_TOKEN_INVALID',
          detail: trial.status === 'missing' ? 'missing_token' : undefined,
          trial_id: trial.trialId,
          contact_email: trial.contactEmail,
          demo_url: trial.demoUrl,
          portal_url: trial.portalUrl,
        },
      };
    default:
      return null;
  }
}

/**
 * Severity thresholds compare whole days the way the server reports them
 * (days_remaining = ceil(seconds / 86400)), so the banner flips to warning
 * exactly when System Info says "7 days remaining", not an hour later.
 */
export function trialSeverity(
  secondsRemaining: number,
  warnDays: number,
  criticalDays: number
): TrialSeverity {
  const days = Math.ceil(Math.max(0, secondsRemaining) / SECONDS_PER_DAY);
  if (days <= criticalDays) {
    return 'critical';
  }
  if (days <= warnDays) {
    return 'warning';
  }
  return 'info';
}

/** Whole days left (floor) - the "29" in "29 days, 4 hours remaining". */
export function trialDaysRemaining(totalSeconds: number): number {
  return Math.floor(Math.max(0, totalSeconds) / SECONDS_PER_DAY);
}

/** Hours left after the whole days (0-23) - the "4" in "29 days, 4 hours remaining". */
export function trialHoursRemaining(totalSeconds: number): number {
  return Math.floor(
    (Math.max(0, totalSeconds) % SECONDS_PER_DAY) / SECONDS_PER_HOUR
  );
}

export function splitTrialRemaining(
  totalSeconds: number,
  warnDays: number,
  criticalDays: number
): TrialRemaining {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  return {
    totalSeconds: clamped,
    days: trialDaysRemaining(clamped),
    hours: trialHoursRemaining(clamped),
    minutes: Math.floor((clamped % SECONDS_PER_HOUR) / 60),
    seconds: clamped % 60,
    severity: trialSeverity(clamped, warnDays, criticalDays),
  };
}
