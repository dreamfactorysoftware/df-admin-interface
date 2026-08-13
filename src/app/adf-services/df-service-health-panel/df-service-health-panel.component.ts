import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import {
  NgFor,
  NgIf,
  NgSwitch,
  NgSwitchCase,
  NgSwitchDefault,
} from '@angular/common';
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
import { DfErrorDetailComponent } from 'src/app/shared/components/df-error-detail/df-error-detail.component';
import {
  ServiceHealth,
  ServiceHealthLevel,
} from 'src/app/shared/types/service';
import { AppError } from 'src/app/shared/utilities/app-error';
import {
  DfServiceProbeService,
  ProbeState,
} from '../df-manage-services/df-service-probe.service';
import { DfServiceHealthService } from '../df-manage-services/df-service-health.service';

/**
 * df-service-health-panel — what is actually wrong with this service, on the
 * page where you would fix it.
 *
 * Two independent signals, deliberately kept apart:
 *
 *  - Governance, from DfServiceHealthService.derive(): does any role grant a
 *    key access, is it deprecated. Read from the role graph, cached app-wide,
 *    identical to the Services table's Access chip.
 *  - Connection, probed live here: the same request the API Docs page makes
 *    (/_schema for a database, / for file storage, per
 *    healthCheckEndpointsInfo). Nothing else in DF re-checks a connection
 *    after creation - df-core's ServiceHealthChecker only fires on
 *    static::created and persists nothing - so a password that rotted after
 *    setup is invisible until something asks the service. This asks.
 *
 * A type with no mapped probe endpoint (scripting, remote, auth) reports that
 * it was not checked rather than claiming health it cannot prove.
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
    NgSwitch,
    NgSwitchCase,
    NgSwitchDefault,
    RouterLink,
    TranslocoPipe,
    FontAwesomeModule,
    DfBadgeComponent,
    DfErrorDetailComponent,
  ],
})
export class DfServiceHealthPanelComponent implements OnInit, OnChanges {
  /** Service being edited. No id (create flow) renders nothing. */
  @Input() serviceId?: number | null;
  @Input() serviceName = '';
  /** Route group ('Database', 'File', ...); selects the probe endpoint. */
  @Input() serviceGroup?: string | null;
  /** Opt-in flag; only set when the service explicitly carries it. */
  @Input() deprecated?: boolean;

  health?: ServiceHealth;
  /** 'idle' only until an id arrives; every other state comes from the shared
   * probe service, which the Services list uses too. */
  probe: ProbeState | 'idle' = 'idle';
  /** Kept as the normalized AppError, not a string, so df-error-detail can
   * offer the status, the request and the (DSN-scrubbed) raw body. */
  probeError: AppError | null = null;

  readonly faShieldHalved = faShieldHalved;
  readonly faCircleCheck = faCircleCheck;
  readonly faArrowRight = faArrowRight;

  constructor(
    private healthService: DfServiceHealthService,
    private probeService: DfServiceProbeService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.score();
    this.runProbe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // The details page fills serviceData in after its resolver settles, so the
    // inputs can arrive later than the first render.
    if (changes['serviceId'] || changes['deprecated']) {
      this.score();
    }
    if (
      changes['serviceId'] ||
      changes['serviceName'] ||
      changes['serviceGroup']
    ) {
      this.runProbe();
    }
  }

  /** Worst of the two signals. A failed connection outranks anything derived. */
  get level(): ServiceHealthLevel {
    if (this.probe === 'failed') {
      return 'danger';
    }
    return this.health?.level ?? 'success';
  }

  /** True while there is something to show in the box rather than one line. */
  get hasFindings(): boolean {
    return this.probe === 'failed' || !!this.health?.rules.length;
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

  private runProbe(): void {
    if (!this.serviceId || !this.serviceName) {
      this.probe = 'idle';
      return;
    }
    const name = this.serviceName;
    this.probeError = null;
    this.probeService
      .probe(name, this.serviceGroup)
      .pipe(untilDestroyed(this))
      .subscribe(result => {
        // Guard against a verdict that lands after the inputs moved on.
        if (this.serviceName !== name) {
          return;
        }
        this.probe = result.state;
        this.probeError = result.error ?? null;
        this.cdr.markForCheck();
      });
  }
}
