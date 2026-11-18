import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe } from '@ngneat/transloco';
import {
  Evidence,
  EvidenceLine,
  MaskedColumn,
  Verdict,
} from '../data-masking.types';
import { relTime } from '../dm-time';

const clampScore = (n: number) => Math.max(0, Math.min(100, n));

/** The evidence lines a receipt shows (see DfEvidenceLedgerComponent.lines). */
export function receiptLines(
  evidence: Evidence | null | undefined
): EvidenceLine[] {
  const all = evidence?.lines ?? [];
  const scored = all.filter(l => l.points !== 0);
  if (!scored.length) return all;
  const sum = scored.reduce((s, l) => s + l.points, 0);
  return clampScore(sum) === clampScore(evidence?.total ?? 0) ? scored : all;
}

/**
 * df-evidence-ledger: why a column got its verdict, as a small receipt.
 * Each line is the points it earned; the total sits on a 0-100 bar with the
 * review and mask thresholds notched in. Value shapes are mono chips. Raw
 * values never appear here.
 */
@Component({
  selector: 'df-evidence-ledger',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIf, NgFor, NgClass, MatIconModule, TranslocoPipe],
  templateUrl: './df-evidence-ledger.component.html',
  styleUrls: ['./df-evidence-ledger.component.scss'],
})
export class DfEvidenceLedgerComponent {
  @Input({ required: true }) column!: MaskedColumn;

  get total(): number {
    return clampScore(this.column.evidence?.total ?? 0);
  }

  get thresholds() {
    return {
      review: this.column.evidence?.thresholdReview ?? 40,
      mask: this.column.evidence?.thresholdMask ?? 70,
    };
  }

  /** What detection alone concluded, before any admin decision. */
  get detected(): Verdict {
    const { review, mask } = this.thresholds;
    return this.total >= mask
      ? 'masked'
      : this.total >= review
        ? 'review'
        : 'clear';
  }

  /** The meter wears the column's tier, like its chip and strip tick. */
  get tierClass(): string {
    return `dm-tier-${this.column.tier || 'clear'}`;
  }

  /**
   * Lines that earned (or cost) points. Zero-point lines are noise in a
   * receipt while the scored lines add up to the total (the score caps at
   * 0-100). When they don't, a zero-point line is the reason, e.g. "0 of
   * 256 values are IPv4 addresses" pulling a strong name down, so every
   * line shows. All of them also show when none scored.
   */
  get lines() {
    return receiptLines(this.column.evidence);
  }

  get decidedAgo(): string {
    return relTime(this.column.decidedAt);
  }

  points(p: number): string {
    if (p > 0) return `+${p}`;
    if (p < 0) return `−${Math.abs(p)}`;
    return '0';
  }
}
