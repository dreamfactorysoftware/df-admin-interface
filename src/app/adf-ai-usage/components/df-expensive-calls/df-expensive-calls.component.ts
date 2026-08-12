import { CommonModule, DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { USD_4DP } from '../../utils/cost';

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
                *ngFor="let r of data; trackBy: trackRow"
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
                <td class="exp__td exp__td--num">
                  {{ formatTokens(r.inputTokens) }}
                </td>
                <td class="exp__td exp__td--num">
                  {{ formatTokens(r.outputTokens) }}
                </td>
                <td class="exp__td exp__td--num">
                  {{ formatLatency(r.latencyMs) }}
                </td>
                <td class="exp__td">
                  <span
                    class="exp__pill"
                    [class.exp__pill--success]="r.status === 'success'"
                    [class.exp__pill--error]="r.status === 'error'"
                    [class.exp__pill--partial]="r.status === 'partial'">
                    {{ r.status }}
                  </span>
                </td>
                <td class="exp__td exp__td--when" [matTooltip]="r.createdAt">
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
      /* Departure: token-only chrome; 44px rows, hairline separators, 11px
         uppercase micro-headers. Warning amber is aliased locally per theme
         (no global --df-warning in light/dark); phosphor's token wins. */
      .exp {
        --exp-warning: #9a5b00;

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
          color: var(--df-text);
          font-size: 1.5rem;
          letter-spacing: -0.01em;
        }
        &__subtitle {
          font-size: 1.2rem;
          color: var(--df-text-muted);
        }

        &__empty {
          font-style: italic;
          color: var(--df-text-muted);
          font-size: 1.3rem;
          padding: 12px 0;
        }

        &__table-wrap {
          overflow-x: auto;
          margin: 0 -4px;
        }
        &__table {
          width: 100%;
          border-collapse: collapse;
          font-size: 1.3rem;
        }

        &__th {
          text-align: left;
          font-weight: 600;
          color: var(--df-text-muted);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          padding: 8px 10px;
          border-bottom: 1px solid var(--df-border);
          white-space: nowrap;

          &--num,
          &--cost {
            text-align: right;
          }
        }

        &__row {
          transition: background 0.1s ease-out;

          &:hover {
            background: var(--df-hover);
          }

          &--error {
            background: var(--df-danger-soft);
          }

          &--partial {
            background: color-mix(
              in srgb,
              var(--df-warning, var(--exp-warning)) 5%,
              transparent
            );
          }
        }

        &__td {
          padding: 10px;
          border-bottom: 1px solid var(--df-border-2);
          color: var(--df-text);
          vertical-align: top;

          &--cost {
            text-align: right;
            font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
            font-weight: 600;
          }

          &--num {
            text-align: right;
            font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
            color: var(--df-text-2);
          }

          &--model {
            min-width: 160px;
          }

          &--when {
            color: var(--df-text-2);
            white-space: nowrap;
          }
        }

        &__cost {
          color: var(--df-accent-strong);
        }

        &__model {
          font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
          font-size: 1.2rem;
        }
        &__provider {
          font-size: 11px;
          color: var(--df-text-muted);
          margin-top: 2px;
          text-transform: capitalize;
        }

        &__pill {
          display: inline-block;
          padding: 2px 8px;
          border-radius: var(--df-radius-sm);
          font-size: 11px;
          font-weight: 500;
          text-transform: capitalize;
          background: var(--df-surface-2);
          border: 1px solid var(--df-border-2);
          color: var(--df-text-2);

          &--success {
            background: var(--df-success-soft);
            border-color: var(--df-success-border);
            color: var(--df-success);
          }
          &--error {
            background: var(--df-danger-soft);
            border-color: var(--df-danger-border);
            color: var(--df-danger);
          }
          &--partial {
            background: color-mix(
              in srgb,
              var(--df-warning, var(--exp-warning)) 12%,
              transparent
            );
            border-color: color-mix(
              in srgb,
              var(--df-warning, var(--exp-warning)) 35%,
              transparent
            );
            color: var(--df-warning, var(--exp-warning));
          }
        }
      }

      :host-context(.dark-theme) .exp {
        --exp-warning: #ffb74d;
      }
    `,
  ],
})
export class DfExpensiveCallsComponent {
  @Input() data: ExpensiveCallRow[] = [];
  @Input() title = 'Most expensive calls';

  trackRow(_: number, r: ExpensiveCallRow): number {
    return r.id;
  }

  formatUsd(v: number): string {
    if (!Number.isFinite(v) || v === 0) return '$0';
    if (v < 0.01) return '<$0.01';
    if (v < 1) return `$${v.toFixed(4)}`;
    // Shared, hoisted formatter — this runs per row per CD cycle; building
    // an Intl.NumberFormat per call is one of the priciest ctors in JS.
    return USD_4DP.format(v);
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
