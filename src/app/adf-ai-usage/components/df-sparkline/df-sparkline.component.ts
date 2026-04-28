import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';

/**
 * Tiny inline sparkline. Renders a polyline + filled area, no axes / labels /
 * legend — designed to live inside summary tiles to give a visual sense of
 * trend over the period.
 *
 * Pure SVG, no chart library. Width/height are CSS-controlled; the viewBox
 * is set from the data length and a normalized 0..100 vertical scale.
 */
@Component({
  selector: 'df-sparkline',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg
      *ngIf="hasData"
      class="sparkline"
      [attr.viewBox]="viewBox"
      preserveAspectRatio="none"
      role="img"
      [attr.aria-label]="ariaLabel">
      <path
        *ngIf="areaPath"
        class="sparkline__area"
        [attr.d]="areaPath"
        [attr.fill]="color"
        fill-opacity="0.18" />
      <path
        *ngIf="linePath"
        class="sparkline__line"
        [attr.d]="linePath"
        fill="none"
        [attr.stroke]="color"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round" />
    </svg>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 24px;
      }
      .sparkline {
        display: block;
        width: 100%;
        height: 100%;
      }
    `,
  ],
})
export class DfSparklineComponent implements OnChanges {
  @Input({ required: true }) data: number[] = [];
  @Input() color = '#7f11e0';
  @Input() ariaLabel = 'sparkline';

  hasData = false;
  viewBox = '0 0 100 24';
  linePath = '';
  areaPath = '';

  ngOnChanges(): void {
    const data = this.data ?? [];
    this.hasData = data.some(v => v > 0);
    if (!this.hasData) {
      this.linePath = '';
      this.areaPath = '';
      return;
    }

    const n = data.length;
    const w = Math.max(n - 1, 1);
    const h = 24;
    this.viewBox = `0 0 ${w} ${h}`;

    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;
    const yAt = (v: number): number => h - ((v - min) / range) * (h - 2) - 1;
    const xAt = (i: number): number => (n === 1 ? w / 2 : i);

    const points = data.map(
      (v, i) => `${xAt(i).toFixed(2)} ${yAt(v).toFixed(2)}`
    );
    this.linePath =
      `M ${points[0]}` +
      points
        .slice(1)
        .map(p => ` L ${p}`)
        .join('');
    this.areaPath = `${this.linePath} L ${xAt(n - 1).toFixed(2)} ${h} L ${xAt(0).toFixed(2)} ${h} Z`;
  }
}
