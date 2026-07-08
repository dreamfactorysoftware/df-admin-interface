import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { USD_2DP } from '../../utils/cost';

/**
 * Stacked cost-over-time chart, one layer per `bucket` value.
 *
 * Consumes the unified shape that the backend's series_by_<dim> keys
 * produce: an array of `{ date, bucket, cost_usd, requests, ... }` rows
 * where `bucket` is the dimension value (a model name, user id, etc.) or
 * the literal `__other__` sentinel for the long-tail aggregate.
 *
 * Renders custom SVG (no chart library) to match the existing
 * df-usage-stacked-area aesthetic. Each layer gets a deterministic color
 * from a fixed palette so the legend matches when data changes between
 * refreshes; the Other bucket is always rendered last in a muted gray.
 *
 * Why a separate component from df-usage-stacked-area: that one is hardwired
 * to two fixed layers (input vs output tokens) over a TimeBucket array.
 * This one's number of layers is data-driven (top N + Other) and the unit
 * is dollars, not tokens. Different shape → different component.
 */
export interface DimensionSeriesPoint {
  date: string;
  bucket: string;
  cost: number;
  requests: number;
}

interface Layer {
  d: string;
  fill: string;
  label: string;
  totalCost: number;
  isOther: boolean;
}

interface Tick {
  x?: number;
  y?: number;
  label: string;
}

@Component({
  selector: 'df-cost-by-dimension',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <mat-card
      class="cbd"
      [style.--cbd-w.px]="width"
      [style.--cbd-h.px]="height">
      <mat-card-content>
        <div class="cbd__header">
          <span class="cbd__title">{{ title }}</span>
          <span *ngIf="subtitle" class="cbd__subtitle">{{ subtitle }}</span>
        </div>

        <div *ngIf="layers.length > 0" class="cbd__legend">
          <span
            *ngFor="let l of layers; trackBy: trackLayer"
            class="cbd__legend-item">
            <span class="cbd__legend-swatch" [style.background]="l.fill"></span>
            <span [class.cbd__legend-other]="l.isOther">{{ l.label }}</span>
            <span class="cbd__legend-cost">{{ formatUsd(l.totalCost) }}</span>
          </span>
        </div>

        <svg
          class="cbd__svg"
          [attr.viewBox]="'0 0 ' + width + ' ' + height"
          preserveAspectRatio="none"
          role="img"
          [attr.aria-label]="title">
          <g class="cbd__grid">
            <line
              *ngFor="let t of yTicks; trackBy: trackIndex"
              [attr.x1]="paddingX"
              [attr.x2]="width - paddingX"
              [attr.y1]="t.y"
              [attr.y2]="t.y" />
          </g>

          <path
            *ngFor="let l of layers; trackBy: trackLayer"
            [attr.d]="l.d"
            [attr.fill]="l.fill"
            fill-opacity="0.85"
            stroke="none" />

          <g class="cbd__axis cbd__axis--x">
            <text
              *ngFor="let t of xTicks; trackBy: trackIndex"
              [attr.x]="t.x"
              [attr.y]="height - 4"
              text-anchor="middle">
              {{ t.label }}
            </text>
          </g>
          <g class="cbd__axis cbd__axis--y">
            <text
              *ngFor="let t of yTicks; trackBy: trackIndex"
              [attr.x]="paddingX - 6"
              [attr.y]="(t.y ?? 0) + 4"
              text-anchor="end">
              {{ t.label }}
            </text>
          </g>

          <g *ngIf="layers.length === 0" class="cbd__empty">
            <text
              [attr.x]="width / 2"
              [attr.y]="height / 2"
              text-anchor="middle">
              No spend in this range yet.
            </text>
          </g>
        </svg>
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `
      .cbd {
        mat-card-content {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        &__header {
          display: flex;
          align-items: baseline;
          gap: 12px;
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

        &__legend {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px 16px;
          font-size: 1.2rem;
          color: var(--df-text-2);
        }
        &__legend-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        &__legend-swatch {
          width: 10px;
          height: 10px;
          border-radius: 2px;
          border: 1px solid var(--df-border-2);
        }
        &__legend-other {
          font-style: italic;
          color: var(--df-text-muted);
        }
        &__legend-cost {
          font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
          font-size: 11px;
          color: var(--df-text-muted);
        }

        &__svg {
          width: 100%;
          height: var(--cbd-h, 240px);
          background: var(--df-surface-2);
          border-radius: var(--df-radius-sm);
        }

        &__grid line {
          stroke: var(--df-border-2);
          stroke-dasharray: 2 4;
        }
        &__axis text {
          fill: var(--df-text-muted);
          font-size: 11px;
          font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
        }
        &__empty text {
          fill: var(--df-text-muted);
          font-style: italic;
          font-size: 13px;
        }
      }
    `,
  ],
})
export class DfCostByDimensionComponent implements OnChanges {
  @Input() data: DimensionSeriesPoint[] = [];
  @Input() title = 'Cost over time';
  @Input() subtitle = '';
  @Input() bucketLabel: (key: string) => string = (k: string) => k;
  @Input() width = 720;
  @Input() height = 240;
  @Input() paddingX = 56;
  @Input() paddingY = 16;

