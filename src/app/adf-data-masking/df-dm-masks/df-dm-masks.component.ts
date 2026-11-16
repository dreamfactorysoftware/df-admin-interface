import { Component, OnInit, inject } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { TranslocoPipe } from '@ngneat/transloco';
import { DfSkeletonComponent } from 'src/app/shared/components/df-skeleton/df-skeleton.component';
import { DfEmptyStateComponent } from 'src/app/shared/components/df-empty-state/df-empty-state.component';
import { DfMaskedValueComponent } from '../df-masked-value/df-masked-value.component';
import { DataMaskingStore } from '../data-masking.store';
import { MaskFormat, TIERS, Tier } from '../data-masking.catalog';
import { MaskSetting } from '../data-masking.types';
import { sampleMask } from '../mask-format';

/**
 * Classes that often sit in numeric columns. A number is returned as null
 * under every format but token, so their row shows that case too.
 */
const NUMERIC_SAMPLES: Record<string, string> = {
  geo_precise: '37.77493',
  age: '41',
  financial_personal: '84500',
};

interface TierGroup {
  tier: Tier;
  rows: MaskSetting[];
}

/**
 * Masks tab: one format per class, grouped by tier. The example re-renders
 * the moment the format changes, so the row explains itself.
 */
@Component({
  selector: 'df-dm-masks',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    NgClass,
    MatIconModule,
    MatSelectModule,
    TranslocoPipe,
    DfSkeletonComponent,
    DfEmptyStateComponent,
    DfMaskedValueComponent,
  ],
  templateUrl: './df-dm-masks.component.html',
  styleUrls: ['./df-dm-masks.component.scss'],
})
export class DfDmMasksComponent implements OnInit {
  readonly store = inject(DataMaskingStore);

  ngOnInit(): void {
    if (!this.store.masks) this.store.loadMasks();
  }

  get groups(): TierGroup[] {
    const masks = this.store.masks ?? [];
    return TIERS.map(tier => ({
      tier,
      rows: masks.filter(m => m.tier === tier),
    })).filter(g => g.rows.length);
  }

  example(m: MaskSetting) {
    return sampleMask(m.class, m.format);
  }

  /** The numeric case for a class that is often numeric, or null. */
  numericExample(m: MaskSetting): string | null {
    if (m.format === 'token' || m.format === 'null') return null;
    return NUMERIC_SAMPLES[m.class] ?? null;
  }

  setFormat(m: MaskSetting, format: MaskFormat): void {
    this.store.setMask(m.class, format);
  }

  trackTier = (_: number, g: TierGroup) => g.tier;
  trackMask = (_: number, m: MaskSetting) => m.class;
}
