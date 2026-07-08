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

// Coordinated category tints (item 21): a card and its icon draw color from
// the --df-tint-<category>-bg/-fg token pairs in styles.scss. Every theme
// (light, dark, phosphor) resolves these tokens, so tinting stays correct by
// construction. Omit `tint` to keep the neutral accent treatment.
export type SectionLandingTint =
  | 'build'
  | 'data'
  | 'security'
  | 'system'
  | 'admin'
  | 'ai'
  | 'docs';

export type SectionLandingCard = {
  icon: string;
  title: string;
  text: string;
  route: string;
  action: string;
  meta?: string;
  disabled?: boolean;
  tint?: SectionLandingTint;
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
