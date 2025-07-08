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
  @Input() routerLink: string;
  @Input() cardFinalBackgroundColor: string;
  @Input() cardFinalHeaderColor: string;
}
