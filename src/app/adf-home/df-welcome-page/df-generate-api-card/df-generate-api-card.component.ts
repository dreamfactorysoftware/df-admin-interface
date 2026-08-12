import { Component, Input } from '@angular/core';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslocoPipe } from '@ngneat/transloco';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'df-generate-api-card',
  templateUrl: './df-generate-api-card.component.html',
  styleUrls: ['./df-generate-api-card.component.scss'],
  standalone: true,
  imports: [RouterModule, FontAwesomeModule, TranslocoPipe, MatCardModule],
})
export class DfGenerateApiCardComponent {
  @Input() icon: IconDefinition;
  @Input() headerText: string;
  @Input() text: string;
  @Input() route: string;
  // Semantic tint category (build | data | security | system | admin | ai |
  // docs). Drives the card wash + icon/heading color off the --df-tint-*
  // tokens so every theme repaints for free. No color literals here.
  @Input() category: string;
}
