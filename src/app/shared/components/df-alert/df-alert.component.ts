import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'df-alert',
  templateUrl: './df-alert.component.html',
  styleUrls: ['./df-alert.component.scss'],
})
export class DfAlertComponent {
  @Input() message: string;
  @Input() alertType: AlertType = 'success';
  @Input() showAlert = false;
  @Output() alertClosed = new EventEmitter<void>();

  dismissAlert(): void {
    this.alertClosed.emit();
  }

  get icon(): string {
    switch (this.alertType) {
      case 'success':
        return 'check_circle';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'info';
    }
  }
}

export type AlertType = 'success' | 'error' | 'warning' | 'info';
