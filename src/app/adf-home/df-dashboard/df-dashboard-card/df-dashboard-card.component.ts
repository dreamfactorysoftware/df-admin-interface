import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

@Component({
  selector: 'df-dashboard-card',
  templateUrl: './df-dashboard-card.component.html',
  styleUrls: ['./df-dashboard-card.component.scss'],
  standalone: true,
  imports: [CommonModule, MatCardModule, FontAwesomeModule],
})
export class DfDashboardCardComponent {
  @Input() icon!: IconDefinition;
  @Input() title!: string;
  @Input() value!: number | string;
  @Input() subtitle?: string;
  @Input() trend?: number;
  @Input() trendIcon?: IconDefinition;
  @Input() trendClass?: string;
  @Input() footerText?: string;
  @Input() showPrompt?: boolean = false;
  @Input() isZero?: boolean = false;
  @Input() zeroStateText?: string = 'Click to get started!';
  @Input() color: 'primary' | 'accent' | 'success' | 'info' | 'warn' =
    'primary';
  @Input() clickable?: boolean = false;
  @Output() cardClick = new EventEmitter<void>();

  onClick(): void {
    if (this.clickable) {
      this.cardClick.emit();
    }
  }
}
