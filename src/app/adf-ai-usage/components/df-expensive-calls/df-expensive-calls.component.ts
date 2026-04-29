import { CommonModule, DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';

/**
 * Top-N most expensive single AI calls in the window. The drill-down hook
 * for the dashboard's "where is my money going" story — averages hide
 * outliers (a single 200k-token monster call), this surfaces them with
 * full attribution so admins can decide if the spend is intentional.
 *
 * Display shape is the row the resource layer sees: provider/model is
 * primary, attribution columns (user, app) secondary, latency tertiary.
 * Cost gets a deliberately bold render — that's the column users came for.
 */
export interface ExpensiveCallRow {
  id: number;
  provider: string;
  model: string;
  resource: string;
  userLabel: string;
  appLabel: string;
  serviceLabel: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  latencyMs: number;
  status: string;
  createdAt: string;
}

@Component({
  selector: 'df-expensive-calls',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTooltipModule, DatePipe],
  template: `
    <mat-card class="exp">
      <mat-card-content>
        <div class="exp__header">
          <span class="exp__title">{{ title }}</span>
          <span class="exp__subtitle">
            Single calls ranked by cost. Hover a row for full timestamp.
          </span>
        </div>

        <div class="exp__empty" *ngIf="data.length === 0">
          No data in this range yet.
        </div>

        <div *ngIf="data.length > 0" class="exp__table-wrap">
          <table class="exp__table">
            <thead>
              <tr>
                <th class="exp__th exp__th--cost">Cost</th>
                <th class="exp__th">Model</th>
                <th class="exp__th">User</th>
                <th class="exp__th">App</th>
                <th class="exp__th">Connection</th>
                <th class="exp__th exp__th--num">In</th>
                <th class="exp__th exp__th--num">Out</th>
                <th class="exp__th exp__th--num">Latency</th>
                <th class="exp__th">Status</th>
                <th class="exp__th">When</th>
              </tr>
            </thead>
            <tbody>
              <tr
                *ngFor="let r of data"
                class="exp__row"
                [class.exp__row--error]="r.status === 'error'"
                [class.exp__row--partial]="r.status === 'partial'">
                <td class="exp__td exp__td--cost">
                  <span class="exp__cost">{{ formatUsd(r.costUsd) }}</span>
                </td>
                <td class="exp__td exp__td--model">
                  <div class="exp__model">{{ r.model }}</div>
                  <div class="exp__provider">{{ r.provider }}</div>
                </td>
                <td class="exp__td">{{ r.userLabel }}</td>
                <td class="exp__td">{{ r.appLabel }}</td>
                <td class="exp__td">{{ r.serviceLabel }}</td>
                <td class="exp__td exp__td--num">{{ formatTokens(r.inputTokens) }}</td>
                <td class="exp__td exp__td--num">{{ formatTokens(r.outputTokens) }}</td>
                <td class="exp__td exp__td--num">{{ formatLatency(r.latencyMs) }}</td>
                <td class="exp__td">
                  <span
                    class="exp__pill"
                    [class.exp__pill--success]="r.status === 'success'"
                    [class.exp__pill--error]="r.status === 'error'"
                    [class.exp__pill--partial]="r.status === 'partial'">
                    {{ r.status }}
                  </span>
                </td>
                <td
                  class="exp__td exp__td--when"
                  [matTooltip]="r.createdAt">
                  {{ r.createdAt | date: 'MMM d, HH:mm' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `
      .exp {
        mat-card-content {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        &__header {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        &__title {
          font-weight: 600;
          color: #333;
          font-size: 16px;
        }
        &__subtitle {
          font-size: 12px;
          color: #999;
        }

        &__empty {
          font-style: italic;
          color: #999;
          font-size: 13px;
          padding: 12px 0;
        }

        &__table-wrap {
          overflow-x: auto;
          margin: 0 -4px;
        }
        &__table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        &__th {
          text-align: left;
          font-weight: 600;
          color: #777;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          padding: 8px 10px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
          white-space: nowrap;

          &--num,
          &--cost {
            text-align: right;
          }
        }

        &__row {
          transition: background 0.1s ease-out;

          &:hover {
            background: rgba(127, 17, 224, 0.04);
          }

          &--error {
            background: rgba(244, 67, 54, 0.04);

            &:hover {
              background: rgba(244, 67, 54, 0.08);
            }
          }

          &--partial {
            background: rgba(255, 152, 0, 0.04);
          }
        }

        &__td {
          padding: 10px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.04);
          color: #333;
          vertical-align: top;

          &--cost {
            text-align: right;
            font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
            font-weight: 600;
          }

          &--num {
            text-align: right;
            font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
            color: #666;
          }

          &--model {
            min-width: 160px;
          }

          &--when {
            color: #666;
            white-space: nowrap;
          }
        }

        &__cost {
          color: #7f11e0;
        }

        &__model {
          font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
          font-size: 12px;
        }
        &__provider {
          font-size: 11px;
          color: #999;
          margin-top: 2px;
          text-transform: capitalize;
        }

        &__pill {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 500;
          text-transform: capitalize;
          background: rgba(0, 0, 0, 0.06);
          color: #555;

          &--success {
            background: rgba(38, 166, 154, 0.15);
            color: #00796b;
          }
          &--error {
            background: rgba(244, 67, 54, 0.12);
            color: #c62828;
          }
          &--partial {
            background: rgba(255, 152, 0, 0.15);
            color: #e65100;
          }
        }
      }

      :host-context(.dark-theme) {
        .exp {
          &__title {
            color: #fff;
          }
          &__subtitle,
          &__td--num,
          &__td--when {
            color: #aaa;
          }
          &__th {
            color: #999;
            border-bottom-color: rgba(255, 255, 255, 0.1);
          }
          &__td {
            color: #ddd;
            border-bottom-color: rgba(255, 255, 255, 0.04);
          }
          &__row:hover {
            background: rgba(127, 17, 224, 0.12);
          }
          &__row--error {
            background: rgba(244, 67, 54, 0.08);
          }
          &__row--partial {
            background: rgba(255, 152, 0, 0.08);
          }
          &__cost {
            color: #b388ff;
          }
          &__provider {
            color: #888;
          }
          &__pill {
            background: rgba(255, 255, 255, 0.08);
            color: #ccc;

            &--success {
              background: rgba(38, 166, 154, 0.2);
              color: #4db6ac;
            }
            &--error {
              background: rgba(244, 67, 54, 0.2);
              color: #ef9a9a;
            }
            &--partial {
              background: rgba(255, 152, 0, 0.2);
              color: #ffb74d;
            }
          }
        }
      }
    `,
  ],
})
export class DfExpensiveCallsComponent {
  @Input() data: ExpensiveCallRow[] = [];
  @Input() title = 'Most expensive calls';

  formatUsd(v: number): string {
    if (!Number.isFinite(v) || v === 0) return '$0';
    if (v < 0.01) return '<$0.01';
    if (v < 1) return `$${v.toFixed(4)}`;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 4,
    }).format(v);
  }

  formatTokens(v: number): string {
    if (v < 1000) return String(v);
    if (v < 1_000_000) return `${(v / 1000).toFixed(v < 10000 ? 1 : 0)}k`;
    return `${(v / 1_000_000).toFixed(1)}M`;
  }

  formatLatency(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  }
}