  layers: Layer[] = [];
  xTicks: Tick[] = [];
  yTicks: Tick[] = [];

  // Deterministic colour palette. Picked for legibility on light + dark.
  // The Other bucket gets the muted gray (last entry) regardless of position.
  private readonly palette = [
    '#7f11e0', // df brand purple
    '#2196f3', // blue
    '#ff7043', // orange
    '#26a69a', // teal
    '#ffb300', // amber
    '#ec407a', // pink
    '#5c6bc0', // indigo
    '#66bb6a', // green
    '#ab47bc', // light purple
    '#42a5f5', // light blue
  ];
  private readonly otherColour = '#9e9e9e';
  static readonly OTHER_KEY = '__other__';

  ngOnChanges(): void {
    this.layers = [];
    this.xTicks = [];
    this.yTicks = [];

    const data = this.data ?? [];
    if (data.length === 0) {
      return;
    }

    // Step 1: collect distinct dates (sorted) and distinct buckets (sorted
    // by total cost desc; Other always last).
    const dateSet = new Set<string>();
    const bucketTotals = new Map<string, number>();
    for (const p of data) {
      dateSet.add(p.date);
      bucketTotals.set(p.bucket, (bucketTotals.get(p.bucket) ?? 0) + p.cost);
    }
    const dates = Array.from(dateSet).sort();
    if (dates.length === 0) {
      return;
    }

    const buckets = Array.from(bucketTotals.entries())
      .filter(([k]) => k !== DfCostByDimensionComponent.OTHER_KEY)
      .sort((a, b) => b[1] - a[1])
      .map(([k]) => k);
    if (bucketTotals.has(DfCostByDimensionComponent.OTHER_KEY)) {
      buckets.push(DfCostByDimensionComponent.OTHER_KEY);
    }
    if (buckets.length === 0) {
      return;
    }

    // Step 2: pivot data into a (date × bucket) cost matrix.
    const matrix: Record<string, Record<string, number>> = {};
    for (const d of dates) {
      matrix[d] = {};
      for (const b of buckets) {
        matrix[d][b] = 0;
      }
    }
    for (const p of data) {
      matrix[p.date][p.bucket] = (matrix[p.date][p.bucket] ?? 0) + p.cost;
    }

    // Step 3: stack heights per date.
    let maxStack = 0;
    for (const d of dates) {
      let stack = 0;
      for (const b of buckets) {
        stack += matrix[d][b];
      }
      if (stack > maxStack) {
        maxStack = stack;
      }
    }
    if (maxStack === 0) {
      // All zeros — keep the chart visible, render axes but no layers.
      this.yTicks = [{ y: this.paddingY + this.innerH(), label: '$0' }];
      this.xTicks = this.makeXTicks(dates);
      return;
    }

    // Step 4: build layered area paths bottom-up.
    const innerW = this.width - this.paddingX * 2;
    const innerH = this.innerH();
    const baseline = this.paddingY + innerH;
    const xAt = (i: number): number =>
      dates.length === 1
        ? this.paddingX + innerW / 2
        : this.paddingX + (i / (dates.length - 1)) * innerW;
    const yAt = (v: number): number =>
      this.paddingY + innerH * (1 - v / maxStack);

    let bottomPolyline: Array<[number, number]> | undefined;
    const cumulative = dates.map(() => 0);

    this.layers = buckets.map((bucket, layerIdx) => {
      const topPolyline: Array<[number, number]> = [];
      let totalCost = 0;
      for (let i = 0; i < dates.length; i++) {
        const v = matrix[dates[i]][bucket];
        cumulative[i] += v;
        totalCost += v;
        topPolyline.push([xAt(i), yAt(cumulative[i])]);
      }
      const d = pathArea(topPolyline, baseline, bottomPolyline);
      bottomPolyline = topPolyline;

      const isOther = bucket === DfCostByDimensionComponent.OTHER_KEY;
      const fill = isOther
        ? this.otherColour
        : this.palette[layerIdx % this.palette.length];
      const label = isOther ? 'Other' : this.bucketLabel(bucket);
      return { d, fill, label, totalCost, isOther };
    });

    // Order legend by cost (descending), Other last.
    this.layers.sort((a, b) => {
      if (a.isOther) return 1;
      if (b.isOther) return -1;
      return b.totalCost - a.totalCost;
    });

    this.xTicks = this.makeXTicks(dates);
    this.yTicks = [
      { y: yAt(0), label: '$0' },
      { y: yAt(maxStack / 2), label: formatUsd(maxStack / 2) },
      { y: yAt(maxStack), label: formatUsd(maxStack) },
    ];
  }

