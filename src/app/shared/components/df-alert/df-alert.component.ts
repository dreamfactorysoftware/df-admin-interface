import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
@Component({
  selector: 'df-alert',
  templateUrl: './df-alert.component.html',
  styleUrls: ['./df-alert.component.scss'],
  standalone: true,
  imports: [CommonModule, MatButtonModule, FontAwesomeModule],
})
export class DfAlertComponent {
  @Input() message: string;
  @Input() alertType: AlertType = 'success';
  @Input() showAlert = false;
  @Output() alertClosed = new EventEmitter<void>();

  dismissAlert(): void {
    this.alertClosed.emit();
  }

  get icon(): IconProp {
    switch (this.alertType) {
      case 'success':
        return 'check-circle';
      case 'error':
        return 'circle-exclamation';
      case 'warning':
        return 'circle-exclamation';
      case 'info':
        return 'circle-info';
      default:
        return 'circle-info';
    }
  }
}

export type AlertType = 'success' | 'error' | 'warning' | 'info';
