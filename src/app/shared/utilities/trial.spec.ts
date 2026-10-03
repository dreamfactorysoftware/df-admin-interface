import { HttpErrorResponse } from '@angular/common/http';
import { normalizeError } from './app-error';
import {
  splitTrialRemaining,
  trialDaysRemaining,
  trialFromEnvironment,
  trialHoursRemaining,
  trialLockFromError,
  trialLockFromStatus,
  trialSeverity,
} from './trial';
import { TrialInfo } from '../types/trial';
import { Environment } from '../types/system';

const DAY = 86400;

export const ACTIVE_TRIAL: TrialInfo = {
  status: 'active',
  trialId: 'trl_01TEST',
  email: 'user@company.com',
  plan: 'gold-trial',
  startedAt: '2026-10-03T20:00:00+00:00',
  expiresAt: '2026-11-02T20:00:00+00:00',
  daysRemaining: 30,
  secondsRemaining: 29 * DAY + 4 * 3600 + 30,
  warnDays: 7,
  criticalDays: 3,
  contactEmail: 'sales@dreamfactory.com',
  demoUrl: 'https://www.dreamfactory.com/demo',
  portalUrl: 'https://portal.dreamfactory.com',
  version: '7.7.1',
};

const EXPIRED_ENVELOPE = {
  error: {
    code: 402,
    status_code: 402,
    context: {
      reason: 'TRIAL_EXPIRED',
      trial_id: 'trl_01TEST',
      expired_at: '2026-11-02T20:00:00+00:00',
      contact_email: 'sales@dreamfactory.com',
      demo_url: 'https://www.dreamfactory.com/demo',
      portal_url: 'https://portal.dreamfactory.com',
    },
    message:
      'This trial instance of DreamFactory has expired. To continue using the platform, contact us at sales@dreamfactory.com.',
  },
};

const INVALID_ENVELOPE = {
  error: {
    code: 403,
    status_code: 403,
    context: { reason: 'TRIAL_TOKEN_INVALID', detail: 'missing_token' },
    message:
      'This DreamFactory trial instance needs a valid trial token. Copy DF_TRIAL_TOKEN from your dashboard at https://portal.dreamfactory.com or contact sales@dreamfactory.com.',
  },
};

function httpError(status: number, body: unknown) {
  return new HttpErrorResponse({
    status,
    error: body,
    url: '/api/v2/system/environment',
  });
}

describe('trialLockFromError', () => {
  it('detects 402 TRIAL_EXPIRED on a raw HttpErrorResponse', () => {
    const lock = trialLockFromError(httpError(402, EXPIRED_ENVELOPE));
    expect(lock).toEqual({
      reason: 'TRIAL_EXPIRED',
      context: EXPIRED_ENVELOPE.error.context,
    });
  });

  it('detects 403 TRIAL_TOKEN_INVALID on a raw HttpErrorResponse', () => {
    const lock = trialLockFromError(httpError(403, INVALID_ENVELOPE));
    expect(lock?.reason).toBe('TRIAL_TOKEN_INVALID');
    expect(lock?.context.detail).toBe('missing_token');
  });

  it('detects the lock on a normalized AppError (context preserved)', () => {
    const appError = normalizeError(httpError(402, EXPIRED_ENVELOPE));
    expect(appError.context).toEqual(EXPIRED_ENVELOPE.error.context);
    expect(trialLockFromError(appError)?.reason).toBe('TRIAL_EXPIRED');
  });

  it('ignores a plain 403 (role denied) without context.reason', () => {
    const body = {
      error: { code: 403, status_code: 403, message: 'Access denied.' },
    };
    expect(trialLockFromError(httpError(403, body))).toBeNull();
  });

  it('ignores a 403 whose reason is something else', () => {
    const body = {
      error: { code: 403, context: { reason: 'MFA_REQUIRED' }, message: 'x' },
    };
    expect(trialLockFromError(httpError(403, body))).toBeNull();
  });

  it('ignores reasons on statuses other than 402/403 (never hijacks 401)', () => {
    const body = {
      error: {
        code: 401,
        context: { reason: 'TRIAL_EXPIRED' },
        message: 'Unauthorized',
      },
    };
    expect(trialLockFromError(httpError(401, body))).toBeNull();
  });

  it('falls back to the envelope status when given a bare body', () => {
    expect(trialLockFromError(EXPIRED_ENVELOPE)?.reason).toBe('TRIAL_EXPIRED');
  });

  it('returns null for network errors, strings and nullish input', () => {
    expect(
      trialLockFromError(
        new HttpErrorResponse({ status: 0, error: new ProgressEvent('error') })
      )
    ).toBeNull();
    expect(trialLockFromError('boom')).toBeNull();
    expect(trialLockFromError(undefined)).toBeNull();
    expect(trialLockFromError(null)).toBeNull();
  });
});

