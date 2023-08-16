import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import {
  faXmark,
  faCheckCircle,
  faXmarkCircle,
  faExclamationCircle,
  faInfoCircle,
} from '@fortawesome/free-solid-svg-icons';
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

  faXmark = faXmark;

  dismissAlert(): void {
    this.alertClosed.emit();
  }

  get icon(): IconProp {
    switch (this.alertType) {
      case 'success':
        return faCheckCircle;
      case 'error':
        return faXmarkCircle;
      case 'warning':
        return faExclamationCircle;
      case 'info':
        return faInfoCircle;
      default:
        return faInfoCircle;
    }
  }
}

export type AlertType = 'success' | 'error' | 'warning' | 'info';
