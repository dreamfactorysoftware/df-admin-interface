import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { GroupRow } from '../../types/usage';

@Component({
  selector: 'df-usage-bars',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTooltipModule, FontAwesomeModule],
  template: `
    <mat-card class="bars">
      <mat-card-content>
        <div class="bars__head">
          <h4 class="bars__title">
            {{ title }}
            <fa-icon
              *ngIf="hint"
              class="bars__hint"
              [icon]="faCircleInfo"
              [matTooltip]="hint"
              matTooltipPosition="above"></fa-icon>
          </h4>
          <span class="bars__subtitle" *ngIf="rows.length > limit">
            top {{ limit }} of {{ rows.length }}
          </span>
        </div>

        <div *ngIf="visibleRows.length === 0" class="bars__empty">No data.</div>

        <ul class="bars__list">
          <li
            *ngFor="let row of visibleRows; trackBy: trackRow"
            class="bars__row"
            [class.bars__row--clickable]="clickable"
            (click)="onClick(row)">
            <div class="bars__label">{{ row.label }}</div>
            <div class="bars__track">
              <span
                class="bars__fill bars__fill--input"
                [style.width.%]="(row.inputTokens / max) * 100"
                [title]="row.inputTokens + ' input'"></span>
              <span
                class="bars__fill bars__fill--output"
                [style.width.%]="(row.outputTokens / max) * 100"
                [title]="row.outputTokens + ' output'"></span>
            </div>
            <div class="bars__totals">
              <span class="bars__total">{{ formatK(row.totalTokens) }}</span>
              <span
                *ngIf="row.costPer1kTokens && row.costPer1kTokens > 0"
                class="bars__rate"
                matTooltip="Effective rate paid per 1k tokens in this window">
                {{ formatRate(row.costPer1kTokens) }}/1k
              </span>
              <span class="bars__count">{{ row.sessions }} sess</span>
            </div>
          </li>
        </ul>
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `
      .bars {
        mat-card-content {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        &__head {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 12px;
        }
        &__title {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: var(--df-text);
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        &__hint {
          font-size: 13px;
          color: var(--df-text-muted);
          cursor: help;

          &:hover {
            color: #7f11e0;
          }
        }
        &__subtitle {
          font-size: 12px;
          color: var(--df-text-2);
        }
        &__empty {
          padding: 8px 0;
          color: var(--df-text-2);
          font-style: italic;
          font-size: 14px;
        }
        &__list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        &__row {
          display: grid;
          grid-template-columns: minmax(120px, 28%) 1fr auto;
          align-items: center;
          gap: 12px;

          &--clickable {
            cursor: pointer;
            border-radius: 4px;
            padding: 4px 6px;
            margin: 0 -6px;

            &:hover {
              background: rgba(127, 17, 224, 0.06);
            }
          }
        }
        &__label {
          font-size: 14px;
          font-weight: 500;
          color: var(--df-text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        &__track {
          display: flex;
          height: 12px;
          background: var(--df-surface-2);
          border-radius: 999px;
          overflow: hidden;
          min-width: 80px;
        }
        &__fill {
          display: block;
          height: 100%;

          &--input {
            background: #2196f3;
          }
          &--output {
            background: #7f11e0;
          }
        }
        &__totals {
          display: flex;
          align-items: baseline;
          gap: 8px;
          justify-content: flex-end;
        }
        &__total {
          font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
          font-size: 14px;
          font-weight: 600;
          color: var(--df-text);
        }
        &__count {
          font-size: 12px;
          color: var(--df-text-2);
        }
        &__rate {
          font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
          font-size: 11px;
          color: #7f11e0;
          background: rgba(127, 17, 224, 0.08);
          padding: 1px 6px;
          border-radius: 3px;
        }
      }

      :host-context(.dark-theme) {
        .bars {
          &__rate {
            color: #b388ff;
            background: rgba(127, 17, 224, 0.18);
          }
          &__hint {
            &:hover {
              color: #bb86fc;
            }
          }
          &__row--clickable:hover {
            background: rgba(187, 134, 252, 0.1);
          }
          &__fill--output {
            background: #bb86fc;
          }
        }
      }
    `,
  ],
})
export class DfUsageBarsComponent implements OnChanges {
  @Input({ required: true }) title!: string;
  /** Optional one-line description rendered as a tooltip on an info icon
   *  next to the title — for explaining what this panel actually shows. */
  @Input() hint = '';
  @Input() rows: GroupRow[] = [];
  @Input() limit = 8;
  @Input() clickable = false;
  @Output() rowClick = new EventEmitter<GroupRow>();
  faCircleInfo = faCircleInfo;

  // Computed once per input change, NOT per change-detection cycle. As
  // getters these allocated a fresh slice (and, for max, a mapped array)
  // on every CD evaluation — and max was evaluated twice per row.
  visibleRows: GroupRow[] = [];
  max = 1;

  ngOnChanges(): void {
    this.visibleRows = (this.rows ?? []).slice(0, this.limit);
    this.max = Math.max(1, ...this.visibleRows.map(r => r.totalTokens));
  }

  trackRow(_: number, row: GroupRow): string {
    return row.key;
  }

  onClick(row: GroupRow): void {
    if (this.clickable) {
      this.rowClick.emit(row);
    }
  }

  formatK(n: number): string {
    if (n < 1000) {
      return String(n);
    }
    if (n < 1_000_000) {
      return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}k`;
    }
    return `${(n / 1_000_000).toFixed(1)}M`;
  }

  /** Render an effective per-1k-token rate compactly. Sub-cent rates need
   *  more precision than $0.00 — show $0.0008 not $0.00 because the whole
   *  point of this column is "is this model expensive?" */
  formatRate(rate: number): string {
    if (!Number.isFinite(rate) || rate <= 0) return '$0';
    if (rate < 0.001) return '<$0.001';
    if (rate < 0.01) return `$${rate.toFixed(4)}`;
    if (rate < 1) return `$${rate.toFixed(3)}`;
    return `$${rate.toFixed(2)}`;
  }
}
