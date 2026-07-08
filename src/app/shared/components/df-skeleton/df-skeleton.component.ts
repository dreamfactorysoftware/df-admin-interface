import { Component, Input } from '@angular/core';
import {
  NgFor,
  NgSwitch,
  NgSwitchCase,
  NgSwitchDefault,
} from '@angular/common';
import { TranslocoPipe } from '@ngneat/transloco';

export type SkeletonVariant = 'line' | 'block' | 'table-row' | 'card';

/**
 * Layout-matched loading placeholder. Replaces mat-spinner for list / table /
 * card loads so the skeleton echoes the final layout instead of a centered
 * spinner. A subtle shimmer sweeps each bar (motion tokens, honors
 * prefers-reduced-motion). Pairs with Angular @defer @loading / @placeholder.
 *
 * Tokens only: base + shine come from --df-skeleton-bg / --df-skeleton-shine,
 * timing from --df-duration-* / --df-ease-standard. No color or size literals.
 */
@Component({
  selector: 'df-skeleton',
  templateUrl: './df-skeleton.component.html',
  styleUrls: ['./df-skeleton.component.scss'],
  standalone: true,
  imports: [
    NgFor,
    NgSwitch,
    NgSwitchCase,
    NgSwitchDefault,
    TranslocoPipe,
  ],
})
export class DfSkeletonComponent {
  /** Which layout the placeholder echoes. */
  @Input() variant: SkeletonVariant = 'line';
  /** How many placeholder units to render. */
  @Input() count = 1;

  get items(): number[] {
    const n = this.count > 0 ? Math.floor(this.count) : 1;
    return Array.from({ length: n }, (_, i) => i);
  }

  trackByIndex(index: number): number {
    return index;
  }
}
