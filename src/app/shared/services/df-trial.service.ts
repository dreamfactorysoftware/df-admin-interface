import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  distinctUntilChanged,
  map,
  of,
  shareReplay,
  switchMap,
  timer,
} from 'rxjs';
import { DfSystemConfigDataService } from './df-system-config-data.service';
import {
  TRIAL_CONTACT_EMAIL,
  TRIAL_DEFAULT_CRITICAL_DAYS,
  TRIAL_DEFAULT_WARN_DAYS,
  TRIAL_DEMO_URL,
  TRIAL_PORTAL_URL,
  TrialInfo,
  TrialLock,
  TrialLockContext,
  TrialLockReason,
  TrialRemaining,
  TrialSeverity,
} from '../types/trial';
import {
  splitTrialRemaining,
  trialDaysRemaining,
  trialFromEnvironment,
  trialHoursRemaining,
  trialLockFromStatus,
  trialSeverity,
} from '../utilities/trial';

/**
 * Single source of truth for the self-service Docker trial state in the UI
 * (TRIAL-DESIGN.md section 5).
 *
 * - `trial$`     the trial block from /system/environment (platform.trial once
 *                logged in, top-level trial before login); null on non-trial
 *                installs so every consumer stays dormant.
 * - `expired$`   true while the instance is LOCKED (402 TRIAL_EXPIRED or 403
 *                TRIAL_TOKEN_INVALID seen by errorInterceptor / the bootstrap
 *                initializer, or a locked status in the trial block). `lock$`
 *                carries the reason + context for the trial-expired page.
 * - `remaining$` a cosmetic 1 s countdown derived from `expiresAt`. The
 *                server is authoritative: the client clock is only used for
 *                the ticking display and is corrected by the skew between
 *                `expiresAt - secondsRemaining` and `Date.now()` at receipt.
 *
 * Guards and the interceptor read `isLocked` / `lock` synchronously, the same
 * BehaviorSubject + getter pattern DfLicenseCheckService uses.
 */
@Injectable({
  providedIn: 'root',
})
export class DfTrialService {
  private lockSubject = new BehaviorSubject<TrialLock | null>(null);

  /** Lock reason + context, null while the trial is active. */
  lock$: Observable<TrialLock | null> = this.lockSubject.asObservable();

  /** True while the UI must show the trial-expired page and drop the shell. */
  expired$: Observable<boolean> = this.lock$.pipe(
    map(lock => lock !== null),
    distinctUntilChanged()
  );

  trial$: Observable<TrialInfo | null> =
    this.systemConfigService.environment$.pipe(
      map(environment => trialFromEnvironment(environment)),
      distinctUntilChanged(
        (a, b) =>
          a?.status === b?.status &&
          a?.trialId === b?.trialId &&
          a?.expiresAt === b?.expiresAt &&
          a?.secondsRemaining === b?.secondsRemaining
      ),
      shareReplay({ bufferSize: 1, refCount: true })
    );

  /**
   * Ticks every second while a trial with an `expiresAt` is known; null
   * otherwise. Clamped at zero - the API lock, not this counter, ends the trial.
   */
  remaining$: Observable<TrialRemaining | null> = this.trial$.pipe(
    switchMap(trial => {
      if (!trial?.expiresAt) {
        return of(null);
      }
      const expiresAtMs = Date.parse(trial.expiresAt);
      if (!Number.isFinite(expiresAtMs)) {
        return of(null);
      }
      // Server "now" at receipt = expiresAt - secondsRemaining. The difference
      // to the browser clock is applied to every tick so a wrong client clock
      // (or TZ confusion) cannot show a countdown the server disagrees with.
      const serverNowMs = expiresAtMs - trial.secondsRemaining * 1000;
      const skewMs = Number.isFinite(serverNowMs)
        ? serverNowMs - this.now()
        : 0;
      const warnDays = trial.warnDays ?? TRIAL_DEFAULT_WARN_DAYS;
      const criticalDays = trial.criticalDays ?? TRIAL_DEFAULT_CRITICAL_DAYS;
      return timer(0, 1000).pipe(
        map(() => {
          const totalSeconds = Math.floor(
            (expiresAtMs - (this.now() + skewMs)) / 1000
          );
          return splitTrialRemaining(totalSeconds, warnDays, criticalDays);
        })
      );
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  constructor(private systemConfigService: DfSystemConfigDataService) {
    // A trial block that itself reports expired/invalid/missing locks the UI
    // (same reasons as the error envelope); an active block after a lock
    // (new token + restart, then a successful refetch) releases it.
    this.trial$.subscribe(trial => {
      const lock = trialLockFromStatus(trial);
      if (lock) {
        this.markLocked(lock.reason, lock.context);
      } else if (trial?.status === 'active' && this.isLocked) {
        this.clearLock();
      }
    });
  }

  /** Snapshot of the trial block (null on non-trial installs). */
  get trial(): TrialInfo | null {
    return trialFromEnvironment(this.systemConfigService.environment);
  }

  get lock(): TrialLock | null {
    return this.lockSubject.value;
  }

  get isLocked(): boolean {
    return this.lockSubject.value !== null;
  }

  /**
   * Record a lock seen on the wire. Idempotent; a later call with the same
   * reason only enriches the context (e.g. expired_at arriving on a second
   * response). Contact/demo/portal fall back to the section-9 constants so
   * the expired page always has working CTAs.
   */
  markLocked(
    reason: TrialLockReason,
    context: Partial<TrialLockContext> = {}
  ): void {
    const current = this.lockSubject.value;
    const trial = this.trial;
    const merged: TrialLockContext = {
      ...(current?.reason === reason ? current.context : {}),
      ...context,
      reason,
      contact_email:
        context.contact_email ??
        current?.context.contact_email ??
        trial?.contactEmail ??
        TRIAL_CONTACT_EMAIL,
      demo_url:
        context.demo_url ??
        current?.context.demo_url ??
        trial?.demoUrl ??
        TRIAL_DEMO_URL,
      portal_url:
        context.portal_url ??
        current?.context.portal_url ??
        trial?.portalUrl ??
        TRIAL_PORTAL_URL,
    };
    if (merged.expired_at === undefined && reason === 'TRIAL_EXPIRED') {
      merged.expired_at = trial?.expiresAt ?? null;
    }
    if (merged.trial_id === undefined) {
      merged.trial_id = trial?.trialId ?? null;
    }
    this.lockSubject.next({ reason, context: merged });
  }

  clearLock(): void {
    if (this.lockSubject.value !== null) {
      this.lockSubject.next(null);
    }
  }

  /** Whole days left for a seconds count - the "29" in "29 days, 4 hours". */
  daysRemaining(totalSeconds: number): number {
    return trialDaysRemaining(totalSeconds);
  }

  /** Hours left after whole days (0-23) - the "4" in "29 days, 4 hours". */
  hoursRemaining(totalSeconds: number): number {
    return trialHoursRemaining(totalSeconds);
  }

  /**
   * info > warnDays >= warning > criticalDays >= critical, using the trial's
   * own thresholds (DF_TRIAL_WARN_DAYS / DF_TRIAL_CRITICAL_DAYS) when known.
   */
  severity(
    totalSeconds: number,
    trial: TrialInfo | null = this.trial
  ): TrialSeverity {
    return trialSeverity(
      totalSeconds,
      trial?.warnDays ?? TRIAL_DEFAULT_WARN_DAYS,
      trial?.criticalDays ?? TRIAL_DEFAULT_CRITICAL_DAYS
    );
  }

  /** Clock seam for tests. */
  protected now(): number {
    return Date.now();
  }
}
