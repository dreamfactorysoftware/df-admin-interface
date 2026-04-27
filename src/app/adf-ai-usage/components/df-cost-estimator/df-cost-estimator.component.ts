import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  UsageSessionRow,
  UsageSummary,
  ProviderRates,
} from '../../types/usage';
import { DEFAULT_RATES, estimateCost, formatUSD } from '../../utils/cost';

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
  imports: [CommonModule, FormsModule],
  template: `
    <section class="cost">
      <header class="cost__head">
        <h4 class="cost__title">Estimated cost</h4>
        <span class="cost__total">{{ formatUSD(totalCost) }}</span>
      </header>
      <p class="cost__hint">
        Estimated using DF's stored input/output token counts and the rates
        below (USD per 1k tokens). Edit any rate to recompute. Defaults are
        conservative mid-tier estimates and don't account for caching, batch
        discounts, or model-tier differences.
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
          No AI Connections configured — can't attribute tokens to providers
          yet.
        </p>
      </ng-template>
    </section>
  `,
  styles: [
    `
      .cost {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 8px;
        padding: 1rem 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;

        &__head {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
        }
        &__title {
          margin: 0;
          font-size: 0.95rem;
          font-weight: 600;
        }
        &__total {
          font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
          font-size: 1.5rem;
          font-weight: 600;
          color: #4ade80;
        }
        &__hint {
          margin: 0;
          font-size: 0.8125rem;
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.5;
        }
        &__empty {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.5);
          font-style: italic;
        }
        &__table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;

          th {
            text-align: left;
            padding: 0.5rem 0.625rem;
            font-size: 0.7rem;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            color: rgba(255, 255, 255, 0.55);
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          }
          td {
            padding: 0.5rem 0.625rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          }
          input {
            width: 5rem;
            padding: 0.25rem 0.4rem;
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 4px;
            color: inherit;
            font: inherit;
            font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
            text-align: right;

            &:focus {
              outline: none;
              border-color: #60a5fa;
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
      DEFAULT_RATES[provider] ?? {
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
        DEFAULT_RATES[provider] ?? {
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
