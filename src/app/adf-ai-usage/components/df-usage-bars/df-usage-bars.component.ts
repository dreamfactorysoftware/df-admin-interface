import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { GroupRow } from '../../types/usage';

@Component({
  selector: 'df-usage-bars',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <mat-card class="bars">
      <mat-card-content>
        <div class="bars__head">
          <h4 class="bars__title">{{ title }}</h4>
          <span class="bars__subtitle" *ngIf="rows.length > limit">
            top {{ limit }} of {{ rows.length }}
          </span>
        </div>

        <div *ngIf="visibleRows.length === 0" class="bars__empty">No data.</div>

        <ul class="bars__list">
          <li
            *ngFor="let row of visibleRows"
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
          color: #333;
        }
        &__subtitle {
          font-size: 12px;
          color: #999;
        }
        &__empty {
          padding: 8px 0;
          color: #999;
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
          color: #333;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        &__track {
          display: flex;
          height: 12px;
          background: rgba(0, 0, 0, 0.06);
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
          color: #333;
        }
        &__count {
          font-size: 12px;
          color: #999;
        }
      }

      :host-context(.dark-theme) {
        .bars {
          &__title,
          &__label,
          &__total {
            color: #fff;
          }
          &__subtitle,
          &__count,
          &__empty {
            color: #bbb;
          }
          &__track {
            background: rgba(255, 255, 255, 0.08);
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
export class DfUsageBarsComponent {
  @Input({ required: true }) title!: string;
  @Input() rows: GroupRow[] = [];
  @Input() limit = 8;
  @Input() clickable = false;
  @Output() rowClick = new EventEmitter<GroupRow>();

  get visibleRows(): GroupRow[] {
    return (this.rows ?? []).slice(0, this.limit);
  }

  get max(): number {
    return Math.max(1, ...this.visibleRows.map(r => r.totalTokens));
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
}
