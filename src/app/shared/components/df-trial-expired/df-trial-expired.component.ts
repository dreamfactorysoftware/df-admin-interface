import { Component } from '@angular/core';
import { AsyncPipe, DatePipe, NgIf } from '@angular/common';
import { TranslocoModule } from '@ngneat/transloco';
import { Observable, combineLatest, map } from 'rxjs';
import { DfTrialService } from '../../services/df-trial.service';
import {
  TRIAL_CONTACT_EMAIL,
  TRIAL_DEMO_URL,
  TRIAL_PORTAL_URL,
  TrialLockReason,
} from '../../types/trial';

export interface TrialExpiredViewModel {
  reason: TrialLockReason;
  invalid: boolean;
  /** ISO date the trial ended (TRIAL_EXPIRED only; null when unknown). */
  endedAt: string | null;
  trialId: string | null;
  contactEmail: string;
  contactHref: string;
  demoUrl: string;
  portalUrl: string;
}

/**
 * Full-screen lockout page for self-service Docker trials (route
 * `trial-expired`; TRIAL-DESIGN.md section 5, copy section 9). The shell
 * drops side-nav and toolbar while DfTrialService.expired$ is true, so this
 * owns the whole viewport. Offline-safe: tokens + transloco only, no Calendly,
 * no Material icons, no remote assets.
 *
 * Two variants keyed on the lock reason:
 * - TRIAL_EXPIRED (402):       thank-you + "ended on <date>" + both CTAs
 * - TRIAL_TOKEN_INVALID (403): needs-a-valid-token copy + portal link + CTAs
 */
@Component({
  selector: 'df-trial-expired',
  templateUrl: './df-trial-expired.component.html',
  styleUrls: ['./df-trial-expired.component.scss'],
  standalone: true,
  imports: [NgIf, AsyncPipe, DatePipe, TranslocoModule],
})
export class DfTrialExpiredComponent {
  vm$: Observable<TrialExpiredViewModel> = combineLatest([
    this.trialService.lock$,
    this.trialService.trial$,
  ]).pipe(
    map(([lock, trial]) => {
      const reason: TrialLockReason = lock?.reason ?? 'TRIAL_EXPIRED';
      const context = lock?.context;
      const contactEmail =
        context?.contact_email || trial?.contactEmail || TRIAL_CONTACT_EMAIL;
      const endedAt =
        reason === 'TRIAL_EXPIRED'
          ? (context?.expired_at ?? trial?.expiresAt ?? null)
          : null;
      return {
        reason,
        invalid: reason === 'TRIAL_TOKEN_INVALID',
        endedAt,
        trialId: context?.trial_id ?? trial?.trialId ?? null,
        contactEmail,
        contactHref: `mailto:${contactEmail}`,
        demoUrl: context?.demo_url || trial?.demoUrl || TRIAL_DEMO_URL,
        portalUrl: context?.portal_url || trial?.portalUrl || TRIAL_PORTAL_URL,
      };
    })
  );

  constructor(private trialService: DfTrialService) {}
}
