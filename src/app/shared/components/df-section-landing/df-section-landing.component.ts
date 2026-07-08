import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export type SectionLandingAction = {
  label: string;
  route: string;
  icon?: string;
  primary?: boolean;
};

// Semantic tint categories map to the --df-tint-<category>-* token pairs in
// styles.scss (punch 21). A card/stat and its icon draw color from these
// tokens; every theme (light, dark, phosphor) resolves them, so tinting stays
// correct by construction. Omit to keep the neutral accent treatment.
export type SectionLandingCategory =
  | 'build'
  | 'data'
  | 'security'
  | 'system'
  | 'admin'
  | 'ai'
  | 'docs';

// Alias kept for the build/secure landing wave, which introduced the `tint`
// field name for the same token-driven categorical color. Both spellings
// resolve to the same union and the same --df-tint-<cat> tokens.
export type SectionLandingTint = SectionLandingCategory;

export type SectionLandingCard = {
  icon: string;
  title: string;
  text: string;
  route: string;
  action: string;
  meta?: string;
  disabled?: boolean;
  // Two spellings, one behavior: `tint` (build/secure wave) and `category`
  // (system/admin/ai wave) both drive the same categorical color.
  tint?: SectionLandingTint;
  category?: SectionLandingCategory;
};

export type SectionLandingGroup = {
  title: string;
  cards: SectionLandingCard[];
};

export type SectionLandingNote = {
  icon: string;
  title: string;
  text: string;
};

export type SectionLandingStat = {
  label: string;
  value: string;
  icon?: string;
  category?: SectionLandingCategory;
};

@Component({
  selector: 'df-section-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule],
  templateUrl: './df-section-landing.component.html',
  styleUrls: ['./df-section-landing.component.scss'],
})
export class DfSectionLandingComponent {
  @Input({ required: true }) eyebrow = '';
  @Input({ required: true }) title = '';
  @Input({ required: true }) description = '';
  @Input() actions: SectionLandingAction[] = [];
  @Input() stats: SectionLandingStat[] = [];
  @Input() groups: SectionLandingGroup[] = [];
  @Input() notes: SectionLandingNote[] = [];

  trackByGroupTitle(_: number, group: SectionLandingGroup): string {
    return group.title;
  }

  trackByCardRoute(_: number, card: SectionLandingCard): string {
    return card.route;
  }
}
