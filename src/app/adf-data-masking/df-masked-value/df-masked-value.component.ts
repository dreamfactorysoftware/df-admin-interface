import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  inject,
} from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { TranslocoService } from '@ngneat/transloco';
import { MaskFormat, Tier } from '../data-masking.catalog';
import {
  MASK_GLYPH,
  MaskSegment,
  TOKEN_RE,
  segmentMasked,
} from '../mask-format';

/** Longest bar, in glyphs: long runs read as "a lot", not a ruler. */
const MAX_BAR = 10;
/** Most characters of free text (span format) ever drawn. */
export const SPAN_MAX_CHARS = 48;
/** What the guard draws instead of an unmasked value. */
const FULL_BAR = MASK_GLYPH.repeat(8);

/**
 * Privacy guard. A masked/review value must visibly carry its mask; this
 * never trusts the server to have done it. Returns what is safe to draw:
 * the value itself, a capped span text, or a full redaction bar.
 */
export function safeMasked(
  value: string,
  format: MaskFormat | null | undefined
): string {
  if (value.includes(MASK_GLYPH)) {
    return format === 'span' ? capSpan(value) : value;
  }
  if (TOKEN_RE.test(value)) return value;
  // Year only legitimately keeps every character it shows: a bare year.
  if (format === 'year' && /^\d{2,4}$/.test(value.trim())) return value;
  // Anything else without a mask in it is a raw value: draw a bar.
  return FULL_BAR;
}

function capSpan(value: string): string {
  return value.length > SPAN_MAX_CHARS
    ? `${value.slice(0, SPAN_MAX_CHARS - 1)}…`
    : value;
}

/**
 * df-masked-value: a masked value drawn like a redacted document. Runs of
 * the mask glyph become solid tier-tinted bars; kept characters stay plain;
 * typed tokens render as a mono chip, and a null (the null format, or a
 * numeric value under any other format, which the API returns as null) as a
 * tinted `null` chip. A missing value with no format (a review column with
 * no class, which the server redacts) draws a bar. The visible marks are
 * aria-hidden and the host carries one spoken label ("Masked, ends in 4821").
 */
@Component({
  selector: 'df-masked-value',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIf, NgFor, NgClass],
  template: `
    <span
      class="mv"
      [ngClass]="'dm-tier-' + (tier || 'clear')"
      role="img"
      [attr.aria-label]="label">
      <ng-container *ngIf="isNull; else notNull">
        <span class="mv-null" aria-hidden="true">null</span>
      </ng-container>
      <ng-template #notNull>
        <span *ngIf="token; else bars" class="mv-token" aria-hidden="true">{{
          shown
        }}</span>
      </ng-template>
      <ng-template #bars>
        <span class="mv-text" aria-hidden="true"
          ><ng-container
            *ngFor="let s of segments; let i = index; trackBy: trackSeg"
            ><span
              *ngIf="s.kind === 'bar'; else plain"
              class="mv-bar"
              [class.before-text]="isText(i + 1)"
              [class.after-text]="isText(i - 1)"
              [style.width.em]="barWidth(s)"></span
            ><ng-template #plain
              ><span class="mv-seg">{{ s.text }}</span></ng-template
            ></ng-container
          ></span
        >
      </ng-template>
    </span>
  `,
  styleUrls: ['./df-masked-value.component.scss'],
})
export class DfMaskedValueComponent implements OnChanges {
  private transloco = inject(TranslocoService);

  @Input() value: string | null | undefined = null;
  @Input() tier: Tier | null = null;
  @Input() format: MaskFormat | null | undefined = null;

  segments: MaskSegment[] = [];
  token = false;
  isNull = false;
  label = '';

  /** The guarded value actually drawn. */
  shown = '';

  /** A null that stands for a non-string value (format other than null). */
  private nullValue = false;

  ngOnChanges(): void {
    const raw = this.value;
    const missing = raw === null || raw === undefined;
    this.isNull = this.format === 'null' || (missing && !!this.format);
    this.nullValue = this.isNull && this.format !== 'null';
    const v = this.isNull
      ? ''
      : missing
        ? FULL_BAR
        : safeMasked(String(raw), this.format);
    this.token = !this.isNull && TOKEN_RE.test(v);
    this.shown = v;
    this.segments = this.isNull || this.token ? [] : segmentMasked(v);
    this.label = this.spoken();
  }

  barWidth(s: MaskSegment): number {
    return Math.round(Math.min(s.length, MAX_BAR) * 55) / 100;
  }

  trackSeg = (i: number) => i;

  /** Is the segment at `i` (if any) kept text? Spaces bars from it. */
  isText(i: number): boolean {
    return this.segments[i]?.kind === 'text';
  }

  private spoken(): string {
    const t = (k: string, p?: Record<string, unknown>) =>
      this.transloco.translate(`dataMasking.mv.${k}`, p);
    if (this.isNull) return t(this.nullValue ? 'nullValue' : 'null');
    if (this.token) return t('token', { token: this.shown });
    const bars = this.segments.filter(s => s.kind === 'bar').length;
    // Never speak a value that is not visibly masked.
    if (!bars) return t('masked');
    const last = this.segments[this.segments.length - 1];
    if (last.kind === 'text') {
      const tail = last.text.replace(/[^A-Za-z0-9]/g, '');
      if (tail) return t('endsIn', { tail });
    }
    const first = this.segments[0];
    if (first.kind === 'text' && /[A-Za-z0-9]/.test(first.text)) {
      return t('startsWith', { head: first.text.trim() });
    }
    return t('masked');
  }
}
