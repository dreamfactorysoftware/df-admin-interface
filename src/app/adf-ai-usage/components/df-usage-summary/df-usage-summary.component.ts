import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { UsageSummary } from '../../types/usage';

@Component({
  selector: 'df-usage-summary',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="summary">
      <article class="summary__card">
        <span class="summary__label">Sessions</span>
        <span class="summary__value">{{ summary.sessionCount | number }}</span>
      </article>
      <article class="summary__card">
        <span class="summary__label">Input tokens</span>
        <span class="summary__value">{{ summary.inputTokens | number }}</span>
      </article>
      <article class="summary__card">
        <span class="summary__label">Output tokens</span>
        <span class="summary__value">{{ summary.outputTokens | number }}</span>
      </article>
      <article class="summary__card">
        <span class="summary__label">Total tokens</span>
        <span class="summary__value">{{ summary.totalTokens | number }}</span>
      </article>
      <article class="summary__card">
        <span class="summary__label">Tool calls</span>
        <span class="summary__value">{{ summary.toolCalls | number }}</span>
      </article>
      <article class="summary__card">
        <span class="summary__label">Avg / session</span>
        <span class="summary__value"
          >{{ summary.avgTokensPerSession | number }}
          <small>tokens</small></span
        >
      </article>
    </div>
  `,
  styles: [
    `
      .summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 0.75rem;

        &__card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          padding: 0.875rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        &__label {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: rgba(255, 255, 255, 0.5);
        }
        &__value {
          font-size: 1.4rem;
          font-weight: 600;
          font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
          line-height: 1;

          small {
            font-size: 0.7rem;
            color: rgba(255, 255, 255, 0.5);
            font-weight: 400;
            margin-left: 0.25rem;
          }
        }
      }
    `,
  ],
})
export class DfUsageSummaryComponent {
  @Input({ required: true }) summary!: UsageSummary;
}
