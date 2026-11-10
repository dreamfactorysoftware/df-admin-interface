import { Component, OnInit, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoPipe } from '@ngneat/transloco';
import {
  BadgeVariant,
  DfBadgeComponent,
} from 'src/app/shared/components/df-badge/df-badge.component';
import { DfEmptyStateComponent } from 'src/app/shared/components/df-empty-state/df-empty-state.component';
import { DfSkeletonComponent } from 'src/app/shared/components/df-skeleton/df-skeleton.component';
import { relTime } from 'src/app/adf-data-masking/dm-time';
import { AauthStore } from '../aauth.store';
import { injectOpenTab } from '../open-tab';
import {
  ACTIVITY_FILTERS,
  ActivityFilter,
  ActivityOutcome,
  ActivityRow,
} from '../aauth.types';
import { DfAaAgentMarkComponent } from '../df-aa-agent-mark/df-aa-agent-mark.component';
import { ActivityReason, activityReason } from './activity-reason';

const OUTCOME_VARIANT: Record<ActivityOutcome, BadgeVariant> = {
  allowed: 'success',
  person_required: 'accent',
  auth_required: 'accent',
  denied: 'danger',
  blocked: 'danger',
  error: 'warning',
};

/**
 * Every AAuth request the resource saw, newest first, narrowed by one
 * result filter. Why a request was not allowed reads on its own line.
 */
@Component({
  selector: 'df-aa-activity',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatTooltipModule,
    TranslocoPipe,
    DfBadgeComponent,
    DfEmptyStateComponent,
    DfSkeletonComponent,
    DfAaAgentMarkComponent,
  ],
  templateUrl: './df-aa-activity.component.html',
  styleUrls: ['./df-aa-activity.component.scss'],
})
export class DfAaActivityComponent implements OnInit {
  readonly store = inject(AauthStore);
  readonly openTab = injectOpenTab();
  readonly relTime = relTime;
  readonly filters = ACTIVITY_FILTERS;

  /** Reasons by row id: the detail column is parsed once per row. */
  private reasons = new Map<number, ActivityReason | null>();

  ngOnInit(): void {
    this.store.loadActivity();
  }

  get issuer(): string | null {
    return this.store.overview?.issuer ?? null;
  }

  /** Placeholder rows only while the first answer for this filter is out. */
  get loadingRows(): boolean {
    const rows = this.store.activity;
    return !rows || (!rows.length && this.store.activityRefreshing);
  }

  setFilter(f: ActivityFilter): void {
    this.store.setActivityFilter(f);
  }

  variant(o: ActivityOutcome): BadgeVariant {
    return OUTCOME_VARIANT[o] ?? 'neutral';
  }

  reason(r: ActivityRow): ActivityReason | null {
    if (!this.reasons.has(r.id)) this.reasons.set(r.id, activityReason(r));
    return this.reasons.get(r.id) ?? null;
  }

  when(iso: string): string {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
  }

  trackRow = (_: number, r: ActivityRow) => r.id;
}