describe('trialFromEnvironment', () => {
  const base: Environment = {
    authentication: {
      allowOpenRegistration: false,
      openRegEmailServiceId: 0,
      allowForeverSessions: false,
      loginAttribute: 'email',
      adldap: [],
      oauth: [],
      saml: [],
    },
    server: { host: '', machine: '', release: '', serverOs: '', version: '' },
  };

  it('returns null on a non-trial install', () => {
    expect(trialFromEnvironment(base)).toBeNull();
    expect(trialFromEnvironment(undefined)).toBeNull();
  });

  it('reads the top-level block before login', () => {
    expect(trialFromEnvironment({ ...base, trial: ACTIVE_TRIAL })).toBe(
      ACTIVE_TRIAL
    );
  });

  it('prefers platform.trial once logged in', () => {
    const platformTrial = { ...ACTIVE_TRIAL, trialId: 'trl_PLATFORM' };
    const env = {
      ...base,
      trial: ACTIVE_TRIAL,
      platform: { trial: platformTrial } as Environment['platform'],
    };
    expect(trialFromEnvironment(env)?.trialId).toBe('trl_PLATFORM');
  });
});

describe('trialLockFromStatus', () => {
  it('maps expired -> TRIAL_EXPIRED with the expiry date', () => {
    const lock = trialLockFromStatus({ ...ACTIVE_TRIAL, status: 'expired' });
    expect(lock?.reason).toBe('TRIAL_EXPIRED');
    expect(lock?.context.expired_at).toBe(ACTIVE_TRIAL.expiresAt);
  });

  it('maps invalid and missing -> TRIAL_TOKEN_INVALID', () => {
    expect(
      trialLockFromStatus({ ...ACTIVE_TRIAL, status: 'invalid' })?.reason
    ).toBe('TRIAL_TOKEN_INVALID');
    const missing = trialLockFromStatus({ ...ACTIVE_TRIAL, status: 'missing' });
    expect(missing?.reason).toBe('TRIAL_TOKEN_INVALID');
    expect(missing?.context.detail).toBe('missing_token');
  });

  it('returns null for active and null input', () => {
    expect(trialLockFromStatus(ACTIVE_TRIAL)).toBeNull();
    expect(trialLockFromStatus(null)).toBeNull();
  });
});

describe('trialSeverity / remaining helpers', () => {
  it('escalates info -> warning -> critical on whole days like the server', () => {
    expect(trialSeverity(30 * DAY, 7, 3)).toBe('info');
    expect(trialSeverity(7 * DAY + 1, 7, 3)).toBe('info'); // ceil -> 8 days
    expect(trialSeverity(7 * DAY, 7, 3)).toBe('warning');
    expect(trialSeverity(4 * DAY, 7, 3)).toBe('warning');
    expect(trialSeverity(3 * DAY, 7, 3)).toBe('critical');
    expect(trialSeverity(60, 7, 3)).toBe('critical');
    expect(trialSeverity(0, 7, 3)).toBe('critical');
    expect(trialSeverity(-5, 7, 3)).toBe('critical');
  });

  it('honours custom thresholds', () => {
    expect(trialSeverity(10 * DAY, 14, 5)).toBe('warning');
    expect(trialSeverity(5 * DAY, 14, 5)).toBe('critical');
  });

  it('splits "29 days, 4 hours" the way the banner prints it', () => {
    const r = splitTrialRemaining(29 * DAY + 4 * 3600 + 5 * 60 + 9, 7, 3);
    expect(r).toEqual({
      totalSeconds: 29 * DAY + 4 * 3600 + 5 * 60 + 9,
      days: 29,
      hours: 4,
      minutes: 5,
      seconds: 9,
      severity: 'info',
    });
    expect(trialDaysRemaining(29 * DAY + 4 * 3600)).toBe(29);
    expect(trialHoursRemaining(29 * DAY + 4 * 3600)).toBe(4);
  });

  it('clamps negative remaining to zero (the API lock ends the trial, not the clock)', () => {
    expect(splitTrialRemaining(-42, 7, 3)).toEqual({
      totalSeconds: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      severity: 'critical',
    });
  });
});
