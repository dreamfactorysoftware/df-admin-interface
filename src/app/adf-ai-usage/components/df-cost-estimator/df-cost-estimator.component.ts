import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import {
  UsageSessionRow,
  UsageSummary,
  ProviderRates,
} from '../../types/usage';
import { estimateCost, formatUSD } from '../../utils/cost';

interface ProviderBreakdown {
  provider: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  rates: ProviderRates;
}

@Component({
  selector: 'df-cost-estimator',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule],
  template: `
    <mat-card class="cost">
      <mat-card-content>
        <header class="cost__head">
          <h4 class="cost__title">What-if cost calculator</h4>
          <span class="cost__total">{{ formatUSD(totalCost) }}</span>
        </header>
        <p class="cost__hint">
          The "Estimated cost" tile above is the source of truth: it uses the
          rates you configured on each AI Connection at log-time. This panel
          lets you experiment with different rates against the same token
          counts, so you can model what a price change would do without editing
          your services. Edits here don't persist.
        </p>

        <table class="cost__table" *ngIf="rows.length > 0; else noConn">
          <thead>
            <tr>
              <th>Provider</th>
              <th class="cost__col-num">Input tokens</th>
              <th class="cost__col-rate">$ / 1k in</th>
              <th class="cost__col-num">Output tokens</th>
              <th class="cost__col-rate">$ / 1k out</th>
              <th class="cost__col-num">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of rows">
              <td>{{ row.provider }}</td>
              <td class="cost__col-num">{{ row.inputTokens | number }}</td>
              <td class="cost__col-rate">
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  [ngModel]="row.rates.inputPer1k"
                  (ngModelChange)="
                    updateRate(row.provider, 'inputPer1k', $event)
                  " />
              </td>
              <td class="cost__col-num">{{ row.outputTokens | number }}</td>
              <td class="cost__col-rate">
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  [ngModel]="row.rates.outputPer1k"
                  (ngModelChange)="
                    updateRate(row.provider, 'outputPer1k', $event)
                  " />
              </td>
              <td class="cost__col-num">{{ formatUSD(row.cost) }}</td>
            </tr>
          </tbody>
        </table>
        <ng-template #noConn>
          <p class="cost__empty">
            No AI Connections configured, so tokens can't be attributed to
            providers yet.
          </p>
        </ng-template>
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `
      .cost {
        mat-card-content {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        &__head {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 12px;
        }
        &__title {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 600;
          letter-spacing: -0.01em;
          color: var(--df-text);
        }
        &__total {
          font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
          font-size: 2.4rem;
          font-weight: 700;
          color: var(--df-success);
        }
        &__hint {
          margin: 0;
          font-size: 1.3rem;
          color: var(--df-text-2);
          line-height: 1.5;
        }
        &__empty {
          font-size: 1.4rem;
          color: var(--df-text-2);
          font-style: italic;
        }
        &__table {
          width: 100%;
          border-collapse: collapse;
          font-size: 1.4rem;
          color: var(--df-text);

          th {
            text-align: left;
            padding: 10px 12px;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: var(--df-text-muted);
            border-bottom: 1px solid var(--df-border);
            font-weight: 600;
          }
          td {
            padding: 10px 12px;
            border-bottom: 1px solid var(--df-border-2);
          }
          tbody tr {
            height: 44px;

            &:hover {
              background: var(--df-hover);
            }
          }
          input {
            width: 90px;
            padding: 6px 8px;
            background: var(--df-surface);
            border: 1px solid var(--df-border);
            border-radius: var(--df-radius-sm);
            color: var(--df-text);
            font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
            font-size: 1.3rem;
            text-align: right;
            transition:
              border-color 0.2s ease,
              box-shadow 0.2s ease;

            &:focus {
              outline: none;
              border-color: var(--df-accent);
              box-shadow: 0 0 0 2px var(--df-accent-soft);
            }
          }
        }
        &__col-num,
        &__col-rate {
          text-align: right;
          font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
          white-space: nowrap;
        }
      }
    `,
  ],
})
export class DfCostEstimatorComponent implements OnChanges {
  @Input({ required: true }) sessions: UsageSessionRow[] = [];
  /** ai_service_id -> provider name */
  @Input({ required: true }) connectionProviders!: Map<number, string>;
  /** Provider → default rates, sourced from the backend's UsageRates table
   *  via bundle.raw.default_rates. Single source of truth for fallback
   *  pricing — no hardcoded duplicate in the frontend. */
  @Input() defaultRates: Record<string, ProviderRates> = {};
  @Input() summary?: UsageSummary;

  rows: ProviderBreakdown[] = [];
  customRates: Map<string, ProviderRates> = new Map();

  ngOnChanges(): void {
    this.rebuild();
  }

  updateRate(
    provider: string,
    field: 'inputPer1k' | 'outputPer1k',
    value: number
  ): void {
    const cur = this.customRates.get(provider) ??
      this.defaultRates[provider] ?? {
        provider,
        inputPer1k: 0,
        outputPer1k: 0,
      };
    this.customRates.set(provider, { ...cur, [field]: Number(value) || 0 });
    this.rebuild();
  }

  rebuild(): void {
    const byProvider = new Map<string, { input: number; output: number }>();

    for (const s of this.sessions) {
      const provider =
        this.connectionProviders.get(s.ai_service_id) ?? 'unknown';
      const cur = byProvider.get(provider) ?? { input: 0, output: 0 };
      cur.input += s.total_input_tokens ?? 0;
      cur.output += s.total_output_tokens ?? 0;
      byProvider.set(provider, cur);
    }

    this.rows = Array.from(byProvider.entries()).map(([provider, t]) => {
      const rates = this.customRates.get(provider) ??
        this.defaultRates[provider] ?? {
          provider,
          inputPer1k: 0,
          outputPer1k: 0,
        };
      return {
        provider,
        inputTokens: t.input,
        outputTokens: t.output,
        cost: estimateCost(t.input, t.output, rates),
        rates,
      };
    });
    this.rows.sort((a, b) => b.cost - a.cost);
  }

  get totalCost(): number {
    return this.rows.reduce((acc, r) => acc + r.cost, 0);
  }

  formatUSD(v: number): string {
    return formatUSD(v);
  }
}
