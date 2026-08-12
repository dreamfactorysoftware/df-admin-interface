import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@ngneat/transloco';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faArrowRight,
  faCircleCheck,
  faShieldHalved,
} from '@fortawesome/free-solid-svg-icons';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { DfBadgeComponent } from 'src/app/shared/components/df-badge/df-badge.component';
import { ServiceHealth } from 'src/app/shared/types/service';
import { DfServiceHealthService } from '../df-manage-services/df-service-health.service';

/**
 * df-service-health-panel — the Services table's Health chip, opened up on the
 * service's own page.
 *
 * The table chip hides its reasons behind a menu, which is fine for scanning a
 * list but useless where you would act on them. Here each failing rule is a
 * row: the consequence in plain words plus the deep link to the config that
 * clears it. A passing service collapses to one quiet line rather than a
 * green wall - there is nothing to act on, so it should not compete with the
 * config form below it.
 *
 * Scoring is not duplicated: DfServiceHealthService.derive() is the one
 * definition of service health, shared with the table, and its context is
 * cached app-wide so opening a service costs no extra request.
 *
 * The host renders nothing until the context resolves, and nothing at all for
 * a service with no id (the create flow has nothing to score yet).
 */
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-service-health-panel',
  templateUrl: './df-service-health-panel.component.html',
  styleUrls: ['./df-service-health-panel.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgIf,
    NgFor,
    RouterLink,
    TranslocoPipe,
    FontAwesomeModule,
    DfBadgeComponent,
  ],
})
export class DfServiceHealthPanelComponent implements OnInit, OnChanges {
  /** Service being edited. No id (create flow) renders nothing. */
  @Input() serviceId?: number | null;
  @Input() serviceName = '';
  /** Opt-in flag; only set when the service explicitly carries it. */
  @Input() deprecated?: boolean;

  health?: ServiceHealth;

  readonly faShieldHalved = faShieldHalved;
  readonly faCircleCheck = faCircleCheck;
  readonly faArrowRight = faArrowRight;

  constructor(
    private healthService: DfServiceHealthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.score();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // The details page fills serviceData in after its resolver settles, so the
    // id can arrive later than the first render.
    if (changes['serviceId'] || changes['deprecated']) {
      this.score();
    }
  }

  private score(): void {
    if (!this.serviceId) {
      this.health = undefined;
      return;
    }
    const id = this.serviceId;
    this.healthService
      .getContext()
      .pipe(untilDestroyed(this))
      .subscribe(context => {
        // Guard against a context that resolves after the input changed again.
        if (this.serviceId !== id) {
          return;
        }
        this.health = this.healthService.derive(
          { id, name: this.serviceName, deprecated: this.deprecated } as any,
          context
        );
        this.cdr.markForCheck();
      });
  }
}
