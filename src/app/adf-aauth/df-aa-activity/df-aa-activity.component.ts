import { Component, OnInit, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
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
import { ActivityOutcome, ActivityRow } from '../aauth.types';

const OUTCOME_VARIANT: Record<ActivityOutcome, BadgeVariant> = {
  allowed: 'success',
  person_required: 'accent',
  auth_required: 'accent',
  denied: 'danger',
  blocked: 'danger',
  error: 'warning',
};

/** Every AAuth request the resource saw, newest first. */
@Component({
  selector: 'df-aa-activity',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    TranslocoPipe,
    DfBadgeComponent,
    DfEmptyStateComponent,
    DfSkeletonComponent,
  ],
  templateUrl: './df-aa-activity.component.html',
  styleUrls: ['./df-aa-activity.component.scss'],
})
export class DfAaActivityComponent implements OnInit {
  readonly store = inject(AauthStore);
  readonly relTime = relTime;

  ngOnInit(): void {
    this.store.loadActivity();
  }

  variant(o: ActivityOutcome): BadgeVariant {
    return OUTCOME_VARIANT[o] ?? 'neutral';
  }

  when(iso: string): string {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
  }

  trackRow = (_: number, r: ActivityRow) => r.id;
}
