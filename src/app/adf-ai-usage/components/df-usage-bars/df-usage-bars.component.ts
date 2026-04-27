import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { GroupRow } from '../../types/usage';

@Component({
  selector: 'df-usage-bars',
  standalone: true,
  imports: [CommonModule],
  template: `
    <figure class="bars">
      <div class="bars__head">
        <h4 class="bars__title">{{ title }}</h4>
        <span class="bars__subtitle" *ngIf="rows.length > limit">
          top {{ limit }} of {{ rows.length }}
        </span>
      </div>

      <div *ngIf="visibleRows.length === 0" class="bars__empty">
        No data.
      </div>

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
    </figure>
  `,
  styles: [
    `
      .bars {
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 0.625rem;
        padding: 1rem 1.25rem;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 6px;

        &__head {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }
        &__title {
          margin: 0;
          font-size: 0.95rem;
          font-weight: 600;
        }
        &__subtitle {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
        }
        &__empty {
          padding: 0.5rem 0;
          color: rgba(255, 255, 255, 0.5);
          font-style: italic;
        }
        &__list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        &__row {
          display: grid;
          grid-template-columns: minmax(8rem, 25%) 1fr auto;
          align-items: center;
          gap: 0.75rem;

          &--clickable {
            cursor: pointer;
            border-radius: 4px;
            padding: 0.25rem 0.4rem;
            margin: 0 -0.4rem;

            &:hover {
              background: rgba(255, 255, 255, 0.04);
            }
          }
        }
        &__label {
          font-size: 0.875rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        &__track {
          display: flex;
          height: 10px;
          background: rgba(255, 255, 255, 0.04);
          border-radius: 999px;
          overflow: hidden;
          min-width: 80px;
        }
        &__fill {
          display: block;
          height: 100%;

          &--input {
            background: #3b82f6;
          }
          &--output {
            background: #a78bfa;
          }
        }
        &__totals {
          display: flex;
          align-items: baseline;
          gap: 0.625rem;
          justify-content: flex-end;
        }
        &__total {
          font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
          font-size: 0.85rem;
          font-weight: 600;
        }
        &__count {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
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
