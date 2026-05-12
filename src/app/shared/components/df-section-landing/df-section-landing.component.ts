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

export type SectionLandingCard = {
  icon: string;
  title: string;
  text: string;
  route: string;
  action: string;
  meta?: string;
  disabled?: boolean;
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

  openingRoute = '';

  trackByCardRoute(_: number, card: SectionLandingCard): string {
    return card.route;
  }

  cardHref(card: SectionLandingCard): string {
    return `#${card.route}`;
  }

  markOpening(event: MouseEvent, card: SectionLandingCard): void {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) {
      return;
    }
    this.openingRoute = card.route;
  }
}
