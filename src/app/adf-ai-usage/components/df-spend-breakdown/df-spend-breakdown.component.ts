import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { USD_2DP } from '../../utils/cost';

/** One row of spend to break down: a dimension member and its dollar cost. */
export interface SpendSlice {
  key: string;
  label: string;
  costUsd: number;
}

interface RenderSlice {
  key: string;
  label: string;
  costUsd: number;
  sharePct: number; // 0..100 of total spend
  tint: string; // CSS var() reference from the --df-tint-* set
  isOther: boolean;
}

/**
 * Categorical "share of spend" breakdown — one horizontal bar per dimension
 * member (model, provider, etc.), sorted by cost, long tail folded into an
 * "Other" slice.
 *
 * DELIBERATELY separate from df-cost-by-dimension: that one plots cost over
 * TIME as a stacked area; this one answers "what share of the bill is each
 * member RIGHT NOW" as a single categorical bar set. Different question,
 * different mark.
 *
 * Colour comes from the sanctioned categorical palette — the global
 * `--df-tint-*` tokens (spec 1.3 dataviz rule: categorical series draw from
 * the tint set). Cycled by index so the same member keeps its colour across
 * refreshes. In phosphor the tints collapse toward green shades by design
 * (the terminal does not do rainbows), so every row ALSO carries its label
 * and dollar value in text — colour is a secondary cue, never the only one.
 */
@Component({
  selector: 'df-spend-breakdown',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTooltipModule, FontAwesomeModule],
  template: `
    <mat-card class="sbd">
      <mat-card-content>
        <div class="sbd__head">
          <h4 class="sbd__title">
            {{ title }}
            <fa-icon
              *ngIf="hint"
              class="sbd__hint"
              [icon]="faCircleInfo"
              [matTooltip]="hint"
              matTooltipPosition="above"></fa-icon>
          </h4>
          <span class="sbd__total" *ngIf="total > 0">
            {{ formatUsd(total) }}
          </span>
        </div>

        <p *ngIf="subtitle" class="sbd__subtitle">{{ subtitle }}</p>

        <div *ngIf="slices.length === 0" class="sbd__empty">
          No spend in this range yet.
        </div>

        <ul class="sbd__list">
          <li *ngFor="let s of slices; trackBy: trackSlice" class="sbd__row">
            <div class="sbd__row-head">
              <span class="sbd__swatch" [style.background]="s.tint"></span>
              <span
                class="sbd__label"
                [class.sbd__label--other]="s.isOther"
                [title]="s.label"
                >{{ s.label }}</span
              >
              <span class="sbd__cost">{{ formatUsd(s.costUsd) }}</span>
              <span class="sbd__pct">{{ s.sharePct | number: '1.0-0' }}%</span>
            </div>
            <div class="sbd__track">
              <span
                class="sbd__fill"
                [style.width.%]="s.sharePct"
                [style.background]="s.tint"></span>
            </div>
          </li>
        </ul>
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `
      .sbd {
        mat-card-content {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        &__head {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 12px;
        }
        &__title {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 600;
          letter-spacing: -0.01em;
          color: var(--df-text);
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        &__hint {
          font-size: 1.3rem;
          color: var(--df-text-muted);
          cursor: help;

          &:hover {
            color: var(--df-accent);
          }
        }
        &__total {
          font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
          font-size: 1.4rem;
          font-weight: 600;
          color: var(--df-text);
        }
        &__subtitle {
          margin: 0;
          font-size: 1.2rem;
          color: var(--df-text-muted);
        }
        &__empty {
          padding: 8px 0;
          color: var(--df-text-muted);
          font-style: italic;
          font-size: 1.35rem;
        }
        &__list {
          list-style: none;
          margin: 4px 0 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        &__row {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        &__row-head {
          display: grid;
          grid-template-columns: 10px minmax(0, 1fr) auto auto;
          align-items: baseline;
          gap: 8px;
          font-size: 1.3rem;
        }
        &__swatch {
          width: 10px;
          height: 10px;
          border-radius: 2px;
          border: 1px solid var(--df-border-2);
          align-self: center;
        }
        &__label {
          color: var(--df-text);
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;

          &--other {
            font-style: italic;
            color: var(--df-text-muted);
          }
        }
        &__cost {
          font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
          font-weight: 600;
          color: var(--df-text);
        }
        &__pct {
          font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
          font-size: 1.15rem;
          color: var(--df-text-muted);
          min-width: 36px;
          text-align: right;
        }
        // Progress track: a rounded capsule; it is a meter, not chrome.
        &__track {
          height: 8px;
          background: var(--df-surface-2);
          border-radius: 999px;
          overflow: hidden;
        }
        &__fill {
          display: block;
          height: 100%;
          border-radius: 999px;
          transition: width var(--df-duration-standard, 0.2s)
            var(--df-ease-standard, ease-out);
        }
      }
    `,
  ],
})
export class DfSpendBreakdownComponent implements OnChanges {
  @Input({ required: true }) title!: string;
  @Input() subtitle = '';
  @Input() hint = '';
  @Input() rows: SpendSlice[] = [];
  /** Top-N members shown individually; the rest fold into "Other". */
  @Input() limit = 8;

  slices: RenderSlice[] = [];
  total = 0;

  faCircleInfo = faCircleInfo;

  // Sanctioned categorical palette: the global --df-tint-* foreground tokens.
  // Seven distinct hues in light/dark; near-monochrome green shades in
  // phosphor (by design). Cycled by rank.
  private readonly tints = [
    'var(--df-tint-ai-fg)',
    'var(--df-tint-data-fg)',
    'var(--df-tint-security-fg)',
    'var(--df-tint-system-fg)',
    'var(--df-tint-build-fg)',
    'var(--df-tint-docs-fg)',
    'var(--df-tint-admin-fg)',
  ];
  private readonly otherTint = 'var(--df-text-muted)';

  ngOnChanges(): void {
    this.slices = [];
    this.total = 0;

    // Only positive-cost members participate — a spend breakdown of $0
    // (e.g. all-local models) has nothing to show, so it renders empty and
    // the parent omits the whole panel.
    const priced = (this.rows ?? []).filter(r => r.costUsd > 0);
    if (priced.length === 0) {
      return;
    }

    const total = priced.reduce((sum, r) => sum + r.costUsd, 0);
    this.total = total;
    if (total <= 0) {
      return;
    }

    const sorted = [...priced].sort((a, b) => b.costUsd - a.costUsd);
    const head = sorted.slice(0, this.limit);
    const tail = sorted.slice(this.limit);

    const rendered: RenderSlice[] = head.map((r, i) => ({
      key: r.key,
      label: r.label,
      costUsd: r.costUsd,
      sharePct: (r.costUsd / total) * 100,
      tint: this.tints[i % this.tints.length],
      isOther: false,
    }));

    if (tail.length > 0) {
      const otherCost = tail.reduce((sum, r) => sum + r.costUsd, 0);
      rendered.push({
        key: '__other__',
        label: `Other (${tail.length})`,
        costUsd: otherCost,
        sharePct: (otherCost / total) * 100,
        tint: this.otherTint,
        isOther: true,
      });
    }

    this.slices = rendered;
  }

  formatUsd(v: number): string {
    if (!Number.isFinite(v) || v === 0) return '$0';
    if (v < 0.01) return '<$0.01';
    if (v < 1) return `$${v.toFixed(4)}`;
    return USD_2DP.format(v);
  }

  trackSlice(_: number, s: RenderSlice): string {
    return s.key;
  }
}
