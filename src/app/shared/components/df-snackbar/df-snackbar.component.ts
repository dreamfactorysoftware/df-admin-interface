import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_SNACK_BAR_DATA,
  MatSnackBarModule,
  MatSnackBarRef,
} from '@angular/material/snack-bar';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AlertType } from '../df-alert/df-alert.component';
import { IconProp } from '@fortawesome/fontawesome-svg-core';

import {
  faCheckCircle,
  faExclamationCircle,
  faInfoCircle,
  faXmark,
  faXmarkCircle,
} from '@fortawesome/free-solid-svg-icons';
import { TranslocoPipe } from '@ngneat/transloco';

@Component({
  selector: 'df-snackbar',
  templateUrl: './df-snackbar.component.html',
  styleUrls: ['../df-alert/df-alert.component.scss'],
  standalone: true,
  imports: [
    MatButtonModule,
    MatSnackBarModule,
    FontAwesomeModule,
    TranslocoPipe,
  ],
})
export class DfSnackbarComponent {
  faXmark = faXmark;
  message: string;
  alertType: AlertType = 'success';
  constructor(
    public snackBarRef: MatSnackBarRef<DfSnackbarComponent>,
    @Inject(MAT_SNACK_BAR_DATA) public data: any
  ) {
    this.message = data.message;
    this.alertType = data.alertType;
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

  onAction(): void {
    this.snackBarRef.dismissWithAction();
  }
}
