import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@ngneat/transloco';
import { MatButtonModule } from '@angular/material/button';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faCheck, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { DfBadgeComponent } from '../df-badge/df-badge.component';
import { ROUTES } from 'src/app/shared/types/routes';

/**
 * One row of the onboarding checklist.
 *
 * `key` is both the stable trackBy id and the default i18n sub-key under
 * `onboardingChecklist.steps.{key}` (`.title` / `.description` / `.cta`). A
 * caller may override any resolved string inline (`title` / `description` /
 * `ctaLabel`) — mirroring `df-artifact-card`'s "caller supplies translated
 * text" contract — but the canonical five-step path leaves them undefined and
 * lets the component's own transloco copy render.
 *
 * `done` is a fact derived from a real config count, never a guess. `route` is
 * the single CTA target for that step (a `routerLink` value).
 */
export interface OnboardingStep {
  /** Stable id + default i18n sub-key. */
  key: string;
  /** routerLink target for this step's one CTA. */
  route: string | unknown[];
  /** Completed — must come from a real count, never fabricated. */
  done: boolean;
  /** Optional already-translated title override. */
  title?: string;
  /** Optional already-translated helper override. */
  description?: string;
  /** Optional already-translated CTA label override. */
  ctaLabel?: string;
}

/** Visual state a row resolves to, for template branching. */
export type OnboardingStepState = 'done' | 'active' | 'upcoming';

/**
 * df-onboarding-checklist — the Home activation engine (Meridian Phase 2).
 *
 * An ordered list of the five setup steps that take an instance from empty to a
 * working, AI-scoped API: Connect a datasource / Generate an API / Create an
 * API key / Make your first call / Scope a role for AI access. It is the hero of
 * Home's zero-service state (spec 3.1, State A) and self-dismisses once every
 * step is done.
 *
 * Each step self-checks from a REAL config count passed in by the mounting
 * surface (`serviceCount`, `apiKeyCount`, `roleCount`, `firstCallMade`) — the
 * component never invents a completion. Completed steps render a `--df-success`
 * check plus a `df-badge` "Done"; exactly the FIRST incomplete step carries the
 * one active primary CTA; every later step is dimmed with no CTA, so the user
 * always has a single obvious next action.
 *
 * The host owns any server-side persistence of dismissal; this component stays
 * pure and emits `(completed)` the moment the last step flips to done and
 * `(stepCta)` when the active CTA is used, so the host can record progress.
 *
 * Tokens only (no color/type literals, survives phosphor). i18n via transloco.
 *
 * @example
 *   <df-onboarding-checklist
 *     [serviceCount]="services.length"
 *     [apiKeyCount]="keys.length"
 *     [roleCount]="aiRoles.length"
 *     [firstCallMade]="hasLoggedRequest"
 *     (completed)="dismissChecklist()">
 *   </df-onboarding-checklist>
 */
@Component({
  selector: 'df-onboarding-checklist',
  templateUrl: './df-onboarding-checklist.component.html',
  styleUrls: ['./df-onboarding-checklist.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    NgClass,
    RouterLink,
    TranslocoModule,
    MatButtonModule,
    FontAwesomeModule,
    DfBadgeComponent,
  ],
})
export class DfOnboardingChecklistComponent {
  /**
   * Full step override. When provided it is rendered verbatim (order + done
   * flags honored). When omitted the five canonical steps are computed from the
   * count inputs below.
   */
  @Input() steps?: OnboardingStep[];

  /** Real datasource-service count. Drives steps 1 and 2 (connect => API). */
  @Input() serviceCount = 0;
  /** Real API-key/app count. Drives step 3. */
  @Input() apiKeyCount = 0;
  /** Real count of roles scoped for AI access. Drives step 5. */
  @Input() roleCount = 0;
  /** Whether any request has been logged against this instance. Drives step 4. */
  @Input() firstCallMade = false;

  /**
   * Hide the header (eyebrow + title + subtitle) when the checklist is embedded
   * under a surface that already provides its own heading.
   */
  @Input() showHeader = true;

  /** Fired once every step is done, so the host can persist the dismissal. */
  @Output() completed = new EventEmitter<void>();
  /** Fired when the active step's CTA is used, carrying that step. */
  @Output() stepCta = new EventEmitter<OnboardingStep>();

  readonly faCheck: IconDefinition = faCheck;
  readonly faArrowRight: IconDefinition = faArrowRight;

  private lastEmittedComplete = false;

  /** The steps actually rendered: the override, else the computed canon. */
  get resolvedSteps(): OnboardingStep[] {
    const steps = this.steps ?? this.defaultSteps;
    this.maybeEmitComplete(steps);
    return steps;
  }

  /** Index of the first incomplete step; -1 when all are done. */
  get activeIndex(): number {
    return this.resolvedSteps.findIndex(s => !s.done);
  }

  get allComplete(): boolean {
    const steps = this.steps ?? this.defaultSteps;
    return steps.length > 0 && steps.every(s => s.done);
  }

  /** Resolve a row to its visual state given the single active index. */
  stateOf(index: number, step: OnboardingStep): OnboardingStepState {
    if (step.done) {
      return 'done';
    }
    return index === this.activeIndex ? 'active' : 'upcoming';
  }

  trackByKey(_index: number, step: OnboardingStep): string {
    return step.key;
  }

  onCtaClick(step: OnboardingStep): void {
    this.stepCta.emit(step);
  }

  /**
   * The five canonical steps, each `done` flag derived from a real count and
   * each CTA pointed at the route that completes it. Connecting a datasource is
   * what generates its API in DreamFactory, so both share `serviceCount`.
   */
  private get defaultSteps(): OnboardingStep[] {
    const base = `/${ROUTES.API_CONNECTIONS}`;
    const hasService = this.serviceCount > 0;
    return [
      {
        key: 'connectDatasource',
        route: `${base}/${ROUTES.API_TYPES}`,
        done: hasService,
      },
      {
        key: 'generateApi',
        route: `${base}/${ROUTES.API_DOCS}`,
        done: hasService,
      },
      {
        key: 'createApiKey',
        route: `${base}/${ROUTES.API_KEYS}`,
        done: this.apiKeyCount > 0,
      },
      {
        key: 'firstCall',
        route: `${base}/${ROUTES.API_DOCS}`,
        done: this.firstCallMade,
      },
      {
        key: 'scopeRole',
        route: `${base}/${ROUTES.ROLE_BASED_ACCESS}`,
        done: this.roleCount > 0,
      },
    ];
  }

  private maybeEmitComplete(steps: OnboardingStep[]): void {
    const complete = steps.length > 0 && steps.every(s => s.done);
    if (complete && !this.lastEmittedComplete) {
      this.lastEmittedComplete = true;
      // Defer so the emission never fires mid-change-detection of the getter.
      queueMicrotask(() => this.completed.emit());
    } else if (!complete) {
      this.lastEmittedComplete = false;
    }
  }
}
