import { Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faArrowDown,
  faArrowUp,
  faMinus,
} from '@fortawesome/free-solid-svg-icons';

/**
 * df-stat-tile — one KPI tile in the dashboard grid.
 *
 * Eyebrow label (global `.df-eyebrow`) + large tabular value
 * (`--df-font-size-xl` + global `.df-numeric`) + an optional delta chip
 * (up/down %) + an optional projected sparkline. Flat, border-defined
 * surface, no shadow, equal-height when dropped in a CSS grid. The whole
 * tile click-throughs to `route` regardless of value — a zero is a call to
 * action, not a dead end. Tokens only; legible in all three themes.
 *
 * `value` is caller-pre-formatted and `label` is already-translated, so the
 * tile holds no static copy. By default an up delta reads success and a down
 * delta reads danger; set `invertDelta` for "up is bad" metrics (cost,
 * latency, error rate). Project a sparkline with the `sparkline` attribute.
 *
 * @example
 *   <df-stat-tile
 *     label="Total APIs"
 *     [value]="42"
 *     [delta]="12"
 *     deltaCaption="vs last week"
 *     [route]="['/api-connections']">
 *     <df-sparkline sparkline [series]="apiSeries"></df-sparkline>
 *   </df-stat-tile>
 *
 *   <df-stat-tile label="Monthly cost" value="$1.2k" [delta]="8" [invertDelta]="true"></df-stat-tile>
 */
@Component({
  selector: 'df-stat-tile',
  templateUrl: './df-stat-tile.component.html',
  styleUrls: ['./df-stat-tile.component.scss'],
  standalone: true,
  imports: [NgIf, RouterLink, FontAwesomeModule],
})
export class DfStatTileComponent {
  /** Eyebrow (already-translated); rendered through the global .df-eyebrow. */
  @Input() label = '';
  /** Big value; caller pre-formats (e.g. "1.2k", "$480", 42). */
  @Input() value: string | number = '';
  /** Signed percent change. null / undefined hides the delta chip. */
  @Input() delta?: number | null;
  /** Optional caption beside the delta, e.g. "vs last week". */
  @Input() deltaCaption?: string;
  /** Force the trend direction; otherwise derived from the sign of delta. */
  @Input() trend?: TrendDirection;
  /** "Up is bad" metrics (cost, latency): swap the success/danger colors. */
  @Input() invertDelta = false;
  /** Router destination. Bound to routerLink; when unset the tile is inert. */
  @Input() route?: string | unknown[] | null;

  get direction(): TrendDirection {
    if (this.trend) {
      return this.trend;
    }
    if (this.delta == null || this.delta === 0) {
      return 'flat';
    }
    return this.delta > 0 ? 'up' : 'down';
  }

  /** up + not-inverted => good; down + inverted => good. */
  get deltaTone(): 'positive' | 'negative' | 'flat' {
    const dir = this.direction;
    if (dir === 'flat') {
      return 'flat';
    }
    const good = this.invertDelta ? dir === 'down' : dir === 'up';
    return good ? 'positive' : 'negative';
  }

  get deltaIcon(): IconDefinition {
    switch (this.direction) {
      case 'up':
        return faArrowUp;
      case 'down':
        return faArrowDown;
      default:
        return faMinus;
    }
  }

  /** Absolute magnitude; the icon carries the sign. */
  get deltaDisplay(): string {
    return `${Math.abs(this.delta ?? 0)}%`;
  }
}

export type TrendDirection = 'up' | 'down' | 'flat';
