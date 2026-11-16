import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
} from '@angular/core';
import { NgFor } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { StripMark, TableSummary } from '../data-masking.types';

/** Most ticks a strip draws; wider tables squeeze their clear runs. */
export const MAX_TICKS = 24;
/** Sensitive names listed in the tooltip before "+N". */
const TIP_NAMES = 12;

interface Tick {
  cls: string;
}

type StripItem = TableSummary['strip'][number];

/**
 * df-sensitivity-strip: one tick per column, coloured by tier, so a table's
 * sensitive columns are visible without reading. Clear columns are faint,
 * review columns hollow. It sits in a fixed slot and never draws more than
 * MAX_TICKS ticks: past that, clear runs are squeezed first, and when the
 * sensitive columns alone are too many, neighbours share a tick that
 * shows the strictest of them, so sensitive data never disappears into
 * grey. One tooltip on the whole strip names the sensitive columns.
 */
@Component({
  selector: 'df-sensitivity-strip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgFor, MatTooltipModule],
  template: `
    <span
      class="strip"
      role="img"
      [attr.aria-label]="label"
      [matTooltip]="tip"
      [matTooltipDisabled]="!tip"
      matTooltipPosition="right"
      matTooltipClass="dm-strip-tip">
      <span *ngFor="let t of ticks; trackBy: trackTick" [class]="t.cls"></span>
    </span>
  `,
  styleUrls: ['./df-sensitivity-strip.component.scss'],
})
export class DfSensitivityStripComponent implements OnChanges {
  @Input() strip: TableSummary['strip'] = [];
  /** Spoken summary, already translated. */
  @Input() label = '';

  ticks: Tick[] = [];
  tip = '';

  ngOnChanges(): void {
    const items = this.strip ?? [];
    this.ticks = compressStrip(items).map(s => ({
      cls: `tick ${tickClass(s.mark, s.tier)}`,
    }));
    const names = items.filter(s => s.mark !== 'clear').map(s => s.column);
    const extra = names.length - TIP_NAMES;
    this.tip =
      names.slice(0, TIP_NAMES).join(', ') + (extra > 0 ? ` +${extra}` : '');
  }

  trackTick = (i: number) => i;
}

/** Strictness for sharing a tick: the strictest neighbour is drawn. */
function rank(s: StripItem): number {
  const tier = s.mark === 'review' ? s.tier : s.mark;
  const base =
    tier === 'restricted'
      ? 8
      : tier === 'identity'
        ? 6
        : tier === 'free_text'
          ? 4
          : tier === 'quasi'
            ? 2
            : 0;
  // A decided mask outranks an undecided one of the same tier.
  return s.mark === 'review' ? Math.max(base - 1, 1) : base;
}

/**
 * At most MAX_TICKS ticks. Keep every sensitive mark and shrink runs of
 * clear marks when that fits (a clear run never vanishes entirely);
 * otherwise split the columns into MAX_TICKS even buckets, each drawn as
 * its strictest mark.
 */
export function compressStrip(items: StripItem[]): StripItem[] {
  if (items.length <= MAX_TICKS) return items;
  const sensitive = items.filter(s => s.mark !== 'clear').length;
  const clear = items.length - sensitive;
  const runs: StripItem[][] = [];
  for (const s of items) {
    const last = runs[runs.length - 1];
    if (last && s.mark === 'clear' && last[0].mark === 'clear') last.push(s);
    else runs.push([s]);
  }
  const clearRuns = runs.filter(r => r[0].mark === 'clear').length;
  if (sensitive + clearRuns <= MAX_TICKS) {
    const budget = MAX_TICKS - sensitive;
    const out: StripItem[][] = runs.map(r =>
      r[0].mark !== 'clear'
        ? r
        : r.slice(0, Math.max(1, Math.round((r.length / clear) * budget)))
    );
    // Rounding can overshoot: trim the longest clear runs back to the cap.
    let total = out.reduce((n, r) => n + r.length, 0);
    while (total > MAX_TICKS) {
      let longest = -1;
      out.forEach((r, i) => {
        if (
          r[0].mark === 'clear' &&
          r.length > 1 &&
          (longest < 0 || r.length > out[longest].length)
        ) {
          longest = i;
        }
      });
      if (longest < 0) break;
      out[longest] = out[longest].slice(0, -1);
      total--;
    }
    if (total <= MAX_TICKS) return out.flat();
  }
  const res: StripItem[] = [];
  for (let b = 0; b < MAX_TICKS; b++) {
    const start = Math.floor((b * items.length) / MAX_TICKS);
    const end = Math.floor(((b + 1) * items.length) / MAX_TICKS);
    let best = items[start];
    for (let i = start + 1; i < end; i++) {
      if (rank(items[i]) > rank(best)) best = items[i];
    }
    res.push(best);
  }
  return res;
}

export function tickClass(mark: StripMark, tier?: string | null): string {
  return mark === 'review'
    ? `is-review dm-tier-${tier || 'clear'}`
    : `dm-tier-${mark}`;
}
