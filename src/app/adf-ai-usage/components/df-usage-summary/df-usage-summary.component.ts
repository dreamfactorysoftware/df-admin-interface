import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { faArrowDown, faArrowUp } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { UsageSummary } from '../../types/usage';
import { formatUSD } from '../../utils/cost';
import { DfSparklineComponent } from '../df-sparkline/df-sparkline.component';

@Component({
  selector: 'df-usage-summary',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTooltipModule,
    FontAwesomeModule,
    DfSparklineComponent,
  ],
  template: `
    <div class="summary">
      <mat-card
        class="summary__card"
        matTooltip="Successful + errored AI provider calls in the selected period. Each call from any client app or chat session counts once."
        matTooltipPosition="above">
        <mat-card-content>
          <span class="summary__label">Requests</span>
          <span class="summary__value">{{
            summary.sessionCount | number
          }}</span>
          <ng-container
            *ngTemplateOutlet="
              footer;
              context: {
                delta: summary.deltas?.requests,
                spark: summary.sparklines?.requests,
                polarity: 'neutral',
                color: '#2196f3',
              }
            "></ng-container>
        </mat-card-content>
      </mat-card>

      <mat-card
        class="summary__card"
        matTooltip="Total tokens DF sent to providers (your prompts + system prompts + conversation history). Anthropic and OpenAI typically charge less for input than output."
        matTooltipPosition="above">
        <mat-card-content>
          <span class="summary__label">Input tokens</span>
          <span class="summary__value">{{ summary.inputTokens | number }}</span>
          <ng-container
            *ngTemplateOutlet="
              footer;
              context: {
                delta: summary.deltas?.inputTokens,
                spark: summary.sparklines?.inputTokens,
                polarity: 'neutral',
                color: '#2196f3',
              }
            "></ng-container>
        </mat-card-content>
      </mat-card>

      <mat-card
        class="summary__card"
        matTooltip="Total tokens providers generated in responses. Output tokens are typically 4-5× more expensive than input."
        matTooltipPosition="above">
        <mat-card-content>
          <span class="summary__label">Output tokens</span>
          <span class="summary__value">{{
            summary.outputTokens | number
          }}</span>
          <ng-container
            *ngTemplateOutlet="
              footer;
              context: {
                delta: summary.deltas?.outputTokens,
                spark: summary.sparklines?.outputTokens,
                polarity: 'neutral',
                color: '#7f11e0',
              }
            "></ng-container>
        </mat-card-content>
      </mat-card>

      <mat-card
        class="summary__card"
        matTooltip="Input + output combined. The figure provider invoices usually quote for your usage."
        matTooltipPosition="above">
        <mat-card-content>
          <span class="summary__label">Total tokens</span>
          <span class="summary__value">{{ summary.totalTokens | number }}</span>
          <ng-container
            *ngTemplateOutlet="
              footer;
              context: {
                delta: summary.deltas?.totalTokens,
                spark: summary.sparklines?.totalTokens,
                polarity: 'neutral',
                color: '#7f11e0',
              }
            "></ng-container>
        </mat-card-content>
      </mat-card>

      <mat-card
        class="summary__card"
        [class.summary__card--error]="(summary.errors ?? 0) > 0"
        matTooltip="Failed provider calls (timeouts, auth errors, rate-limit hits, model errors). High counts here usually mean a stale API key or a provider outage."
        matTooltipPosition="above">
        <mat-card-content>
          <span class="summary__label">Errors</span>
          <span class="summary__value">{{ summary.errors ?? 0 | number }}</span>
          <ng-container
            *ngTemplateOutlet="
              footer;
              context: {
                delta: summary.deltas?.errors,
                spark: summary.sparklines?.errors,
                polarity: 'bad-up',
                color: '#d32f2f',
              }
            "></ng-container>
        </mat-card-content>
      </mat-card>

      <mat-card
        *ngIf="(summary.partials ?? 0) > 0"
        class="summary__card summary__card--partial"
        matTooltip="Streaming requests where the client disconnected before the model finished. Tokens delivered are still billed; an uptick here usually points at a network or load-balancer timeout, not a model issue."
        matTooltipPosition="above">
        <mat-card-content>
          <span class="summary__label">Partials</span>
          <span class="summary__value">{{
            summary.partials ?? 0 | number
          }}</span>
          <span class="summary__hint">streaming, client disconnected</span>
        </mat-card-content>
      </mat-card>

      <mat-card
        class="summary__card summary__card--latency"
        matTooltip="p50 = median (typical user). p95 = the slowest 5% of calls — what unhappy users feel. p99 = the worst tail. Avg gets pulled around by outliers; trust p50 for the typical case and p95 to answer is-this-fast-enough."
        matTooltipPosition="above">
        <mat-card-content>
          <span class="summary__label">Latency</span>
          <span class="summary__value summary__value--latency">
            {{ summary.latencyP50Ms ?? 0 | number }}<small>ms</small>
          </span>
          <div class="summary__latency-tail">
            <span>
              p95
              <strong>{{ summary.latencyP95Ms ?? 0 | number }}ms</strong>
            </span>
            <span>
              p99
              <strong>{{ summary.latencyP99Ms ?? 0 | number }}ms</strong>
            </span>
            <span
              class="summary__delta"
              *ngIf="summary.deltas?.latency != null">
              <fa-icon
                [icon]="
                  (summary.deltas?.latency ?? 0) >= 0 ? faArrowUp : faArrowDown
                "
                [class.summary__delta--bad]="
                  (summary.deltas?.latency ?? 0) > 0.05
                "
                [class.summary__delta--good]="
                  (summary.deltas?.latency ?? 0) < -0.05
                "></fa-icon>
              {{ formatDelta(summary.deltas?.latency) }}
            </span>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card
        class="summary__card summary__card--cost"
        matTooltip="USD cost computed at log-time using each AI Connection's per-model rate sheet (or per-service flat / DF defaults if no rates are configured). Stored on every row, so historical rate changes don't rewrite past spend."
        matTooltipPosition="above">
        <mat-card-content>
          <span class="summary__label">Estimated cost</span>
          <span class="summary__value">
            {{ formatUsd(summary.totalCostUsd ?? 0) }}
          </span>
          <ng-container
            *ngTemplateOutlet="
              footer;
              context: {
                delta: summary.deltas?.cost,
                spark: summary.sparklines?.cost,
                polarity: 'bad-up',
                color: '#2e7d32',
              }
            "></ng-container>
        </mat-card-content>
      </mat-card>
    </div>

    <ng-template
      #footer
      let-delta="delta"
      let-spark="spark"
      let-polarity="polarity"
      let-color="color">
      <div class="summary__footer" *ngIf="delta != null || spark?.length">
        <span class="summary__delta" *ngIf="delta != null">
          <fa-icon
            [icon]="delta >= 0 ? faArrowUp : faArrowDown"
            [class.summary__delta--bad]="
              (polarity === 'bad-up' && delta > 0.05) ||
              (polarity === 'good-up' && delta < -0.05)
            "
            [class.summary__delta--good]="
              (polarity === 'good-up' && delta > 0.05) ||
              (polarity === 'bad-up' && delta < -0.05)
            "></fa-icon>
          {{ formatDelta(delta) }}
        </span>
        <df-sparkline
          *ngIf="spark?.length"
          class="summary__spark"
          [data]="spark"
          [color]="color"></df-sparkline>
      </div>
    </ng-template>
  `,
  styles: [
    `
      .summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 16px;

        &__card {
          mat-card-content {
            display: flex;
            flex-direction: column;
            gap: 6px;
            padding: 18px 20px 14px;
          }

          &--error {
            mat-card-content {
              background: rgba(244, 67, 54, 0.06);
            }
            .summary__value {
              color: #d32f2f;
            }
          }
          &--partial {
            mat-card-content {
              background: rgba(255, 152, 0, 0.05);
            }
            .summary__value {
              color: #e65100;
            }
          }
          &--cost .summary__value {
            color: #2e7d32;
          }
        }
        &__hint {
          font-size: 11px;
          color: var(--df-text-muted);
          font-style: italic;
        }
        &__label {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--df-text-2);
          font-weight: 600;
        }
        &__value {
          font-size: 28px;
          font-weight: 600;
          color: var(--df-text);
          line-height: 1.1;

          small {
            font-size: 12px;
            font-weight: 500;
            color: var(--df-text-muted);
            margin-left: 4px;
          }
        }
        &__value--latency {
          font-size: 24px;
        }
        &__latency-tail {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          font-size: 11px;
          color: var(--df-text-muted);
          font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
          margin-top: 2px;

          strong {
            color: var(--df-text);
            font-weight: 600;
          }
        }
        &__footer {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 4px;
          min-height: 24px;
        }
        &__delta {
          font-size: 11px;
          font-weight: 600;
          color: var(--df-text-2);
          font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
          display: inline-flex;
          align-items: center;
          gap: 3px;
          flex: 0 0 auto;

          fa-icon {
            font-size: 9px;
            color: inherit;
          }

          &--good {
            color: #2e7d32;
          }
          &--bad {
            color: #d32f2f;
          }
        }
        &__spark {
          flex: 1 1 auto;
          min-width: 40px;
          max-width: 120px;
        }
      }

      :host-context(.dark-theme) {
        .summary {
          &__card--error .summary__value {
            color: #ff8585;
          }
          &__delta {
            &--good {
              color: #81c784;
            }
            &--bad {
              color: #ff8585;
            }
          }
        }
      }
    `,
  ],
})
export class DfUsageSummaryComponent {
  @Input({ required: true }) summary!: UsageSummary;

  faArrowUp = faArrowUp;
  faArrowDown = faArrowDown;

  formatUsd(v: number): string {
    // Shared, hoisted Intl formatters — template-reachable, runs per CD.
    return formatUSD(v);
  }

  /** Render a fractional delta (1.0 = +100%) with a sign and one decimal. */
  formatDelta(d: number | null | undefined): string {
    if (d == null || !Number.isFinite(d)) return '';
    const pct = d * 100;
    const sign = pct > 0 ? '+' : '';
    const decimals = Math.abs(pct) < 10 ? 1 : 0;
    return `${sign}${pct.toFixed(decimals)}%`;
  }
}