  formatUsd(v: number): string {
    return formatUsd(v);
  }

  trackLayer(_: number, l: Layer): string {
    return l.label;
  }

  trackIndex(i: number): number {
    return i;
  }

  private innerH(): number {
    return this.height - this.paddingY * 2 - 12;
  }

  private makeXTicks(dates: string[]): Tick[] {
    if (dates.length === 0) return [];
    const innerW = this.width - this.paddingX * 2;
    const tickCount = Math.min(5, dates.length);
    const ticks: Tick[] = [];
    for (let i = 0; i < tickCount; i++) {
      const idx = Math.round(
        (i * (dates.length - 1)) / Math.max(1, tickCount - 1)
      );
      const x =
        dates.length === 1
          ? this.paddingX + innerW / 2
          : this.paddingX + (idx / (dates.length - 1)) * innerW;
      ticks.push({ x, label: shortDate(dates[idx]) });
    }
    return ticks;
  }
}

function pathArea(
  top: Array<[number, number]>,
  baseline: number,
  bottom?: Array<[number, number]>
): string {
  if (top.length === 0) {
    return '';
  }
  const parts: string[] = [];
  parts.push(`M ${top[0][0].toFixed(2)} ${top[0][1].toFixed(2)}`);
  for (let i = 1; i < top.length; i++) {
    parts.push(`L ${top[i][0].toFixed(2)} ${top[i][1].toFixed(2)}`);
  }
  if (bottom && bottom.length === top.length) {
    for (let i = bottom.length - 1; i >= 0; i--) {
      parts.push(`L ${bottom[i][0].toFixed(2)} ${bottom[i][1].toFixed(2)}`);
    }
  } else {
    const last = top[top.length - 1];
    const first = top[0];
    parts.push(`L ${last[0].toFixed(2)} ${baseline.toFixed(2)}`);
    parts.push(`L ${first[0].toFixed(2)} ${baseline.toFixed(2)}`);
  }
  parts.push('Z');
  return parts.join(' ');
}

function shortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return iso.slice(5); // fall back to MM-DD from YYYY-MM-DD strings
  }
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatUsd(v: number): string {
  if (!Number.isFinite(v) || v === 0) return '$0';
  if (v < 0.01) return '<$0.01';
  if (v < 1) return `$${v.toFixed(4)}`;
  // Shared, hoisted formatter — template-reachable via the class method.
  return USD_2DP.format(v);
}
