import {
  TestBed,
  fakeAsync,
  tick,
  discardPeriodicTasks,
} from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { DfTrialService } from './df-trial.service';
import { DfSystemConfigDataService } from './df-system-config-data.service';
import { Environment } from '../types/system';
import { TrialInfo, TrialLock, TrialRemaining } from '../types/trial';

const DAY = 86400;

const BASE_ENV: Environment = {
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

/** A trial block consistent with "now": expiresAt = now + secondsRemaining. */
function trialExpiringIn(
  secondsRemaining: number,
  overrides: Partial<TrialInfo> = {}
): TrialInfo {
  const now = Date.now();
  return {
    status: 'active',
    trialId: 'trl_01TEST',
    email: 'user@company.com',
    plan: 'gold-trial',
    startedAt: new Date(now - DAY).toISOString(),
    expiresAt: new Date(now + secondsRemaining * 1000).toISOString(),
    daysRemaining: Math.max(0, Math.ceil(secondsRemaining / DAY)),
    secondsRemaining,
    warnDays: 7,
    criticalDays: 3,
    contactEmail: 'sales@dreamfactory.com',
    demoUrl: 'https://www.dreamfactory.com/demo',
    portalUrl: 'https://portal.dreamfactory.com',
    version: '7.7.1',
    ...overrides,
  };
}

describe('DfTrialService', () => {
  let environment$: BehaviorSubject<Environment>;
  let service: DfTrialService;

  beforeEach(() => {
    environment$ = new BehaviorSubject<Environment>(BASE_ENV);
    TestBed.configureTestingModule({
      providers: [
        {
          provide: DfSystemConfigDataService,
          useValue: {
            environment$: environment$.asObservable(),
            get environment() {
              return environment$.value;
            },
          },
        },
      ],
    });
    service = TestBed.inject(DfTrialService);
  });

  describe('trial$', () => {
    it('is null on a non-trial install so consumers stay dormant', () => {
      let latest: TrialInfo | null | undefined;
      service.trial$.subscribe(t => (latest = t));
      expect(latest).toBeNull();
      expect(service.trial).toBeNull();
    });

    it('surfaces the top-level block pre-login and platform.trial post-login', () => {
      const seen: Array<TrialInfo | null> = [];
      service.trial$.subscribe(t => seen.push(t));

      const preLogin = trialExpiringIn(29 * DAY);
      environment$.next({ ...BASE_ENV, trial: preLogin });
      expect(seen[seen.length - 1]).toBe(preLogin);

      const postLogin = { ...preLogin, trialId: 'trl_PLATFORM' };
      environment$.next({
        ...BASE_ENV,
        platform: { trial: postLogin } as Environment['platform'],
      });
      expect(seen[seen.length - 1]?.trialId).toBe('trl_PLATFORM');
      expect(service.trial?.trialId).toBe('trl_PLATFORM');
    });
  });

  describe('remaining$ countdown', () => {
    it('is null without a trial', fakeAsync(() => {
      let latest: TrialRemaining | null | undefined = undefined;
      const sub = service.remaining$.subscribe(r => (latest = r));
      tick(0);
      expect(latest).toBeNull();
      sub.unsubscribe();
    }));

    it('computes days/hours from expiresAt and ticks once per second', fakeAsync(() => {
      environment$.next({
        ...BASE_ENV,
        trial: trialExpiringIn(29 * DAY + 4 * 3600 + 30),
      });
      const ticks: TrialRemaining[] = [];
      const sub = service.remaining$.subscribe(r => r && ticks.push(r));
      tick(0);
      expect(ticks).toHaveLength(1);
      expect(ticks[0].days).toBe(29);
      expect(ticks[0].hours).toBe(4);
      expect(ticks[0].severity).toBe('info');
      expect(service.daysRemaining(ticks[0].totalSeconds)).toBe(29);
      expect(service.hoursRemaining(ticks[0].totalSeconds)).toBe(4);

      tick(1000);
      expect(ticks).toHaveLength(2);
      expect(ticks[1].totalSeconds).toBe(ticks[0].totalSeconds - 1);

      tick(30_000);
      expect(ticks).toHaveLength(32);
      expect(ticks[31].totalSeconds).toBe(ticks[0].totalSeconds - 31);
      // 29d 4h 30s minus 31 s rolls the hour over: 29d 3h 59m 59s
      expect(ticks[31].days).toBe(29);
      expect(ticks[31].hours).toBe(3);
      expect(ticks[31].minutes).toBe(59);
      expect(ticks[31].seconds).toBe(59);
      sub.unsubscribe();
      discardPeriodicTasks();
    }));

    it('escalates to warning at warnDays and critical at criticalDays', fakeAsync(() => {
      const results: TrialRemaining[] = [];
      const sub = service.remaining$.subscribe(r => r && results.push(r));

      environment$.next({ ...BASE_ENV, trial: trialExpiringIn(6 * DAY + 10) });
      tick(0);
      expect(results[results.length - 1].severity).toBe('warning');

      environment$.next({ ...BASE_ENV, trial: trialExpiringIn(2 * DAY + 10) });
      tick(0);
      expect(results[results.length - 1].severity).toBe('critical');

      environment$.next({
        ...BASE_ENV,
        trial: trialExpiringIn(10 * DAY, { warnDays: 14, criticalDays: 3 }),
      });
      tick(0);
      expect(results[results.length - 1].severity).toBe('warning');
      sub.unsubscribe();
      discardPeriodicTasks();
    }));

    it('corrects for client clock skew using the server-reported secondsRemaining', fakeAsync(() => {
      // Browser clock is 2 days AHEAD of the server: expiresAt is only 1 day
      // away by the client clock but the server says 3 days remain.
      const trial = trialExpiringIn(1 * DAY, { secondsRemaining: 3 * DAY });
      environment$.next({ ...BASE_ENV, trial });
      let latest = null as TrialRemaining | null;
      const sub = service.remaining$.subscribe(r => (latest = r));
      tick(0);
      expect(latest?.days).toBe(3);
      expect(latest?.hours).toBe(0);
      sub.unsubscribe();
      discardPeriodicTasks();
    }));

    it('never goes negative once the expiry passes (server lock ends the trial)', fakeAsync(() => {
      environment$.next({ ...BASE_ENV, trial: trialExpiringIn(2) });
      let latest = null as TrialRemaining | null;
      const sub = service.remaining$.subscribe(r => (latest = r));
      tick(0);
      expect(latest?.totalSeconds).toBe(2);
      tick(5000);
      expect(latest?.totalSeconds).toBe(0);
      expect(latest?.severity).toBe('critical');
      sub.unsubscribe();
      discardPeriodicTasks();
    }));

    it('severity() helper uses the trial thresholds', () => {
      environment$.next({
        ...BASE_ENV,
        trial: trialExpiringIn(20 * DAY, { warnDays: 10, criticalDays: 2 }),
      });
      expect(service.severity(20 * DAY)).toBe('info');
      expect(service.severity(10 * DAY)).toBe('warning');
      expect(service.severity(2 * DAY)).toBe('critical');
    });
  });

  describe('lock state', () => {
    it('starts unlocked', () => {
      let expired: boolean | undefined;
      service.expired$.subscribe(e => (expired = e));
      expect(expired).toBe(false);
      expect(service.isLocked).toBe(false);
      expect(service.lock).toBeNull();
    });

    it('markLocked flips expired$ and fills section-9 defaults into the context', () => {
      const expired: boolean[] = [];
      let lock: TrialLock | null = null;
      service.expired$.subscribe(e => expired.push(e));
      service.lock$.subscribe(l => (lock = l));

      service.markLocked('TRIAL_EXPIRED', {
        reason: 'TRIAL_EXPIRED',
        expired_at: '2026-11-02T20:00:00+00:00',
      });

      expect(expired).toEqual([false, true]);
      expect(service.isLocked).toBe(true);
      expect(lock).toEqual({
        reason: 'TRIAL_EXPIRED',
        context: {
          reason: 'TRIAL_EXPIRED',
          expired_at: '2026-11-02T20:00:00+00:00',
          trial_id: null,
          contact_email: 'sales@dreamfactory.com',
          demo_url: 'https://www.dreamfactory.com/demo',
          portal_url: 'https://portal.dreamfactory.com',
        },
      });
    });

    it('markLocked is idempotent and enriches an existing lock of the same reason', () => {
      const expired: boolean[] = [];
      service.expired$.subscribe(e => expired.push(e));
      service.markLocked('TRIAL_EXPIRED', { reason: 'TRIAL_EXPIRED' });
      service.markLocked('TRIAL_EXPIRED', {
        reason: 'TRIAL_EXPIRED',
        trial_id: 'trl_X',
      });
      expect(expired).toEqual([false, true]); // distinctUntilChanged
      expect(service.lock?.context.trial_id).toBe('trl_X');
    });

    it('falls back to the known trial block for expired_at / trial id', () => {
      const trial = trialExpiringIn(0);
      environment$.next({ ...BASE_ENV, trial });
      service.markLocked('TRIAL_EXPIRED');
      expect(service.lock?.context.expired_at).toBe(trial.expiresAt);
      expect(service.lock?.context.trial_id).toBe('trl_01TEST');
    });

    it('clearLock releases the UI', () => {
      service.markLocked('TRIAL_TOKEN_INVALID', {
        reason: 'TRIAL_TOKEN_INVALID',
      });
      service.clearLock();
      expect(service.isLocked).toBe(false);
    });

    it('locks from a trial block that reports expired/invalid/missing and releases on active', () => {
      environment$.next({
        ...BASE_ENV,
        trial: trialExpiringIn(0, { status: 'expired' }),
      });
      expect(service.lock?.reason).toBe('TRIAL_EXPIRED');

      environment$.next({
        ...BASE_ENV,
        trial: trialExpiringIn(0, {
          status: 'missing',
          trialId: null,
          expiresAt: null,
        }),
      });
      expect(service.lock?.reason).toBe('TRIAL_TOKEN_INVALID');

      environment$.next({ ...BASE_ENV, trial: trialExpiringIn(29 * DAY) });
      expect(service.isLocked).toBe(false);
    });
  });
});
