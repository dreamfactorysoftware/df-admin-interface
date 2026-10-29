import { Component, OnInit, inject } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoPipe } from '@ngneat/transloco';
import { DfEmptyStateComponent } from 'src/app/shared/components/df-empty-state/df-empty-state.component';
import { DfSkeletonComponent } from 'src/app/shared/components/df-skeleton/df-skeleton.component';
import { DataMaskingStore } from '../data-masking.store';
import { ActivityEvent, ActivityKind } from '../data-masking.types';
import { relTime } from '../dm-time';

export type ActivityFilter =
  | 'all'
  | 'changes'
  | 'access'
  | 'scans'
  | 'blocked'
  | 'preview';

const KINDS: Record<ActivityFilter, ActivityKind[] | null> = {
  all: null,
  changes: ['mode', 'decision', 'rule', 'baseline'],
  access: ['access'],
  scans: ['scan'],
  blocked: ['blocked'],
  preview: ['preview'],
};

const ICONS: Record<ActivityKind, string> = {
  mode: 'toggle_on',
  decision: 'how_to_reg',
  access: 'key',
  scan: 'radar',
  blocked: 'block',
  rule: 'rule',
  baseline: 'verified_user',
  preview: 'visibility',
};

interface DayGroup {
  day: string;
  events: ActivityEvent[];
}

/** Activity tab: what changed, who did it, when. Newest first, by day. */
@Component({
  selector: 'df-dm-activity',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    NgClass,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    TranslocoPipe,
    DfEmptyStateComponent,
    DfSkeletonComponent,
  ],
  templateUrl: './df-dm-activity.component.html',
  styleUrls: ['./df-dm-activity.component.scss'],
})
export class DfDmActivityComponent implements OnInit {
  readonly store = inject(DataMaskingStore);
  private readonly baseFilters: ActivityFilter[] = [
    'all',
    'changes',
    'access',
    'scans',
    'blocked',
  ];
  filter: ActivityFilter = 'all';
  private sawPreview = false;

  /**
   * Preview's "would mask" rows get their own chip while Preview is on, or
   * once any have been listed.
   */
  get filters(): ActivityFilter[] {
    if (!this.sawPreview) {
      this.sawPreview = (this.store.activity ?? []).some(
        e => e.kind === 'preview'
      );
    }
    return this.sawPreview ||
      this.store.mode === 'preview' ||
      this.filter === 'preview'
      ? [...this.baseFilters, 'preview']
      : this.baseFilters;
  }

  ngOnInit(): void {
    this.store.showActivity(KINDS[this.filter]);
  }

  /** Each chip asks the server for its kinds, so none hides behind another. */
  setFilter(f: ActivityFilter): void {
    if (f === this.filter) return;
    this.filter = f;
    this.store.showActivity(KINDS[f]);
  }

  get groups(): DayGroup[] {
    const kinds = KINDS[this.filter];
    // The server filters; this only guards a list that is still loading.
    const events = (this.store.activity ?? [])
      .filter(e => !kinds || kinds.includes(e.kind))
      .sort((a, b) => Date.parse(b.at) - Date.parse(a.at) || b.id - a.id);
    const out: DayGroup[] = [];
    for (const e of events) {
      const day = this.dayLabel(e.at);
      const last = out[out.length - 1];
      if (last && last.day === day) last.events.push(e);
      else out.push({ day, events: [e] });
    }
    return out;
  }

  icon(e: ActivityEvent): string {
    return ICONS[e.kind] ?? 'history';
  }

  ago(e: ActivityEvent): string {
    return relTime(e.at);
  }

  exact(e: ActivityEvent): string {
    return new Date(e.at).toLocaleString('en');
  }

  private dayLabel(iso: string): string {
    const d = new Date(iso);
    const today = new Date();
    const y = new Date();
    y.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) {
      return this.store.t('activity.today');
    }
    if (d.toDateString() === y.toDateString()) {
      return this.store.t('activity.yesterday');
    }
    return d.toLocaleDateString('en', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  }

  trackDay = (_: number, g: DayGroup) => g.day;
  trackEvent = (_: number, e: ActivityEvent) => e.id;
}
