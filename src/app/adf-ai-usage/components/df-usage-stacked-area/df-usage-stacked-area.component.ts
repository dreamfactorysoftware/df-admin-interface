import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { TimeBucket } from '../../types/usage';

interface Layer {
  d: string;
  fill: string;
  label: string;
  total: number;
}

interface Tick {
  x: number;
  label: string;
}

interface YTick {
  y: number;
  label: string;
}

@Component({
  selector: 'df-usage-stacked-area',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <mat-card
      class="chart"
      [style.--chart-w.px]="width"
      [style.--chart-h.px]="height">
      <mat-card-content>
        <div class="chart__legend">
          <span class="chart__title">Tokens over time</span>
          <span *ngFor="let l of layers; trackBy: trackLayer" class="chart__legend-item">
            <span
              class="chart__legend-swatch"
              [style.background]="l.fill"></span>
            {{ l.label }}
            <span class="chart__legend-total">{{ formatK(l.total) }}</span>
          </span>
        </div>
        <svg
          class="chart__svg"
          [attr.viewBox]="'0 0 ' + width + ' ' + height"
          preserveAspectRatio="none"
          role="img"
          aria-label="Tokens over time">
          <g class="chart__grid">
            <line
              *ngFor="let t of yTicks; trackBy: trackIndex"
              [attr.x1]="paddingX"
              [attr.x2]="width - paddingX"
              [attr.y1]="t.y"
              [attr.y2]="t.y" />
          </g>

          <path
            *ngFor="let layer of layers; trackBy: trackLayer"
            [attr.d]="layer.d"
            [attr.fill]="layer.fill"
            fill-opacity="0.85"
            stroke="none" />

          <g class="chart__axis chart__axis--x">
            <text
              *ngFor="let t of xTicks; trackBy: trackIndex"
              [attr.x]="t.x"
              [attr.y]="height - 4"
              text-anchor="middle">
              {{ t.label }}
            </text>
          </g>
          <g class="chart__axis chart__axis--y">
            <text
              *ngFor="let t of yTicks; trackBy: trackIndex"
              [attr.x]="paddingX - 6"
              [attr.y]="t.y + 4"
              text-anchor="end">
              {{ t.label }}
            </text>
          </g>

          <g *ngIf="!hasData" class="chart__empty">
            <text
              [attr.x]="width / 2"
              [attr.y]="height / 2"
              text-anchor="middle">
              No data in this range yet.
            </text>
          </g>
        </svg>
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `
      .chart {
        mat-card-content {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        &__legend {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 12px 24px;
          font-size: 13px;
          color: var(--df-text-2);
        }
        &__title {
          font-weight: 600;
          color: var(--df-text);
          font-size: 16px;
          margin-right: 8px;
        }
        &__legend-item {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        &__legend-swatch {
          width: 12px;
          height: 12px;
          border-radius: 2px;
        }
        &__legend-total {
          font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
          font-size: 12px;
          color: var(--df-text-2);
        }

        &__svg {
          width: 100%;
          height: var(--chart-h, 280px);
          background: var(--df-surface-2);
          border-radius: 4px;
        }

        &__grid line {
          stroke: var(--df-border-2);
          stroke-dasharray: 2 4;
        }
        &__axis text {
          fill: var(--df-text-2);
          font-size: 12px;
          font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
        }
        &__empty text {
          fill: var(--df-text-2);
          font-style: italic;
          font-size: 14px;
        }
      }
    `,
  ],
})
export class DfUsageStackedAreaComponent implements OnChanges {
  @Input() data: TimeBucket[] = [];
  @Input() width = 720;
  @Input() height = 280;
  @Input() paddingX = 48;
  @Input() paddingY = 16;

  layers: Layer[] = [];
  xTicks: Tick[] = [];
  yTicks: YTick[] = [];
  hasData = false;

  ngOnChanges(): void {
    this.layers = [];
    this.xTicks = [];
    this.yTicks = [];
    this.hasData = (this.data ?? []).some(
      d => d.inputTokens + d.outputTokens > 0
    );
    if (!this.hasData) {
      return;
    }

    const n = this.data.length;
    const innerW = this.width - this.paddingX * 2;
    const innerH = this.height - this.paddingY * 2 - 12;

    let maxStack = 0;
    for (const b of this.data) {
      const stack = b.inputTokens + b.outputTokens;
      if (stack > maxStack) {
        maxStack = stack;
      }
    }
    if (maxStack === 0) {
      maxStack = 1;
    }

    const xAt = (i: number): number =>
      n === 1
        ? this.paddingX + innerW / 2
        : this.paddingX + (i / (n - 1)) * innerW;

    const yAt = (v: number): number =>
      this.paddingY + innerH * (1 - v / maxStack);

    // Build the cumulative input + output area paths.
    const baseline = this.paddingY + innerH;

    const inputPath = pathArea(
      this.data.map((b, i) => [xAt(i), yAt(b.inputTokens)]),
      baseline
    );
    const outputPath = pathArea(
      this.data.map((b, i) => [xAt(i), yAt(b.inputTokens + b.outputTokens)]),
      baseline,
      this.data.map((b, i) => [xAt(i), yAt(b.inputTokens)])
    );

    this.layers = [
      {
        d: inputPath,
        fill: '#2196f3',
        label: 'Input',
        total: sumKey(this.data, 'inputTokens'),
      },
      {
        d: outputPath,
        fill: '#7f11e0',
        label: 'Output',
        total: sumKey(this.data, 'outputTokens'),
      },
    ];

    // X ticks: ~5 evenly spaced labels.
    const xTickCount = Math.min(5, n);
    for (let i = 0; i < xTickCount; i++) {
      const idx = Math.round((i * (n - 1)) / Math.max(1, xTickCount - 1));
      this.xTicks.push({
        x: xAt(idx),
        label: shortDate(this.data[idx].date),
      });
    }

    // Y ticks: 0, mid, max.
    this.yTicks = [
      { y: yAt(0), label: '0' },
      { y: yAt(maxStack / 2), label: formatK(Math.round(maxStack / 2)) },
      { y: yAt(maxStack), label: formatK(maxStack) },
    ];
  }

  formatK(n: number): string {
    return formatK(n);
  }

  trackLayer(_: number, l: Layer): string {
    return l.label;
  }

  trackIndex(i: number): number {
    return i;
  }
}

/** Build a closed area-path SVG `d` from a top polyline. Optional bottom polyline. */
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
  if (bottom) {
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

function sumKey(data: TimeBucket[], k: keyof TimeBucket): number {
  let total = 0;
  for (const d of data) {
    const v = d[k];
    if (typeof v === 'number') {
      total += v;
    }
  }
  return total;
}

function shortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatK(n: number): string {
  if (n < 1000) {
    return String(n);
  }
  if (n < 1_000_000) {
    return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}k`;
  }
  return `${(n / 1_000_000).toFixed(1)}M`;
}
