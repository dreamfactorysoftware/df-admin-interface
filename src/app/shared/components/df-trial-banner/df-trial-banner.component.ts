import { Component } from '@angular/core';
import { AsyncPipe, NgIf } from '@angular/common';
import { TranslocoModule } from '@ngneat/transloco';
import { Observable, combineLatest, map } from 'rxjs';
import { DfTrialService } from '../../services/df-trial.service';
import {
  TRIAL_CONTACT_EMAIL,
  TRIAL_DEMO_URL,
  TrialInfo,
  TrialRemaining,
} from '../../types/trial';

export interface TrialBannerViewModel {
  trial: TrialInfo;
  remaining: TrialRemaining;
  contactEmail: string;
  contactHref: string;
  demoUrl: string;
  /** trial.units.day | trial.units.days - "1 day" must never read "1 days". */
  daysUnitKey: string;
  hoursUnitKey: string;
}

/**
 * Fixed-top countdown for self-service Docker trials (TRIAL-DESIGN.md
 * section 5 / copy section 9). Replaces <df-engagement-banner> whenever the
 * environment carries a trial block, so two fixed banners never stack:
 * the engagement banner hides itself on trial instances.
 *
 * Visible pre-login (top-level `trial`) and post-login (`platform.trial`);
 * hidden while the instance is locked - the trial-expired page is the
 * message then. Severity escalates info -> warning (<= warnDays) ->
 * critical (<= criticalDays) using the UI's --df-accent / --df-warning /
 * --df-danger tokens, which repaint in light, dark and phosphor.
 */
@Component({
  selector: 'df-trial-banner',
  templateUrl: './df-trial-banner.component.html',
  styleUrls: ['./df-trial-banner.component.scss'],
  standalone: true,
  imports: [NgIf, AsyncPipe, TranslocoModule],
})
export class DfTrialBannerComponent {
  vm$: Observable<TrialBannerViewModel | null> = combineLatest([
    this.trialService.trial$,
    this.trialService.remaining$,
    this.trialService.expired$,
  ]).pipe(
    map(([trial, remaining, locked]) => {
      if (!trial || locked || trial.status !== 'active' || !remaining) {
        return null;
      }
      const contactEmail = trial.contactEmail || TRIAL_CONTACT_EMAIL;
      return {
        trial,
        remaining,
        contactEmail,
        contactHref: `mailto:${contactEmail}`,
        demoUrl: trial.demoUrl || TRIAL_DEMO_URL,
        daysUnitKey:
          remaining.days === 1 ? 'trial.units.day' : 'trial.units.days',
        hoursUnitKey:
          remaining.hours === 1 ? 'trial.units.hour' : 'trial.units.hours',
      };
    })
  );

  constructor(private trialService: DfTrialService) {}
}
