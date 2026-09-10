import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnInit,
  inject,
} from '@angular/core';
import { NgIf } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { TranslocoPipe, TranslocoService } from '@ngneat/transloco';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Subscription } from 'rxjs';
import { AccessUsageRow } from '../../types/access-usage';
import {
  AccessUsageCellView,
  describeAccessUsage,
} from '../../utilities/access-usage';
import { DfBadgeComponent } from '../df-badge/df-badge.component';

/**
 * "Last used" / "Last active" cell: relative time or "Never", with the exact
 * timestamp, last service/status and last denial in a tooltip. Stale and
 * never-used subjects render muted; an inactive credential that clients still
 * send gets a warning icon; an unreferenced role gets a badge.
 */
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-access-usage-cell',
  templateUrl: './df-access-usage-cell.component.html',
  styleUrls: ['./df-access-usage-cell.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    MatTooltipModule,
    FontAwesomeModule,
    TranslocoPipe,
    DfBadgeComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DfAccessUsageCellComponent implements OnInit, OnChanges {
  @Input() usage: AccessUsageRow | null | undefined;
  @Input() staleDays: number | null = null;
  @Input() trackingStartedAt: string | null = null;

  faTriangleExclamation = faTriangleExclamation;
  view: AccessUsageCellView = describeAccessUsage(undefined, Date.now());
  tooltip = '';

  private transloco = inject(TranslocoService);
  private cdr = inject(ChangeDetectorRef);
  private translationSub?: Subscription;

  ngOnInit(): void {
    // Tooltip text is built in code; rebuild once translations land.
    this.translationSub = this.transloco.selectTranslation().subscribe(() => {
      this.render();
      this.cdr.markForCheck();
    });
  }

  ngOnChanges(): void {
    this.render();
  }

  private render(): void {
    const locale = this.transloco.getActiveLang() || 'en';
    this.view = describeAccessUsage(this.usage ?? undefined, Date.now(), {
      locale,
      staleDays: this.staleDays,
      trackingStartedAt: this.trackingStartedAt,
    });
    this.tooltip = this.view.tooltip
      .map(line => this.transloco.translate(line.key, line.params))
      .join('\n');
  }
}
