import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { UsageSummary } from '../../types/usage';

@Component({
  selector: 'df-usage-summary',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <div class="summary">
      <mat-card class="summary__card">
        <mat-card-content>
          <span class="summary__label">Requests</span>
          <span class="summary__value">{{
            summary.sessionCount | number
          }}</span>
        </mat-card-content>
      </mat-card>
      <mat-card class="summary__card">
        <mat-card-content>
          <span class="summary__label">Input tokens</span>
          <span class="summary__value">{{ summary.inputTokens | number }}</span>
        </mat-card-content>
      </mat-card>
      <mat-card class="summary__card">
        <mat-card-content>
          <span class="summary__label">Output tokens</span>
          <span class="summary__value">{{
            summary.outputTokens | number
          }}</span>
        </mat-card-content>
      </mat-card>
      <mat-card class="summary__card">
        <mat-card-content>
          <span class="summary__label">Total tokens</span>
          <span class="summary__value">{{ summary.totalTokens | number }}</span>
        </mat-card-content>
      </mat-card>
      <mat-card
        class="summary__card"
        [class.summary__card--error]="(summary.errors ?? 0) > 0">
        <mat-card-content>
          <span class="summary__label">Errors</span>
          <span class="summary__value">{{ summary.errors ?? 0 | number }}</span>
        </mat-card-content>
      </mat-card>
      <mat-card class="summary__card">
        <mat-card-content>
          <span class="summary__label">Avg latency</span>
          <span class="summary__value">
            {{ summary.avgLatencyMs ?? 0 | number }}
            <small>ms</small>
          </span>
        </mat-card-content>
      </mat-card>
      <mat-card class="summary__card summary__card--cost">
        <mat-card-content>
          <span class="summary__label">Estimated cost</span>
          <span class="summary__value">
            {{ formatUsd(summary.totalCostUsd ?? 0) }}
          </span>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
        gap: 16px;

        &__card {
          mat-card-content {
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding: 20px;
          }

          &--error {
            mat-card-content {
              background: rgba(244, 67, 54, 0.06);
            }
            .summary__value {
              color: #d32f2f;
            }
          }
          &--cost .summary__value {
            color: #2e7d32;
          }
        }
        &__label {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #666;
          font-weight: 600;
        }
        &__value {
          font-size: 28px;
          font-weight: 600;
          color: #333;
          line-height: 1.2;

          small {
            font-size: 12px;
            font-weight: 500;
            color: #999;
            margin-left: 4px;
          }
        }
      }

      :host-context(.dark-theme) {
        .summary {
          &__label {
            color: #bbb;
          }
          &__value {
            color: #fff;
            small {
              color: #999;
            }
          }
          &__card--error .summary__value {
            color: #ff8585;
          }
        }
      }
    `,
  ],
})
export class DfUsageSummaryComponent {
  @Input({ required: true }) summary!: UsageSummary;

  formatUsd(v: number): string {
    if (!Number.isFinite(v)) return '$0.00';
    if (v > 0 && v < 0.01) return '<$0.01';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: v < 1 ? 4 : 2,
    }).format(v);
  }
}
